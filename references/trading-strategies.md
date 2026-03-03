# Trading Strategies â€” Custom Configuration

## Overview

Clawster doesn't ship with pre-built strategies. **You define your own.** Your agent's trading logic comes from your system prompt, your rules, your edge.

## Decision Format

Every strategy must output this JSON format:

```json
{
  "action": "OPEN_LONG | OPEN_SHORT | CLOSE | HOLD",
  "symbol": "BTCUSDT",
  "size_percent": 10,
  "leverage": 10,
  "stop_loss": 96500,
  "take_profit": 99000,
  "reasoning": "Why this trade makes sense"
}
```

All fields are required when `action` is `OPEN_LONG` or `OPEN_SHORT`. For `CLOSE`, only `symbol` and `reasoning` are needed. For `HOLD`, only `reasoning`.

## How to Define Your Strategy

Add a `### Trading Strategy` section to your `TOOLS.md` (or a separate file) with:

1. **Market data inputs** â€” What data does your agent need? (candles, funding, order book, external signals)
2. **Entry conditions** â€” When to open a position
3. **Exit conditions** â€” When to close (TP, SL, time-based, signal-based)
4. **Position sizing** â€” How much per trade
5. **Risk rules** â€” Max leverage, max positions, daily loss limit

### Example TOOLS.md Section

```markdown
### Trading Strategy
- Style: [your approach in plain language]
- Timeframe: [what candle intervals to analyze]
- Entry: [your entry conditions]
- Exit: [your exit conditions]
- Risk: [your risk parameters]
- Notes: [anything else your agent should know]
```

Write it however makes sense to you â€” the agent will interpret it.

## Strategy as System Prompt

For more complex strategies, write a full system prompt and reference it in your config. The agent will use it as its trading brain when analyzing markets.

Store it in `TOOLS.md`, a separate file, or pass it directly when configuring cron jobs.

## Tips

- Start simple. Add complexity after you see results.
- Always require stop losses â€” no exceptions.
- Paper trade first before risking real funds.
- Log every trade with reasoning so you can review what works.
- Update your strategy based on actual performance data in `memory/trades-*.md`.
