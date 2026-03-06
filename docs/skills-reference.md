# Skills Reference

Clawster installs 13 Aster API skills plus the Clawster agent skill. All skills come from the [Aster Skills Hub](https://github.com/asterdex/aster-skills-hub).

## All Skills

| Skill | Domain | Description |
|-------|--------|-------------|
| [`aster-api-account-v1`](https://github.com/asterdex/aster-skills-hub/tree/main/skills/aster-api-account-v1) | Account | Balance, positions, account info (HMAC auth) |
| [`aster-api-account-v3`](https://github.com/asterdex/aster-skills-hub/tree/main/skills/aster-api-account-v3) | Account | Balance, positions, account info (EIP-712 auth) |
| [`aster-api-auth-v1`](https://github.com/asterdex/aster-skills-hub/tree/main/skills/aster-api-auth-v1) | Auth | HMAC request signing, headers, timestamps |
| [`aster-api-auth-v3`](https://github.com/asterdex/aster-skills-hub/tree/main/skills/aster-api-auth-v3) | Auth | EIP-712 wallet signing, typed data |
| [`aster-api-errors-v1`](https://github.com/asterdex/aster-skills-hub/tree/main/skills/aster-api-errors-v1) | Errors | Error codes, rate limits, retry logic (v1) |
| [`aster-api-errors-v3`](https://github.com/asterdex/aster-skills-hub/tree/main/skills/aster-api-errors-v3) | Errors | Error codes, rate limits, retry logic (v3) |
| [`aster-api-market-data-v1`](https://github.com/asterdex/aster-skills-hub/tree/main/skills/aster-api-market-data-v1) | Market Data | Prices, klines, depth, funding rates (v1) |
| [`aster-api-market-data-v3`](https://github.com/asterdex/aster-skills-hub/tree/main/skills/aster-api-market-data-v3) | Market Data | Prices, klines, depth, funding rates (v3) |
| [`aster-api-trading-v1`](https://github.com/asterdex/aster-skills-hub/tree/main/skills/aster-api-trading-v1) | Trading | Place, cancel, modify orders (HMAC auth) |
| [`aster-api-trading-v3`](https://github.com/asterdex/aster-skills-hub/tree/main/skills/aster-api-trading-v3) | Trading | Place, cancel, modify orders (EIP-712 auth) |
| [`aster-api-websocket-v1`](https://github.com/asterdex/aster-skills-hub/tree/main/skills/aster-api-websocket-v1) | WebSocket | Real-time streams: price, depth, positions (v1) |
| [`aster-api-websocket-v3`](https://github.com/asterdex/aster-skills-hub/tree/main/skills/aster-api-websocket-v3) | WebSocket | Real-time streams: price, depth, positions (v3) |
| [`aster-deposit-fund`](https://github.com/asterdex/aster-skills-hub/tree/main/skills/aster-deposit-fund) | Deposit | Deposit funds to Aster DEX from BSC wallet |

## v1 vs v3

The Aster API supports two authentication methods, reflected in the skill versions:

| Version | Auth Method | What You Need | Best For |
|---------|-------------|---------------|----------|
| **v1** | HMAC-SHA256 | API key + API secret | Standard setup. Simpler. Default for Clawster. |
| **v3** | EIP-712 | BSC wallet private key | On-chain identity workflows, wallet-native signing. |

### When to use which

- **Use v1** (default) if you have an Aster API key and secret. This is the standard path. All Clawster defaults use v1 skills.
- **Use v3** if your setup requires EIP-712 wallet-based signing (e.g., you want trades signed by your BSC wallet directly instead of using API credentials).

Both versions cover the same API endpoints. The only difference is how requests are authenticated.

## How Clawster Uses Skills

The Clawster agent skill reads API skills **on demand** — it doesn't memorize their contents. The mapping:

| Agent needs to... | Reads skill |
|-------------------|-------------|
| Sign an API request | `aster-api-auth-v1` |
| Place or cancel an order | `aster-api-trading-v1` |
| Get prices, klines, funding | `aster-api-market-data-v1` |
| Check balance or positions | `aster-api-account-v1` |
| Handle API errors | `aster-api-errors-v1` |
| Set up real-time streams | `aster-api-websocket-v1` |
| Deposit funds | `aster-deposit-fund` |

See [Architecture](architecture.md) for the full dependency diagram.

## Aster MCP Server

[aster-mcp](https://github.com/asterdex/aster-mcp) is an optional MCP (Model Context Protocol) server for Aster DEX. If installed, it provides tool functions like `aster_price`, `aster_place_order`, etc. that the agent can call directly instead of making raw HTTP requests.

Clawster works with or without the MCP server. If MCP tools are available, the agent prefers them.
