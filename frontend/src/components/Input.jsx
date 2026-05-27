import './Input.css'

export default function Input({ label, id, error, ...props }) {
  return (
    <div className="field">
      {label && <label className="field-label" htmlFor={id}>{label}</label>}
      <input id={id} className={`field-input ${error ? 'field-input--error' : ''}`} {...props} />
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

export function Textarea({ label, id, error, ...props }) {
  return (
    <div className="field">
      {label && <label className="field-label" htmlFor={id}>{label}</label>}
      <textarea id={id} className={`field-input field-textarea ${error ? 'field-input--error' : ''}`} {...props} />
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

export function Select({ label, id, children, error, ...props }) {
  return (
    <div className="field">
      {label && <label className="field-label" htmlFor={id}>{label}</label>}
      <select id={id} className={`field-input field-select ${error ? 'field-input--error' : ''}`} {...props}>
        {children}
      </select>
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}