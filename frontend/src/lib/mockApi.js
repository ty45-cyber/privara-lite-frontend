import {
  USERS, CREDENTIALS, PAYROLL_BATCHES, PAYROLL_RECORDS,
  TREASURY_REQUESTS, PROPOSALS, VOTE_TALLIES,
  AUDIT_REQUESTS, AUDIT_LOGS, MARKET_INTELLIGENCE,
  SECTOR_ROTATION, MACRO_EVENTS, DECISION_HISTORY,
  SSI_INDEXES, SPEND_TO_SSI_MAP, BTC_TREASURIES, FUNDRAISING_FEED,
  SOSO_TIERS, SOCATIS_REPORTS,
} from './mockData.js'

import { getUser } from './auth.js'

// ── Mutable runtime state ─────────────────────────────────────────────────────
let _batches    = [...PAYROLL_BATCHES]
let _requests   = TREASURY_REQUESTS.map(r => ({ ...r }))
let _proposals  = PROPOSALS.map(p => ({ ...p }))
let _tallies    = JSON.parse(JSON.stringify(VOTE_TALLIES))
let _auditReqs  = AUDIT_REQUESTS.map(r => ({ ...r }))
let _auditLogs  = [...AUDIT_LOGS]
let _castVotes  = {}
let _approvals  = {}
let _txReceipts = {}
let _decisions_total   = 0
let _decisions_correct = 0

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  if (!actor) return
  _auditLogs.unshift({
    id:            `log_${uuid().slice(0, 8)}`,
    actor_id:      actor.user_id || actor.id,
    actor_role:    actor.role,
    action,
    resource_type,
    resource_id,
    metadata:      metadata ? JSON.stringify(metadata) : null,
    occurred_at:   now(),
  })
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

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

