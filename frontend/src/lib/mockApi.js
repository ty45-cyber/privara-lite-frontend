import {
  USERS, CREDENTIALS, PAYROLL_BATCHES, PAYROLL_RECORDS,
  TREASURY_REQUESTS, PROPOSALS, VOTE_TALLIES,
  AUDIT_REQUESTS, AUDIT_LOGS, MARKET_INTELLIGENCE,
} from './mockData.js'
import { getUser } from './auth.js'

// ── Mutable runtime state (survives page navigation, resets on reload) ───────
let _batches    = [...PAYROLL_BATCHES]
let _requests   = TREASURY_REQUESTS.map(r => ({ ...r }))
let _proposals  = PROPOSALS.map(p => ({ ...p }))
let _tallies    = JSON.parse(JSON.stringify(VOTE_TALLIES))
let _auditReqs  = AUDIT_REQUESTS.map(r => ({ ...r }))
let _auditLogs  = [...AUDIT_LOGS]
let _castVotes  = {}   // { "prop_id:user_id": true }
let _approvals  = {}   // { "treq_id:user_id": true }
let _txReceipts = {}   // { treq_id: receipt }

// ── Helpers ──────────────────────────────────────────────────────────────────

const delay = (ms = 420) => new Promise(r => setTimeout(r, ms))

const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })

const now = () => new Date().toISOString()

const err = (status, message) => {
  const e = new Error(message)
  e.response = { status, data: { error: 'API_ERROR', message } }
  throw e
}

const requireRoles = (...roles) => {
  const user = getUser()
  if (!user || !roles.includes(user.role)) err(403, 'Insufficient permissions')
  return user
}

const pushLog = (actor, action, resource_type, resource_id, metadata = null) => {
  _auditLogs.unshift({
    id:            `log_${uuid().slice(0, 8)}`,
    actor_id:      actor.user_id,
    actor_role:    actor.role,
    action,
    resource_type,
    resource_id,
    metadata:      metadata ? JSON.stringify(metadata) : null,
    occurred_at:   now(),
  })
}

// ── JWT helpers (no real signing — demo only) ─────────────────────────────

const buildToken = (user, isDemo = false) => {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const exp     = Math.floor(Date.now() / 1000) + (isDemo ? 7200 : 86400)
  const payload = btoa(JSON.stringify({
    sub:  user.id,
    role: user.role,
    name: user.full_name,
    demo: isDemo,
    exp,
  }))
  const sig = btoa('mock-signature')
  return `${header}.${payload}.${sig}`
}

// ── AUTH ─────────────────────────────────────────────────────────────────────

export const mockLogin = async (email, password) => {
  await delay(600)
  const cred = CREDENTIALS[email]
  if (!cred || cred.password !== password) err(401, 'Invalid credentials')
  const user = USERS.find(u => u.id === cred.user_id)
  if (!user) err(401, 'User not found')
  return {
    token:     buildToken(user),
    user_id:   user.id,
    role:      user.role,
    full_name: user.full_name,
  }
}

export const mockRegister = async ({ email, password, full_name, role }) => {
  await delay(700)
  if (CREDENTIALS[email]) err(409, 'Email already registered')
  const newUser = {
    id:        `usr_${uuid().slice(0, 8)}`,
    email, full_name, role,
  }
  USERS.push(newUser)
  CREDENTIALS[email] = { password, user_id: newUser.id }
  return { message: 'Registered', user_id: newUser.id }
}

export const mockDemoLogin = async (role) => {
  await delay(300)
  const user = USERS.find(u => u.id === `demo_${role}`)
  if (!user) err(400, `Invalid demo role: ${role}`)
  return {
    token:     buildToken(user, true),
    user_id:   user.id,
    role:      user.role,
    full_name: user.full_name,
  }
}

// ── PAYROLL ───────────────────────────────────────────────────────────────────

export const mockListBatches = async () => {
  await delay(380)
  return { batches: _batches }
}

