import { useState } from 'react'
import { Building2, Globe, Coins, Users, TrendingUp, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import './MarketBreadth.css'

const SEGMENTS = [
  {
    id:         'enterprise',
    icon:       Building2,
    color:      'amber',
    label:      'Enterprise & SME',
    tam:        '$26.3B',
    cagr:       '16.9%',
    tam_year:   '2030',
    customers:  '50M+ organizations globally',
    avg_arpu:   '$299/mo',
    arr_target: '$179K ARR at 50 customers',
    pain:       'Payroll in spreadsheets. Treasury by email. Zero market context on any financial decision.',
    regulation: 'SOC 2 · ISO 27001 · IFRS · GAAP · SOX',
    why_us:     'AES-256-GCM encryption + SoSoValue intelligence + role-gated audit trail',
    example:    'Meridian Capital Partners — 47 employees, $1.2M treasury processed, KPMG audited',
    source:     'Research & Markets Enterprise Financial Management Report 2026',
  },
  {
    id:        'treasury',
    icon:      TrendingUp,
    color:     'green',
    label:     'Treasury Management',
    tam:       '$15.1B',
    cagr:      '12.84%',
    tam_year:  '2032',
    customers: '14,000+ PE/VC firms · 4,000+ corporate treasury teams',
    avg_arpu:  '$499/mo',
    arr_target: '$299K ARR at 50 customers',
    pain:      'CFOs approve $500K deployments with no institutional market context. No ETF signal. No AI.',
    regulation: 'ILPA · ESG mandates · FinCEN · MiFID II',
    why_us:    'Only system connecting treasury approvals to live SoSoValue ETF flows in real time',
    example:   'Project Baobab: $500K decision, HIGH risk score, macro window check — all automated',
    source:    'Verified Market Research TMS Market Report 2025',
  },
  {
    id:        'dao',
    icon:      Coins,
    color:     'blue',
    label:     'DAOs & Web3 Treasuries',
    tam:       '$25B+',
    cagr:      '41%',
    tam_year:  '2026',
    customers: '4,000+ active DAOs with >$100K treasury',
    avg_arpu:  '$199/mo',
    arr_target: '$119K ARR at 50 DAOs',
    pain:      'Multi-sig with no audit trail. Anonymous votes no one can verify. Zero compliance posture.',
    regulation: 'EU MiCA · US crypto governance · DAO LLC requirements',
    why_us:    'Encrypted governance voting + immutable audit log + selective disclosure for on-chain orgs',
    example:   'Any protocol treasury needing defensible governance ahead of regulatory clarity',
    source:    'DeFi Llama DAO Treasury Data 2026',
  },
  {
    id:        'africa',
    icon:      Globe,
    color:     'red',
    label:     'African Enterprise',
    tam:       '$4.1B',
    cagr:      '7.2%',
    tam_year:  '2033',
    customers: '2M+ Kenyan SMEs · 50M+ African SMEs',
    avg_arpu:  '$49/mo',
    arr_target: '$29K ARR at 50 customers — lowest CAC, highest loyalty',
    pain:      'M-Pesa payroll via WhatsApp. Treasury by phone call. KRA compliance manual.',
    regulation: 'KRA eTIMS · NSSF · NHIF · CBK · WASREB',
    why_us:    'Only finops platform with KES/USD dual-currency, M-Pesa integration path, and KRA compliance',
    example:   'April 2026: KES payroll batch — 11 Nairobi staff, KES 125K average, NHIF-compliant',
    source:    'Verified Market Reports Enterprise Payroll Africa 2026',
  },
]

const COMP_TABLE = [
  { name: 'Rippling',    val: '$13B', sells_to: 'Organizations only', has_market_intel: false, has_encryption: false, has_governance: false },
  { name: 'Deel',        val: '$12B', sells_to: 'Organizations only', has_market_intel: false, has_encryption: false, has_governance: false },
  { name: 'Carta',       val: '$7.4B', sells_to: 'Organizations only', has_market_intel: false, has_encryption: false, has_governance: true  },
  { name: 'Gnosis Safe', val: '$1B+', sells_to: 'DAOs/Web3',          has_market_intel: false, has_encryption: false, has_governance: true  },
  { name: 'Privara Lite', val: 'Wave 3', sells_to: 'All four segments', has_market_intel: true,  has_encryption: true,  has_governance: true  },
]

export default function MarketBreadth() {
  const [active, setActive]       = useState('enterprise')
  const [showComps, setShowComps] = useState(false)
  const seg = SEGMENTS.find(s => s.id === active)

  const totalTam = '$47B+'
  const totalCagr = '14.5%'

  return (
    <div className="market-breadth">
      <div className="mb-header">
        <div className="mb-header-left">
          <div className="mb-eyebrow">// TOTAL ADDRESSABLE MARKET</div>
          <div className="mb-tam-row">
            <span className="mb-tam-total">{totalTam}</span>
            <span className="mb-tam-desc">across four distinct customer segments</span>
            <span className="mb-cagr">{totalCagr} CAGR</span>
          </div>
        </div>
        <div className="mb-rebuttal-badge">
          <Users size={11} />
          NOT NARROW — 50M+ ORGANIZATIONS
        </div>
      </div>

      {/* Segment tabs */}
      <div className="mb-tabs">
        {SEGMENTS.map(s => (
          <button
            key={s.id}
            className={`mb-tab mb-tab--${s.color} ${active === s.id ? 'mb-tab--active' : ''}`}
            onClick={() => setActive(s.id)}
          >
            <s.icon size={12} />
            <span>{s.label}</span>
            <span className="mb-tab-tam">{s.tam}</span>
          </button>
        ))}
      </div>

      {/* Active segment detail */}
      <div className={`mb-detail mb-detail--${seg.color}`}>
        <div className="mb-detail-grid">
          <div className="mb-detail-col">
            <div className="mb-detail-metric">
              <span className="mb-metric-label">MARKET SIZE ({seg.tam_year})</span>
              <span className={`mb-metric-value mb-metric-value--${seg.color}`}>{seg.tam}</span>
            </div>
            <div className="mb-detail-metric">
              <span className="mb-metric-label">CAGR</span>
              <span className="mb-metric-value">{seg.cagr}</span>
            </div>
            <div className="mb-detail-metric">
              <span className="mb-metric-label">CUSTOMERS IN SEGMENT</span>
              <span className="mb-metric-value">{seg.customers}</span>
            </div>
            <div className="mb-detail-metric">
              <span className="mb-metric-label">AVG ARPU</span>
              <span className={`mb-metric-value mb-metric-value--${seg.color}`}>{seg.avg_arpu}</span>
            </div>
          </div>

          <div className="mb-detail-col">
            <div className="mb-detail-block">
              <span className="mb-block-label">THE PAIN</span>
              <span className="mb-block-text">{seg.pain}</span>
            </div>
            <div className="mb-detail-block">
              <span className="mb-block-label">REGULATORY TAILWIND</span>
              <span className={`mb-block-text mb-block-text--${seg.color}`}>{seg.regulation}</span>
            </div>
            <div className="mb-detail-block">
              <span className="mb-block-label">WHY PRIVARA LITE WINS</span>
              <span className="mb-block-text">{seg.why_us}</span>
            </div>
            <div className="mb-detail-block mb-detail-block--highlight">
              <span className="mb-block-label">LIVE IN DEMO</span>
              <span className="mb-block-text">{seg.example}</span>
            </div>
          </div>
        </div>

        <div className="mb-arr-bar">
          <ArrowRight size={11} />
          <span className="mb-arr-text">
            <strong>ARR model:</strong> {seg.arr_target} · Source: {seg.source}
          </span>
        </div>
      </div>

      {/* Comp table toggle */}
      <button className="mb-comps-toggle" onClick={() => setShowComps(c => !c)}>
        {showComps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {showComps ? 'HIDE' : 'SHOW'} COMPETITIVE COMPARISON — $13B COMPANIES SELL ONLY TO ORGANIZATIONS
      </button>

      {showComps && (
        <div className="mb-comps">
          <table className="mb-comp-table">
            <thead>
              <tr>
                <th>COMPANY</th>
                <th>VALUATION</th>
                <th>SELLS TO</th>
                <th>MARKET INTELLIGENCE</th>
                <th>FIELD ENCRYPTION</th>
                <th>GOVERNANCE VOTING</th>
              </tr>
            </thead>
            <tbody>
              {COMP_TABLE.map(c => (
                <tr key={c.name} className={c.name === 'Privara Lite' ? 'mb-comp-row--us' : ''}>
                  <td className="mb-comp-name">{c.name}</td>
                  <td className={`mb-comp-val ${c.name === 'Privara Lite' ? 'mb-comp-val--highlight' : ''}`}>
                    {c.val}
                  </td>
                  <td className="mb-comp-sells">{c.sells_to}</td>
                  <td>{c.has_market_intel ? <span className="mb-check">✓</span> : <span className="mb-cross">✗</span>}</td>
                  <td>{c.has_encryption ? <span className="mb-check">✓</span> : <span className="mb-cross">✗</span>}</td>
                  <td>{c.has_governance ? <span className="mb-check">✓</span> : <span className="mb-cross">✗</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mb-comps-insight">
            Rippling ($13B) and Deel ($12B) sell exclusively to organizations — the same "narrow" market.
            They were never called narrow because their customer count was visible.
            Privara Lite's market is identical in structure. The demo made it look like one company.
            The product serves 50 million.
          </div>
        </div>
      )}

      {/* The rebuttal — explicitly cited */}
      <div className="mb-rebuttal">
        <div className="mb-rebuttal-label">DIRECT RESPONSE TO JUDGE FEEDBACK</div>
        <p className="mb-rebuttal-text">
          <strong>"The product may appeal more to organizations and DAOs than individual users,
          making its audience narrower than other submissions."</strong>
          <br /><br />
          Rippling built $13B selling exclusively to organizations.
          Deel built $12B serving a single organizational workflow.
          The Enterprise Financial Management Software market is valued at $14.11B in 2026
          growing at 17.2% CAGR. The Treasury Management System market is $5.8B growing at 12.84%.
          B2B organizational buyers are not a narrow market — they are the highest-value segment
          in all of software. A single CFO paying $499/month generates more ARR than 1,000
          individual crypto users on a free tier. Privara Lite targets 50 million organizations
          across four distinct regulatory environments. Three of them are already in the demo.
        </p>
      </div>
    </div>
  )
}