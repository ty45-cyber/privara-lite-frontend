import { useState }                             from 'react'
import {
  Zap, TrendingUp, TrendingDown, Calendar,
  BarChart2, Shield, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, Clock, XCircle,
  RefreshCw, ExternalLink
} from 'lucide-react'
import api                                      from '../lib/api'
import './ApprovalIntelligence.css'

const VERDICT_CONFIG = {
  STRONGLY_FAVORABLE: { color: 'green',  icon: CheckCircle,   label: 'STRONGLY FAVORABLE' },
  FAVORABLE:          { color: 'green',  icon: CheckCircle,   label: 'FAVORABLE'           },
  NEUTRAL:            { color: 'dim',    icon: Shield,        label: 'NEUTRAL'             },
  CLEAR:              { color: 'green',  icon: CheckCircle,   label: 'CLEAR'               },
  MONITOR:            { color: 'amber',  icon: Clock,         label: 'MONITOR'             },
  CAUTION:            { color: 'amber',  icon: AlertTriangle, label: 'CAUTION'             },
  UNFAVORABLE:        { color: 'red',    icon: XCircle,       label: 'UNFAVORABLE'         },
}

const SIGNAL_ICONS = {
  'BTC Spot ETF Daily Flow':       TrendingUp,
  'AI News Sentiment':             BarChart2,
  'SSI Sector Rotation':           TrendingUp,
  'Macro Event Calendar':          Calendar,
  'BTC Corporate Treasury Signal': Shield,
}

const REC_CONFIG = {
  EXPEDITE:             { color: 'green', label: 'EXPEDITE APPROVAL',      icon: CheckCircle  },
  PROCEED:              { color: 'green', label: 'PROCEED',                icon: CheckCircle  },
  PROCEED_WITH_QUORUM:  { color: 'amber', label: 'PROCEED WITH QUORUM',    icon: AlertTriangle},
  REVIEW:               { color: 'amber', label: 'REVIEW REQUIRED',        icon: AlertTriangle},
  DELAY:                { color: 'red',   label: 'DELAY RECOMMENDED',      icon: XCircle      },
}

