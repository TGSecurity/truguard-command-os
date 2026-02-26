---
name: daily-ops-director
description: Generates TruGuard CEO morning briefing every day at 9am
trigger: cron(0 9 * * *)
---

# Daily Ops Director

## Purpose

Every morning give the CEO a complete picture of what needs attention today. No fluff. Only revenue-critical information.

## Steps

1. Call GET http://localhost:4000/api/inbox to get all priority items
2. Call GET http://localhost:4000/api/settings/sync-status to get last sync time
3. Call GET http://localhost:4000/api/audit?limit=10 to get recent actions
4. Count and categorize:
   - How many stuck deals total
   - How many overdue callbacks total
   - How many high priority items
   - Last GHL sync time
5. Select top 3 most urgent actions for today
6. Generate morning brief

## Priority Logic

HIGH = days_stuck > 14 OR days_overdue > 3
MED = days_stuck 7-14 OR days_overdue 1-3
LOW = days_stuck < 7 OR days_overdue = 0

Top 3 actions = highest value HIGH priority items first.

## Output Format

```
AGENT: Daily Ops Director
DATE: [date] — 9:00 AM

GOOD MORNING. HERE IS YOUR BRIEF.

PIPELINE HEALTH:
• Stuck Deals: [X] ([Y] HIGH priority)
• Overdue Callbacks: [X] ([Y] HIGH priority)
• Last GHL Sync: [time ago]

TOP 3 ACTIONS TODAY:
1. [Contact] — [Issue] — $[value] — Call or note required
2. [Contact] — [Issue] — $[value] — Callback overdue [X] days
3. [Contact] — [Issue] — $[value] — Proposal going cold

RECENT APPROVALS:
• [X] notes pushed to GHL in last 24 hours

SYSTEM STATUS:
• GHL Sync: OK / ERROR
• Kill Switch: OFF / ON
• All systems operational: YES / NO

NO ACTION TAKEN. AWAITING YOUR DIRECTION.
```

## Guardrails

- This agent is read-only — it never writes anything
- Never fabricate numbers — only use data from API
- If inbox API fails → report "Data unavailable — check sync" and stop
- Always end with "NO ACTION TAKEN. AWAITING YOUR DIRECTION."
