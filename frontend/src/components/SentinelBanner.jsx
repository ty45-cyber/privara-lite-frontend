import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react'
import { runSentinelAgent } from '../lib/agents'
import { getUser } from '../lib/auth'
import './SentinelBanner.css'

export default function SentinelBanner() {
  const user = getUser()
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!['admin','finance'].includes(user?.role)) { setLoading(false); return }
    runSentinelAgent()
      .then(r  => { setResult(r); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (!['admin','finance'].includes(user?.role)) return null
  if (loading) return <SentinelLoading />
  if (!result || dismissed) return null

  const { status, alerts, alert_count, market_snapshot, scanned_at } = result
  const isClean = status === 'ALL_CLEAR'

  return (
    <div className={`sentinel-banner sentinel-banner--${isClean ? 'clean' : 'alert'}`}>
      <div className="sentinel-header">
        <div className="sentinel-header-left">
          {isClean
            ? <CheckCircle size={13} className="sentinel-icon sentinel-icon--clean" />
            : <AlertTriangle size={13} className="sentinel-icon sentinel-icon--alert" />
          }
          <span className="sentinel-agent-name">SENTINEL</span>
          <span className="sentinel-status-text">
            {isClean
              ? `All clear — ${result.pending_count} pending request${result.pending_count !== 1 ? 's' : ''} within normal parameters`
              : `${alert_count} alert${alert_count > 1 ? 's' : ''} detected — ${result.pending_count} request${result.pending_count !== 1 ? 's' : ''} flagged`
            }
          </span>
        </div>
        <div className="sentinel-header-right">
          <span className="sentinel-market">
            BTC ${market_snapshot.btc_price?.toLocaleString('en-US', { maximumFractionDigits: 0 })} ·
            {market_snapshot.inflow_signal} ·
            {market_snapshot.sentiment}
          </span>
          {!isClean && (
            <button className="sentinel-expand" onClick={() => setExpanded(e => !e)}>
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {expanded ? 'HIDE' : 'SHOW ALERTS'}
            </button>
          )}
          <button className="sentinel-dismiss" onClick={() => setDismissed(true)}>
            <X size={11} />
          </button>
        </div>
      </div>

      {expanded && alerts.length > 0 && (
        <div className="sentinel-alerts">
          {alerts.map((alert, i) => (
            <div key={i} className={`sentinel-alert sentinel-alert--${alert.severity.toLowerCase()}`}>
              <AlertTriangle size={11} className="sentinel-alert-icon" />
              <div className="sentinel-alert-content">
                <span className="sentinel-alert-message">{alert.message}</span>
                <span className="sentinel-alert-action">→ {alert.action}</span>
              </div>
              <span className={`sentinel-alert-badge sentinel-alert-badge--${alert.severity.toLowerCase()}`}>
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="sentinel-footer">
        <Shield size={9} />
        Sentinel AI · Scanned {new Date(scanned_at).toLocaleTimeString()} ·
        Powered by SoSoValue live feed
      </div>
    </div>
  )
}

const SentinelLoading = () => (
  <div className="sentinel-banner sentinel-banner--loading">
    <Shield size={12} className="sentinel-loading-icon" />
    <span>Sentinel scanning treasury positions…</span>
  </div>
)