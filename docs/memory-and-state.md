# Memory & State

Clawster uses file-based state management. All state lives in the OpenClaw workspace under `memory/`.

## clawster-state.json

The primary runtime state file. Read and written every trading cycle.

### Schema

```json
{
  "positions": [
    {
      "symbol": "BTCUSDT",
      "side": "LONG",
      "state": "MONITORING",
      "entryPrice": 97250,
      "size": 0.1,
      "leverage": 10,
      "slOrderId": "123456",
      "tpOrderId": "123457",
      "entryTime": "2026-03-06T14:30:00Z"
    }
  ],
  "dailyPnL": -1.2,
  "dailyTradeCount": 5,
  "consecutiveLosses": 1,
  "cooldownUntil": null,
  "lastUpdated": "2026-03-06T16:43:00Z"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `positions` | array | Active positions with their current state |
| `positions[].symbol` | string | Trading pair |
| `positions[].side` | string | `LONG` or `SHORT` |
| `positions[].state` | string | Position state (see [Trading Loop](trading-loop.md)) |
| `positions[].entryPrice` | number | Entry fill price |
| `positions[].size` | number | Position size in base asset |
| `positions[].leverage` | number | Leverage used |
| `positions[].slOrderId` | string | Stop loss order ID on exchange |
| `positions[].tpOrderId` | string | Take profit order ID on exchange |
| `positions[].entryTime` | string | ISO 8601 entry timestamp |
| `dailyPnL` | number | Running daily PnL in % |
| `dailyTradeCount` | number | Trades placed today |
| `consecutiveLosses` | number | Current consecutive loss streak |
| `cooldownUntil` | string\|null | ISO 8601 timestamp when cooldown ends, or null |
| `lastUpdated` | string | ISO 8601 last update timestamp |

## Trade Logs

Daily trade logs are written to `memory/trade-log.jsonl`. Each trade entry includes:

```markdown
## BTCUSDT LONG — 2026-03-06 14:30 UTC

- **Entry**: $97,250 (limit order, filled 14:30:12)
- **Size**: 0.1 BTC @ 10x leverage
- **Stop Loss**: $96,000 (order ID: 123456)
- **Take Profit**: $99,500 (order ID: 123457)
- **Reasoning**: EMA20 crossed above EMA50 on 1h, RSI at 45 rising, volume above average
- **Status**: MONITORING
- **Exit**: $99,100 (TP hit, 14:58:33)
- **PnL**: +$185 (+1.85%)
```

## MEMORY.md Integration

The daily summary cron job (see [Cron & Automation](cron-and-automation.md)) writes weekly performance summaries to `MEMORY.md`:

- Win rate
- Total PnL
- Best/worst trades
- Strategy observations
- Parameter adjustment recommendations

This gives the agent long-term context across sessions.

## Recovery After Restart

When the agent starts (or a new session begins):

1. **Read `memory/clawster-state.json`** — restore known positions and state
2. **Call `GET /fapi/v1/positionRisk`** — get actual on-chain positions
3. **Reconcile**:
   - Positions on-chain but not in state → adopt at `MONITORING` state
   - Positions in state but not on-chain → mark as `CLOSED`, log
4. **Verify SL/TP orders** — call `GET /fapi/v1/openOrders` for each position
   - Missing SL → place immediately
   - Missing TP → place immediately
5. **Resume normal loop**

This ensures no position is ever left unmanaged, even after crashes, restarts, or network outages. The exchange-side SL orders provide the safety net during downtime.
