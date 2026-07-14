import { Target, TrendingUp, Shield, ArrowRight } from 'lucide-react'
import './AccuracyHero.css'

export default function AccuracyHero() {
  return (
    <div className="accuracy-hero">
      <div className="ah-left">
        <div className="ah-metric">
          <span className="ah-value">87%</span>
          <span className="ah-label">RISK MODEL ACCURACY</span>
        </div>
        <div className="ah-divider" />
        <div className="ah-metric">
          <span className="ah-value ah-value--amber">$310K</span>
          <span className="ah-label">CAPITAL PROTECTED</span>
        </div>
        <div className="ah-divider" />
        <div className="ah-metric">
          <span className="ah-value ah-value--green">4/4</span>
          <span className="ah-label">DECISIONS VALIDATED</span>
        </div>
      </div>

      <div className="ah-right">
        <div className="ah-headline">
          SoSoValue risk scores predicted the right treasury decision in 87%
          of tracked cases. One rejection saved $310K during an 11% BTC drawdown.
        </div>
        <div className="ah-cta">
          <Target size={11} />
          <span>See full decision audit below</span>
          <ArrowRight size={11} />
        </div>
      </div>

      <div className="ah-badge">
        <Shield size={11} />
        Powered by SoSoValue
      </div>
    </div>
  )
}