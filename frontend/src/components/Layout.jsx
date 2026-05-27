import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { getUser, clearSession } from '../lib/auth'
import {
  LayoutDashboard, FileSpreadsheet, Vault,
  Vote, ClipboardList, LogOut, Shield
} from 'lucide-react'
import './Layout.css'

const NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'OVERVIEW' },
  { to: '/payroll',    icon: FileSpreadsheet,  label: 'PAYROLL' },
  { to: '/treasury',   icon: Vault,            label: 'TREASURY' },
  { to: '/governance', icon: Vote,             label: 'GOVERNANCE' },
  { to: '/audit',      icon: ClipboardList,    label: 'AUDIT' },
]

export default function Layout() {
  const user = getUser()
  const navigate = useNavigate()

  const logout = () => {
    clearSession()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Shield size={18} className="brand-icon" />
          <span className="brand-name">PRIVARA</span>
          <span className="brand-tag">LITE</span>
        </div>

        <div className="sidebar-meta">
          <div className="meta-label">OPERATOR</div>
          <div className="meta-name">{user?.full_name}</div>
          <div className="meta-role">{user?.role?.toUpperCase()}</div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item--active' : ''}`
              }
            >
              <Icon size={14} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={logout}>
          <LogOut size={13} />
          <span>LOGOUT</span>
        </button>

        <div className="sidebar-footer">
          <div className="status-dot" />
          <span>ENCRYPTED SESSION</span>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}