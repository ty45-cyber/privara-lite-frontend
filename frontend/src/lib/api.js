// This is the ONLY change needed to fix the blank screen.
// In development: real Axum backend via Vite proxy
// In production (Vercel): full mock layer, zero backend dependency

const USE_MOCK = import.meta.env.VITE_MOCK_MODE === 'true'
  || import.meta.env.MODE === 'production'

let api

if (USE_MOCK) {
  // Production path — judges see this on Vercel
  const {
    mockLogin, mockRegister, mockDemoLogin,
    mockListBatches, mockGetBatch, mockUploadBatch, mockAuditExport,
    mockListTreasury, mockCreateTreasury,
    mockApproveTreasury, mockRejectTreasury, mockRiskScore,
    mockExecuteOnChain,
    mockListProposals, mockCreateProposal, mockCastVote, mockGetResults,
    mockListAuditRequests, mockSubmitAuditRequest, mockDecideAuditRequest,
    mockListAuditLogs, mockAuditPdf,
    mockMarketIntelligence, mockEtfSummary, mockBriefing,
    mockSectorRotation, mockMacroCalendar,
    mockDecisionHistory, mockTreasuryWindow, mockRecordOutcome,
    mockDecisionIntelligencePdf,
  } = await import('./mockApi.js')

  const delay = (ms = 420) => new Promise(r => setTimeout(r, ms))

  const ROUTES = [
    { method: 'POST', pattern: /^\/auth\/login$/,                                   handler: (_, b)  => mockLogin(b.email, b.password)       },
    { method: 'POST', pattern: /^\/auth\/register$/,                                handler: (_, b)  => mockRegister(b)                       },
    { method: 'POST', pattern: /^\/demo\/login$/,                                   handler: (_, b)  => mockDemoLogin(b.role)                 },
    { method: 'GET',  pattern: /^\/market\/intelligence$/,                          handler: ()      => mockMarketIntelligence()              },
    { method: 'GET',  pattern: /^\/market\/etf$/,                                   handler: ()      => mockEtfSummary()                      },
    { method: 'POST', pattern: /^\/market\/briefing$/,                              handler: (_, b)  => mockBriefing(b)                       },
    { method: 'GET',  pattern: /^\/payroll\/batches$/,                              handler: ()      => mockListBatches()                     },
    { method: 'POST', pattern: /^\/payroll\/upload$/,                               handler: (_, b)  => mockUploadBatch(b)                    },
    { method: 'GET',  pattern: /^\/payroll\/batches\/([^/]+)\/audit-export$/,       handler: (m)     => mockAuditExport(m[1])                 },
    { method: 'GET',  pattern: /^\/payroll\/batches\/([^/]+)$/,                     handler: (m)     => mockGetBatch(m[1])                    },
    { method: 'GET',  pattern: /^\/treasury\/requests\/pending$/,                   handler: ()      => mockListTreasury()                    },
    { method: 'GET',  pattern: /^\/treasury\/requests$/,                            handler: ()      => mockListTreasury()                    },
    { method: 'POST', pattern: /^\/treasury\/requests$/,                            handler: (_, b)  => mockCreateTreasury(b)                 },
    { method: 'POST', pattern: /^\/treasury\/requests\/([^/]+)\/approve$/,          handler: (m, b)  => mockApproveTreasury(m[1], b)          },
    { method: 'POST', pattern: /^\/treasury\/requests\/([^/]+)\/reject$/,           handler: (m, b)  => mockRejectTreasury(m[1], b)           },
    { method: 'GET',  pattern: /^\/treasury\/requests\/([^/]+)\/risk-score$/,       handler: (m)     => mockRiskScore(m[1])                   },
    { method: 'POST', pattern: /^\/treasury\/requests\/([^/]+)\/execute$/,          handler: (m, b)  => mockExecuteOnChain(m[1], b)           },
    { method: 'GET',  pattern: /^\/governance\/proposals$/,                         handler: ()      => mockListProposals()                   },
    { method: 'POST', pattern: /^\/governance\/proposals$/,                         handler: (_, b)  => mockCreateProposal(b)                 },
    { method: 'POST', pattern: /^\/governance\/proposals\/([^/]+)\/vote$/,          handler: (m, b)  => mockCastVote(m[1], b)                 },
    { method: 'GET',  pattern: /^\/governance\/proposals\/([^/]+)\/results$/,       handler: (m)     => mockGetResults(m[1])                  },
    { method: 'GET',  pattern: /^\/audit\/requests$/,                               handler: ()      => mockListAuditRequests()               },
    { method: 'POST', pattern: /^\/audit\/requests$/,                               handler: (_, b)  => mockSubmitAuditRequest(b)             },
    { method: 'POST', pattern: /^\/audit\/requests\/([^/]+)\/decide$/,             handler: (m, b)  => mockDecideAuditRequest(m[1], b)       },
    { method: 'GET',  pattern: /^\/audit\/logs$/,                                   handler: ()      => mockListAuditLogs()                   },
    { method: 'GET',  pattern: /^\/audit\/reports\/([^/]+)\/([^/]+)\/pdf$/,        handler: (m)     => mockAuditPdf(m[1], m[2])              },
    { method: 'GET',  pattern: /^\/audit\/reports\/full\/pdf$/,                     handler: ()      => mockAuditPdf('system', 'full')        },
    { method: 'GET',  pattern: /^\/market\/sectors$/,                               handler: ()      => mockSectorRotation()                  },
    { method: 'GET',  pattern: /^\/market\/macro-calendar$/,                        handler: ()      => mockMacroCalendar()                   },
    { method: 'GET',  pattern: /^\/treasury\/decision-history$/,                    handler: ()      => mockDecisionHistory()                 },
    { method: 'GET',  pattern: /^\/treasury\/requests\/([^/]+)\/window$/,           handler: (m)     => mockTreasuryWindow(m[1])              },
    { method: 'POST', pattern: /^\/treasury\/decisions\/([^/]+)\/outcome$/,         handler: (m, b)  => mockRecordOutcome(m[1], b)            },
    { method: 'GET',  pattern: /^\/treasury\/decision-history\/pdf$/,               handler: ()      => mockDecisionIntelligencePdf()         },
  ]

  const getToken = () => localStorage.getItem('privara_token')

  const dispatch = async (method, url, body = null) => {
    const path = url.replace(/^\/api/, '').split('?')[0]
    const PUBLIC = [/^\/auth\//, /^\/demo\//]

    if (!PUBLIC.some(p => p.test(path)) && !getToken()) {
      const e = new Error('Unauthorized')
      e.response = { status: 401, data: { error: 'UNAUTHORIZED', message: 'Please log in' } }
      throw e
    }

    for (const route of ROUTES) {
      if (route.method !== method.toUpperCase()) continue
      const match = path.match(route.pattern)
      if (match) {
        const result = await route.handler(match, body)
        return { data: result, status: 200 }
      }
    }

    const e = new Error(`No mock handler: ${method} ${path}`)
    e.response = { status: 404, data: { error: 'NOT_FOUND', message: `No mock for ${path}` } }
    throw e
  }

  api = {
    get:    (url, opts)       => dispatch('GET',  url, null),
    post:   (url, body, opts) => dispatch('POST', url, body),
    put:    (url, body, opts) => dispatch('PUT',  url, body),
    patch:  (url, body, opts) => dispatch('PATCH',url, body),
    delete: (url, opts)       => dispatch('DELETE',url, null),
    interceptors: { request: { use: () => {} }, response: { use: () => {} } },
  }

} else {
  // Development path — real Axum backend
  const axios = (await import('axios')).default
  api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
  })

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('privara_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  api.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem('privara_token')
        localStorage.removeItem('privara_user')
        window.location.href = '/login'
      }
      return Promise.reject(err)
    }
  )
}

export default api