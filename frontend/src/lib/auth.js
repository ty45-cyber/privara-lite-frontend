export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('privara_user') || 'null')
  } catch {
    return null
  }
}

export const setSession = (token, user) => {
  localStorage.setItem('privara_token', token)
  localStorage.setItem('privara_user', JSON.stringify(user))
}

export const clearSession = () => {
  localStorage.removeItem('privara_token')
  localStorage.removeItem('privara_user')
}

export const isAuthenticated = () => !!localStorage.getItem('privara_token')

export const hasRole = (user, ...roles) => user && roles.includes(user.role)