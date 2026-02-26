import { Router, Request, Response } from "express";
import OpenAI from "openai";
import pool from "../db/pool";
import axios from "axios";

const router = Router();

// Route through OpenClaw gateway if configured, otherwise use OpenAI directly
const openai = process.env.OPENCLAW_URL
  ? new OpenAI({
      apiKey: process.env.OPENCLAW_TOKEN || "no-key",
      baseURL: `${process.env.OPENCLAW_URL}/v1`,
    })
  : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AI_MODEL = process.env.OPENCLAW_URL ? "openai/gpt-5.2" : "gpt-4o";

// Load Tom's system prompt (his rules + context)
const TOM_SYSTEM_PROMPT = `
You are Tom, the AI Chief of Staff for TruGuard Security, a security guard company in Southern California.

You work for the CEO. You are direct, data-driven, and protective of margin and pipeline health.

YOUR RULES:
- NEVER write to GHL without CEO approval
- NEVER move deal stages automatically
- NEVER send outreach automatically
- ALWAYS present options, CEO decides
- ALWAYS end responses with "AWAITING YOUR DIRECTION" if action is needed

TRUGUARD CONTEXT:
- Service: Security guard services (patrol, static guard)
- Primary market: Apartments 100+ units, SoCal
- WBR doctrine: Target 65%, Floor 69%, Temp 50%
- Stuck threshold: 7 days in same pipeline stage
- Resurrection: Proposal stage + no activity > 14 days
- GHL writes allowed: Note, Task, Tag only

RESPONSE FORMAT:
Always respond in clean structured text. Use this format:

AGENT: [Agent Name]
DATE: [Today]

SUMMARY:
[Brief situation summary]

ITEMS:
[Numbered list of issues found]

RECOMMENDED ACTIONS:
[Arrow-prefixed actions requiring approval]

GUARDRAILS: [Any rules enforced]
`;

// Helper: fetch live data from our own API
async function fetchLiveData(endpoint: string) {
  try {
    const { data } = await axios.get(`http://localhost:${process.env.PORT || 4000}/api${endpoint}`);
    return data;
  } catch {
    return null;
  }
}

// Helper: log Tom's action to audit
async function logTomAction(action: string, input: any, output: string) {
  await pool.query(
    `INSERT INTO audit_log (action, target_type, payload, approved_by, status, ghl_response)
     VALUES ($1, 'tom', $2, 'tom', 'completed', $3)`,
    [action, JSON.stringify(input), JSON.stringify({ response: output.slice(0, 500) })]
  );
}

