import {
  mockLogin, mockRegister, mockDemoLogin,
  mockListBatches, mockGetBatch, mockUploadBatch, mockAuditExport,
  mockListTreasury, mockCreateTreasury,
  mockApproveTreasury, mockRejectTreasury, mockRiskScore,
  mockExecuteOnChain, mockTreasuryWindow,
  mockDecisionHistory, mockDecisionIntelligencePdf,
  mockListProposals, mockCreateProposal, mockCastVote, mockGetResults,
  mockListAuditRequests, mockSubmitAuditRequest, mockDecideAuditRequest,
  mockListAuditLogs, mockAuditPdf,
  mockMarketIntelligence, mockEtfSummary, mockBriefing,
  mockSectorRotation, mockMacroCalendar, mockRecordOutcome,

  // SoSoValue Ecosystem
  mockSSIIntelligence, mockBTCTreasuries, mockFundraisingFeed,
  mockSosoTierCheck, mockSocatisReports, mockValueChainExecute,
  mockEcosystemScore,

  mockPriyaAgent, mockFelixAgent, mockSageAgent,
  mockAtlasAgent, mockSentinelAgent,
  mockGetPolicy, mockUpdatePolicy,
  mockRunAutonomousLoop, mockGetLoopHistory,
  mockApprovalIntelligence,
} from './mockApi.js'
import { getToken } from './auth.js'

