import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

// GET /api/queues/stuck — Stuck Stage queue
router.get("/stuck", async (req: Request, res: Response) => {
  try {
    const thresholdRes = await pool.query(
      "SELECT value FROM app_settings WHERE key = 'stuck_threshold_days'"
    );
    const thresholdDays = parseInt(
      (req.query.days as string) || thresholdRes.rows[0]?.value || "7",
      10
    );

    const { rows } = await pool.query(
      `SELECT o.id, o.name, o.stage_name, o.pipeline_name, o.status,
              o.monetary_value, o.stage_entered_at,
              c.id as contact_id, c.first_name, c.last_name, c.email, c.phone,
              EXTRACT(DAY FROM NOW() - o.stage_entered_at)::int as days_stuck
       FROM opportunities o
       LEFT JOIN contacts c ON o.contact_id = c.id
       WHERE o.status = 'open'
         AND o.stage_entered_at IS NOT NULL
         AND o.stage_entered_at < NOW() - INTERVAL '1 day' * $1
       ORDER BY o.stage_entered_at ASC`,
      [thresholdDays]
    );

    res.json({ thresholdDays, total: rows.length, items: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/queues/callbacks — Callback Due queue
router.get("/callbacks", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.title, t.description, t.due_date, t.status,
              c.id as contact_id, c.first_name, c.last_name, c.email, c.phone,
              EXTRACT(DAY FROM NOW() - t.due_date)::int as days_overdue
       FROM tasks t
       LEFT JOIN contacts c ON t.contact_id = c.id
       WHERE t.status = 'open'
         AND t.due_date <= NOW()
       ORDER BY t.due_date ASC`
    );

    res.json({ total: rows.length, items: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
