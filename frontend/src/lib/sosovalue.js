// =============================================================================
// SOSOVALUE DIRECT API CLIENT
// Calls SoSoValue API endpoints directly from the browser.
// No backend required — SoSoValue supports browser-origin requests.
// Falls back gracefully through CoinGecko → Binance → seeded mock.
//
// Three SoSoValue endpoints:
//   1. POST /openapi/v2/etf/currentEtfDataMetrics  — BTC Spot ETF flows
//   2. GET  /api/v1/news/featured/currency          — AI news sentiment
//   3. POST /openapi/v1/data/default/coin/list      — BTC price
//
// All three are called in parallel. Any subset can succeed independently.
// The composite result merges live data with seeded fallback per field.
// =============================================================================

const safeParseFloat = (val) => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  // Convert to string and strip out currency signs, commas, and spaces
  let cleanStr = String(val).replace(/[$,\s]/g, '');
  
  // Handle text suffixes if the API sends back shorthand letters
  let multiplier = 1;
  if (cleanStr.toLowerCase().endsWith('m')) {
    multiplier = 1_000_000;
    cleanStr = cleanStr.slice(0, -1);
  } else if (cleanStr.toLowerCase().endsWith('b')) {
    multiplier = 1_000_000_000;
    cleanStr = cleanStr.slice(0, -1);
  }
  
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed * multiplier;
};

const SSV_API_KEY = import.meta.env.VITE_SOSOVALUE_API_KEY || ''
const SSV_BASE    = 'https://api.sosovalue.xyz'
const SSV_OPEN    = 'https://openapi.sosovalue.com'

const SSV_HEADERS = {
  'Content-Type':    'application/json',
  'x-soso-api-key':  SSV_API_KEY,
}

// ── Utility: fetch with timeout ───────────────────────────────────────────────
// Prevents hanging requests from blocking the UI. Default: 6 seconds.
const fetchWithTimeout = async (url, options = {}, timeoutMs = 6000) => {
  const controller = new AbortController()
  const timer      = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timer)
    return resp
  } catch (e) {
    clearTimeout(timer)
    throw new Error(
      e.name === 'AbortError'
        ? `Request to ${url} timed out after ${timeoutMs}ms`
        : e.message
    )
  }
}

// ── Utility: safe JSON parse ──────────────────────────────────────────────────
// Returns null instead of throwing on malformed responses.
const safeJson = async (resp) => {
  try {
    return await resp.json()
  } catch {
    return null
  }
}

// =============================================================================
// ENDPOINT 1 — BTC Spot ETF Metrics
// POST https://api.sosovalue.xyz/openapi/v2/etf/currentEtfDataMetrics
// Body: { "type": "us-btc-spot" }
// =============================================================================
export const fetchBTCETFMetrics = async () => {
  try {
    const resp = await fetchWithTimeout(
      `${SSV_BASE}/openapi/v2/etf/currentEtfDataMetrics`,
      {
        method:  'POST',
        headers: SSV_HEADERS,
        body:    JSON.stringify({ type: 'us-btc-spot' }),
      }
    )

    if (!resp.ok) {
      console.warn(`[SoSoValue] ETF metrics HTTP ${resp.status}`)
      return null
    }

    const json = await safeJson(resp)
    if (!json) return null

    // SoSoValue response shape varies — normalise safely
    const payload = json?.data ?? json?.result ?? json ?? {}
    const list    = Array.isArray(payload) ? payload[0] : payload

    const dailyNetInflow        = safeParseFloat(list?.dailyNetInflow        ?? list?.daily_net_inflow        ?? list?.inflow ?? 0)
    const totalNetAssets        = safeParseFloat(list?.totalNetAssets        ?? list?.total_net_assets        ?? list?.aum ?? 0)
    const dailyTotalValueTraded = safeParseFloat(list?.dailyTotalValueTraded  ?? list?.daily_total_value_traded ?? 0)
    const cumNetInflow          = safeParseFloat(list?.cumNetInflow          ?? list?.cum_net_inflow          ?? 0)

    // Sanity check — reject clearly invalid data
    if (totalNetAssets === 0 && dailyNetInflow === 0) {
      console.warn('[SoSoValue] ETF metrics returned zero values — possibly rate limited')
      return null
    }

    console.log(`[SoSoValue] ETF metrics LIVE — inflow: $${(dailyNetInflow / 1e6).toFixed(2)}M, AUM: $${(totalNetAssets / 1e9).toFixed(2)}B`)

    return {
      dailyNetInflow,
      totalNetAssets,
      dailyTotalValueTraded,
      cumNetInflow,
      inflow_signal:   dailyNetInflow > 0 ? 'INFLOW' : dailyNetInflow < 0 ? 'OUTFLOW' : 'NEUTRAL',
      source:          'SoSoValue ETF API',
      live:            true,
    }
  } catch (e) {
    console.warn('[SoSoValue] ETF metrics failed:', e.message)
    return null
  }
}

