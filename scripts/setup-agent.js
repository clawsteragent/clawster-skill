#!/usr/bin/env node
// Clawster Setup Script â€” Register ERC-8004 agent + configure Aster DEX trading
// Usage: node setup-agent.js
// Requires: npm install (ethers@6)

// â”€â”€â”€ Node.js Version Check â”€â”€â”€
const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  console.error(`\nâŒ Node.js 18+ is required (you have ${process.version}). Please upgrade.\n`);
  process.exit(1);
}

const { ethers } = require('ethers');
const crypto = require('crypto');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const BSC_RPC = 'https://bsc-dataseed.binance.org';
const CHAIN_ID = 56;
const REGISTRY_ADDRESS = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const REGISTRY_ABI = [
  'function register(string tokenURI) returns (uint256)',
  'function setTokenURI(uint256 tokenId, string tokenURI)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];
const ASTER_BASE_URL = 'https://fapi.asterdex.com/fapi/v1';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

/**
 * Read a private key from stdin with asterisk masking.
 * Falls back to plain input if raw mode is unavailable.
 */
function askPrivateKey(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
      // Fallback: plain input (e.g. piped stdin)
      const fallbackRl = readline.createInterface({ input: process.stdin, output: process.stdout });
      fallbackRl.question('', (answer) => { fallbackRl.close(); resolve(answer.trim()); });
      return;
    }
    let input = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const onData = (ch) => {
      if (ch === '\r' || ch === '\n') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(input.trim());
      } else if (ch === '\u007f' || ch === '\b') {
        // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else if (ch === '\u0003') {
        // Ctrl+C
        process.stdout.write('\n');
        process.exit(0);
      } else {
        input += ch;
        process.stdout.write('*');
      }
    };
    process.stdin.on('data', onData);
  });
}

/**
 * Validate a private key: must be 64 hex chars (with or without 0x prefix).
 * Returns the normalized key (with 0x prefix).
 */
function validatePrivateKey(key) {
  let normalized = key.startsWith('0x') ? key : '0x' + key;
  const hex = normalized.slice(2);
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    return null;
  }
  return normalized;
}

