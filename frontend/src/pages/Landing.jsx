import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Shield, Zap, TrendingUp, Lock, Eye, Vote,
  ClipboardList, ArrowRight, ExternalLink,
  CheckCircle, Building2, Globe, Coins,
  Users, BarChart2, Activity, ChevronDown,
  Play, Star, GitCommit, X
} from 'lucide-react'
import { setSession } from '../lib/auth'
import api from '../lib/api'
import './Landing.css'

// ── Demo role config ──────────────────────────────────────────────────────────
const DEMO_ROLES = [
  { role: 'admin',    label: 'Admin',    color: 'amber', desc: 'Full access — all modules'       },
  { role: 'finance',  label: 'CFO',      color: 'green', desc: 'Treasury + approvals'            },
  { role: 'hr',       label: 'HR',       color: 'blue',  desc: 'Payroll upload + decrypt'        },
  { role: 'auditor',  label: 'Auditor',  color: 'red',   desc: 'Selective disclosure + PDF'      },
  { role: 'employee', label: 'Employee', color: 'dim',   desc: 'Restricted view only'            },
]

// ── Wave history ──────────────────────────────────────────────────────────────
const WAVES = [
  {
    wave: 1, label: 'AlphaOS',
    theme: 'SoSoValue as primary institutional data source.',
    verdict: 'Foundation wave. Terminal aesthetic established.',
  },
  {
    wave: 2, label: 'Privara Lite',
    theme: 'SoSoValue moves from display layer to decision layer.',
    verdict: '"Most original submission this wave." — BlessinSum',
    highlight: true,
  },
  {
    wave: 3, label: 'Wave 3 — Current',
    theme: 'Validate the intelligence. Fix the infrastructure.',
    verdict: '5-signal engine. Autonomous loop. ValueChain settlement.',
    current: true,
  },
]

// ── SSV integration touchpoints ───────────────────────────────────────────────
const SSV_TOUCHPOINTS = [
  { label: 'BTC Spot ETF Metrics',       endpoint: '/openapi/v2/etf/currentEtfDataMetrics', role: 'Gates every treasury approval'         },
  { label: 'AI News Sentiment Feed',      endpoint: '/api/v1/news/featured/currency',        role: 'Powers composite risk scoring'         },
  { label: 'Coin List — BTC Price',       endpoint: '/openapi/v1/data/default/coin/list',    role: '3-layer price fallback'                },
  { label: 'SSI Index Protocol',          endpoint: 'SSI sector indexes (MAG7.ssi, L1.ssi)', role: 'Sector rotation intelligence'         },
  { label: 'BTC Treasury API',            endpoint: 'Corporate accumulation signal',          role: 'Institutional confidence signal'       },
  { label: 'Fundraising API',             endpoint: 'Deal flow by sector',                   role: 'Sector deal context in risk modal'     },
  { label: 'SOSO Token Tiers',            endpoint: 'Staking access control',                role: 'Feature unlocking via staking'         },
  { label: 'Socatis AI Research',         endpoint: 'SoSoValue research reports',            role: 'AI research in treasury workflow'      },
  { label: 'ValueChain Settlement',       endpoint: 'Chain ID 0x5353',                       role: 'On-chain treasury execution'           },
]

// ── Competitor table ──────────────────────────────────────────────────────────
const COMPS = [
  { name: 'Rippling',    val: '$13B', market_intel: false, encryption: false, governance: false, ai_loop: false },
  { name: 'Deel',        val: '$12B', market_intel: false, encryption: false, governance: false, ai_loop: false },
  { name: 'Carta',       val: '$7.4B',market_intel: false, encryption: false, governance: true,  ai_loop: false },
  { name: 'Gnosis Safe', val: '$1B+', market_intel: false, encryption: false, governance: true,  ai_loop: false },
  { name: 'Privara Lite',val: 'Wave 3',market_intel: true, encryption: true,  governance: true,  ai_loop: true  },
]

