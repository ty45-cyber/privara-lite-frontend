import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('privara_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global 401 → logout
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

export default api