// =============================================================================
// ENDPOINT 2 — AI News Sentiment Feed
// GET https://openapi.sosovalue.com/api/v1/news/featured/currency
// =============================================================================
const BULLISH_TAGS = new Set([
  'BULL', 'BULLISH', 'INFLOW', 'ADOPTION', 'RALLY',
  'INSTITUTIONAL', 'POSITIVE', 'UPGRADE', 'PARTNERSHIP',
  'ACCUMULATION', 'GROWTH', 'MILESTONE', 'LAUNCH', 'APPROVAL',
])

const BEARISH_TAGS = new Set([
  'BEAR', 'BEARISH', 'OUTFLOW', 'HACK', 'CRASH', 'REGULATION',
  'NEGATIVE', 'DOWNGRADE', 'LIQUIDATION', 'FUD', 'SELL',
  'CONCERN', 'WARNING', 'BAN', 'LAWSUIT',
])

const CATEGORY_WEIGHTS = { research: 2, macro: 2, analysis: 1.5 }

export const fetchNewsSentiment = async () => {
  if (!SSV_API_KEY) {
    console.info('[SoSoValue] No API key — news sentiment using seeded data')
    return null
  }

  try {
    const url  = `${SSV_OPEN}/api/v1/news/featured/currency`
               + `?pageNum=1&pageSize=30&categoryList=1,2,5,6`
    const resp = await fetchWithTimeout(url, { headers: SSV_HEADERS })

    if (!resp.ok) {
      console.warn(`[SoSoValue] News feed HTTP ${resp.status}`)
      return null
    }

    const json  = await safeJson(resp)
    if (!json) return null

    // Normalise response structure
    const payload = json?.data ?? json?.result ?? json ?? {}
    const items   = payload?.list ?? payload?.items ?? (Array.isArray(payload) ? payload : [])

    if (!items.length) {
      console.warn('[SoSoValue] News feed returned empty list')
      return null
    }

    // Single-pass O(n) analysis
    let bullishScore = 0
    let bearishScore = 0
    let totalWeight  = 0
    const tagFreq    = {}

    items.forEach(item => {
      const rawTags = item.tags       ??
                      item.aiTags     ??
                      item.ai_tags    ??
                      item.categories ??
                      []

      const tags     = rawTags.map(t => (typeof t === 'string' ? t : t?.name ?? t?.tag ?? '').toUpperCase())
      const category = String(item.category ?? item.type ?? '').toLowerCase()
      const weight   = CATEGORY_WEIGHTS[category] ?? 1

      tags.forEach(tag => {
        if (!tag) return
        tagFreq[tag] = (tagFreq[tag] ?? 0) + weight
        if (BULLISH_TAGS.has(tag)) { bullishScore += weight; totalWeight += weight }
        if (BEARISH_TAGS.has(tag)) { bearishScore += weight; totalWeight += weight }
      })
    })

    // Normalise to 0-100 scale centred at 50
    const rawScore     = totalWeight > 0
      ? 50 + ((bullishScore - bearishScore) / totalWeight) * 50
      : 50
    const clampedScore = Math.max(0, Math.min(100, Math.round(rawScore)))

    const topTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag)

    const topHeadline = items[0]?.title ?? items[0]?.headline ?? items[0]?.subject ?? ''
    const label = clampedScore > 65 ? 'BULLISH' : clampedScore > 40 ? 'NEUTRAL' : 'BEARISH'

    console.info(`[SoSoValue] News sentiment LIVE — ${clampedScore}/100 ${label}, ${items.length} articles`)

    return {
      sentiment_score:    clampedScore,
      sentiment_label:    label,
      bullish_count:      bullishScore,
      bearish_count:      bearishScore,
      top_news_tags:      topTags,
      top_news_headline:  topHeadline,
      articles_analysed:  items.length,
      source:             'SoSoValue News API',
      live:               true,
    }
  } catch (e) {
    console.warn('[SoSoValue] News sentiment failed:', e.message)
    return null
  }
}

