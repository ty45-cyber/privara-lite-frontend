import { useState } from 'react'
import { Zap, ExternalLink, CheckCircle, Loader, Shield } from 'lucide-react'
import api from '../lib/api'
import './ValueChainSettle.css'

const TOKENS = ['USDC', 'USDT', 'ETH', 'BTC']

export default function ValueChainSettle({ requestId, amount, currency, status }) {
  const [step, setStep]         = useState('idle')
  const [address, setAddress]   = useState('')
  const [token, setToken]       = useState('USDC')
  const [receipt, setReceipt]   = useState(null)
  const [error, setError]       = useState(null)

  if (status !== 'approved') return null
  if (receipt) {
    return (
      <div className="vc-receipt">
        <div className="vc-receipt-header">
          <CheckCircle size={13} className="vc-check" />
          <span className="vc-receipt-label">SETTLED ON VALUECHAIN MAINNET</span>
          <span className="vc-ecosystem-badge">
            <Zap size={9} /> SoSoValue Ecosystem
          </span>
        </div>
        <div className="vc-receipt-body">
          <div className="vc-row">
            <span className="vc-row-label">NETWORK</span>
            <span className="vc-row-value">{receipt.network}</span>
          </div>
          <div className="vc-row">
            <span className="vc-row-label">CHAIN ID</span>
            <span className="vc-row-value">{receipt.chain_id}</span>
          </div>
          <div className="vc-row">
            <span className="vc-row-label">TX HASH</span>
            <a href={receipt.explorer_url} target="_blank" rel="noreferrer" className="vc-tx-hash">
              {receipt.tx_hash.slice(0,20)}…{receipt.tx_hash.slice(-6)}
              <ExternalLink size={10} />
            </a>
          </div>
          <div className="vc-row">
            <span className="vc-row-label">BLOCK</span>
            <span className="vc-row-value">#{receipt.block_number?.toLocaleString()}</span>
          </div>
          <div className="vc-row">
            <span className="vc-row-label">SETTLEMENT TOKEN</span>
            <span className="vc-row-value">{receipt.settlement_token}</span>
          </div>
          <div className="vc-row">
            <span className="vc-row-label">STATUS</span>
            <span className="vc-status">CONFIRMED</span>
          </div>
        </div>
        <div className="vc-receipt-footer">
          <Shield size={9} />
          Settled on ValueChain — SoSoValue's L1 blockchain ·
          <a href={receipt.explorer_url} target="_blank" rel="noreferrer">
            View on ValueChain Explorer <ExternalLink size={8} />
          </a>
        </div>
      </div>
    )
  }

  const execute = async () => {
    if (!address.trim()) return
    setStep('executing')
    setError(null)
    try {
      const { data } = await api.post(`/ssv/valuechain/${requestId}/execute`, {
        destination_address: address,
        token,
        memo: `Privara Lite treasury settlement — ${currency} ${amount}`,
      })
      setReceipt(data.receipt)
      setStep('done')
    } catch (e) {
      setError(e.response?.data?.message || 'Settlement failed')
      setStep('form')
    }
  }

  return (
    <div className="vc-settle">
      {step === 'idle' && (
        <button className="vc-trigger" onClick={() => setStep('form')}>
          <Zap size={12} />
          SETTLE ON VALUECHAIN MAINNET
          <span className="vc-trigger-badge">SoSoValue L1</span>
        </button>
      )}

      {step === 'form' && (
        <div className="vc-form">
          <div className="vc-form-header">
            <Zap size={12} className="vc-zap" />
            <span>VALUECHAIN MAINNET SETTLEMENT</span>
            <span className="vc-ecosystem-badge-sm">SoSoValue Ecosystem</span>
          </div>
          <div className="vc-form-body">
            <div className="vc-field">
              <label className="vc-label">DESTINATION ADDRESS (ValueChain)</label>
              <input
                className="vc-input"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="0x... ValueChain address"
                spellCheck={false}
              />
            </div>
            <div className="vc-field">
              <label className="vc-label">SETTLEMENT TOKEN</label>
              <div className="vc-token-row">
                {TOKENS.map(t => (
                  <button
                    key={t}
                    className={`vc-token-btn ${token === t ? 'vc-token-btn--active' : ''}`}
                    onClick={() => setToken(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="vc-preview">
              {currency} {Number(amount).toLocaleString()} →
              <span className="vc-preview-net">ValueChain Mainnet</span>
              <span className="vc-preview-token">via {token}</span>
            </div>
            {error && <div className="vc-error">{error}</div>}
            <div className="vc-form-actions">
              <button className="vc-cancel" onClick={() => setStep('idle')}>CANCEL</button>
              <button
                className="vc-confirm"
                onClick={execute}
                disabled={!address.trim()}
              >
                <Zap size={11} /> SETTLE ON VALUECHAIN
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'executing' && (
        <div className="vc-executing">
          <Loader size={13} className="vc-spin" />
          <div className="vc-executing-text">
            <span className="vc-executing-title">Settling on ValueChain Mainnet…</span>
            <span className="vc-executing-sub">Awaiting block confirmation on SoSoValue's L1</span>
          </div>
        </div>
      )}
    </div>
  )
}