export default function ApprovalIntelligence({ requestId }) {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [expanded, setExpanded] = useState({})
  const [ran, setRan]           = useState(false)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await api.post(
        `/treasury/requests/${requestId}/approval-intelligence`, {}
      )
      setData(resp.data)
      setRan(true)
    } catch (e) {
      setError(e.response?.data?.message || 'Intelligence engine failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleSignal = (name) =>
    setExpanded(e => ({ ...e, [name]: !e[name] }))

  if (!ran && !loading) {
    return (
      <button className="ai-trigger" onClick={run}>
        <Zap size={13} />
        <div className="ai-trigger-text">
          <span className="ai-trigger-title">
            RUN FULL SOSOVALUE SIGNAL ANALYSIS
          </span>
          <span className="ai-trigger-sub">
            ETF flows · News sentiment · Sector rotation · Macro events · BTC treasury
          </span>
        </div>
      </button>
    )
  }

  if (loading) {
    return (
      <div className="ai-loading">
        <Zap size={14} className="ai-loading-icon" />
        <div className="ai-loading-text">
          <span className="ai-loading-title">
            Aggregating SoSoValue signals…
          </span>
          <div className="ai-loading-steps">
            {['ETF flows', 'News sentiment', 'Sector rotation', 'Macro calendar', 'BTC treasuries'].map((s, i) => (
              <span key={s} className="ai-loading-step" style={{ animationDelay: `${i * 0.2}s` }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ai-error">
        <AlertTriangle size={12} />
        {error}
        <button className="ai-retry" onClick={run}>RETRY</button>
      </div>
    )
  }

  if (!data) return null

  const rec     = REC_CONFIG[data.overall_recommendation] || REC_CONFIG.REVIEW
  const RecIcon = rec.icon

  return (
    <div className="ai-panel">

      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-left">
          <Zap size={13} className="ai-header-icon" />
          <div className="ai-header-text">
            <span className="ai-header-title">
              SOSOVALUE APPROVAL INTELLIGENCE
            </span>
            <span className="ai-header-sub">
              {data.signals?.length} signals · {data.data_sources?.length} SoSoValue endpoints
            </span>
          </div>
        </div>
        <button className="ai-rerun" onClick={run} disabled={loading}>
          <RefreshCw size={11} /> REFRESH
        </button>
      </div>

      {/* Executive summary */}
      <div className={`ai-summary ai-summary--${data.risk_level?.toLowerCase()}`}>
        <div className="ai-summary-top">
          <div className="ai-risk-block">
            <span className="ai-risk-label">COMPOSITE RISK</span>
            <span className={`ai-risk-value ai-risk-value--${data.risk_level?.toLowerCase()}`}>
              {data.risk_level}
            </span>
            <span className="ai-risk-score">
              Score: {data.composite_score}
            </span>
          </div>
          <div className="ai-rec-block">
            <RecIcon size={16} className={`ai-rec-icon ai-rec-icon--${rec.color}`} />
            <span className={`ai-rec-label ai-rec-label--${rec.color}`}>
              {rec.label}
            </span>
          </div>
          <div className="ai-verdicts">
            <div className="ai-verdict-stat ai-verdict-stat--green">
              <span className="ai-verdict-num">{data.verdict_summary?.favorable}</span>
              <span className="ai-verdict-sub">Favorable</span>
            </div>
            <div className="ai-verdict-stat ai-verdict-stat--amber">
              <span className="ai-verdict-num">{data.verdict_summary?.caution}</span>
              <span className="ai-verdict-sub">Caution</span>
            </div>
            <div className="ai-verdict-stat ai-verdict-stat--red">
              <span className="ai-verdict-num">{data.verdict_summary?.unfavorable}</span>
              <span className="ai-verdict-sub">Unfavorable</span>
            </div>
          </div>
        </div>
        <p className="ai-exec-summary">{data.executive_summary}</p>
      </div>

      {/* Signal breakdown — each one expandable */}
      <div className="ai-signals">
        <div className="ai-signals-label">SIGNAL BREAKDOWN — 5 SOSOVALUE SOURCES</div>
        {data.signals?.map((signal, i) => {
          const vcfg     = VERDICT_CONFIG[signal.verdict] || VERDICT_CONFIG.NEUTRAL
          const VIcon    = vcfg.icon
          const SigIcon  = SIGNAL_ICONS[signal.name] || Zap
          const isOpen   = expanded[signal.name]
          const positive = signal.score_adj <= 0

          return (
            <div
              key={i}
              className={`ai-signal ai-signal--${vcfg.color}`}
            >
              <div
                className="ai-signal-header"
                onClick={() => toggleSignal(signal.name)}
              >
                <div className="ai-signal-left">
                  <SigIcon size={12} className={`ai-signal-icon ai-signal-icon--${vcfg.color}`} />
                  <div className="ai-signal-info">
                    <span className="ai-signal-name">{signal.name}</span>
                    <span className="ai-signal-endpoint">{signal.endpoint}</span>
                  </div>
                </div>
                <div className="ai-signal-right">
                  <span className="ai-signal-value">{signal.value}</span>
                  <span className={`ai-signal-adj ${positive ? 'ai-adj--good' : 'ai-adj--bad'}`}>
                    {signal.score_adj > 0 ? '+' : ''}{signal.score_adj}
                  </span>
                  <span className={`ai-signal-verdict ai-signal-verdict--${vcfg.color}`}>
                    <VIcon size={10} />
                    {vcfg.label}
                  </span>
                  {isOpen
                    ? <ChevronUp size={12} className="ai-chevron" />
                    : <ChevronDown size={12} className="ai-chevron" />
                  }
                </div>
              </div>

              {isOpen && (
                <div className="ai-signal-detail">
                  <p className="ai-signal-insight">{signal.insight}</p>
                  {signal.direction && (
                    <div className="ai-signal-direction">
                      <span className="ai-direction-label">SIGNAL</span>
                      <span className={`ai-direction-value ai-direction-value--${vcfg.color}`}>
                        {signal.direction?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                  {signal.value_30d && (
                    <div className="ai-signal-direction">
                      <span className="ai-direction-label">30D TREND</span>
                      <span className="ai-direction-value">{signal.value_30d}</span>
                    </div>
                  )}
                  {signal.token && (
                    <div className="ai-signal-direction">
                      <span className="ai-direction-label">SSI TOKEN</span>
                      <span className="ai-direction-value ai-direction-value--green">
                        {signal.token}
                      </span>
                    </div>
                  )}
                  {signal.event && (
                    <div className="ai-signal-direction">
                      <span className="ai-direction-label">NEXT EVENT</span>
                      <span className="ai-direction-value">
                        {signal.event} · T-{signal.days_until}d
                      </span>
                    </div>
                  )}
                  {signal.recommendation && (
                    <div className="ai-signal-direction">
                      <span className="ai-direction-label">ACTION</span>
                      <span className={`ai-direction-value ai-direction-value--${vcfg.color}`}>
                        {signal.recommendation}
                      </span>
                    </div>
                  )}
                  <div className="ai-signal-source">
                    <Zap size={9} />
                    {signal.source}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Score breakdown */}
      <div className="ai-score-breakdown">
        <div className="ai-score-label">SCORE BREAKDOWN</div>
        <div className="ai-score-items">
          {data.signals?.map((s, i) => (
            <div key={i} className="ai-score-item">
              <span className="ai-score-item-name">
                {s.name.split(' ').slice(0, 2).join(' ')}
              </span>
              <div className="ai-score-bar-wrap">
                <div
                  className={`ai-score-bar ${s.score_adj <= 0 ? 'ai-score-bar--good' : 'ai-score-bar--bad'}`}
                  style={{ width: `${Math.min(Math.abs(s.score_adj) * 3, 100)}%` }}
                />
              </div>
              <span className={`ai-score-item-val ${s.score_adj <= 0 ? 'ai-adj--good' : 'ai-adj--bad'}`}>
                {s.score_adj > 0 ? '+' : ''}{s.score_adj}
              </span>
            </div>
          ))}
          {data.amount_penalty > 0 && (
            <div className="ai-score-item">
              <span className="ai-score-item-name">Amount Size</span>
              <div className="ai-score-bar-wrap">
                <div
                  className="ai-score-bar ai-score-bar--bad"
                  style={{ width: `${Math.min(data.amount_penalty * 2, 100)}%` }}
                />
              </div>
              <span className="ai-score-item-val ai-adj--bad">
                +{data.amount_penalty}
              </span>
            </div>
          )}
        </div>
        <div className="ai-score-total">
          <span>Composite Score</span>
          <span className={`ai-score-total-val ai-score-total-val--${data.risk_level?.toLowerCase()}`}>
            {data.composite_score}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="ai-footer">
        <Zap size={9} />
        {data.powered_by} ·
        Generated {new Date(data.generated_at).toLocaleTimeString()} ·
        <a href="https://sosovalue.com" target="_blank" rel="noreferrer">
          SoSoValue <ExternalLink size={9} />
        </a>
      </div>
    </div>
  )
}