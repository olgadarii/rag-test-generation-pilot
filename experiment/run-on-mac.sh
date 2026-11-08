#!/bin/bash
# One command, from macOS Terminal:
#   bash ~/Documents/Doctorat/rag-test-generation-pilot/experiment/run-on-mac.sh
# Installs what is missing (no sudo, everything under ./tools), starts Ollama + Juice Shop,
# runs the experiment, writes everything to ./results. Safe to re-run: finished runs are skipped.
set -u
cd "$(dirname "$0")" || exit 1
EXP="$(pwd)"; TOOLS="$EXP/tools"; JUICE_TAG="v20.3.0"; JV="${JUICE_TAG#v}"
RUNS="${RUNS:-3}"
mkdir -p "$TOOLS" results
exec > >(tee -a results/run.log) 2>&1
step () { echo; echo "=== $(date +%H:%M:%S) $* ==="; }
die () { echo; echo "EROARE: $*"; echo "(trimite-i lui Claude ultimele rânduri de mai sus)"; exit 1; }

step "Sistem"
echo "macOS $(sw_vers -productVersion) $(uname -m), RAM $(( $(sysctl -n hw.memsize) / 1073741824 )) GB"
command -v node >/dev/null || die "Node.js lipsește: instalează LTS de pe https://nodejs.org și rulează din nou."
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]'); echo "node $(node -v)"
PW="$EXP/../node_modules/.bin/playwright"
[ -x "$PW" ] || { (cd "$EXP/.." && npm install) || die "npm install în folderul pilotului a eșuat"; }

step "1/5 Ollama"
OLLAMA="$(command -v ollama || true)"
[ -z "$OLLAMA" ] && [ -x /Applications/Ollama.app/Contents/Resources/ollama ] && OLLAMA=/Applications/Ollama.app/Contents/Resources/ollama
[ -z "$OLLAMA" ] && OLLAMA="$(find "$TOOLS/ollama" -type f -name ollama -perm -u+x 2>/dev/null | head -1)"
if [ -z "$OLLAMA" ]; then
  echo "Ollama nu e instalat: îl descarc local în experiment/tools (~fără sudo)…"
  mkdir -p "$TOOLS/ollama"
  curl -fL --progress-bar https://github.com/ollama/ollama/releases/latest/download/ollama-darwin.tgz | tar -xz -C "$TOOLS/ollama" || die "descărcarea Ollama a eșuat"
  OLLAMA="$(find "$TOOLS/ollama" -type f -name ollama -perm -u+x | head -1)"
  [ -n "$OLLAMA" ] || die "nu găsesc binarul ollama în arhivă"
fi
echo "ollama: $OLLAMA"
if ! curl -s -m 2 http://127.0.0.1:11434/api/tags >/dev/null; then
  OLLAMA_MAX_LOADED_MODELS=1 nohup "$OLLAMA" serve >> results/ollama.log 2>&1 &
  for i in $(seq 40); do curl -s -m 2 http://127.0.0.1:11434/api/tags >/dev/null && break; sleep 1; done
  curl -s -m 2 http://127.0.0.1:11434/api/tags >/dev/null || die "serverul Ollama nu pornește (vezi results/ollama.log)"
fi
"$OLLAMA" pull qwen2.5:7b-instruct || die "pull qwen2.5:7b-instruct"
"$OLLAMA" pull bge-m3 || die "pull bge-m3"

step "2/5 Corpusul: suita Cypress din Juice Shop $JUICE_TAG"
if [ ! -f juice-src/VERSION ]; then
  rm -rf juice-src; mkdir -p juice-src
  curl -fsL "https://codeload.github.com/juice-shop/juice-shop/tar.gz/refs/tags/$JUICE_TAG" \
    | tar -xz --strip-components=1 -C juice-src "juice-shop-$JV/test/cypress" "juice-shop-$JV/cypress.config.ts" \
    || die "descărcarea surselor Juice Shop a eșuat"
  echo "juice-shop $JUICE_TAG" > juice-src/VERSION
fi
echo "$(find juice-src/test/cypress -name '*.ts' | wc -l | tr -d ' ') fișiere .ts în corpus"

step "3/5 Aplicația Juice Shop pe http://localhost:3000"
RESET=""
if curl -s -m 2 http://localhost:3000 | grep -qi "juice shop"; then
  echo "Juice Shop rulează deja pe :3000"
  if docker ps --format '{{.Names}} {{.Image}}' 2>/dev/null | grep -qi juice; then
    CN=$(docker ps --format '{{.Names}} {{.Image}}' | grep -i juice | head -1 | cut -d' ' -f1); RESET="docker restart $CN"
  elif [ -f juice.pid ]; then RESET="bash juice.sh restart"; fi
