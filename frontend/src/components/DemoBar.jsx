import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, ChevronDown, X } from 'lucide-react'
import { isDemoSession, setSession, clearSession } from '../lib/auth'
import api from '../lib/api'
import './DemoBar.css'

const DEMO_ROLES = [
  { role: 'admin',    label: 'Admin',    desc: 'Full access'          },
  { role: 'hr',       label: 'HR',       desc: 'Payroll decrypt'      },
  { role: 'finance',  label: 'Finance',  desc: 'Treasury + approvals' },
  { role: 'auditor',  label: 'Auditor',  desc: 'Selective disclosure' },
  { role: 'employee', label: 'Employee', desc: 'Restricted view'      },
]

export default function DemoBar() {
  const navigate = useNavigate()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(null)

  if (!isDemoSession()) return null

  const switchRole = async (role) => {
    setLoading(role)
    setOpen(false)
    try {
      const { data } = await api.post('/demo/login', { role })
      setSession(data.token, {
        user_id:   data.user_id,
        role:      data.role,
        full_name: data.full_name,
      })
      navigate('/app/dashboard', { replace: true })
      window.location.reload()
    } catch (e) {
      console.error('Demo switch failed:', e)
    } finally {
      setLoading(null)
    }
  }

  const exitDemo = () => {
    clearSession()
    navigate('/')
  }

  return (
    <div className="demo-bar">
      <div className="demo-bar-left">
        <Eye size={12} className="demo-bar-icon" />
        <span className="demo-bar-label">DEMO MODE</span>
        <span className="demo-bar-hint">Explore without creating an account</span>
      </div>

      <div className="demo-bar-right">
        <div className="demo-switcher">
          <button className="demo-switcher-btn" onClick={() => setOpen(o => !o)}>
            SWITCH ROLE
            <ChevronDown size={11} className={open ? 'demo-chevron--open' : ''} />
          </button>

          {open && (
            <div className="demo-switcher-menu">
              {DEMO_ROLES.map(({ role, label, desc }) => (
                <button
                  key={role}
                  className="demo-switcher-item"
                  onClick={() => switchRole(role)}
                  disabled={!!loading}
                >
                  <span className={`demo-role-dot demo-role-dot--${role}`} />
                  <div className="demo-switcher-text">
                    <span className="demo-switcher-name">{label}</span>
                    <span className="demo-switcher-desc">{desc}</span>
                  </div>
                  {loading === role && <span className="demo-switching">…</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="demo-exit" onClick={exitDemo}>
          <X size={11} /> EXIT
        </button>
      </div>
    </div>
  )
}