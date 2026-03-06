```
   ▄████▄   ██▓    ▄▄▄       █     █░  ██████ ▄▄▄█████▓▓█████  ██▀███  
  ▒██▀ ▀█  ▓██▒   ▒████▄    ▓█░ █ ░█░▒██    ▒ ▓  ██▒ ▓▒▓█   ▀ ▓██ ▒ ██▒
  ▒▓█    ▄ ▒██░   ▒██  ▀█▄  ▒█░ █ ░█ ░ ▓██▄   ▒ ▓██░ ▒░▒███   ▓██ ░▄█ ▒
  ▒▓▓▄ ▄██▒▒██░   ░██▄▄▄▄██ ░█░ █ ░█   ▒   ██▒░ ▓██▓ ░ ▒▓█  ▄ ▒██▀▀█▄  
  ▒ ▓███▀ ░░██████▒▓█   ▓██▒░░██▒██▓ ▒██████▒▒  ▒██▒ ░ ░▒████▒░██▓ ▒██▒
  ░ ░▒ ▒  ░░ ▒░▓  ░▒▒   ▓▒█░░ ▓░▒ ▒  ▒ ▒▓▒ ▒ ░  ▒ ░░   ░░ ▒░ ░░ ▒▓ ░▒▓░
    ░  ▒   ░ ░ ▒  ░ ▒   ▒▒ ░  ▒ ░ ░  ░ ░▒  ░ ░    ░     ░ ░  ░  ░▒ ░ ▒░
  ░          ░ ░    ░   ▒     ░   ░  ░  ░  ░    ░         ░     ░░   ░ 
  ░ ░          ░  ░     ░  ░    ░          ░              ░  ░   ░     
  ░                                                                    
```

