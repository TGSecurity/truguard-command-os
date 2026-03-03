import { Router, Request, Response } from "express";
import pool from "../db/pool";
import { ghlService } from "../services/ghl";

const router = Router();

// POST /api/actions/approve-note — Gated: push a note to GHL
router.post("/approve-note", async (req: Request, res: Response) => {
  try {
    const { contactId, body } = req.body;

    if (!contactId || !body) {
      return res.status(400).json({ error: "contactId and body are required" });
    }

    // Check kill switch
    const { rows: settings } = await pool.query(
      "SELECT value FROM app_settings WHERE key = 'kill_switch'"
    );
    if (settings[0]?.value === "on") {
      return res.status(403).json({ error: "Kill switch is ON. All writes are disabled." });
    }

    const result = await ghlService.pushNote(contactId, body);

    if (result.success) {
      res.json({ success: true, message: "Note pushed to GHL", data: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/actions/approve-task-create — Gated: create a task in GHL
router.post("/approve-task-create", async (req: Request, res: Response) => {
  try {
    const { contactId, title, description, dueDate } = req.body;

    if (!contactId || !title) {
      return res.status(400).json({ error: "contactId and title are required" });
    }

    const { rows: settings } = await pool.query(
      "SELECT value FROM app_settings WHERE key = 'kill_switch'"
    );
    if (settings[0]?.value === "on") {
      return res.status(403).json({ error: "Kill switch is ON. All writes are disabled." });
    }

    const result = await ghlService.createTask(contactId, title, description || "", dueDate);

    if (result.success) {
      res.json({ success: true, message: "Task created in GHL", data: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/actions/approve-tag-add — Gated: add a tag to a contact in GHL
router.post("/approve-tag-add", async (req: Request, res: Response) => {
  try {
    const { contactId, tagName } = req.body;

    if (!contactId || !tagName) {
      return res.status(400).json({ error: "contactId and tagName are required" });
    }

    const { rows: settings } = await pool.query(
      "SELECT value FROM app_settings WHERE key = 'kill_switch'"
    );
    if (settings[0]?.value === "on") {
      return res.status(403).json({ error: "Kill switch is ON. All writes are disabled." });
    }

    const result = await ghlService.addTag(contactId, tagName);

    if (result.success) {
      res.json({ success: true, message: "Tag added to GHL", data: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
