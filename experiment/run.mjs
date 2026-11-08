#!/usr/bin/env node
// RAG test-generation experiment (IRI 2026 pilot, automated + repeated).
//
// node run.mjs --juice ../juice-shop [--runs 3] [--stories login,search]
//              [--conditions A,B_auto,C_auto,B_oracle,C_oracle] [--base-url http://localhost:3000]
//              [--gen-model qwen2.5:7b-instruct] [--emb-model bge-m3] [--temperature 0.7]
//              [--reset "docker restart juice-shop"] [--out results] [--mock]
//
// Resumable: a run whose result.json exists is skipped.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync, execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { loadCorpus, expandDependencies } from './lib/corpus.mjs'
import * as ollama from './lib/ollama.mjs'
import { classify } from './lib/classify.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d }
const flag = k => argv.includes('--' + k)

const CFG = {
  juice: path.resolve(arg('juice', '../juice-shop')),
  runs: Number(arg('runs', 3)),
  stories: arg('stories', 'login,search').split(','),
  conditions: arg('conditions', 'A,B_auto,C_auto,B_oracle,C_oracle').split(','),
  baseUrl: arg('base-url', 'http://localhost:3000'),
  genModel: arg('gen-model', 'qwen2.5:7b-instruct'),
  embModel: arg('emb-model', 'bge-m3'),
  temperature: Number(arg('temperature', 0.7)),
  numCtx: Number(arg('num-ctx', 16384)),
  reset: arg('reset', ''),
  out: path.resolve(HERE, arg('out', 'results')),
  mock: flag('mock')
}
const FIXTURE = 'test/cypress/support/setup.ts'
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)
fs.mkdirSync(CFG.out, { recursive: true })

// ------------------------------------------------------------ backends (real or mock)
const sha = s => crypto.createHash('sha256').update(s).digest('hex')
function mockEmbed (texts) { // bag-of-words hashed vectors: only for dry runs of the pipeline
  return texts.map(t => {
    const v = new Array(256).fill(0)
    for (const w of t.toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 2)) v[parseInt(sha(w).slice(0, 4), 16) % 256] += 1
    return v
  })
}
const embed = CFG.mock ? async (_m, t) => mockEmbed(t) : ollama.embed
const chat = CFG.mock
  ? async () => ({ text: "```ts\nimport { test, expect } from '@playwright/test'\ntest('home loads', async ({ page }) => { await page.goto('/'); await expect(page).toHaveTitle(/Mock/) })\ntest('fails on purpose', async ({ page }) => { await page.goto('/'); await page.click('#nope', { timeout: 2000 }) })\n```", promptTokens: 0, outputTokens: 0, seconds: 0 })
  : ollama.chat

const cos = (a, b) => { let d = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] } return d / (Math.sqrt(na * nb) || 1) }

// ------------------------------------------------------------ prompt
const SYSTEM = 'You are a senior test automation engineer. You write Playwright Test specs in TypeScript. ' +
  'Reply with exactly one TypeScript code block containing a complete, runnable spec file, and nothing else.'

function buildPrompt (story, contextFiles, docs) {
  let p = `Application under test: a web shop. The Playwright config sets baseURL to ${CFG.baseUrl}.\n` +
    "Write a Playwright Test spec file (import { test, expect } from '@playwright/test') for this requirement.\n\n" +
    `User story: ${story.story}\nAcceptance criteria:\n${story.acceptance.map(a => '- ' + a).join('\n')}\n`
  if (contextFiles.length) {
    p += '\nRelevant artifacts retrieved from the project\'s existing (Cypress) test suite. ' +
      'Reuse their selectors, routes, test data and setup where relevant, translated to Playwright:\n'
    for (const f of contextFiles) p += `\n--- FILE: ${f} ---\n${docs[f]}\n--- END FILE ---\n`
  }
  return p
}

function extractCode (text) {
  const blocks = [...text.matchAll(/```(?:ts|typescript|js|javascript)?\s*\n([\s\S]*?)```/g)].map(m => m[1])
  return (blocks.length ? blocks.sort((a, b) => b.length - a.length)[0] : text).trim() + '\n'
}

// ------------------------------------------------------------ execution
async function waitForApp (timeoutMs = 180000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    try { const r = await fetch(CFG.baseUrl); if (r.ok) return true } catch {}
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error('App not reachable at ' + CFG.baseUrl)
}

