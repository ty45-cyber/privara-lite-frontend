import { useState, useEffect, useRef } from 'react'
import {
  Zap, Play, Settings, CheckCircle, XCircle,
  AlertTriangle, Clock, ExternalLink, Activity,
  Shield, TrendingUp, RefreshCw
} from 'lucide-react'
import { getUser } from '../lib/auth'
import { runAutonomousLoop, getLoopPolicy, updateLoopPolicy, getLoopHistory } from '../lib/agents'
import './AutonomousLoop.css'

const ACTION_CONFIG = {
  AUTO_BLOCKED:             { color: 'red',   icon: XCircle,       label: 'AUTO-BLOCKED'   },
  AUTO_APPROVED:            { color: 'green', icon: CheckCircle,    label: 'AUTO-APPROVED'  },
  AUTO_APPROVED_AND_EXECUTED:{ color: 'green', icon: CheckCircle,   label: 'APPROVED + EXECUTED' },
  FLAGGED_FOR_REVIEW:       { color: 'amber', icon: AlertTriangle,  label: 'FLAGGED'        },
}

export default function AutonomousLoop() {
  const user = getUser()
  const [running, setRunning]       = useState(false)
  const [result, setResult]         = useState(null)
  const [policy, setPolicy]         = useState(null)
  const [history, setHistory]       = useState(null)
  const [showPolicy, setShowPolicy] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [tab, setTab]               = useState('run')
  const intervalRef                 = useRef(null)
  const [autoRunning, setAutoRunning] = useState(false)

  useEffect(() => {
    if (!['admin','finance'].includes(user?.role)) return
    loadPolicy()
    loadHistory()
  }, [])

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const loadPolicy  = async () => {
    try {
      const r = await getLoopPolicy()
      setPolicy(r.policy)
    } catch { /* non-blocking */ }
  }

  const loadHistory = async () => {
    try {
      const r = await getLoopHistory()
      setHistory(r)
    } catch { /* non-blocking */ }
  }

  const runLoop = async () => {
    setRunning(true)
    try {
      const r = await runAutonomousLoop()
      setResult(r)
      loadHistory()
    } catch (e) {
      console.error('Loop failed:', e)
    } finally {
      setRunning(false)
    }
  }

  const toggleAutoRun = () => {
    if (autoRunning) {
      clearInterval(intervalRef.current)
      setAutoRunning(false)
    } else {
      runLoop()
      intervalRef.current = setInterval(runLoop, 30_000)
      setAutoRunning(true)
    }
  }

  const savePolicy = async (updates) => {
    setSaving(true)
    try {
      const r = await updateLoopPolicy(updates)
      setPolicy(r.policy)
    } catch { /* non-blocking */ }
    finally { setSaving(false) }
  }

  if (!['admin','finance'].includes(user?.role)) return null

  return (
    <div className="al-panel">
      {/* Header */}
      <div className="al-header">
        <div className="al-header-left">
          <Activity size={14} className="al-icon" />
          <div className="al-title-row">
            <span className="al-title">AUTONOMOUS FINANCIAL LOOP</span>
            <span className="al-sub">
              Sentinel · SoSoValue · Policy Engine · SoDEX
            </span>
          </div>
        </div>
        <div className="al-header-right">
          {autoRunning && (
            <span className="al-live-badge">
              <span className="al-live-dot" />
              LOOP RUNNING
            </span>
          )}
          <button
            className={`al-autorun-btn ${autoRunning ? 'al-autorun-btn--active' : ''}`}
            onClick={toggleAutoRun}
          >
            {autoRunning ? <><RefreshCw size={11} className="al-spin" /> STOP AUTO-RUN</> : <><Play size={11} /> START AUTO-RUN</>}
          </button>
          <button
            className="al-run-btn"
            onClick={runLoop}
            disabled={running}
          >
            {running
              ? <><RefreshCw size={11} className="al-spin" /> RUNNING…</>
              : <><Zap size={11} /> RUN ONCE</>
            }
          </button>
          <button className="al-policy-btn" onClick={() => setShowPolicy(p => !p)}>
            <Settings size={11} /> POLICY
          </button>
        </div>
      </div>

      {/* Architecture diagram */}
      <div className="al-architecture">
        <div className="al-arch-step al-arch-step--ssv">
          <Zap size={11} />
          <span>SoSoValue</span>
          <span className="al-arch-sub">ETF + Sentiment</span>
        </div>
        <div className="al-arch-arrow">→</div>
        <div className="al-arch-step al-arch-step--sentinel">
          <Shield size={11} />
          <span>Sentinel</span>
          <span className="al-arch-sub">Risk Scan</span>
        </div>
        <div className="al-arch-arrow">→</div>
        <div className="al-arch-step al-arch-step--policy">
          <Settings size={11} />
          <span>Policy Engine</span>
          <span className="al-arch-sub">AUTO / HUMAN</span>
        </div>
        <div className="al-arch-arrow">→</div>
        <div className="al-arch-step al-arch-step--sodex">
          <TrendingUp size={11} />
          <span>SoDEX</span>
          <span className="al-arch-sub">On-Chain Exec</span>
        </div>
        <div className="al-arch-arrow">→</div>
        <div className="al-arch-step al-arch-step--atlas">
          <CheckCircle size={11} />
          <span>Atlas</span>
          <span className="al-arch-sub">Outcome Log</span>
        </div>
      </div>

      {/* Policy editor */}
      {showPolicy && policy && (
        <div className="al-policy">
          <div className="al-policy-header">
            <Settings size={12} />
            <span>POLICY ENGINE — Autonomous decision rules</span>
          </div>
          <div className="al-policy-grid">
            <PolicyToggle
              label="Auto-execute after approval"
              description="Trigger SoDEX immediately when quorum is met at LOW risk"
              value={policy.auto_execute_on_approve}
              onChange={v => savePolicy({ auto_execute_on_approve: v })}
              saving={saving}
              color="green"
            />
            <PolicyToggle
              label="Notify on risk change"
              description="Alert when Sentinel detects risk level change on pending requests"
              value={policy.notify_on_risk_change}
              onChange={v => savePolicy({ notify_on_risk_change: v })}
              saving={saving}
              color="amber"
            />
            <div className="al-policy-field">
              <label className="al-policy-field-label">
                MAX AUTO-APPROVE AMOUNT
                <span className="al-policy-field-desc">
                  Never auto-approve requests above this threshold
                </span>
              </label>
              <div className="al-policy-input-row">
                <span className="al-policy-currency">USD</span>
                <input
                  type="number"
                  className="al-policy-input"
                  value={policy.max_auto_approve_amount}
                  onChange={e => savePolicy({ max_auto_approve_amount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="al-policy-risk-rules">
              <div className="al-policy-rule al-policy-rule--green">
                <CheckCircle size={11} />
                <span>LOW risk → <strong>Auto-approve</strong> if quorum met + under amount cap</span>
              </div>
              <div className="al-policy-rule al-policy-rule--amber">
                <Clock size={11} />
                <span>MEDIUM risk → <strong>Require human review</strong> before any action</span>
              </div>
              <div className="al-policy-rule al-policy-rule--red">
                <XCircle size={11} />
                <span>HIGH risk → <strong>Auto-block</strong> — no human can approve without overriding</span>
              </div>
            </div>
          </div>
          <div className="al-policy-footer">
            Policy enforced by Sentinel on every loop run · Powered by SoSoValue risk scoring
          </div>
        </div>
      )}

      {/* Loop result */}
      {result && (
        <div className="al-result">
          <div className="al-result-header">
            <span className="al-result-label">LAST LOOP RUN</span>
            <span className="al-result-time">
              {new Date(result.loop_run_at).toLocaleTimeString()}
            </span>
            <span className="al-result-scanned">
              {result.requests_scanned} requests scanned ·
              {result.actions_taken} actions taken
            </span>
          </div>

          {/* Market snapshot used for this run */}
          <div className="al-result-market">
            <Zap size={10} className="al-ssv-icon" />
            <span>SoSoValue at run time:</span>
            <span className={`al-market-val ${result.market_snapshot.inflow_signal === 'INFLOW' ? 'al-green' : 'al-red'}`}>
              {result.market_snapshot.inflow_signal}
            </span>
            <span>·</span>
            <span>Sentiment {result.market_snapshot.sentiment_score}/100</span>
            <span>·</span>
            <span>ETF ${(result.market_snapshot.btc_etf_daily_inflow_usd / 1e6).toFixed(0)}M</span>
            <span>·</span>
            <span>BTC ${result.market_snapshot.btc_price_usd?.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          </div>

          {result.actions.length === 0 ? (
            <div className="al-result-empty">
              <CheckCircle size={13} className="al-green" />
              No autonomous actions required — all pending requests within policy parameters.
            </div>
          ) : (
            <div className="al-actions">
              {result.actions.map((action, i) => {
                const cfg     = ACTION_CONFIG[action.action] || ACTION_CONFIG.FLAGGED_FOR_REVIEW
                const CfgIcon = cfg.icon
                return (
                  <div key={i} className={`al-action al-action--${cfg.color}`}>
                    <div className="al-action-top">
                      <div className="al-action-left">
                        <CfgIcon size={13} className={`al-action-icon al-action-icon--${cfg.color}`} />
                        <div className="al-action-info">
                          <span className="al-action-title">{action.title}</span>
                          <span className="al-action-amount">
                            {action.currency} {Number(action.amount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="al-action-right">
                        <span className={`al-action-badge al-action-badge--${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className={`al-risk-tag al-risk-tag--${action.risk_level?.toLowerCase()}`}>
                          {action.risk_level}
                        </span>
                        {action.autonomous && (
                          <span className="al-autonomous-tag">
                            <Zap size={9} /> AUTONOMOUS
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="al-action-reason">{action.reason}</p>
                    {action.tx_hash && (
                      <a
                        href={`https://explorer.sodex.io/tx/${action.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="al-action-tx"
                      >
                        <TrendingUp size={10} />
                        {action.tx_hash.slice(0, 18)}…{action.tx_hash.slice(-6)}
                        <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* History stats */}
      {history && history.total_auto_actions > 0 && (
        <div className="al-history">
          <div className="al-history-label">AUTONOMOUS ACTION HISTORY</div>
          <div className="al-history-stats">
            <div className="al-history-stat">
              <span className="al-history-val al-green">{history.approvals}</span>
              <span className="al-history-sub">Auto-approved</span>
            </div>
            <div className="al-history-stat">
              <span className="al-history-val al-red">{history.blocks}</span>
              <span className="al-history-sub">Auto-blocked</span>
            </div>
            <div className="al-history-stat">
              <span className="al-history-val al-green">{history.executions}</span>
              <span className="al-history-sub">Auto-executed</span>
            </div>
            <div className="al-history-stat">
              <span className="al-history-val">{history.total_auto_actions}</span>
              <span className="al-history-sub">Total actions</span>
            </div>
          </div>
        </div>
      )}

      <div className="al-footer">
        <Shield size={9} />
        Autonomous loop powered by SoSoValue ETF flows + AI news sentiment ·
        Policy enforced by Sentinel · Execution via SoDEX · Logged by Atlas
      </div>
    </div>
  )
}

function PolicyToggle({ label, description, value, onChange, saving, color }) {
  return (
    <div className="al-policy-toggle">
      <div className="al-policy-toggle-text">
        <span className="al-policy-toggle-label">{label}</span>
        <span className="al-policy-toggle-desc">{description}</span>
      </div>
      <button
        className={`al-toggle al-toggle--${value ? color : 'off'}`}
        onClick={() => onChange(!value)}
        disabled={saving}
      >
        {value ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}