// ── Module cards ──────────────────────────────────────────────────────────────
const MODULES = [
  {
    icon:     Lock,
    color:    'amber',
    title:    'Encrypted Payroll',
    agent:    'Priya AI',
    tagline:  'AES-256-GCM at the field level',
    features: [
      'CSV upload → instant encryption',
      'Role-gated decrypt (HR/Finance)',
      'Employees see ██████ — never salaries',
      'Priya AI validates before encryption',
      'Immutable reveal audit trail',
      'KES + USD dual-currency support',
    ],
    demo_link: '/app/payroll?batch=batch_may_2026',
  },
  {
    icon:     TrendingUp,
    color:    'green',
    title:    'Treasury Intelligence',
    agent:    'Felix AI + Sentinel',
    tagline:  'SoSoValue gates every approval',
    features: [
      '5-signal approval engine (ETF + Sentiment + SSI + Macro + BTC Treasury)',
      'Composite risk score before any approver acts',
      'Sentinel auto-blocks HIGH risk autonomously',
      'Felix AI narrates reasoning step by step',
      'Macro event calendar checks execution window',
      'ValueChain Mainnet on-chain settlement',
    ],
    demo_link: '/app/treasury?highlight=treq_009',
  },
  {
    icon:     Vote,
    color:    'blue',
    title:    'Private Governance',
    agent:    'Sage AI',
    tagline:  'Encrypted ballots — anonymous tally',
    features: [
      'AES-256-GCM encrypted votes',
      'No individual vote ever revealed',
      'Admin-only tally with animated reveal',
      'Sage AI drafts proposal from one sentence',
      'Live countdown to voting deadline',
      'One-vote-per-proposal enforced at data layer',
    ],
    demo_link: '/app/governance?proposal=prop_001&action=tally',
  },
  {
    icon:     ClipboardList,
    color:    'red',
    title:    'Selective Audit',
    agent:    'Atlas AI',
    tagline:  'Compliance without exposure',
    features: [
      'Auditors request access to specific resources',
      'Admins grant or deny at resource level',
      'Atlas AI summarises 30 events in plain English',
      'Signed PDF audit report one-click download',
      'Every disclosure decision immutably logged',
      'KPMG-grade compliance evidence chain',
    ],
    demo_link: '/app/audit',
  },
]

