import { Router, Request, Response } from "express";
import { ghlService } from "../services/ghl";

const router = Router();

// POST /api/sync/trigger — Manually trigger a full sync
router.post("/trigger", async (_req: Request, res: Response) => {
  try {
    const result = await ghlService.syncAll();
    res.json({ success: true, synced: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
