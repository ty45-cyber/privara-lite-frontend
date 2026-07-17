import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, Zap, ExternalLink,
  RefreshCw, Activity, Wifi, WifiOff
} from 'lucide-react'
import api from '../lib/api'
import { invalidateIntelligenceCache } from '../lib/mockApi.js'
import './MarketIntel.css'

const REFRESH_MS = 60_000  // 60s auto-refresh — matches server cache TTL

export default function MarketIntel() {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [lastFetch, setLastFetch] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [isLive, setIsLive]       = useState(false)
  const [sourceMode, setSourceMode] = useState('MOCK')
  const [liveBreakdown, setLiveBreakdown] = useState({
    etf:       false,
    sentiment: false,
    price:     false,
    priceSource: 'seeded',
  })

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) {
      setRefreshing(true)
      // Invalidate cache so we get a fresh fetch on manual refresh
      invalidateIntelligenceCache()
    }

    try {
      const r = await api.get('/market/intelligence')
      const intel = r.data.intelligence

      setData(intel)
      setIsLive(intel?.live === true)
      setSourceMode(intel?.source_mode ?? 'MOCK')
      setLiveBreakdown({
        etf:         intel?.etf_live         ?? false,
        sentiment:   intel?.sentiment_live   ?? false,
        price:       intel?.price_live       ?? false,
        priceSource: intel?.price_source     ?? 'seeded',
      })
      setLastFetch(new Date())
      setError(null)
    } catch (e) {
      setError(e.response?.data?.message || 'SoSoValue API unreachable')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const timer = setInterval(() => fetchData(), REFRESH_MS)
    return () => clearInterval(timer)
  }, [fetchData])

  const fmtUSD = (v) => {
    if (!v && v !== 0) return '—'
    const a    = Math.abs(v)
    const sign = v < 0 ? '-' : ''
    if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`
    if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(1)}M`
    return `${sign}$${(a / 1e3).toFixed(0)}K`
  }

  if (loading) return <MISkeleton />
  if (error)   return <MIError message={error} onRetry={() => fetchData(true)} />

  const inflowPos = (data?.btc_etf_daily_inflow_usd ?? 0) > 0
  const btcPos    = (data?.btc_24h_change_pct ?? 0) > 0

  return (
    <div className="market-intel">
      {/* Accent line — green when live, amber when seeded */}
      <div className={`mi-accent-line mi-accent-line--${isLive ? 'live' : 'seeded'}`} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mi-header">
        <div className="mi-header-left">
          <Activity size={12} className={`mi-pulse-icon ${isLive ? 'mi-pulse-icon--live' : ''}`} />
          <span className="mi-label">MARKET INTELLIGENCE</span>
          <span className={`mi-signal-badge mi-signal-badge--${(data?.inflow_signal ?? 'neutral').toLowerCase()}`}>
            {data?.inflow_signal ?? 'NEUTRAL'}
          </span>
        </div>

        <div className="mi-header-right">
          {/* Live / Mock badge */}
          <div className={`mi-live-badge ${isLive ? 'mi-live-badge--live' : 'mi-live-badge--mock'}`}>
            {isLive
              ? <><Wifi size={9} /> LIVE — SOSOVALUE API</>
              : <><WifiOff size={9} /> SEEDED DATA</>
            }
          </div>

          {/* Per-endpoint live indicators when live */}
          {isLive && (
            <div className="mi-source-dots">
              <EndpointDot label="ETF"  live={liveBreakdown.etf}  />
              <EndpointDot label="NEWS" live={liveBreakdown.sentiment} />
              <EndpointDot
                label={liveBreakdown.priceSource === 'SoSoValue Coin List API' ? 'SSV' : 'BTC'}
                live={liveBreakdown.price}
                tooltip={liveBreakdown.priceSource}
              />
            </div>
          )}

          {lastFetch && (
            <span className="mi-last-fetch">
              {lastFetch.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}

          <button
            className={`mi-refresh ${refreshing ? 'mi-refresh--spinning' : ''}`}
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Force refresh — bypasses 60s cache"
          >
            <RefreshCw size={11} />
            {refreshing ? 'FETCHING…' : isLive ? 'LIVE' : 'REFRESH'}
          </button>

          {/* Fixed the missing <a> opening tag here */}
          <a
            href="https://sosovalue.com"
            target="_blank"
            rel="noreferrer"
            className="mi-powered"
          >
            SoSoValue <ExternalLink size={9} />
          </a>
        </div>
      </div>

      {/* ── Main metric strip ──────────────────────────────────────── */}
      <div className="mi-strip">
        {/* BTC Price */}
        <div className="mi-block">
          <span className="mi-block-label">BTC PRICE</span>
          <span className="mi-block-value mi-block-value--primary">
            {data?.btc_price_usd
              ? `$${Number(data.btc_price_usd).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
              : '—'
            }
          </span>
          <span className={`mi-block-sub ${btcPos ? 'mi-color--green' : 'mi-color--red'}`}>
            {btcPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {btcPos ? '+' : ''}{(data?.btc_24h_change_pct ?? 0).toFixed(2)}%
            {liveBreakdown.price && (
              <span className="mi-live-dot-inline" title={liveBreakdown.priceSource}>●</span>
            )}
          </span>
        </div>

        <div className="mi-sep" />

        {/* ETF Daily Flow */}
        <div className="mi-block">
          <span className="mi-block-label">BTC ETF DAILY FLOW</span>
          <span className={`mi-block-value ${inflowPos ? 'mi-color--green' : 'mi-color--red'}`}>
            {inflowPos ? '+' : ''}{fmtUSD(data?.btc_etf_daily_inflow_usd)}
            {liveBreakdown.etf && (
              <span className="mi-live-dot-inline mi-live-dot-inline--ssv" title="SoSoValue ETF API">●</span>
            )}
          </span>
          <span className="mi-block-sub mi-color--dim">
            AUM {fmtUSD(data?.btc_etf_total_assets_usd)}
          </span>
        </div>

        <div className="mi-sep" />

        {/* Cumulative ETF Inflow */}
        <div className="mi-block">
          <span className="mi-block-label">CUMULATIVE ETF INFLOW</span>
          <span className={`mi-block-value ${(data?.btc_etf_cum_inflow_usd ?? 0) > 0 ? 'mi-color--green' : 'mi-color--red'}`}>
            {(data?.btc_etf_cum_inflow_usd ?? 0) > 0 ? '+' : ''}{fmtUSD(data?.btc_etf_cum_inflow_usd)}
          </span>
          <span className="mi-block-sub mi-color--dim">Since ETF launch</span>
        </div>

        <div className="mi-sep" />

        {/* SoDEX TVL */}
        <div className="mi-block">
          <span className="mi-block-label">SoDEX TVL</span>
          <span className="mi-block-value mi-color--amber">
            {fmtUSD(data?.sodex_tvl_usd)}
          </span>
          <span className="mi-block-sub mi-color--dim">
            Liquidity: {data?.sodex_liquidity_tier ?? '—'}
          </span>
        </div>
      </div>

      {/* ── Bottom: Sentiment + Tags ─────────────────────────────── */}
      <div className="mi-bottom">
        {/* Sentiment */}
        <div className="mi-sentiment-col">
          <div className="mi-sentiment-header">
            <span className="mi-block-label">
              AI NEWS SENTIMENT
              {liveBreakdown.sentiment && (
                <span className="mi-live-dot-inline mi-live-dot-inline--ssv" title="SoSoValue News API — live">●</span>
              )}
            </span>
            {data?.articles_analysed > 0 && (
              <span className="mi-articles-count">{data.articles_analysed} articles</span>
            )}
          </div>

          <div className="mi-sentiment-track">
            <div
              className="mi-sentiment-fill"
              style={{ width: `${data?.sentiment_score ?? 50}%` }}
            />
            <div
              className="mi-sentiment-cursor"
              style={{ left: `${data?.sentiment_score ?? 50}%` }}
            />
          </div>

          <div className="mi-sentiment-ends">
            <span className="mi-color--red">BEARISH</span>
            <span className={`mi-sent-label mi-sent--${(data?.sentiment_label ?? 'neutral').toLowerCase()}`}>
              {data?.sentiment_label ?? 'NEUTRAL'} {data?.sentiment_score ?? 50}/100
            </span>
            <span className="mi-color--green">BULLISH</span>
          </div>

          {data?.top_news_headline && (
            <div className="mi-headline">"{data.top_news_headline}"</div>
          )}
        </div>

        <div className="mi-sep mi-sep--vertical" />

        {/* Tags + Sources */}
        <div className="mi-tags-col">
          <span className="mi-block-label">TRENDING SIGNALS</span>
          <div className="mi-tag-list">
            {(data?.top_news_tags ?? []).map(tag => (
              <span key={tag} className="mi-tag">{tag}</span>
            ))}
          </div>
          <div className="mi-sources">
            {(data?.data_sources ?? []).map(s => (
              <span key={s} className={`mi-source-badge ${s.includes('LIVE') ? 'mi-source-badge--live' : ''}`}>
                {s.includes('LIVE') ? '● ' : ''}{s.replace(' — LIVE', '').replace(' — seeded', '')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer — shows source mode + setup hint if no API key ── */}
      {!isLive && (
        <div className="mi-setup-hint">
          <WifiOff size={11} />
          <span>
            Showing seeded data. To enable live SoSoValue feed:
            add <code>VITE_SOSOVALUE_API_KEY</code> to your Vercel environment variables.
          </span>
          <a href="https://sosovalue.com/developer" target="_blank" rel="noreferrer">
            Get API key <ExternalLink size={9} />
          </a>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EndpointDot({ label, live, tooltip }) {
  return (
    <span
      className={`mi-ep-dot ${live ? 'mi-ep-dot--live' : 'mi-ep-dot--dead'}`}
      title={tooltip ?? (live ? `${label} — live` : `${label} — seeded`)}
    >
      {label}
    </span>
  )
}

const MISkeleton = () => (
  <div className="market-intel market-intel--skeleton">
    <div className="mi-accent-line mi-accent-line--seeded" />
    <div className="mi-header">
      <div className="mi-header-left">
        <Activity size={12} className="mi-pulse-icon" />
        <span className="mi-label">MARKET INTELLIGENCE</span>
      </div>
      <span className="mi-powered mi-color--dim">Fetching SoSoValue data…</span>
    </div>
    <div className="mi-skeleton-body">
      {[1,2,3,4].map(i => <div key={i} className="mi-skeleton-block" />)}
    </div>
  </div>
)

const MIError = ({ message, onRetry }) => (
  <div className="market-intel market-intel--error">
    <div className="mi-accent-line mi-accent-line--seeded" />
    <div className="mi-header">
      <div className="mi-header-left">
        <Zap size={12} className="mi-pulse-icon mi-pulse-icon--error" />
        <span className="mi-label">MARKET INTELLIGENCE</span>
      </div>
      <button className="mi-refresh" onClick={onRetry}>
        <RefreshCw size={11} /> RETRY
      </button>
    </div>
    <div className="mi-error-body">
      <span className="mi-color--red">{message}</span>
      <span className="mi-color--dim">Check VITE_SOSOVALUE_API_KEY in your environment</span>
    </div>
  </div>
)