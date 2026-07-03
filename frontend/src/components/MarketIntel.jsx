import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, Zap, ExternalLink, RefreshCw, Activity } from 'lucide-react'
import api from '../lib/api'
import './MarketIntel.css'

const REFRESH_INTERVAL_MS = 60_000

export default function MarketIntel() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [lastFetch, setLastFetch] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetch = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const r = await api.get('/market/intelligence')
      setData(r.data.intelligence)
      setLastFetch(new Date())
      setError(null)
    } catch (e) {
      setError(e.response?.data?.message || 'SoSoValue API unreachable')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetch()
    const timer = setInterval(() => fetch(), REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [fetch])

  if (loading) return <MISkeleton />
  if (error)   return <MIError message={error} onRetry={() => fetch(true)} />

  const inflowPos   = data.btc_etf_daily_inflow_usd > 0
  const btcPos      = data.btc_24h_change_pct > 0
  const fmtUSD = (v) => {
    const a = Math.abs(v)
    if (a >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
    if (a >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
    if (a >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
    return `$${v.toFixed(0)}`
  }
  const fmtPrice = (v) =>
    v > 0 ? `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'

  return (
    <div className="market-intel">
      {/* Top bar */}
      <div className="mi-header">
        <div className="mi-header-left">
          <Activity size={12} className="mi-pulse-icon" />
          <span className="mi-label">MARKET INTELLIGENCE</span>
          <span className={`mi-signal-badge mi-signal-badge--${data.inflow_signal.toLowerCase()}`}>
            {data.inflow_signal}
          </span>
        </div>
        <div className="mi-header-right">
          {lastFetch && (
            <span className="mi-last-fetch">
              {lastFetch.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            className={`mi-refresh ${refreshing ? 'mi-refresh--spinning' : ''}`}
            onClick={() => fetch(true)}
            title="Refresh market data"
          >
            <RefreshCw size={11} />
          </button>
          <a href="https://sosovalue.com" target="_blank" rel="noreferrer" className="mi-powered">
            SoSoValue <ExternalLink size={9} />
          </a>
        </div>
      </div>

      {/* Main metrics strip */}
      <div className="mi-strip">
        {/* BTC price */}
        <div className="mi-block">
          <span className="mi-block-label">BTC PRICE</span>
          <span className="mi-block-value mi-block-value--primary">
            {fmtPrice(data.btc_price_usd)}
          </span>
          <span className={`mi-block-sub ${btcPos ? 'mi-color--green' : 'mi-color--red'}`}>
            {btcPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {btcPos ? '+' : ''}{data.btc_24h_change_pct?.toFixed(2)}%
          </span>
        </div>

        <div className="mi-sep" />

        {/* ETF daily flow */}
        <div className="mi-block">
          <span className="mi-block-label">BTC ETF DAILY FLOW</span>
          <span className={`mi-block-value ${inflowPos ? 'mi-color--green' : 'mi-color--red'}`}>
            {inflowPos ? '+' : ''}{fmtUSD(data.btc_etf_daily_inflow_usd)}
          </span>
          <span className="mi-block-sub mi-color--dim">
            AUM {fmtUSD(data.btc_etf_total_assets_usd)}
          </span>
        </div>

        <div className="mi-sep" />

        {/* Cumulative ETF */}
        <div className="mi-block">
          <span className="mi-block-label">CUMULATIVE ETF INFLOW</span>
          <span className={`mi-block-value ${data.btc_etf_cum_inflow_usd > 0 ? 'mi-color--green' : 'mi-color--red'}`}>
            {data.btc_etf_cum_inflow_usd > 0 ? '+' : ''}{fmtUSD(data.btc_etf_cum_inflow_usd)}
          </span>
          <span className="mi-block-sub mi-color--dim">Since ETF launch</span>
        </div>

        <div className="mi-sep" />

        {/* SoDEX TVL */}
        <div className="mi-block">
          <span className="mi-block-label">SoDEX TVL</span>
          <span className="mi-block-value mi-color--amber">
            {fmtUSD(data.sodex_tvl_usd)}
          </span>
          <span className="mi-block-sub mi-color--dim">
            Liquidity: {data.sodex_liquidity_tier}
          </span>
        </div>
      </div>

      {/* Sentiment + tags */}
      <div className="mi-bottom">
        <div className="mi-sentiment-col">
          <span className="mi-block-label">AI NEWS SENTIMENT</span>
          <div className="mi-sentiment-track">
            <div
              className="mi-sentiment-fill"
              style={{ width: `${data.sentiment_score}%` }}
            />
            <div
              className="mi-sentiment-cursor"
              style={{ left: `${data.sentiment_score}%` }}
            />
          </div>
          <div className="mi-sentiment-ends">
            <span className="mi-color--red">BEARISH</span>
            <span className={`mi-sent-label mi-sent--${data.sentiment_label?.toLowerCase()}`}>
              {data.sentiment_label} {data.sentiment_score}/100
            </span>
            <span className="mi-color--green">BULLISH</span>
          </div>
          {data.top_news_headline && (
            <div className="mi-headline">"{data.top_news_headline}"</div>
          )}
        </div>

        <div className="mi-sep mi-sep--vertical" />

        <div className="mi-tags-col">
          <span className="mi-block-label">TRENDING SIGNALS</span>
          <div className="mi-tag-list">
            {data.top_news_tags?.map((tag) => (
              <span key={tag} className="mi-tag">{tag}</span>
            ))}
          </div>
          <div className="mi-sources">
            {data.data_sources?.map((s) => (
              <span key={s} className="mi-source-badge">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const MISkeleton = () => (
  <div className="market-intel market-intel--skeleton">
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
    <div className="mi-header">
      <div className="mi-header-left">
        <Zap size={12} className="mi-pulse-icon mi-pulse-icon--error" />
        <span className="mi-label">MARKET INTELLIGENCE</span>
      </div>
      <button className="mi-refresh" onClick={onRetry}><RefreshCw size={11} /> RETRY</button>
    </div>
    <div className="mi-error-body">
      <span className="mi-color--red">{message}</span>
      <span className="mi-color--dim">Check SOSOVALUE_API_KEY — data will retry automatically</span>
    </div>
  </div>
)