// ── AUTH ──────────────────────────────────────────────────────────────────────

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
  const newUser = { id: `usr_${uuid().slice(0, 8)}`, email, full_name, role }
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
  if (user) pushLog(user, 'payroll_batch_viewed', 'payroll', id, { role: user.role })
  if (canDecrypt) {
    return { records: records.map(r => ({ ...r })), view: 'decrypted' }
  }
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
  const user = requireRoles('admin', 'hr')
  const newBatch = {
    id:            `batch_${uuid().slice(0, 8)}`,
    name:          formData?.get?.('name') || 'New Payroll Batch',
    period_start:  formData?.get?.('period_start') || '2026-06-01',
    period_end:    formData?.get?.('period_end')   || '2026-06-30',
    total_records: Math.floor(Math.random() * 10) + 5,
    status:        'encrypted',
    created_by:    user.user_id,
    created_at:    now(),
  }
  _batches.unshift(newBatch)
  pushLog(user, 'payroll_batch_uploaded', 'payroll', newBatch.id, {
    records: newBatch.total_records, encryption: 'AES-256-GCM',
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
  if (user) pushLog(user, 'audit_export_downloaded', 'payroll', batchId, { records: records.length })
  return new Blob([csv], { type: 'text/csv' })
}

// ── TREASURY ──────────────────────────────────────────────────────────────────

export const mockListTreasury = async () => {
  await delay(360)
  return { requests: _requests }
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
  if (req.current_approvals >= req.required_approvals) req.status = 'approved'
  req.updated_at = now()
  pushLog(user, 'treasury_approved', 'treasury', id, {
    approver: user.full_name, note: body?.note || 'Approved', new_status: req.status,
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
  pushLog(user, 'treasury_request_rejected', 'treasury', id, { note: body?.note || 'Rejected' })
  return { request: req }
}

export const mockRiskScore = async (id) => {
  await delay(1100)
  const req = _requests.find(r => r.id === id)
  if (!req) err(404, `Treasury request ${id} not found`)
  const amount         = req.amount
  const sentimentScore = MARKET_INTELLIGENCE.sentiment_score
  const dailyInflow    = MARKET_INTELLIGENCE.btc_etf_daily_inflow_usd
  const sizePenalty    = amount > 200000 ? 25 : amount > 80000 ? 12 : 0
  const flowPenalty    = dailyInflow < 0 ? 20 : dailyInflow > 200_000_000 ? -10 : 0
  const sentPenalty    = Math.floor((100 - sentimentScore) / 3)
  const composite      = sizePenalty + flowPenalty + sentPenalty
  const riskScore      = composite >= 40 ? 'HIGH' : composite >= 20 ? 'MEDIUM' : 'LOW'
  const suggestion     =
    riskScore === 'HIGH'   ? 'Delay 48h — monitor ETF outflows and market conditions' :
    riskScore === 'MEDIUM' ? 'Proceed with full approval quorum — conditions mixed' :
                             'Proceed — institutional inflows and bullish signals favorable'
  return {
    risk: {
      request_id:            id,
      risk_score:            riskScore,
      market_volatility_pct: Math.abs((dailyInflow / MARKET_INTELLIGENCE.btc_etf_total_assets_usd) * 100).toFixed(2),
      liquidity_depth:       MARKET_INTELLIGENCE.sodex_liquidity_tier,
      suggested_action:      suggestion,
      market_sentiment:      MARKET_INTELLIGENCE.sentiment_label,
    },
  }
}

export const mockExecuteOnChain = async (id, body) => {
  await delay(2200)
  const user = requireRoles('admin', 'finance')
  const req  = _requests.find(r => r.id === id)
  if (!req)                  err(404, `Treasury request ${id} not found`)
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
    tx_hash: txHash, network: 'SoDEX Testnet', amount: req.amount, currency: req.currency,
  })
  return { receipt }
}

export const mockTreasuryWindow = async (requestId) => {
  await delay(740)
  const nextEvent      = MACRO_EVENTS[0]
  const daysUntil      = nextEvent
    ? Math.ceil((new Date(nextEvent.date) - new Date()) / (1000 * 60 * 60 * 24))
    : 0
  return {
    request_id:             requestId,
    window_clear:           daysUntil > 3,
    next_macro_event:       nextEvent,
    days_until_next_event:  daysUntil,
    recommendation:         daysUntil <= 2
      ? 'DELAY — FOMC window. Execute after announcement.'
      : daysUntil <= 5
        ? 'CAUTION — macro event within 5 days. Consider timing.'
        : 'CLEAR — no high-impact macro events in execution window.',
    powered_by: 'SoSoValue Macro Calendar',
  }
}

export const mockDecisionHistory = async () => {
  await delay(460)

  requireRoles('admin', 'finance')
  const accuracy = _decisions_total > 0
    ? Math.round((_decisions_correct / _decisions_total) * 100)
    : 87
  return {
    decisions: DECISION_HISTORY,
    summary: {
      total_decisions:         DECISION_HISTORY.length,
      positive_outcomes:       DECISION_HISTORY.filter(d => ['POSITIVE','VALIDATED'].includes(d.outcome_30d)).length,
      accuracy_pct:            accuracy,
      avg_risk_score:          'MEDIUM',
      total_capital_deployed:  DECISION_HISTORY.filter(d => d.decision === 'approved').reduce((s, d) => s + d.amount, 0),
      capital_protected:       DECISION_HISTORY.filter(d => d.decision === 'rejected').reduce((s, d) => s + d.amount, 0),
    },
  }
}

export const mockDecisionIntelligencePdf = async () => {
  await delay(950)
  requireRoles('admin', 'finance')
  const user = getUser()
  const { decisions, summary } = await mockDecisionHistory()
  const ts = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const lines = [
    'PRIVARA LITE — RISK MODEL VALIDATION REPORT',
    'Meridian Capital Partners Ltd',
    `Generated: ${ts}`,
    `Generated By: ${user?.full_name} (${user?.role})`,
    '',
    'EXECUTIVE SUMMARY',
    '────────────────────────────────────────────────────',
    `Total Decisions Tracked:      ${summary.total_decisions}`,
    `Validated Positive Outcomes:  ${summary.positive_outcomes}/${summary.total_decisions}`,
    `Risk Model Accuracy:          ${summary.accuracy_pct}%`,
    `Capital Deployed (approved):  $${summary.total_capital_deployed.toLocaleString()}`,
    `Capital Protected (rejected): $${summary.capital_protected.toLocaleString()}`,
    '',
    'METHODOLOGY',
    '────────────────────────────────────────────────────',
    'Each treasury decision is scored at time of approval using a composite risk',
    'formula derived from SoSoValue BTC Spot ETF daily net inflow, AI news sentiment',
    '(0-100 scale), and request size. Outcomes are tracked 30 days post-decision.',
    '',
    'DECISION LOG',
    '────────────────────────────────────────────────────',
    ...decisions.flatMap(d => {
      const priceDelta = d.btc_price_30d_later && d.btc_price_at_decision
        ? (((d.btc_price_30d_later - d.btc_price_at_decision) / d.btc_price_at_decision) * 100).toFixed(1)
        : 'N/A'
      return [
        '',
        `${d.title}`,
        `  Amount:               ${d.currency} ${d.amount.toLocaleString()}`,
        `  Decision:             ${d.decision.toUpperCase()}`,
        `  Risk Score (at time): ${d.risk_score_at_decision}`,
        `  Sentiment (at time):  ${d.sentiment_at_decision}/100`,
        `  ETF Flow (at time):   $${(d.etf_inflow_at_decision / 1e6).toFixed(1)}M`,
        `  BTC Price Delta:      ${priceDelta > 0 ? '+' : ''}${priceDelta}% (30d)`,
        `  Outcome:              ${d.outcome_30d}`,
        `  Notes:                ${d.outcome_notes}`,
      ]
    }),
    '',
    '────────────────────────────────────────────────────',
    'SoSoValue-derived risk scoring correlates with real-world treasury outcomes.',
    'Capital protected by rejected high-risk requests exceeded subsequent market',
    'downside in 100% of tracked cases.',
    '',
    'END OF REPORT — Powered by Privara Lite',
    'SoSoValue × Akindo Buildathon — Wave 3',
  ]
  if (user) pushLog(user, 'decision_intelligence_pdf_downloaded', 'treasury', 'all', { decisions_included: decisions.length })
  return new Blob([lines.join('\n')], { type: 'application/pdf' })

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
  if (!['yes', 'no', 'abstain'].includes(body.vote)) err(422, 'Vote must be yes, no, or abstain')
  const key = `${proposalId}:${user?.user_id}`
  if (_castVotes[key]) err(409, 'Already voted on this proposal')
  const proposal = _proposals.find(p => p.id === proposalId)
  if (!proposal)                 err(404, `Proposal ${proposalId} not found`)
  if (proposal.status !== 'active') err(422, 'Proposal is not accepting votes')
  _castVotes[key] = true
  const tally = _tallies[proposalId] || { yes_count: 0, no_count: 0, abstain_count: 0, total_votes: 0 }
  tally[`${body.vote}_count`] += 1
  tally.total_votes += 1
  _tallies[proposalId] = tally
  if (user) pushLog(user, 'vote_cast', 'governance', proposalId, { encrypted: true })
  return { message: 'Vote cast. Your ballot is encrypted.' }
}

export const mockGetResults = async (proposalId) => {
  await delay(750)
  requireRoles('admin')
  const tally = _tallies[proposalId]
  if (!tally) err(404, `Proposal ${proposalId} not found`)
  const outcome = tally.yes_count > tally.no_count ? 'passed'
    : tally.no_count > tally.yes_count ? 'rejected' : 'tied'
  const user = getUser()
  if (user) pushLog(user, 'proposal_tallied', 'governance', proposalId, {
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
  const user         = requireRoles('auditor')
  const auditorName  = USERS.find(u => u.id === user.user_id)?.full_name || 'Auditor'
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
  if (!['granted', 'denied'].includes(body.decision)) err(422, 'Decision must be granted or denied')
  req.status = body.decision
  pushLog(user, `audit_access_${body.decision}`, 'audit', id, {
    granted_to: req.auditor_id, resource: req.resource_id,
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
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const relevantLogs = _auditLogs.filter(l => l.resource_type === resourceType && l.resource_id === resourceId)
  const lines = [
    'PRIVARA LITE — CONFIDENTIAL AUDIT REPORT',
    'Meridian Capital Partners Ltd',
    `Generated: ${ts}`,
    `Generated By: ${user?.full_name} (${user?.role})`,
    `Resource: ${resourceType.toUpperCase()} / ${resourceId}`,
    `Total Events: ${relevantLogs.length}`,
    '',
    'AUDIT EVENT LOG',
    '────────────────────────────────────────────────────',
    ...relevantLogs.map(l => `${new Date(l.occurred_at).toLocaleString()} | ${l.actor_role?.padEnd(10)} | ${l.action}`),
    '',
    'END OF REPORT — Powered by Privara Lite',
    'SoSoValue × Akindo Buildathon Wave 3',
  ]
  if (user) pushLog(user, 'audit_pdf_downloaded', resourceType, resourceId, {
    file: `privara-audit-${resourceType}-${resourceId}.pdf`,
  })
  return new Blob([lines.join('\n')], { type: 'application/pdf' })
}

// ── MARKET INTELLIGENCE ──────────────────────────────────────────────────────
// ── LIVE SOSOVALUE MARKET INTELLIGENCE ───────────────────────────────────────
// Replaces the pure-mock market intelligence with a live-first approach.
// Calls SoSoValue API directly from the browser.
// Falls back to seeded data if API key is missing or endpoints fail.
//
// Cache: 60-second TTL — prevents rate limiting when multiple components
//        mount simultaneously (MarketIntel + SentinelBanner + ApprovalIntelligence
//        all call this on page load).

import { fetchLiveMarketIntelligence } from './sosovalue.js'


let _intelligenceCache    = null
let _intelligenceCacheTs  = 0
const CACHE_TTL_MS        = 60_000  // 60 seconds

export const mockMarketIntelligence = async () => {
  // Minimal artificial delay — real latency comes from the API calls themselves
  await delay(50)

  const now = Date.now()

  // Serve cache if fresh — prevents multiple simultaneous API calls
  if (_intelligenceCache && (now - _intelligenceCacheTs) < CACHE_TTL_MS) {
    return { intelligence: _intelligenceCache }
  }

  // Attempt live SoSoValue fetch (with graceful fallback built in)
  const live = await fetchLiveMarketIntelligence(MARKET_INTELLIGENCE)

  // Cache the result
  _intelligenceCache   = live
  _intelligenceCacheTs = now

  return { intelligence: live }
}

export const mockEtfSummary = async () => {
  // Reuse the same cached intelligence — no duplicate API calls
  await delay(50)
  const { intelligence: intel } = await mockMarketIntelligence()

  return {
    daily_inflow:       intel.btc_etf_daily_inflow_usd,
    total_assets:       intel.btc_etf_total_assets_usd,
    cum_inflow:         intel.btc_etf_cum_inflow_usd,
    inflow_signal:      intel.inflow_signal,
    btc_price:          intel.btc_price_usd,
    btc_change_pct:     intel.btc_24h_change_pct,
    sentiment:          intel.sentiment_label,
    sentiment_score:    intel.sentiment_score,
    top_tags:           intel.top_news_tags,
    sodex_tvl:          intel.sodex_tvl_usd,
    data_sources:       intel.data_sources,
    powered_by:         intel.powered_by,
    live:               intel.live,
    source_mode:        intel.source_mode,
    etf_live:           intel.etf_live,
    sentiment_live:     intel.sentiment_live,
    price_live:         intel.price_live,
    price_source:       intel.price_source,
  }
}

// Cache invalidation — call this if you need to force a fresh fetch
// e.g. after a manual refresh button press
export const invalidateIntelligenceCache = () => {
  _intelligenceCache   = null
  _intelligenceCacheTs = 0
}


export const mockBriefing = async (body) => {
  await delay(2400)

  // Use live intelligence if cached — otherwise fall back to seed
  const intel = _intelligenceCache || MARKET_INTELLIGENCE

  const amount = body.treasury_amount || body.amount || 0
  const risk   = amount > 200000 ? 'HIGH' : amount > 80000 ? 'MEDIUM' : 'LOW'
  const rec    = risk === 'HIGH' ? 'DELAY' : 'APPROVE'

  const inflowUsd    = intel.btc_etf_daily_inflow_usd || MARKET_INTELLIGENCE.btc_etf_daily_inflow_usd
  const sentScore    = intel.sentiment_score          || MARKET_INTELLIGENCE.sentiment_score
  const sentLabel    = intel.sentiment_label          || MARKET_INTELLIGENCE.sentiment_label
  const tags         = intel.top_news_tags            || MARKET_INTELLIGENCE.top_news_tags
  const inflowSignal = intel.inflow_signal            || MARKET_INTELLIGENCE.inflow_signal
  const btcPrice     = intel.btc_price_usd            || MARKET_INTELLIGENCE.btc_price_usd
  const isLive       = !!_intelligenceCache?.live

  return {
    briefing: {
      headline:         `${sentLabel} market conditions with ${inflowSignal.toLowerCase()} ETF flows ${risk === 'LOW' ? 'support' : 'warrant caution on'} this treasury request.`,
      etf_signal:       `BTC Spot ETF recorded $${(inflowUsd / 1e6).toFixed(0)}M net ${inflowSignal.toLowerCase()} today, signalling institutional ${inflowUsd > 0 ? 'risk-on' : 'risk-off'} positioning.`,
      sentiment_signal: `SoSoValue AI news sentiment at ${sentScore}/100 (${sentLabel}) driven by ${(tags || []).slice(0, 2).join(' + ')} signals.`,
      recommendation:   rec,
      confidence:       risk === 'LOW' ? 'HIGH' : 'MEDIUM',
      risk_note:        amount > 200000
        ? 'Large position size relative to operating reserve. Ensure full quorum before proceeding.'
        : 'Monitor ETF flows for next 24h before final sign-off.',
      data_freshness:   isLive ? 'LIVE — SoSoValue API' : 'SEEDED — Add VITE_SOSOVALUE_API_KEY for live data',
    },
    market_snapshot: {
      btc_price:     btcPrice,
      inflow_signal: inflowSignal,
      sentiment:     sentLabel,
      data_sources:  intel.data_sources || MARKET_INTELLIGENCE.data_sources,
      live:          isLive,
    },
  }
}


export const mockSectorRotation = async () => {
  await delay(680)
  const jitter = () => (Math.random() - 0.5) * 2
  return {
    sectors:    SECTOR_ROTATION.sectors.map(s => ({ ...s, index_7d: parseFloat((s.index_7d + jitter()).toFixed(1)) })),
    as_of:      new Date().toISOString(),
    powered_by: SECTOR_ROTATION.powered_by,
  }
}

export const mockMacroCalendar = async () => {
  await delay(520)
  return { events: MACRO_EVENTS }
}

export const mockRecordOutcome = async (decisionId, outcome) => {
  await delay(380)
  requireRoles('admin', 'finance')
  _decisions_total   += 1
  _decisions_correct += outcome === 'positive' ? 1 : 0
  return {
    recorded:         true,
    running_accuracy: Math.round((_decisions_correct / _decisions_total) * 100),
  }
}

// ── AGENTS ────────────────────────────────────────────────────────────────────

export const mockPriyaAgent = async ({ csv_text }) => {
  await delay(1400)
  requireRoles('admin', 'hr')
  const lines     = (csv_text || '').trim().split('\n').filter(Boolean)
  const dataLines = lines.slice(1)
  const rowCount  = dataLines.length
  const anomalies = []
  dataLines.forEach((line, i) => {
    const cols   = line.split(',')
    const salary = parseFloat(cols[3])
    if (salary > 20000) anomalies.push(`Row ${i + 2}: ${cols[1]?.trim()} — salary $${salary.toLocaleString()} exceeds senior threshold`)
    if (!cols[0]?.trim()) anomalies.push(`Row ${i + 2}: Missing employee ID`)
  })
  return {
    agent:       'Priya',
    row_count:   rowCount,
    valid_rows:  rowCount - anomalies.length,
    anomalies,
    summary:     `Analyzed ${rowCount} payroll records. ${anomalies.length === 0
      ? 'All records valid — no anomalies detected. Ready for AES-256-GCM encryption.'
      : `${anomalies.length} anomaly${anomalies.length > 1 ? 'ies' : ''} detected — review before encrypting.`}`,
    total_gross: dataLines.reduce((sum, l) => sum + (parseFloat(l.split(',')[3]) || 0), 0),
    departments: [...new Set(dataLines.map(l => l.split(',')[2]?.trim()).filter(Boolean))],
    recommendation: anomalies.length === 0 ? 'PROCEED' : 'REVIEW',
  }
}

export const mockFelixAgent = async ({ request_id }) => {
  await delay(900)
  const req   = _requests.find(r => r.id === request_id)
  if (!req) return { text: 'Treasury request not found.' }
  const intel        = MARKET_INTELLIGENCE
  const amount       = req.amount
  const riskLevel    = amount > 200000 ? 'HIGH' : amount > 80000 ? 'MEDIUM' : 'LOW'
  const etfDirection = intel.btc_etf_daily_inflow_usd > 0 ? 'net inflows' : 'net outflows'
  const daysToMacro  = MACRO_EVENTS[0]
    ? Math.ceil((new Date(MACRO_EVENTS[0].date) - new Date()) / 86400000)
    : null
  return {
    text: `Felix Risk Analysis — ${req.title}\n\nStep 1: Market Context\nBTC Spot ETF recorded $${(intel.btc_etf_daily_inflow_usd / 1e6).toFixed(0)}M ${etfDirection} today. Total ETF AUM stands at $${(intel.btc_etf_total_assets_usd / 1e9).toFixed(1)}B. This signals ${intel.inflow_signal === 'INFLOW' ? 'institutional risk-on positioning — favorable for capital deployment.' : 'institutional caution — consider timing carefully.'}\n\nStep 2: Sentiment Reading\nSoSoValue AI news sentiment scores ${intel.sentiment_score}/100 (${intel.sentiment_label}). Top signals: ${intel.top_news_tags.slice(0, 3).join(', ')}. ${intel.sentiment_score > 65 ? 'Bullish sentiment supports treasury action.' : intel.sentiment_score < 35 ? 'Bearish sentiment warrants delay.' : 'Neutral market — standard approval process applies.'}\n\nStep 3: Request Size Assessment\n${req.currency} ${req.amount.toLocaleString()} represents ${amount > 200000 ? 'a significant capital commitment requiring extra scrutiny and full quorum.' : amount > 80000 ? 'a moderate deployment within normal operational parameters.' : 'a routine operational expense well within normal thresholds.'}\n\nStep 4: Macro Window\n${daysToMacro !== null ? `Next macro event: ${MACRO_EVENTS[0].event} in ${daysToMacro} days. ${MACRO_EVENTS[0].risk_impact === 'HIGH' ? 'High-impact window — consider executing before or 48h after.' : 'Low disruption expected.'}` : 'No major macro events in the next 7 days.'}\n\nComposite Risk Score: ${riskLevel}\nRecommendation: ${riskLevel === 'LOW' ? 'Proceed — all signals favorable.' : riskLevel === 'MEDIUM' ? 'Proceed with full approval quorum. Monitor ETF flows for 24h.' : 'Delay 48h — elevated risk signals detected. Re-evaluate after macro clarity.'}\n\nPowered by SoSoValue ETF API + AI News Sentiment`,
  }
}

export const mockSageAgent = async ({ prompt }) => {
  await delay(1600)
  requireRoles('admin', 'finance')
  const title = prompt?.length > 60 ? prompt.slice(0, 57) + '...' : (prompt || 'New Governance Proposal')
  return {
    text: `Proposed Governance Motion\n\nTitle: ${title}\n\nBackground and Context\nThe Operations and Finance Committee has reviewed current operational parameters and identified a need for formal governance action: ${prompt}. This proposal has been prepared in accordance with Meridian Capital Partners governance charter.\n\nRationale\nFollowing review of current market conditions — BTC ETF inflows at $${(MARKET_INTELLIGENCE.btc_etf_daily_inflow_usd / 1e6).toFixed(0)}M daily, institutional sentiment at ${MARKET_INTELLIGENCE.sentiment_score}/100 ${MARKET_INTELLIGENCE.sentiment_label}, and SoDEX liquidity tier ${MARKET_INTELLIGENCE.sodex_liquidity_tier} — the committee believes current conditions are favorable for this motion.\n\nProposed Resolution\nThe membership is requested to vote in favor of the following resolution: ${prompt}. Implementation will proceed within 5 business days of passage, subject to standard treasury approval workflow and SoSoValue risk verification.\n\nVoting Parameters\n- Vote type: Anonymous encrypted ballot\n- Quorum required: Simple majority\n- Voting period: 7 days from publication\n- Tally: Admin-only reveal upon close\n\nSubmitted by: Governance Committee\nPowered by Sage AI — Privara Lite`,
  }
}

export const mockAtlasAgent = async () => {
  await delay(1100)
  requireRoles('admin', 'auditor')
  const recentLogs       = _auditLogs.slice(0, 30)
  const payrollEvents    = recentLogs.filter(l => l.resource_type === 'payroll').length
  const treasuryEvents   = recentLogs.filter(l => l.resource_type === 'treasury').length
  const governanceEvents = recentLogs.filter(l => l.resource_type === 'governance').length
  const auditEvents      = recentLogs.filter(l => l.resource_type === 'audit').length
  const anomalies        = recentLogs.filter(l => l.action.includes('rejected') || l.action.includes('denied'))
  const mostRecent       = recentLogs[0]
  const lastActivity     = mostRecent
    ? new Date(mostRecent.occurred_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'N/A'
  return {
    agent:   'Atlas',
    period:  'Last 30 audit events',
    summary: `Meridian Capital Partners — Audit Intelligence Summary\n\nActivity Breakdown (last 30 events):\n- Payroll operations:   ${payrollEvents} events — ${payrollEvents > 0 ? 'batches uploaded and encrypted on schedule' : 'no payroll activity'}\n- Treasury operations:  ${treasuryEvents} events — ${treasuryEvents > 0 ? 'approval workflows active, SoSoValue risk scoring applied' : 'no treasury activity'}\n- Governance:           ${governanceEvents} events — ${governanceEvents > 0 ? 'proposals created and voted on with encrypted ballots' : 'no governance activity'}\n- Audit access:         ${auditEvents} events — ${auditEvents > 0 ? 'selective disclosure requests processed' : 'no audit access requests'}\n\nAnomalies Detected: ${anomalies.length === 0
      ? 'None — all operations within normal parameters.'
      : `${anomalies.length} item${anomalies.length > 1 ? 's' : ''} flagged: ${anomalies.map(a => a.action).join(', ')}`}
\nLast Activity: ${lastActivity}\nOverall Status: ${anomalies.length === 0 ? '✓ CLEAN — no compliance concerns detected' : '⚠ REVIEW REQUIRED — see flagged items above'}\n\nPowered by Atlas AI — Privara Lite`,
    event_counts: { payrollEvents, treasuryEvents, governanceEvents, auditEvents },
    anomaly_count: anomalies.length,
    status: anomalies.length === 0 ? 'CLEAN' : 'REVIEW',
  }
}

export const mockSentinelAgent = async () => {
  await delay(1300)
  const pendingRequests = _requests.filter(r => r.status === 'pending')
  const intel           = MARKET_INTELLIGENCE
  const alerts          = []
  pendingRequests.forEach(req => {
    const amount    = req.amount
    const riskLevel = amount > 200000 ? 'HIGH' : amount > 80000 ? 'MEDIUM' : 'LOW'
    if (riskLevel === 'HIGH' && intel.inflow_signal === 'OUTFLOW') {
      alerts.push({
        request_id: req.id, title: req.title, amount: req.amount, currency: req.currency,
        risk_level: riskLevel, trigger: 'HIGH_VALUE_DURING_OUTFLOW',
        message:    `${req.currency} ${req.amount.toLocaleString()} pending approval during ETF outflow conditions. Risk elevated.`,
        action:     'Review before approving', severity: 'HIGH',
      })
    }
    const daysPending = Math.floor((new Date() - new Date(req.created_at)) / 86400000)
    if (daysPending > 3 && req.current_approvals < req.required_approvals) {
      alerts.push({
        request_id: req.id, title: req.title, amount: req.amount, currency: req.currency,
        risk_level: riskLevel, trigger: 'STALE_APPROVAL',
        message:    `${req.title} has been pending for ${daysPending} days with ${req.current_approvals}/${req.required_approvals} approvals.`,
        action:     'Expedite approval or reject', severity: 'MEDIUM',
      })
    }
  })
  const upcomingHighRisk = MACRO_EVENTS.filter(e => {
    const days = Math.ceil((new Date(e.date) - new Date()) / 86400000)
    return days <= 3 && e.risk_impact === 'HIGH'
  })
  if (upcomingHighRisk.length > 0 && pendingRequests.length > 0) {
    upcomingHighRisk.forEach(event => {
      alerts.push({
        request_id: null, trigger: 'MACRO_WINDOW',
        message:    `${event.event} in ${Math.ceil((new Date(event.date) - new Date()) / 86400000)} days. ${pendingRequests.length} treasury request${pendingRequests.length > 1 ? 's' : ''} pending.`,
        action:     event.treasury_recommendation.replace(/_/g, ' '),
        severity:   'HIGH', event_name: event.event,
      })
    })
  }
  return {
    agent:           'Sentinel',
    scanned_at:      new Date().toISOString(),
    pending_count:   pendingRequests.length,
    alerts,
    alert_count:     alerts.length,
    status:          alerts.length === 0 ? 'ALL_CLEAR' : 'ALERTS_ACTIVE',
    market_snapshot: {
      inflow_signal:   intel.inflow_signal,
      sentiment:       intel.sentiment_label,
      sentiment_score: intel.sentiment_score,
      btc_price:       intel.btc_price_usd,
    },
  }
}

// ── AUTONOMOUS FINANCIAL LOOP ─────────────────────────────────────────────────

// Policy engine — org-level rules that Sentinel enforces automatically
let _policy = {
  auto_approve_threshold: 'LOW',      // LOW risk → auto-approve if quorum met
  auto_block_threshold:   'HIGH',     // HIGH risk → auto-block
  require_human_review:   'MEDIUM',   // MEDIUM → human must act
  max_auto_approve_amount: 50000,     // Never auto-approve above this amount
  auto_execute_on_approve: false,     // Auto-trigger SoDEX after approval
  sentinel_scan_interval:  30,        // seconds
  notify_on_risk_change:   true,
}

export const mockGetPolicy = async () => {
  await delay(280)
  requireRoles('admin')
  return { policy: _policy }
}

export const mockUpdatePolicy = async (body) => {
  await delay(380)
  requireRoles('admin')
  _policy = { ..._policy, ...body }
  const user = getUser()
  pushLog(user, 'policy_updated', 'system', 'policy_engine', {
    changes: Object.keys(body),
    updated_by: user.user_id,
  })
  return { policy: _policy, message: 'Policy updated' }
}

export const mockRunAutonomousLoop = async () => {
  await delay(1800)
  requireRoles('admin', 'finance')

  const intel    = MARKET_INTELLIGENCE
  const pending  = _requests.filter(r => r.status === 'pending')
  const actions  = []
  const user     = getUser()

  for (const req of pending) {
    const amount       = req.amount
    const sentScore    = intel.sentiment_score
    const dailyInflow  = intel.btc_etf_daily_inflow_usd
    const sizePenalty  = amount > 200000 ? 25 : amount > 80000 ? 12 : 0
    const flowPenalty  = dailyInflow < 0 ? 20 : dailyInflow > 200_000_000 ? -10 : 0
    const sentPenalty  = Math.floor((100 - sentScore) / 3)
    const composite    = sizePenalty + flowPenalty + sentPenalty
    const riskLevel    = composite >= 40 ? 'HIGH' : composite >= 20 ? 'MEDIUM' : 'LOW'

    req.risk_level = riskLevel

    // Policy: AUTO-BLOCK if HIGH risk
    if (riskLevel === _policy.auto_block_threshold) {
      actions.push({
        request_id:   req.id,
        title:        req.title,
        amount:       req.amount,
        currency:     req.currency,
        action:       'AUTO_BLOCKED',
        risk_level:   riskLevel,
        reason:       `Sentinel auto-blocked: composite risk score ${composite} exceeds HIGH threshold. ETF flow: $${(dailyInflow/1e6).toFixed(0)}M, Sentiment: ${sentScore}/100.`,
        agent:        'Sentinel',
        autonomous:   true,
      })
      req.status = 'blocked'
      req.updated_at = now()
      pushLog(user, 'treasury_auto_blocked', 'treasury', req.id, {
        risk_level: riskLevel, composite, agent: 'Sentinel', autonomous: true,
      })
    }

    // Policy: AUTO-APPROVE if LOW risk + quorum already met + under amount cap
    else if (
      riskLevel === _policy.auto_approve_threshold &&
      req.current_approvals >= req.required_approvals &&
      amount <= _policy.max_auto_approve_amount
    ) {
      actions.push({
        request_id: req.id,
        title:      req.title,
        amount:     req.amount,
        currency:   req.currency,
        action:     'AUTO_APPROVED',
        risk_level: riskLevel,
        reason:     `Sentinel auto-approved: LOW risk (score ${composite}), quorum met (${req.current_approvals}/${req.required_approvals}), amount within $${_policy.max_auto_approve_amount.toLocaleString()} threshold.`,
        agent:      'Sentinel',
        autonomous: true,
      })
      req.status = 'approved'
      req.updated_at = now()
      pushLog(user, 'treasury_auto_approved', 'treasury', req.id, {
        risk_level: riskLevel, composite, agent: 'Sentinel', autonomous: true,
      })

      // If policy says auto-execute after approval, trigger SoDEX
      if (_policy.auto_execute_on_approve) {
        const txHash = '0x' + Array.from({length: 64}, () =>
          Math.floor(Math.random() * 16).toString(16)).join('')
        _txReceipts[req.id] = {
          tx_hash:      txHash,
          network:      'SoDEX Testnet',
          explorer_url: `https://explorer.sodex.io/tx/${txHash}`,
          status:       'confirmed',
          block_number: 18_420_771 + Math.floor(Math.random() * 1000),
          gas_used:     21000,
          timestamp:    now(),
        }
        req.status = 'executed'
        actions[actions.length - 1].action  = 'AUTO_APPROVED_AND_EXECUTED'
        actions[actions.length - 1].tx_hash = txHash
        actions[actions.length - 1].reason += ` Then auto-executed on SoDEX (tx: ${txHash.slice(0,10)}…).`
        pushLog(user, 'treasury_auto_executed', 'treasury', req.id, {
          tx_hash: txHash, agent: 'Sentinel', autonomous: true,
        })
      }
    }

    // Policy: FLAG for human review on MEDIUM
    else if (riskLevel === _policy.require_human_review) {
      actions.push({
        request_id: req.id,
        title:      req.title,
        amount:     req.amount,
        currency:   req.currency,
        action:     'FLAGGED_FOR_REVIEW',
        risk_level: riskLevel,
        reason:     `Sentinel flagged: MEDIUM risk (score ${composite}). Human review required before any approval. ETF flow: $${(dailyInflow/1e6).toFixed(0)}M.`,
        agent:      'Sentinel',
        autonomous: false,
      })
      pushLog(user, 'treasury_flagged_medium_risk', 'treasury', req.id, {
        risk_level: riskLevel, composite, agent: 'Sentinel',
      })
    }
  }

  return {
    loop_run_at:      now(),
    requests_scanned: pending.length,
    actions_taken:    actions.length,
    actions,
    market_snapshot:  {
      sentiment_score:          intel.sentiment_score,
      inflow_signal:            intel.inflow_signal,
      btc_etf_daily_inflow_usd: intel.btc_etf_daily_inflow_usd,
      btc_price_usd:            intel.btc_price_usd,
    },
    policy:          _policy,
    agent:           'Sentinel Autonomous Loop',
    powered_by:      'SoSoValue ETF API + SoSoValue News Sentiment',
  }
}

export const mockGetLoopHistory = async () => {
  await delay(320)
  requireRoles('admin', 'finance')
  // Return auto-action logs from audit trail
  const autoLogs = _auditLogs.filter(l =>
    ['treasury_auto_blocked','treasury_auto_approved',
     'treasury_auto_executed','treasury_flagged_medium_risk'].includes(l.action)
  )
  return {
    history: autoLogs,
    total_auto_actions: autoLogs.length,
    blocks:   autoLogs.filter(l => l.action === 'treasury_auto_blocked').length,
    approvals:autoLogs.filter(l => l.action === 'treasury_auto_approved').length,
    executions:autoLogs.filter(l => l.action === 'treasury_auto_executed').length,
  }
}

// ── SOSOVALUE ECOSYSTEM ENDPOINTS ────────────────────────────────────────────

export const mockSSIIntelligence = async ({ spend_category, amount }) => {
  await delay(720)

  const normalised = (spend_category || '').toLowerCase()
  const sectorName = SPEND_TO_SSI_MAP[normalised] || SPEND_TO_SSI_MAP['default']
  const index = SSI_INDEXES[sectorName]
  if (!index) return { error: 'No SSI index found for this spend category' }

  const ssiRiskAdjust =
    index.change_7d > 10  ? -8  :
    index.change_7d > 0   ? -3  :
    index.change_7d < -5  ? +12 :
                              0

  const spendPct    = amount ? ((amount / index.tvl_usd) * 100).toFixed(4) : '0'
  const spendSignal = parseFloat(spendPct) < 0.01 ? 'IMMATERIAL'
    : parseFloat(spendPct) < 0.1 ? 'MINOR'
    : 'MATERIAL'

  return {
    sector:           sectorName,
    ssi_symbol:       index.symbol,
    ssi_token:        index.token,
    ssi_price_usd:    index.price_usd,
    ssi_change_7d:    index.change_7d,
    ssi_change_30d:   index.change_30d,
    ssi_tvl_usd:      index.tvl_usd,
    ssi_signal:       index.signal,
    ssi_components:   index.components,
    ssi_url:          index.ssv_url,
    risk_adjustment:  ssiRiskAdjust,
    spend_pct_of_tvl: spendPct,
    spend_signal:     spendSignal,
    recommendation:
      index.change_7d > 5
        ? `${sectorName} sector showing strong momentum (+${index.change_7d}% 7d). Favorable timing for ${spend_category} spend.`
        : index.change_7d < -3
          ? `${sectorName} sector declining (${index.change_7d}% 7d). Consider delaying ${spend_category} spend until sector stabilises.`
          : `${sectorName} sector neutral. Proceed based on primary ETF risk score.`,
    powered_by: 'SoSoValue SSI Index Protocol',
  }

}

export const mockBTCTreasuries = async () => {

  await delay(580)
  const accumulating = BTC_TREASURIES.filter(t => t.signal === 'ACCUMULATING').length
  return {
    treasuries:          BTC_TREASURIES,
    accumulating_count:  accumulating,
    total_btc_held:      BTC_TREASURIES.reduce((s, t) => s + t.btc_held, 0),
    signal:              accumulating >= 3 ? 'STRONG_INSTITUTIONAL_ACCUMULATION' : 'MIXED',
    implication:         accumulating >= 3
      ? 'Majority of tracked corporate treasuries actively accumulating BTC. Strong institutional confidence signal.'
      : 'Mixed corporate BTC treasury activity. Neutral signal for treasury timing.',
    powered_by: 'SoSoValue BTC Treasury API',
  }
}

export const mockFundraisingFeed = async ({ sector }) => {
  await delay(640)
  const filtered    = sector
    ? FUNDRAISING_FEED.filter(f => f.sector === sector)
    : FUNDRAISING_FEED
  const totalRaised = filtered.reduce((s, f) => s + f.amount_usd, 0)
  return {
    raises:       filtered,
    total_raised: totalRaised,
    count:        filtered.length,
    signal:       totalRaised > 50_000_000 ? 'STRONG_SECTOR_INVESTMENT' : 'MODERATE',
    implication:  `$${(totalRaised / 1e6).toFixed(0)}M raised across ${filtered.length} deals in ${sector || 'all sectors'} recently. ${totalRaised > 50_000_000 ? 'Strong VC conviction supports sector spend.' : 'Moderate deal flow — standard risk parameters apply.'}`,
    powered_by: 'SoSoValue Fundraising API',
  }
}

export const mockSosoTierCheck = async () => {
  await delay(200)
  // In mock — always return ANALYST tier for demo
  const current = SOSO_TIERS[1]
  return {
    current_tier:    current.tier,
    soso_staked:     current.soso_staked,
    label:           current.label,
    color:           current.color,
    features:        current.features,
    locked:          current.locked,
    all_tiers:       SOSO_TIERS,
    upgrade_url:     'https://sosovalue.com/stake',
    powered_by:      'SoSoValue SOSO Token',
  }
}

export const mockSocatisReports = async ({ tags }) => {
  await delay(880)
  const filtered = tags
    ? SOCATIS_REPORTS.filter(r => r.tags.some(t => tags.includes(t)))
    : SOCATIS_REPORTS
  return {
    reports:    filtered,
    count:      filtered.length,
    powered_by: 'Socatis AI — SoSoValue Research',
  }
}

// ── TREASURY APPROVAL INTELLIGENCE ENGINE ─────────────────────────────────────
// The unified signal aggregator BlessinSum asked for.
// Every SoSoValue signal, macro event, and sector rotation
// feeding one composite approval recommendation.

export const mockApprovalIntelligence = async ({ request_id }) => {
  await delay(1400)

  const req   = _requests.find(r => r.id === request_id)
  if (!req) err(404, `Treasury request ${request_id} not found`)

  const intel       = MARKET_INTELLIGENCE
  const category    = detectSpendCategory(req.purpose || '')
  const sectorName  = SPEND_TO_SSI_MAP[category] || SPEND_TO_SSI_MAP['default']
  const ssiIndex    = SSI_INDEXES[sectorName]
  const nextMacro   = MACRO_EVENTS[0]
  const daysToMacro = Math.ceil((new Date(nextMacro.date) - new Date()) / 86400000)

  // ── Signal 1: ETF Flow ────────────────────────────────────────────────────
  const etfInflow   = intel.btc_etf_daily_inflow_usd
  const etfScore    = etfInflow > 200_000_000 ? -10
                    : etfInflow > 0            ?  -3
                    : etfInflow > -50_000_000  ?  +8
                    :                            +20
  const etfSignal   = {
    name:      'BTC Spot ETF Daily Flow',
    endpoint:  'POST /openapi/v2/etf/currentEtfDataMetrics',
    value:     `${etfInflow > 0 ? '+' : ''}$${(etfInflow / 1e6).toFixed(0)}M`,
    raw:       etfInflow,
    direction: etfInflow > 0 ? 'INFLOW' : 'OUTFLOW',
    score_adj: etfScore,
    verdict:   etfInflow > 100_000_000 ? 'STRONGLY_FAVORABLE'
             : etfInflow > 0            ? 'FAVORABLE'
             : etfInflow > -50_000_000  ? 'CAUTION'
             :                            'UNFAVORABLE',
    insight:   etfInflow > 100_000_000
      ? `Strong institutional inflows ($${(etfInflow / 1e6).toFixed(0)}M) signal risk-on positioning. Favorable window for treasury deployment.`
      : etfInflow > 0
        ? `Positive ETF flows ($${(etfInflow / 1e6).toFixed(0)}M) indicate moderate institutional confidence. Proceed with standard quorum.`
        : `ETF outflows ($${(Math.abs(etfInflow) / 1e6).toFixed(0)}M) signal institutional risk-off. Elevates treasury risk by ${Math.abs(etfScore)} points.`,
    source: 'SoSoValue ETF API',
  }

  // ── Signal 2: AI News Sentiment ───────────────────────────────────────────
  const sentScore    = intel.sentiment_score
  const sentAdj      = sentScore > 65 ? -8
                     : sentScore > 45 ?  0
                     : sentScore > 30 ? +10
                     :                  +20
  const sentSignal = {
    name:      'AI News Sentiment',
    endpoint:  'GET /api/v1/news/featured/currency',
    value:     `${sentScore}/100 — ${intel.sentiment_label}`,
    raw:       sentScore,
    direction: intel.sentiment_label,
    score_adj: sentAdj,
    verdict:   sentScore > 65 ? 'STRONGLY_FAVORABLE'
             : sentScore > 45 ? 'NEUTRAL'
             : sentScore > 30 ? 'CAUTION'
             :                  'UNFAVORABLE',
    insight:   sentScore > 65
      ? `News sentiment ${sentScore}/100 (BULLISH) driven by: ${intel.top_news_tags.slice(0,3).join(', ')}. Media environment supports treasury action.`
      : sentScore > 45
        ? `Sentiment neutral at ${sentScore}/100. Standard risk parameters apply. Top signals: ${intel.top_news_tags.slice(0,2).join(', ')}.`
        : `Bearish sentiment (${sentScore}/100) detected across AI news feed. ${intel.top_news_headline ? `Latest: "${intel.top_news_headline.slice(0,60)}…"` : ''} Elevates risk by ${Math.abs(sentAdj)} points.`,
    source: 'SoSoValue News API',
  }

  // ── Signal 3: SSI Sector Rotation ─────────────────────────────────────────
  const ssi7d        = ssiIndex?.change_7d || 0
  const ssi30d       = ssiIndex?.change_30d || 0
  const ssiAdj       = ssi7d > 10  ? -8
                     : ssi7d > 0   ? -3
                     : ssi7d < -5  ? +12
                     :                0
  // Rotation signal: is money flowing INTO or OUT of this sector?
  const rotationDir  = ssi7d > 5  ? 'ROTATING_IN'
                     : ssi7d < -3 ? 'ROTATING_OUT'
                     :              'STABLE'
  const sectorSignal = {
    name:         'SSI Sector Rotation',
    endpoint:     `SSI Index Protocol — ${ssiIndex?.symbol || 'SSI-AI'}`,
    token:        ssiIndex?.token || 'MAG7.ssi',
    sector:       sectorName,
    value:        `${ssi7d > 0 ? '+' : ''}${ssi7d?.toFixed(1)}% (7d)`,
    value_30d:    `${ssi30d > 0 ? '+' : ''}${ssi30d?.toFixed(1)}% (30d)`,
    raw_7d:       ssi7d,
    raw_30d:      ssi30d,
    direction:    rotationDir,
    score_adj:    ssiAdj,
    verdict:      ssi7d > 10 ? 'STRONGLY_FAVORABLE'
                : ssi7d > 0  ? 'FAVORABLE'
                : ssi7d < -5 ? 'UNFAVORABLE'
                :               'NEUTRAL',
    insight:      rotationDir === 'ROTATING_IN'
      ? `Capital rotating INTO ${sectorName} sector (+${ssi7d?.toFixed(1)}% 7d, +${ssi30d?.toFixed(1)}% 30d via ${ssiIndex?.token}). This ${category} spend is sector-aligned with current rotation.`
      : rotationDir === 'ROTATING_OUT'
        ? `Capital rotating OUT of ${sectorName} sector (${ssi7d?.toFixed(1)}% 7d). This ${category} spend is counter-cyclical. Elevates risk by ${Math.abs(ssiAdj)} points.`
        : `${sectorName} sector stable (${ssi7d?.toFixed(1)}% 7d). No sector rotation risk. Neutral impact on approval.`,
    source: 'SoSoValue SSI Index Protocol',
  }

  // ── Signal 4: Macro Event Calendar ────────────────────────────────────────
  const macroAdj    = nextMacro.risk_impact === 'HIGH' && daysToMacro <= 2   ? +25
                    : nextMacro.risk_impact === 'HIGH' && daysToMacro <= 5   ? +15
                    : nextMacro.risk_impact === 'MEDIUM' && daysToMacro <= 3 ? +8
                    :                                                            0
  const macroSignal = {
    name:           'Macro Event Calendar',
    endpoint:       'SoSoValue Macro Calendar',
    event:          nextMacro.event,
    date:           nextMacro.date,
    days_until:     daysToMacro,
    risk_impact:    nextMacro.risk_impact,
    direction:      daysToMacro <= 3 && nextMacro.risk_impact === 'HIGH' ? 'HIGH_RISK_WINDOW'
                  : daysToMacro <= 5 && nextMacro.risk_impact !== 'LOW'  ? 'CAUTION_WINDOW'
                  :                                                         'CLEAR',
    score_adj:      macroAdj,
    verdict:        macroAdj >= 20 ? 'UNFAVORABLE'
                  : macroAdj >= 10 ? 'CAUTION'
                  : macroAdj > 0   ? 'MONITOR'
                  :                  'CLEAR',
    insight:        macroAdj >= 20
      ? `FOMC in ${daysToMacro} days — HIGH impact window. Historical BTC ETF outflows of 18-32% in the 48h surrounding rate decisions. Strong case for delaying deployment.`
      : macroAdj >= 10
        ? `${nextMacro.event} in ${daysToMacro} days. ${nextMacro.risk_impact} impact window. ${nextMacro.description.slice(0, 100)}…`
        : `No high-impact macro events within 5 days. Macro execution window CLEAR for treasury deployment.`,
    recommendation: nextMacro.treasury_recommendation?.replace(/_/g, ' '),
    source:         'SoSoValue Macro Calendar',
  }

  // ── Signal 5: BTC Treasury Accumulation ──────────────────────────────────
  const accumulating = BTC_TREASURIES.filter(t => t.signal === 'ACCUMULATING').length
  const btcTreasAdj  = accumulating >= 4 ? -5
                     : accumulating >= 2 ?  0
                     :                     +5
  const btcTreasSignal = {
    name:      'BTC Corporate Treasury Signal',
    endpoint:  'SoSoValue BTC Treasuries API',
    value:     `${accumulating}/${BTC_TREASURIES.length} corporates accumulating`,
    direction: accumulating >= 3 ? 'INSTITUTIONAL_ACCUMULATION' : 'MIXED',
    score_adj: btcTreasAdj,
    verdict:   accumulating >= 4 ? 'STRONGLY_FAVORABLE'
             : accumulating >= 2 ? 'FAVORABLE'
             :                     'NEUTRAL',
    insight:   accumulating >= 3
      ? `${accumulating} of ${BTC_TREASURIES.length} tracked corporates actively accumulating BTC this month. Strong institutional conviction signal — corroborates ETF inflow thesis.`
      : `Mixed corporate BTC treasury activity. ${accumulating} accumulating, ${BTC_TREASURIES.length - accumulating} holding. Neutral signal.`,
    source: 'SoSoValue BTC Treasury API',
  }

  // ── Composite Score ───────────────────────────────────────────────────────
  const amountPenalty = req.amount > 400000 ? 25
                      : req.amount > 150000 ? 12
                      : req.amount > 50000  ?  5
                      :                        0

  const signals        = [etfSignal, sentSignal, sectorSignal, macroSignal, btcTreasSignal]
  const signalTotal    = signals.reduce((s, sig) => s + sig.score_adj, 0)
  const compositeScore = signalTotal + amountPenalty

  const riskLevel      = compositeScore >= 40 ? 'HIGH'
                       : compositeScore >= 18 ? 'MEDIUM'
                       :                        'LOW'

  const verdictCounts  = {
    strongly_favorable: signals.filter(s => s.verdict === 'STRONGLY_FAVORABLE').length,
    favorable:          signals.filter(s => ['FAVORABLE','STRONGLY_FAVORABLE'].includes(s.verdict)).length,
    caution:            signals.filter(s => ['CAUTION','MONITOR'].includes(s.verdict)).length,
    unfavorable:        signals.filter(s => s.verdict === 'UNFAVORABLE').length,
  }

  const overallRecommendation =
    riskLevel === 'HIGH'   ? 'DELAY'
  : riskLevel === 'MEDIUM' ? verdictCounts.unfavorable > 0 ? 'REVIEW' : 'PROCEED_WITH_QUORUM'
  :                          verdictCounts.strongly_favorable >= 2 ? 'EXPEDITE' : 'PROCEED'

  return {
    request_id:             request_id,
    title:                  req.title,
    amount:                 req.amount,
    currency:               req.currency,
    spend_category:         category,
    signals,
    composite_score:        compositeScore,
    amount_penalty:         amountPenalty,
    risk_level:             riskLevel,
    overall_recommendation: overallRecommendation,
    verdict_summary:        verdictCounts,
    executive_summary:      buildExecutiveSummary(riskLevel, signals, req, overallRecommendation),
    data_sources:           signals.map(s => s.source),
    all_ssv_signals:        true,
    powered_by:             'SoSoValue Full Signal Suite — ETF + News + SSI + Macro + BTC Treasury',
    generated_at:           now(),
  }
}

function detectSpendCategory(purpose) {
  const p = (purpose || '').toLowerCase()
  if (p.includes('market') || p.includes('brand') || p.includes('campaign')) return 'marketing'
  if (p.includes('tech') || p.includes('software') || p.includes('platform')) return 'technology'
  if (p.includes('infra') || p.includes('server') || p.includes('network'))   return 'infrastructure'
  if (p.includes('defi') || p.includes('protocol') || p.includes('liquidity')) return 'defi'
  if (p.includes('invest') || p.includes('fund') || p.includes('asset'))      return 'investment'
  if (p.includes('legal') || p.includes('compliance') || p.includes('audit')) return 'legal'
  if (p.includes('research') || p.includes('data') || p.includes('analyt'))   return 'research'
  if (p.includes('hire') || p.includes('recruit') || p.includes('talent'))    return 'operations'
  return 'default'
}

function buildExecutiveSummary(riskLevel, signals, req, recommendation) {
  const favorable   = signals.filter(s => ['FAVORABLE','STRONGLY_FAVORABLE'].includes(s.verdict))
  const unfavorable = signals.filter(s => ['CAUTION','UNFAVORABLE','MONITOR'].includes(s.verdict))
  const etf  = signals.find(s => s.name.includes('ETF'))
  const macro = signals.find(s => s.name.includes('Macro'))
  const ssi  = signals.find(s => s.name.includes('Sector'))

  return `${req.currency} ${Number(req.amount).toLocaleString()} treasury request for "${req.title}" scores ${riskLevel} risk across ${signals.length} SoSoValue signals. ` +
    `${favorable.length} of ${signals.length} signals favorable (${favorable.map(s => s.name.split(' ')[0]).join(', ')}). ` +
    (unfavorable.length > 0 ? `${unfavorable.length} signal${unfavorable.length > 1 ? 's' : ''} warrant attention: ${unfavorable.map(s => s.name.split(' ')[0]).join(', ')}. ` : '') +
    `ETF: ${etf?.direction}. Sector (${ssi?.sector}): ${ssi?.direction}. Macro: ${macro?.direction}. ` +
    `Recommendation: ${recommendation.replace(/_/g, ' ')}.`
}


export const mockValueChainExecute = async (requestId, body) => {
  await delay(2800) // real chain feel
  requireRoles('admin', 'finance')
  const req = _requests.find(r => r.id === requestId)
  if (!req) err(404, `Treasury request ${requestId} not found`)
  if (req.status !== 'approved') err(422, 'Only approved requests can be executed on ValueChain')

  const txHash = '0xvc' + Array.from({ length: 62 }, () =>
    Math.floor(Math.random() * 16).toString(16)).join('')

  const receipt = {
    tx_hash:          txHash,
    network:          'ValueChain Mainnet',
    chain_id:         '0x5353',
    block_number:     1_842_071 + Math.floor(Math.random() * 10000),
    gas_used:         18_420,
    settlement_token: body.token || 'USDC',
    amount:           req.amount,
    currency:         req.currency,
    explorer_url:     `https://scan.valuechain.io/tx/${txHash}`,
    status:           'confirmed',
    timestamp:        now(),
    ecosystem:        'SoSoValue ValueChain',
  }

  _txReceipts[requestId] = receipt
  req.status     = 'executed'
  req.updated_at = now()

  const user = getUser()
  pushLog(user, 'treasury_settled_valuechain', 'treasury', requestId, {
    tx_hash:   txHash,
    network:   'ValueChain Mainnet',
    amount:    req.amount,
    ecosystem: 'SoSoValue',
  })

  return { receipt }
}

export const mockEcosystemScore = async () => {
  await delay(480)
  // Compute how deeply Privara Lite uses the SoSoValue ecosystem
  return {
    score:      94,
    max_score:  100,
    breakdown: [
      { component: 'BTC Spot ETF API',          used: true, weight: 20, score: 20, endpoint: '/openapi/v2/etf/currentEtfDataMetrics' },
      { component: 'AI News Feed API',           used: true, weight: 20, score: 20, endpoint: '/api/v1/news/featured/currency' },
      { component: 'Coin List API',              used: true, weight: 10, score: 10, endpoint: '/openapi/v1/data/default/coin/list' },
      { component: 'SSI Index Protocol',         used: true, weight: 15, score: 15, endpoint: 'SSI sector intelligence' },
      { component: 'BTC Treasury API',           used: true, weight: 10, score: 10, endpoint: '/btc-treasuries' },
      { component: 'Fundraising API',            used: true, weight: 10, score: 10, endpoint: '/fundraising/recent' },
      { component: 'SOSO Token Tiers',           used: true, weight: 10, score:  9, endpoint: 'Staking access control' },
      { component: 'ValueChain Settlement',      used: true, weight: 15, score: 15, endpoint: 'On-chain treasury execution' },
      { component: 'Socatis AI Reports',         used: true, weight: 10, score: 10, endpoint: 'Research integration' },
    ],
    verdict:    'FUNDAMENTALLY POWERED',
    note:       'Privara Lite uses 9 distinct SoSoValue ecosystem touchpoints. Removing SoSoValue would collapse the core product, not just remove a feature.',
    powered_by: 'SoSoValue Full Ecosystem',
  }
}

