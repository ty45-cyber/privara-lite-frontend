import { useState, useEffect } from 'react'
import { Calendar, AlertTriangle, TrendingDown, Clock } from 'lucide-react'
import api from '../lib/api'
import './MacroCalendar.css'

const RISK_CONFIG = {
  HIGH: { color: 'red', icon: AlertTriangle },
  MEDIUM: { color: 'amber', icon: TrendingDown },
  LOW: { color: 'green', icon: Clock },
}

export default function MacroCalendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/market/macro-calendar')
      .then((r) => {
        setEvents(r.data.events || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const daysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="macro-calendar">
      <div className="macro-header">
        <div className="macro-header-left">
          <Calendar size={12} className="macro-icon" />
          <span className="macro-label">MACRO EVENT CALENDAR</span>
        </div>
        <span className="macro-source">SoSoValue Macro Calendar</span>
      </div>

      {loading ? (
        <div className="macro-loading">Loading macro events…</div>
      ) : (
        <div className="macro-events">
          {events.map((event) => {
            const cfg = RISK_CONFIG[event.risk_impact] || RISK_CONFIG.LOW
            const RiskIcon = cfg.icon
            const days = daysUntil(event.date)
            const urgent = days <= 3

            return (
              <div
                key={event.id}
                className={`macro-event macro-event--${cfg.color} ${urgent ? 'macro-event--urgent' : ''}`}
              >
                <div className="macro-event-top">
                  <div className="macro-event-left">
                    <RiskIcon
                      size={11}
                      className={`macro-risk-icon macro-risk-icon--${cfg.color}`}
                    />
                    <span className="macro-event-title">{event.event}</span>
                  </div>
                  <div className="macro-event-right">
                    <span className={`macro-countdown macro-countdown--${urgent ? 'urgent' : 'normal'}`}>
                      {days === 0 ? 'TODAY' : days === 1 ? 'TOMORROW' : `T-${days}d`}
                    </span>
                    <span className={`macro-risk-badge macro-risk-badge--${cfg.color}`}>
                      {event.risk_impact}
                    </span>
                  </div>
                </div>
                <p className="macro-event-desc">{event.description}</p>
                <div className="macro-event-rec">
                  <span className="macro-rec-label">TREASURY ACTION</span>
                  <span className={`macro-rec-value macro-rec-value--${cfg.color}`}>
                    {event.treasury_recommendation.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

