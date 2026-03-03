import axios, { AxiosInstance } from "axios";
import pool from "../db/pool";

const GHL_BASE = "https://services.leadconnectorhq.com";

class GHLService {
  private client: AxiosInstance;
  private locationId: string;

  constructor() {
    this.locationId = process.env.GHL_LOCATION_ID || "";
    this.client = axios.create({
      baseURL: GHL_BASE,
      headers: {
        Authorization: `Bearer ${process.env.GHL_TOKEN}`,
        Version: "2021-07-28",
      },
    });
  }

  // ─── READ: Contacts ───
  async syncContacts(): Promise<number> {
    let synced = 0;
    let startAfter: string | undefined;
    const limit = 100;

    await this.updateSyncStatus("contacts", "running");
    try {
      do {
        const params: any = { locationId: this.locationId, limit };
        if (startAfter) params.startAfter = startAfter;

        const { data } = await this.client.get("/contacts/", { params });
        const contacts = data.contacts || [];

        for (const c of contacts) {
          await pool.query(
            `INSERT INTO contacts (id, first_name, last_name, email, phone, company_name, tags, date_added, last_activity, raw, synced_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
             ON CONFLICT (id) DO UPDATE SET
               first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name,
               email=EXCLUDED.email, phone=EXCLUDED.phone,
               company_name=EXCLUDED.company_name, tags=EXCLUDED.tags,
               date_added=EXCLUDED.date_added, last_activity=EXCLUDED.last_activity,
               raw=EXCLUDED.raw, synced_at=NOW(), updated_at=NOW()`,
            [
              c.id,
              c.firstName || null,
              c.lastName || null,
              c.email || null,
              c.phone || null,
              c.companyName || null,
              c.tags || [],
              c.dateAdded || null,
              c.lastActivity || null,
              JSON.stringify(c),
            ]
          );
          synced++;
        }

        startAfter =
          contacts.length === limit
            ? contacts[contacts.length - 1].id
            : undefined;
      } while (startAfter);

      await this.updateSyncStatus("contacts", "idle", synced);
      return synced;
    } catch (err: any) {
      await this.updateSyncStatus("contacts", "error", synced, err.message);
      throw err;
    }
  }

  // ─── READ: Opportunities ───
  async syncOpportunities(): Promise<number> {
    let synced = 0;
    await this.updateSyncStatus("opportunities", "running");
    try {
      // First get pipelines
      const { data: pipelineData } = await this.client.get(
        `/opportunities/pipelines`,
        { params: { locationId: this.locationId } }
      );
      const pipelines = pipelineData.pipelines || [];

      for (const pipeline of pipelines) {
        const stageMap = new Map<string, string>();
        for (const stage of pipeline.stages || []) {
          stageMap.set(stage.id, stage.name);
        }

        let page = 1;
        let hasMore = true;
        while (hasMore) {
          const { data } = await this.client.get(`/opportunities/search`, {
            params: {
              location_id: this.locationId,
              pipeline_id: pipeline.id,
              page,
              limit: 100,
            },
          });
          const opps = data.opportunities || [];

          for (const o of opps) {
            await pool.query(
              `INSERT INTO opportunities (id, contact_id, name, pipeline_id, pipeline_name, stage_id, stage_name, status, monetary_value, stage_entered_at, last_activity, raw, synced_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
               ON CONFLICT (id) DO UPDATE SET
                 contact_id=EXCLUDED.contact_id, name=EXCLUDED.name,
                 pipeline_id=EXCLUDED.pipeline_id, pipeline_name=EXCLUDED.pipeline_name,
                 stage_id=EXCLUDED.stage_id, stage_name=EXCLUDED.stage_name,
                 status=EXCLUDED.status, monetary_value=EXCLUDED.monetary_value,
                 stage_entered_at=EXCLUDED.stage_entered_at, last_activity=EXCLUDED.last_activity,
                 raw=EXCLUDED.raw, synced_at=NOW(), updated_at=NOW()`,
              [
                o.id,
                o.contact?.id || o.contactId || null,
                o.name || null,
                pipeline.id,
                pipeline.name,
                o.pipelineStageId || null,
                stageMap.get(o.pipelineStageId) || o.stageName || null,
                o.status || "open",
                o.monetaryValue || 0,
                o.lastStageChangeAt || o.createdAt || null,
                o.lastActivity || null,
                JSON.stringify(o),
              ]
            );
            synced++;
          }

          hasMore = opps.length === 100;
          page++;
        }
      }

      await this.updateSyncStatus("opportunities", "idle", synced);
      return synced;
    } catch (err: any) {
      await this.updateSyncStatus(
        "opportunities",
        "error",
        synced,
        err.message
      );
      throw err;
    }
  }

