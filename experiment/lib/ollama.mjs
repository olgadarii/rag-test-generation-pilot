// Minimal Ollama HTTP client (embeddings + chat), no dependencies.
function host () {
  let h = process.env.OLLAMA_HOST || '127.0.0.1:11434'
  if (!/^https?:\/\//.test(h)) h = 'http://' + h
  return h.replace('0.0.0.0', '127.0.0.1').replace(/\/$/, '')
}

async function post (path, body) {
  const r = await fetch(host() + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!r.ok) throw new Error(`Ollama ${path} -> HTTP ${r.status}: ${await r.text()}`)
  return r.json()
}

export async function embed (model, inputs) {
  const out = []
  for (const text of inputs) { // one at a time: keeps num_ctx honest for long files
    const j = await post('/api/embed', { model, input: text, truncate: true, options: { num_ctx: 8192 } })
    out.push(j.embeddings[0])
  }
  return out
}

export async function chat (model, system, user, { seed, temperature, numCtx }) {
  const j = await post('/api/chat', {
    model,
    stream: false,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    options: { seed, temperature, num_ctx: numCtx, num_predict: 4096 }
  })
  return {
    text: j.message.content,
    promptTokens: j.prompt_eval_count,
    outputTokens: j.eval_count,
    seconds: j.total_duration / 1e9
  }
}

export async function modelInfo (model) {
  try {
    const j = await post('/api/show', { model })
    return { model, digest: j.details ? `${j.details.family} ${j.details.parameter_size} ${j.details.quantization_level}` : null }
  } catch (e) { return { model, digest: null, error: String(e.message || e) } }
}
