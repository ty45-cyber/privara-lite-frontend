import { useState, useEffect } from 'react'
import { Zap, CheckCircle, ExternalLink } from 'lucide-react'
import api from '../lib/api'
import './EcosystemScore.css'

export default function EcosystemScore() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    api.get('/ssv/ecosystem-score')
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !data) return null

  const pct = Math.round((data.score / data.max_score) * 100)

  return (
    <div className="eco-panel">
      <div className="eco-header" onClick={() => setExpanded(e => !e)}>
        <div className="eco-header-left">
          <Zap size={12} className="eco-icon" />
          <span className="eco-label">SOSOVALUE ECOSYSTEM INTEGRATION DEPTH</span>
        </div>
        <div className="eco-header-right">
          <div className="eco-score-mini">
            <span className="eco-score-num">{data.score}</span>
            <span className="eco-score-den">/{data.max_score}</span>
          </div>
          <div className="eco-score-bar-mini">
            <div className="eco-score-fill-mini" style={{ width: `${pct}%` }} />
          </div>
          <span className="eco-verdict">{data.verdict}</span>
        </div>
      </div>

      {expanded && (
        <div className="eco-body">
          <div className="eco-score-block">
            <div className="eco-score-main">
              <span className="eco-score-big">{data.score}</span>
              <span className="eco-score-max">/ {data.max_score}</span>
            </div>
            <div className="eco-score-bar">
              <div className="eco-score-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="eco-score-verdict">{data.verdict}</div>
            <p className="eco-score-note">{data.note}</p>
          </div>

          <div className="eco-breakdown">
            <div className="eco-breakdown-label">INTEGRATION BREAKDOWN</div>
            {data.breakdown.map((b, i) => (
              <div key={i} className={`eco-item ${b.used ? 'eco-item--used' : 'eco-item--unused'}`}>
                <CheckCircle size={11} className={`eco-item-check ${b.used ? 'eco-item-check--used' : ''}`} />
                <div className="eco-item-info">
                  <span className="eco-item-name">{b.component}</span>
                  <span className="eco-item-endpoint">{b.endpoint}</span>
                </div>
                <div className="eco-item-score">
                  <span className="eco-item-pts">{b.score}/{b.weight}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="eco-footer">
            <Zap size={9} />
            Removing SoSoValue from Privara Lite would collapse the risk engine,
            the autonomous loop, the sector intelligence, the ValueChain settlement,
            and the AI research layer. SoSoValue is not a feature. It is the foundation.
            <a href="https://sosovalue.com/developer" target="_blank" rel="noreferrer">
              SoSoValue API <ExternalLink size={9} />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}