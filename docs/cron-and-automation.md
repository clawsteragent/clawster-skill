# Cron & Automation

Clawster supports fully autonomous operation through OpenClaw's cron system and heartbeat integration.

## Cron Jobs

Paste these into your OpenClaw cron configuration for autonomous trading.

### Position Monitor (every 5 minutes)

Checks open positions, adjusts stops, updates state.

```json
{
  "name": "clawster-position-monitor",
  "schedule": { "kind": "cron", "expr": "*/5 * * * *" },
  "payload": { "kind": "systemEvent", "text": "Check all open Aster positions. Adjust stops if needed. Update memory/clawster-state.json." },
  "sessionTarget": "main",
  "enabled": true
}
```

### Market Scan (every hour)

Runs the full [trading loop](trading-loop.md): analyze markets, generate signals, execute trades.

```json
{
  "name": "clawster-market-scan",
  "schedule": { "kind": "cron", "expr": "0 * * * *" },
  "payload": { "kind": "systemEvent", "text": "Run CLAWSTER trading loop: analyze configured pairs, generate signals, execute trades if setups exist." },
  "sessionTarget": "main",
  "enabled": true
}
```

### Daily Summary (midnight UTC)

Calculates daily PnL, updates long-term memory, resets counters.

```json
{
  "name": "clawster-daily-summary",
  "schedule": { "kind": "cron", "expr": "0 0 * * *", "tz": "UTC" },
  "payload": { "kind": "systemEvent", "text": "Calculate daily CLAWSTER PnL. Update MEMORY.md with summary. Review wins/losses for strategy improvements. Reset daily counters in clawster-state.json." },
  "sessionTarget": "main",
  "enabled": true
}
```

## Heartbeat Integration

Add to your `HEARTBEAT.md` for checks during regular heartbeat polls:

```markdown
- Check open Aster positions (GET /fapi/v1/positionRisk). If unrealized loss > 50% of max_drawdown_pct, alert user.
- If clawster-state.json shows cooldown active, note time remaining.
```

## Fully Autonomous vs Semi-Autonomous

### Fully Autonomous

Enable all three cron jobs. The agent will:
- Scan markets hourly for new trade setups
- Monitor positions every 5 minutes
- Summarize performance daily
- Halt automatically when risk limits are hit

No human intervention needed. Review daily summaries in `MEMORY.md`.

### Semi-Autonomous

Disable `clawster-market-scan` (the hourly scan). Keep position monitoring active. In this mode:
- **You** decide when to look for trades (ask the agent manually)
- The agent manages open positions automatically (stops, exits)
- Risk rules still enforced

This gives you control over entries while automating position management.

## Monitoring

### What to Check

| Check | How | Frequency |
|-------|-----|-----------|
| Open positions | Ask agent or read `memory/clawster-state.json` | As needed |
| Daily PnL | Read `memory/trades-YYYY-MM-DD.md` | End of day |
| Weekly performance | Read `MEMORY.md` | Weekly |
| Cooldown status | Check `clawster-state.json` → `cooldownUntil` | After losses |
| Risk limits | Check if `daily_loss_pct` or `max_drawdown_pct` was hit | Daily |

### Alerts

The agent will notify you in the main chat session when:
- Daily loss limit is hit (trading halted)
- Max drawdown is breached (manual review required)
- Cooldown is triggered
- An order fails after retries
- Balance is insufficient for a trade

For proactive alerts via heartbeat, ensure `HEARTBEAT.md` includes the Clawster checks above.
