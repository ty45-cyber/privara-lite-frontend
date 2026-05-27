import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Eye, EyeOff } from 'lucide-react'
import api from '../lib/api'
import { setSession } from '../lib/auth'
import Input from '../components/Input'
import Button from '../components/Button'
import './Auth.css'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    setError('')
    if (!form.email || !form.password) { setError('All fields required'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      setSession(data.token, { user_id: data.user_id, role: data.role, full_name: data.full_name })
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-grid-lines" />
      <div className="auth-box">
        <div className="auth-brand">
          <Shield size={22} className="auth-brand-icon" />
          <span className="auth-brand-name">PRIVARA</span>
        </div>
        <div className="auth-heading">
          <h1>Secure Access</h1>
          <p>Confidential Operations Hub — authorized personnel only</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-fields">
          <Input
            label="EMAIL ADDRESS"
            id="email"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="operator@privara.io"
            autoComplete="email"
          />
          <div className="pwd-field">
            <Input
              label="PASSPHRASE"
              id="password"
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="pwd-toggle"
              onClick={() => setShowPwd((s) => !s)}
            >
              {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={submit}
          loading={loading}
          className="auth-submit"
        >
          AUTHENTICATE
        </Button>

        <div className="auth-switch">
          No account?{' '}
          <Link to="/register">Request access</Link>
        </div>
      </div>
    </div>
  )
}