  // ─── READ: Tasks ───
  async syncTasks(): Promise<number> {
    let synced = 0;
    await this.updateSyncStatus("tasks", "running");
    try {
      // GHL tasks are per-contact — no locationId param needed
      const { rows: contacts } = await pool.query("SELECT id FROM contacts");

      for (const contact of contacts) {
        try {
          const { data } = await this.client.get(
            `/contacts/${contact.id}/tasks`
            // Note: no locationId param — GHL rejects it for this endpoint
          );
          const tasks = data.tasks || [];

          for (const t of tasks) {
            await pool.query(
              `INSERT INTO tasks (id, contact_id, title, description, due_date, status, assignee, raw, synced_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
               ON CONFLICT (id) DO UPDATE SET
                 title=EXCLUDED.title, description=EXCLUDED.description,
                 due_date=EXCLUDED.due_date, status=EXCLUDED.status,
                 assignee=EXCLUDED.assignee, raw=EXCLUDED.raw,
                 synced_at=NOW(), updated_at=NOW()`,
              [
                t.id,
                contact.id,
                t.title || null,
                t.body || t.description || null,
                t.dueDate || null,
                t.completed ? "completed" : "open",
                t.assignedTo || null,
                JSON.stringify(t),
              ]
            );
            synced++;
          }
        } catch {
          // Skip contacts with no task access
        }
      }

      await this.updateSyncStatus("tasks", "idle", synced);
      return synced;
    } catch (err: any) {
      await this.updateSyncStatus("tasks", "error", synced, err.message);
      throw err;
    }
  }

  // ─── READ: Notes ───
  async syncNotes(): Promise<number> {
    let synced = 0;
    await this.updateSyncStatus("notes", "running");
    try {
      const { rows: contacts } = await pool.query("SELECT id FROM contacts");

      for (const contact of contacts) {
        try {
          const { data } = await this.client.get(
            `/contacts/${contact.id}/notes`
            // Note: no locationId param — GHL rejects it for this endpoint
          );
          const notes = data.notes || [];

          for (const n of notes) {
            await pool.query(
              `INSERT INTO notes (id, contact_id, body, raw, synced_at)
               VALUES ($1,$2,$3,$4,NOW())
               ON CONFLICT (id) DO UPDATE SET
                 body=EXCLUDED.body, raw=EXCLUDED.raw, synced_at=NOW()`,
              [n.id, contact.id, n.body || null, JSON.stringify(n)]
            );
            synced++;
          }
        } catch {
          // Skip contacts with no notes access
        }
      }

      await this.updateSyncStatus("notes", "idle", synced);
      return synced;
    } catch (err: any) {
      await this.updateSyncStatus("notes", "error", synced, err.message);
      throw err;
    }
  }

  // ─── WRITE: Push Note to GHL (Gated) ───
  async pushNote(
    contactId: string,
    body: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    // Check kill switch
    const { rows } = await pool.query(
      "SELECT value FROM app_settings WHERE key = 'kill_switch'"
    );
    if (rows[0]?.value === "on") {
      return { success: false, error: "Kill switch is ON. All writes blocked." };
    }

    try {
      const { data } = await this.client.post(
        `/contacts/${contactId}/notes`,
        { body, userId: this.locationId },
        { params: { locationId: this.locationId } }
      );

      // Log to audit
      await pool.query(
        `INSERT INTO audit_log (action, target_type, target_id, payload, approved_by, status, ghl_response)
         VALUES ('note_push', 'contact', $1, $2, 'ceo', 'approved', $3)`,
        [contactId, JSON.stringify({ body }), JSON.stringify(data)]
      );

      return { success: true, data };
    } catch (err: any) {
      await pool.query(
        `INSERT INTO audit_log (action, target_type, target_id, payload, approved_by, status, ghl_response)
         VALUES ('note_push', 'contact', $1, $2, 'ceo', 'error', $3)`,
        [
          contactId,
          JSON.stringify({ body }),
          JSON.stringify({ error: err.message }),
        ]
      );
      return { success: false, error: err.message };
    }
  }

