import { useEffect, useMemo, useState } from 'react'
import { RefreshCcw, Signal, Database } from 'lucide-react'
import api from '../lib/api'
import { getUser } from '../lib/auth'
import './MarketIntel.css'

const formatCompactUSD = (n) => {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  if (Math.abs(v) >= 1e12) return `$${(v / 1e12).toFixed(1)}T`
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}K`
  return `$${v.toFixed(0)}`
}

const sentimentToBand = (score) => {
  const s = Number(score)
  if (!Number.isFinite(s)) return { cursorPct: 50, cls: 'mi-sent--neutral', label: 'NEUTRAL' }
  // 0..100 => 0..100
  const cursorPct = Math.min(100, Math.max(0, s))
  if (s >= 66) return { cursorPct, cls: 'mi-sent--bullish', label: 'BULLISH' }
  if (s <= 34) return { cursorPct, cls: 'mi-sent--bearish', label: 'BEARISH' }
  return { cursorPct, cls: 'mi-sent--neutral', label: 'NEUTRAL' }
}

export default function MarketIntel() {
  const user = getUser()
  const canView = useMemo(() => ['admin', 'finance', 'hr'].includes(user?.role), [user?.role])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchIntel = async () => {
    setError(null)
    try {
      setLoading(true)
      const resp = await api.get('/market/intelligence')
      setData(resp.data?.intelligence ? resp.data : resp.data) // defensive
      setLoading(false)
    } catch (e) {
      setError(e)
      setLoading(false)
    }
  }

  const refresh = async () => {
    setRefreshing(true)
    try {
      const resp = await api.get('/market/intelligence')
      setData(resp.data?.intelligence ? resp.data : resp.data)
      setError(null)
    } catch (e) {
      setError(e)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!canView) return
    fetchIntel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView])

  if (!canView) return null

  const intel = data?.intelligence || data
  const sentimentScore = intel?.sentiment_score
  const band = sentimentToBand(sentimentScore)

  const flowBadge = intel?.inflow_signal === 'INFLOW'
    ? { cls: 'mi-signal-badge--inflow', label: 'ETF INFLOW' }
    : intel?.inflow_signal === 'OUTFLOW'
      ? { cls: 'mi-signal-badge--outflow', label: 'ETF OUTFLOW' }
      : { cls: 'mi-signal-badge--neutral', label: 'BALANCED' }

  const poweredBy = intel?.powered_by || 'SoSoValue API + SoDEX'

  return (
    <section className={`market-intel ${error ? 'market-intel--error' : ''}`}>
      <div className="mi-header">
        <div className="mi-header-left">
          <Signal size={12} className={`mi-pulse-icon ${error ? 'mi-pulse-icon--error' : ''}`} />
          <span className="mi-label">MARKET INTELLIGENCE</span>
          <span className={['BULLISH', 'BEARISH'].includes(band.label) ? `mi-sent-label ${band.cls}` : `mi-sent-label ${band.cls}`}>
            {band.label}
          </span>
        </div>

        <div className="mi-header-right">
          <span className={`mi-signal-badge ${flowBadge.cls}`}>{flowBadge.label}</span>
          <button
            type="button"
            className={`mi-refresh ${refreshing ? 'mi-refresh--spinning' : ''}`}
            onClick={refresh}
            disabled={refreshing}
            aria-label="Refresh market intel"
          >
            <RefreshCcw size={13} />
            {refreshing ? 'REFRESHING' : 'REFRESH'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mi-skeleton-body market-intel--skeleton">
          <div className="mi-skeleton-block" />
          <div className="mi-skeleton-block" />
          <div className="mi-skeleton-block" />
        </div>
      ) : error ? (
        <div className="mi-error-body">
          <strong>Market intel unavailable</strong>
          <span>{error?.response?.data?.message || error?.message || 'Unexpected error'}</span>
        </div>
      ) : (
        <>
          <div className="mi-strip">
            <div className="mi-block">
              <div className="mi-block-label">ETF DAILY INFLOW</div>
              <div className="mi-block-value mi-block-value--primary">{formatCompactUSD(intel?.btc_etf_daily_inflow_usd)}</div>
              <div className="mi-block-sub">
                <span className="mi-color--dim">24h change:</span>
                <span className={intel?.btc_24h_change_pct >= 0 ? 'mi-color--green' : 'mi-color--red'}>
                  {intel?.btc_24h_change_pct != null ? `${intel.btc_24h_change_pct.toFixed(2)}%` : '—'}
                </span>
              </div>
            </div>

            <div className="mi-sep" />

            <div className="mi-block">
              <div className="mi-block-label">BTC PRICE</div>
              <div className="mi-block-value">${intel?.btc_price_usd != null ? Number(intel.btc_price_usd).toLocaleString() : '—'}</div>
              <div className="mi-block-sub">
                <Database size={12} />
                <span className="mi-color--dim">Liquidity tier:</span>
                <span className="mi-color--amber">{intel?.sodex_liquidity_tier || '—'}</span>
              </div>
            </div>

            <div className="mi-sep" />

            <div className="mi-block">
              <div className="mi-block-label">SENTIMENT</div>
              <div className="mi-block-value">{sentimentScore != null ? `${sentimentScore}/100` : '—'}</div>
              <div className="mi-block-sub">
                <span className={`mi-color--${band.label === 'BULLISH' ? 'green' : band.label === 'BEARISH' ? 'red' : 'amber'}`}>{band.label}</span>
                <span className="mi-color--dim">/ news + flows</span>
              </div>
            </div>
          </div>

          <div className="mi-bottom">
            <div className="mi-sentiment-col">
              <div className="mi-block-label">SENTIMENT TRACK</div>
              <div className="mi-sentiment-track" aria-hidden="true">
                <div className="mi-sentiment-fill" style={{ width: `${band.cursorPct}%` }} />
                <div className="mi-sentiment-cursor" style={{ left: `${band.cursorPct}%` }} />
              </div>
              <div className="mi-sentiment-ends">
                <span className="mi-sent-label mi-sent--bearish">BEARISH</span>
                <span className="mi-sent-label mi-sent--neutral">NEUTRAL</span>
                <span className="mi-sent-label mi-sent--bullish">BULLISH</span>
              </div>

              <div className="mi-headline">{intel?.top_news_headline || intel?.top_news_tags?.slice(0, 3).join(' · ') || '—'}</div>
            </div>

            <div />

            <div className="mi-tags-col">
              <div className="mi-block-label">TOP SIGNAL TAGS</div>
              <div className="mi-tag-list">
                {(intel?.top_news_tags || []).slice(0, 8).map((t) => (
                  <span key={t} className="mi-tag">{t}</span>
                ))}
              </div>
              <div className="mi-sources">
                {(intel?.data_sources || []).slice(0, 3).map((s) => (
                  <span key={s} className="mi-source-badge">{s}</span>
                ))}
              </div>
              <a className="mi-powered" href="#" onClick={(e) => e.preventDefault()}>
                {poweredBy}
              </a>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