const ROUTES = [
  // Auth
  { method: 'POST', pattern: /^\/auth\/login$/,                                          handler: (_, b) => mockLogin(b.email, b.password)         },
  { method: 'POST', pattern: /^\/auth\/register$/,                                       handler: (_, b) => mockRegister(b)                         },
  { method: 'POST', pattern: /^\/demo\/login$/,                                          handler: (_, b) => mockDemoLogin(b.role)                   },

  // Market
  { method: 'GET',  pattern: /^\/market\/intelligence$/,                                 handler: ()     => mockMarketIntelligence()                },
  { method: 'GET',  pattern: /^\/market\/etf$/,                                          handler: ()     => mockEtfSummary()                        },
  { method: 'POST', pattern: /^\/market\/briefing$/,                                     handler: (_, b) => mockBriefing(b)                         },
  { method: 'GET',  pattern: /^\/market\/sectors$/,                                      handler: ()     => mockSectorRotation()                    },
  { method: 'GET',  pattern: /^\/market\/macro-calendar$/,                               handler: ()     => mockMacroCalendar()                     },

  // Payroll
  { method: 'GET',  pattern: /^\/payroll\/batches$/,                                     handler: ()     => mockListBatches()                       },
  { method: 'POST', pattern: /^\/payroll\/upload$/,                                      handler: (_, b) => mockUploadBatch(b)                      },
  { method: 'GET',  pattern: /^\/payroll\/batches\/([^/]+)\/audit-export$/,              handler: (m)    => mockAuditExport(m[1])                   },
  { method: 'GET',  pattern: /^\/payroll\/batches\/([^/]+)$/,                            handler: (m)    => mockGetBatch(m[1])                      },

  // Treasury
  { method: 'GET',  pattern: /^\/treasury\/requests\/pending$/,                          handler: ()     => mockListTreasury()                      },
  { method: 'GET',  pattern: /^\/treasury\/requests$/,                                   handler: ()     => mockListTreasury()                      },
  { method: 'POST', pattern: /^\/treasury\/requests$/,                                   handler: (_, b) => mockCreateTreasury(b)                   },
  { method: 'POST', pattern: /^\/treasury\/requests\/([^/]+)\/approve$/,                 handler: (m, b) => mockApproveTreasury(m[1], b)            },
  { method: 'POST', pattern: /^\/treasury\/requests\/([^/]+)\/reject$/,                  handler: (m, b) => mockRejectTreasury(m[1], b)             },
  { method: 'GET',  pattern: /^\/treasury\/requests\/([^/]+)\/risk-score$/,              handler: (m)    => mockRiskScore(m[1])                     },
  { method: 'POST', pattern: /^\/treasury\/requests\/([^/]+)\/execute$/,                 handler: (m, b) => mockExecuteOnChain(m[1], b)             },
  { method: 'GET',  pattern: /^\/treasury\/requests\/([^/]+)\/window$/,                  handler: (m)    => mockTreasuryWindow(m[1])                },
  { method: 'GET',  pattern: /^\/treasury\/decision-history$/,                           handler: ()     => mockDecisionHistory()                   },
  { method: 'GET',  pattern: /^\/treasury\/decision-history\/pdf$/,                      handler: ()     => mockDecisionIntelligencePdf()           },
  { method: 'POST', pattern: /^\/treasury\/decisions\/([^/]+)\/outcome$/,                handler: (m, b) => mockRecordOutcome(m[1], b.outcome)      },
  { method: 'POST', pattern: /^\/treasury\/requests\/([^/]+)\/approval-intelligence$/, handler: (m, b) => mockApprovalIntelligence({ request_id: m[1], ...b }) },

  // SoSoValue Ecosystem
  { method: 'POST', pattern: /^\/ssv\/ssi-intelligence$/,                                  handler: (_, b) => mockSSIIntelligence(b)               },
  { method: 'GET',  pattern: /^\/ssv\/btc-treasuries$/,                                    handler: ()     => mockBTCTreasuries()                  },
  { method: 'POST', pattern: /^\/ssv\/fundraising$/,                                       handler: (_, b) => mockFundraisingFeed(b)               },
  { method: 'GET',  pattern: /^\/ssv\/tier$/,                                              handler: ()     => mockSosoTierCheck()                 },
  { method: 'POST', pattern: /^\/ssv\/socatis\/reports$/,                                  handler: (_, b) => mockSocatisReports(b)               },
  // Wait-ValueChain execute needs the request ID
  { method: 'POST', pattern: /^\/ssv\/valuechain\/([^/]+)\/execute$/,                  handler: (m, b) => mockValueChainExecute(m[1], b)      },
  { method: 'GET',  pattern: /^\/ssv\/ecosystem-score$/,                                  handler: ()     => mockEcosystemScore()                },

  // Governance
  { method: 'GET',  pattern: /^\/governance\/proposals$/,                                handler: ()     => mockListProposals()                     },
  { method: 'POST', pattern: /^\/governance\/proposals$/,                                handler: (_, b) => mockCreateProposal(b)                   },
  { method: 'POST', pattern: /^\/governance\/proposals\/([^/]+)\/vote$/,                 handler: (m, b) => mockCastVote(m[1], b)                   },
  { method: 'GET',  pattern: /^\/governance\/proposals\/([^/]+)\/results$/,              handler: (m)    => mockGetResults(m[1])                    },
  

  // Audit
  { method: 'GET',  pattern: /^\/audit\/requests$/,                                      handler: ()     => mockListAuditRequests()                 },
  { method: 'POST', pattern: /^\/audit\/requests$/,                                      handler: (_, b) => mockSubmitAuditRequest(b)               },
  { method: 'POST', pattern: /^\/audit\/requests\/([^/]+)\/decide$/,                     handler: (m, b) => mockDecideAuditRequest(m[1], b)         },
  { method: 'GET',  pattern: /^\/audit\/logs$/,                                          handler: ()     => mockListAuditLogs()                     },
  { method: 'GET',  pattern: /^\/audit\/reports\/([^/]+)\/([^/]+)\/pdf$/,               handler: (m)    => mockAuditPdf(m[1], m[2])                },
  { method: 'GET',  pattern: /^\/audit\/reports\/full\/pdf$/,                            handler: ()     => mockAuditPdf('system', 'full')          },

  // Agents
  { method: 'POST', pattern: /^\/agents\/payroll\/analyze$/,                             handler: (_, b) => mockPriyaAgent(b)                       },
  { method: 'POST', pattern: /^\/agents\/treasury\/narrate$/,                            handler: (_, b) => mockFelixAgent(b)                       },
  { method: 'POST', pattern: /^\/agents\/governance\/draft$/,                            handler: (_, b) => mockSageAgent(b)                        },
  { method: 'POST', pattern: /^\/agents\/audit\/summarize$/,                             handler: ()     => mockAtlasAgent()                        },
  { method: 'POST', pattern: /^\/agents\/sentinel\/scan$/,                               handler: ()     => mockSentinelAgent()                     },

  // Sentinel Loop
  { method: 'GET',  pattern: /^\/loop\/policy$/,                                      handler: ()     => mockGetPolicy()                       },
  { method: 'POST', pattern: /^\/loop\/policy$/,                                      handler: (_, b) => mockUpdatePolicy(b)                 },
  { method: 'POST', pattern: /^\/loop\/run$/,                                         handler: ()     => mockRunAutonomousLoop()             },
  { method: 'GET',  pattern: /^\/loop\/history$/,                                     handler: ()     => mockGetLoopHistory()                },
]

const dispatch = async (method, url, body = null) => {
  const path   = url.replace(/^\/api/, '').split('?')[0]
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

const api = {
  get:    (url, opts)       => dispatch('GET',    url, null),
  post:   (url, body, opts) => dispatch('POST',   url, body),
  put:    (url, body, opts) => dispatch('PUT',    url, body),
  patch:  (url, body, opts) => dispatch('PATCH',  url, body),
  delete: (url, opts)       => dispatch('DELETE', url, null),
  interceptors: {
    request:  { use: () => {} },
    response: { use: () => {} },
  },
}

export default api