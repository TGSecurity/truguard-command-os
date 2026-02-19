-- Contacts synced from GHL
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,                    -- GHL contact ID
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  date_added TIMESTAMPTZ,
  last_activity TIMESTAMPTZ,
  raw JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunities (pipeline deals) synced from GHL
CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,                    -- GHL opportunity ID
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  name TEXT,
  pipeline_id TEXT,
  pipeline_name TEXT,
  stage_id TEXT,
  stage_name TEXT,
  status TEXT DEFAULT 'open',             -- open, won, lost, abandoned
  monetary_value NUMERIC(12,2) DEFAULT 0,
  stage_entered_at TIMESTAMPTZ,           -- when the lead entered current stage
  last_activity TIMESTAMPTZ,
  raw JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opp_stage ON opportunities(stage_name);
CREATE INDEX idx_opp_status ON opportunities(status);
CREATE INDEX idx_opp_stage_entered ON opportunities(stage_entered_at);
CREATE INDEX idx_opp_contact ON opportunities(contact_id);

-- Tasks synced from GHL
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,                    -- GHL task ID
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'open',             -- open, completed
  assignee TEXT,
  raw JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_due ON tasks(due_date);
CREATE INDEX idx_task_status ON tasks(status);
CREATE INDEX idx_task_contact ON tasks(contact_id);

-- Notes synced from GHL
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,                    -- GHL note ID
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  body TEXT,
  raw JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_note_contact ON notes(contact_id);

-- Audit log (immutable, append-only)
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,                   -- e.g. 'note_push', 'task_create', 'tag_add'
  target_type TEXT,                       -- 'contact', 'opportunity'
  target_id TEXT,
  payload JSONB DEFAULT '{}',
  approved_by TEXT DEFAULT 'ceo',
  status TEXT DEFAULT 'approved',         -- approved, rejected, pending
  ghl_response JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- App settings (configurable thresholds)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
  ('stuck_threshold_days', '7'),
  ('sync_interval_minutes', '10'),
  ('kill_switch', 'off')
ON CONFLICT (key) DO NOTHING;

-- Sync metadata tracking
CREATE TABLE IF NOT EXISTS sync_status (
  id SERIAL PRIMARY KEY,
  entity TEXT NOT NULL,                   -- 'contacts', 'opportunities', 'tasks', 'notes'
  last_synced_at TIMESTAMPTZ,
  records_synced INT DEFAULT 0,
  status TEXT DEFAULT 'idle',             -- idle, running, error
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sync_status (entity) VALUES
  ('contacts'), ('opportunities'), ('tasks'), ('notes')
ON CONFLICT DO NOTHING;
