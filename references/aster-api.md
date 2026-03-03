# Aster DEX API Reference

Aster DEX uses a Binance Futures-compatible API.

**Base URL:** `https://fapi.asterdex.com/fapi/v1`

## One Wallet â€” How It Works

Clawster uses a **single BSC wallet** for everything. The same wallet that registers your agent on ERC-8004 is the one you connect to Aster DEX for trading. There is no separate "trading wallet" â€” your BSC wallet holds BNB (for gas) and USDT (trading capital), and is controlled via your private key (identity) and Aster API key + secret (trading).

### Finding Your Aster API Key + Secret

1. Go to [asterdex.com](https://asterdex.com) and connect your BSC wallet
2. Navigate to **Account** â†’ **API Management** (or similar settings page)
3. Click **Create API Key**
4. Copy both the **API Key** and **Secret Key**
5. âš ï¸ The secret is only shown once â€” save it immediately

---

## Authentication

Private endpoints require HMAC-SHA256 authentication.

**Headers:**
```
X-MBX-APIKEY: your-api-key
```

**Query parameters:**
```
timestamp=<unix_ms>&signature=<hmac_sha256_of_query_string>
```

**Signature generation (Node.js):**
```javascript
const crypto = require('crypto');

function signQuery(queryString, secret) {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

function buildAuthUrl(baseUrl, path, params, apiSecret) {
  const timestamp = Date.now();
  params.timestamp = timestamp;
  const queryString = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  const signature = signQuery(queryString, apiSecret);
  return `${baseUrl}${path}?${queryString}&signature=${signature}`;
}
```

**Authenticated fetch example:**
```javascript
async function authFetch(path, params = {}, method = 'GET', apiKey, apiSecret) {
  const baseUrl = 'https://fapi.asterdex.com/fapi/v1';
  const timestamp = Date.now();
  params.timestamp = timestamp;
  const queryString = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  const signature = signQuery(queryString, apiSecret);
  const url = `${baseUrl}${path}?${queryString}&signature=${signature}`;
  const res = await fetch(url, {
    method,
    headers: { 'X-MBX-APIKEY': apiKey }
  });
  return res.json();
}
```

---

## Public Endpoints (No Auth)

### GET /ping
Health check. Returns `{}` if the server is reachable.

### GET /exchangeInfo
Returns all trading symbols, filters, and rate limits.

**Response (partial):**
```json
{
  "symbols": [
    {
      "symbol": "BTCUSDT",
      "pair": "BTCUSDT",
      "contractType": "PERPETUAL",
      "baseAsset": "BTC",
      "quoteAsset": "USDT",
      "pricePrecision": 2,
      "quantityPrecision": 3,
      "filters": [...]
    }
  ]
}
```

### GET /ticker/price
Current price for one or all symbols.

| Param | Required | Description |
|-------|----------|-------------|
| symbol | No | e.g. `BTCUSDT`. Omit for all. |

**Response:**
```json
{ "symbol": "BTCUSDT", "price": "97250.50" }
```

### GET /ticker/24hr
24-hour rolling statistics.

| Param | Required | Description |
|-------|----------|-------------|
| symbol | No | e.g. `BTCUSDT` |

**Response:**
```json
{
  "symbol": "BTCUSDT",
  "priceChange": "1250.00",
  "priceChangePercent": "1.30",
  "highPrice": "98000.00",
  "lowPrice": "95500.00",
  "volume": "12345.678",
  "quoteVolume": "1200000000.00",
  "lastPrice": "97250.50"
}
```

### GET /klines
Candlestick/kline data.

| Param | Required | Description |
|-------|----------|-------------|
| symbol | Yes | e.g. `BTCUSDT` |
| interval | Yes | `1m`, `3m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `8h`, `12h`, `1d`, `3d`, `1w`, `1M` |
| limit | No | Default 500, max 1500 |
| startTime | No | Unix ms |
| endTime | No | Unix ms |

**Response:** Array of arrays:
```json
[
  [1709337600000, "97000.00", "97500.00", "96800.00", "97250.50", "123.456", 1709341199999, "12000000.00", 500, "61.728", "6000000.00", "0"]
]
```
`[openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBuyBaseVol, takerBuyQuoteVol, ignore]`

### GET /depth
Order book.

| Param | Required | Description |
|-------|----------|-------------|
| symbol | Yes | e.g. `BTCUSDT` |
| limit | No | Default 100. Valid: 5, 10, 20, 50, 100, 500, 1000 |

**Response:**
```json
{
  "bids": [["97250.00", "1.234"], ...],
  "asks": [["97251.00", "0.567"], ...]
}
```

### GET /trades
Recent trades.

| Param | Required | Description |
|-------|----------|-------------|
| symbol | Yes | e.g. `BTCUSDT` |
| limit | No | Default 500, max 1000 |

### GET /fundingRate
Current and historical funding rates.

| Param | Required | Description |
|-------|----------|-------------|
| symbol | No | e.g. `BTCUSDT` |
| limit | No | Default 100, max 1000 |

**Response:**
```json
[
  {
    "symbol": "BTCUSDT",
    "fundingRate": "0.00010000",
    "fundingTime": 1709337600000
  }
]
```

### GET /openInterest
Open interest for a symbol.

| Param | Required | Description |
|-------|----------|-------------|
| symbol | Yes | e.g. `BTCUSDT` |

**Response:**
```json
{ "symbol": "BTCUSDT", "openInterest": "12345.678" }
```

---

## Private Endpoints (Auth Required)

### GET /account
Account balances and position information.

**Response (partial):**
```json
{
  "totalWalletBalance": "10000.00",
  "totalUnrealizedProfit": "125.50",
  "totalMarginBalance": "10125.50",
  "availableBalance": "8500.00",
  "assets": [
    { "asset": "USDT", "walletBalance": "10000.00", "unrealizedProfit": "125.50", "availableBalance": "8500.00" }
  ],
  "positions": [
    {
      "symbol": "BTCUSDT",
      "positionAmt": "0.010",
      "entryPrice": "96000.00",
      "unrealizedProfit": "125.50",
      "leverage": "10",
      "positionSide": "BOTH"
    }
  ]
}
```

### GET /openOrders
List all open orders for a symbol (or all symbols).

| Param | Required | Description |
|-------|----------|-------------|
| symbol | No | Filter by symbol |

### POST /order
Place a new order.

| Param | Required | Description |
|-------|----------|-------------|
| symbol | Yes | e.g. `BTCUSDT` |
| side | Yes | `BUY` or `SELL` |
| type | Yes | `LIMIT`, `MARKET`, `STOP`, `STOP_MARKET`, `TAKE_PROFIT`, `TAKE_PROFIT_MARKET` |
| quantity | Yes* | Order quantity (* not required for `STOP_MARKET`/`TAKE_PROFIT_MARKET` with `closePosition=true`) |
| price | Conditional | Required for `LIMIT` orders |
| timeInForce | Conditional | `GTC`, `IOC`, `FOK`. Required for `LIMIT` |
| stopPrice | Conditional | Required for `STOP`, `STOP_MARKET`, `TAKE_PROFIT`, `TAKE_PROFIT_MARKET` |
| reduceOnly | No | `true` to only reduce position |
| closePosition | No | `true` to close entire position (used with stop/TP orders) |

**Examples:**

Market buy:
```json
{ "symbol": "BTCUSDT", "side": "BUY", "type": "MARKET", "quantity": 0.01 }
```

Limit sell:
```json
{ "symbol": "BTCUSDT", "side": "SELL", "type": "LIMIT", "quantity": 0.01, "price": 99000, "timeInForce": "GTC" }
```

Stop loss (market):
```json
{ "symbol": "BTCUSDT", "side": "SELL", "type": "STOP_MARKET", "stopPrice": 96500, "closePosition": true }
```

Take profit (market):
```json
{ "symbol": "BTCUSDT", "side": "SELL", "type": "TAKE_PROFIT_MARKET", "stopPrice": 99000, "closePosition": true }
```

### DELETE /order
Cancel an open order.

| Param | Required | Description |
|-------|----------|-------------|
| symbol | Yes | e.g. `BTCUSDT` |
| orderId | Yes | Order ID to cancel |

### GET /positionRisk
Detailed position information.

| Param | Required | Description |
|-------|----------|-------------|
| symbol | No | Filter by symbol |

**Response:**
```json
[
  {
    "symbol": "BTCUSDT",
    "positionAmt": "0.010",
    "entryPrice": "96000.00",
    "markPrice": "97250.50",
    "unrealizedProfit": "125.05",
    "liquidationPrice": "87500.00",
    "leverage": "10",
    "marginType": "cross",
    "isolatedMargin": "0",
    "positionSide": "BOTH"
  }
]
```

### POST /leverage
Set leverage for a symbol.

| Param | Required | Description |
|-------|----------|-------------|
| symbol | Yes | e.g. `BTCUSDT` |
| leverage | Yes | 1-125 |

**Response:**
```json
{ "symbol": "BTCUSDT", "leverage": 10 }
```

### POST /marginType
Set margin type for a symbol.

| Param | Required | Description |
|-------|----------|-------------|
| symbol | Yes | e.g. `BTCUSDT` |
| marginType | Yes | `ISOLATED` or `CROSSED` |

---

## Rate Limits

- Weight-based rate limiting (similar to Binance)
- Most GET endpoints: 1-5 weight
- Order placement: 1 weight
- Recommended: max 10 requests/second for normal operation
- Check `X-MBX-USED-WEIGHT` response header

## Error Codes

| Code | Description |
|------|-------------|
| -1000 | Unknown error |
| -1002 | Unauthorized |
| -1021 | Timestamp outside recvWindow |
| -1100 | Illegal characters in parameter |
| -2010 | New order rejected |
| -2011 | Cancel rejected |
| -2018 | Balance not sufficient |
| -2019 | Margin not sufficient |
| -4003 | Quantity less than minimum |
| -4014 | Price not increased by tick size |
