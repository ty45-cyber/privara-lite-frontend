import {
  mockLogin, mockRegister, mockDemoLogin,
  mockListBatches, mockGetBatch, mockUploadBatch, mockAuditExport,
  mockListTreasury, mockListPendingTreasury, mockCreateTreasury,
  mockApproveTreasury, mockRejectTreasury, mockRiskScore,
  mockExecuteOnChain,
  mockListProposals, mockCreateProposal, mockCastVote, mockGetResults,
  mockListAuditRequests, mockSubmitAuditRequest, mockDecideAuditRequest,
  mockListAuditLogs, mockAuditPdf,
  mockMarketIntelligence, mockEtfSummary, mockBriefing,
} from './mockApi.js'
import { getToken } from './auth.js'

// ── Route table — maps method + path pattern to mock handler ─────────────────
// Patterns are matched in order; first match wins.

const ROUTES = [
  // Auth (no token required)
  { method: 'POST', pattern: /^\/auth\/login$/,           handler: (_, b)    => mockLogin(b.email, b.password)       },
  { method: 'POST', pattern: /^\/auth\/register$/,        handler: (_, b)    => mockRegister(b)                       },
  { method: 'POST', pattern: /^\/demo\/login$/,           handler: (_, b)    => mockDemoLogin(b.role)                 },

  // Market intelligence
  { method: 'GET',  pattern: /^\/market\/intelligence$/,  handler: ()        => mockMarketIntelligence()              },
  { method: 'GET',  pattern: /^\/market\/etf$/,           handler: ()        => mockEtfSummary()                      },
  { method: 'POST', pattern: /^\/market\/briefing$/,      handler: (_, b)    => mockBriefing(b)                       },

  // Payroll
  { method: 'GET',  pattern: /^\/payroll\/batches$/,                  handler: ()        => mockListBatches()                        },
  { method: 'POST', pattern: /^\/payroll\/upload$/,                   handler: (_, b)    => mockUploadBatch(b)                       },
  { method: 'GET',  pattern: /^\/payroll\/batches\/([^/]+)\/audit-export$/, handler: (m) => mockAuditExport(m[1])                  },
  { method: 'GET',  pattern: /^\/payroll\/batches\/([^/]+)$/,         handler: (m)       => mockGetBatch(m[1])                       },

  // Treasury
  { method: 'GET',  pattern: /^\/treasury\/requests\/pending$/,                    handler: ()        => mockListPendingTreasury()           },
  { method: 'GET',  pattern: /^\/treasury\/requests$/,                             handler: ()        => mockListTreasury()                   },
  { method: 'POST', pattern: /^\/treasury\/requests$/,                             handler: (_, b)    => mockCreateTreasury(b)                },
  { method: 'POST', pattern: /^\/treasury\/requests\/([^/]+)\/approve$/,           handler: (m, b)    => mockApproveTreasury(m[1], b)         },
  { method: 'POST', pattern: /^\/treasury\/requests\/([^/]+)\/reject$/,            handler: (m, b)    => mockRejectTreasury(m[1], b)          },
  { method: 'GET',  pattern: /^\/treasury\/requests\/([^/]+)\/risk-score$/,        handler: (m)       => mockRiskScore(m[1])                  },
  { method: 'POST', pattern: /^\/treasury\/requests\/([^/]+)\/execute$/,           handler: (m, b)    => mockExecuteOnChain(m[1], b)          },
  { method: 'GET',  pattern: /^\/treasury\/requests\/([^/]+)\/tx-status\/([^/]+)$/,handler: ()       => Promise.resolve({ status: 'confirmed', confirmations: 12 }) },

  // Governance
  { method: 'GET',  pattern: /^\/governance\/proposals$/,                          handler: ()        => mockListProposals()                  },
  { method: 'POST', pattern: /^\/governance\/proposals$/,                          handler: (_, b)    => mockCreateProposal(b)                },
  { method: 'POST', pattern: /^\/governance\/proposals\/([^/]+)\/vote$/,           handler: (m, b)    => mockCastVote(m[1], b)                },
  { method: 'GET',  pattern: /^\/governance\/proposals\/([^/]+)\/results$/,        handler: (m)       => mockGetResults(m[1])                 },

  // Audit
  { method: 'GET',  pattern: /^\/audit\/requests$/,                                handler: ()        => mockListAuditRequests()              },
  { method: 'POST', pattern: /^\/audit\/requests$/,                                handler: (_, b)    => mockSubmitAuditRequest(b)            },
  { method: 'POST', pattern: /^\/audit\/requests\/([^/]+)\/decide$/,              handler: (m, b)    => mockDecideAuditRequest(m[1], b)      },
  { method: 'GET',  pattern: /^\/audit\/logs$/,                                    handler: ()        => mockListAuditLogs()                  },
  { method: 'GET',  pattern: /^\/audit\/reports\/([^/]+)\/([^/]+)\/pdf$/,         handler: (m)       => mockAuditPdf(m[1], m[2])             },
  { method: 'GET',  pattern: /^\/audit\/reports\/full\/pdf$/,                      handler: ()        => mockAuditPdf('system', 'full')       },
]

// ── Core dispatcher ───────────────────────────────────────────────────────────

const dispatch = async (method, url, body = null, options = {}) => {
  // Strip /api prefix if present
  const path = url.replace(/^\/api/, '').split('?')[0]

  // Auth guard — skip for public routes
  const PUBLIC = [/^\/auth\//, /^\/demo\//]
  if (!PUBLIC.some(p => p.test(path)) && !getToken()) {
    const e = new Error('Unauthorized')
    e.response = { status: 401, data: { error: 'UNAUTHORIZED', message: 'Please log in' } }
    throw e
  }

  // Match route
  for (const route of ROUTES) {
    if (route.method !== method.toUpperCase()) continue
    const match = path.match(route.pattern)
    if (match) {
      const result = await route.handler(match, body)
      // Blob responses (CSV, PDF) — return as-is
      if (result instanceof Blob) {
        return { data: result, status: 200 }
      }
      return { data: result, status: 200 }
    }
  }

  // Unmatched — 404
  const e = new Error(`No mock handler for ${method} ${path}`)
  e.response = { status: 404, data: { error: 'NOT_FOUND', message: `No mock for ${path}` } }
  throw e
}

// ── Axios-compatible API object ───────────────────────────────────────────────
// Drop-in replacement — same interface, all callers unchanged

const api = {
  get:    (url, opts)          => dispatch('GET',    url, null, opts),
  post:   (url, body, opts)    => dispatch('POST',   url, body, opts),
  put:    (url, body, opts)    => dispatch('PUT',    url, body, opts),
  patch:  (url, body, opts)    => dispatch('PATCH',  url, body, opts),
  delete: (url, opts)          => dispatch('DELETE', url, null, opts),

  // Axios interceptors stub — no-op so existing code doesn't break
  interceptors: {
    request:  { use: () => {} },
    response: { use: () => {} },
  },
}

export default api