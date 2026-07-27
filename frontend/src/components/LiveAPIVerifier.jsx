import { useState, useEffect, useRef } from 'react'
import {
  Activity, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronUp, ExternalLink, RefreshCw, Zap
} from 'lucide-react'
import { fetchBTCETFMetrics, fetchNewsSentiment, fetchBTCPrice } from '../lib/sosovalue.js'
import './LiveAPIVerifier.css'

const ENDPOINTS = [
  {
    id:          'etf',
    name:        'BTC Spot ETF Metrics',
    method:      'POST',
    url:         'https://api.sosovalue.xyz/openapi/v2/etf/currentEtfDataMetrics',
    body:        '{"type":"us-btc-spot"}',
    description: 'Returns dailyNetInflow, totalNetAssets, cumNetInflow — gates every treasury approval',
    key_fields:  ['dailyNetInflow', 'totalNetAssets', 'cumNetInflow'],
    fetcher:     fetchBTCETFMetrics,
  },
  {
    id:          'news',
    name:        'AI News Sentiment Feed',
    method:      'GET',
    url:         'https://openapi.sosovalue.com/api/v1/news/featured/currency?pageNum=1&pageSize=30&categoryList=1,2,5,6',
    description: 'Returns AI-tagged news items — scored for bullish/bearish sentiment',
    key_fields:  ['sentiment_score', 'sentiment_label', 'articles_analysed', 'top_news_tags'],
    fetcher:     fetchNewsSentiment,
  },
  {
    id:          'price',
    name:        'Coin List — BTC Price',
    method:      'POST',
    url:         'https://openapi.sosovalue.com/openapi/v1/data/default/coin/list',
    body:        '{"pageNum":1,"pageSize":5,"sortField":"marketCap","sortOrder":"desc"}',
    description: 'Returns BTC real-time price — 3-layer fallback: SoSoValue → CoinGecko → Binance',
    key_fields:  ['btc_price_usd', 'btc_24h_change_pct', 'source'],
    fetcher:     fetchBTCPrice,
  },
]

