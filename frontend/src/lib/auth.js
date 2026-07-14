const TOKEN_KEY = 'privara_token'
const USER_KEY  = 'privara_user'

export const getUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    clearSession()
    return null
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY) || null

export const isAuthenticated = () => {
  const token = getToken()
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      clearSession()
      return false
    }
    return true
  } catch {
    clearSession()
    return false
  }
}

export const isDemoSession = () => {
  const token = getToken()
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.demo === true
  } catch {
    return false
  }
}

export const hasRole = (user, ...roles) => {
  if (!user || !user.role) return false
  return roles.includes(user.role)
}

export const hasAnyRole = (...roles) => {
  const user = getUser()
  return hasRole(user, ...roles)
}

export const setSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const postLoginRedirect  = () => '/app/dashboard'
export const postLogoutRedirect = () => '/'

export const ROLES = {
  ADMIN:    'admin',
  HR:       'hr',
  FINANCE:  'finance',
  AUDITOR:  'auditor',
  EMPLOYEE: 'employee',
}

export const ROLE_META = {
  admin:    { label: 'ADMIN',    color: 'amber' },
  hr:       { label: 'HR',       color: 'blue'  },
  finance:  { label: 'FINANCE',  color: 'green' },
  auditor:  { label: 'AUDITOR',  color: 'red'   },
  employee: { label: 'EMPLOYEE', color: 'dim'   },
}

export const CAN = {
  uploadPayroll:   (u) => hasRole(u, ROLES.ADMIN, ROLES.HR),
  decryptPayroll:  (u) => hasRole(u, ROLES.ADMIN, ROLES.HR, ROLES.FINANCE),
  exportAuditCSV:  (u) => hasRole(u, ROLES.ADMIN, ROLES.AUDITOR),
  createTreasury:  (u) => hasRole(u, ROLES.ADMIN, ROLES.FINANCE),
  approveTreasury: (u) => hasRole(u, ROLES.ADMIN, ROLES.FINANCE),
  createProposal:  (u) => hasRole(u, ROLES.ADMIN, ROLES.FINANCE),
  tallyVotes:      (u) => hasRole(u, ROLES.ADMIN),
  submitAudit:     (u) => hasRole(u, ROLES.AUDITOR),
  decideAudit:     (u) => hasRole(u, ROLES.ADMIN),
  viewAuditLogs:   (u) => hasRole(u, ROLES.ADMIN, ROLES.AUDITOR),
}