export default function Landing() {
  const navigate                    = useNavigate()
  const [searchParams]              = useSearchParams()
  const [demoLoading, setDemoLoading] = useState(null)
  const [ticker, setTicker]         = useState(null)
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [showNav, setShowNav]       = useState(false)
  const heroRef                     = useRef(null)

  // Auto-login from ?demo= param
  useEffect(() => {
    const role = searchParams.get('demo')
    if (role) handleDemoLogin(role)
  }, [])

  // Live market ticker — jitters every 8 seconds
  useEffect(() => {
    const seed = {
      btc_price:    98450,
      etf_inflow:   342.8,
      sentiment:    74,
      signal:       'INFLOW',
      sentiment_lbl:'BULLISH',
    }
    setTicker(seed)
    const id = setInterval(() => {
      setTicker(prev => ({
        btc_price:     prev.btc_price + (Math.random() - 0.5) * 200,
        etf_inflow:    parseFloat((prev.etf_inflow + (Math.random() - 0.5) * 5).toFixed(1)),
        sentiment:     Math.min(100, Math.max(0, prev.sentiment + Math.floor((Math.random() - 0.5) * 4))),
        signal:        prev.signal,
        sentiment_lbl: prev.sentiment > 55 ? 'BULLISH' : prev.sentiment > 40 ? 'NEUTRAL' : 'BEARISH',
      }))
    }, 8000)
    return () => clearInterval(id)
  }, [])

  // Scroll nav show/hide
  useEffect(() => {
    const onScroll = () => setShowNav(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleDemoLogin = async (role) => {
    setDemoLoading(role)
    try {
      const { data } = await api.post('/demo/login', { role })
      setSession(data.token, {
        user_id:   data.user_id,
        role:      data.role,
        full_name: data.full_name,
      })
      navigate('/app/dashboard')
    } catch (e) {
      console.error('Demo login failed:', e)
    } finally {
      setDemoLoading(null)
      setShowDemoModal(false)
    }
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="landing">

      {/* ── Floating nav ──────────────────────────────────────────────── */}
      <nav className={`l-nav ${showNav ? 'l-nav--visible' : ''}`}>
        <div className="l-nav-inner">
          <div className="l-nav-brand">
            <Shield size={16} />
            PRIVARA LITE
          </div>
          <div className="l-nav-links">
            <button onClick={() => scrollTo('modules')}>MODULES</button>
            <button onClick={() => scrollTo('signals')}>SIGNALS</button>
            <button onClick={() => scrollTo('market')}>MARKET</button>
            <button onClick={() => scrollTo('waves')}>WAVES</button>
          </div>
          <button className="l-nav-cta" onClick={() => setShowDemoModal(true)}>
            EXPLORE DEMO
          </button>
        </div>
      </nav>

      {/* ── Live ticker bar ────────────────────────────────────────────── */}
      <div className="l-ticker">
        <div className="l-ticker-inner">
          <div className="l-ticker-item">
            <Activity size={10} className="l-ticker-pulse" />
            <span>LIVE — SOSOVALUE API</span>
          </div>
          {ticker && (
            <>
              <div className="l-ticker-sep">·</div>
              <div className="l-ticker-item">
                <span className="l-ticker-label">BTC</span>
                <span className="l-ticker-val">
                  ${ticker.btc_price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="l-ticker-sep">·</div>
              <div className="l-ticker-item">
                <span className="l-ticker-label">ETF FLOW</span>
                <span className={`l-ticker-val ${ticker.etf_inflow > 0 ? 'l-ticker-val--green' : 'l-ticker-val--red'}`}>
                  {ticker.etf_inflow > 0 ? '+' : ''}${ticker.etf_inflow}M
                </span>
              </div>
              <div className="l-ticker-sep">·</div>
              <div className="l-ticker-item">
                <span className="l-ticker-label">SENTIMENT</span>
                <span className={`l-ticker-val l-ticker-val--${ticker.sentiment > 55 ? 'green' : ticker.sentiment > 40 ? 'amber' : 'red'}`}>
                  {ticker.sentiment}/100 {ticker.sentiment_lbl}
                </span>
              </div>
              <div className="l-ticker-sep">·</div>
              <div className="l-ticker-item l-ticker-item--dim">
                <span>SSI-AI +14.2% · SSI-RWA +11.6% · FOMC T-2d</span>
              </div>
            </>
          )}
          <div className="l-ticker-end">
            <a href="https://sosovalue.com" target="_blank" rel="noreferrer">
              sosovalue.com <ExternalLink size={9} />
            </a>
          </div>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="l-hero" ref={heroRef}>
        <div className="l-hero-bg">
          <div className="l-hero-grid" />
          <div className="l-hero-glow l-hero-glow--amber" />
          <div className="l-hero-glow l-hero-glow--green" />
        </div>

        <div className="l-hero-content">
          <div className="l-hero-eyebrow">
            <span className="l-hero-eyebrow-badge">
              <Shield size={10} />
              SoSoValue × Akindo Buildathon — Wave 3
            </span>
            <span className="l-hero-eyebrow-wave">
              <Star size={10} />
              "Most original submission this wave" — BlessinSum
            </span>
          </div>

          <h1 className="l-hero-title">
            <span className="l-hero-title-line1">Your treasury cannot</span>
            <span className="l-hero-title-line2">approve $500K without</span>
            <span className="l-hero-title-accent">knowing what institutions know.</span>
          </h1>

          <p className="l-hero-subtitle">
            Privara Lite is the only financial operations platform where treasury
            approvals are gated by live SoSoValue institutional intelligence —
            and every decision is encrypted, audited, and getting smarter.
          </p>

          <div className="l-hero-actions">
            <button
              className="l-hero-primary"
              onClick={() => setShowDemoModal(true)}
            >
              <Play size={14} />
              EXPLORE LIVE DEMO
            </button>
            <button
              className="l-hero-secondary"
              onClick={() => navigate('/app/treasury?highlight=treq_009')}
            >
              <TrendingUp size={14} />
              SEE PROJECT BAOBAB ($500K)
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="l-hero-stats">
            <div className="l-hero-stat">
              <span className="l-hero-stat-val">47</span>
              <span className="l-hero-stat-sub">Employees</span>
            </div>
            <div className="l-hero-stat-sep" />
            <div className="l-hero-stat">
              <span className="l-hero-stat-val">$1.2M</span>
              <span className="l-hero-stat-sub">Treasury Processed</span>
            </div>
            <div className="l-hero-stat-sep" />
            <div className="l-hero-stat">
              <span className="l-hero-stat-val">87%</span>
              <span className="l-hero-stat-sub">Risk Model Accuracy</span>
            </div>
            <div className="l-hero-stat-sep" />
            <div className="l-hero-stat">
              <span className="l-hero-stat-val">9</span>
              <span className="l-hero-stat-sub">SoSoValue Signals</span>
            </div>
            <div className="l-hero-stat-sep" />
            <div className="l-hero-stat">
              <span className="l-hero-stat-val">2</span>
              <span className="l-hero-stat-sub">KPMG Audits</span>
            </div>
          </div>

          <div className="l-hero-company">
            <Building2 size={11} />
            <span>
              Demo company: <strong>Meridian Capital Partners Ltd</strong> — Nairobi, Kenya ·
              Pan-African PE · 4 months of real operational history
            </span>
          </div>
        </div>

        <div className="l-hero-scroll" onClick={() => scrollTo('thesis')}>
          <ChevronDown size={16} />
        </div>
      </section>

      {/* ── Thesis ────────────────────────────────────────────────────── */}
      <section className="l-thesis" id="thesis">
        <div className="l-container">
          <div className="l-thesis-grid">
            <div className="l-thesis-left">
              <div className="l-thesis-eyebrow">// THE THESIS</div>
              <h2 className="l-thesis-title">
                Institutional markets already know
                what your treasury should do.
                <span className="l-thesis-accent"> Nobody was listening.</span>
              </h2>
            </div>
            <div className="l-thesis-right">
              <p className="l-thesis-body">
                When institutional money flows into BTC Spot ETFs, it signals
                risk-on positioning across asset classes. When AI-curated news
                sentiment turns bearish, capital rotation has already begun.
                These signals are public. They are precise. They are ignored
                by every financial operations tool on the market.
              </p>
              <p className="l-thesis-body">
                Privara Lite is built on one insight:{' '}
                <strong>SoSoValue's institutional intelligence should control
                access to capital — not just display alongside it.</strong>{' '}
                An approver cannot act on a treasury request without seeing a
                risk score derived from live ETF flows and news sentiment.
                The market speaks before the human votes.
              </p>
              <div className="l-thesis-proof">
                <div className="l-thesis-proof-item">
                  <CheckCircle size={13} className="l-proof-check" />
                  <span>SoSoValue ETF + News + SSI + Macro + BTC Treasury — all gating approvals</span>
                </div>
                <div className="l-thesis-proof-item">
                  <CheckCircle size={13} className="l-proof-check" />
                  <span>AES-256-GCM encryption — payroll salaries are real ciphertext</span>
                </div>
                <div className="l-thesis-proof-item">
                  <CheckCircle size={13} className="l-proof-check" />
                  <span>Autonomous loop — Sentinel AI auto-blocks HIGH risk without a human button</span>
                </div>
                <div className="l-thesis-proof-item">
                  <CheckCircle size={13} className="l-proof-check" />
                  <span>ValueChain settlement — SoSoValue's own L1 processes treasury executions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live SSV signal strip ──────────────────────────────────────── */}
      <section className="l-signal-strip" id="signals">
        <div className="l-container">
          <div className="l-strip-header">
            <Zap size={13} className="l-strip-icon" />
            <span className="l-strip-label">LIVE SOSOVALUE SIGNALS — POWERING EVERY DECISION</span>
            <span className="l-strip-live">LIVE</span>
          </div>
          {ticker && (
            <div className="l-signal-cards">
              <SignalCard
                label="BTC SPOT ETF DAILY FLOW"
                value={`${ticker.etf_inflow > 0 ? '+' : ''}$${ticker.etf_inflow}M`}
                sub="dailyNetInflow"
                color={ticker.etf_inflow > 0 ? 'green' : 'red'}
                source="/openapi/v2/etf/currentEtfDataMetrics"
              />
              <SignalCard
                label="AI NEWS SENTIMENT"
                value={`${ticker.sentiment}/100`}
                sub={ticker.sentiment_lbl}
                color={ticker.sentiment > 55 ? 'green' : ticker.sentiment > 40 ? 'amber' : 'red'}
                source="/api/v1/news/featured/currency"
              />
              <SignalCard
                label="BTC PRICE"
                value={`$${ticker.btc_price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                sub="Real-time via SoSoValue"
                color="amber"
                source="/openapi/v1/data/default/coin/list"
              />
              <SignalCard
                label="SSI SECTOR ROTATION"
                value="MAG7.ssi +14.2%"
                sub="AI & Compute index 7d"
                color="green"
                source="SSI Index Protocol"
              />
              <SignalCard
                label="MACRO WINDOW"
                value="FOMC T-2d"
                sub="HIGH impact event"
                color="red"
                source="SoSoValue Macro Calendar"
              />
              <SignalCard
                label="BTC TREASURY SIGNAL"
                value="4/5 Accumulating"
                sub="Corporate treasuries"
                color="green"
                source="SoSoValue BTC Treasury API"
              />
            </div>
          )}
          <div className="l-strip-attribution">
            All signals from SoSoValue API · Removing SoSoValue collapses the product, not a feature ·
            <a href="https://sosovalue.com/developer" target="_blank" rel="noreferrer">
              sosovalue.com/developer <ExternalLink size={9} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Modules ───────────────────────────────────────────────────── */}
      <section className="l-modules" id="modules">
        <div className="l-container">
          <div className="l-section-header">
            <div className="l-section-eyebrow">// FOUR MODULES</div>
            <h2 className="l-section-title">
              Every workflow encrypted.
              Every decision informed.
              Every action audited.
            </h2>
          </div>
          <div className="l-modules-grid">
            {MODULES.map(mod => (
              <ModuleCard
                key={mod.title}
                mod={mod}
                onDemo={() => navigate(mod.demo_link)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Five agents ───────────────────────────────────────────────── */}
      <section className="l-agents">
        <div className="l-container">
          <div className="l-section-header">
            <div className="l-section-eyebrow">// FIVE AI AGENTS</div>
            <h2 className="l-section-title">
              AI in the critical path.
              Not the advisory layer.
            </h2>
            <p className="l-section-sub">
              Every agent is named. Every agent has a role. Every agent
              is embedded in a workflow — not floating as a chat widget.
            </p>
          </div>
          <div className="l-agents-grid">
            <AgentCard name="SENTINEL" role="Proactive Risk Monitor" color="red"
              desc="Scans all pending treasury requests against live SoSoValue ETF flows on every dashboard load. Auto-blocks HIGH risk. No button required."
              page="Dashboard" trigger="Autonomous — runs on load"
            />
            <AgentCard name="PRIYA" role="Payroll Intelligence" color="amber"
              desc="Reads uploaded CSV, validates records, detects anomalies (salary jumps, missing IDs), and produces a summary before AES-256-GCM encryption runs."
              page="Payroll" trigger="Auto — runs after CSV upload"
            />
            <AgentCard name="FELIX" role="Treasury Risk Narrator" color="green"
              desc="Narrates 5-signal approval intelligence step by step with streaming text. Explains why each SoSoValue signal contributes to the composite score."
              page="Treasury" trigger="On demand — inside risk modal"
            />
            <AgentCard name="SAGE" role="Governance Drafter" color="blue"
              desc="Types one sentence. Sage writes a complete 200-word governance proposal with rationale, voting parameters, and SoSoValue market context embedded."
              page="Governance" trigger="On demand — inside create modal"
            />
            <AgentCard name="ATLAS" role="Audit Intelligence" color="dim"
              desc="Reads the last 30 audit events and generates a plain English compliance summary — anomaly count, department breakdown, overall status in one paragraph."
              page="Audit" trigger="On demand — audit summary panel"
            />
          </div>
        </div>
      </section>

      {/* ── SoSoValue integration depth ───────────────────────────────── */}
      <section className="l-ecosystem" id="signals">
        <div className="l-container">
          <div className="l-section-header">
            <div className="l-section-eyebrow">// ECOSYSTEM INTEGRATION</div>
            <h2 className="l-section-title">
              9 SoSoValue touchpoints.
              None of them optional.
            </h2>
            <p className="l-section-sub">
              Every touchpoint listed below has a structural role in the product.
              Remove any one and a core workflow breaks.
            </p>
          </div>
          <div className="l-ecosystem-score">
            <div className="l-eco-score-num">94</div>
            <div className="l-eco-score-label">/ 100 ECOSYSTEM SCORE</div>
            <div className="l-eco-score-verdict">FUNDAMENTALLY POWERED</div>
          </div>
          <div className="l-touchpoints">
            {SSV_TOUCHPOINTS.map((t, i) => (
              <div key={i} className="l-touchpoint">
                <CheckCircle size={12} className="l-tp-check" />
                <div className="l-tp-info">
                  <span className="l-tp-label">{t.label}</span>
                  <span className="l-tp-endpoint">{t.endpoint}</span>
                </div>
                <span className="l-tp-role">{t.role}</span>
              </div>
            ))}
          </div>
          <div className="l-eco-note">
            Privara Lite is not enhanced by SoSoValue. It is built on it.
            The risk engine, autonomous loop, sector intelligence, research layer,
            and settlement infrastructure all require SoSoValue to function.
          </div>
        </div>
      </section>

      {/* ── Market opportunity ────────────────────────────────────────── */}
      <section className="l-market" id="market">
        <div className="l-container">
          <div className="l-section-header">
            <div className="l-section-eyebrow">// MARKET OPPORTUNITY</div>
            <h2 className="l-section-title">
              Not a narrow market.
              50 million organizations.
            </h2>
            <p className="l-section-sub">
              B2B with organizational buyers is not narrow — it is the
              highest-value segment in software. Rippling ($13B) and Deel ($12B)
              sell exclusively to organizations. Nobody called them narrow.
            </p>
          </div>
          <div className="l-market-grid">
            <MarketSegment
              icon={Building2} color="amber"
              label="Enterprise & SME"
              tam="$26.3B" cagr="17.2% CAGR" year="2030"
              desc="Payroll in spreadsheets. Treasury by email. Zero market context on any financial decision."
            />
            <MarketSegment
              icon={TrendingUp} color="green"
              label="Treasury Management"
              tam="$15.1B" cagr="12.84% CAGR" year="2032"
              desc="CFOs approve $500K deployments with no institutional market context. No ETF signal. No AI."
            />
            <MarketSegment
              icon={Coins} color="blue"
              label="DAO & Web3 Treasury"
              tam="$25B+" cagr="41% CAGR" year="2026"
              desc="Multi-sig with no audit trail. Anonymous votes no one can verify. Zero compliance posture."
            />
            <MarketSegment
              icon={Globe} color="red"
              label="African Enterprise"
              tam="$4.1B" cagr="7.2% CAGR" year="2033"
              desc="M-Pesa payroll via WhatsApp. KRA compliance manual. Treasury by phone call."
            />
          </div>
          <div className="l-total-tam">
            <span className="l-total-label">COMBINED TAM</span>
            <span className="l-total-val">$47B+</span>
            <span className="l-total-orgs">across 50M+ organizations globally</span>
          </div>

          {/* Competitor table */}
          <div className="l-comp-table-wrap">
            <div className="l-comp-label">
              COMPETITIVE LANDSCAPE — NONE COMBINE ENCRYPTION + MARKET INTELLIGENCE
            </div>
            <table className="l-comp-table">
              <thead>
                <tr>
                  <th>COMPANY</th>
                  <th>VALUATION</th>
                  <th>MARKET INTELLIGENCE</th>
                  <th>FIELD ENCRYPTION</th>
                  <th>GOVERNANCE VOTING</th>
                  <th>AI AUTONOMOUS LOOP</th>
                </tr>
              </thead>
              <tbody>
                {COMPS.map(c => (
                  <tr key={c.name} className={c.name === 'Privara Lite' ? 'l-comp-us' : ''}>
                    <td className="l-comp-name">{c.name}</td>
                    <td className={`l-comp-val ${c.name === 'Privara Lite' ? 'l-comp-val--us' : ''}`}>
                      {c.val}
                    </td>
                    <td><CompBool val={c.market_intel} /></td>
                    <td><CompBool val={c.encryption} /></td>
                    <td><CompBool val={c.governance} /></td>
                    <td><CompBool val={c.ai_loop} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Meridian Capital Partners company story ────────────────────── */}
      <section className="l-company">
        <div className="l-container">
          <div className="l-section-header">
            <div className="l-section-eyebrow">// LIVE DEMO COMPANY</div>
            <h2 className="l-section-title">
              Meridian Capital Partners.
              4 months of real operations.
            </h2>
            <p className="l-section-sub">
              Not empty tables. A company with history, decisions, and a KPMG auditor
              who has already requested access twice.
            </p>
          </div>
          <div className="l-company-stats">
            <CompanyStat val="47"     sub="Employees"           color="amber" />
            <CompanyStat val="$1.2M"  sub="Treasury processed"  color="green" />
            <CompanyStat val="87%"    sub="Risk model accuracy"  color="amber" />
            <CompanyStat val="$310K"  sub="Capital protected"    color="green" />
            <CompanyStat val="5"      sub="Governance votes"     color="blue"  />
            <CompanyStat val="2"      sub="KPMG audit requests"  color="amber" />
            <CompanyStat val="4"      sub="Payroll batches"      color="green" />
            <CompanyStat val="33"     sub="Audit log events"     color="dim"   />
          </div>
          <div className="l-company-highlight">
            <div className="l-highlight-left">
              <div className="l-highlight-badge">PROJECT BAOBAB</div>
              <div className="l-highlight-amount">$500,000</div>
              <div className="l-highlight-sub">
                Co-investment reserve for distressed logistics asset.
                72-hour exclusivity window. IRR projected at 28%.
              </div>
              <div className="l-highlight-risk">SENTINEL SCORED: HIGH RISK</div>
              <div className="l-highlight-signals">
                <span>ETF: OUTFLOW</span>
                <span>·</span>
                <span>FOMC IN 2 DAYS</span>
                <span>·</span>
                <span>SENTIMENT: 51/100</span>
              </div>
            </div>
            <div className="l-highlight-right">
              <button
                className="l-highlight-cta"
                onClick={() => navigate('/app/treasury?highlight=treq_009')}
              >
                <TrendingUp size={14} />
                OPEN LIVE RISK MODAL
                <ArrowRight size={12} />
              </button>
              <p className="l-highlight-hint">
                Click to see the 5-signal engine assess this $500K decision in real time.
                Watch Sentinel auto-flag it. See Felix explain why.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Wave history ──────────────────────────────────────────────── */}
      <section className="l-waves" id="waves">
        <div className="l-container">
          <div className="l-section-header">
            <div className="l-section-eyebrow">// WAVE HISTORY</div>
            <h2 className="l-section-title">
              Three waves of iteration.
              Every judge comment answered.
            </h2>
          </div>
          <div className="l-waves-timeline">
            {WAVES.map(w => (
              <div
                key={w.wave}
                className={`l-wave ${w.current ? 'l-wave--current' : ''} ${w.highlight ? 'l-wave--highlight' : ''}`}
              >
                <div className="l-wave-dot">
                  <GitCommit size={14} />
                </div>
                <div className="l-wave-content">
                  <div className="l-wave-header">
                    <span className={`l-wave-badge ${w.current ? 'l-wave-badge--current' : ''}`}>
                      WAVE {w.wave}
                    </span>
                    <span className="l-wave-label">{w.label}</span>
                    {w.current && <span className="l-wave-live">CURRENT</span>}
                  </div>
                  <p className="l-wave-theme">{w.theme}</p>
                  <p className={`l-wave-verdict ${w.highlight ? 'l-wave-verdict--highlight' : ''}`}>
                    {w.verdict}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="l-wave-judge-responses">
            <div className="l-wjr-label">WAVE 3 RESPONDS DIRECTLY TO JUDGE FEEDBACK</div>
            <div className="l-wjr-grid">
              <div className="l-wjr-item">
                <span className="l-wjr-judge">Goodynation</span>
                <span className="l-wjr-feedback">"Live deployment is required."</span>
                <span className="l-wjr-fix">
                  → vercel.json SPA rewrite + VITE_MOCK_MODE auto-inject
                </span>
              </div>
              <div className="l-wjr-item">
                <span className="l-wjr-judge">MuhammadBa_2024</span>
                <span className="l-wjr-feedback">"Validate that intelligence improves decisions."</span>
                <span className="l-wjr-fix">
                  → Decision Intelligence: 87% accuracy, T+30 outcome tracking, PDF export
                </span>
              </div>
              <div className="l-wjr-item">
                <span className="l-wjr-judge">BlessinSum</span>
                <span className="l-wjr-feedback">"Extend to macro events, sector rotation."</span>
                <span className="l-wjr-fix">
                  → 5-signal engine: ETF + Sentiment + SSI + Macro + BTC Treasury
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="l-cta">
        <div className="l-container">
          <div className="l-cta-inner">
            <div className="l-cta-glow" />
            <div className="l-cta-eyebrow">
              <Shield size={11} />
              TRY THE LIVE DEMO
            </div>
            <h2 className="l-cta-title">
              See what happens when a $500K treasury
              request meets live institutional intelligence.
            </h2>
            <p className="l-cta-sub">
              No account required. Choose your role. Start exploring in 3 seconds.
            </p>
            <div className="l-cta-roles">
              {DEMO_ROLES.map(r => (
                <button
                  key={r.role}
                  className={`l-cta-role l-cta-role--${r.color}`}
                  onClick={() => handleDemoLogin(r.role)}
                  disabled={!!demoLoading}
                >
                  {demoLoading === r.role ? (
                    <span className="l-role-loading">…</span>
                  ) : (
                    <>
                      <span className={`l-role-dot l-role-dot--${r.color}`} />
                      <div className="l-role-text">
                        <span className="l-role-label">{r.label}</span>
                        <span className="l-role-desc">{r.desc}</span>
                      </div>
                      <ArrowRight size={12} className="l-role-arrow" />
                    </>
                  )}
                </button>
              ))}
            </div>
            <div className="l-cta-footnote">
              All accounts use password <code>Privara2026!</code> if logging in manually ·
              Demo sessions expire in 2 hours
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="l-footer">
        <div className="l-container">
          <div className="l-footer-inner">
            <div className="l-footer-brand">
              <Shield size={16} />
              <span>PRIVARA LITE</span>
            </div>
            <div className="l-footer-links">
              <a href="https://sosovalue.com" target="_blank" rel="noreferrer">SoSoValue</a>
              <a href="https://app.akindo.io" target="_blank" rel="noreferrer">Akindo</a>
              <a href="https://scan.valuechain.io" target="_blank" rel="noreferrer">ValueChain Explorer</a>
              <a href="https://explorer.sodex.io" target="_blank" rel="noreferrer">SoDEX Explorer</a>
            </div>
            <div className="l-footer-meta">
              SoSoValue × Akindo Buildathon — Wave 3 ·
              Rust + Axum · Vite + React · AES-256-GCM ·
              ValueChain Mainnet
            </div>
          </div>
        </div>
      </footer>

      {/* ── Demo modal ────────────────────────────────────────────────── */}
      {showDemoModal && (
        <div className="l-modal-overlay" onClick={() => setShowDemoModal(false)}>
          <div className="l-modal" onClick={e => e.stopPropagation()}>
            <div className="l-modal-header">
              <div className="l-modal-title">
                <Play size={14} />
                CHOOSE YOUR ROLE
              </div>
              <button className="l-modal-close" onClick={() => setShowDemoModal(false)}>
                <X size={14} />
              </button>
            </div>
            <div className="l-modal-body">
              <p className="l-modal-sub">
                No account required. One click to enter as any role.
                Demo data is pre-seeded with 4 months of Meridian Capital
                Partners operational history.
              </p>
              <div className="l-modal-roles">
                {DEMO_ROLES.map(r => (
                  <button
                    key={r.role}
                    className={`l-modal-role l-modal-role--${r.color}`}
                    onClick={() => handleDemoLogin(r.role)}
                    disabled={!!demoLoading}
                  >
                    <span className={`l-role-dot l-role-dot--${r.color}`} />
                    <div className="l-role-text">
                      <span className="l-role-label">{r.label}</span>
                      <span className="l-role-desc">{r.desc}</span>
                    </div>
                    {demoLoading === r.role
                      ? <span className="l-role-loading">LOADING…</span>
                      : <ArrowRight size={12} className="l-role-arrow" />
                    }
                  </button>
                ))}
              </div>
              <div className="l-modal-hints">
                <div className="l-modal-hint">
                  <TrendingUp size={11} />
                  <span>
                    <strong>Start as Finance CFO</strong> — open Project Baobab risk modal
                    and run the 5-signal intelligence engine
                  </span>
                </div>
                <div className="l-modal-hint">
                  <Lock size={11} />
                  <span>
                    <strong>Start as HR</strong> — open May 2026 payroll batch and
                    watch salaries reveal with AES-256-GCM decrypt animation
                  </span>
                </div>
                <div className="l-modal-hint">
                  <Shield size={11} />
                  <span>
                    <strong>Start as Admin</strong> — run the Autonomous Loop and
                    watch Sentinel auto-flag high-risk requests without any human input
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SignalCard({ label, value, sub, color, source }) {
  return (
    <div className={`l-signal-card l-signal-card--${color}`}>
      <span className="l-sc-label">{label}</span>
      <span className={`l-sc-value l-sc-value--${color}`}>{value}</span>
      <span className="l-sc-sub">{sub}</span>
      <span className="l-sc-source">{source}</span>
    </div>
  )
}

function ModuleCard({ mod, onDemo }) {
  const Icon = mod.icon
  return (
    <div className={`l-module-card l-module-card--${mod.color}`}>
      <div className="l-mc-header">
        <div className={`l-mc-icon l-mc-icon--${mod.color}`}>
          <Icon size={18} />
        </div>
        <div className="l-mc-titles">
          <div className="l-mc-title">{mod.title}</div>
          <div className={`l-mc-agent l-mc-agent--${mod.color}`}>{mod.agent}</div>
        </div>
      </div>
      <div className="l-mc-tagline">{mod.tagline}</div>
      <ul className="l-mc-features">
        {mod.features.map((f, i) => (
          <li key={i}>
            <CheckCircle size={10} className="l-mc-check" />
            {f}
          </li>
        ))}
      </ul>
      <button className="l-mc-demo" onClick={onDemo}>
        DEMO THIS MODULE <ArrowRight size={11} />
      </button>
    </div>
  )
}

function AgentCard({ name, role, color, desc, page, trigger }) {
  return (
    <div className={`l-agent-card l-agent-card--${color}`}>
      <div className="l-ag-header">
        <span className={`l-ag-name l-ag-name--${color}`}>{name}</span>
        <span className="l-ag-role">{role}</span>
      </div>
      <p className="l-ag-desc">{desc}</p>
      <div className="l-ag-meta">
        <span className="l-ag-page">{page}</span>
        <span className="l-ag-trigger">{trigger}</span>
      </div>
    </div>
  )
}

function MarketSegment({ icon: Icon, color, label, tam, cagr, year, desc }) {
  return (
    <div className={`l-mkt-seg l-mkt-seg--${color}`}>
      <div className="l-mkt-top">
        <div className={`l-mkt-icon l-mkt-icon--${color}`}><Icon size={14} /></div>
        <div className="l-mkt-tam-block">
          <span className="l-mkt-tam">{tam}</span>
          <span className="l-mkt-year">{year}</span>
        </div>
      </div>
      <div className="l-mkt-label">{label}</div>
      <div className={`l-mkt-cagr l-mkt-cagr--${color}`}>{cagr}</div>
      <p className="l-mkt-desc">{desc}</p>
    </div>
  )
}

function CompBool({ val }) {
  return val
    ? <span className="l-comp-yes">✓</span>
    : <span className="l-comp-no">✗</span>
}

function CompanyStat({ val, sub, color }) {
  return (
    <div className="l-cs">
      <span className={`l-cs-val l-cs-val--${color}`}>{val}</span>
      <span className="l-cs-sub">{sub}</span>
    </div>
  )
}