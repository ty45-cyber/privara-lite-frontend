import { useState } from 'react'
import { Zap, ExternalLink, CheckCircle, Loader } from 'lucide-react'
import api from '../lib/api'
import './OnChainExecute.css'

export default function OnChainExecute({ requestId, amount, currency, status }) {
  const [executing, setExecuting] = useState(false)
  const [receipt, setReceipt]     = useState(null)
  const [error, setError]         = useState(null)
  const [address, setAddress]     = useState('')
  const [showForm, setShowForm]   = useState(false)

  if (status !== 'approved') return null

  const execute = async () => {
    if (!address.trim()) return
    setExecuting(true)
    setError(null)
    try {
      const { data } = await api.post(`/treasury/requests/${requestId}/execute`, {
        destination_address: address,
        memo: `Treasury execution — ${currency} ${amount}`,
      })
      setReceipt(data.receipt)
      setShowForm(false)
    } catch (e) {
      setError(e.response?.data?.message || 'Execution failed')
    } finally {
      setExecuting(false)
    }
  }

  if (receipt) {
    return (
      <div className="onchain-receipt">
        <div className="onchain-receipt-header">
          <CheckCircle size={13} className="onchain-check" />
          <span className="onchain-receipt-label">ON-CHAIN EXECUTION CONFIRMED</span>
        </div>
        <div className="onchain-receipt-body">
          <div className="onchain-row">
            <span className="onchain-row-label">NETWORK</span>
            <span className="onchain-row-value">{receipt.network}</span>
          </div>
          <div className="onchain-row">
            <span className="onchain-row-label">TX HASH</span>
            <a
              href={receipt.explorer_url}
              target="_blank"
              rel="noreferrer"
              className="onchain-tx-hash"
            >
              {receipt.tx_hash.slice(0, 18)}…{receipt.tx_hash.slice(-6)}
              <ExternalLink size={10} />
            </a>
          </div>
          {receipt.block_number && (
            <div className="onchain-row">
              <span className="onchain-row-label">BLOCK</span>
              <span className="onchain-row-value">#{receipt.block_number.toLocaleString()}</span>
            </div>
          )}
          {receipt.gas_used && (
            <div className="onchain-row">
              <span className="onchain-row-label">GAS USED</span>
              <span className="onchain-row-value">{receipt.gas_used.toLocaleString()}</span>
            </div>
          )}
          <div className="onchain-row">
            <span className="onchain-row-label">STATUS</span>
            <span className="onchain-status">{receipt.status?.toUpperCase()}</span>
          </div>
        </div>
        <div className="onchain-powered">
          Executed via SoDEX ·
          <a href={receipt.explorer_url} target="_blank" rel="noreferrer">
            View on explorer <ExternalLink size={9} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="onchain-execute">
      {!showForm ? (
        <button className="onchain-trigger" onClick={() => setShowForm(true)}>
          <Zap size={12} />
          EXECUTE ON-CHAIN VIA SoDEX
        </button>
      ) : (
        <div className="onchain-form">
          <div className="onchain-form-header">
            <Zap size={12} className="onchain-zap" />
            <span>SoDEX TESTNET EXECUTION</span>
          </div>
          <div className="onchain-form-body">
            <label className="onchain-label">DESTINATION ADDRESS</label>
            <input
              className="onchain-input"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="0x... or wallet address"
              spellCheck={false}
            />
            <div className="onchain-amount-preview">
              {currency} {Number(amount).toLocaleString()} →
              <span className="onchain-network">SoDEX Testnet</span>
            </div>
            {error && <div className="onchain-error">{error}</div>}
            <div className="onchain-form-actions">
              <button className="onchain-cancel" onClick={() => setShowForm(false)} disabled={executing}>
                CANCEL
              </button>
              <button
                className="onchain-confirm"
                onClick={execute}
                disabled={executing || !address.trim()}
              >
                {executing
                  ? <><Loader size={11} className="onchain-spin" /> SUBMITTING…</>
                  : <><Zap size={11} /> CONFIRM EXECUTION</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}