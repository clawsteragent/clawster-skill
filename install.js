#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');

// ── ANSI Colors ──
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const log = {
  info: (msg) => console.log(`${C.cyan}ℹ${C.reset} ${msg}`),
  ok: (msg) => console.log(`${C.green}✔${C.reset} ${msg}`),
  warn: (msg) => console.log(`${C.yellow}⚠${C.reset} ${msg}`),
  err: (msg) => console.log(`${C.red}✖${C.reset} ${msg}`),
  step: (msg) => console.log(`\n${C.bold}${C.magenta}▸ ${msg}${C.reset}`),
};

const SKILLS = [
  'aster-api-account-v1', 'aster-api-account-v3',
  'aster-api-auth-v1', 'aster-api-auth-v3',
  'aster-api-errors-v1', 'aster-api-errors-v3',
  'aster-api-market-data-v1', 'aster-api-market-data-v3',
  'aster-api-trading-v1', 'aster-api-trading-v3',
  'aster-api-websocket-v1', 'aster-api-websocket-v3',
  'aster-deposit-fund',
];

const ERC8004_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const SRC_DIR = __dirname;
const HOME = os.homedir();
const SKILLS_DIR = path.join(HOME, '.openclaw', 'skills');
const ENV_FILE = path.join(SKILLS_DIR, 'clawster', '.env');

