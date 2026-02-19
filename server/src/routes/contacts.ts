import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

// GET /api/contacts/:id — Contact detail with notes & tasks
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { rows: contactRows } = await pool.query(
      "SELECT * FROM contacts WHERE id = $1",
      [id]
    );
    if (contactRows.length === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }

    const contact = contactRows[0];

    const [notesRes, tasksRes, oppsRes] = await Promise.all([
      pool.query(
        "SELECT * FROM notes WHERE contact_id = $1 ORDER BY created_at DESC",
        [id]
      ),
      pool.query(
        "SELECT * FROM tasks WHERE contact_id = $1 ORDER BY due_date ASC",
        [id]
      ),
      pool.query(
        "SELECT * FROM opportunities WHERE contact_id = $1 ORDER BY created_at DESC",
        [id]
      ),
    ]);

    res.json({
      contact,
      notes: notesRes.rows,
      tasks: tasksRes.rows,
      opportunities: oppsRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contacts — List all contacts
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "50", 10);
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(
      `SELECT id, first_name, last_name, email, phone, company_name, tags, last_activity
       FROM contacts ORDER BY last_activity DESC NULLS LAST LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*)::int as total FROM contacts"
    );

    res.json({ total: countRows[0].total, page, limit, contacts: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
