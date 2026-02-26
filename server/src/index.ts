import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

import inboxRoutes from "./routes/inbox";
import boardRoutes from "./routes/board";
import queuesRoutes from "./routes/queues";
import actionsRoutes from "./routes/actions";
import contactsRoutes from "./routes/contacts";
import settingsRoutes from "./routes/settings";
import auditRoutes from "./routes/audit";
import syncRoutes from "./routes/sync";
import tomRoutes from "./routes/tom";
import { startSyncScheduler } from "./services/sync";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/inbox", inboxRoutes);
app.use("/api/board", boardRoutes);
app.use("/api/queues", queuesRoutes);
app.use("/api/actions", actionsRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/tom", tomRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`TruGuard Command Server running on port ${PORT}`);
  startSyncScheduler();
});
