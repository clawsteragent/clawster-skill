# Risk Management

Risk rules are **hard-coded**. The agent cannot override them, regardless of strategy or market conditions.

## Hard Rules

### NEVER

- Open a position without a stop loss (when `stop_loss = required`)
- Exceed `max_position_pct` of account balance per position
- Exceed `max_concurrent` open positions
- Trade after `daily_loss_pct` is hit
- Trade during cooldown (new positions only — existing ones are still managed)

### ALWAYS

- Check daily PnL before opening a new trade
- Log every trade to `memory/trades-YYYY-MM-DD.md`
- Verify balance is sufficient before placing an order
- Place SL/TP orders immediately after entry fill
- Reconcile on-chain positions with local state on startup

## Position Sizing

```
position_value = balance × (max_position_pct / 100)
size = position_value / entry_price × leverage
risk = size × |entry_price - stop_loss| / entry_price
```

If `risk` exceeds `max_risk_per_trade` % of balance, reduce `size` until it fits.

### Example

| Parameter | Value |
|-----------|-------|
| Balance | $10,000 |
| max_position_pct | 20% |
| max_risk_per_trade | 2% |
| Entry price | $100,000 (BTC) |
| Stop loss | $98,000 |
| Leverage | 10x |

```
position_value = $10,000 × 0.20 = $2,000
size = $2,000 / $100,000 × 10 = 0.2 BTC
risk = 0.2 × |$100,000 - $98,000| / $100,000 = $400 (4% of balance)
```

4% exceeds `max_risk_per_trade` (2% = $200). Reduce size:

```
max_size = ($200 × $100,000) / (|$100,000 - $98,000| × 1) = 0.1 BTC
```

Final position: 0.1 BTC at 10x leverage with SL at $98,000. Risk: $200 (2%).

## Cooldown System

Consecutive losses trigger a cooldown period:

1. Each losing trade increments `consecutiveLosses`
2. When `consecutiveLosses` >= `cooldown_after_losses`, cooldown activates
3. `cooldownUntil` is set to `now + cooldown_minutes`
4. During cooldown: no new positions, existing positions still managed
5. Cooldown resets when: timer expires **or** a winning trade occurs

### Default: 3 losses → 60 minute cooldown

This prevents tilt-trading and compounding losses during adverse conditions.

## Daily Loss Limit

- Tracked in `memory/clawster-state.json` as `dailyPnL`
- Updated after every trade close
- When `|dailyPnL|` exceeds `daily_loss_pct` % of starting balance → **all new trading halts**
- Existing positions continue to be managed (SL/TP remain active)
- Resets at midnight UTC

### Default: 5% daily loss limit

On a $10,000 account, trading stops after $500 in realized losses for the day.

## Max Drawdown Protection

- `max_drawdown_pct` tracks total drawdown from peak balance
- When hit, the agent pauses and notifies the user
- Requires manual acknowledgment to resume
- This is a circuit breaker for sustained losing streaks

### Default: 15% max drawdown

## Why stop_loss = required

Every position **must** have a stop loss order on the exchange. This protects against:

- Agent crashes or restarts (the SL order lives on the exchange)
- Network outages
- Rapid price moves (flash crashes)
- Bugs in strategy logic

The SL order is placed as a **stop market order** on Aster DEX immediately after the entry fills. If SL placement fails, the agent attempts to close the position at market.

Setting `stop_loss` to anything other than `required` removes this protection. Not recommended.

## Risk Parameters Summary

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `max_position_pct` | 20% | Cap single position size |
| `max_concurrent` | 3 | Limit open positions |
| `max_risk_per_trade` | 2% | Cap loss per trade |
| `daily_loss_pct` | 5% | Daily loss circuit breaker |
| `max_drawdown_pct` | 15% | Total drawdown circuit breaker |
| `cooldown_after_losses` | 3 | Losses before pause |
| `cooldown_minutes` | 60 | Pause duration |
| `stop_loss` | required | Enforce SL on every trade |

See [Configuration](configuration.md) for how to set these values.
