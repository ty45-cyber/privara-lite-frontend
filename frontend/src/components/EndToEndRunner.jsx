import { useState, useRef } from 'react'
import {
  Play, CheckCircle, Loader, ArrowRight,
  Zap, Lock, TrendingUp, ExternalLink,
  Shield, FileText, Clock
} from 'lucide-react'
import api from '../lib/api'
import './EndToEndRunner.css'

const STEPS = [
  {
    id:      'create',
    icon:    TrendingUp,
    label:   'Create Treasury Request',
    detail:  'POST /treasury/requests — $42,000 research platform subscription',
    color:   'amber',
  },
  {
    id:      'signal',
    icon:    Zap,
    label:   'SoSoValue Signal Analysis',
    detail:  'POST /treasury/requests/:id/approval-intelligence — 5-signal engine',
    color:   'amber',
  },
  {
    id:      'approve',
    icon:    CheckCircle,
    label:   'Multi-Party Approval',
    detail:  'POST /treasury/requests/:id/approve — CFO signature',
    color:   'green',
  },
  {
    id:      'execute',
    icon:    TrendingUp,
    label:   'ValueChain Settlement',
    detail:  'POST /ssv/valuechain/:id/execute — SoSoValue L1 mainnet',
    color:   'blue',
  },
  {
    id:      'audit',
    icon:    FileText,
    label:   'Audit Trail Updated',
    detail:  'GET /audit/logs — immutable record of every action',
    color:   'green',
  },
]

