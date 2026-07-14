import { useState } from 'react'
import { FileText, Loader, Download } from 'lucide-react'
import api from '../lib/api'
import './AuditReportButton.css'

export default function AuditReportButton({
  resourceType = null,
  resourceId   = null,
  label        = 'EXPORT PDF',
  full         = false,
}) {
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const url  = full
        ? '/audit/reports/full/pdf'
        : `/audit/reports/${resourceType}/${resourceId}/pdf`
      const resp = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([resp.data], { type: 'application/pdf' })
      const href = URL.createObjectURL(blob)
      const ts   = new Date().toISOString().slice(0, 10)
      const name = full
        ? `privara-full-audit-${ts}.pdf`
        : `privara-${resourceType}-${resourceId?.slice(0, 8)}-audit.pdf`
      const a = document.createElement('a')
      a.href = href; a.download = name; a.click()
      URL.revokeObjectURL(href)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } catch (e) {
      console.error('PDF generation failed:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className={`audit-report-btn ${done ? 'audit-report-btn--done' : ''}`}
      onClick={generate}
      disabled={loading}
    >
      {loading
        ? <Loader size={12} className="audit-report-spin" />
        : done
          ? <Download size={12} />
          : <FileText size={12} />
      }
      {loading ? 'GENERATING…' : done ? 'DOWNLOADED' : label}
    </button>
  )
}