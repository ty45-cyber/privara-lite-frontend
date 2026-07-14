import { useState, useEffect }      from 'react'
import { Plus, AlertTriangle }       from 'lucide-react'
import { getUser }                   from '../lib/auth'
import api                           from '../lib/api'
import PageHeader                    from '../components/PageHeader'
import Button                        from '../components/Button'
import Badge                         from '../components/Badge'
import Table                         from '../components/Table'
import Modal                         from '../components/Modal'
import Input, { Select }             from '../components/Input'
import AuditReportButton             from '../components/AuditReportButton'
import AtlasPanel                    from '../components/AtlasPanel'
import './Audit.css'

export default function Audit() {
  const user      = getUser()
  const isAuditor = user?.role === 'auditor'
  const isAdmin   = user?.role === 'admin'
  const canView   = ['admin','auditor'].includes(user?.role)

  const [requests, setRequests]     = useState([])
  const [logs, setLogs]             = useState([])
  const [reqModal, setReqModal]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [form, setForm] = useState({ resource_type: 'payroll', resource_id: '', reason: '' })
  const [tab, setTab]               = useState('requests')

  const fetchAll = () => Promise.all([
    api.get('/audit/requests').then(r => setRequests(r.data.requests || [])).catch(() => {}),
    api.get('/audit/logs').then(r => setLogs(r.data.logs || [])).catch(() => {}),
  ])

  useEffect(() => { if (canView) fetchAll() }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submitRequest = async () => {
    setLoading(true)
    try {
      await api.post('/audit/requests', form)
      setReqModal(false)
      fetchAll()
      setForm({ resource_type: 'payroll', resource_id: '', reason: '' })
    } catch (e) {
      alert(e.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const decide = async (id, decision) => {
    try {
      await api.post(`/audit/requests/${id}/decide`, { decision })
      fetchAll()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed')
    }
  }

  const reqCols = [
    { key: 'auditor_name',  label: 'AUDITOR' },
    { key: 'resource_type', label: 'RESOURCE',    render: (v) => v?.toUpperCase() },
    { key: 'resource_id',   label: 'RESOURCE ID', render: (v) => <span className="mono-small">{v}</span> },
    { key: 'reason',        label: 'REASON',      render: (v) => <span className="truncate-long">{v}</span> },
    { key: 'status',        label: 'STATUS',      render: (v) => <Badge label={v} /> },
    {
      key:    'id',
      label:  'ACTIONS',
      render: (v, row) => (
        <div className="table-actions">
          {isAdmin && row.status === 'pending' && (
            <>
              <Button variant="success" size="sm" onClick={() => decide(v, 'granted')}>GRANT</Button>
              <Button variant="danger"  size="sm" onClick={() => decide(v, 'denied')}>DENY</Button>
            </>
          )}
          <AuditReportButton
            resourceType={row.resource_type}
            resourceId={row.resource_id}
            label="PDF"
          />
        </div>
      ),
    },
  ]

  const logCols = [
    { key: 'occurred_at',   label: 'TIMESTAMP',  render: (v) => <span className="timestamp">{fmtDateTime(v)}</span> },
    { key: 'actor_role',    label: 'ROLE',        render: (v) => v?.toUpperCase() },
    { key: 'action',        label: 'ACTION' },
    { key: 'resource_type', label: 'RESOURCE',    render: (v) => v?.toUpperCase() },
    { key: 'resource_id',   label: 'REF',         render: (v) => <span className="mono-small">{v?.slice(0, 8)}…</span> },
  ]

  if (!canView) {
    return (
      <div className="audit animate-fade-up">
        <PageHeader badge="// AUDIT MODULE" title="Compliance & Disclosure" subtitle="Access restricted to Admin and Auditor roles" />
        <div className="audit-restricted">You do not have permission to view audit data.</div>
      </div>
    )
  }

  return (
    <div className="audit animate-fade-up">
      <PageHeader
        badge="// AUDIT MODULE"
        title="Compliance & Disclosure"
        subtitle="Selective access grants · Immutable event log · Atlas AI summarizer"
        actions={
          isAuditor && (
            <Button variant="primary" onClick={() => setReqModal(true)}>
              <Plus size={13} /> REQUEST ACCESS
            </Button>
          )
        }
      />

      {/* Atlas AI — audit intelligence summarizer */}
      <AtlasPanel />

      {/* Full audit PDF export */}
      {isAdmin && (
        <div className="audit-full-export">
          <AuditReportButton full label="EXPORT FULL SYSTEM AUDIT PDF" />
        </div>
      )}

      <div className="audit-tabs">
        <button
          className={`audit-tab ${tab === 'requests' ? 'audit-tab--active' : ''}`}
          onClick={() => setTab('requests')}
        >
          ACCESS REQUESTS
        </button>
        <button
          className={`audit-tab ${tab === 'logs' ? 'audit-tab--active' : ''}`}
          onClick={() => setTab('logs')}
        >
          <AlertTriangle size={11} /> AUDIT LOGS
        </button>
      </div>

      {tab === 'requests' && (
        <Table columns={reqCols} data={requests} emptyMessage="No audit access requests" />
      )}

      {tab === 'logs' && (
        <Table columns={logCols} data={logs} emptyMessage="No audit events recorded" />
      )}

      <Modal open={reqModal} onClose={() => setReqModal(false)} title="REQUEST AUDIT ACCESS" width={420}>
        <div className="audit-form">
          <Select label="RESOURCE TYPE" value={form.resource_type} onChange={set('resource_type')}>
            <option value="payroll">Payroll</option>
            <option value="treasury">Treasury</option>
            <option value="governance">Governance</option>
          </Select>
          <Input
            label="RESOURCE ID"
            value={form.resource_id}
            onChange={set('resource_id')}
            placeholder="UUID or batch ID of the resource"
          />
          <Input
            label="REASON"
            value={form.reason}
            onChange={set('reason')}
            placeholder="Annual compliance review…"
          />
          <Button variant="primary" size="lg" onClick={submitRequest} loading={loading} className="audit-submit">
            SUBMIT REQUEST
          </Button>
        </div>
      </Modal>
    </div>
  )
}

const fmtDateTime = (d) => d
  ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—'