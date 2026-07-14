import { useState } from 'react'
import { FileSearch, Loader, CheckCircle, AlertTriangle } from 'lucide-react'
import { runAtlasAgent } from '../lib/agents'
import './AtlasPanel.css'

export default function AtlasPanel() {
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await runAtlasAgent()
      setResult(r)
    } catch (e) {
      setError(e.message || 'Atlas failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="atlas-panel">
      <div className="atlas-header">
        <div className="atlas-header-left">
          <FileSearch size={12} className="atlas-icon" />
          <span className="atlas-label">ATLAS</span>
          <span className="atlas-sub">Audit Intelligence Agent</span>
        </div>
        <button className="atlas-run-btn" onClick={run} disabled={loading}>
          {loading
            ? <><Loader size={11} className="atlas-spin" /> ANALYZING…</>
            : result ? 'REFRESH' : 'GENERATE SUMMARY'
          }
        </button>
      </div>

      {error && <div className="atlas-error">{error}</div>}

      {result && !loading && (
        <div className="atlas-body">
          <div className="atlas-status-row">
            {result.status === 'CLEAN'
              ? <CheckCircle  size={13} className="atlas-status-icon atlas-status-icon--clean"  />
              : <AlertTriangle size={13} className="atlas-status-icon atlas-status-icon--review" />
            }
            <span className={`atlas-status-label atlas-status-label--${result.status?.toLowerCase()}`}>
              {result.status === 'CLEAN' ? 'CLEAN — No compliance concerns' : 'REVIEW REQUIRED'}
            </span>
            <span className="atlas-period">{result.period}</span>
          </div>

          <div className="atlas-counts">
            {Object.entries(result.event_counts || {}).map(([key, val]) => (
              <div key={key} className="atlas-count">
                <span className="atlas-count-value">{val}</span>
                <span className="atlas-count-label">{key.replace('Events','').toUpperCase()}</span>
              </div>
            ))}
            <div className="atlas-count">
              <span className={`atlas-count-value ${result.anomaly_count > 0 ? 'atlas-count-value--red' : 'atlas-count-value--green'}`}>
                {result.anomaly_count}
              </span>
              <span className="atlas-count-label">ANOMALIES</span>
            </div>
          </div>

          <pre className="atlas-summary">{result.summary}</pre>
        </div>
      )}
    </div>
  )
}