// POST /api/tom/daily-brief — Morning briefing
router.post("/daily-brief", async (_req: Request, res: Response) => {
  try {
    const [inbox, syncStatus] = await Promise.all([
      fetchLiveData("/inbox"),
      fetchLiveData("/settings/sync-status"),
    ]);

    const context = `
LIVE DATA FROM TRUGUARD SYSTEM:

INBOX SUMMARY:
- Total items: ${inbox?.total || 0}
- Stuck deals: ${inbox?.stuckCount || 0}
- Overdue callbacks: ${inbox?.callbackCount || 0}
- Stuck threshold: ${inbox?.thresholdDays || 7} days

PRIORITY ITEMS:
${inbox?.items?.slice(0, 10).map((item: any, i: number) =>
  `${i + 1}. ${item.title} | Priority: ${item.priority} | Type: ${item.type}`
).join('\n') || 'No items'}

SYNC STATUS:
${syncStatus?.map((s: any) => `- ${s.entity}: ${s.records_synced} records | Last sync: ${s.last_synced_at ? new Date(s.last_synced_at).toLocaleString() : 'Never'}`).join('\n') || 'Unknown'}

Generate the daily morning brief using this data. Run as Daily Ops Director.
`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: TOM_SYSTEM_PROMPT },
        { role: "user", content: context }
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const response = completion.choices[0].message.content || "";
    await logTomAction("daily_brief", { triggered: "manual" }, response);

    res.json({ success: true, agent: "Daily Ops Director", response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tom/follow-up — Follow-Up Governor
router.post("/follow-up", async (_req: Request, res: Response) => {
  try {
    const [stuck, callbacks] = await Promise.all([
      fetchLiveData("/queues/stuck"),
      fetchLiveData("/queues/callbacks"),
    ]);

    const context = `
LIVE PIPELINE DATA:

STUCK DEALS (${stuck?.total || 0} total):
${stuck?.items?.map((item: any, i: number) =>
  `${i + 1}. ${item.first_name} ${item.last_name} | Stage: ${item.stage_name} | Days stuck: ${item.days_stuck} | Value: $${item.monetary_value} | Pipeline: ${item.pipeline_name}`
).join('\n') || 'None'}

OVERDUE CALLBACKS (${callbacks?.total || 0} total):
${callbacks?.items?.map((item: any, i: number) =>
  `${i + 1}. ${item.first_name} ${item.last_name} | Task: ${item.title} | Days overdue: ${item.days_overdue}`
).join('\n') || 'None'}

Run the Follow-Up Governor. Identify stuck deals, resurrection targets, and overdue callbacks. Suggest specific actions for each. Remember: no action without CEO approval.
`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: TOM_SYSTEM_PROMPT },
        { role: "user", content: context }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content || "";
    await logTomAction("follow_up_governor", { stuck: stuck?.total, callbacks: callbacks?.total }, response);

    res.json({ success: true, agent: "Follow-Up Governor", response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tom/wbr — WBR Margin Engine
router.post("/wbr", async (req: Request, res: Response) => {
  try {
    const { wage, billRate, weeklyHours, contractType, overtime } = req.body;

    if (!wage || !billRate) {
      return res.status(400).json({ error: "wage and billRate are required" });
    }

    const context = `
CEO INPUT FOR MARGIN CALCULATION:
- Guard hourly wage: $${wage}/hr
- Proposed bill rate: $${billRate}/hr
- Weekly hours: ${weeklyHours || 40}
- Contract type: ${contractType || "permanent"}
- Overtime expected: ${overtime ? "Yes" : "No"}

Run the WBR Engine. Calculate all margin metrics, flag the status, and give the minimum safe bill rate if below floor.
`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: TOM_SYSTEM_PROMPT },
        { role: "user", content: context }
      ],
      temperature: 0.1,
      max_tokens: 600,
    });

    const response = completion.choices[0].message.content || "";

    // Also compute raw numbers server-side
    const wbr = (wage / billRate) * 100;
    const margin = 100 - wbr;
    const floor = contractType === "temporary" ? 50 : 69;
    const target = contractType === "temporary" ? 50 : 65;
    const status = wbr <= target ? "GREEN" : wbr <= floor ? "YELLOW" : "RED";
    const minBillRate = (wage / (target / 100)).toFixed(2);
    const weeklyRevenue = (billRate * (weeklyHours || 40)).toFixed(2);
    const weeklyLabor = (wage * (weeklyHours || 40)).toFixed(2);
    const weeklyGrossProfit = (parseFloat(weeklyRevenue) - parseFloat(weeklyLabor)).toFixed(2);

    await logTomAction("wbr_calculation", req.body, response);

    res.json({
      success: true,
      agent: "WBR Engine",
      response,
      metrics: {
        wbr: wbr.toFixed(1),
        margin: margin.toFixed(1),
        status,
        minBillRate,
        weeklyRevenue,
        weeklyLabor,
        weeklyGrossProfit,
        monthlyRevenue: (parseFloat(weeklyRevenue) * 4.33).toFixed(2),
        monthlyGrossProfit: (parseFloat(weeklyGrossProfit) * 4.33).toFixed(2),
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tom/chat — General chat with Tom
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: TOM_SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      temperature: 0.4,
      max_tokens: 600,
    });

    const response = completion.choices[0].message.content || "";
    await logTomAction("chat", { message }, response);

    res.json({ success: true, agent: "Tom", response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
