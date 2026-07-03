import { useState, useEffect } from 'react'
import { FileSpreadsheet, Vault, Vote, ClipboardList, AlertTriangle } from 'lucide-react'
import { getUser } from '../lib/auth'
import api from '../lib/api'
import PageHeader from '../components/PageHeader'
import { StatCard } from '../components/Card'
import Badge from '../components/Badge'
import MarketIntel from '../components/MarketIntel'
import CompanyStory from '../components/CompanyStory'
import './Dashboard.css'

export default function Dashboard() {
  const user = getUser()
  const [data, setData] = useState({ batches: [], requests: [], proposals: [], logs: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/payroll/batches').catch(() => ({ data: { batches: [] } })),
      api.get('/treasury/requests').catch(() => ({ data: { requests: [] } })),
      api.get('/governance/proposals').catch(() => ({ data: { proposals: [] } })),
      api.get('/audit/logs').catch(() => ({ data: { logs: [] } })),
    ]).then(([b, t, g, l]) => {
      setData({
        batches:   b.data.batches   || [],
        requests:  t.data.requests  || [],
        proposals: g.data.proposals || [],
        logs:      l.data.logs      || [],
      })
      setLoading(false)
    })
  }, [])

  const pendingTreasury = data.requests.filter(r => r.status === 'pending').length
  const activeProposals = data.proposals.filter(p => p.status === 'active').length

  return (
    <div className="dashboard animate-fade-up">
      <PageHeader
        badge="// COMMAND CENTER"
        title={`Good ${hour()} — ${user?.full_name?.split(' ')[0]}`}
        subtitle={`Clearance: ${user?.role?.toUpperCase()} · Session encrypted · AES-256-GCM`}
      />

      {/* SoSoValue market intelligence — visible to judges immediately */}
      <CompanyStory variant="dashboard" />
      <MarketIntel />

      <div className="stats-grid">
        <StatCard label="PAYROLL BATCHES"   value={data.batches.length}   sub="Encrypted at rest"            accent="amber" icon={FileSpreadsheet} />
        <StatCard label="TREASURY REQUESTS" value={data.requests.length}  sub={`${pendingTreasury} pending`} accent="green" icon={Vault} />
        <StatCard label="ACTIVE PROPOSALS"  value={activeProposals}       sub="Governance voting open"       accent="blue"  icon={Vote} />
        <StatCard label="AUDIT EVENTS"      value={data.logs.length}      sub="Immutable log"                accent="amber" icon={ClipboardList} />
      </div>

      <div className="dash-row">
        <div className="dash-col">
          <div className="section-header">
            <span className="section-label">// RECENT TREASURY</span>
          </div>
          {loading ? <Skeleton /> : (
            <div className="activity-list">
              {data.requests.slice(0, 5).map(r => (
                <div key={r.id} className="activity-item">
                  <div className="activity-left">
                    <Vault size={12} className="activity-icon" />
                    <div>
                      <div className="activity-title">{r.title}</div>
                      <div className="activity-meta">{r.currency} {Number(r.amount).toLocaleString()}</div>
                    </div>
                  </div>
                  <Badge label={r.status} />
                </div>
              ))}
              {data.requests.length === 0 && <EmptyRow msg="No treasury requests" />}
            </div>
          )}
        </div>

        <div className="dash-col">
          <div className="section-header">
            <span className="section-label">// AUDIT TRAIL</span>
          </div>
          {loading ? <Skeleton /> : (
            <div className="activity-list">
              {data.logs.slice(0, 5).map(l => (
                <div key={l.id} className="activity-item">
                  <div className="activity-left">
                    <AlertTriangle size={12} className="activity-icon" />
                    <div>
                      <div className="activity-title">{l.action}</div>
                      <div className="activity-meta">{l.actor_role} · {l.resource_type}</div>
                    </div>
                  </div>
                  <span className="activity-time">{fmtDate(l.occurred_at)}</span>
                </div>
              ))}
              {data.logs.length === 0 && <EmptyRow msg="No audit events" />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const hour = () => {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
}

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  : '—'

const Skeleton = () => (
  <div className="skeleton-list">
    {[1,2,3].map(i => <div key={i} className="skeleton-row" />)}
  </div>
)

const EmptyRow = ({ msg }) => <div className="activity-empty">{msg}</div>