elif curl -s -m 2 -o /dev/null http://localhost:3000; then
  die "portul 3000 e ocupat de altă aplicație: oprește-o și rulează din nou"
elif command -v docker >/dev/null && docker info >/dev/null 2>&1; then
  docker rm -f juice-shop >/dev/null 2>&1
  docker run -d --name juice-shop -p 3000:3000 "bkimminich/juice-shop:$JUICE_TAG" || docker run -d --name juice-shop -p 3000:3000 "bkimminich/juice-shop:$JV" || die "docker run juice-shop"
  RESET="docker restart juice-shop"
else
  if [ ! -f juice-app.path ]; then
    curl -fsL "https://api.github.com/repos/juice-shop/juice-shop/releases/tags/$JUICE_TAG" -o "$TOOLS/release.json" || die "nu pot citi lista de pachete Juice Shop"
    PICK=$(node -e '
      const a=(require(process.argv[1]).assets||[]).map(x=>x.browser_download_url);
      const mac=a.filter(u=>/_(macos|darwin)_(arm64|x64)\.(tgz|zip)$/.test(u));
      console.error("pachete macOS: "+(mac.map(u=>u.split("/").pop()).join(", ")||"niciunul"));
      const have=+process.argv[2];
      const nodeOf=u=>+((u.match(/node(\d+)_/)||[])[1]||0);
      const score=u=>(nodeOf(u)===have?1000:0)+(/arm64/.test(u)?100:0)+({22:30,24:20,20:10}[nodeOf(u)]||0);
      mac.sort((x,y)=>score(y)-score(x));
      if(mac[0])console.log(mac[0]+" "+nodeOf(mac[0]))' "$TOOLS/release.json" "$NODE_MAJOR")
    [ -n "$PICK" ] || die "release-ul $JUICE_TAG nu are pachet pentru macOS (instalează Docker Desktop)"
    URL="${PICK% *}"; JNODE="${PICK##* }"
    echo "descarc $URL"
    mkdir -p "$TOOLS/juice"; PKG="$TOOLS/juice/$(basename "$URL")"
    curl -fL --progress-bar "$URL" -o "$PKG" || die "descărcarea pachetului Juice Shop"
    case "$PKG" in *.zip) unzip -q -o "$PKG" -d "$TOOLS/juice" ;; *) tar -xzf "$PKG" -C "$TOOLS/juice" ;; esac || die "dezarhivarea pachetului Juice Shop"
    APP=$(dirname "$(dirname "$(find "$TOOLS/juice" -path '*/build/app.js' | head -1)")")
    [ -f "$APP/build/app.js" ] || die "pachet Juice Shop neașteptat"
    if [ "$JNODE" != "$NODE_MAJOR" ]; then
      ARCH=arm64; case "$URL" in *_x64.*) ARCH=x64;; esac
      echo "Juice Shop cere Node $JNODE (ai Node $NODE_MAJOR): descarc Node $JNODE separat în experiment/tools"
      NV=$(curl -fsL "https://nodejs.org/dist/latest-v$JNODE.x/SHASUMS256.txt" | grep -o "node-v[0-9.]*-darwin-$ARCH.tar.gz" | head -1)
      [ -n "$NV" ] || die "nu găsesc Node $JNODE pentru macOS"
      rm -rf "$TOOLS/node$JNODE"; mkdir -p "$TOOLS/node$JNODE"
      curl -fL --progress-bar "https://nodejs.org/dist/latest-v$JNODE.x/$NV" | tar -xz --strip-components=1 -C "$TOOLS/node$JNODE" || die "descărcarea Node $JNODE"
      echo "$TOOLS/node$JNODE/bin/node" > juice-node.path
    else
      rm -f juice-node.path
    fi
    echo "$APP" > juice-app.path
  fi
  bash juice.sh start
  RESET="bash juice.sh restart"
fi
for i in $(seq 90); do curl -s -m 2 http://localhost:3000 | grep -qi "juice shop" && break; sleep 2; done
curl -s -m 2 http://localhost:3000 | grep -qi "juice shop" || die "Juice Shop nu răspunde pe :3000 (vezi results/juice.log)"
echo "Juice Shop OK; reset între rulări: ${RESET:-niciunul}"

step "4/5 Browser Playwright"
"$PW" install chromium || die "playwright install chromium"

step "5/5 Experimentul ($RUNS treceri × 2 user story-uri × 5 condiții). Ține laptopul deschis și la încărcător."
ARGS=(--juice juice-src --runs "$RUNS" --out results_v2); [ -n "$RESET" ] && ARGS=("${ARGS[@]}" --reset "$RESET")
caffeinate -dims node run.mjs "${ARGS[@]}" || die "experimentul s-a oprit (se poate relua: rulează din nou aceeași comandă)"
node summarize.mjs results_v2
step "GATA: rezultatele sunt în experiment/results_v2/summary.md"
