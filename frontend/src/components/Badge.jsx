import './Badge.css'

const VARIANT_MAP = {
  pending:  'amber',
  approved: 'green',
  rejected: 'red',
  executed: 'blue',
  active:   'green',
  closed:   'dim',
  passed:   'green',
  granted:  'green',
  denied:   'red',
  encrypted:'amber',
  draft:    'dim',
  audited:  'blue',
  medium:   'amber',
  high:     'red',
  low:      'green',
}

export default function Badge({ label }) {
  const variant = VARIANT_MAP[label?.toLowerCase()] || 'dim'
  return <span className={`badge badge--${variant}`}>{label?.toUpperCase()}</span>
}