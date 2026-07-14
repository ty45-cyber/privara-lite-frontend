import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, ExternalLink, Zap } from 'lucide-react'
import api from '../lib/api'
import './SSIIntelligence.css'

export default function SSIIntelligence({ spendCategory, amount, currency }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    if (!spendCategory) { setLoading(false); return }
    api.post('/ssv/ssi-intelligence', { spend_category: spendCategory, amount })
      .then(r => { setData(r.data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [spendCategory, amount])

  if (loading) return <div className="ssi-loading">Loading SSI index intelligence…</div>
  if (error || !data) return null

  const positive = data.ssi_change_7d > 0

  return (
    <div className={`ssi-panel ssi-panel--${data.ssi_signal?.toLowerCase().replace('_', '-')}`}>
      <div className="ssi-header">
        <div className="ssi-header-left">
          <Zap size={11} className="ssi-icon" />
          <span className="ssi-label">SSI INDEX INTELLIGENCE</span>
          <span className="ssi-token">{data.ssi_token}</span>
        </div>
        

        <a
          href={data.ssi_url}
          target="_blank"
          rel="noreferrer"
          className="ssi-link"
        >
          {data.ssi_symbol} <ExternalLink size={9} />
        </a>
      </div>

      <div className="ssi-body">
        <div className="ssi-metrics">
          <div className="ssi-metric">
            <span className="ssi-metric-label">SECTOR</span>
            <span className="ssi-metric-value">{data.sector}</span>
          </div>
          <div className="ssi-metric">
            <span className="ssi-metric-label">INDEX PRICE</span>
            <span className="ssi-metric-value">${data.ssi_price_usd?.toFixed(2)}</span>
          </div>
          <div className="ssi-metric">
            <span className="ssi-metric-label">7D PERFORMANCE</span>
            <span className={`ssi-metric-value ${positive ? 'ssi-pos' : 'ssi-neg'}`}>
              {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {positive ? '+' : ''}{data.ssi_change_7d?.toFixed(1)}%
            </span>
          </div>
          <div className="ssi-metric">
            <span className="ssi-metric-label">30D PERFORMANCE</span>
            <span className={`ssi-metric-value ${data.ssi_change_30d > 0 ? 'ssi-pos' : 'ssi-neg'}`}>
              {data.ssi_change_30d > 0 ? '+' : ''}{data.ssi_change_30d?.toFixed(1)}%
            </span>
          </div>
          <div className="ssi-metric">
            <span className="ssi-metric-label">SECTOR TVL</span>
            <span className="ssi-metric-value">
              ${(data.ssi_tvl_usd / 1e9).toFixed(2)}B
            </span>
          </div>
          <div className="ssi-metric">
            <span className="ssi-metric-label">SPEND % OF TVL</span>
            <span className={`ssi-metric-value ${data.spend_signal === 'MATERIAL' ? 'ssi-neg' : 'ssi-pos'}`}>
              {data.spend_pct_of_tvl}%
              <span className="ssi-spend-signal">{data.spend_signal}</span>
            </span>
          </div>
        </div>

        <div className="ssi-recommendation">
          <span className="ssi-rec-label">SSI SECTOR SIGNAL</span>
          <span className="ssi-rec-text">{data.recommendation}</span>
        </div>

        {data.risk_adjustment !== 0 && (
          <div className={`ssi-adjustment ssi-adjustment--${data.risk_adjustment < 0 ? 'positive' : 'negative'}`}>
            <Zap size={10} />
            SSI sector performance adjusts composite risk score by{' '}
            <strong>{data.risk_adjustment > 0 ? '+' : ''}{data.risk_adjustment} points</strong>
            {' '}({data.risk_adjustment < 0 ? 'risk reduced' : 'risk elevated'} due to sector momentum)
          </div>
        )}

        <div className="ssi-components">
          <span className="ssi-components-label">INDEX COMPONENTS</span>
          <div className="ssi-component-list">
            {data.ssi_components?.map(c => (
              <span key={c} className="ssi-component">{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="ssi-footer">
        <Zap size={9} />
        Powered by SoSoValue SSI Index Protocol ·
        <a href="https://sosovalue.com/indexes" target="_blank" rel="noreferrer">
          View on SoSoValue <ExternalLink size={8} />
        </a>
      </div>
    </div>
  )
}