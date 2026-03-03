---
name: clawster
description: >
  Autonomous perpetual futures trading on Aster DEX for ERC-8004 registered AI agents.
  Use when: setting up a trading agent, executing trades on Aster DEX, managing positions,
  checking PnL, configuring trading strategies, or any perpetual futures trading task.
  Triggers: 'trade', 'aster', 'perpetual', 'futures', 'position', 'leverage', 'clawster',
  'trading agent', 'PnL', 'open position', 'close position', 'set leverage'.
---

# Clawster Ã¢â‚¬" Autonomous Perps Trading on Aster DEX

## Overview

Clawster turns any OpenClaw agent into an autonomous perpetual futures trader on [Aster DEX](https://asterdex.com). The agent reasons about markets, makes trade decisions, and executes them Ã¢â‚¬" all through natural language + API calls.

**Requirements:**
- A BSC wallet with BNB for gas (used to register on ERC-8004)
- Aster DEX API key + secret (generated after connecting wallet to Aster)
- Node.js 18+ (for setup/utility scripts)

**Supported pairs:** All Aster trading pairs Ã¢â‚¬" BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, and more.

## One Wallet Ã¢â‚¬" How It Works

Clawster uses a **single BSC wallet** for everything Ã¢â‚¬" on-chain identity and trading. The same wallet that registers your agent on ERC-8004 is the one you connect to Aster DEX.

- **Registers** your agent as an ERC-8004 NFT on BSC
- **Connects** to Aster DEX for perpetual futures trading
- **Holds** BNB (for gas) + USDT (trading capital)
- **Controlled** via private key (identity) and Aster API key + secret (trading)

**Flow:** Your BSC wallet registers an agent on ERC-8004 Ã¢" ' You connect the same wallet to Aster DEX Ã¢" ' Deposit USDT to Aster Ã¢" ' Generate API key + secret Ã¢" ' Start trading.

## Setup

### Step 1: Provide BSC Private Key

You need a BSC (BNB Smart Chain) wallet with BNB balance for gas. This wallet becomes the **owner** of your agent's on-chain identity.

- Use a **dedicated wallet** Ã¢â‚¬" do not use your main wallet
- Needs ~0.005 BNB for the registration transaction
- The private key is used once during setup to send the registration TX

### Step 2: Register on ERC-8004 (Automatic)

Run the setup script Ã¢â‚¬" it handles registration automatically:

```bash
cd skill/clawster
npm install
node scripts/setup-agent.js
```

The script will:
1. Ask for your BSC private key
2. Check your BNB balance
3. Send a `register(tokenURI)` transaction to the ERC-8004 registry (`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`)
4. Wait for confirmation and extract your `agentId` from the Transfer event
5. Print: `Agent #<id> registered on ERC-8004`

See [references/erc8004-auth.md](references/erc8004-auth.md) for technical details.

### Step 3: Connect Wallet & Deposit USDT (Manual)

Connect the **same BSC wallet** to Aster DEX and deposit trading capital:

1. Go to [asterdex.com](https://asterdex.com) and connect your BSC wallet
2. This is the same wallet used for ERC-8004 registration
3. Deposit USDT (BEP-20) via the Aster DEX interface
4. Your USDT is now available for trading on Aster

### Step 4: Generate API Key (Ã¢Å¡Â Ã¯Â¸Â MANUAL)

> **This step MUST be done manually in your browser.**

1. Go to **https://www.asterdex.com/en/api-management**
2. Click **"ENABLE FUTURES"**
3. Click **Save** / **Approve**
4. **Copy the API Key and Secret immediately Ã¢â‚¬" the secret is shown ONLY ONCE!**

Ã¢Å¡Â Ã¯Â¸Â **Do NOT close the page before copying your secret. It cannot be retrieved later.**

### Step 5: Store Aster API Credentials

Add your credentials to `TOOLS.md`:

```markdown
### Aster DEX
- API Key: `your-api-key`
- API Secret: `your-api-secret`
- Base URL: `https://fapi.asterdex.com/fapi/v1`
```

Or use environment variables: `ASTER_API_KEY`, `ASTER_API_SECRET`

### Step 6: Configure Trading Parameters

Set these in TOOLS.md under a `### Clawster Config` section. All parameters are optional Ã¢â‚¬" sane defaults apply if not configured. See the **Risk Configuration** section below for full details on each parameter.

```markdown
### Clawster Config
- agent_id: 42
- trading_pairs: BTCUSDT, ETHUSDT
- max_leverage: 10
- max_position_pct: 20
- max_concurrent: 3
- stop_loss: required
- daily_loss_pct: 5
- max_drawdown_pct: 15
- max_risk_per_trade: 2
- cooldown_after_losses: 3
- cooldown_minutes: 60
- max_daily_trades: 50
- strategy: trend_follower
```

## Trading Workflow

This is the core loop. Execute it manually or via cron.

### Step 1: Fetch Market Data

```
GET https://fapi.asterdex.com/fapi/v1/ticker/price?symbol=BTCUSDT
GET https://fapi.asterdex.com/fapi/v1/klines?symbol=BTCUSDT&interval=15m&limit=100
GET https://fapi.asterdex.com/fapi/v1/fundingRate?symbol=BTCUSDT
GET https://fapi.asterdex.com/fapi/v1/depth?symbol=BTCUSDT&limit=20
```

With MCP: `aster_price({ symbol: "BTCUSDT" })`, `aster_klines(...)`, etc.

### Step 2: Analyze with Strategy

Feed market data into your trading strategy (see [references/trading-strategies.md](references/trading-strategies.md)). Your reasoning produces a trade decision:

```json
{
  "action": "OPEN_LONG",
  "symbol": "BTCUSDT",
  "size_percent": 10,
  "leverage": 10,
  "stop_loss": 96500,
  "take_profit": 99000,
  "reasoning": "BTC showing bullish divergence on 15m RSI, funding negative, order book bid-heavy"
}
```

### Step 3: Execute Trade

**Set leverage** (if changed):
```
POST /leverage  { symbol: "BTCUSDT", leverage: 10 }
```

**Place order:**
```
POST /order  {
  symbol: "BTCUSDT",
  side: "BUY",
  type: "MARKET",
  quantity: 0.01
}
```

**Set stop loss:**
```
POST /order  {
  symbol: "BTCUSDT",
  side: "SELL",
  type: "STOP_MARKET",
  stopPrice: 96500,
  reduceOnly: true
}
```

**Set take profit:**
```
POST /order  {
  symbol: "BTCUSDT",
  side: "SELL",
  type: "TAKE_PROFIT_MARKET",
  stopPrice: 99000,
  reduceOnly: true
}
```

### Step 4: Monitor & Adjust

Check positions periodically:
```
GET /positionRisk?symbol=BTCUSDT
GET /openOrders?symbol=BTCUSDT
```

Adjust stops, take partials, or close based on evolving market conditions.

### Step 5: Log Trade

Write to `memory/trades-YYYY-MM-DD.md`:

```markdown
## BTCUSDT LONG Ã¢â‚¬" 2026-03-02 14:30 PST
- Entry: $97,250 | Size: 0.01 BTC | Leverage: 10x
- Stop: $96,500 | TP: $99,000
- Reasoning: Bullish RSI divergence on 15m, negative funding
- Status: OPEN
- PnL: Ã¢â‚¬"
```

Update `MEMORY.md` with cumulative stats.

### API Authentication (for direct calls)

```javascript
const crypto = require('crypto');
const timestamp = Date.now();
const queryString = `symbol=BTCUSDT&timestamp=${timestamp}`;
const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');
// Add header: X-MBX-APIKEY: <your key>
// Append: &signature=<signature>
```

Full API reference: [references/aster-api.md](references/aster-api.md)

## Risk Configuration

All risk parameters are **customizable per user** via the `### Clawster Config` section in TOOLS.md. If a parameter is not configured, the default value applies. The agent reads this config on every trading cycle.

### Full Config Schema

| Parameter | Default | Description |
|-----------|---------|-------------|
| `agent_id` | *(required)* | Your ERC-8004 agent ID |
| `trading_pairs` | `BTCUSDT, ETHUSDT` | Comma-separated list of pairs to trade |
| `max_leverage` | `10` | Maximum leverage multiplier. Scalpers may increase to 20 |
| `max_position_pct` | `20` | Max position size per trade as % of account balance |
| `max_concurrent` | `3` | Max number of open positions at once. Reduce if account < $1000 |
| `stop_loss` | `required` | Whether stop loss is required on every trade. **Ã¢Å¡Â Ã¯Â¸Â WARNING: Setting this to anything other than `required` removes your primary loss protection. You can lose your entire position. Do not disable unless you fully understand the risk.** |
| `daily_loss_pct` | `5` | Max daily loss as % of account. Trading stops when hit |
| `max_drawdown_pct` | `15` | Max total drawdown as % of account. Agent pauses and reassesses |
| `max_risk_per_trade` | `2` | Max risk per trade as % of account balance |
| `cooldown_after_losses` | `3` | Number of consecutive losses before cooldown triggers |
| `cooldown_minutes` | `60` | Minutes to pause trading after cooldown triggers |
| `max_daily_trades` | `50` | Maximum number of trades per day (prevents overtrading) |
| `strategy` | `trend_follower` | Strategy name (see references/trading-strategies.md) |

### Parameter Details

**Position sizing formula:**
```
size = (account_balance Ãƒ"” max_position_pct / 100) / entry_price Ãƒ"” leverage
```

**Risk per trade:**
```
risk = position_size Ãƒ"” (entry - stop_loss) / entry
```
Must stay under `max_risk_per_trade` % of account.

**Cooldown system:** After `cooldown_after_losses` consecutive losing trades, the agent pauses all trading for `cooldown_minutes` minutes. This prevents tilt-driven overtrading. The cooldown resets after a winning trade or after the timer expires.

**Daily trade limit:** The `max_daily_trades` counter resets at midnight UTC. If hit, no new positions are opened until the next day. Existing positions continue to be managed (stop adjustments, closes).

### Example TOOLS.md Config

```markdown
### Clawster Config
- agent_id: 42
- trading_pairs: BTCUSDT, ETHUSDT
- max_leverage: 10
- max_position_pct: 20
- max_concurrent: 3
- stop_loss: required
- daily_loss_pct: 5
- max_drawdown_pct: 15
- max_risk_per_trade: 2
- cooldown_after_losses: 3
- cooldown_minutes: 60
- max_daily_trades: 50
- strategy: trend_follower
```

Any parameter omitted from your config uses the default value shown above.

## Cron Integration

Set up periodic market analysis using OpenClaw's cron system:

```
# Check positions every 5 minutes
*/5 * * * *  Check all open positions on Aster DEX. Adjust stops if needed. Log status.

# Full market scan every hour
0 * * * *  Analyze BTCUSDT, ETHUSDT, BNBUSDT on 1h candles. Generate trade decisions if setups exist.

# Daily PnL summary at midnight
0 0 * * *  Calculate daily PnL, update MEMORY.md, review winning/losing trades for lessons.
```

## Memory Integration

### Trade Logging

Every trade gets logged to `memory/trades-YYYY-MM-DD.md` with:
- Entry/exit prices, size, leverage
- Stop loss and take profit levels
- Reasoning for the trade
- Outcome and PnL

### PnL Tracking in MEMORY.md

Maintain a running section:

```markdown
## Trading Stats
- Total trades: 47
- Win rate: 62%
- Total PnL: +$1,234.56
- Best trade: ETHUSDT SHORT +$450 (2026-02-28)
- Worst trade: BTCUSDT LONG -$180 (2026-02-25)
- Current streak: 3 wins
```

### Learning Loop

After each trading day, review:
1. Which setups worked? Which didn't?
2. Were stops too tight or too loose?
3. Did you overtrade?
4. Update strategy parameters based on learnings.

## MCP Integration (Optional)

`@clawster/aster-mcp` is a **separate optional package** (located at `../aster-mcp/`). If installed, you get direct tool access:

| Tool | Description |
|------|-------------|
| `aster_ping` | Health check |
| `aster_price` | Get current price |
| `aster_klines` | Get candle data |
| `aster_depth` | Order book |
| `aster_funding_rate` | Funding rates |
| `aster_account` | Balances & positions |
| `aster_place_order` | Place an order |
| `aster_cancel_order` | Cancel an order |
| `aster_positions` | Position details |
| `aster_set_leverage` | Set leverage |
| `aster_open_orders` | List open orders |

Without MCP, use `fetch()` or `curl` with HMAC-SHA256 auth. See [references/aster-api.md](references/aster-api.md).

## Quick Reference Ã¢â‚¬" Common Operations

**Check price:** `GET /ticker/price?symbol=BTCUSDT`

**Open long:** `POST /order { symbol, side: "BUY", type: "MARKET", quantity }`

**Open short:** `POST /order { symbol, side: "SELL", type: "MARKET", quantity }`

**Close position:** `POST /order { symbol, side: opposite, type: "MARKET", quantity, reduceOnly: true }`

**Set leverage:** `POST /leverage { symbol, leverage }`

**Check position:** `GET /positionRisk?symbol=BTCUSDT`

**Cancel all orders:** `DELETE /order { symbol }` (loop through openOrders)
