#!/usr/bin/env node
// CLAWSTER Balance Check — View Aster DEX account balances and positions
// Usage: node check-balance.js
// Reads credentials from env vars (ASTER_API_KEY, ASTER_API_SECRET) or TOOLS.md

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://fapi.asterdex.com/fapi/v1';

function sign(queryString, secret) {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

async function authFetch(endpoint, params, apiKey, apiSecret) {
  params.timestamp = Date.now();
  const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const signature = sign(qs, apiSecret);
  const url = `${BASE_URL}${endpoint}?${qs}&signature=${signature}`;
  const res = await fetch(url, { headers: { 'X-MBX-APIKEY': apiKey } });
  return res.json();
}

function getCredentials() {
  // Try env vars first
  if (process.env.ASTER_API_KEY && process.env.ASTER_API_SECRET) {
    return { apiKey: process.env.ASTER_API_KEY, apiSecret: process.env.ASTER_API_SECRET };
  }
  // Try TOOLS.md
  const toolsPath = path.resolve(process.env.OPENCLAW_WORKSPACE || '.', 'TOOLS.md');
  try {
    const content = fs.readFileSync(toolsPath, 'utf8');
    const keyMatch = content.match(/API Key:\s*`([^`]+)`/);
    const secretMatch = content.match(/API Secret:\s*`([^`]+)`/);
    if (keyMatch && secretMatch) {
      return { apiKey: keyMatch[1], apiSecret: secretMatch[1] };
    }
  } catch {}
  return null;
}

function fmt(num, decimals = 2) {
  return parseFloat(num || 0).toFixed(decimals);
}

async function main() {
  const creds = getCredentials();
  if (!creds) {
    console.log('❌ No credentials found.');
    console.log('   Set ASTER_API_KEY and ASTER_API_SECRET env vars, or run setup-agent.js');
    process.exit(1);
  }

  console.log('\n🐾 CLAWSTER — Aster DEX Account Overview\n');
  console.log('─'.repeat(50));

  // Fetch account
  const account = await authFetch('/account', {}, creds.apiKey, creds.apiSecret);
  if (account.code && account.code < 0) {
    console.log(`❌ API Error: ${account.msg}`);
    process.exit(1);
  }

  // Balances
  console.log('\n💰 BALANCES');
  console.log('─'.repeat(50));
  console.log(`  Wallet Balance:     $${fmt(account.totalWalletBalance)}`);
  console.log(`  Unrealized PnL:     $${fmt(account.totalUnrealizedProfit)}`);
  console.log(`  Margin Balance:     $${fmt(account.totalMarginBalance)}`);
  console.log(`  Available Balance:  $${fmt(account.availableBalance)}`);

  // Non-zero assets
  const assets = (account.assets || []).filter(a => parseFloat(a.walletBalance) > 0);
  if (assets.length > 0) {
    console.log('\n  Assets:');
    for (const a of assets) {
      console.log(`    ${a.asset}: ${fmt(a.walletBalance)} (available: ${fmt(a.availableBalance)})`);
    }
  }

  // Positions
  const positions = (account.positions || []).filter(p => parseFloat(p.positionAmt) !== 0);
  console.log(`\n📊 OPEN POSITIONS (${positions.length})`);
  console.log('─'.repeat(50));

  if (positions.length === 0) {
    console.log('  No open positions');
  } else {
    for (const p of positions) {
      const side = parseFloat(p.positionAmt) > 0 ? '🟢 LONG' : '🔴 SHORT';
      const pnl = parseFloat(p.unrealizedProfit);
      const pnlStr = pnl >= 0 ? `+$${fmt(pnl)}` : `-$${fmt(Math.abs(pnl))}`;
      console.log(`\n  ${p.symbol} ${side}`);
      console.log(`    Size:        ${fmt(Math.abs(parseFloat(p.positionAmt)), 4)}`);
      console.log(`    Entry:       $${fmt(p.entryPrice)}`);
      console.log(`    Mark:        $${fmt(p.markPrice)}`);
      console.log(`    PnL:         ${pnlStr}`);
      console.log(`    Leverage:    ${p.leverage}x`);
      console.log(`    Liquidation: $${fmt(p.liquidationPrice)}`);
      console.log(`    Margin:      ${p.marginType}`);
    }
  }

  // Fetch open orders
  const orders = await authFetch('/openOrders', {}, creds.apiKey, creds.apiSecret);
  if (Array.isArray(orders) && orders.length > 0) {
    console.log(`\n📋 OPEN ORDERS (${orders.length})`);
    console.log('─'.repeat(50));
    for (const o of orders) {
      const typeLabel = o.type.includes('STOP') ? '⛔' : o.type.includes('TAKE_PROFIT') ? '🎯' : '📝';
      console.log(`  ${typeLabel} ${o.symbol} ${o.side} ${o.type} qty:${o.origQty} price:${o.price || o.stopPrice}`);
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`  Updated: ${new Date().toISOString()}\n`);
}

main().catch(e => { console.error(`❌ ${e.message}`); process.exit(1); });