  // ─── WRITE: Create Task in GHL (Gated) ───
  async createTask(
    contactId: string,
    title: string,
    description: string,
    dueDate?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const { rows } = await pool.query(
      "SELECT value FROM app_settings WHERE key = 'kill_switch'"
    );
    if (rows[0]?.value === "on") {
      return { success: false, error: "Kill switch is ON. All writes blocked." };
    }

    try {
      // GHL requires dueDate as full ISO timestamp
      const dueDateISO = dueDate
        ? new Date(dueDate).toISOString()
        : new Date(Date.now() + 86400000).toISOString(); // default: tomorrow

      const payload: any = {
        title,
        body: description,
        dueDate: dueDateISO,
        completed: false,
      };

      const { data } = await this.client.post(
        `/contacts/${contactId}/tasks`,
        payload
        // Note: no locationId param — GHL rejects it for this endpoint
      );

      await pool.query(
        `INSERT INTO audit_log (action, target_type, target_id, payload, approved_by, status, ghl_response)
         VALUES ('task_create', 'contact', $1, $2, 'ceo', 'approved', $3)`,
        [contactId, JSON.stringify({ title, description, dueDate }), JSON.stringify(data)]
      );

      return { success: true, data };
    } catch (err: any) {
      await pool.query(
        `INSERT INTO audit_log (action, target_type, target_id, payload, approved_by, status, ghl_response)
         VALUES ('task_create', 'contact', $1, $2, 'ceo', 'error', $3)`,
        [contactId, JSON.stringify({ title, description, dueDate }), JSON.stringify({ error: err.message })]
      );
      return { success: false, error: err.message };
    }
  }

  // ─── WRITE: Add Tag in GHL (Gated) ───
  async addTag(
    contactId: string,
    tagName: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const { rows } = await pool.query(
      "SELECT value FROM app_settings WHERE key = 'kill_switch'"
    );
    if (rows[0]?.value === "on") {
      return { success: false, error: "Kill switch is ON. All writes blocked." };
    }

    try {
      const { data } = await this.client.post(
        `/contacts/${contactId}/tags`,
        { tags: [tagName] },
        { params: { locationId: this.locationId } }
      );

      await pool.query(
        `INSERT INTO audit_log (action, target_type, target_id, payload, approved_by, status, ghl_response)
         VALUES ('tag_add', 'contact', $1, $2, 'ceo', 'approved', $3)`,
        [contactId, JSON.stringify({ tagName }), JSON.stringify(data)]
      );

      return { success: true, data };
    } catch (err: any) {
      await pool.query(
        `INSERT INTO audit_log (action, target_type, target_id, payload, approved_by, status, ghl_response)
         VALUES ('tag_add', 'contact', $1, $2, 'ceo', 'error', $3)`,
        [contactId, JSON.stringify({ tagName }), JSON.stringify({ error: err.message })]
      );
      return { success: false, error: err.message };
    }
  }

  // ─── Full sync ───
  async syncAll(): Promise<Record<string, number>> {
    console.log("[GHL Sync] Starting full sync...");
    const contacts = await this.syncContacts();
    console.log(`[GHL Sync] Contacts: ${contacts}`);

    const opportunities = await this.syncOpportunities();
    console.log(`[GHL Sync] Opportunities: ${opportunities}`);

    const tasks = await this.syncTasks();
    console.log(`[GHL Sync] Tasks: ${tasks}`);

    const notes = await this.syncNotes();
    console.log(`[GHL Sync] Notes: ${notes}`);

    console.log("[GHL Sync] Full sync complete.");
    return { contacts, opportunities, tasks, notes };
  }

  private async updateSyncStatus(
    entity: string,
    status: string,
    count?: number,
    error?: string
  ) {
    await pool.query(
      `UPDATE sync_status SET status=$1, records_synced=COALESCE($2, records_synced),
       last_synced_at=CASE WHEN $1='idle' THEN NOW() ELSE last_synced_at END,
       error_message=$3 WHERE entity=$4`,
      [status, count ?? null, error ?? null, entity]
    );
  }
}

export const ghlService = new GHLService();
