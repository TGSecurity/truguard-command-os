import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

// GET /api/audit — Get audit log
router.get("/", async (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || "50", 10);
    const offset = parseInt((req.query.offset as string) || "0", 10);

    const { rows } = await pool.query(
      `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*)::int as total FROM audit_log"
    );

    res.json({ total: countRows[0].total, items: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
