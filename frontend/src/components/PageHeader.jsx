import './PageHeader.css'

export default function PageHeader({ title, subtitle, badge, actions }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <div className="page-header-badge">{badge}</div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  )
}