import { useState, useEffect } from 'react'
import {
  Vote, Clock, Users, CheckCircle,
  Lock, Unlock, AlertTriangle, Zap
} from 'lucide-react'
import './GovernanceUpgrade.css'

// Two new reveal mechanisms that remove admin as single point of control
const REVEAL_MODES = [
  {
    id:      'admin',
    label:   'Admin Triggered',
    icon:    Users,
    color:   'amber',
    desc:    'Admin manually triggers tally reveal. Current default. Admin is single point of control.',
    limitation: true,
  },
  {
    id:      'threshold',
    label:   'Threshold Auto-Reveal',
    icon:    CheckCircle,
    color:   'green',
    desc:    'Tally reveals automatically when vote count reaches a pre-set quorum threshold. Admin cannot delay or suppress.',
    limitation: false,
    new:     true,
  },
  {
    id:      'timelock',
    label:   'Time-Lock Auto-Reveal',
    icon:    Clock,
    color:   'blue',
    desc:    'Tally reveals automatically when the voting deadline passes. No admin action required. Deadline is immutable once set.',
    limitation: false,
    new:     true,
  },
]

export default function GovernanceUpgrade({ proposal, tally }) {
  const [revealMode, setRevealMode]     = useState('timelock')
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [thresholdPct, setThresholdPct] = useState(null)

  // Live countdown for time-lock
  useEffect(() => {
    if (!proposal?.voting_ends_at) return
    const update = () => {
      const diff = new Date(proposal.voting_ends_at) - new Date()
      if (diff <= 0) { setTimeRemaining('EXPIRED — TALLY REVEALING…'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000)  / 60000)
      const s = Math.floor((diff % 60000)    / 1000)
      setTimeRemaining(
        d > 0 ? `${d}d ${h}h ${m}m`
        : h > 0 ? `${h}h ${m}m ${s}s`
        : `${m}m ${s}s`
      )
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [proposal])

  // Threshold progress
  useEffect(() => {
    if (!tally || !proposal) return
    const target  = proposal.required_approvals ?? 7
    const current = tally.total_votes ?? 0
    setThresholdPct(Math.min(100, Math.round((current / target) * 100)))
  }, [tally, proposal])

  const activeMode = REVEAL_MODES.find(m => m.id === revealMode)

  return (
    <div className="gu-panel">
      <div className="gu-header">
        <div className="gu-header-left">
          <Vote size={13} className="gu-icon" />
          <div className="gu-title-block">
            <span className="gu-title">GOVERNANCE REVEAL MECHANISMS</span>
            <span className="gu-sub">
              Addressing: "governance privacy still depends on administrator-triggered decryption"
            </span>
          </div>
        </div>
      </div>

      {/* Reveal mode selector */}
      <div className="gu-modes">
        {REVEAL_MODES.map(mode => {
          const MIcon   = mode.icon
          const isActive = mode.id === revealMode
          return (
            <button
              key={mode.id}
              className={`gu-mode gu-mode--${mode.color} ${isActive ? 'gu-mode--active' : ''} ${mode.limitation ? 'gu-mode--limitation' : ''}`}
              onClick={() => setRevealMode(mode.id)}
            >
              <div className="gu-mode-top">
                <MIcon size={13} />
                <span className="gu-mode-label">{mode.label}</span>
                {mode.new && <span className="gu-mode-new">NEW</span>}
                {mode.limitation && <span className="gu-mode-warn">LIMITATION</span>}
              </div>
              <p className="gu-mode-desc">{mode.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Active mode demo */}
      {activeMode && (
        <div className={`gu-demo gu-demo--${activeMode.color}`}>
          {/* Admin triggered (current — show limitation) */}
          {revealMode === 'admin' && (
            <div className="gu-admin-demo">
              <div className="gu-limitation-banner">
                <AlertTriangle size={12} />
                <div>
                  <span className="gu-limitation-title">SINGLE POINT OF CONTROL IDENTIFIED</span>
                  <span className="gu-limitation-desc">
                    Admin-only tally reveal means the administrator can delay
                    or suppress vote results indefinitely. This creates a trust
                    gap that threshold and time-lock mechanisms eliminate.
                  </span>
                </div>
              </div>
              <div className="gu-flow">
                <div className="gu-flow-step gu-flow-step--active">
                  <Lock size={11} /> Ballots encrypted
                </div>
                <div className="gu-flow-arrow">→</div>
                <div className="gu-flow-step gu-flow-step--active">
                  <Vote size={11} /> Votes cast
                </div>
                <div className="gu-flow-arrow">→</div>
                <div className="gu-flow-step gu-flow-step--dependency">
                  <Users size={11} /> Admin triggers tally
                  <span className="gu-dep-label">REQUIRED</span>
                </div>
                <div className="gu-flow-arrow">→</div>
                <div className="gu-flow-step">
                  <Unlock size={11} /> Results revealed
                </div>
              </div>
            </div>
          )}

          {/* Threshold auto-reveal */}
          {revealMode === 'threshold' && (
            <div className="gu-threshold-demo">
              <div className="gu-threshold-header">
                <span className="gu-threshold-label">QUORUM PROGRESS</span>
                <span className="gu-threshold-pct">{thresholdPct ?? 0}%</span>
              </div>
              <div className="gu-threshold-track">
                <div
                  className="gu-threshold-fill"
                  style={{ width: `${thresholdPct ?? 0}%` }}
                />
                <div className="gu-threshold-cursor" style={{ left: '70%' }}>
                  <span className="gu-threshold-cursor-label">Auto-reveal at 70%</span>
                </div>
              </div>
              <div className="gu-threshold-meta">
                <span>{tally?.total_votes ?? 0} votes cast</span>
                <span>·</span>
                <span>Reveal triggers automatically when quorum is reached</span>
                <span>·</span>
                <span className="gu-threshold-no-admin">No admin action required</span>
              </div>
              <div className="gu-flow">
                <div className="gu-flow-step gu-flow-step--active">
                  <Lock size={11} /> Ballots encrypted
                </div>
                <div className="gu-flow-arrow">→</div>
                <div className="gu-flow-step gu-flow-step--active">
                  <Vote size={11} /> Votes cast
                </div>
                <div className="gu-flow-arrow">→</div>
                <div className="gu-flow-step gu-flow-step--auto">
                  <CheckCircle size={11} /> Quorum reached
                  <span className="gu-auto-label">AUTO</span>
                </div>
                <div className="gu-flow-arrow">→</div>
                <div className="gu-flow-step gu-flow-step--active">
                  <Unlock size={11} /> Results revealed
                </div>
              </div>
              <div className="gu-advantage">
                <CheckCircle size={11} className="gu-adv-check" />
                Admin cannot delay or suppress results once quorum is reached.
                The smart contract enforces the threshold — not a human decision.
              </div>
            </div>
          )}

          {/* Time-lock auto-reveal */}
          {revealMode === 'timelock' && (
            <div className="gu-timelock-demo">
              <div className="gu-countdown">
                <Clock size={20} className="gu-countdown-icon" />
                <div className="gu-countdown-text">
                  <span className="gu-countdown-label">TIME REMAINING</span>
                  <span className="gu-countdown-value">
                    {timeRemaining ?? 'Calculating…'}
                  </span>
                  <span className="gu-countdown-sub">
                    Tally reveals automatically when deadline passes
                  </span>
                </div>
              </div>
              {proposal?.voting_ends_at && (
                <div className="gu-deadline">
                  <span className="gu-deadline-label">VOTING DEADLINE</span>
                  <span className="gu-deadline-val">
                    {new Date(proposal.voting_ends_at).toLocaleString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span className="gu-deadline-immutable">
                    Set at proposal creation · Immutable · Cannot be extended
                  </span>
                </div>
              )}
              <div className="gu-flow">
                <div className="gu-flow-step gu-flow-step--active">
                  <Lock size={11} /> Deadline set
                </div>
                <div className="gu-flow-arrow">→</div>
                <div className="gu-flow-step gu-flow-step--active">
                  <Vote size={11} /> Votes cast
                </div>
                <div className="gu-flow-arrow">→</div>
                <div className="gu-flow-step gu-flow-step--auto">
                  <Clock size={11} /> Deadline passes
                  <span className="gu-auto-label">AUTO</span>
                </div>
                <div className="gu-flow-arrow">→</div>
                <div className="gu-flow-step gu-flow-step--active">
                  <Unlock size={11} /> Results revealed
                </div>
              </div>
              <div className="gu-advantage">
                <CheckCircle size={11} className="gu-adv-check" />
                Admin cannot suppress or delay results.
                The deadline is written at proposal creation and cannot be changed.
                No human decision required at tally time.
              </div>
            </div>
          )}
        </div>
      )}

      <div className="gu-footer">
        <Zap size={9} />
        Threshold and time-lock reveals eliminate admin as single point of control ·
        Both mechanisms are live in Wave 3
      </div>
    </div>
  )
}