// ── Helpers ──

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      copyDirSync(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function rmDirSync(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

/**
 * Ask for sensitive input (private keys etc). Masks echo with asterisks.
 */
function askSecret(rl, question) {
  return new Promise((resolve) => {
    const output = rl.output;
    let secret = '';
    output.write(question);
    const wasRaw = process.stdin.isRaw;
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    const onData = (ch) => {
      const c = ch.toString('utf8');
      if (c === '\n' || c === '\r' || c === '\u0004') {
        if (process.stdin.isTTY) process.stdin.setRawMode(wasRaw || false);
        process.stdin.removeListener('data', onData);
        output.write('\n');
        resolve(secret);
      } else if (c === '\u0003') {
        // Ctrl+C
        process.exit(1);
      } else if (c === '\u007f' || c === '\b') {
        if (secret.length > 0) {
          secret = secret.slice(0, -1);
          output.write('\b \b');
        }
      } else {
        secret += c;
        output.write('*');
      }
    };
    process.stdin.on('data', onData);
  });
}

function dirExists(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function fileExists(p) { try { return fs.statSync(p).isFile(); } catch { return false; } }

function parseEnv(filepath) {
  const env = {};
  if (!fileExists(filepath)) return env;
  for (const line of fs.readFileSync(filepath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

function writeEnv(filepath, obj) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  const content = Object.entries(obj).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
  fs.writeFileSync(filepath, content, 'utf8');
}

// ── Uninstall ──

function uninstall() {
  console.log(`\n${C.bold}${C.red}🗑  Clawster Uninstaller${C.reset}\n`);

  const allDirs = [...SKILLS.map(s => path.join(SKILLS_DIR, s)), path.join(SKILLS_DIR, 'clawster')];
  let removed = 0;

  for (const dir of allDirs) {
    if (dirExists(dir)) {
      rmDirSync(dir);
      log.ok(`Removed ${C.dim}${dir}${C.reset}`);
      removed++;
    }
  }

  if (removed === 0) {
    log.info('Nothing to remove — already clean.');
  } else {
    log.ok(`${C.bold}Removed ${removed} skill(s).`);
    log.info(`Run ${C.cyan}openclaw gateway restart${C.reset} to apply.`);
  }
}

// ── Step 1: ERC-8004 Agent Registration ──

async function stepERC8004(rl, env) {
  log.step('Step 1: ERC-8004 Agent Registration');
  console.log(`${C.dim}Every Clawster agent needs an on-chain identity on BSC.${C.reset}\n`);

  // Check if we already have an agent ID in env
  if (env.AGENT_ID && env.AGENT_ID.length > 0) {
    log.info(`Existing Agent ID found: ${C.bold}${env.AGENT_ID}${C.reset}`);
    const ans = await ask(rl, `${C.yellow}?${C.reset} Update Agent ID? [y/N] `);
    if (!ans || !ans.toLowerCase().startsWith('y')) {
      log.ok(`Keeping Agent ID: ${env.AGENT_ID}`);
      return env.AGENT_ID;
    }
  }

  const hasAgent = await ask(rl, `${C.cyan}?${C.reset} Do you already have an ERC-8004 Agent ID? [y/N] `);

  if (hasAgent && hasAgent.toLowerCase().startsWith('y')) {
    // Existing agent ID
    const agentIdStr = await ask(rl, `${C.cyan}?${C.reset} Agent ID (number): `);
    const agentId = parseInt(agentIdStr.trim(), 10);
    if (isNaN(agentId) || agentId <= 0) {
      log.err('Invalid Agent ID — must be a positive number.');
      process.exit(1);
    }
    log.ok(`Agent ID: ${C.bold}${agentId}${C.reset}`);
    return String(agentId);
  }

  // Register new agent
  console.log('');
  log.info('You need a BSC wallet to register an agent on-chain.');
  log.info('This creates your agent\'s identity on ERC-8004.');
  log.info(`Gas required: ~0.005 BNB`);
  log.info(`Registry: ${C.dim}${ERC8004_REGISTRY}${C.reset}\n`);

  let privateKey;
  try {
    privateKey = await askSecret(rl, `${C.cyan}?${C.reset} BSC Private Key (hidden): `);
  } catch {
    // Fallback if TTY masking fails
    privateKey = await ask(rl, `${C.cyan}?${C.reset} BSC Private Key: `);
  }
  privateKey = privateKey.trim();

  if (!privateKey) {
    log.err('Private key is required for registration.');
    process.exit(1);
  }

  // Save private key to env (optional, for future use)
  env.BSC_PRIVATE_KEY = privateKey;

  // Use ethers directly to register (using current directory node_modules)
  try {
    // We need ethers — ensure node_modules exist in current dir
    const ethersPath = path.join(SRC_DIR, 'node_modules', 'ethers');
    if (!dirExists(ethersPath)) {
      log.info('Installing ethers dependency...');
      try {
        execSync('npm install --production', { cwd: SRC_DIR, stdio: 'pipe' });
        log.ok('Dependencies installed.');
      } catch (e) {
        log.err(`Failed to install dependencies: ${e.message.split('\n')[0]}`);
        log.info('Try running: npm install');
        process.exit(1);
      }
    }

    const { ethers } = require(path.join(SRC_DIR, 'node_modules', 'ethers'));

    const BSC_RPC = 'https://bsc-dataseed.binance.org';
    const REGISTRY_ADDRESS = ERC8004_REGISTRY;
    const REGISTRY_ABI = [
      'function register(string tokenURI) returns (uint256)',
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    ];

    log.info('Connecting to BSC...');
    const provider = new ethers.JsonRpcProvider(BSC_RPC, { name: 'bnb', chainId: 56 });

    // Network connectivity check
    try {
      log.info('Checking network connectivity...');
      await provider.getNetwork();
      log.ok('BSC network reachable.');
    } catch (e) {
      log.err(`Cannot reach BSC network: ${e.message}`);
      process.exit(1);
    }
    let wallet;
    try {
      wallet = new ethers.Wallet(privateKey, provider);
    } catch (e) {
      log.err(`Invalid private key: ${e.message}`);
      process.exit(1);
    }

    log.ok(`Wallet: ${C.dim}${wallet.address}${C.reset}`);

    // Check BNB balance
    const balance = await provider.getBalance(wallet.address);
    const bnbBalance = ethers.formatEther(balance);
    log.ok(`BNB Balance: ${bnbBalance}`);

    if (balance < ethers.parseEther('0.001')) {
      log.err('Insufficient BNB. Need at least 0.001 BNB for gas.');
      log.info(`Send BNB to: ${wallet.address}`);
      process.exit(1);
    }

    // Register
    const metadata = JSON.stringify({
      name: 'Clawster Agent',
      description: 'Autonomous perps trading agent on Aster DEX',
      services: [{ type: 'trading', platform: 'aster-dex', capabilities: ['perpetual-futures'] }],
    });

    log.info('Submitting registration transaction...');
    const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, wallet);
    
    // Gas estimation
    try {
      log.info('Estimating gas...');
      const estimatedGas = await registry.register.estimateGas(metadata);
      log.ok(`Estimated gas: ${estimatedGas.toString()}`);
    } catch (e) {
      log.warn(`Gas estimation failed: ${e.message}`);
    }

    const tx = await registry.register(metadata);
    log.info(`TX: ${C.dim}${tx.hash}${C.reset}`);
    log.info('Waiting for confirmation (timeout: 60s)...');

    // Add timeout handling
    const receipt = await Promise.race([
      tx.wait(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout after 60 seconds')), 60000)
      )
    ]);

    // Extract agent ID from Transfer event
    let agentId;
    for (const logEntry of receipt.logs) {
      try {
        const parsed = registry.interface.parseLog({ topics: logEntry.topics, data: logEntry.data });
        if (parsed && parsed.name === 'Transfer' && parsed.args[0] === ethers.ZeroAddress) {
          agentId = parsed.args[2].toString();
          break;
        }
      } catch {}
    }

    if (!agentId) {
      // Fallback
      for (const logEntry of receipt.logs) {
        try {
          const parsed = registry.interface.parseLog({ topics: logEntry.topics, data: logEntry.data });
          if (parsed && parsed.name === 'Transfer') {
            agentId = parsed.args[2].toString();
            break;
          }
        } catch {}
      }
    }

    if (!agentId) {
      log.warn('Could not extract Agent ID from transaction logs.');
      const manual = await ask(rl, `${C.cyan}?${C.reset} Enter Agent ID manually (check BscScan): `);
      agentId = manual.trim();
    }

    log.ok(`${C.bold}Agent #${agentId} registered on ERC-8004!${C.reset}`);
    log.info(`BscScan: ${C.dim}https://bscscan.com/tx/${tx.hash}${C.reset}`);
    return agentId;

  } catch (e) {
    log.err(`Registration failed: ${e.message}`);
    console.log('');
    const fallback = await ask(rl, `${C.cyan}?${C.reset} Enter an existing Agent ID to continue (or Ctrl+C to abort): `);
    const id = parseInt(fallback.trim(), 10);
    if (isNaN(id) || id <= 0) {
      log.err('Invalid Agent ID.');
      process.exit(1);
    }
    return String(id);
  }
}

// ── Install ──

async function install() {
  console.log(`
${C.bold}${C.cyan}╔══════════════════════════════════════╗
║     🐾  Clawster Installer  🐾      ║
╚══════════════════════════════════════╝${C.reset}
`);

  log.info(`OS: ${C.bold}${os.platform()}${C.reset} (${os.arch()})`);
  log.info(`Home: ${C.dim}${HOME}${C.reset}`);
  log.info(`Target: ${C.dim}${SKILLS_DIR}${C.reset}`);

  // Check OpenClaw exists
  if (!dirExists(path.join(HOME, '.openclaw'))) {
    log.err(`OpenClaw not found at ${C.dim}${path.join(HOME, '.openclaw')}${C.reset}`);
    log.err('Please install OpenClaw first: https://openclaw.com');
    process.exit(1);
  }

  // Create skills dir if needed
  if (!dirExists(SKILLS_DIR)) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
    log.ok('Created skills directory.');
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // Parse existing env
  const env = parseEnv(ENV_FILE);

  // ── Step 1: ERC-8004 Registration ──
  const agentId = await stepERC8004(rl, env);
  env.AGENT_ID = agentId;

  // ── Step 2: Copy skills ──
  const existing = [...SKILLS, 'clawster'].filter(s => dirExists(path.join(SKILLS_DIR, s)));
  let overwrite = true;

  if (existing.length > 0) {
    log.warn(`Found ${existing.length} existing skill(s): ${C.dim}${existing.join(', ')}${C.reset}`);
    const ans = await ask(rl, `${C.yellow}?${C.reset} Overwrite existing skills? [Y/n] `);
    overwrite = !ans || ans.toLowerCase().startsWith('y');
    if (!overwrite) {
      log.info('Skipping skill copy (keeping existing).');
    }
  }

  if (overwrite) {
    log.step('Step 2: Cloning Aster API skills from GitHub...');
    
    // Clone skills from GitHub instead of copying from local
    const skillsRepoUrl = 'https://github.com/asterdex/aster-skills-hub.git';
    const tempSkillsDir = path.join(os.tmpdir(), 'aster-skills-temp');
    
    try {
      // Clean temp dir if exists
      rmDirSync(tempSkillsDir);
      
      // Clone the skills repository
      log.info('Cloning aster-skills-hub...');
      execSync(`git clone ${skillsRepoUrl} "${tempSkillsDir}"`, { stdio: 'pipe' });
      
      // Copy individual skills
      for (const skill of SKILLS) {
        const src = path.join(tempSkillsDir, skill);
        const dest = path.join(SKILLS_DIR, skill);
        if (!dirExists(src)) {
          log.warn(`Skill not found in repository: ${skill} — skipping`);
          continue;
        }
        copyDirSync(src, dest);
        log.ok(`${skill}`);
      }
      
      // Clean up temp dir
      rmDirSync(tempSkillsDir);
      
    } catch (e) {
      log.warn(`Failed to clone skills repository: ${e.message}`);
      log.info('Skills will need to be installed manually from https://github.com/asterdex/aster-skills-hub');
    }

    log.step('Copying Clawster agent skill...');
    const clawDest = path.join(SKILLS_DIR, 'clawster');
    
    // Copy the entire current directory (which is now the flattened clawster skill)
    copyDirSync(SRC_DIR, clawDest);
    log.ok('clawster');
  }

  // ── Step 3: npm install ──
  log.step('Step 3: Installing dependencies...');
  const clawDest = path.join(SKILLS_DIR, 'clawster');
  try {
    execSync('npm install --production', {
      cwd: clawDest,
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'production' },
    });
    log.ok('npm install complete.');
  } catch (e) {
    log.warn(`npm install had issues: ${e.message.split('\n')[0]}`);
  }

  // ── Step 4: API credentials ──
  log.step('Step 4: Aster API Credentials');
  const hasKey = env.ASTER_API_KEY && env.ASTER_API_KEY.length > 10;
  const hasSecret = env.ASTER_API_SECRET && env.ASTER_API_SECRET.length > 10;

  if (hasKey && hasSecret) {
    log.info(`Existing credentials found in ${C.dim}.env${C.reset}`);
    const ans = await ask(rl, `${C.yellow}?${C.reset} Update API credentials? [y/N] `);
    if (!ans || !ans.toLowerCase().startsWith('y')) {
      log.ok('Keeping existing credentials.');
      // Save env with agent_id
      writeEnv(ENV_FILE, env);
      rl.close();
      finish();
      return;
    }
  }

  const apiKey = await ask(rl, `${C.cyan}?${C.reset} Aster API Key: `);
  const apiSecret = await ask(rl, `${C.cyan}?${C.reset} Aster API Secret: `);

  if (apiKey.trim() && apiSecret.trim()) {
    env.ASTER_API_KEY = apiKey.trim();
    env.ASTER_API_SECRET = apiSecret.trim();
  } else {
    log.warn('Empty credentials — skipped. You can set them later in:');
    log.info(`  ${C.dim}${ENV_FILE}${C.reset}`);
  }

  // Always write env (includes AGENT_ID)
  writeEnv(ENV_FILE, env);
  log.ok('Configuration saved to .env');

  // Security warning and file permissions
  log.warn('⚠️  Your .env file contains sensitive credentials. Keep it secure and never commit it to git.');
  
  // Set secure permissions on Mac/Linux
  if (os.platform() !== 'win32') {
    try {
      fs.chmodSync(ENV_FILE, 0o600);
      log.ok('Set .env permissions to 600 (owner read/write only).');
    } catch (e) {
      log.warn(`Could not set .env permissions: ${e.message}`);
    }
  }

  rl.close();
  finish();
}

function finish() {
  console.log(`
${C.bold}${C.green}╔══════════════════════════════════════╗
║       ✔  Installation Complete!      ║
╚══════════════════════════════════════╝${C.reset}

${C.bold}Next steps:${C.reset}
  ${C.cyan}1.${C.reset} Run ${C.bold}openclaw gateway restart${C.reset}
  ${C.cyan}2.${C.reset} Start chatting with Clawster!

${C.dim}Skills installed to: ${SKILLS_DIR}${C.reset}
`);
}

// ── Main ──

const args = process.argv.slice(2);
if (args.includes('--uninstall') || args.includes('-u')) {
  uninstall();
} else {
  install().catch((e) => {
    log.err(`Installation failed: ${e.message}`);
    process.exit(1);
  });
}
