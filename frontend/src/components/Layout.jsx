import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { getUser, clearSession } from '../lib/auth'
import {
  LayoutDashboard, FileSpreadsheet, Vault,
  Vote, ClipboardList, LogOut, Shield,
} from 'lucide-react'
import DemoBar from './DemoBar'
import './Layout.css'

const NAV = [
  { to: '/app/dashboard',  icon: LayoutDashboard, label: 'OVERVIEW'   },
  { to: '/app/payroll',    icon: FileSpreadsheet,  label: 'PAYROLL'    },
  { to: '/app/treasury',   icon: Vault,            label: 'TREASURY'   },
  { to: '/app/governance', icon: Vote,             label: 'GOVERNANCE' },
  { to: '/app/audit',      icon: ClipboardList,    label: 'AUDIT'      },
]

export default function Layout() {
  const user     = getUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const logout = () => {
    clearSession()
    navigate('/')
  }

  return (
    <>
      <DemoBar />

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <div className="mobile-brand">
          <Shield size={16} />
          PRIVARA
        </div>
        <button
          className={`hamburger ${open ? 'hamburger--open' : ''}`}
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <div className="hamburger-line" />
          <div className="hamburger-line" />
          <div className="hamburger-line" />
        </button>
      </div>

      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}

      <div className="layout">
        <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
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
    </>
  )
}