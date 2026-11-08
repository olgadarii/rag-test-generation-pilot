// Corpus of project artifacts + framework-aware dependency expansion (Cypress).
import fs from 'node:fs'
import path from 'node:path'

function walk (dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : (p.endsWith('.ts') ? [p] : [])
  })
}

export function loadCorpus (juiceRoot) {
  const files = walk(path.join(juiceRoot, 'test/cypress')).sort()
  const cfg = path.join(juiceRoot, 'cypress.config.ts')
  if (fs.existsSync(cfg)) files.push(cfg)
  const docs = {}
  for (const f of files) docs[path.relative(juiceRoot, f).split(path.sep).join('/')] = fs.readFileSync(f, 'utf8')
  return docs
}

function resolveImport (docs, fromFile, spec) {
  if (!spec.startsWith('.')) return null
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec))
  for (const c of [base, base + '.ts']) if (docs[c] !== undefined) return c
  return null
}

/**
 * Expand a seed spec with the artifacts it depends on, explicitly or implicitly:
 *  - the framework's supportFile (Cypress loads it before every spec, no import needed)
 *  - relative imports, recursively
 *  - files defining custom commands (cy.<name>) the spec or its support code uses
 * Also flags cy.task() calls: they run in the Node test-runner process, not in the browser.
 */
export function expandDependencies (docs, seed, { includeConfig = false } = {}) {
  const cfg = docs['cypress.config.ts'] || ''
  const supportFile = (cfg.match(/supportFile:\s*'([^']+)'/) || [])[1]
  const commandDef = {}
  for (const [f, src] of Object.entries(docs)) {
    for (const m of src.matchAll(/Cypress\.Commands\.add\(\s*'(\w+)'/g)) commandDef[m[1]] = f
  }
  const added = {}
  const queue = [seed]
  const add = (f, why) => { if (f && f !== seed && !added[f]) { added[f] = why; queue.push(f) } }
  if (supportFile && docs[supportFile] !== undefined) add(supportFile, 'implicit: supportFile in cypress.config.ts, loaded before every spec')
  while (queue.length) {
    const f = queue.shift()
    const src = docs[f]
    for (const m of src.matchAll(/import\s+(?:[^'"]*?from\s+)?['"]([^'"]+)['"]/g)) add(resolveImport(docs, f, m[1]), `imported by ${path.posix.basename(f)}`)
    for (const m of new Set([...src.matchAll(/\bcy\.(\w+)\(/g)].map(x => x[1]))) {
      if (commandDef[m]) add(commandDef[m], `defines cy.${m}() used in ${path.posix.basename(f)}`)
    }
  }
  const tasks = [...new Set([...docs[seed].matchAll(/cy\.task(?:<[^>]*>)?\(\s*'(\w+)'/g)].map(m => m[1]))].sort()
  const flags = tasks.map(t => {
    const m = cfg.match(new RegExp(`${t}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\s{8}\\}`))
    return { task: t, handler: m ? m[1].replace(/\s+/g, ' ').trim() : null }
  })
  if (includeConfig && flags.length) added['cypress.config.ts'] = 'defines cy.task handlers used by the spec (Node side)'
  return { added, flags }
}
