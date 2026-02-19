import cron from "node-cron";
import pool from "../db/pool";
import { ghlService } from "./ghl";

let syncJob: cron.ScheduledTask | null = null;

export function startSyncScheduler() {
  // Run initial sync after 5 seconds
  setTimeout(async () => {
    console.log("[Sync] Running initial sync...");
    try {
      await ghlService.syncAll();
    } catch (err) {
      console.error("[Sync] Initial sync failed:", err);
    }
  }, 5000);

  // Schedule recurring sync (default every 10 minutes)
  syncJob = cron.schedule("*/10 * * * *", async () => {
    // Check kill switch
    const { rows } = await pool.query(
      "SELECT value FROM app_settings WHERE key = 'kill_switch'"
    );
    if (rows[0]?.value === "on") {
      console.log("[Sync] Kill switch is ON. Skipping sync.");
      return;
    }

    console.log("[Sync] Scheduled sync starting...");
    try {
      await ghlService.syncAll();
    } catch (err) {
      console.error("[Sync] Scheduled sync failed:", err);
    }
  });

  console.log("[Sync] Scheduler started (every 10 minutes).");
}

export function stopSyncScheduler() {
  if (syncJob) {
    syncJob.stop();
    syncJob = null;
    console.log("[Sync] Scheduler stopped.");
  }
}
