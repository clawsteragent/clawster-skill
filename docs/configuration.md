# Configuration

## Where to Configure

Add a `### Clawster Config` section to your `TOOLS.md` file (in `~/.openclaw/workspace/TOOLS.md`):

```markdown
### Clawster Config
- trading_pairs: BTCUSDT, ETHUSDT
- max_leverage: 10
- strategy: trend_follower
```

The agent reads this section at the start of every trading cycle. Changes take effect on the next cycle — no restart needed.

## API Credentials

Stored in `~/.openclaw/skills/clawster/.env`:

```
AGENT_ID=17763
ASTER_API_KEY=your_api_key
ASTER_API_SECRET=your_api_secret
BSC_PRIVATE_KEY=your_private_key  # optional, for EIP-712 signing
```

These are set during [installation](installation.md). To update, edit the `.env` file directly.

## Config Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agent_id` | integer | *(required)* | ERC-8004 agent ID, set during install |
| `trading_pairs` | string | `BTCUSDT, ETHUSDT` | Comma-separated trading pairs |
| `max_leverage` | integer | `10` | Maximum leverage multiplier |
| `max_position_pct` | integer | `20` | Max position size as % of account balance |
| `max_concurrent` | integer | `3` | Max simultaneous open positions |
| `stop_loss` | string | `required` | `required` = enforce SL on every trade |
| `daily_loss_pct` | integer | `5` | Max daily loss % before halting |
| `max_drawdown_pct` | integer | `15` | Max total drawdown % before pausing |
| `max_risk_per_trade` | integer | `2` | Max risk per trade as % of balance |
| `cooldown_after_losses` | integer | `3` | Consecutive losses before cooldown triggers |
| `cooldown_minutes` | integer | `60` | Cooldown duration in minutes |
| `max_daily_trades` | integer | `50` | Daily trade cap (resets midnight UTC) |
| `strategy` | string | `trend_follower` | Built-in strategy name |
| `strategy_prompt` | string | *(none)* | Freeform strategy in plain English — overrides `strategy` |

## Example Configs

### Conservative

Low risk, fewer trades, wider stops.

```markdown
### Clawster Config
- trading_pairs: BTCUSDT
- max_leverage: 5
- max_position_pct: 10
- max_concurrent: 1
- max_risk_per_trade: 1
- daily_loss_pct: 3
- max_drawdown_pct: 10
- cooldown_after_losses: 2
- cooldown_minutes: 120
- max_daily_trades: 10
- strategy: trend_follower
```

### Aggressive

Higher leverage, more pairs, tighter risk per trade.

```markdown
### Clawster Config
- trading_pairs: BTCUSDT, ETHUSDT, BNBUSDT
- max_leverage: 20
- max_position_pct: 30
- max_concurrent: 5
- max_risk_per_trade: 3
- daily_loss_pct: 8
- max_drawdown_pct: 20
- cooldown_after_losses: 4
- cooldown_minutes: 30
- max_daily_trades: 100
- strategy: trend_follower
```

### Scalper

High frequency, small positions, tight stops.

```markdown
### Clawster Config
- trading_pairs: BTCUSDT, ETHUSDT
- max_leverage: 15
- max_position_pct: 10
- max_concurrent: 3
- max_risk_per_trade: 1
- daily_loss_pct: 5
- max_drawdown_pct: 10
- cooldown_after_losses: 5
- cooldown_minutes: 15
- max_daily_trades: 200
- strategy_prompt: >
    Scalp 1-5 minute timeframes. Enter on momentum breakouts
    with volume confirmation. Take profit at 0.3-0.5% moves.
    Stop loss at 0.2%. Only trade during high volume hours.
    Skip low volatility periods.
```

## strategy_prompt

When `strategy_prompt` is set, it **completely overrides** the built-in `strategy` parameter. Write your trading logic in plain English.

**Examples:**

```
strategy_prompt: >
  Trade BTC using 4h RSI. Buy when RSI crosses above 30 from oversold.
  Sell when RSI crosses below 70 from overbought. Use 2:1 reward/risk ratio.
  Only trade when 24h volume is above $1B.
```

```
strategy_prompt: >
  Follow the trend on 1h timeframe. Use EMA 20/50 crossover for entries.
  Enter long when EMA20 crosses above EMA50 and price is above both.
  Enter short when EMA20 crosses below EMA50 and price is below both.
  Trail stop loss at 1.5 ATR. Take profit at 3 ATR.
```

The agent interprets the prompt as its decision-making framework. Be specific about indicators, timeframes, entry/exit conditions, and position management.

See [Risk Management](risk-management.md) for how risk rules interact with strategy decisions.