export const mockGetBatch = async (id) => {
  await delay(520)
  const user = getUser()
  const records = PAYROLL_RECORDS[id] || []
  const canDecrypt = ['admin', 'hr', 'finance'].includes(user?.role)

  pushLog(user, 'payroll_batch_viewed', 'payroll', id, { role: user?.role })

  if (canDecrypt) {
    return {
      records: records.map(r => ({ ...r })),
      view: 'decrypted',
    }
  }
  // Masked view — employees and auditors
  return {
    records: records.map(r => ({
      ...r,
      gross_salary: '██████',
      deductions:   '██████',
      net_salary:   '██████',
    })),
    view: 'masked',
  }
}

export const mockUploadBatch = async (formData) => {
  await delay(1200)
  requireRoles('admin', 'hr')
  const user = getUser()
  const newBatch = {
    id:            `batch_${uuid().slice(0, 8)}`,
    name:          formData.get?.('name') || 'New Payroll Batch',
    period_start:  formData.get?.('period_start') || '2026-06-01',
    period_end:    formData.get?.('period_end')   || '2026-06-30',
    total_records: Math.floor(Math.random() * 10) + 5,
    status:        'encrypted',
    created_by:    user.user_id,
    created_at:    now(),
  }
  _batches.unshift(newBatch)
  pushLog(user, 'payroll_batch_uploaded', 'payroll', newBatch.id, {
    records: newBatch.total_records,
    encryption: 'AES-256-GCM',
  })
  return { batch: newBatch, message: 'Payroll encrypted and stored' }
}

export const mockAuditExport = async (batchId) => {
  await delay(800)
  requireRoles('admin', 'auditor')
  const user = getUser()
  const records = PAYROLL_RECORDS[batchId] || []
  let csv = 'employee_id,employee_name,department,gross_salary,deductions,net_salary,currency\n'
  records.forEach(r => {
    csv += `${r.employee_id},${r.employee_name},${r.department},${r.gross_salary},${r.deductions},${r.net_salary},${r.currency}\n`
  })
  pushLog(user, 'audit_export_downloaded', 'payroll', batchId, { records: records.length })
  return new Blob([csv], { type: 'text/csv' })
}

// ── TREASURY ──────────────────────────────────────────────────────────────────

export const mockListTreasury = async () => {
  await delay(360)
  return { requests: _requests }
}

export const mockListPendingTreasury = async () => {
  await delay(350)
  return { requests: _requests.filter(r => r.status === 'pending') }
}

export const mockCreateTreasury = async (body) => {
  await delay(650)
  const user = requireRoles('admin', 'finance')
  if (body.required_approvals < 1 || body.required_approvals > 5)
    err(422, 'required_approvals must be 1–5')
  const req = {
    id:                 `treq_${uuid().slice(0, 8)}`,
    title:              body.title,
    amount:             body.amount,
    currency:           body.currency || 'USD',
    purpose:            body.purpose,
    risk_level:         'pending',
    status:             'pending',
    required_approvals: body.required_approvals,
    current_approvals:  0,
    requested_by:       user.user_id,
    created_at:         now(),
    updated_at:         now(),
  }
  _requests.unshift(req)
  pushLog(user, 'treasury_request_created', 'treasury', req.id, {
    title: req.title, amount: req.amount, currency: req.currency,
  })
  return { request: req }
}

export const mockApproveTreasury = async (id, body) => {
  await delay(540)
  const user = requireRoles('admin', 'finance')
  const key  = `${id}:${user.user_id}`
  if (_approvals[key]) err(409, 'Already voted on this request')

  const req = _requests.find(r => r.id === id)
  if (!req) err(404, `Treasury request ${id} not found`)
  if (req.status !== 'pending') err(422, 'Request is not pending')

  _approvals[key] = true
  req.current_approvals += 1
  if (req.current_approvals >= req.required_approvals) {
    req.status = 'approved'
  }
  req.updated_at = now()

  pushLog(user, 'treasury_approved', 'treasury', id, {
    approver: user.full_name,
    note: body?.note || 'Approved',
    new_status: req.status,
  })
  return { request: req }
}

