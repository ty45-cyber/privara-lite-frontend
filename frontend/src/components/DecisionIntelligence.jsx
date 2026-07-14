import { useState, useEffect } from 'react'
import { BarChart2, TrendingUp, Shield, Target, FileText, Loader } from 'lucide-react'
import { getUser } from '../lib/auth'
import api from '../lib/api'
import './DecisionIntelligence.css'

export default function DecisionIntelligence() {
  const user = getUser()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!['admin','finance'].includes(user?.role)) { setLoading(false); return }
    api.get('/treasury/decision-history')
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const exportPdf = async () => {
    setExporting(true)
    try {
      const resp = await api.get('/treasury/decision-history/pdf', { responseType: 'blob' })
      const blob = new Blob([resp.data], { type: 'application/pdf' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `privara-risk-validation-${new Date().toISOString().slice(0,10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('PDF export failed:', e)
    } finally {
      setExporting(false)
    }
  }

  if (!['admin','finance'].includes(user?.role)) return null
  if (loading) return <div className="di-loading">Loading decision intelligence…</div>
  if (!data)   return null

  const { summary, decisions } = data

  return (
    <div className="di-panel">
      <div className="di-header">
        <div className="di-header-left">
          <BarChart2 size={12} className="di-icon" />
          <span className="di-label">DECISION INTELLIGENCE</span>
          <span className="di-sub">SoSoValue risk accuracy tracking</span>
        </div>
        <button
          className="di-export-btn"
          onClick={exportPdf}
          disabled={exporting}
        >
          {exporting
            ? <><Loader size={11} className="di-export-spin" /> GENERATING…</>
            : <><FileText size={11} /> EXPORT VALIDATION REPORT</>
          }
        </button>
      </div>

      <div className="di-stats">
        <div className="di-stat">
          <span className="di-stat-label">ACCURACY</span>
          <span className="di-stat-value di-stat-value--green">{summary.accuracy_pct}%</span>
          <span className="di-stat-sub">decisions validated</span>
        </div>
        <div className="di-stat">
          <span className="di-stat-label">CAPITAL DEPLOYED</span>
          <span className="di-stat-value">${(summary.total_capital_deployed / 1000).toFixed(0)}K</span>
          <span className="di-stat-sub">approved requests</span>
        </div>
        <div className="di-stat">
          <span className="di-stat-label">CAPITAL PROTECTED</span>
          <span className="di-stat-value di-stat-value--amber">${(summary.capital_protected / 1000).toFixed(0)}K</span>
          <span className="di-stat-sub">from rejected requests</span>
        </div>
        <div className="di-stat">
          <span className="di-stat-label">POSITIVE OUTCOMES</span>
          <span className="di-stat-value di-stat-value--green">{summary.positive_outcomes}/{summary.total_decisions}</span>
          <span className="di-stat-sub">30-day validated</span>
        </div>
      </div>

      <div className="di-history">
        {decisions.map(d => {
          const outcomeCfg = {
            POSITIVE:  { color: 'green', label: 'POSITIVE'  },
            VALIDATED: { color: 'green', label: 'VALIDATED' },
            NEGATIVE:  { color: 'red',   label: 'NEGATIVE'  },
            PENDING:   { color: 'amber', label: 'PENDING'   },
          }[d.outcome_30d] || { color: 'amber', label: 'PENDING' }

          const priceDelta = d.btc_price_30d_later && d.btc_price_at_decision
            ? (((d.btc_price_30d_later - d.btc_price_at_decision) / d.btc_price_at_decision) * 100).toFixed(1)
            : null

          return (
            <div key={d.id} className="di-row">
              <div className="di-row-left">
                <div className={`di-decision-badge di-decision-badge--${d.decision === 'approved' ? 'green' : 'red'}`}>
                  {d.decision === 'approved' ? <TrendingUp size={10} /> : <Shield size={10} />}
                </div>
                <div className="di-row-info">
                  <span className="di-row-title">{d.title}</span>
                  <span className="di-row-meta">
                    {d.currency} {(d.amount / 1000).toFixed(0)}K ·
                    Risk: <span className={`di-risk-inline di-risk-inline--${d.risk_score_at_decision?.toLowerCase()}`}>
                      {d.risk_score_at_decision}
                    </span> ·
                    Sentiment: {d.sentiment_at_decision}/100
                    {priceDelta && ` · BTC ${priceDelta > 0 ? '+' : ''}${priceDelta}% after`}
                  </span>
                  <span className="di-row-notes">{d.outcome_notes}</span>
                </div>
              </div>
              <span className={`di-outcome di-outcome--${outcomeCfg.color}`}>
                {outcomeCfg.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="di-footer">
        <Target size={10} />
        Risk scores derived from SoSoValue ETF flows + news sentiment ·
        Outcomes tracked at T+30 days
      </div>
    </div>
  )
}