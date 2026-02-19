import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

// GET /api/settings — Get all app settings
router.get("/", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query("SELECT * FROM app_settings");
    const settings: Record<string, string> = {};
    for (const row of rows) settings[row.key] = row.value;
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/:key — Update a setting
router.put("/:key", async (req: Request, res: Response) => {
  try {
    const key = req.params.key as string;
    const { value } = req.body;

    const allowed = ["stuck_threshold_days", "sync_interval_minutes", "kill_switch"];
    if (!allowed.includes(key)) {
      return res.status(400).json({ error: `Invalid setting: ${key}` });
    }

    await pool.query(
      `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, value]
    );

    // Log kill switch changes
    if (key === "kill_switch") {
      await pool.query(
        `INSERT INTO audit_log (action, target_type, payload, approved_by, status)
         VALUES ('kill_switch_toggle', 'system', $1, 'ceo', 'approved')`,
        [JSON.stringify({ key, value })]
      );
    }

    res.json({ success: true, key, value });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settings/sync-status — Get sync status for all entities
router.get("/sync-status", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM sync_status ORDER BY entity"
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
