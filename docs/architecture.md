# Architecture

## Overview

```
┌──────────┐     ┌──────────────┐     ┌─────────────────────┐
│   User   │────▶│   OpenClaw   │────▶│  SKILL.md (clawster) │
│ or Cron  │     │   Gateway    │     │  "The Brain"         │
└──────────┘     └──────────────┘     └──────────┬──────────┘
                                                  │ reads on demand
                                      ┌───────────┼───────────┐
                                      ▼           ▼           ▼
                                ┌──────────┐ ┌──────────┐ ┌──────────┐
                                │aster-api-│ │aster-api-│ │aster-api-│
                                │trading-v1│ │market-   │ │account-  │
                                │          │ │data-v1   │ │v1        │
                                └─────┬────┘ └─────┬────┘ └─────┬────┘
                                      │            │            │
                                      ▼            ▼            ▼
                                ┌─────────────────────────────────┐
                                │      Aster DEX REST API         │
                                │   https://fapi.asterdex.com     │
                                └─────────────────────────────────┘
```

## Skill Dependency Model

Clawster uses a **brain + manuals** architecture:

- **`clawster/SKILL.md`** — the brain. Contains the trading loop, risk engine, strategy logic, and state management. It tells the agent *what* to do.
- **`aster-api-*/SKILL.md`** — the API manuals. Each skill documents a specific Aster DEX API domain (auth, trading, market data, etc.). They tell the agent *how* to call the API.

The clawster skill **reads** API skills on demand — it doesn't duplicate their content. When the agent needs to place an order, it reads `aster-api-trading-v1`. When it needs to sign a request, it reads `aster-api-auth-v1`.

This separation means API skills can be updated independently of the trading logic.

## File Locations

After installation, all files live under your OpenClaw home directory:

```
~/.openclaw/
├── skills/
│   ├── clawster/
│   │   ├── SKILL.md           ← Trading agent definition
│   │   ├── package.json       ← Node.js dependencies
│   │   ├── scripts/           ← Setup utilities
│   │   ├── node_modules/      ← Installed dependencies
│   │   └── .env               ← API credentials
│   ├── aster-api-account-v1/
│   │   └── SKILL.md           ← Account API reference
│   ├── aster-api-trading-v1/
│   │   └── SKILL.md           ← Trading API reference
│   └── ... (13 skills total)
├── workspace/
│   ├── TOOLS.md               ← Config lives here (### Clawster Config)
│   └── memory/
│       ├── clawster-state.json ← Runtime state
│       └── trade-log.jsonl ← Trade log (JSONL format)
```

## Data Flow

| Data | Location | Purpose |
|------|----------|---------|
| Config | `TOOLS.md` → `### Clawster Config` | Trading parameters, read each cycle |
| Credentials | `~/.openclaw/skills/clawster/.env` | API key, secret, agent ID |
| Runtime state | `memory/clawster-state.json` | Positions, PnL, cooldowns |
| Trade logs | `memory/trade-log.jsonl` | Full trade history (JSONL format) |
| Long-term memory | `MEMORY.md` | Weekly summaries, strategy learnings |

## Request Flow

1. Cron/heartbeat/user triggers the trading loop
2. OpenClaw activates the `CLAWSTER` skill
3. Agent reads config from TOOLS.md
4. Agent reads `aster-api-auth-v1` to learn how to sign requests
5. Agent reads `aster-api-account-v1` and calls balance/position endpoints
6. Agent reads `aster-api-market-data-v1` and fetches price data
7. Agent applies strategy, decides on trade
8. Agent reads `aster-api-trading-v1` and places order
9. Agent writes results to `memory/`

See [Trading Loop](trading-loop.md) for the full 10-step cycle.
