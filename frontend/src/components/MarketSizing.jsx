import { Building2, Globe, Coins, ArrowRight } from 'lucide-react'
import './MarketSizing.css'

const SEGMENTS = [
  {
    icon:      Building2,
    color:     'amber',
    segment:   'Private Capital & Family Offices',
    tam:       '$2.1T',
    tam_label: 'AUM under management globally',
    pain:      'Treasury decisions made without market context. Payroll in spreadsheets. Governance by email.',
    signal:    '14,000+ PE/VC firms worldwide',
    why_now:   'ILPA reporting + ESG mandates forcing operational upgrades in 2026',
    example:   'Meridian Capital Partners — 47 employees, $1.2M treasury, KPMG audit',
  },
  {
    icon:      Coins,
    color:     'green',
    segment:   'DAOs & Web3 Treasuries',
    tam:       '$25B+',
    tam_label: 'DAO treasury assets under management',
    pain:      'Multi-sig approvals with no market context. Anonymous governance with no audit trail.',
    signal:    '4,000+ active DAOs with >$100K treasury',
    why_now:   'Regulatory pressure on DAO governance creating demand for audit-grade infrastructure',
    example:   'Any protocol treasury needing defensible approval workflow',
  },
  {
    icon:      Globe,
    color:     'blue',
    segment:   'African Enterprise & SME',
    tam:       '$180B',
    tam_label: 'African SME finance market',
    pain:      'M-Pesa payroll in WhatsApp. Treasury approvals over phone call. Zero audit trail.',
    signal:    '50M+ SMEs across Africa, 2M in Kenya alone',
    why_now:   'KRA eTIMS, NSSF, NHIF compliance pressure. Formalisation accelerating.',
    example:   'KES + USD dual-currency payroll already built and seeded',
  },
]

const COMPS = [
  { name: 'Rippling',    valuation: '$13B',  moat: 'HR data network'         },
  { name: 'Deel',        valuation: '$12B',  moat: 'Global payroll rails'     },
  { name: 'Carta',       valuation: '$7.4B', moat: 'Cap table network'        },
  { name: 'Gnosis Safe', valuation: '$1B+',  moat: 'Multi-sig infrastructure' },
]

export default function MarketSizing() {
  return (
    <section className="market-sizing">
      <div className="ms-inner">
        <div className="ms-header">
          <div className="ms-eyebrow">// MARKET OPPORTUNITY</div>
          <h2 className="ms-title">
            Three markets. One system.
            <br />
            None of them served.
          </h2>
          <p className="ms-sub">
            Every other submission targets individual crypto users.
            Privara Lite targets the organizations that move real capital —
            and none of them have a system built for this.
          </p>
        </div>

        <div className="ms-segments">
          {SEGMENTS.map(s => (
            <div key={s.segment} className={`ms-segment ms-segment--${s.color}`}>
              <div className="ms-segment-top">
                <div className={`ms-segment-icon ms-segment-icon--${s.color}`}>
                  <s.icon size={16} />
                </div>
                <div className="ms-segment-tam">
                  <span className="ms-tam-value">{s.tam}</span>
                  <span className="ms-tam-label">{s.tam_label}</span>
                </div>
              </div>
              <div className="ms-segment-name">{s.segment}</div>
              <div className="ms-segment-pain">{s.pain}</div>
              <div className="ms-segment-signals">
                <div className="ms-signal-row">
                  <span className="ms-signal-label">MARKET SIZE</span>
                  <span className="ms-signal-value">{s.signal}</span>
                </div>
                <div className="ms-signal-row">
                  <span className="ms-signal-label">WHY NOW</span>
                  <span className="ms-signal-value">{s.why_now}</span>
                </div>
                <div className="ms-signal-row">
                  <span className="ms-signal-label">LIVE EXAMPLE</span>
                  <span className={`ms-signal-value ms-signal-value--${s.color}`}>{s.example}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="ms-comps">
          <div className="ms-comps-label">
            COMPARABLE COMPANIES — NONE COMBINE ENCRYPTION + MARKET INTELLIGENCE
          </div>
          <div className="ms-comps-grid">
            {COMPS.map(c => (
              <div key={c.name} className="ms-comp">
                <div className="ms-comp-name">{c.name}</div>
                <div className="ms-comp-val">{c.valuation}</div>
                <div className="ms-comp-moat">{c.moat}</div>
                <div className="ms-comp-gap">No SoSoValue. No encryption. No market-gated approvals.</div>
              </div>
            ))}
          </div>
          <div className="ms-comps-insight">
            <ArrowRight size={12} className="ms-arrow" />
            <span>
              Privara Lite's moat:{' '}
              <strong>switching costs + data compounding + regulatory tailwind.</strong>
              {' '}Every compliance mandate that tightens makes this more necessary.
              That's a business, not a hackathon project.
            </span>
          </div>
        </div>

        <div className="ms-rebuttal">
          <div className="ms-rebuttal-label">ADDRESSING THE NARROW AUDIENCE CONCERN</div>
          <p className="ms-rebuttal-text">
            Wave 2 judges noted the audience "may be narrower than other submissions."
            Rippling built a $13B company selling exclusively to organizations.
            Deel built a $12B company serving a single workflow.
            B2B with organizational buyers is not narrow — it's the highest-value customer
            segment in SaaS. A single PE firm paying $499/month generates more ARR than
            1,000 individual crypto users on a free tier.
            Privara Lite targets 50 million organizations globally.
            Three of them are already in the demo.
          </p>
        </div>
      </div>
    </section>
  )
}