function walkSpecs (suite, acc) {
  for (const s of suite.suites || []) walkSpecs(s, acc)
  for (const sp of suite.specs || []) {
    for (const t of sp.tests || []) {
      const r = (t.results || [])[t.results.length - 1] || {}
      acc.push({
        title: sp.title,
        status: r.status || 'unknown',
        error: r.error ? String(r.error.message || r.error.value || '').replace(/\u001b\[[0-9;]*m/g, '').slice(0, 2500) : null
      })
    }
  }
  return acc
}

function findPlaywrightBin () { // nearest node_modules/.bin/playwright walking up (reuses the pilot's install)
  let d = HERE
  while (true) {
    const b = path.join(d, 'node_modules', '.bin', 'playwright')
    if (fs.existsSync(b)) return b
    const up = path.dirname(d)
    if (up === d) return null
    d = up
  }
}
const PW_BIN = findPlaywrightBin()

function execute (specRel, runDir) {
  const report = path.join(runDir, 'report.json')
  fs.rmSync(report, { force: true })
  const [cmd, pre] = PW_BIN ? [PW_BIN, []] : ['npx', ['--no-install', 'playwright']]
  const res = spawnSync(cmd, [...pre, 'test', specRel, '--config', path.join(HERE, 'playwright.config.mjs')], {
    cwd: HERE,
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: report, BASE_URL: CFG.baseUrl, FORCE_COLOR: '0' },
    encoding: 'utf8',
    timeout: 15 * 60 * 1000
  })
  fs.writeFileSync(path.join(runDir, 'playwright.log'), (res.stdout || '') + '\n' + (res.stderr || ''))
  let tests = []; let topErrors = []
  if (fs.existsSync(report)) {
    const j = JSON.parse(fs.readFileSync(report, 'utf8'))
    for (const s of j.suites || []) walkSpecs(s, tests)
    topErrors = (j.errors || []).map(e => String(e.message || e.value || '').replace(/\u001b\[[0-9;]*m/g, '').slice(0, 2500))
  } else {
    topErrors = [((res.stderr || '') + (res.stdout || '')).slice(-600) || 'no report produced']
  }
  return { tests, topErrors }
}

// ------------------------------------------------------------ main
const stories = JSON.parse(fs.readFileSync(path.join(HERE, 'stories.json'), 'utf8'))
const docs = loadCorpus(CFG.juice)
const names = Object.keys(docs)
let commit = null
try { commit = execSync('git rev-parse HEAD', { cwd: CFG.juice, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch {}
if (!commit && fs.existsSync(path.join(CFG.juice, 'VERSION'))) commit = fs.readFileSync(path.join(CFG.juice, 'VERSION'), 'utf8').trim()
log(`corpus: ${names.length} artifacts from ${CFG.juice} @ ${commit || '?'}`)

// index (cached)
const idxPath = path.join(CFG.out, `index.${CFG.mock ? 'mock' : CFG.embModel.replace(/[^\w.-]/g, '_')}.json`)
let index = fs.existsSync(idxPath) ? JSON.parse(fs.readFileSync(idxPath, 'utf8')) : {}
const missing = names.filter(n => !index[n] || index[n].sha !== sha(docs[n]))
if (missing.length) {
  log(`embedding ${missing.length} artifacts with ${CFG.mock ? 'MOCK' : CFG.embModel}`)
  const vecs = await embed(CFG.embModel, missing.map(n => docs[n]))
  missing.forEach((n, i) => { index[n] = { sha: sha(docs[n]), v: vecs[i] } })
  fs.writeFileSync(idxPath, JSON.stringify(index))
}

const meta = {
  started: new Date().toISOString(), config: CFG, juiceCommit: commit, corpusSize: names.length,
  models: CFG.mock ? 'mock' : [await ollama.modelInfo(CFG.genModel), await ollama.modelInfo(CFG.embModel)]
}
fs.writeFileSync(path.join(CFG.out, 'meta.json'), JSON.stringify(meta, null, 2))

const plan = {} // story -> condition -> context files
for (const sid of CFG.stories) {
  const story = stories[sid]
  const query = `${story.story}\n${story.acceptance.join('\n')}`
  const [qv] = await embed(CFG.embModel, [query])
  const ranked = names.map(n => ({ n, s: cos(qv, index[n].v) })).sort((a, b) => b.s - a.s)
  const rankOf = f => ranked.findIndex(r => r.n === f) + 1
  const top1 = ranked[0].n
  const exp = expandDependencies(docs, top1)
  const retrieval = {
    query, top10: ranked.slice(0, 10).map(r => ({ file: r.n, score: +r.s.toFixed(4) })),
    targetRank: rankOf(story.target), fixtureRank: rankOf(FIXTURE), top1IsTarget: top1 === story.target,
    expansion: exp.added, serverSideTasks: exp.flags
  }
  fs.mkdirSync(path.join(CFG.out, sid), { recursive: true })
  fs.writeFileSync(path.join(CFG.out, sid, 'retrieval.json'), JSON.stringify(retrieval, null, 2))
  log(`[${sid}] top1=${path.basename(top1)} target@${retrieval.targetRank} fixture@${retrieval.fixtureRank} expansion=+${Object.keys(exp.added).length}`)

  plan[sid] = {
    A: [],
    B_auto: [top1],
    C_auto: [top1, ...Object.keys(exp.added)],
    B_oracle: story.oracle.B,
    C_oracle: story.oracle.C
  }
}

// run index outermost: after pass 1 every cell of the table has n=1, later passes add repeats
for (let k = 1; k <= CFG.runs; k++) {
  for (const sid of CFG.stories) {
    const story = stories[sid]
    for (const cond of CFG.conditions) {
      const runDir = path.join(CFG.out, sid, cond, `run${k}`)
      if (fs.existsSync(path.join(runDir, 'result.json'))) { log(`[${sid}/${cond}/run${k}] done, skip`); continue }
      fs.mkdirSync(runDir, { recursive: true })
      const ctx = plan[sid][cond]
      const prompt = buildPrompt(story, ctx, docs)
      fs.writeFileSync(path.join(runDir, 'prompt.txt'), SYSTEM + '\n\n' + prompt)
      const seed = 1000 * k + 7
      log(`[${sid}/${cond}/run${k}] generating (context: ${ctx.length} files, seed ${seed})`)
      const gen = await chat(CFG.genModel, SYSTEM, prompt, { seed, temperature: CFG.temperature, numCtx: CFG.numCtx })
      fs.writeFileSync(path.join(runDir, 'response.md'), gen.text)
      const specRel = path.relative(HERE, path.join(runDir, 'gen.spec.ts')).split(path.sep).join('/')
      fs.writeFileSync(path.join(HERE, specRel), extractCode(gen.text))

      if (CFG.reset) { execSync(CFG.reset, { stdio: 'ignore', shell: true }); }
      await waitForApp()
      await new Promise(r => setTimeout(r, 3000)) // let the re-seed finish
      log(`[${sid}/${cond}/run${k}] executing against ${CFG.baseUrl}`)
      const ex = execute(specRel, runDir)
      const crashed = ex.tests.some(t => /ERR_CONNECTION_REFUSED|ECONNREFUSED/.test(t.error || ''))
      if (crashed) {
        const tries = (Number(fs.existsSync(path.join(runDir, 'invalid.count')) ? fs.readFileSync(path.join(runDir, 'invalid.count'), 'utf8') : 0) || 0) + 1
        fs.writeFileSync(path.join(runDir, 'invalid.count'), String(tries))
        log(`[${sid}/${cond}/run${k}] INVALID: app went down during execution (attempt ${tries}), re-executing same spec`)
        if (tries < 3) { execSync(CFG.reset || 'true', { stdio: 'ignore', shell: true }); await waitForApp(); await new Promise(r => setTimeout(r, 3000)); const ex2 = execute(specRel, runDir); ex.tests = ex2.tests; ex.topErrors = ex2.topErrors }
      }
      const passed = ex.tests.filter(t => t.status === 'passed').length
      const result = {
        story: sid, condition: cond, run: k, seed, contextFiles: ctx,
        promptTokens: gen.promptTokens, outputTokens: gen.outputTokens, genSeconds: gen.seconds,
        testsTotal: ex.tests.length, testsPassed: passed,
        topErrors: ex.topErrors,
        tests: ex.tests.map(t => ({ ...t, category: t.status === 'passed' ? null : classify(t.error || '') })),
        runCategory: ex.tests.length === 0 ? classify(ex.topErrors.join('\n'), true) : null
      }
      fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(result, null, 2))
      fs.appendFileSync(path.join(CFG.out, 'results.jsonl'), JSON.stringify(result) + '\n')
      log(`[${sid}/${cond}/run${k}] ${passed}/${ex.tests.length} passed`)
    }
  }
}
log('all done')
