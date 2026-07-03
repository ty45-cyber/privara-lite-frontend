import { useState } from 'react'
import { GitCommit, ChevronDown, ChevronUp, CheckCircle, ArrowRight } from 'lucide-react'
import './WaveChangelog.css'

const WAVES = [
  {
    wave: 3,
    title: 'Current Wave',
    theme: 'Validate the intelligence. Fix the infrastructure.',
    status: 'current',
    responses: [
      {
        judge: 'Goodynation',
        feedback: '"Live deployment is required."',
        fix: 'vercel.json SPA rewrite + VITE_MOCK_MODE auto-inject. Zero backend dependency.',
      },
      {
        judge: 'MuhammadBa_2024',
        feedback: '"Validate that embedded intelligence improves decision quality."',
        fix: 'Decision Intelligence panel: T+30 outcome tracking, 87% accuracy, PDF export.',
      },
      {
        judge: 'BlessinSum',
        feedback: '"Extend gating to macro events, sector rotation."',
        fix: 'Macro Calendar + Sector Rotation panels. SoSoValue SSI index integration.',
      },
    ],
    additions: [
      'Deep-link routing → judges land in Project Baobab in one click',
      'Macro execution window check inside every risk modal',
      'Decision Intelligence PDF export',
      'WebSocket live feed — 30s push, no polling',
      'Demo mode — one-click role access, no login',
      'Full mobile responsive',
    ],
  },
  {
    wave: 2,
    title: 'Privara Lite',
    theme: 'SoSoValue moves from display layer to decision layer.',
    status: 'submitted',
    highlights: [
      'AES-256-GCM encrypted payroll — role-gated reveal',
      'Treasury approvals gated by live SoSoValue ETF flows',
      'Claude Sonnet AI briefings grounded in market data',
      'SoDEX testnet execution with real tx hash',
      'Meridian Capital Partners: 47 employees, $1.2M treasury',
    ],
    verdict: 'Most original submission. Blank deployment blocked the grant.',
  },
  {
    wave: 1,
    title: 'AlphaOS',
    theme: 'SoSoValue as primary institutional data source.',
    status: 'submitted',
    highlights: [
      'Bloomberg terminal for Solana',
      'LangGraph agent platform, 64 files',
      'SoSoValue primary data source for token analysis',
      'Institutional sentiment → actionable signals',
    ],
    verdict: 'Foundation wave. Established the terminal aesthetic and SoSoValue integration depth.',
  },
]

export default function WaveChangelog() {
  const [open, setOpen] = useState(false)

  return (
    <div className="changelog">
      <button
        className="changelog-toggle"
        onClick={() => setOpen(o => !o)}
      >
        <GitCommit size={13} className="changelog-git-icon" />
        <span className="changelog-toggle-label">WAVE HISTORY</span>
        <span className="changelog-toggle-sub">
          3 waves · Every judge comment answered
        </span>
        {open
          ? <ChevronUp size={13} className="changelog-chevron" />
          : <ChevronDown size={13} className="changelog-chevron" />
        }
      </button>

      {open && (
        <div className="changelog-body">
          {WAVES.map((w) => (
            <div
              key={w.wave}
              className={`changelog-wave changelog-wave--${w.status}`}
            >
              <div className="changelog-wave-header">
                <div className="changelog-wave-left">
                  <span className={`changelog-wave-badge changelog-wave-badge--${w.status}`}>
                    WAVE {w.wave}
                  </span>
                  <span className="changelog-wave-title">{w.title}</span>
                </div>
                {w.status === 'current' && (
                  <span className="changelog-live-badge">CURRENT</span>
                )}
              </div>

              <p className="changelog-wave-theme">{w.theme}</p>

              {/* Judge responses — Wave 3 */}
              {w.responses && (
                <div className="changelog-responses">
                  <div className="changelog-responses-label">
                    RESPONDING TO JUDGE FEEDBACK
                  </div>
                  {w.responses.map((r, i) => (
                    <div key={i} className="changelog-response">
                      <div className="changelog-response-judge">
                        <span className="changelog-judge-name">{r.judge}</span>
                        <span className="changelog-judge-quote">{r.feedback}</span>
                      </div>
                      <ArrowRight size={11} className="changelog-arrow" />
                      <span className="changelog-response-fix">{r.fix}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Highlights — all waves */}
              {w.highlights && (
                <ul className="changelog-highlights">
                  {w.highlights.map((h, i) => (
                    <li key={i}>
                      <CheckCircle size={10} className="changelog-check" />
                      {h}
                    </li>
                  ))}
                </ul>
              )}

              {/* Wave 3 additions */}
              {w.additions && (
                <div className="changelog-additions">
                  <div className="changelog-additions-label">WAVE 3 ADDITIONS</div>
                  <ul className="changelog-highlights">
                    {w.additions.map((a, i) => (
                      <li key={i}>
                        <CheckCircle size={10} className="changelog-check" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Verdict */}
              {w.verdict && (
                <div className="changelog-verdict">{w.verdict}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}