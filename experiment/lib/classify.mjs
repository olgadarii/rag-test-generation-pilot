// Heuristic failure attribution from Playwright error text. Every label is
// a first pass: the summary lists the raw messages so a human can confirm.
export function classify (msg, noTests = false) {
  const m = msg || ''
  if (/ERR_CONNECTION_REFUSED|ECONNREFUSED/.test(m)) return 'app_down_INVALID'
  if (/window\.task|task is not (defined|a function)|cy\.task|\bcy is not defined/i.test(m)) return 'server_side_logic'
  if (/addCookies|Cookie should have/i.test(m)) return 'api_or_syntax_error'
  if (/intercepts pointer events|cookie|overlay|mat-dialog|backdrop/i.test(m)) return 'overlay_blocked'
  if (/is not a function|has no (exported )?member|Property '.*' does not exist|Unknown (matcher|method)|toHaveDialog|not a valid selector|Unexpected token|SyntaxError|TransformError|Cannot find module/i.test(m)) return 'api_or_syntax_error'
  if (noTests || /No tests found/i.test(m)) return 'no_runnable_tests'
  if (/waiting for (locator|selector|getBy)|locator\.|resolved to 0 elements|element\(s\) not found/i.test(m)) return 'selector_not_found'
  if (/Timeout|timed out|exceeded/i.test(m)) return 'timeout'
  if (/expect\(|Expected|Received/i.test(m)) return 'assertion_failed'
  return 'other'
}
