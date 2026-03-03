<p align="center">
  <h1 align="center">🦀 CLAWSTER</h1>
  <p align="center">
    <strong>Autonomous Perpetual Futures Trading for AI Agents</strong>
  </p>
  <p align="center">
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
    <a href="https://openclaw.com"><img src="https://img.shields.io/badge/OpenClaw-Skill-blueviolet" alt="OpenClaw Skill"></a>
    <img src="https://img.shields.io/badge/Node.js-18%2B-green" alt="Node.js 18+">
    <a href="https://asterdex.com"><img src="https://img.shields.io/badge/Aster-DEX-orange" alt="Aster DEX"></a>
    <a href="https://clawster.com"><img src="https://img.shields.io/badge/clawster.com-🦀-red" alt="clawster.com"></a>
  </p>
</p>

---

**CLAWSTER** turns any [OpenClaw](https://openclaw.com) AI agent into an **autonomous perpetual futures trader** on [Aster DEX](https://asterdex.com). One skill install, conversational setup, 24/7 autonomous trading.

Your agent gets an **on-chain identity** via [ERC-8004](https://erc8004.org), connects to Aster DEX for perpetual futures, and trades autonomously using strategies you define in plain English.

> *"Set up CLAWSTER"* → register on-chain → connect wallet → start trading. That's it.

---

## ✨ Features

- **🤖 Autonomous Execution** — Agent reasons about markets, makes decisions, and executes trades without human intervention
- **🔗 On-Chain ERC-8004 Identity** — Every agent gets a verifiable on-chain NFT identity on BSC
- **🛡️ Deterministic Risk Controls** — Hard-coded limits on leverage, position size, drawdown, and daily losses
- **💬 Natural Language Strategies** — Define your trading strategy in plain English — no code required
- **📝 Trade Logging & Learning** — Every trade is logged with reasoning, and the agent learns from its history
- **⏰ Cron-Based Scheduling** — Periodic market scans, position checks, and daily PnL reports on autopilot

---

## 🚀 Quick Start

**1. Install the skill**
```
Copy this folder to your OpenClaw skills directory
```

**2. Set up**
```
Tell your agent: "Set up CLAWSTER"
```

**3. Start trading**
```
Tell your agent: "Scan the market and trade"
```

That's it. Your agent handles ERC-8004 registration, walks you through wallet connection, and starts trading autonomously.

---

## 🔧 How It Works

The setup is a **6-step guided flow** — your agent walks you through each step conversationally:

| Step | Action | Type |
|------|--------|------|
| **1** | Provide your BSC private key | 🗝️ You provide |
| **2** | Agent registers ERC-8004 on-chain identity | 🤖 Automatic |
| **3** | Connect wallet to Aster DEX + deposit USDT | 👤 Manual (browser) |
| **4** | Generate Aster API key + secret | 👤 Manual (browser) |
| **5** | Store credentials in agent config | 🤖 Automatic |
| **6** | Configure trading strategy & risk parameters | 💬 Conversational |

After setup, the agent operates autonomously — fetching market data, analyzing setups, placing trades, managing positions, and logging everything.

---

## 🔑 One Wallet Architecture

CLAWSTER uses a **single BSC wallet** for everything:

```
┌─────────────────────────────────────────┐
│              Your BSC Wallet            │
│                                         │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │  ERC-8004   │  │   Aster DEX      │  │
│  │  Identity   │  │   Trading        │  │
│  │  (on-chain) │  │   (API key)      │  │
│  └─────────────┘  └──────────────────┘  │
│                                         │
│  BNB (gas) + USDT (trading capital)     │
└─────────────────────────────────────────┘
```

- **One wallet** registers the agent on ERC-8004 and connects to Aster DEX
- **BNB** covers gas for the registration transaction (~0.005 BNB)
- **USDT** is your trading capital, deposited into Aster DEX
- **Private key** is used once for ERC-8004 registration, then the agent uses API keys for trading

---

## 🛡️ Risk Controls

Every parameter is configurable via your agent's `TOOLS.md`. Sane defaults protect your capital:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `max_leverage` | `10` | Maximum leverage multiplier |
| `max_position_pct` | `20` | Max position size as % of account balance |
| `max_concurrent` | `3` | Max simultaneous open positions |
| `stop_loss` | `required` | ⚠️ Stop loss on every trade (do not disable) |
| `daily_loss_pct` | `5` | Max daily loss % — trading halts when hit |
| `max_drawdown_pct` | `15` | Max total drawdown % — agent pauses and reassesses |
| `max_risk_per_trade` | `2` | Max risk per trade as % of account |
| `cooldown_after_losses` | `3` | Consecutive losses before cooldown triggers |
| `cooldown_minutes` | `60` | Minutes to pause after cooldown triggers |
| `max_daily_trades` | `50` | Max trades per day (prevents overtrading) |

**Position sizing formula:**
```
size = (account_balance × max_position_pct / 100) / entry_price × leverage
```

**Cooldown system:** After N consecutive losses, the agent pauses trading for the configured cooldown period. Resets after a win or timer expiry.

---

## 📊 Trading Strategies

Strategies are defined in **plain English** — no code, no config files. Just tell your agent how you want to trade.

### 🐢 Conservative Trend Follower
> *"Trade BTC and ETH only. Follow the 1-hour trend using EMA crossovers. Use 5x leverage max, 10% position size. Only enter on pullbacks to support. Always set stop loss at the recent swing low."*

### ⚡ Momentum Scalper
> *"Scalp BTCUSDT on 5m candles. Enter on volume spikes with RSI confirmation. 15x leverage, tight stops at 0.3%. Take profit at 0.5-1%. Max 20 trades per day."*

### 📈 Mean Reversion
> *"Trade when BTC RSI drops below 30 on the 15m chart. Enter long with 10x leverage. Stop loss 2% below entry. Take profit when RSI returns above 50. Only trade during high volume periods."*

### 💰 Funding Rate Hunter
> *"Monitor funding rates across all pairs. When funding is deeply negative (< -0.05%), open a long position. When funding is deeply positive (> 0.05%), open a short. Collect funding payments every 8 hours. Use 5x leverage with wide stops."*

---

## 🔄 Trading Workflow

The agent executes an autonomous loop:

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  FETCH   │───▶│ ANALYZE  │───▶│ EXECUTE  │───▶│ MONITOR  │───▶│   LOG    │
│  Market  │    │ Strategy │    │  Trade   │    │ Position │    │  Trade   │
│  Data    │    │  Logic   │    │  Order   │    │  Mgmt    │    │  Memory  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
      ▲                                                               │
      └───────────────────────────────────────────────────────────────┘
```

1. **Fetch** — Pull prices, klines, order book, funding rates from Aster DEX
2. **Analyze** — Apply your strategy to market data, reason about setups
3. **Execute** — Place orders with calculated position size, leverage, stops
4. **Monitor** — Track open positions, adjust stops, take partials
5. **Log** — Record every trade with reasoning, entry/exit, PnL

---

## 📡 Market Data

The agent uses comprehensive market data from Aster DEX:

| Data | Endpoint | Use |
|------|----------|-----|
| **Current Price** | `/ticker/price` | Entry/exit decisions |
| **Klines (Candles)** | `/klines` — 15 intervals (1m to 1M) | Technical analysis |
| **Order Book** | `/depth` | Liquidity & support/resistance |
| **Funding Rates** | `/fundingRate` | Funding rate strategy |
| **24h Statistics** | `/ticker/24hr` | Volume, volatility |
| **Open Interest** | `/openInterest` | Market sentiment |
| **Recent Trades** | `/trades` | Momentum detection |

---

## 📝 Trade Logging & Memory

### Trade Journal

Every trade is logged to `memory/trades-YYYY-MM-DD.md`:

```markdown
## BTCUSDT LONG — 2026-03-02 14:30 PST
- Entry: $97,250 | Size: 0.01 BTC | Leverage: 10x
- Stop: $96,500 | TP: $99,000
- Reasoning: Bullish RSI divergence on 15m, negative funding
- Status: CLOSED — TP Hit
- PnL: +$175.00
```

### PnL Tracking

Running statistics maintained in `MEMORY.md`:

```markdown
## Trading Stats
- Total trades: 47
- Win rate: 62%
- Total PnL: +$1,234.56
- Best trade: ETHUSDT SHORT +$450
- Current streak: 3 wins
```

### Learning Loop

After each trading day, the agent reviews:
- Which setups worked and which didn't
- Were stops too tight or too loose
- Overtrading patterns
- Strategy parameter adjustments based on outcomes

---

## ⏰ Cron Integration

Set up periodic autonomous trading with OpenClaw's cron system:

```bash
# Check positions every 5 minutes
*/5 * * * *  Check all open positions on Aster DEX. Adjust stops if needed.

# Full market scan every hour
0 * * * *  Analyze BTCUSDT, ETHUSDT, BNBUSDT. Generate trade decisions if setups exist.

# Daily PnL summary at midnight
0 0 * * *  Calculate daily PnL, update MEMORY.md, review trades for lessons.
```

---

## 🔌 MCP Integration

For direct tool access (optional), install the companion [`aster-mcp`](https://github.com/clawsteragent/aster-mcp) package:

```bash
npm install -g @clawster/aster-mcp
```

This gives your agent MCP tools like `aster_price`, `aster_klines`, `aster_place_order`, `aster_positions`, and more — no manual HTTP/HMAC auth needed.

Without MCP, the agent uses `fetch()` or `curl` with HMAC-SHA256 authentication directly against the Aster API. Both approaches work.

---

## 🛠️ Scripts

### `scripts/setup-agent.js`

Interactive setup script for ERC-8004 registration:

```bash
cd skill/clawster && npm install
node scripts/setup-agent.js
```

- Prompts for BSC private key
- Checks BNB balance
- Sends `register(tokenURI)` to the ERC-8004 registry
- Extracts and displays your agent ID

### `scripts/check-balance.js`

Check your Aster DEX account balances and open positions:

```bash
node scripts/check-balance.js
```

- Reads credentials from env vars or TOOLS.md
- Displays USDT balance, unrealized PnL, and open positions

---

## 📁 Project Structure

```
clawster/
├── SKILL.md              # OpenClaw skill definition (agent instructions)
├── README.md             # This file
├── package.json          # Node.js dependencies (ethers)
├── .gitignore
├── scripts/
│   ├── setup-agent.js    # ERC-8004 registration script
│   └── check-balance.js  # Balance & position checker
└── references/
    ├── aster-api.md      # Full Aster DEX API reference
    ├── erc8004-auth.md   # ERC-8004 registry technical details
    └── trading-strategies.md  # Strategy templates & examples
```

---

## 📋 Requirements

- **[OpenClaw](https://openclaw.com)** — AI agent platform
- **BSC Wallet** — With BNB (~0.005 for gas) + USDT (trading capital)
- **Browser** — For Aster DEX wallet connection & API key generation (manual steps)
- **Node.js 18+** — For setup and utility scripts

---

## 🦀 Part of CLAWSTER

CLAWSTER is an ecosystem for autonomous AI trading:

| Component | Description | Link |
|-----------|-------------|------|
| **clawster-skill** | OpenClaw skill for autonomous trading (this repo) | [GitHub](https://github.com/clawsteragent/clawster-skill) |
| **aster-mcp** | MCP server for Aster DEX API access | [GitHub](https://github.com/clawsteragent/aster-mcp) |

🌐 [clawster.com](https://clawster.com)

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
