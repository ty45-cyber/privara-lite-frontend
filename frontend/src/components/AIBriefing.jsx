import { useState } from 'react'
import { Sparkles, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import api from '../lib/api'
import './AIBriefing.css'

const REC_CONFIG = {
  APPROVE: { icon: CheckCircle, color: 'green', label: 'APPROVE' },
  DELAY:   { icon: Clock,       color: 'amber', label: 'DELAY'   },
  REJECT:  { icon: XCircle,     color: 'red',   label: 'REJECT'  },
}

export default function AIBriefing({ requestId, title, amount, currency }) {
  const [briefing, setBriefing]   = useState(null)
  const [snapshot, setSnapshot]   = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/market/briefing', {
        treasury_title:    title,
        treasury_amount:   amount,
        treasury_currency: currency,
      })
      setBriefing(data.briefing)
      setSnapshot(data.market_snapshot)
    } catch (e) {
      setError(e.response?.data?.message || 'Briefing failed')
    } finally {
      setLoading(false)
    }
  }

  if (!briefing && !loading && !error) {
    return (
      <button className="briefing-trigger" onClick={generate}>
        <Sparkles size={12} />
        GENERATE AI BRIEFING
      </button>
    )
  }

  if (loading) {
    return (
      <div className="briefing-loading">
        <Sparkles size={12} className="briefing-loading-icon" />
        <span>Claude Sonnet analysing SoSoValue market data…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="briefing-error">
        <AlertTriangle size={12} />
        {error}
        <button className="briefing-retry" onClick={generate}>RETRY</button>
      </div>
    )
  }

  const rec     = REC_CONFIG[briefing?.recommendation] || REC_CONFIG.DELAY
  const RecIcon = rec.icon

  return (
    <div className={`briefing-panel briefing-panel--${rec.color}`}>
      <div className="briefing-header">
        <div className="briefing-header-left">
          <Sparkles size={12} className="briefing-spark" />
          <span className="briefing-label">AI TREASURY BRIEFING</span>
        </div>
        <div className="briefing-header-right">
          <span className="briefing-confidence">{briefing.confidence} CONFIDENCE</span>
          <span className={`briefing-rec briefing-rec--${rec.color}`}>
            <RecIcon size={11} />
            {rec.label}
          </span>
        </div>
      </div>

      <div className="briefing-body">
        <p className="briefing-headline">{briefing.headline}</p>

        <div className="briefing-signals">
          <div className="briefing-signal">
            <span className="briefing-signal-label">ETF SIGNAL</span>
            <span className="briefing-signal-text">{briefing.etf_signal}</span>
          </div>
          <div className="briefing-signal">
            <span className="briefing-signal-label">SENTIMENT</span>
            <span className="briefing-signal-text">{briefing.sentiment_signal}</span>
          </div>
          <div className="briefing-signal briefing-signal--risk">
            <span className="briefing-signal-label">RISK NOTE</span>
            <span className="briefing-signal-text">{briefing.risk_note}</span>
          </div>
        </div>

        {snapshot && (
          <div className="briefing-snapshot">
            <span>BTC {snapshot.btc_price ? `$${Number(snapshot.btc_price).toLocaleString()}` : '—'}</span>
            <span className="briefing-snap-sep">·</span>
            <span>{snapshot.inflow_signal}</span>
            <span className="briefing-snap-sep">·</span>
            <span>{snapshot.sentiment}</span>
            <span className="briefing-snap-sep">·</span>
            <span className="briefing-attr">Powered by SoSoValue + Claude Sonnet</span>
          </div>
        )}
      </div>

      <button className="briefing-regenerate" onClick={generate} disabled={loading}>
        REFRESH BRIEFING
      </button>
    </div>
  )
}