export const mockRejectTreasury = async (id, body) => {
  await delay(480)
  const user = requireRoles('admin', 'finance')
  const req  = _requests.find(r => r.id === id)
  if (!req) err(404, `Treasury request ${id} not found`)
  req.status     = 'rejected'
  req.updated_at = now()
  pushLog(user, 'treasury_request_rejected', 'treasury', id, {
    note: body?.note || 'Rejected',
  })
  return { request: req }
}

export const mockRiskScore = async (id) => {
  await delay(1100) // feels like a real API call
  const req = _requests.find(r => r.id === id)
  if (!req) err(404, `Treasury request ${id} not found`)

  // Deterministic risk based on amount + live market sentiment
  const amount = req.amount
  const sentimentScore = MARKET_INTELLIGENCE.sentiment_score
  const dailyInflow    = MARKET_INTELLIGENCE.btc_etf_daily_inflow_usd

  const sizePenalty   = amount > 200000 ? 25 : amount > 80000 ? 12 : 0
  const flowPenalty   = dailyInflow < 0 ? 20 : dailyInflow > 200_000_000 ? -10 : 0
  const sentPenalty   = Math.floor((100 - sentimentScore) / 3)
  const composite     = sizePenalty + flowPenalty + sentPenalty

  const riskScore     = composite >= 40 ? 'HIGH' : composite >= 20 ? 'MEDIUM' : 'LOW'
  const suggestion    =
    riskScore === 'HIGH'   ? 'Delay 48h — monitor ETF outflows and market conditions' :
    riskScore === 'MEDIUM' ? 'Proceed with full approval quorum — conditions mixed' :
                             'Proceed — institutional inflows and bullish signals favorable'

  return {
    risk: {
      request_id:             id,
      risk_score:             riskScore,
      market_volatility_pct:  Math.abs((dailyInflow / MARKET_INTELLIGENCE.btc_etf_total_assets_usd) * 100).toFixed(2),
      liquidity_depth:        MARKET_INTELLIGENCE.sodex_liquidity_tier,
      suggested_action:       suggestion,
      market_sentiment:       MARKET_INTELLIGENCE.sentiment_label,
    },
  }
}

export const mockExecuteOnChain = async (id, body) => {
  await delay(2200) // on-chain tx latency feel
  const user = requireRoles('admin', 'finance')
  const req  = _requests.find(r => r.id === id)
  if (!req)             err(404, `Treasury request ${id} not found`)
  if (req.status !== 'approved') err(422, 'Only approved requests can be executed on-chain')

  const txHash = '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)).join('')

  const receipt = {
    tx_hash:      txHash,
    network:      'SoDEX Testnet',
    explorer_url: `https://explorer.sodex.io/tx/${txHash}`,
    status:       'confirmed',
    block_number: 18_420_771 + Math.floor(Math.random() * 1000),
    gas_used:     21000,
    timestamp:    now(),
  }

  _txReceipts[id] = receipt
  req.status      = 'executed'
  req.updated_at  = now()

  pushLog(user, 'treasury_executed_onchain', 'treasury', id, {
    tx_hash: txHash, network: 'SoDEX Testnet',
    amount: req.amount, currency: req.currency,
  })

  return { receipt }
}

// ── GOVERNANCE ────────────────────────────────────────────────────────────────

export const mockListProposals = async () => {
  await delay(350)
  return { proposals: _proposals }
}

export const mockCreateProposal = async (body) => {
  await delay(580)
  const user = requireRoles('admin', 'finance')
  const proposal = {
    id:             `prop_${uuid().slice(0, 8)}`,
    title:          body.title,
    description:    body.description,
    status:         'active',
    created_by:     user.user_id,
    voting_ends_at: body.voting_ends_at,
    created_at:     now(),
  }
  _proposals.unshift(proposal)
  _tallies[proposal.id] = { yes_count: 0, no_count: 0, abstain_count: 0, total_votes: 0, outcome: 'pending' }
  pushLog(user, 'proposal_created', 'governance', proposal.id, { title: proposal.title })
  return { proposal }
}

