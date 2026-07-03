import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, BarChart2 } from 'lucide-react'
import { getUser } from '../lib/auth'
import api from '../lib/api'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Input, { Textarea } from '../components/Input'
import './Governance.css'

export default function Governance() {
  const user = getUser()
  const canCreate = ['admin','finance'].includes(user?.role)
  const canTally  = user?.role === 'admin'

  const [proposals, setProposals] = useState([])
  const [createModal, setCreateModal] = useState(false)
  const [resultsModal, setResultsModal] = useState(false)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [voting, setVoting] = useState({})
  const [form, setForm] = useState({ title: '', description: '', voting_ends_at: '' })

  const fetchProposals = () =>
    api.get('/governance/proposals').then(r => setProposals(r.data.proposals || []))

  useEffect(() => { fetchProposals() }, [])

  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const highlightProposal = searchParams.get('proposal')
    const action = searchParams.get('action')
    if (!highlightProposal || proposals.length === 0) return

    if (action === 'tally') {
      viewResults(highlightProposal)
    }
    searchParams.delete('proposal')
    searchParams.delete('action')
    setSearchParams(searchParams, { replace: true })
  }, [proposals, searchParams])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const createProposal = async () => {
    setLoading(true)
    try {
      await api.post('/governance/proposals', form)
      setCreateModal(false)
      fetchProposals()
      setForm({ title: '', description: '', voting_ends_at: '' })
    } catch (e) {
      alert(e.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  const castVote = async (proposalId, vote) => {
    setVoting(v => ({ ...v, [proposalId]: true }))
    try {
      await api.post(`/governance/proposals/${proposalId}/vote`, { vote })
      alert(`Vote "${vote}" cast. Your ballot is encrypted.`)
    } catch (e) {
      alert(e.response?.data?.message || 'Already voted')
    } finally {
      setVoting(v => ({ ...v, [proposalId]: false }))
    }
  }

  const viewResults = async (id) => {
    setResults(null)
    setResultsModal(true)
    try {
      const { data } = await api.get(`/governance/proposals/${id}/results`)
      setResults(data.results)
    } catch (e) {
      setResults({ error: e.response?.data?.message || 'Unauthorized' })
    }
  }

  return (
    <div className="governance animate-fade-up">
      <PageHeader
        badge="// GOVERNANCE MODULE"
        title="Private Voting"
        subtitle="Encrypted ballots · Anonymous tally · Admin-only reveal"
        actions={
          canCreate && (
            <Button variant="primary" onClick={() => setCreateModal(true)}>
              <Plus size={13} /> NEW PROPOSAL
            </Button>
          )
        }
      />

      <div className="proposals-grid">
        {proposals.length === 0 && (
          <div className="proposals-empty">No proposals created yet</div>
        )}
        {proposals.map((p) => (
          <div key={p.id} className="proposal-card">
            <div className="proposal-card-header">
              <Badge label={p.status} />
              <span className="proposal-ends">Ends {fmtDate(p.voting_ends_at)}</span>
            </div>
            <div className="proposal-title">{p.title}</div>
            <div className="proposal-desc">{p.description}</div>
            <div className="proposal-actions">
              {p.status === 'active' && (
                <>
                  <Button variant="success" size="sm" onClick={() => castVote(p.id, 'yes')} loading={voting[p.id]}>
                    YES
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => castVote(p.id, 'abstain')} loading={voting[p.id]}>
                    ABSTAIN
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => castVote(p.id, 'no')} loading={voting[p.id]}>
                    NO
                  </Button>
                </>
              )}
              {canTally && (
                <Button variant="ghost" size="sm" onClick={() => viewResults(p.id)}>
                  <BarChart2 size={11} /> TALLY
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="CREATE GOVERNANCE PROPOSAL">
        <div className="gov-form">
          <Input label="TITLE" value={form.title} onChange={set('title')} placeholder="Approve treasury expansion…" />
          <Textarea label="DESCRIPTION" value={form.description} onChange={set('description')} placeholder="Detailed context for voters…" />
          <Input label="VOTING ENDS AT" type="datetime-local" value={form.voting_ends_at} onChange={set('voting_ends_at')} />
          <Button variant="primary" size="lg" onClick={createProposal} loading={loading} className="gov-submit">
            PUBLISH PROPOSAL
          </Button>
        </div>
      </Modal>

      <Modal open={resultsModal} onClose={() => setResultsModal(false)} title="DECRYPTED VOTE TALLY" width={400}>
        {!results ? (
          <div className="tally-loading">Decrypting ballots…</div>
        ) : results.error ? (
          <div className="tally-error">{results.error}</div>
        ) : (
          <div className="tally-panel">
            <div className="tally-bars">
              <TallyBar label="YES" count={results.yes_count} total={results.total_votes} color="green" />
              <TallyBar label="NO" count={results.no_count} total={results.total_votes} color="red" />
              <TallyBar label="ABSTAIN" count={results.abstain_count} total={results.total_votes} color="amber" />
            </div>
            <div className="tally-outcome">
              <span className="tally-outcome-label">OUTCOME</span>
              <Badge label={results.outcome} />
            </div>
            <div className="tally-total">{results.total_votes} encrypted ballots tallied</div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function TallyBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="tally-bar">
      <div className="tally-bar-top">
        <span className="tally-bar-label">{label}</span>
        <span className="tally-bar-count">{count} ({pct}%)</span>
      </div>
      <div className="tally-bar-track">
        <div
          className={`tally-bar-fill tally-bar-fill--${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'