function sign(queryString, secret) {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

async function authFetch(apiPath, params, apiKey, apiSecret, method = 'GET') {
  params.timestamp = Date.now();
  const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const signature = sign(qs, apiSecret);
  const url = `${ASTER_BASE_URL}${apiPath}?${qs}&signature=${signature}`;
  const res = await fetch(url, { method, headers: { 'X-MBX-APIKEY': apiKey } });
  return res.json();
}

/**
 * Save config to TOOLS.md, replacing existing ### Clawster section if present.
 */
function saveConfig(toolsPath, config) {
  let existing = '';
  try { existing = fs.readFileSync(toolsPath, 'utf8'); } catch {}

  // Check for existing Clawster sections and replace them
  // Match ### Clawster (or ### Clawster Config, ### Clawster, ### Clawster Config, ### Aster DEX)
  const sectionPattern = /\n?### (?:Clawster|Clawster|Aster DEX)[\s\S]*?(?=\n### |\n---|\n## |$)/gi;
  if (sectionPattern.test(existing)) {
    // Remove all old sections
    existing = existing.replace(sectionPattern, '');
    // Trim trailing whitespace
    existing = existing.trimEnd();
  }

  fs.writeFileSync(toolsPath, existing + '\n' + config);
}

async function main() {
  console.log('\nðŸ¾ Clawster â€” Agent Setup\n');
  console.log('This script will:');
  console.log('  1. Register your agent on ERC-8004 (BSC)');
  console.log('  2. Guide you through Aster DEX wallet connection (manual)');
  console.log('  3. Guide you through API key generation (manual)');
  console.log('  4. Configure trading parameters\n');

  // â”€â”€â”€ Step 1: BSC Private Key â”€â”€â”€
  console.log('â”â”â” STEP 1: BSC Wallet â”â”â”\n');
  console.log('You need a BSC wallet with BNB for gas (~0.005 BNB).');
  console.log('This wallet becomes the OWNER of your agent\'s on-chain identity.\n');

  const rawKey = await askPrivateKey('BSC Private Key: ');
  if (!rawKey) {
    console.log('\nâŒ Private key is required.');
    rl.close();
    process.exit(1);
  }

  const privateKey = validatePrivateKey(rawKey);
  if (!privateKey) {
    console.log('\nâŒ Invalid private key. Must be 64 hex characters (with or without 0x prefix).');
    rl.close();
    process.exit(1);
  }

  // â”€â”€â”€ Step 2: Check BNB Balance â”€â”€â”€
  console.log('\nâ³ Connecting to BSC...');
  const provider = new ethers.JsonRpcProvider(BSC_RPC, { name: 'bnb', chainId: CHAIN_ID });
  let wallet;
  try {
    wallet = new ethers.Wallet(privateKey, provider);
  } catch (e) {
    console.log(`âŒ Invalid private key: ${e.message}`);
    rl.close();
    process.exit(1);
  }

  const address = wallet.address;
  console.log(`âœ… Wallet: ${address}`);

  const balance = await provider.getBalance(address);
  const bnbBalance = ethers.formatEther(balance);
  console.log(`âœ… BNB Balance: ${bnbBalance} BNB`);

  if (balance < ethers.parseEther('0.001')) {
    console.log('\nâŒ Insufficient BNB. You need at least 0.001 BNB for gas.');
    console.log(`   Send BNB to: ${address}`);
    rl.close();
    process.exit(1);
  }

  // â”€â”€â”€ Step 3: Register on ERC-8004 â”€â”€â”€
  console.log('\nâ”â”â” STEP 2: ERC-8004 Registration â”â”â”\n');

  const agentName = (await ask('Agent name (e.g. ClawTrader-001): ')).trim() || 'ClawTrader';
  const agentDesc = (await ask('Agent description (optional): ')).trim() || 'Autonomous perps trading agent on Aster DEX';

  const metadata = JSON.stringify({
    name: agentName,
    description: agentDesc,
    services: [
      {
        type: 'trading',
        platform: 'aster-dex',
        capabilities: ['perpetual-futures'],
      },
    ],
  });

  console.log(`\nâ³ Registering agent "${agentName}" on ERC-8004...`);
  console.log(`   Registry: ${REGISTRY_ADDRESS}`);
  console.log(`   Chain: BSC (${CHAIN_ID})`);

  const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, wallet);

  let agentId;
  try {
    const tx = await registry.register(metadata);
    console.log(`   TX Hash: ${tx.hash}`);
    console.log('   Waiting for confirmation...');

    const receipt = await tx.wait();

    // Extract agentId from Transfer event (mint: from=0x0)
    const transferEvent = receipt.logs.find((log) => {
      try {
        const parsed = registry.interface.parseLog({ topics: log.topics, data: log.data });
        return parsed && parsed.name === 'Transfer' && parsed.args[0] === ethers.ZeroAddress;
      } catch {
        return false;
      }
    });

    if (transferEvent) {
      const parsed = registry.interface.parseLog({ topics: transferEvent.topics, data: transferEvent.data });
      agentId = parsed.args[2].toString();
    } else {
      for (const log of receipt.logs) {
        try {
          const parsed = registry.interface.parseLog({ topics: log.topics, data: log.data });
          if (parsed && parsed.name === 'Transfer') {
            agentId = parsed.args[2].toString();
            break;
          }
        } catch {}
      }
    }

    if (!agentId) {
      console.log('\nâš ï¸  Transaction succeeded but could not extract agentId from logs.');
      console.log('   Check the transaction on BscScan for your token ID.');
      agentId = await ask('Enter your agentId manually: ');
    }

    console.log(`\nâœ… Agent #${agentId} registered on ERC-8004!`);
    console.log(`   Owner: ${address}`);
    console.log(`   BscScan: https://bscscan.com/tx/${tx.hash}`);
  } catch (e) {
    console.log(`\nâŒ Registration failed: ${e.message}`);
    const cont = await ask('\nContinue setup without registration? (y/n): ');
    if (cont.toLowerCase() !== 'y') {
      rl.close();
      process.exit(1);
    }
    agentId = await ask('Enter existing agentId (or leave blank): ');
  }

  // â”€â”€â”€ Step 3: Connect Wallet to Aster DEX (Manual) â”€â”€â”€
  console.log('\nâ”â”â” STEP 3: Connect Wallet to Aster DEX (MANUAL) â”â”â”\n');
  console.log('Connect your BSC wallet to Aster DEX:');
  console.log(`  1. Go to https://asterdex.com`);
  console.log(`  2. Connect wallet: ${address}`);
  console.log('  3. Approve the signature request');
  console.log('  4. Deposit USDT (BEP-20) via the Aster DEX interface');
  console.log('');
  await ask('Press Enter when done...');

  // â”€â”€â”€ Step 4: Generate API Key (MANUAL) â”€â”€â”€
  console.log('\nâ”â”â” STEP 4: Generate Aster API Key (MANUAL) â”â”â”\n');
  console.log('â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
  console.log('â•‘  âš ï¸  THIS STEP MUST BE DONE MANUALLY IN YOUR BROWSER   â•‘');
  console.log('â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£');
  console.log('â•‘                                                          â•‘');
  console.log('â•‘  1. Go to: https://www.asterdex.com/en/api-management           â•‘');
  console.log('â•‘  2. Click "ENABLE FUTURES"                                â•‘');
  console.log('â•‘  3. Click Save / Approve                                 â•‘');
  console.log('â•‘  4. Copy the API Key and Secret                          â•‘');
  console.log('â•‘                                                          â•‘');
  console.log('â•‘  âš ï¸  SECRET IS SHOWN ONLY ONCE! Copy it immediately!    â•‘');
  console.log('â•‘                                                          â•‘');
  console.log('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('');

  // â”€â”€â”€ Step 5: Aster API Credentials â”€â”€â”€
  console.log('\nâ”â”â” STEP 5: Aster API Credentials â”â”â”\n');
  const apiKey = (await ask('Aster DEX API Key (or leave blank to skip): ')).trim();
  const apiSecret = apiKey ? (await ask('Aster DEX API Secret: ')).trim() : '';

  if (apiKey && apiSecret) {
    console.log('\nâ³ Testing Aster DEX connection...');
    try {
      const ping = await fetch(`${ASTER_BASE_URL}/ping`);
      if (!ping.ok) throw new Error(`HTTP ${ping.status}`);
      console.log('âœ… Aster DEX is reachable');
    } catch (e) {
      console.log(`âŒ Cannot reach Aster DEX: ${e.message}`);
    }

    console.log('â³ Testing API credentials...');
    try {
      const account = await authFetch('/account', {}, apiKey, apiSecret);
      if (account.code && account.code < 0) {
        console.log(`âŒ Auth failed: ${account.msg}`);
      } else {
        console.log(`âœ… Authenticated â€” Balance: ${account.totalWalletBalance || '0'} USDT`);
      }
    } catch (e) {
      console.log(`âŒ Auth error: ${e.message}`);
    }
  } else {
    console.log('â³ Skipping API test â€” add credentials to TOOLS.md later.');
  }

  // â”€â”€â”€ Step 6: Configure Trading Parameters â”€â”€â”€
  console.log('\nâ”â”â” STEP 6: Trading Configuration â”â”â”\n');

  try {
    const info = await (await fetch(`${ASTER_BASE_URL}/exchangeInfo`)).json();
    const symbols = (info.symbols || [])
      .filter((s) => s.contractType === 'PERPETUAL')
      .map((s) => s.symbol);
    console.log(`ðŸ“Š Available perpetual pairs (${symbols.length}):`);
    console.log(symbols.slice(0, 20).join(', ') + (symbols.length > 20 ? '...' : ''));
    console.log('');
  } catch (e) {
    console.log(`âš ï¸  Could not fetch pairs: ${e.message}\n`);
  }

  const pairs = await ask('Trading pairs (comma-separated, e.g. BTCUSDT,ETHUSDT): ');
  const leverage = (await ask('Max leverage (default 10): ')) || '10';
  const maxSize = (await ask('Max position size % of account (default 20): ')) || '20';
  const maxPositions = (await ask('Max concurrent positions (default 3): ')) || '3';
  const dailyLoss = (await ask('Daily loss limit % (default 5): ')) || '5';

  console.log('\nAvailable strategies:');
  console.log('  1. Momentum Scalper (5-15m, high frequency)');
  console.log('  2. Trend Follower (1h-4h, ride big moves)');
  console.log('  3. Mean Reversion (15m-1h, fade extremes)');
  console.log('  4. Funding Rate Arbitrage (8h, collect funding)');
  const stratChoice = (await ask('Choose strategy (1-4, default 2): ')) || '2';
  const strategies = { '1': 'Momentum Scalper', '2': 'Trend Follower', '3': 'Mean Reversion', '4': 'Funding Rate Arbitrage' };
  const strategy = strategies[stratChoice] || 'Trend Follower';

  // â”€â”€â”€ Step 7: Save to TOOLS.md â”€â”€â”€
  const config = `
### Clawster
- BSC Wallet: \`${address}\`
- Agent ID: ${agentId || 'unknown'}${apiKey ? `
- Aster API Key: \`${apiKey}\`
- Aster API Secret: \`${apiSecret}\`` : `
- Aster API Key: (generate at https://www.asterdex.com/en/api-management)
- Aster API Secret: (generate at https://www.asterdex.com/en/api-management)`}

### Clawster Config
- trading_pairs: ${pairs.trim() || 'BTCUSDT, ETHUSDT'}
- max_leverage: ${leverage}
- max_position_pct: ${maxSize}
- max_concurrent: ${maxPositions}
- stop_loss: required
- daily_loss_pct: ${dailyLoss}
- max_drawdown_pct: 15
- max_risk_per_trade: 2
- cooldown_after_losses: 3
- cooldown_minutes: 60
- max_daily_trades: 50
- strategy: ${strategy}
`;

  const toolsPath = path.resolve(process.env.OPENCLAW_WORKSPACE || '.', 'TOOLS.md');
  const saveChoice = (await ask(`\nSave config to ${toolsPath}? (y/n, default y): `)) || 'y';

  if (saveChoice.toLowerCase() === 'y') {
    try {
      saveConfig(toolsPath, config);
      console.log(`\nâœ… Config saved to ${toolsPath}`);
    } catch (e) {
      console.log(`\nâš ï¸  Could not save: ${e.message}`);
      console.log('\nManually add this to your TOOLS.md:');
      console.log(config);
    }
  } else {
    console.log('\nAdd this to your TOOLS.md:');
    console.log(config);
  }

  console.log('\nâ”â”â” SETUP COMPLETE â”â”â”\n');
  console.log(`ðŸ¾ Agent #${agentId || '?'} is configured for Aster DEX trading!`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Make sure your wallet has USDT deposited on Aster DEX');
  console.log('  2. Run `node scripts/check-balance.js` to verify');
  console.log('  3. Start trading!\n');
  rl.close();
}

main().catch((e) => {
  console.error(e);
  rl.close();
  process.exit(1);
});
