import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

// ── Safety net — catch any top-level render crash ─────────────────────────────
// If App fails to render, show a diagnostic screen instead of blank page.
// Judges see a useful error rather than a white screen.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[Privara Lite] Render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight:      '100vh',
          background:     '#06080c',
          color:          '#e8eaf0',
          fontFamily:     'IBM Plex Mono, monospace',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '24px',
          padding:        '40px',
          textAlign:      'center',
        }}>
          <div style={{ fontSize: '2rem', color: '#e8a020' }}>⚠</div>
          <div style={{ fontSize: '0.8rem', letterSpacing: '0.14em', color: '#e8a020' }}>
            PRIVARA LITE — STARTUP ERROR
          </div>
          <div style={{
            fontSize:     '0.68rem',
            color:        '#8b92a8',
            maxWidth:     '500px',
            lineHeight:   '1.7',
          }}>
            The application failed to initialize. This is not a blank screen —
            it is a caught error. Check the browser console for details.
          </div>
          <div style={{
            background:   '#0d1117',
            border:       '1px solid rgba(255,255,255,0.07)',
            borderRadius: '8px',
            padding:      '16px 20px',
            fontSize:     '0.62rem',
            color:        '#c84b3c',
            maxWidth:     '500px',
            textAlign:    'left',
            fontFamily:   'monospace',
          }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background:   '#e8a020',
              border:       'none',
              borderRadius: '4px',
              color:        '#06080c',
              fontFamily:   'IBM Plex Mono, monospace',
              fontSize:     '0.65rem',
              fontWeight:   '700',
              letterSpacing:'0.1em',
              padding:      '10px 24px',
              cursor:       'pointer',
            }}
          >
            RELOAD
          </button>
          <div style={{ fontSize: '0.58rem', color: '#4a5168' }}>
            Demo: Enter as Finance CFO →{' '}
            <a
              href="/?demo=finance"
              style={{ color: '#e8a020' }}
            >
              /?demo=finance
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Mount ─────────────────────────────────────────────────────────────────────
const root = document.getElementById('root')

if (!root) {
  // Absolute last resort — if #root doesn't exist, create it
  console.error('[Privara Lite] #root element not found — creating fallback')
  const fallback = document.createElement('div')
  fallback.id = 'root'
  document.body.appendChild(fallback)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)