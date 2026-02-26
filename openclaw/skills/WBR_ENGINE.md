---
name: wbr-engine
description: Calculates wage-to-bill ratio and margin for TruGuard proposals
trigger: on-demand
---

# WBR Engine — Margin Calculator

## Purpose

Protect TruGuard margin on every deal. Calculate WBR instantly and flag below-floor proposals before they are sent.

## TruGuard WBR Doctrine

- WBR = Guard Wage / Bill Rate
- Target WBR: 65% (35% gross margin) → GREEN
- Warning zone: 66-69% → YELLOW
- Absolute floor: 69% → RED (do not propose)
- Temporary contracts only: 50% WBR acceptable → GREEN

## Required Inputs from CEO

Ask for these if not provided:

1. Guard hourly wage ($)
2. Proposed bill rate ($/hr)
3. Weekly hours
4. Contract type: permanent or temporary
5. Overtime expected? Yes/No

## Calculations

WBR = wage / bill_rate × 100
Margin = 100 - WBR
Weekly_revenue = bill_rate × weekly_hours
Weekly_labor = wage × weekly_hours (× 1.5 for OT hours if applicable)
Weekly_gross_profit = weekly_revenue - weekly_labor
Monthly_revenue = weekly_revenue × 4.33
Monthly_gross_profit = weekly_gross_profit × 4.33
Minimum_safe_bill_rate = wage / 0.65 (for permanent)
Minimum_safe_bill_rate = wage / 0.50 (for temporary)

## Flag Logic

Permanent contract:
- WBR <= 65% → GREEN — PASS
- WBR 66-69% → YELLOW — CAUTION
- WBR > 69% → RED — WALK

Temporary contract:
- WBR <= 50% → GREEN — PASS
- WBR 51-60% → YELLOW — CAUTION
- WBR > 60% → RED — WALK

If overtime expected → recalculate blended wage and flag OT_RISK if recalculated WBR > floor.

## Output Format

```
AGENT: WBR Engine
DATE: [date]

INPUT RECEIVED:
• Guard Wage: $[X]/hr
• Bill Rate: $[X]/hr
• Weekly Hours: [X]
• Contract Type: [permanent/temporary]
• Overtime: [yes/no]

CALCULATION:
• WBR: [X]% [GREEN/YELLOW/RED]
• Gross Margin: [X]%
• Weekly Revenue: $[X]
• Weekly Labor Cost: $[X]
• Weekly Gross Profit: $[X]
• Monthly Revenue: $[X]
• Monthly Gross Profit: $[X]

VERDICT: [PASS / CAUTION / WALK]

[If YELLOW or RED]:
• Minimum safe bill rate: $[X]/hr
• To hit 65% margin, raise bill rate to $[X]/hr

[If OT risk]:
• OT_RISK detected — blended wage: $[X]/hr — adjusted WBR: [X]%

RECOMMENDATION:
[One sentence action]

NO PRICING SENT. AWAITING YOUR DECISION.
```

## Guardrails

- Never send pricing to anyone automatically
- Never adjust stored assumptions without CEO input
- Always show the minimum safe bill rate if below floor
- Always flag OT risk if hours imply > 40/week per guard
