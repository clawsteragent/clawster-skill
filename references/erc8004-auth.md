# ERC-8004 Agent Registration & Authentication

## Overview

ERC-8004 is an on-chain agent registry on BNB Smart Chain (BSC). Each AI agent is represented as an NFT with a unique `agentId`, enabling verifiable identity for autonomous agents.

## Registry Contract

- **Chain:** BSC mainnet (chainId: `56`)
- **RPC:** `https://bsc-dataseed.binance.org`
- **Address:** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- **Standard:** ERC-721 compatible with agent-specific extensions

## Minimal ABI

```json
[
  "function register(string tokenURI) returns (uint256)",
  "function setTokenURI(uint256 tokenId, string tokenURI)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
]
```

## Registration Flow

Registration creates an agent NFT. The caller's wallet becomes the owner.

### Using the Setup Script (Recommended)

```bash
cd skill/clawster
npm install
node scripts/setup-agent.js
```

The script handles everything: connects to BSC, checks BNB balance, sends the registration TX, and extracts the agentId.

### Manual Registration with ethers.js v6

```javascript
const { ethers } = require('ethers');

const BSC_RPC = 'https://bsc-dataseed.binance.org';
const REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const ABI = [
  'function register(string tokenURI) returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

async function registerAgent(privateKey, name, description) {
  const provider = new ethers.JsonRpcProvider(BSC_RPC, { name: 'bnb', chainId: 56 });
  const wallet = new ethers.Wallet(privateKey, provider);
  const registry = new ethers.Contract(REGISTRY, ABI, wallet);

  // Build metadata (used as tokenURI)
  const metadata = JSON.stringify({
    name,
    description,
    services: [{ type: 'trading', platform: 'aster-dex', capabilities: ['perpetual-futures'] }],
  });

  // Send registration TX
  const tx = await registry.register(metadata);
  console.log(`TX sent: ${tx.hash}`);

  // Wait for confirmation
  const receipt = await tx.wait();

  // Extract agentId from Transfer event (mint: from = address(0))
  let agentId;
  for (const log of receipt.logs) {
    try {
      const parsed = registry.interface.parseLog({ topics: log.topics, data: log.data });
      if (parsed.name === 'Transfer' && parsed.args[0] === ethers.ZeroAddress) {
        agentId = parsed.args[2].toString(); // tokenId = agentId
        break;
      }
    } catch {}
  }

  console.log(`Agent #${agentId} registered!`);
  console.log(`Owner: ${wallet.address}`);
  console.log(`BscScan: https://bscscan.com/tx/${tx.hash}`);
  return agentId;
}
```

### How agentId Extraction Works

When `register(tokenURI)` is called, the contract mints a new ERC-721 token. This emits a `Transfer` event:

```
Transfer(from=0x0000000000000000000000000000000000000000, to=<your_wallet>, tokenId=<agentId>)
```

- `from` is the zero address (indicates a mint, not a transfer)
- `to` is the wallet that called `register()`
- `tokenId` is the new agent's unique ID

The agentId is in the **third indexed parameter** of the Transfer event.

## Updating Agent Metadata

After registration, update metadata with `setTokenURI`:

```javascript
const tx = await registry.setTokenURI(agentId, newMetadataJSON);
await tx.wait();
```

## Verifying an Agent

### Check Ownership

```javascript
const owner = await registry.ownerOf(agentId);
console.log(`Agent #${agentId} owned by: ${owner}`);
```

### Using MCP

```
get_erc8004_agent(agentId, "bsc")
```

Returns:
```json
{
  "agentId": 42,
  "owner": "0x1234...abcd",
  "tokenURI": "{\"name\":\"ClawTrader-001\",\"description\":\"...\"}"
}
```

## Agent NFT Metadata Format

```json
{
  "name": "ClawTrader-001",
  "description": "Autonomous perps trading agent on Aster DEX",
  "image": "ipfs://...",
  "services": [
    {
      "type": "trading",
      "platform": "aster-dex",
      "capabilities": ["perpetual-futures", "spot"]
    }
  ]
}
```

The `tokenURI` can be:
- A JSON string directly (simplest â€” used by the setup script)
- An IPFS URL pointing to JSON (more permanent)
- An HTTP URL (less decentralized but works)

## Security Notes

- Use a **dedicated wallet** for agent registration â€” not your main wallet
- The private key is only needed during registration (to sign the TX)
- The `agentId` is public â€” it's meant to be shared
- API keys for Aster DEX are completely separate from on-chain identity
- Never store private keys in plaintext config files in production
