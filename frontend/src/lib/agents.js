import api from './api.js'

export async function streamAgent(endpoint, body, onToken, onDone) {
  try {
    const resp = await api.post(endpoint, { ...body, stream: true })
    const text = resp.data?.text || resp.data?.content || ''
    if (typeof text === 'string' && text.length > 0) {
      const words = text.split(' ')
      let accumulated = ''
      for (const word of words) {
        await new Promise(r => setTimeout(r, 18))
        accumulated += (accumulated ? ' ' : '') + word
        onToken(accumulated)
      }
      onDone(accumulated)
      return
    }
    onDone('')
  } catch (e) {
    onDone(`Error: ${e.response?.data?.message || e.message}`)
  }
}

export async function runPriyaAgent(csvText) {
  const resp = await api.post('/agents/payroll/analyze', { csv_text: csvText })
  return resp.data
}

export async function runFelixAgent(requestId, onToken, onDone) {
  await streamAgent('/agents/treasury/narrate', { request_id: requestId }, onToken, onDone)
}

export async function runSageAgent(prompt, onToken, onDone) {
  await streamAgent('/agents/governance/draft', { prompt }, onToken, onDone)
}

export async function runAtlasAgent() {
  const resp = await api.post('/agents/audit/summarize', {})
  return resp.data
}

export async function runSentinelAgent() {
  const resp = await api.post('/agents/sentinel/scan', {})
  return resp.data
}

export async function runAutonomousLoop() {
  const resp = await api.post('/loop/run', {})
  return resp.data
}

export async function getLoopPolicy() {
  const resp = await api.get('/loop/policy')
  return resp.data
}

export async function updateLoopPolicy(policy) {
  const resp = await api.post('/loop/policy', policy)
  return resp.data
}

export async function getLoopHistory() {
  const resp = await api.get('/loop/history')
  return resp.data
}

