import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

// GET /api/inbox — Executive Inbox: combined priority queue
router.get("/", async (_req: Request, res: Response) => {
  try {
    const thresholdRes = await pool.query(
      "SELECT value FROM app_settings WHERE key = 'stuck_threshold_days'"
    );
    const thresholdDays = parseInt(thresholdRes.rows[0]?.value || "7", 10);

    // Stuck Stage items
    const { rows: stuck } = await pool.query(
      `SELECT o.id, o.name, o.stage_name, o.status, o.monetary_value,
              o.stage_entered_at, o.pipeline_name,
              c.first_name, c.last_name, c.email, c.phone, c.id as contact_id,
              'stuck_stage' as queue_type,
              EXTRACT(DAY FROM NOW() - o.stage_entered_at)::int as days_stuck
       FROM opportunities o
       LEFT JOIN contacts c ON o.contact_id = c.id
       WHERE o.status = 'open'
         AND o.stage_entered_at IS NOT NULL
         AND o.stage_entered_at < NOW() - INTERVAL '1 day' * $1
       ORDER BY o.stage_entered_at ASC`,
      [thresholdDays]
    );

    // Callback Due items
    const { rows: callbacks } = await pool.query(
      `SELECT t.id, t.title, t.due_date, t.status as task_status,
              c.first_name, c.last_name, c.email, c.phone, c.id as contact_id,
              'callback_due' as queue_type,
              EXTRACT(DAY FROM NOW() - t.due_date)::int as days_overdue
       FROM tasks t
       LEFT JOIN contacts c ON t.contact_id = c.id
       WHERE t.status = 'open'
         AND t.due_date <= NOW()
       ORDER BY t.due_date ASC`
    );

    // Combine and sort by urgency
    const items = [
      ...stuck.map((s) => ({
        id: s.id,
        type: "stuck_stage" as const,
        priority: s.days_stuck > 14 ? "high" : s.days_stuck > 7 ? "medium" : "low",
        title: `${s.first_name || ""} ${s.last_name || ""} — stuck in "${s.stage_name}" for ${s.days_stuck} days`,
        subtitle: `${s.pipeline_name} | $${s.monetary_value}`,
        contact: { id: s.contact_id, name: `${s.first_name || ""} ${s.last_name || ""}`, email: s.email, phone: s.phone },
        metadata: { stageName: s.stage_name, daysStuck: s.days_stuck, monetaryValue: s.monetary_value, pipelineName: s.pipeline_name },
        timestamp: s.stage_entered_at,
      })),
      ...callbacks.map((cb) => ({
        id: cb.id,
        type: "callback_due" as const,
        priority: cb.days_overdue > 3 ? "high" : cb.days_overdue > 1 ? "medium" : "low",
        title: `Callback overdue: ${cb.first_name || ""} ${cb.last_name || ""} — "${cb.title}"`,
        subtitle: `${cb.days_overdue} day(s) overdue`,
        contact: { id: cb.contact_id, name: `${cb.first_name || ""} ${cb.last_name || ""}`, email: cb.email, phone: cb.phone },
        metadata: { taskTitle: cb.title, dueDate: cb.due_date, daysOverdue: cb.days_overdue },
        timestamp: cb.due_date,
      })),
    ];

    // Sort: high priority first
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    items.sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));

    res.json({
      total: items.length,
      stuckCount: stuck.length,
      callbackCount: callbacks.length,
      thresholdDays,
      items,
    });
  } catch (err: any) {
    console.error("Inbox error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
