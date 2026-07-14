import { useState, useEffect } from 'react'
import { BookOpen, ExternalLink, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../lib/api'
import './SocatisReports.css'

export default function SocatisReports({ tags, compact = false }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    api.post('/ssv/socatis/reports', { tags })
      .then(r => { setReports(r.data.reports || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [JSON.stringify(tags)])

  if (loading)          return <div className="sc-loading">Loading Socatis AI research…</div>
  if (!reports.length)  return null

  return (
    <div className="sc-panel">
      <div className="sc-header">
        <div className="sc-header-left">
          <BookOpen size={12} className="sc-icon" />
          <span className="sc-label">SOCATIS AI RESEARCH</span>
          <span className="sc-badge">{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
        </div>

        <a
          href="https://sosovalue.com/research"
          target="_blank"
          rel="noreferrer"
          className="sc-source"
        >
          SoSoValue Research <ExternalLink size={9} />
        </a>
      </div>

      <div className="sc-reports">
        {reports.map(report => (
          <div key={report.id} className="sc-report">
            <div
              className="sc-report-header"
              onClick={() => setExpanded(e => ({ ...e, [report.id]: !e[report.id] }))}
            >
              <div className="sc-report-left">
                <span className="sc-report-relevance">{report.relevance_score}% relevant</span>
                <span className="sc-report-title">{report.title}</span>
                <div className="sc-report-meta">
                  <span>{report.author}</span>
                  <span>·</span>
                  <span>{new Date(report.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <div className="sc-report-tags">
                    {report.tags?.slice(0,3).map(t => (
                      <span key={t} className="sc-tag">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button className="sc-toggle">
                {expanded[report.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            {expanded[report.id] && (
              <div className="sc-report-body">
                <p className="sc-report-summary">{report.summary}</p>

                <a
                  href={report.ssv_url}
                  target="_blank"
                  rel="noreferrer"
                  className="sc-report-link"
                >
                  Read full report on SoSoValue <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sc-footer">
        <Zap size={9} />
        Research by Socatis AI — SoSoValue's proprietary AI research engine
      </div>
    </div>
  )
}