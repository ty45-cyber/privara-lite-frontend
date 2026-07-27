import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { CheckCircle, XCircle, Info, X, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

let _toastFn = null

export const toast = {
  success: (title, body) => _toastFn?.('success', title, body),
  error:   (title, body) => _toastFn?.('error',   title, body),
  info:    (title, body) => _toastFn?.('info',    title, body),
  warn:    (title, body) => _toastFn?.('warn',    title, body),
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((type, title, body) => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, type, title, body }])
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id))
    }, 4000)
  }, [])

  useEffect(() => { _toastFn = add; return () => { _toastFn = null } }, [add])

  const ICONS = {
    success: CheckCircle,
    error:   XCircle,
    info:    Info,
    warn:    AlertTriangle,
  }

  return (
    <ToastContext.Provider value={add}>
      {children}
      <div className="toast-container">
        {toasts.map(t => {
          const Icon = ICONS[t.type] || Info
          return (
            <div key={t.id} className={`toast toast--${t.type}`}>
              <Icon size={14} className="toast-icon" />
              <div>
                {t.title && <div className="toast-title">{t.title}</div>}
                {t.body  && <div className="toast-body">{t.body}</div>}
              </div>
              <button
                onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', marginLeft: 'auto', padding: '2px', display: 'flex' }}
              >
                <X size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)