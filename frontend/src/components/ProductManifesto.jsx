import { Shield, Zap, TrendingUp } from 'lucide-react'
import './ProductManifesto.css'

export default function ProductManifesto() {
  return (
    <section className="manifesto">
      <div className="manifesto-inner">
        <div className="manifesto-eyebrow">
          <Zap size={10} />
          THE THESIS
        </div>

        <h2 className="manifesto-title">
          Institutional markets already know
          <br />
          what your treasury should do.
          <br />
          <span className="manifesto-accent">Nobody was listening.</span>
        </h2>

        <div className="manifesto-body">
          <p>
            When institutional money flows into BTC Spot ETFs, it signals risk-on
            positioning across asset classes. When AI-curated news sentiment turns
            bearish, capital rotation has already begun. These signals are public.
            They are precise. They are ignored by every financial operations tool
            on the market.
          </p>
          <p>
            Privara Lite is built on one insight:{' '}
            <strong>
              SoSoValue's institutional intelligence should control access to
              capital, not just display alongside it.
            </strong>{' '}
            An approver cannot act on a treasury request without seeing a risk
            score derived from live ETF flows and news sentiment. The market
            speaks before the human votes.
          </p>
          <p>
            This is not a dashboard. It is a governance layer — the first system
            that makes organizational treasury decisions institutionally aware
            in real time.
          </p>
        </div>

        <div className="manifesto-pillars">
          <div className="manifesto-pillar">
            <Shield size={16} className="manifesto-pillar-icon manifesto-pillar-icon--amber" />
            <div className="manifesto-pillar-text">
              <span className="manifesto-pillar-title">Confidential by design</span>
              <span className="manifesto-pillar-desc">
                AES-256-GCM encryption at the field level. Role determines what
                decrypts. Auditors see exactly what they need and nothing more.
              </span>
            </div>
          </div>
          <div className="manifesto-pillar">
            <TrendingUp size={16} className="manifesto-pillar-icon manifesto-pillar-icon--green" />
            <div className="manifesto-pillar-text">
              <span className="manifesto-pillar-title">Market-aware by default</span>
              <span className="manifesto-pillar-desc">
                Every treasury approval includes live SoSoValue ETF flows, AI news
                sentiment, and macro event timing. The signal is always present.
                The decision is always informed.
              </span>
            </div>
          </div>
          <div className="manifesto-pillar">
            <Zap size={16} className="manifesto-pillar-icon manifesto-pillar-icon--blue" />
            <div className="manifesto-pillar-text">
              <span className="manifesto-pillar-title">Intelligence that compounds</span>
              <span className="manifesto-pillar-desc">
                Every decision is tracked against 30-day outcomes. The system
                learns whether its risk scores predicted correctly. Accuracy is
                measured, reported, and improved.
              </span>
            </div>
          </div>
        </div>

        <div className="manifesto-attribution">
          Built for SoSoValue × Akindo Buildathon ·
          Data by{' '}
          <a href="https://sosovalue.com" target="_blank" rel="noreferrer">
            SoSoValue
          </a>
        </div>
      </div>
    </section>
  )
}