[![OpenClaw](https://img.shields.io/badge/OpenClaw-Compatible-blue.svg)](https://openclaw.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Aster DEX](https://img.shields.io/badge/Aster_DEX-Trading-purple.svg)](https://asterdex.com)
[![ERC-8004](https://img.shields.io/badge/ERC--8004-Registered-orange.svg)](https://eips.ethereum.org/EIPS/eip-8004)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Autonomous perpetual futures trading for AI agents**

🌐 **Website**: [clawster.org](https://clawster.org)

---

## 🎯 Features

🤖 **Autonomous Trading** — No human intervention required  
📊 **Multi-Market Support** — Trade BTC, ETH, and more perpetual futures  
🛡️ **Risk Management** — Hard-coded safety limits and position sizing  
⚡ **Real-time Execution** — WebSocket streaming for instant market response  
🔐 **ERC-8004 Compliant** — Blockchain-registered AI agent identity  
📈 **Strategy Engine** — Trend following, scalping, and custom strategies  
💰 **P&L Tracking** — Comprehensive profit/loss monitoring  
🔄 **Auto-rebalancing** — Dynamic position management  

## 🏗️ Architecture

Clawster follows a **"brain + manuals"** architecture:

### 🧠 The Brain
- **`SKILL.md`** — Core trading logic, risk management, and state machine
- Main decision engine that orchestrates all trading operations

### 📚 The Manuals  
- **13 aster-api-* skills** — API reference documentation loaded on demand
- Sourced from [asterdex/aster-skills-hub](https://github.com/asterdex/aster-skills-hub)
- Includes authentication, market data, trading, websockets, and error handling

This separation ensures the core logic stays focused while API details remain modular and updateable.

## 🚀 Quick Start

### 1. Clone & Enter
```bash
git clone https://github.com/clawsteragent/clawster-skill.git
cd clawster-skill
```

### 2. Install & Configure  
```bash
node install.js
```
This handles:
- ERC-8004 agent registration on BSC
- Cloning of aster-api-* skills from GitHub
- npm dependency installation
- .env configuration setup

### 3. Start Trading
```bash
openclaw gateway restart
# Chat with Clawster to begin trading!
```

## 📦 Installation Details

The `install.js` script performs these operations:

1. **ERC-8004 Registration**
   - Registers your agent identity on Binance Smart Chain
   - Creates immutable on-chain proof of AI agent existence
   - Requires ~0.005 BNB for gas fees

2. **Skill Dependencies**  
   - Clones 13 aster-api-* skills from [aster-skills-hub](https://github.com/asterdex/aster-skills-hub)
   - Installs to `~/.openclaw/skills/` directory
   - Skills loaded dynamically as needed

3. **Dependencies**
   - Runs `npm install --production` 
   - Installs ethers.js for blockchain interactions
   - Sets up secure file permissions

4. **Environment Setup**
   - Creates `.env` with API credentials
   - Configures trading parameters
   - Sets secure file permissions (600 on Unix systems)

## ⚙️ Configuration

Edit your configuration in `TOOLS.md` under `### Clawster Config`:

```markdown
### Clawster Config
- agent_id: 12345
- trading_pairs: BTCUSDT,ETHUSDT,SOLUSDT
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

### Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `agent_id` | *(required)* | ERC-8004 agent ID from registration |
| `trading_pairs` | `BTCUSDT,ETHUSDT` | Comma-separated trading pairs |
| `max_leverage` | `10` | Maximum leverage multiplier |
| `max_position_pct` | `20` | Max position size as % of balance |
| `max_concurrent` | `3` | Max simultaneous open positions |
| `stop_loss` | `required` | Force stop-loss on all trades |
| `daily_loss_pct` | `5` | Daily loss limit (% of balance) |
| `max_drawdown_pct` | `15` | Maximum portfolio drawdown |
| `max_risk_per_trade` | `2` | Risk per trade (% of balance) |
| `cooldown_after_losses` | `3` | Consecutive losses before cooldown |
| `cooldown_minutes` | `60` | Minutes to wait after loss streak |
| `max_daily_trades` | `50` | Maximum trades per day |
| `strategy` | `trend_follower` | Trading strategy name |

## 🛡️ Risk Management

Clawster enforces **hard-coded safety limits** that cannot be overridden:

### Position Limits
- ✅ Max 20% of balance per position
- ✅ Max 3 concurrent positions  
- ✅ Max 10x leverage
- ✅ Mandatory stop-loss on all trades

### Daily Limits  
- ✅ 5% daily loss limit (auto-shutdown)
- ✅ 50 maximum trades per day
- ✅ 3-strike cooldown system

### Portfolio Protection
- ✅ 15% maximum drawdown limit
- ✅ Emergency liquidation at risk limits
- ✅ Real-time P&L monitoring

## 🔄 Trading Loop

Clawster operates in a continuous cycle:

```
🔍 SCAN → 📊 ANALYZE → ⚡ EXECUTE → 👁️ MONITOR → 🚪 EXIT
    ↑                                                  ↓
    ←←←←←←←←←← REPEAT ←←←←←←←←←←←←←←←←←←←←←←←←←←
```

### 1. 🔍 **Scan Markets**
- Fetch real-time price data
- Calculate technical indicators
- Identify trading opportunities

### 2. 📊 **Analyze Signals**  
- Apply strategy rules (trend following, scalping, etc.)
- Risk assessment and position sizing
- Entry/exit point calculation

### 3. ⚡ **Execute Orders**
- Place orders via Aster DEX API
- Real-time order management
- Immediate confirmation handling

### 4. 👁️ **Monitor Positions**
- Track P&L in real-time
- Adjust stop-losses dynamically  
- Risk limit enforcement

### 5. 🚪 **Exit Strategy**
- Take profit at targets
- Stop-loss execution
- Emergency position closure

## 🛠️ Scripts

### Balance Checker
```bash
node scripts/check-balance.js
```
- Displays current USDT balance on Aster DEX
- Shows available margin and position status
- Verifies API connectivity

## 📚 Documentation

Comprehensive documentation available in [`docs/`](docs/):

| Document | Description |
|----------|-------------|
| [`architecture.md`](docs/architecture.md) | System design and component overview |
| [`configuration.md`](docs/configuration.md) | Complete configuration reference |
| [`cron-and-automation.md`](docs/cron-and-automation.md) | Automated trading schedules |
| [`erc-8004.md`](docs/erc-8004.md) | Blockchain agent registration |
| [`index.md`](docs/index.md) | Documentation index and quick links |
| [`installation.md`](docs/installation.md) | Detailed installation guide |
| [`memory-and-state.md`](docs/memory-and-state.md) | State management and persistence |
| [`risk-management.md`](docs/risk-management.md) | Risk controls and safety systems |
| [`skills-reference.md`](docs/skills-reference.md) | API skills reference guide |
| [`trading-loop.md`](docs/trading-loop.md) | Trading algorithm deep dive |

## 🔐 Authentication

Clawster supports two authentication methods:

### v1 Authentication (Default - HMAC)
- Uses API key + secret for HMAC-SHA256 signatures
- Recommended for most users
- Configured via environment variables

### v3 Authentication (EIP-712 Wallet)  
- Uses Ethereum wallet for cryptographic signatures
- Advanced users with wallet integration
- Requires additional setup

**Default:** v1 HMAC authentication is used unless explicitly configured otherwise.

## 🔗 Links

- **🌐 Website**: [clawster.org](https://clawster.org)
- **⚙️ OpenClaw**: [openclaw.com](https://openclaw.com)  
- **📈 Aster DEX**: [asterdex.com](https://asterdex.com)
- **🔗 ERC-8004 Standard**: [eips.ethereum.org/EIPS/eip-8004](https://eips.ethereum.org/EIPS/eip-8004)
- **📚 Skills Hub**: [github.com/asterdex/aster-skills-hub](https://github.com/asterdex/aster-skills-hub)
- **📊 BSC Explorer**: [bscscan.com](https://bscscan.com)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request

### Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all safety limits remain intact

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>⚡ Ready to trade autonomously? Let Clawster handle the markets while you sleep. ⚡</strong>
</p>

<p align="center">
  Made with 🤖 by the Clawster team
</p>