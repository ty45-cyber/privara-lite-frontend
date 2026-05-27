import './Card.css'

export default function Card({ children, className = '', accent }) {
  return (
    <div className={`card ${accent ? `card--accent-${accent}` : ''} ${className}`}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, accent = 'amber', icon: Icon }) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        {Icon && <Icon size={14} className="stat-icon" />}
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}