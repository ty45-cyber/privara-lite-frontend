import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import api from '../lib/api'
import Input from '../components/Input'
import { Select } from '../components/Input'
import Button from '../components/Button'
import './Auth.css'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'employee' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    setError('')
    if (!form.email || !form.password || !form.full_name) { setError('All fields required'); return }
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      navigate('/login')
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed')
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
          <h1>Request Access</h1>
          <p>New operator registration</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-fields">
          <Input label="FULL NAME" id="full_name" value={form.full_name} onChange={set('full_name')} placeholder="Jane Doe" />
          <Input label="EMAIL ADDRESS" id="email" type="email" value={form.email} onChange={set('email')} placeholder="operator@privara.io" />
          <Input label="PASSPHRASE" id="password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••••••" />
          <Select label="ROLE" id="role" value={form.role} onChange={set('role')}>
            <option value="employee">Employee</option>
            <option value="hr">HR</option>
            <option value="finance">Finance</option>
            <option value="auditor">Auditor</option>
            <option value="admin">Admin</option>
          </Select>
        </div>

        <Button variant="primary" size="lg" onClick={submit} loading={loading} className="auth-submit">
          CREATE ACCOUNT
        </Button>
        <div className="auth-switch">
          Have access? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}