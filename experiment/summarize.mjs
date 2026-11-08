#!/usr/bin/env node
// Aggregate results/<story>/<cond>/run*/result.json into summary.json + summary.md
import fs from 'node:fs'
import path from 'node:path'

const out = path.resolve(process.argv[2] || 'results')
const ORDER = ['A', 'B_auto', 'C_auto', 'B_oracle', 'C_oracle']
const LABEL = { A: 'A · fără regăsire', B_auto: 'B · parțială (retriever)', C_auto: 'C · completă (retriever + dependențe)', B_oracle: 'B · parțială (aleasă manual, ca în pilot)', C_oracle: 'C · completă (aleasă manual, ca în pilot)' }
const results = []
for (const story of fs.readdirSync(out)) {
  const sdir = path.join(out, story)
  if (!fs.statSync(sdir).isDirectory()) continue
  for (const cond of fs.readdirSync(sdir)) {
    const cdir = path.join(sdir, cond)
    if (!fs.statSync(cdir).isDirectory()) continue
    for (const run of fs.readdirSync(cdir)) {
      const f = path.join(cdir, run, 'result.json')
      if (fs.existsSync(f)) results.push(JSON.parse(fs.readFileSync(f, 'utf8')))
    }
  }
}

const summary = { generated: new Date().toISOString(), stories: {} }
let md = `# Rezultate experiment\n\nGenerat: ${summary.generated}\n`
for (const story of [...new Set(results.map(r => r.story))].sort()) {
  const retrieval = JSON.parse(fs.readFileSync(path.join(out, story, 'retrieval.json'), 'utf8'))
  summary.stories[story] = { retrieval: { top1: retrieval.top10[0].file, targetRank: retrieval.targetRank, fixtureRank: retrieval.fixtureRank, top1IsTarget: retrieval.top1IsTarget, expansion: Object.keys(retrieval.expansion) }, conditions: {} }
  md += `\n## ${story}\n\nRegăsire BGE-M3: top-1 = \`${retrieval.top10[0].file}\` · ținta pe locul ${retrieval.targetRank} · setup.ts pe locul ${retrieval.fixtureRank} din ${retrieval.top10.length >= 10 ? 'corpus' : '?'}\n\n`
  md += '| Condiție | Rulări | Teste trecute / total | Rată pe rulare | Rulări cu ≥1 trecut | Cauze principale de eșec |\n|---|---|---|---|---|---|\n'
  for (const cond of ORDER) {
    const rs = results.filter(r => r.story === story && r.condition === cond).sort((a, b) => a.run - b.run)
    if (!rs.length) continue
    const passed = rs.reduce((s, r) => s + r.testsPassed, 0)
    const total = rs.reduce((s, r) => s + r.testsTotal, 0)
    const cats = {}
    for (const r of rs) {
      if (r.runCategory) cats[r.runCategory] = (cats[r.runCategory] || 0) + 1
      for (const t of r.tests) if (t.category) cats[t.category] = (cats[t.category] || 0) + 1
    }
    const perRun = rs.map(r => `${r.testsPassed}/${r.testsTotal}`)
    summary.stories[story].conditions[cond] = { runs: rs.length, passed, total, perRun, runsWithPass: rs.filter(r => r.testsPassed > 0).length, failureCategories: cats }
    md += `| ${LABEL[cond]} | ${rs.length} | ${passed} / ${total}${total ? ` (${Math.round(100 * passed / total)}%)` : ''} | ${perRun.join(', ')} | ${rs.filter(r => r.testsPassed > 0).length} / ${rs.length} | ${Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} (${v})`).join(', ') || '—'} |\n`
  }
}
fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2))
fs.writeFileSync(path.join(out, 'summary.md'), md)
console.log(md)
