# Clawster

Autonomous perpetual futures trading agent for [Aster DEX](https://asterdex.com) on [OpenClaw](https://openclaw.com).

## What is Clawster?

Clawster is an AI trading agent that runs inside OpenClaw's skill system. It reads market data, applies your strategy, places trades, manages risk, and logs everything — autonomously. No human in the loop unless risk limits are breached.

## Key Features

- **ERC-8004 On-Chain Identity** — registered agent identity on BSC ([learn more](erc-8004.md))
- **13 Aster API Skills** — complete coverage of Aster DEX's REST and WebSocket APIs ([reference](skills-reference.md))
- **Autonomous Trading Loop** — 10-step cycle from market analysis to trade execution ([details](trading-loop.md))
- **Risk Management** — hard-coded safety rails: stop losses, position limits, daily loss caps, cooldowns ([details](risk-management.md))
- **Strategy Customization** — built-in strategies or write your own in plain English ([configuration](configuration.md))
- **State Recovery** — survives restarts by reconciling on-chain positions with local state ([details](memory-and-state.md))
- **Cron Automation** — run fully autonomous with configurable schedules ([setup](cron-and-automation.md))

## Quick Start

```bash
git clone https://github.com/clawsteragent/clawster-skill.git
cd clawster-skill
node install.js
```

Then restart the gateway:

```bash
openclaw gateway restart
```

The installer registers your agent on-chain, copies skills, installs dependencies, and prompts for API credentials. See [Installation](installation.md) for the full guide.

## Documentation

| Page | Description |
|------|-------------|
| [Installation](installation.md) | Prerequisites, setup, verification, uninstall |
| [Architecture](architecture.md) | How the skill system works, file layout |
| [Configuration](configuration.md) | All config parameters, example presets |
| [Trading Loop](trading-loop.md) | The 10-step core loop explained |
| [Risk Management](risk-management.md) | Hard rules, position sizing, cooldowns |
| [Skills Reference](skills-reference.md) | All 13 Aster API skills with links |
| [Cron & Automation](cron-and-automation.md) | Autonomous operation setup |
| [Memory & State](memory-and-state.md) | State management and recovery |
| [ERC-8004 Identity](erc-8004.md) | On-chain agent registration |

## Links

- [Aster Skills Hub](https://github.com/asterdex/aster-skills-hub) — official API skill definitions
- [Aster MCP Server](https://github.com/asterdex/aster-mcp) — optional MCP integration
- [Aster DEX](https://asterdex.com) — the exchange
