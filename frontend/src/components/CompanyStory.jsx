import { Building2, Users, DollarSign, Shield, TrendingUp, CheckCircle } from 'lucide-react'
import { COMPANY_STATS, COMPANY_MILESTONES } from '../lib/mockData'
import './CompanyStory.css'

export default function CompanyStory({ variant = 'landing' }) {
  const s = COMPANY_STATS

  return (
    <div className={`company-story company-story--${variant}`}>
      <div className="cs-header">
        <Building2 size={13} className="cs-icon" />
        <div className="cs-header-text">
          <span className="cs-company-name">{s.name}</span>
          <span className="cs-company-meta">{s.hq} · {s.months_on_platform} months on Privara Lite</span>
        </div>
      </div>

      <div className="cs-stats">
        <CSStat icon={Users}       value={s.employees}                         label="Employees"             color="amber" />
        <CSStat icon={DollarSign}  value={`$${(s.treasury_processed_usd/1e6).toFixed(1)}M`} label="Treasury Processed" color="green" />
        <CSStat icon={Shield}      value={`${s.risk_accuracy_pct}%`}           label="Risk Accuracy"         color="blue"  />
        <CSStat icon={TrendingUp}  value={`$${(s.capital_protected_usd/1e3).toFixed(0)}K`} label="Capital Protected"  color="amber" />
      </div>

      <div className="cs-timeline">
        {COMPANY_MILESTONES.map((m, i) => (
          <div key={i} className={`cs-milestone ${m.wave === 3 ? 'cs-milestone--current' : ''} ${m.wave === 4 ? 'cs-milestone--future' : ''}`}>
            <div className="cs-milestone-dot">
              {m.wave < 4
                ? <CheckCircle size={12} className="cs-dot-icon cs-dot-icon--done" />
                : <div className="cs-dot-empty" />
              }
            </div>
            <div className="cs-milestone-content">
              <div className="cs-milestone-header">
                <span className="cs-milestone-wave">WAVE {m.wave}</span>
                <span className="cs-milestone-date">{m.date}</span>
              </div>
              <span className="cs-milestone-event">{m.event}</span>
              <span className="cs-milestone-detail">{m.detail}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="cs-footer">
        *Meridian Capital Partners is the Privara Lite reference customer —
        seeded demo data representing 4 months of real operational history.
      </div>
    </div>
  )
}

function CSStat({ icon: Icon, value, label, color }) {
  return (
    <div className="cs-stat">
      <Icon size={13} className={`cs-stat-icon cs-stat-icon--${color}`} />
      <span className="cs-stat-value">{value}</span>
      <span className="cs-stat-label">{label}</span>
    </div>
  )
}