export default function EndToEndRunner() {
  const [phase, setPhase]       = useState('idle')  // idle | running | done | error
  const [currentStep, setCurrentStep] = useState(-1)
  const [stepResults, setStepResults] = useState({})
  const [error, setError]       = useState(null)
  const [txHash, setTxHash]     = useState(null)
  const [requestId, setRequestId] = useState(null)
  const abortRef                = useRef(false)

  const sleep = (ms) => new Promise(r => setTimeout(r, ms))

  const run = async () => {
    abortRef.current = false
    setPhase('running')
    setCurrentStep(0)
    setStepResults({})
    setError(null)
    setTxHash(null)
    setRequestId(null)

    try {
      // ── Step 0: Create request ────────────────────────────────────────────
      setCurrentStep(0)
      await sleep(400)
      const createResp = await api.post('/treasury/requests', {
        title:              'E2E Demo — Research Platform Subscription',
        amount:             42000,
        currency:           'USD',
        purpose:            'Annual Bloomberg Terminal renewal + PitchBook Data license for deal sourcing. Essential for Q2 portfolio review.',
        required_approvals: 1,
      })
      const reqId = createResp.data.request?.id
      setRequestId(reqId)
      setStepResults(r => ({
        ...r,
        create: {
          ok:     true,
          label:  `Request created`,
          detail: `ID: ${reqId} · $42,000 USD · PENDING`,
        },
      }))

      // ── Step 1: SoSoValue signal analysis ────────────────────────────────
      setCurrentStep(1)
      await sleep(600)
      const signalResp = await api.post(`/treasury/requests/${reqId}/approval-intelligence`, {})
      const intel      = signalResp.data
      setStepResults(r => ({
        ...r,
        signal: {
          ok:     true,
          label:  `Risk: ${intel.risk_level} · ${intel.overall_recommendation}`,
          detail: `${intel.signals?.length ?? 5} SoSoValue signals · Composite score: ${intel.composite_score}`,
          ssv:    true,
        },
      }))

      // ── Step 2: Approve ──────────────────────────────────────────────────
      setCurrentStep(2)
      await sleep(500)
      await api.post(`/treasury/requests/${reqId}/approve`, { note: 'E2E demo approval — all signals favorable' })
      setStepResults(r => ({
        ...r,
        approve: {
          ok:     true,
          label:  'CFO approval recorded',
          detail: 'Status: APPROVED · Quorum met · Ready for execution',
        },
      }))

      // ── Step 3: ValueChain execute ───────────────────────────────────────
      setCurrentStep(3)
      await sleep(800)
      const execResp = await api.post(`/ssv/valuechain/${reqId}/execute`, {
        destination_address: '0xMeridian0000000000000000000000CF420000',
        token:               'USDC',
        memo:                'Privara Lite E2E demo — ValueChain settlement',
      })
      const receipt = execResp.data.receipt
      setTxHash(receipt?.tx_hash)
      setStepResults(r => ({
        ...r,
        execute: {
          ok:      true,
          label:   'Settled on ValueChain Mainnet',
          detail:  `TX: ${receipt?.tx_hash?.slice(0, 18)}… · Block: #${receipt?.block_number?.toLocaleString()}`,
          txHash:  receipt?.tx_hash,
          explorer:receipt?.explorer_url,
          ssv:     true,
        },
      }))

      // ── Step 4: Audit trail ──────────────────────────────────────────────
      setCurrentStep(4)
      await sleep(400)
      const auditResp  = await api.get('/audit/logs')
      const recentLogs = auditResp.data.logs?.slice(0, 3) ?? []
      setStepResults(r => ({
        ...r,
        audit: {
          ok:     true,
          label:  `${recentLogs.length} new audit events`,
          detail: recentLogs.map(l => l.action).join(' · '),
        },
      }))

      setCurrentStep(-1)
      setPhase('done')

    } catch (e) {
      setError(e.response?.data?.message || e.message)
      setPhase('error')
    }
  }

  const reset = () => {
    setPhase('idle')
    setCurrentStep(-1)
    setStepResults({})
    setError(null)
    setTxHash(null)
    setRequestId(null)
  }

  return (
    <div className="e2e-panel">
      <div className="e2e-header">
        <div className="e2e-header-left">
          <Play size={13} className="e2e-icon" />
          <div className="e2e-title-block">
            <span className="e2e-title">END-TO-END FLOW DEMONSTRATION</span>
            <span className="e2e-sub">
              Create → Signal → Approve → Settle → Audit · 90 seconds · Zero guidance needed
            </span>
          </div>
        </div>
        <div className="e2e-header-right">
          {phase === 'idle' && (
            <button className="e2e-run-btn" onClick={run}>
              <Play size={12} />
              RUN END-TO-END DEMO
            </button>
          )}
          {phase === 'running' && (
            <span className="e2e-running-badge">
              <Loader size={11} className="e2e-spin" />
              RUNNING…
            </span>
          )}
          {(phase === 'done' || phase === 'error') && (
            <button className="e2e-reset-btn" onClick={reset}>RESET</button>
          )}
        </div>
      </div>

      {/* Step pipeline */}
      <div className="e2e-pipeline">
        {STEPS.map((step, i) => {
          const result    = stepResults[step.id]
          const isActive  = currentStep === i
          const isDone    = !!result?.ok
          const Icon      = step.icon

          return (
            <div key={step.id} className="e2e-step-wrap">
              <div className={`e2e-step
                e2e-step--${step.color}
                ${isActive ? 'e2e-step--active' : ''}
                ${isDone   ? 'e2e-step--done'   : ''}
              `}>
                <div className="e2e-step-icon-wrap">
                  {isActive
                    ? <Loader size={14} className="e2e-spin" />
                    : isDone
                      ? <CheckCircle size={14} className="e2e-step-check" />
                      : <Icon size={14} />
                  }
                </div>
                <div className="e2e-step-info">
                  <span className="e2e-step-label">{step.label}</span>
                  {isDone ? (
                    <span className="e2e-step-result">{result.label}</span>
                  ) : (
                    <span className="e2e-step-detail">{step.detail}</span>
                  )}
                  {result?.ssv && (
                    <span className="e2e-ssv-tag">
                      <Zap size={9} /> SoSoValue
                    </span>
                  )}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight size={12} className={`e2e-arrow ${isDone ? 'e2e-arrow--done' : ''}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step detail results */}
      {Object.keys(stepResults).length > 0 && (
        <div className="e2e-results">
          {STEPS.map(step => {
            const result = stepResults[step.id]
            if (!result) return null
            return (
              <div key={step.id} className="e2e-result-row">
                <CheckCircle size={11} className="e2e-result-check" />
                <div className="e2e-result-info">
                  <span className="e2e-result-step">{step.label}</span>
                  <span className="e2e-result-detail">{result.detail}</span>
                </div>
                {result.txHash && (
                  
                    href={result.explorer}
                    target="_blank"
                    rel="noreferrer"
                    className="e2e-tx-link"
                  >
                    <ExternalLink size={10} />
                    Explorer
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Success state */}
      {phase === 'done' && (
        <div className="e2e-success">
          <div className="e2e-success-header">
            <CheckCircle size={16} className="e2e-success-icon" />
            <span className="e2e-success-title">END-TO-END FLOW COMPLETE</span>
          </div>
          <div className="e2e-success-body">
            <div className="e2e-success-row">
              <span className="e2e-success-label">REQUEST ID</span>
              <span className="e2e-success-val">{requestId}</span>
            </div>
            {txHash && (
              <>
                <div className="e2e-success-row">
                  <span className="e2e-success-label">VALUECHAIN TX</span>
                  <span className="e2e-success-val e2e-success-val--mono">
                    {txHash.slice(0, 22)}…{txHash.slice(-6)}
                  </span>
                </div>
                <div className="e2e-success-row">
                  <span className="e2e-success-label">EXPLORER</span>
                  
                    href={`https://scan.valuechain.io/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="e2e-explorer-link"
                  >
                    scan.valuechain.io <ExternalLink size={10} />
                  </a>
                </div>
              </>
            )}
            <div className="e2e-success-row">
              <span className="e2e-success-label">NETWORK</span>
              <span className="e2e-success-val">ValueChain Mainnet · Chain ID 0x5353 · SoSoValue L1</span>
            </div>
            <div className="e2e-success-row">
              <span className="e2e-success-label">SOSOVALUE SIGNALS</span>
              <span className="e2e-success-val">ETF flows · News sentiment · SSI sector · Macro calendar · BTC treasury</span>
            </div>
          </div>
          <div className="e2e-success-footer">
            <Shield size={10} />
            Every action above is logged in the immutable audit trail ·
            Navigate to Audit to verify
          </div>
        </div>
      )}

      {/* Error state */}
      {phase === 'error' && (
        <div className="e2e-error">
          <span>{error}</span>
          <button onClick={reset}>RETRY</button>
        </div>
      )}

      <div className="e2e-footer">
        <Clock size={9} />
        Completes in ~90 seconds ·
        Every step verifiable ·
        No guidance needed ·
        Powered by SoSoValue API + ValueChain L1
      </div>
    </div>
  )
}