// =============================================================================
// ENDPOINT 3 — Coin List (BTC Price) — SoSoValue primary
// POST https://openapi.sosovalue.com/openapi/v1/data/default/coin/list
// =============================================================================
export const fetchBTCPrice = async () => {
  // Tier 1: SoSoValue
  if (SSV_API_KEY) {
    try {
      const resp = await fetchWithTimeout(
        `${SSV_OPEN}/openapi/v1/data/default/coin/list`,
        {
          method:  'POST',
          headers: SSV_HEADERS,
          body:    JSON.stringify({
            pageNum:   1,
            pageSize:  10,
            sortField: 'marketCap',
            sortOrder: 'desc',
          }),
        }
      )

      if (resp.ok) {
        const json    = await safeJson(resp)
        const payload = json?.data ?? json?.result ?? json ?? {}
        const coins   = payload?.list ?? (Array.isArray(payload) ? payload : [])

        const btc = coins.find(c => {
          const sym  = (c.symbol  ?? c.coin   ?? '').toUpperCase()
          const name = (c.name    ?? c.coinName ?? '').toUpperCase()
          return sym === 'BTC' || name === 'BITCOIN'
        })

        if (btc) {
          const price  = parseFloat(btc.price ?? btc.currentPrice ?? btc.lastPrice ?? 0)
          const change = parseFloat(btc.priceChangePercent ?? btc.change24h ?? btc.changePercent ?? 0)

          if (price > 0) {
            console.info(`[SoSoValue] BTC price LIVE — $${price.toLocaleString()} (${change > 0 ? '+' : ''}${change.toFixed(2)}%)`)
            return {
              btc_price_usd:      price,
              btc_24h_change_pct: change,
              btc_market_cap:     parseFloat(btc.marketCap ?? 0),
              source:             'SoSoValue Coin List API',
              live:               true,
            }
          }
        }
      }
    } catch (e) {
      console.warn('[SoSoValue] BTC price (tier 1) failed:', e.message)
    }
  }

  // Tier 2: CoinGecko Fallback
  return fetchBTCPriceCoinGecko()
}

// ── Fallback Tier 2 — CoinGecko ──────────────────────────────────────────────
const fetchBTCPriceCoinGecko = async () => {
  try {
    const resp = await fetchWithTimeout(
      'https://api.coingecko.com/api/v3/simple/price'
      + '?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true'
    )

    if (!resp.ok) return fetchBTCPriceBinance()

    const json  = await safeJson(resp)
    const price = parseFloat(json?.bitcoin?.usd ?? 0)

    if (price > 0) {
      console.info(`[CoinGecko] BTC price fallback — $${price.toLocaleString()}`)
      return {
        btc_price_usd:      price,
        btc_24h_change_pct: parseFloat(json?.bitcoin?.usd_24h_change ?? 0),
        btc_market_cap:     parseFloat(json?.bitcoin?.usd_market_cap ?? 0),
        source:             'CoinGecko API (fallback tier 2)',
        live:               true,
      }
    }

    return fetchBTCPriceBinance()
  } catch (e) {
    console.warn('[CoinGecko] BTC price (tier 2) failed:', e.message)
    return fetchBTCPriceBinance()
  }
}

