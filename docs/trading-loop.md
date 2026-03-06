# Trading Loop

The core of Clawster is a 10-step loop executed each cycle — triggered by [cron](cron-and-automation.md), heartbeat, or manual command.

## The 10 Steps

### Step 1: Read Config

Read `### Clawster Config` from TOOLS.md. Apply defaults for any missing parameters. See [Configuration](configuration.md) for all options.

### Step 2: Check Balance

Read `aster-api-account-v1` skill, call `GET /fapi/v2/balance`. Record available balance. If balance is zero or API fails, abort cycle.

### Step 3: Check Open Positions

Call `GET /fapi/v1/positionRisk`. Reconcile with `memory/clawster-state.json`. If positions exist on-chain but not in state, adopt them at MONITORING state.

### Step 4: Check Daily PnL

Read `memory/clawster-state.json`. If `dailyPnL` loss exceeds `daily_loss_pct` of balance → **stop trading**, log reason, skip to step 10.

### Step 5: Check Cooldown

If `cooldownUntil` is set and hasn't expired → skip to step 10. Existing positions continue to be managed.

### Step 6: Check Trade Count

If `dailyTradeCount` >= `max_daily_trades` → skip to step 10.

### Step 7: Fetch Market Data

Read `aster-api-market-data-v1` skill. For each configured trading pair, fetch:
- Current price (`GET /fapi/v1/ticker/price`)
- Klines/candlesticks (`GET /fapi/v1/klines`)
- Funding rate (`GET /fapi/v1/fundingRate`)
- Order book depth (`GET /fapi/v1/depth`)

### Step 8: Apply Strategy

If `strategy_prompt` is set, use it as the decision framework. Otherwise, apply the built-in `strategy`. Produce one of:
- **LONG** signal with entry price, SL, TP
- **SHORT** signal with entry price, SL, TP
- **NO_TRADE** — no setup found

### Step 9: Execute Trade

If a signal was generated:

1. Validate against [risk rules](risk-management.md) (position size, max concurrent, drawdown)
2. Read `aster-api-trading-v1` for order placement
3. Set leverage (`POST /fapi/v1/leverage`)
4. Place entry order (`POST /fapi/v1/order`)
5. Once filled, place SL and TP orders immediately
6. Log trade to `memory/trade-log.jsonl`

### Step 10: Update State

Write current state to `memory/clawster-state.json`:
- Open positions and their states
- Daily PnL running total
- Daily trade count
- Consecutive loss counter
- Cooldown timer (if active)

## Position State Machine

```
┌────────────┐
│ ANALYZING  │ ← Market data evaluation
└─────┬──────┘
      │ signal found
      ▼
┌────────────┐
│ENTRY_SIGNAL│ ← Risk validation
└─────┬──────┘
      │ passes risk checks
      ▼
┌────────────┐
│ORDER_PLACED│ ← Waiting for fill
└─────┬──────┘
      │ filled
      ▼
┌─────────────┐
│POSITION_OPEN│ ← Set SL/TP orders
└─────┬───────┘
      │ SL/TP placed
      ▼
┌────────────┐
│ MONITORING │ ← Track price, adjust stops
└─────┬──────┘
      │ exit condition met
      ▼
┌────────────┐
│EXIT_SIGNAL │ ← Place close order
└─────┬──────┘
      │ close order placed
      ▼
┌────────────┐
│  CLOSING   │ ← Waiting for close fill
└─────┬──────┘
      │ filled
      ▼
┌────────────┐
│   CLOSED   │ ← Log PnL, update stats
└────────────┘
```

At any state, if the order is rejected or times out, the position moves to error recovery (see below).

## Strategy Decisions

The agent makes decisions based on:

1. **Market data** — price action, volume, indicators derived from klines
2. **Strategy rules** — either the built-in strategy or `strategy_prompt`
3. **Current exposure** — existing positions, unrealized PnL
4. **Risk constraints** — position limits, daily loss, drawdown

The strategy produces a signal with conviction level. Low conviction signals may be skipped. The agent explains its reasoning in trade logs.

## Order Management

| Order Type | When Used |
|------------|-----------|
| Limit | Default for entries (better fill price) |
| Market | When immediate execution needed, or for emergency closes |
| Stop Market | Stop loss orders |
| Take Profit Market | Take profit orders |

Orders are monitored via `GET /fapi/v1/openOrders`. If an entry order isn't filled within the expected timeframe, it's canceled and the signal is discarded.

## Error Recovery

| Scenario | Action |
|----------|--------|
| Order rejected | Read reason, adjust size/price, retry once. If still rejected, skip. |
| API timeout | Wait 5s, retry up to 3 times. |
| Rate limited | Follow backoff rules from `aster-api-errors-v1`. |
| Position without SL/TP | Place missing orders immediately on detection. |
| Balance insufficient | Log warning, skip trade, continue monitoring existing positions. |
| Unknown error | Log full details, skip trade, continue loop. |

See [Memory & State](memory-and-state.md) for how the agent recovers after a restart.