export const mockCastVote = async (proposalId, body) => {
  await delay(680)
  const user = getUser()
  if (!['yes', 'no', 'abstain'].includes(body.vote))
    err(422, 'Vote must be yes, no, or abstain')

  const key = `${proposalId}:${user.user_id}`
  if (_castVotes[key]) err(409, 'Already voted on this proposal')

  const proposal = _proposals.find(p => p.id === proposalId)
  if (!proposal)              err(404, `Proposal ${proposalId} not found`)
  if (proposal.status !== 'active') err(422, 'Proposal is not accepting votes')

  _castVotes[key] = true
  const tally = _tallies[proposalId] || { yes_count: 0, no_count: 0, abstain_count: 0, total_votes: 0 }
  tally[`${body.vote}_count`] += 1
  tally.total_votes += 1
  _tallies[proposalId] = tally

  pushLog(user, 'vote_cast', 'governance', proposalId, { encrypted: true })
  return { message: 'Vote cast. Your ballot is encrypted.' }
}

export const mockGetResults = async (proposalId) => {
  await delay(750)
  requireRoles('admin')
  const tally = _tallies[proposalId]
  if (!tally) err(404, `Proposal ${proposalId} not found`)

  const outcome = tally.yes_count > tally.no_count ? 'passed'
    : tally.no_count > tally.yes_count ? 'rejected' : 'tied'

  pushLog(getUser(), 'proposal_tallied', 'governance', proposalId, {
    yes: tally.yes_count, no: tally.no_count, abstain: tally.abstain_count, outcome,
  })

  return { results: { proposal_id: proposalId, ...tally, outcome } }
}

// ── AUDIT ─────────────────────────────────────────────────────────────────────

export const mockListAuditRequests = async () => {
  await delay(360)
  requireRoles('admin', 'auditor')
  return { requests: _auditReqs }
}

export const mockSubmitAuditRequest = async (body) => {
  await delay(520)
  const user = requireRoles('auditor')
  const auditorName = USERS.find(u => u.id === user.user_id)?.full_name || 'Auditor'
  const req = {
    id:            `areq_${uuid().slice(0, 8)}`,
    auditor_id:    user.user_id,
    auditor_name:  auditorName,
    resource_type: body.resource_type,
    resource_id:   body.resource_id,
    reason:        body.reason,
    status:        'pending',
    created_at:    now(),
  }
  _auditReqs.unshift(req)
  pushLog(user, 'audit_access_requested', 'audit', req.id, { resource: body.resource_id })
  return { request: req }
}

export const mockDecideAuditRequest = async (id, body) => {
  await delay(480)
  const user = requireRoles('admin')
  const req  = _auditReqs.find(r => r.id === id)
  if (!req) err(404, `Audit request ${id} not found`)
  if (!['granted', 'denied'].includes(body.decision))
    err(422, 'Decision must be granted or denied')
  req.status = body.decision
  pushLog(user, `audit_access_${body.decision}`, 'audit', id, {
    granted_to: req.auditor_id,
    resource:   req.resource_id,
  })
  return { request: req }
}

export const mockListAuditLogs = async () => {
  await delay(420)
  requireRoles('admin', 'auditor')
  return { logs: _auditLogs.slice(0, 100) }
}

export const mockAuditPdf = async (resourceType, resourceId) => {
  await delay(900)
  requireRoles('admin', 'auditor')
  const user = getUser()
  const ts   = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const relevantLogs = _auditLogs.filter(
    l => l.resource_type === resourceType && l.resource_id === resourceId
  )
  const lines = [
    `PRIVARA LITE — CONFIDENTIAL AUDIT REPORT`,
    `Meridian Capital Partners Ltd`,
    `Generated: ${ts}`,
    `Generated By: ${user.full_name} (${user.role})`,
    `Resource: ${resourceType.toUpperCase()} / ${resourceId}`,
    `Total Events: ${relevantLogs.length}`,
    '',
    'AUDIT EVENT LOG',
    '────────────────────────────────────────────────────',
    ...relevantLogs.map(l =>
      `${new Date(l.occurred_at).toLocaleString()} | ${l.actor_role.padEnd(10)} | ${l.action}`
    ),
    '',
    'END OF REPORT — Powered by Privara Lite',
    'SoSoValue × Akindo Buildathon 2026',
  ]
  pushLog(user, 'audit_pdf_downloaded', resourceType, resourceId, {
    file: `privara-audit-${resourceType}-${resourceId}.pdf`,
  })
  return new Blob([lines.join('\n')], { type: 'application/pdf' })
}