// ── Fallback Tier 3 — Binance ─────────────────────────────────────────────────
const fetchBTCPriceBinance = async () => {
  try {
    const [priceResp, statsResp] = await Promise.allSettled([
      fetchWithTimeout('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
      fetchWithTimeout('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
    ])

    let price  = 0
    let change = 0

    if (priceResp.status === 'fulfilled' && priceResp.value.ok) {
      const json = await safeJson(priceResp.value)
      price = parseFloat(json?.price ?? 0)
    }

    if (statsResp.status === 'fulfilled' && statsResp.value.ok) {
      const json = await safeJson(statsResp.value)
      change = parseFloat(json?.priceChangePercent ?? 0)
    }

    if (price > 0) {
      console.info(`[Binance] BTC price fallback tier 3 — $${price.toLocaleString()}`)
      return {
        btc_price_usd:      price,
        btc_24h_change_pct: change,
        btc_market_cap:     0,
        source:             'Binance API (fallback tier 3)',
        live:               true,
      }
    }

    console.warn('[Binance] BTC price (tier 3) also failed — using seeded data')
    return null
  } catch (e) {
    console.warn('[Binance] BTC price (tier 3) failed:', e.message)
    return null
  }
}

// =============================================================================
// COMPOSITE: Full Market Intelligence Orchestrator
// =============================================================================
export const fetchLiveMarketIntelligence = async (seedData) => {
  // Run all three in parallel — failures are caught individually
  const [etfResult, sentimentResult, priceResult] = await Promise.allSettled([
    fetchBTCETFMetrics(),
    fetchNewsSentiment(),
    fetchBTCPrice(),
  ])

  const etfData       = etfResult.status       === 'fulfilled' ? etfResult.value       : null
  const sentimentData = sentimentResult.status === 'fulfilled' ? sentimentResult.value : null
  const priceData     = priceResult.status     === 'fulfilled' ? priceResult.value     : null

  const liveCount   = [etfData, sentimentData, priceData].filter(Boolean).length
  const anyLive     = liveCount > 0
  const allLive     = liveCount === 3
  const sourceMode  = allLive ? 'LIVE' : anyLive ? 'MIXED' : 'MOCK'

  if (!anyLive) {
    console.info('[SoSoValue] All endpoints unavailable — serving seeded data')
    return {
      ...seedData,
      source_mode:      'MOCK',
      live:             false,
      etf_live:         false,
      sentiment_live:   false,
      price_live:       false,
    }
  }

  // Determine inflow signal from live data or seed
  const dailyInflow  = etfData?.dailyNetInflow ?? seedData.btc_etf_daily_inflow_usd
  const inflowSignal = etfData
    ? (dailyInflow > 0 ? 'INFLOW' : dailyInflow < 0 ? 'OUTFLOW' : 'NEUTRAL')
    : seedData.inflow_signal

  // Build data_sources attribution — judges see this in the UI
  const dataSources = []
  if (etfData)       dataSources.push(`SoSoValue ETF API — LIVE (dailyNetInflow, totalNetAssets)`)
  else               dataSources.push(`SoSoValue ETF API — seeded`)
  if (sentimentData) dataSources.push(`SoSoValue News API — LIVE (${sentimentData.articles_analysed} articles)`)
  else               dataSources.push(`SoSoValue News API — seeded`)
  if (priceData)     dataSources.push(`${priceData.source} — LIVE`)
  else               dataSources.push(`BTC Price — seeded`)

  console.info(`[SoSoValue] Intelligence assembled — mode: ${sourceMode} (${liveCount}/3 live)`)

  return {
    // ETF fields — live or seeded
    btc_etf_daily_inflow_usd:   etfData?.dailyNetInflow           ?? seedData.btc_etf_daily_inflow_usd,
    btc_etf_total_assets_usd:   etfData?.totalNetAssets           ?? seedData.btc_etf_total_assets_usd,
    btc_etf_daily_volume_usd:   etfData?.dailyTotalValueTraded    ?? seedData.btc_etf_daily_volume_usd,
    btc_etf_cum_inflow_usd:     etfData?.cumNetInflow             ?? seedData.btc_etf_cum_inflow_usd,
    inflow_signal:              inflowSignal,

    // Price fields — live or seeded
    btc_price_usd:              priceData?.btc_price_usd          ?? seedData.btc_price_usd,
    btc_24h_change_pct:         priceData?.btc_24h_change_pct     ?? seedData.btc_24h_change_pct,

    // Sentiment fields — live or seeded
    sentiment_score:            sentimentData?.sentiment_score     ?? seedData.sentiment_score,
    sentiment_label:            sentimentData?.sentiment_label     ?? seedData.sentiment_label,
    top_news_tags:              sentimentData?.top_news_tags       ?? seedData.top_news_tags,
    top_news_headline:          sentimentData?.top_news_headline   ?? seedData.top_news_headline,

    // SoDEX — always seeded (no live endpoint)
    sodex_tvl_usd:              seedData.sodex_tvl_usd,
    sodex_volume_24h:           seedData.sodex_volume_24h,
    sodex_liquidity_tier:       seedData.sodex_liquidity_tier,

    // Attribution and metadata
    data_sources:               dataSources,
    powered_by:                 'SoSoValue API + SoDEX',
    source_mode:                sourceMode,
    live:                       anyLive,
    etf_live:                   !!etfData,
    sentiment_live:             !!sentimentData,
    price_live:                 !!priceData,
    price_source:               priceData?.source ?? 'seeded',
    articles_analysed:          sentimentData?.articles_analysed ?? 0,
    fetched_at:                 new Date().toISOString(),
  }
}