// src/lib/ssv.js

const SOSOVALUE_API_KEY = import.meta.env.VITE_SOSOVALUE_API_KEY

let cache = { data: null, timestamp: 0 }
let pendingPromise = null // In-flight request lock to prevent duplicate concurrent calls
const CACHE_TTL_MS = 60 * 1000 // 60 second cache

export async function getSoSoValueIntelligence(forceRefresh = false) {
  const now = Date.now()

  // 1. Return fresh cached data if available
  if (!forceRefresh && cache.data && (now - cache.timestamp < CACHE_TTL_MS)) {
    return cache.data
  }

  // 2. If a request is already in-flight, reuse it instead of firing a new one
  if (pendingPromise) {
    return pendingPromise
  }

  // 3. Initiate single unified request batch
  pendingPromise = (async () => {
    try {
      const [btcRes, newsRes, etfRes] = await Promise.allSettled([
        fetchBTCPrice(),
        fetchNewsSentiment(),
        fetchETFMetrics(),
      ])

      const btcPrice = btcRes.status === 'fulfilled' ? btcRes.value : null
      const newsData = newsRes.status === 'fulfilled' ? newsRes.value : null
      const etfData  = etfRes.status === 'fulfilled' ? etfRes.value : null

      const isBtcLive  = btcPrice !== null
      const isNewsLive = newsData !== null
      const isEtfLive  = etfData !== null

      const liveCount = [isBtcLive, isNewsLive, isEtfLive].filter(Boolean).length
      const mode = liveCount === 3 
        ? 'FULL_LIVE' 
        : liveCount > 0 
          ? `MIXED (${liveCount}/3 live)` 
          : 'MOCK'

      const assembled = {
        btc_price: isBtcLive ? btcPrice : 64780,
        news: newsData || { score: 50, label: 'NEUTRAL', total: 30 },
        etf: etfData || { total_flow_usd: 124000000, inflow_status: 'INFLOW' },
        mode,
        updated_at: new Date().toISOString(),
      }

      cache = { data: assembled, timestamp: Date.now() }
      console.log(`[SoSoValue] Intelligence assembled — mode: ${mode}`)
      return assembled

    } finally {
      pendingPromise = null // Reset the in-flight lock when complete
    }
  })()

  return pendingPromise
}

// ── Helper 1: CoinGecko BTC Price ──────────────────────────────────────────
async function fetchBTCPrice() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    
    if (data?.bitcoin?.usd) {
      console.log(`[CoinGecko] BTC price LIVE — $${data.bitcoin.usd.toLocaleString()}`)
      return data.bitcoin.usd
    }
    return null
  } catch (err) {
    console.warn('[CoinGecko] BTC price rate limited — using fallback')
    return null
  }
}

// ── Helper 2: SoSoValue News Sentiment ──────────────────────────────────────
async function fetchNewsSentiment() {
  if (!SOSOVALUE_API_KEY) return null
  try {
    const res = await fetch('https://api.sosovalue.com/v1/news/sentiment', {
      headers: { 'x-api-key': SOSOVALUE_API_KEY }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    console.log(`[SoSoValue] News sentiment LIVE — ${data.score || 50}/100 ${data.label || 'NEUTRAL'}`)
    return data
  } catch (err) {
    console.warn('[SoSoValue] News sentiment fetch error')
    return null
  }
}

// ── Helper 3: SoSoValue ETF Metrics ─────────────────────────────────────────
async function fetchETFMetrics() {
  if (!SOSOVALUE_API_KEY) return null
  try {
    const res = await fetch('https://api.sosovalue.com/v1/etf/us-btc/total-flow', {
      headers: { 'x-api-key': SOSOVALUE_API_KEY }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()

    // Robust parsing for different possible SoSoValue response formats
    const totalFlow = json?.total_flow_usd 
      ?? json?.data?.totalInflowUsd 
      ?? json?.data?.[0]?.totalInflowUsd
      ?? json?.[0]?.totalInflowUsd

    if (totalFlow !== undefined && totalFlow !== null && totalFlow !== 0) {
      console.log(`[SoSoValue] ETF metrics LIVE — Net Flow: $${Number(totalFlow).toLocaleString()}`)
      return {
        total_flow_usd: totalFlow,
        inflow_status: totalFlow >= 0 ? 'INFLOW' : 'OUTFLOW'
      }
    }
    return null
  } catch (err) {
    console.warn('[SoSoValue] ETF metrics rate-limited or invalid endpoint response')
    return null
  }
}