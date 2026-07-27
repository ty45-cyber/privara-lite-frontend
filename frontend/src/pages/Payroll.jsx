import { useState, useEffect, useRef } from 'react'
import { Upload, Eye, EyeOff, Download, Plus, AlertTriangle, Sparkles } from 'lucide-react'
import { getUser } from '../lib/auth'
import api from '../lib/api'
import { runPriyaAgent } from '../lib/agents'
import PageHeader from '../components/PageHeader'
import Button     from '../components/Button'
import Badge      from '../components/Badge'
import Table      from '../components/Table'
import Modal      from '../components/Modal'
import Input      from '../components/Input'
import { toast } from '../components/Toast'
import './Payroll.css'

export default function Payroll() {
  const user       = getUser()
  const canUpload  = ['admin','hr'].includes(user?.role)
  const canDecrypt = ['admin','hr','finance'].includes(user?.role)

  const [batches, setBatches]           = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [records, setRecords]           = useState([])
  const [revealed, setRevealed]         = useState(false)
  const [revealing, setRevealing]       = useState(false)
  const [uploadModal, setUploadModal]   = useState(false)
  const [uploading, setUploading]       = useState(false)
  const [priyaResult, setPriyaResult]   = useState(null)
  const [priyaRunning, setPriyaRunning] = useState(false)
  const [csvText, setCsvText]           = useState('')
  const [form, setForm] = useState({ name: '', period_start: '', period_end: '' })
  const fileRef = useRef()

  const fetchBatches = () =>
    api.get('/payroll/batches').then(r => setBatches(r.data.batches || []))

  useEffect(() => { fetchBatches() }, [])

  const openBatch = async (batch) => {
    setSelectedBatch(batch)
    setRevealed(false)
    const { data } = await api.get(`/payroll/batches/${batch.id}`)
    setRecords(data.records || [])
  }

  const reveal = () => {
    if (!canDecrypt) return
    setRevealing(true)
    setTimeout(() => { setRevealed(true); setRevealing(false) }, 800)
  }

  const handleFileSelect = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setCsvText(e.target.result || '')
    reader.readAsText(file)
  }

  const uploadBatch = async () => {
    if (!fileRef.current?.files[0]) return
    const fd = new FormData()
    fd.append('name',         form.name)
    fd.append('period_start', form.period_start)
    fd.append('period_end',   form.period_end)
    fd.append('file',         fileRef.current.files[0])
    setUploading(true)
    setPriyaResult(null)
    try {
      // Run Priya first if we have CSV text
      if (csvText && canUpload) {
        setPriyaRunning(true)
        try {
          const priya = await runPriyaAgent(csvText)
          setPriyaResult(priya)
        } catch { /* non-blocking */ } finally {
          setPriyaRunning(false)
        }
      }
      await api.post('/payroll/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUploadModal(false)
      fetchBatches()
      setForm({ name: '', period_start: '', period_end: '' })
      setCsvText('')
    } catch (e) {
      alert(e.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const exportAudit = async (batchId) => {
    const { data } = await api.get(`/payroll/batches/${batchId}/audit-export`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([data]))
    const a   = document.createElement('a')
    a.href = url; a.download = `audit-${batchId}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const batchCols = [
    { key: 'name',          label: 'BATCH NAME' },
    { key: 'period_start',  label: 'PERIOD',  render: (v, r) => `${v} → ${r.period_end}` },
    { key: 'total_records', label: 'RECORDS' },
    { key: 'status',        label: 'STATUS',  render: (v) => <Badge label={v} /> },
    { key: 'id',            label: 'ACTIONS', render: (v, row) => (
      <div className="table-actions">
        <Button variant="ghost" size="sm" onClick={() => openBatch(row)}>VIEW</Button>
        {['admin','auditor'].includes(user?.role) && (
          <Button variant="ghost" size="sm" onClick={() => exportAudit(v)}>
            <Download size={11} /> EXPORT
          </Button>
        )}
      </div>
    )},
  ]

  const recordCols = [
    { key: 'employee_id',   label: 'EMP ID'  },
    { key: 'employee_name', label: 'NAME'    },
    { key: 'department',    label: 'DEPT'    },
    { key: 'gross_salary',  label: 'GROSS',      render: (v) => <SalaryCell value={v} revealed={revealed} revealing={revealing} /> },
    { key: 'deductions',    label: 'DEDUCTIONS', render: (v) => <SalaryCell value={v} revealed={revealed} revealing={revealing} /> },
    { key: 'net_salary',    label: 'NET',        render: (v) => <SalaryCell value={v} revealed={revealed} revealing={revealing} accent /> },
    { key: 'currency',      label: 'CCY'     },
  ]

  return (
    <div className="payroll animate-fade-up">
      <PageHeader
        badge="// PAYROLL MODULE"
        title="Confidential Payroll"
        subtitle="AES-256-GCM encrypted · Role-gated visibility · Priya AI validation"
        actions={
          canUpload && (
            <Button variant="primary" onClick={() => setUploadModal(true)}>
              <Plus size={13} /> UPLOAD BATCH
            </Button>
          )
        }
      />

      {/* Priya result — shown after upload */}
      {priyaResult && (
        <div className={`priya-result priya-result--${priyaResult.recommendation.toLowerCase()}`}>
          <div className="priya-result-header">
            <Sparkles size={12} />
            <span>PRIYA — Payroll Intelligence Agent</span>
            <span className={`priya-rec priya-rec--${priyaResult.recommendation.toLowerCase()}`}>
              {priyaResult.recommendation}
            </span>
          </div>
          <div className="priya-result-body">
            <p className="priya-summary">{priyaResult.summary}</p>
            {priyaResult.anomalies?.length > 0 && (
              <div className="priya-anomalies">
                {priyaResult.anomalies.map((a, i) => (
                  <div key={i} className="priya-anomaly">
                    <AlertTriangle size={10} /> {a}
                  </div>
                ))}
              </div>
            )}
            {priyaResult.total_gross > 0 && (
              <div className="priya-stats">
                <span>Rows: {priyaResult.row_count}</span>
                <span>Valid: {priyaResult.valid_rows}</span>
                <span>Gross Total: ${priyaResult.total_gross?.toLocaleString()}</span>
                {priyaResult.departments?.length > 0 && (
                  <span>Depts: {priyaResult.departments.join(', ')}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Table columns={batchCols} data={batches} emptyMessage="No payroll batches uploaded" />

      {selectedBatch && (
        <div className="records-panel">
          <div className="records-panel-header">
            <div>
              <div className="records-panel-title">{selectedBatch.name}</div>
              <div className="records-panel-meta">
                {selectedBatch.period_start} → {selectedBatch.period_end} · {records.length} records
              </div>
            </div>
            <div className="records-panel-actions">
              {canDecrypt && !revealed && (
                <Button variant="ghost" onClick={reveal} loading={revealing}>
                  <Eye size={13} /> REVEAL SALARIES
                </Button>
              )}
              {revealed && (
                <Button variant="danger" onClick={() => setRevealed(false)}>
                  <EyeOff size={13} /> REDACT
                </Button>
              )}
            </div>
          </div>
          <Table columns={recordCols} data={records} emptyMessage="No records in batch" />
        </div>
      )}

      <Modal open={uploadModal} onClose={() => { setUploadModal(false); setUploadModal(false)
fetchBatches()
toast.success('Payroll encrypted', `${newBatch.total_records} records secured with AES-256-GCM`)
 }} title="UPLOAD PAYROLL BATCH" width={440}>
        <div className="upload-form">
          <Input
            label="BATCH NAME"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="June 2026 Payroll"
          />
          <Input
            label="PERIOD START"
            type="date"
            value={form.period_start}
            onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))}
          />
          <Input
            label="PERIOD END"
            type="date"
            value={form.period_end}
            onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))}
          />
          <div
            className="csv-upload-area"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={20} className="csv-icon" />
            <span>Click to select CSV file</span>
            <span className="csv-hint">employee_id, employee_name, department, gross_salary, deductions, currency</span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={e => handleFileSelect(e.target.files[0])}
            />
          </div>
          {priyaRunning && (
            <div className="priya-running">
              <Sparkles size={11} />
              Priya AI is analyzing your CSV…
            </div>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={uploadBatch}
            loading={uploading}
            className="upload-submit"
          >
            ENCRYPT & UPLOAD
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function SalaryCell({ value, revealed, revealing, accent }) {
  if (typeof value === 'string' && (value.includes('█') || value.includes('•'))) {
    return <span className="redacted">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
  }
  if (revealing) {
    return (
      <span className="unredacting">
        {typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 2 }) : value}
      </span>
    )
  }
  if (revealed) {
    return (
      <span className={accent ? 'salary-accent' : 'salary-plain'}>
        {typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 2 }) : value}
      </span>
    )
  }
  return <span className="redacted">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
}