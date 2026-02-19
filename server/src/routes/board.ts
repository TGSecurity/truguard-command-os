import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

// GET /api/board — Kanban board: opportunities grouped by stage
router.get("/", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.name, o.stage_id, o.stage_name, o.pipeline_id, o.pipeline_name,
              o.status, o.monetary_value, o.stage_entered_at, o.last_activity,
              c.id as contact_id, c.first_name, c.last_name, c.email, c.phone
       FROM opportunities o
       LEFT JOIN contacts c ON o.contact_id = c.id
       WHERE o.status = 'open'
       ORDER BY o.pipeline_name, o.stage_name, o.stage_entered_at ASC`
    );

    // Group by pipeline > stage
    const pipelines: Record<string, {
      id: string;
      name: string;
      stages: Record<string, {
        id: string;
        name: string;
        cards: any[];
        totalValue: number;
      }>;
    }> = {};

    for (const row of rows) {
      const pKey = row.pipeline_id || "unknown";
      if (!pipelines[pKey]) {
        pipelines[pKey] = { id: pKey, name: row.pipeline_name || "Unknown", stages: {} };
      }
      const sKey = row.stage_id || "unknown";
      if (!pipelines[pKey].stages[sKey]) {
        pipelines[pKey].stages[sKey] = { id: sKey, name: row.stage_name || "Unknown", cards: [], totalValue: 0 };
      }

      const daysInStage = row.stage_entered_at
        ? Math.floor((Date.now() - new Date(row.stage_entered_at).getTime()) / 86400000)
        : null;

      pipelines[pKey].stages[sKey].cards.push({
        id: row.id,
        name: row.name,
        contact: {
          id: row.contact_id,
          name: `${row.first_name || ""} ${row.last_name || ""}`.trim(),
          email: row.email,
          phone: row.phone,
        },
        monetaryValue: parseFloat(row.monetary_value) || 0,
        daysInStage,
        stageEnteredAt: row.stage_entered_at,
        lastActivity: row.last_activity,
      });
      pipelines[pKey].stages[sKey].totalValue += parseFloat(row.monetary_value) || 0;
    }

    // Convert to array format
    const board = Object.values(pipelines).map((p) => ({
      ...p,
      stages: Object.values(p.stages),
    }));

    res.json({ pipelines: board });
  } catch (err: any) {
    console.error("Board error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