export default function LiveAPIVerifier() {
  const [results, setResults]   = useState({})
  const [running, setRunning]   = useState({})
  const [expanded, setExpanded] = useState({})
  const [allRunning, setAllRunning] = useState(false)
  const [lastRun, setLastRun]   = useState(null)

  const runEndpoint = async (ep) => {
    setRunning(r => ({ ...r, [ep.id]: true }))
    const startMs = Date.now()
    try {
      const data    = await ep.fetcher()
      const latency = Date.now() - startMs
      setResults(r => ({ ...r, [ep.id]: { data, latency, error: null, ts: new Date() } }))
      setExpanded(e => ({ ...e, [ep.id]: true }))
    } catch (e) {
      setResults(r => ({ ...r, [ep.id]: { data: null, latency: Date.now() - startMs, error: e.message, ts: new Date() } }))
    } finally {
      setRunning(r => ({ ...r, [ep.id]: false }))
    }
  }

  const runAll = async () => {
    setAllRunning(true)
    await Promise.all(ENDPOINTS.map(ep => runEndpoint(ep)))
    setLastRun(new Date())
    setAllRunning(false)
  }

  // Auto-run on mount
  useEffect(() => { runAll() }, [])

  const allSuccess = ENDPOINTS.every(ep => results[ep.id]?.data && !results[ep.id]?.error)
  const anyResult  = ENDPOINTS.some(ep => results[ep.id])

  return (
    <div className="lav-panel">
      <div className="lav-header">
        <div className="lav-header-left">
          <Activity size={13} className="lav-icon" />
          <div className="lav-title-block">
            <span className="lav-title">LIVE SOSOVALUE API VERIFICATION</span>
            <span className="lav-sub">
              Real API calls — verifiable in your browser network tab
            </span>
          </div>
        </div>
        <div className="lav-header-right">
          {anyResult && (
            <div className={`lav-status-badge ${allSuccess ? 'lav-status-badge--live' : 'lav-status-badge--partial'}`}>
              {allSuccess ? <CheckCircle size={10} /> : <Activity size={10} />}
              {allSuccess ? 'ALL LIVE' : 'PARTIAL'}
            </div>
          )}
          {lastRun && (
            <span className="lav-last-run">
              Last: {lastRun.toLocaleTimeString()}
            </span>
          )}
          <button
            className={`lav-run-all ${allRunning ? 'lav-run-all--running' : ''}`}
            onClick={runAll}
            disabled={allRunning}
          >
            <RefreshCw size={11} className={allRunning ? 'lav-spin' : ''} />
            {allRunning ? 'CALLING APIs…' : 'VERIFY ALL LIVE'}
          </button>
        </div>
      </div>

      {/* How to verify instruction */}
      <div className="lav-instruction">
        <span className="lav-instruction-label">HOW TO INDEPENDENTLY VERIFY</span>
        <span className="lav-instruction-text">
          Open DevTools (F12) → Network tab → Filter by "sosovalue" →
          Click "VERIFY ALL LIVE" → Watch real API calls fire →
          Compare response values to{' '}
          <a href="https://sosovalue.com" target="_blank" rel="noreferrer">
            sosovalue.com <ExternalLink size={9} />
          </a>
        </span>
      </div>

      {/* Endpoint cards */}
      <div className="lav-endpoints">
        {ENDPOINTS.map(ep => {
          const result   = results[ep.id]
          const isRunning = running[ep.id]
          const isOpen   = expanded[ep.id]
          const hasData  = result?.data && !result?.error
          const hasError = result?.error

          return (
            <div
              key={ep.id}
              className={`lav-ep ${hasData ? 'lav-ep--success' : hasError ? 'lav-ep--error' : 'lav-ep--idle'}`}
            >
              <div className="lav-ep-header">
                <div className="lav-ep-left">
                  {isRunning ? (
                    <RefreshCw size={12} className="lav-ep-icon lav-spin" />
                  ) : hasData ? (
                    <CheckCircle size={12} className="lav-ep-icon lav-ep-icon--success" />
                  ) : hasError ? (
                    <XCircle size={12} className="lav-ep-icon lav-ep-icon--error" />
                  ) : (
                    <Clock size={12} className="lav-ep-icon lav-ep-icon--idle" />
                  )}
                  <div className="lav-ep-info">
                    <div className="lav-ep-name-row">
                      <span className={`lav-ep-method lav-ep-method--${ep.method.toLowerCase()}`}>
                        {ep.method}
                      </span>
                      <span className="lav-ep-name">{ep.name}</span>
                      {hasData && (
                        <span className="lav-ep-latency">
                          {result.latency}ms
                        </span>
                      )}
                    </div>
                    <span className="lav-ep-url">{ep.url}</span>
                    <span className="lav-ep-desc">{ep.description}</span>
                  </div>
                </div>
                <div className="lav-ep-right">
                  <button
                    className="lav-ep-run"
                    onClick={() => runEndpoint(ep)}
                    disabled={isRunning}
                  >
                    {isRunning ? 'CALLING…' : 'RUN'}
                  </button>
                  {result && (
                    <button
                      className="lav-ep-expand"
                      onClick={() => setExpanded(e => ({ ...e, [ep.id]: !e[ep.id] }))}
                    >
                      {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Response payload */}
              {isOpen && result && (
                <div className="lav-ep-body">
                  {hasError ? (
                    <div className="lav-ep-error-msg">
                      <XCircle size={11} />
                      {result.error}
                      <span className="lav-ep-error-hint">
                        Add VITE_SOSOVALUE_API_KEY to enable live calls
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Key fields highlighted */}
                      <div className="lav-key-fields">
                        <span className="lav-key-fields-label">KEY FIELDS FROM RESPONSE</span>
                        <div className="lav-key-grid">
                          {ep.key_fields.map(field => {
                            const val = result.data?.[field]
                            return (
                              <div key={field} className="lav-key-item">
                                <span className="lav-key-name">{field}</span>
                                <span className="lav-key-val">
                                  {formatValue(field, val)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      {/* Full response */}
                      <div className="lav-response-label">
                        FULL RESPONSE · {result.ts?.toLocaleTimeString()}
                      </div>
                      <pre className="lav-response-json">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="lav-footer">
        <Zap size={9} />
        All data live from SoSoValue API — same data gates every treasury approval in Privara Lite ·
        <a href="https://sosovalue.com/developer" target="_blank" rel="noreferrer">
          sosovalue.com/developer <ExternalLink size={9} />
        </a>
      </div>
    </div>
  )
}

function formatValue(field, val) {
  if (val === null || val === undefined) return '—'
  if (field.includes('inflow') || field.includes('assets') || field.includes('price_usd')) {
    const n = parseFloat(val)
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
    if (n >= 1e3) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    return `$${n.toFixed(2)}`
  }
  if (field.includes('change_pct')) return `${parseFloat(val) > 0 ? '+' : ''}${parseFloat(val).toFixed(2)}%`
  if (field === 'articles_analysed') return `${val} articles`
  if (Array.isArray(val)) return val.slice(0, 4).join(', ')
  return String(val)
}