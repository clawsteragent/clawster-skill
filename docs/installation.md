# Installation

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Node.js | v22 or later |
| OpenClaw | Installed and running (`openclaw gateway status`) |
| BSC Wallet | With ~0.005 BNB for gas (for new agent registration) |
| Aster DEX Account | API key and secret from [asterdex.com](https://asterdex.com) |

## Install

```bash
git clone https://github.com/clawsteragent/clawster-skill.git
cd clawster-skill
node install.js
```

**Windows**: double-click `install.bat` or run `node install.js`
**Mac/Linux**: `chmod +x install.sh && ./install.sh` or `node install.js`

### What the installer does

1. **Registers your agent on ERC-8004** (BSC) — creates an on-chain identity, or lets you enter an existing Agent ID
2. **Copies all 13 Aster API skills** + the Clawster agent skill into `~/.openclaw/skills/`
3. **Runs `npm install`** for Clawster's Node.js dependencies
4. **Prompts for Aster API credentials** (key and secret)
5. **Saves config** to `~/.openclaw/skills/clawster/.env`:
   - `AGENT_ID`
   - `ASTER_API_KEY`
   - `ASTER_API_SECRET`
   - `BSC_PRIVATE_KEY` (optional)

### Restart the gateway

```bash
openclaw gateway restart
```

Skills are loaded on gateway startup. You must restart for new skills to take effect.

## Verification

After restarting, confirm skills are loaded:

1. Open a chat with your agent
2. Ask: "What skills do you have available?"
3. You should see `CLAWSTER` and all `aster-api-*` skills listed

Alternatively, check the skills directory:

```bash
ls ~/.openclaw/skills/
```

You should see:
```
clawster/
aster-api-account-v1/
aster-api-account-v3/
aster-api-auth-v1/
aster-api-auth-v3/
aster-api-errors-v1/
aster-api-errors-v3/
aster-api-market-data-v1/
aster-api-market-data-v3/
aster-api-trading-v1/
aster-api-trading-v3/
aster-api-websocket-v1/
aster-api-websocket-v3/
aster-deposit-fund/
```

## Uninstall

```bash
node install.js --uninstall
openclaw gateway restart
```

This removes all Clawster and Aster skills from `~/.openclaw/skills/`. Your `.env` credentials and any state files in `memory/` are not deleted.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `node install.js` fails with permission error | Run as administrator (Windows) or with `sudo` (Linux/Mac) |
| ERC-8004 registration fails | Ensure your BSC wallet has ~0.005 BNB for gas. Check your private key is correct. |
| Skills not showing after restart | Verify files exist in `~/.openclaw/skills/`. Run `openclaw gateway restart` again. |
| API credentials rejected | Regenerate your API key/secret on [asterdex.com](https://asterdex.com). Update `~/.openclaw/skills/clawster/.env`. |
| `npm install` fails | Check Node.js version (`node -v` should be 22+). Delete `node_modules` and retry. |
| Agent doesn't trade | Check [Configuration](configuration.md) — ensure `### Clawster Config` exists in TOOLS.md with valid parameters. |