// ── MARKET INTELLIGENCE ───────────────────────────────────────────────────────

export const mockMarketIntelligence = async () => {
  await delay(800) // simulates real API call latency
  // Add ±5% jitter to make it feel live
  const jitter = () => 1 + (Math.random() - 0.5) * 0.05
  return {
    intelligence: {
      ...MARKET_INTELLIGENCE,
      btc_etf_daily_inflow_usd:  Math.round(MARKET_INTELLIGENCE.btc_etf_daily_inflow_usd * jitter()),
      btc_price_usd:             Math.round(MARKET_INTELLIGENCE.btc_price_usd * jitter()),
      btc_24h_change_pct:        parseFloat((MARKET_INTELLIGENCE.btc_24h_change_pct * jitter()).toFixed(2)),
      sodex_volume_24h:          Math.round(MARKET_INTELLIGENCE.sodex_volume_24h * jitter()),
      sentiment_score:           Math.min(100, Math.max(0,
        MARKET_INTELLIGENCE.sentiment_score + Math.floor((Math.random() - 0.5) * 6)
      )),
    },
  }
}

export const mockEtfSummary = async () => {
  await delay(600)
  const intel = (await mockMarketIntelligence()).intelligence
  return {
    daily_inflow:    intel.btc_etf_daily_inflow_usd,
    total_assets:    intel.btc_etf_total_assets_usd,
    cum_inflow:      intel.btc_etf_cum_inflow_usd,
    inflow_signal:   intel.inflow_signal,
    btc_price:       intel.btc_price_usd,
    btc_change_pct:  intel.btc_24h_change_pct,
    sentiment:       intel.sentiment_label,
    sentiment_score: intel.sentiment_score,
    top_tags:        intel.top_news_tags,
    sodex_tvl:       intel.sodex_tvl_usd,
    data_sources:    intel.data_sources,
    powered_by:      intel.powered_by,
  }
}

export const mockBriefing = async (body) => {
  await delay(2400) // Claude API feel
  const intel = MARKET_INTELLIGENCE
  const amount = body.treasury_amount
  const risk   = amount > 200000 ? 'HIGH' : amount > 80000 ? 'MEDIUM' : 'LOW'
  const rec    = risk === 'HIGH' ? 'DELAY' : risk === 'MEDIUM' ? 'APPROVE' : 'APPROVE'

  return {
    briefing: {
      headline: `${intel.sentiment_label} market conditions with ${intel.inflow_signal.toLowerCase()} ETF flows ${risk === 'LOW' ? 'support' : 'warrant caution on'} this treasury request.`,
      etf_signal: `BTC Spot ETF recorded $${(intel.btc_etf_daily_inflow_usd / 1e6).toFixed(0)}M net inflow today, signalling institutional risk-on positioning.`,
      sentiment_signal: `SoSoValue AI news sentiment at ${intel.sentiment_score}/100 (${intel.sentiment_label}) driven by ${intel.top_news_tags.slice(0, 2).join(' + ')} signals.`,
      recommendation: rec,
      confidence: risk === 'LOW' ? 'HIGH' : 'MEDIUM',
      risk_note: `Primary watch: ${amount > 200000 ? 'Large position size relative to operating reserve. Ensure quorum.' : 'Monitor ETF flows for next 24h before final sign-off.'}`,
    },
    market_snapshot: {
      btc_price:     intel.btc_price_usd,
      inflow_signal: intel.inflow_signal,
      sentiment:     intel.sentiment_label,
      data_sources:  intel.data_sources,
    },
  }
}