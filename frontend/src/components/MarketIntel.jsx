import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, Zap, ExternalLink } from 'lucide-react'
import api from '../lib/api'
import './MarketIntel.css'

export default function MarketIntel() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/market/intelligence')
      .then(r => { setData(r.data.intelligence); setLoading(false) })
      .catch(e => { setError(e.response?.data?.message || 'Failed to fetch'); setLoading(false) })
  }, [])

  if (loading) return <MarketIntelSkeleton />
  if (error)   return <MarketIntelError message={error} />

  const inflowPositive = data.btc_etf_daily_inflow_usd > 0
  const fmtUSD = (v) => {
    const abs = Math.abs(v)
    if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`
    if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`
    return `${(v / 1e3).toFixed(0)}K`
  }

  return (
    <div className="market-intel">
      {/* Header */}
      <div className="mi-header">
        <div className="mi-header-left">
          <Zap size={12} className="mi-zap" />
          <span className="mi-label">MARKET INTELLIGENCE</span>
        </div>
        
        <a
          href="https://sosovalue.com"
          target="_blank"
          rel="noreferrer"
          className="mi-powered"
        >
          Powered by SoSoValue
          <ExternalLink size={9} />
        </a>
      </div>

      {/* ETF Flow strip */}
      <div className="mi-flow-strip">
        <div className="mi-flow-block">
          <span className="mi-flow-label">BTC ETF DAILY FLOW</span>
          <div className={`mi-flow-value ${inflowPositive ? 'mi-flow--pos' : 'mi-flow--neg'}`}>
            {inflowPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{inflowPositive ? '+' : ''}{fmtUSD(data.btc_etf_daily_inflow_usd)}</span>
          </div>
          <span className={`mi-signal mi-signal--${data.inflow_signal.toLowerCase()}`}>
            {data.inflow_signal}
          </span>
        </div>

        <div className="mi-divider" />

        <div className="mi-flow-block">
          <span className="mi-flow-label">TOTAL ETF ASSETS</span>
          <div className="mi-flow-value mi-flow--neutral">
            <span>${fmtUSD(data.btc_etf_total_assets_usd)}</span>
          </div>
          <span className="mi-signal mi-signal--neutral">AUM</span>
        </div>

        <div className="mi-divider" />

        <div className="mi-flow-block">
          <span className="mi-flow-label">CUMULATIVE INFLOW</span>
          <div className={`mi-flow-value ${data.btc_etf_cum_inflow_usd > 0 ? 'mi-flow--pos' : 'mi-flow--neg'}`}>
            <span>{data.btc_etf_cum_inflow_usd > 0 ? '+' : ''}{fmtUSD(data.btc_etf_cum_inflow_usd)}</span>
          </div>
          <span className="mi-signal mi-signal--neutral">SINCE LAUNCH</span>
        </div>
      </div>

      {/* Sentiment + Tags row */}
      <div className="mi-bottom">
        <div className="mi-sentiment">
          <span className="mi-flow-label">NEWS SENTIMENT</span>
          <div className="mi-sentiment-bar">
            <div
              className="mi-sentiment-fill"
              style={{ width: `${data.sentiment_score}%` }}
            />
          </div>
          <div className="mi-sentiment-labels">
            <span>BEARISH</span>
            <span className={`mi-sentiment-label mi-sent--${data.sentiment_label.toLowerCase()}`}>
              {data.sentiment_label} ({data.sentiment_score}/100)
            </span>
            <span>BULLISH</span>
          </div>
        </div>

        <div className="mi-tags">
          <span className="mi-flow-label">TRENDING TAGS</span>
          <div className="mi-tag-list">
            {data.top_news_tags.map((tag) => (
              <span key={tag} className="mi-tag">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MarketIntelSkeleton() {
  return (
    <div className="market-intel market-intel--loading">
      <div className="mi-header">
        <div className="mi-header-left">
          <Zap size={12} className="mi-zap" />
          <span className="mi-label">MARKET INTELLIGENCE</span>
        </div>
        <span className="mi-powered mi-powered--loading">Fetching SoSoValue data…</span>
      </div>
      <div className="mi-skeleton-rows">
        {[1,2,3].map(i => <div key={i} className="mi-skeleton-row" />)}
      </div>
    </div>
  )
}

function MarketIntelError({ message }) {
  return (
    <div className="market-intel market-intel--error">
      <div className="mi-header">
        <div className="mi-header-left">
          <Zap size={12} className="mi-zap" />
          <span className="mi-label">MARKET INTELLIGENCE</span>
        </div>
      </div>
      <div className="mi-error-body">
        <span className="mi-error-msg">SoSoValue API — {message}</span>
        <span className="mi-error-hint">Check SOSOVALUE_API_KEY in .env</span>
      </div>
    </div>
  )
}