import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, TrendingUp, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { getUser } from '../lib/auth'
import api from '../lib/api'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Input from '../components/Input'
import MacroCalendar from '../components/MacroCalendar'
import DecisionIntelligence from '../components/DecisionIntelligence'
import './Treasury.css'

export default function Treasury() {
  const user = getUser()
  const canCreate = ['admin', 'finance'].includes(user?.role)
  const canApprove = ['admin', 'finance'].includes(user?.role)

  const [requests, setRequests]     = useState([])
  const [createModal, setCreateModal] = useState(false)
  const [riskModal, setRiskModal]   = useState(false)
  const [risk, setRisk]             = useState(null)
  const [currentRiskId, setCurrentRiskId] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [form, setForm]             = useState({
    title: '',
    amount: '',
    currency: 'USD',
    purpose: '',
    required_approvals: 2,
  })

  const [searchParams, setSearchParams] = useSearchParams()

  const fetchRequests = () =>
    api.get('/treasury/requests').then((r) => setRequests(r.data.requests || []))

  useEffect(() => { fetchRequests() }, [])

  // Deep-link support: ?highlight=treq_009 auto-opens that request's risk modal
  useEffect(() => {
    const highlightId = searchParams.get('highlight')
    if (!highlightId || requests.length === 0) return

    const target = requests.find(r => r.id === highlightId)
    if (target) {
      openRisk(highlightId, target)
      searchParams.delete('highlight')
      setSearchParams(searchParams, { replace: true })
    }
  }, [requests, searchParams])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const createRequest = async () => {
    if (!form.title || !form.amount || !form.purpose) return
    setLoading(true)
    try {
      await api.post('/treasury/requests', {
        ...form,
        amount: parseFloat(form.amount),
        required_approvals: parseInt(form.required_approvals),
      })
      setCreateModal(false)
      setForm({ title: '', amount: '', currency: 'USD', purpose: '', required_approvals: 2 })
      fetchRequests()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  const approve = async (id) => {
    try {
      await api.post(`/treasury/requests/${id}/approve`, { note: 'Approved via dashboard' })
      fetchRequests()
    } catch (e) {
      alert(e.response?.data?.message || 'Approval failed')
    }
  }

  const reject = async (id) => {
    try {
      await api.post(`/treasury/requests/${id}/reject`, { note: 'Rejected via dashboard' })
      fetchRequests()
    } catch (e) {
      alert(e.response?.data?.message || 'Rejection failed')
    }
  }

  const openRisk = async (id) => {
    setRisk(null)
    setCurrentRiskId(id)
    setRiskModal(true)
    try {
      const { data } = await api.get(`/treasury/requests/${id}/risk-score`)
      setRisk(data.risk)
    } catch (e) {
      setRisk({ error: e.response?.data?.message || 'Failed to fetch risk score' })
    }
  }

  const highlightedId = searchParams.get('highlight')

  const cols = [
    {
      key:    'title',
      label:  'TITLE',
      render: (v, r) => (
        <span className={r.id === highlightedId ? 'row-highlighted' : ''}>
          {v}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'AMOUNT',
      render: (v, r) => `${r.currency} ${Number(v).toLocaleString()}`,
    },
    {
      key: 'purpose',
      label: 'PURPOSE',
      render: (v) => <span className="truncate">{v}</span>,
    },
    {
      key: 'current_approvals',
      label: 'APPROVALS',
      render: (v, r) => (
        <span className="approvals-counter">
          {v}
          <span className="approvals-sep">/</span>
          {r.required_approvals}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (v) => <Badge label={v} />,
    },
    {
      key: 'id',
      label: 'ACTIONS',
      render: (v, row) => (
        <div className="table-actions">
          <Button variant="ghost" size="sm" onClick={() => openRisk(v)}>
            <TrendingUp size={11} /> RISK
          </Button>
          {canApprove && row.status === 'pending' && (
            <>
              <Button variant="success" size="sm" onClick={() => approve(v)}>
                <CheckCircle size={11} />
              </Button>
              <Button variant="danger" size="sm" onClick={() => reject(v)}>
                <XCircle size={11} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="treasury animate-fade-up">
      <PageHeader
        badge="// TREASURY MODULE"
        title="Treasury Operations"
        subtitle="Multi-party approval · SoSoValue ETF + news risk intelligence"
        actions={
          canCreate && (
            <Button variant="primary" onClick={() => setCreateModal(true)}>
              <Plus size={13} /> NEW REQUEST
            </Button>
          )
        }
      />

      <Table
        columns={cols}
        data={requests}
        emptyMessage="No treasury requests submitted"
      />

      <MacroCalendar />
      <DecisionIntelligence />

      {/* ── Create Modal ─────────────────────────────────────────── */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="CREATE TREASURY REQUEST"
      >
        <div className="treasury-form">
          <Input
            label="TITLE"
            value={form.title}
            onChange={set('title')}
            placeholder="Q3 Marketing Campaign"
          />
          <div className="form-row">
            <Input
              label="AMOUNT"
              type="number"
              min="0"
              value={form.amount}
              onChange={set('amount')}
              placeholder="50000"
            />
            <Input
              label="CURRENCY"
              value={form.currency}
              onChange={set('currency')}
              placeholder="USD"
            />
          </div>
          <Input
            label="PURPOSE"
            value={form.purpose}
            onChange={set('purpose')}
            placeholder="Business justification for this spend"
          />
          <Input
            label="REQUIRED APPROVALS"
            type="number"
            min="1"
            max="5"
            value={form.required_approvals}
            onChange={set('required_approvals')}
          />
          <Button
            variant="primary"
            size="lg"
            onClick={createRequest}
            loading={loading}
            className="form-submit"
          >
            SUBMIT REQUEST
          </Button>
        </div>
      </Modal>

      {/* ── Risk Modal ───────────────────────────────────────────── */}
      <Modal
        open={riskModal}
        onClose={() => { setRiskModal(false); setRisk(null); setCurrentRiskId(null) }}
        title="TREASURY RISK INTELLIGENCE"
        width={420}
      >
        {!risk ? (
          <div className="risk-loading">
            <span>Fetching SoSoValue ETF flows + news sentiment…</span>
          </div>
        ) : risk.error ? (
          <div className="risk-error">{risk.error}</div>
        ) : (
          <div className="risk-panel">
            <div className={`risk-score risk-score--${risk.risk_score?.toLowerCase()}`}>
              <span className="risk-score-label">COMPOSITE RISK SCORE</span>
              <span className="risk-score-value">{risk.risk_score}</span>
            </div>

            <div className="risk-metrics">
              <RiskMetric
                label="MARKET SENTIMENT"
                value={risk.market_sentiment}
              />
              <RiskMetric
                label="ETF FLOW PROXY"
                value={`${risk.market_volatility_pct?.toFixed(2)}%`}
              />
              <RiskMetric
                label="LIQUIDITY DEPTH"
                value={risk.liquidity_depth}
              />
            </div>

            <div className="risk-recommendation">
              <span className="risk-rec-label">RECOMMENDATION</span>
              <span className="risk-rec-value">{risk.suggested_action}</span>
            </div>

            <div className="risk-attribution">
              <span>Signal source: </span>
              <a
                href="https://sosovalue.com"
                target="_blank"
                rel="noreferrer"
              >
                SoSoValue API
              </a>
              <span> — BTC Spot ETF flows + AI news sentiment</span>
            </div>

            {/* Macro window check */}
            {currentRiskId && <MacroWindow requestId={currentRiskId} />}
          </div>
        )}
      </Modal>
    </div>
  )
}

function MacroWindow({ requestId }) {
  const [window, setWindow] = useState(null)

  useEffect(() => {
    api.get(`/treasury/requests/${requestId}/window`)
      .then(r => setWindow(r.data))
      .catch(() => {})
  }, [requestId])

  if (!window) return null

  const color = window.window_clear ? 'green' : 'red'

  return (
    <div className={`macro-window macro-window--${color}`}>
      <div className="macro-window-header">
        <Calendar size={11} />
        <span>MACRO EXECUTION WINDOW</span>
        <span className="macro-window-source">SoSoValue Macro Calendar</span>
      </div>
      <div className="macro-window-body">
        <span className={`macro-window-status macro-window-status--${color}`}>
          {window.window_clear ? '✓ CLEAR' : '⚠ CAUTION'}
        </span>
        <span className="macro-window-rec">{window.recommendation}</span>
      </div>
      {window.next_macro_event && (
        <div className="macro-window-next">
          Next: {window.next_macro_event.event} in {window.days_until_next_event}d
        </div>
      )}
    </div>
  )
}

function RiskMetric({ label, value }) {
  return (
    <div className="risk-metric">
      <span className="risk-metric-label">{label}</span>
      <span className="risk-metric-value">{value ?? '—'}</span>
    </div>
  )
}