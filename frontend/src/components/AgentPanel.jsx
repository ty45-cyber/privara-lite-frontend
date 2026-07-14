import { useState, useEffect, useRef } from 'react'
import { Sparkles, Loader, ChevronDown, ChevronUp } from 'lucide-react'
import './AgentPanel.css'

export default function AgentPanel({
  agentName,
  agentRole,
  trigger,
  onRun,
  autoRun     = false,
  collapsible = true,
  accentColor = 'amber',
}) {
  const [state, setState] = useState('idle')
  const [text, setText]   = useState('')
  const [open, setOpen]   = useState(!collapsible)
  const textRef           = useRef(null)

  useEffect(() => { if (autoRun) run() }, [])

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight
    }
  }, [text])

  const run = async () => {
    setState('loading')
    setText('')
    setOpen(true)
    try {
      await onRun(
        (chunk) => { setState('streaming'); setText(chunk) },
        (full)  => { setState('done');      setText(full)  },
      )
    } catch (e) {
      setState('error')
      setText(e.message || 'Agent error')
    }
  }

  const COLORS = {
    amber: { bg: 'var(--amber-glow)',  border: 'var(--amber-dim)',          text: 'var(--amber)' },
    green: { bg: 'var(--green-dim)',   border: 'rgba(46,168,126,0.3)',      text: 'var(--green)' },
    blue:  { bg: 'var(--blue-dim)',    border: 'rgba(58,123,213,0.3)',      text: 'var(--blue)'  },
    red:   { bg: 'var(--red-dim)',     border: 'rgba(200,75,60,0.3)',       text: 'var(--red)'   },
  }
  const color = COLORS[accentColor] || COLORS.amber

  return (
    <div
      className="agent-panel"
      style={{
        '--agent-color':  color.text,
        '--agent-bg':     color.bg,
        '--agent-border': color.border,
      }}
    >
      <div className="agent-panel-header">
        <div className="agent-panel-left">
          <Sparkles size={12} className="agent-spark" />
          <div className="agent-name-row">
            <span className="agent-name">{agentName}</span>
            <span className="agent-role">{agentRole}</span>
          </div>
        </div>
        <div className="agent-panel-right">
          {state === 'idle' && (
            <button className="agent-run-btn" onClick={run}>{trigger}</button>
          )}
          {(state === 'loading' || state === 'streaming') && (
            <span className="agent-status">
              <Loader size={11} className="agent-spin" />
              {state === 'loading' ? 'Thinking…' : 'Streaming…'}
            </span>
          )}
          {state === 'done' && (
            <button className="agent-run-btn agent-run-btn--rerun" onClick={run}>REFRESH</button>
          )}
          {state === 'error' && (
            <button className="agent-run-btn agent-run-btn--rerun" onClick={run}>RETRY</button>
          )}
          {collapsible && state !== 'idle' && (
            <button className="agent-collapse" onClick={() => setOpen(o => !o)}>
              {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>

      {open && text && (
        <div className="agent-panel-body" ref={textRef}>
          <pre className="agent-output">{text}</pre>
          {state === 'streaming' && <span className="agent-cursor">█</span>}
        </div>
      )}
    </div>
  )
}