import './Button.css'

export default function Button({
  children, variant = 'primary', size = 'md',
  onClick, disabled, type = 'button', className = '', loading
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${className} ${loading ? 'btn--loading' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <span className="btn-spinner" /> : null}
      {children}
    </button>
  )
}