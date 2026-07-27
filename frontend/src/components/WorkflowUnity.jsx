import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lock, TrendingUp, Vote, ClipboardList,
  ArrowRight, Zap, Shield, CheckCircle,
  Building2, RefreshCw
} from 'lucide-react'
import './WorkflowUnity.css'

const LOOP_STEPS = [
  {
    id:       'payroll',
    icon:     Lock,
    color:    'amber',
    module:   'Payroll',
    action:   'People cost committed',
    detail:   'HR uploads CSV. Priya AI validates. AES-256-GCM encrypts before touching disk. CFO decrypts for sign-off. Every reveal logged.',
    ssv:      'Payroll size informs treasury reserve calculation',
    outcome:  'Encrypted salary records · Immutable reveal log',
    path:     '/app/payroll?batch=batch_may_2026',
    meridian: '$337K May payroll — 19 employees, encrypted',
  },
  {
    id:       'treasury',
    icon:     TrendingUp,
    color:    'green',
    module:   'Treasury',
    action:   'Capital deployment gated',
    detail:   'Finance creates request. Sentinel scans SoSoValue signals. 5-signal composite score computed. Approvers see intelligence before acting. ValueChain settles on-chain.',
    ssv:      'ETF flows + Sentiment + SSI + Macro + BTC Treasury — all gating this decision',
    outcome:  'Risk-scored approvals · On-chain settlement receipts',
    path:     '/app/treasury?highlight=treq_009',
    meridian: '$500K Project Baobab — FOMC T-2d, scored HIGH, deferred',
  },
  {
    id:       'governance',
    icon:     Vote,
    color:    'blue',
    module:   'Governance',
    action:   'Decision mandate established',
    detail:   'Board votes to authorize treasury ceiling expansion. Sage AI drafts proposal. Encrypted ballots cast. Threshold-triggered tally reveals aggregate counts only.',
    ssv:      'SoSoValue market context embedded in proposal rationale',
    outcome:  'Anonymous encrypted votes · Tamper-proof outcome',
    path:     '/app/governance?proposal=prop_004&action=tally',
    meridian: 'Treasury ceiling expansion to $500K — 4 yes, 1 no',
  },
  {
    id:       'audit',
    icon:     ClipboardList,
    color:    'red',
    module:   'Audit',
    action:   'Compliance trail verified',
    detail:   'KPMG requests access to specific resource. Admin grants at resource level. Atlas AI summarises 30 events. PDF report downloaded. Every disclosure logged.',
    ssv:      'SoSoValue risk scores embedded in audit trail as decision context',
    outcome:  'Selective disclosure · Signed PDF evidence chain',
    path:     '/app/audit',
    meridian: 'KPMG East Africa — Q1 audit, 2 access grants, PDF downloaded',
  },
]

export default function WorkflowUnity() {
  const navigate           = useNavigate()
  const [active, setActive] = useState('treasury')

  const activeStep = LOOP_STEPS.find(s => s.id === active)

  return (
    <div className="wu-panel">
      <div className="wu-header">
        <div className="wu-header-left">
          <RefreshCw size={13} className="wu-icon" />
          <div className="wu-title-block">
            <span className="wu-title">THE FINANCIAL OPERATIONS LOOP</span>
            <span className="wu-sub">
              Not four tools. One continuous workflow every organization runs every month.
            </span>
          </div>
        </div>
        <div className="wu-ssv-badge">
          <Zap size={10} />
          SoSoValue intelligence at every gate
        </div>
      </div>

      {/* Loop visualiser */}
      <div className="wu-loop">
        {LOOP_STEPS.map((step, i) => {
          const Icon    = step.icon
          const isActive = step.id === active
          const isLast  = i === LOOP_STEPS.length - 1

          return (
            <div key={step.id} className="wu-step-wrap">
              <button
                className={`wu-step wu-step--${step.color} ${isActive ? 'wu-step--active' : ''}`}
                onClick={() => setActive(step.id)}
              >
                <div className={`wu-step-icon wu-step-icon--${step.color}`}>
                  <Icon size={16} />
                </div>
                <span className="wu-step-module">{step.module}</span>
                <span className="wu-step-action">{step.action}</span>
              </button>
              {!isLast && (
                <ArrowRight size={14} className="wu-arrow" />
              )}
              {isLast && (
                <div className="wu-loop-back">
                  <RefreshCw size={12} className="wu-loop-back-icon" />
                  <span>Next cycle</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Active step detail */}
      {activeStep && (
        <div className={`wu-detail wu-detail--${activeStep.color}`}>
          <div className="wu-detail-grid">
            <div className="wu-detail-left">
              <div className="wu-detail-module">
                <activeStep.icon size={14} />
                {activeStep.module} Module
              </div>
              <p className="wu-detail-desc">{activeStep.detail}</p>
              <div className="wu-detail-ssv">
                <Zap size={10} className="wu-detail-ssv-icon" />
                <span>{activeStep.ssv}</span>
              </div>
              <div className="wu-detail-outcome">
                <CheckCircle size={10} className="wu-detail-check" />
                <span>{activeStep.outcome}</span>
              </div>
            </div>
            <div className="wu-detail-right">
              <div className="wu-meridian-card">
                <div className="wu-meridian-header">
                  <Building2 size={11} />
                  <span>Meridian Capital Partners</span>
                </div>
                <p className="wu-meridian-example">{activeStep.meridian}</p>
                <button
                  className={`wu-demo-btn wu-demo-btn--${activeStep.color}`}
                  onClick={() => navigate(activeStep.path)}
                >
                  OPEN IN DEMO <ArrowRight size={11} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* The integration proof — this is the answer to "fragmented scope" */}
      <div className="wu-integration-proof">
        <div className="wu-proof-label">WHY THESE FOUR MODULES CANNOT BE SEPARATED</div>
        <div className="wu-proof-grid">
          <div className="wu-proof-item">
            <span className="wu-proof-q">Why treasury needs payroll</span>
            <span className="wu-proof-a">
              You cannot set a treasury reserve without knowing your monthly payroll commitment.
              Meridian's $337K May payroll informs the $500K Project Baobab risk assessment.
            </span>
          </div>
          <div className="wu-proof-item">
            <span className="wu-proof-q">Why governance needs treasury</span>
            <span className="wu-proof-a">
              The board voted to expand the treasury ceiling to $500K specifically because
              Project Baobab required it. Governance without treasury context is theater.
            </span>
          </div>
          <div className="wu-proof-item">
            <span className="wu-proof-q">Why audit needs all three</span>
            <span className="wu-proof-a">
              KPMG audited the Q1 infrastructure spend ($145K treasury) against the payroll
              records to verify headcount. The governance vote authorized the budget.
              The audit closes the loop. You cannot audit one without the other two.
            </span>
          </div>
          <div className="wu-proof-item">
            <span className="wu-proof-q">Why SoSoValue connects them all</span>
            <span className="wu-proof-a">
              ETF inflows gate treasury approvals. SSI sector rotation informs which
              governance proposals are timely. BTC treasury signal validates the macro
              context logged in the audit trail. SoSoValue is not a widget — it is
              the connective tissue of the entire loop.
            </span>
          </div>
        </div>
      </div>

      <div className="wu-footer">
        <Shield size={9} />
        Every step encrypted · Every action logged ·
        Every decision informed by SoSoValue institutional intelligence
      </div>
    </div>
  )
}