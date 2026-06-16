#!/usr/bin/env bash
#
# render.sh — render reference-architecture diagrams to looping GIFs in out/.
#
# Thin wrapper around `npm run render` (scripts/render-gifs.mjs) that lets you pick which
# diagrams to render: all of them, a specific id (or several), a number from the menu, or
# interactively. Diagram ids are discovered from src/diagrams/*.ts so this never drifts.
#
# Usage:
#   ./render.sh                      # interactive menu — pick by number(s), id(s), or "all"
#   ./render.sh all                  # render every diagram
#   ./render.sh observability        # render a single diagram by id
#   ./render.sh real-time vn-genai   # render several by id
#   ./render.sh -l | --list          # just list the available diagram ids and exit
#   ./render.sh -h | --help          # show this help
#
# Any other flags (e.g. RENDER_URL=...) are honored via the environment, same as `npm run render`.

set -euo pipefail
cd "$(dirname "$0")"

# Discover diagram ids straight from the source of truth (each DiagramDef declares `id: '...'`).
# Group by id prefix so the menu reads nicely: AWS (no prefix), Vendor-Neutral (vn-), Use Cases (uc-).
# (read loop instead of `mapfile` so this works on macOS's stock bash 3.2)
# index.ts declares COLLECTION ids (usecase/architecture/vendor-neutral), not diagrams — drop those.
ALL_IDS=()
while IFS= read -r id; do [ -n "$id" ] && ALL_IDS+=("$id"); done \
  < <(grep -rhoE "id: '[^']+'" src/diagrams/*.ts \
        | sed "s/id: '//;s/'//" \
        | grep -vxE "usecase|architecture|vendor-neutral" \
        | sort -u)

AWS_IDS=();  VN_IDS=();  UC_IDS=()
for id in "${ALL_IDS[@]}"; do
  case "$id" in
    vn-*) VN_IDS+=("$id") ;;
    uc-*) UC_IDS+=("$id") ;;
    *)    AWS_IDS+=("$id") ;;
  esac
done

# Ordered list used for numbering in the menu and for resolving numeric selections.
ORDERED=("${AWS_IDS[@]}" "${VN_IDS[@]}" "${UC_IDS[@]}")

usage() { sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; }

print_group() {
  local label="$1"; shift
  [ "$#" -eq 0 ] && return
  printf '\n  \033[1m%s\033[0m\n' "$label"
  for id in "$@"; do
    # find this id's 1-based index in ORDERED
    local n=1
    for o in "${ORDERED[@]}"; do [ "$o" = "$id" ] && break; n=$((n+1)); done
    printf '   %2d) %s\n' "$n" "$id"
  done
}

list_menu() {
  print_group "Architecture (AWS)"        "${AWS_IDS[@]}"
  print_group "Architecture (Vendor-Neutral)" "${VN_IDS[@]}"
  print_group "Use Cases"                 "${UC_IDS[@]}"
  printf '\n    a) all\n'
}

# Resolve a list of tokens (numbers and/or ids) into validated ids. Exits on bad input.
resolve_tokens() {
  local out=()
  for tok in "$@"; do
    if [[ "$tok" =~ ^[0-9]+$ ]]; then
      if (( tok >= 1 && tok <= ${#ORDERED[@]} )); then
        out+=("${ORDERED[$((tok-1))]}")
      else
        echo "✗ '$tok' is out of range (1-${#ORDERED[@]})." >&2; exit 1
      fi
    else
      local match=""
      for o in "${ORDERED[@]}"; do [ "$o" = "$tok" ] && match="$o" && break; done
      if [ -n "$match" ]; then
        out+=("$match")
      else
        echo "✗ Unknown diagram id: '$tok'. Use --list to see available ids." >&2; exit 1
      fi
    fi
  done
  printf '%s\n' "${out[@]}"
}

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
  -l|--list) list_menu; echo; exit 0 ;;
esac

SELECTION=()

# Run resolve_tokens via command substitution so a bad-input `exit 1` aborts the whole script
# (process substitution would swallow it), then split the validated ids into SELECTION.
set_selection() {
  local out
  out="$(resolve_tokens "$@")" || exit 1
  while IFS= read -r r; do [ -n "$r" ] && SELECTION+=("$r"); done <<< "$out"
}

if [ "$#" -eq 0 ]; then
  # Interactive
  echo "Which diagram(s) to render?"
  list_menu
  echo
  read -r -p "Enter number(s)/id(s) (space-separated), or 'all' [all]: " line
  line="${line:-all}"
  if [ "$line" = "all" ] || [ "$line" = "a" ]; then
    SELECTION=()  # empty → render all
  else
    # shellcheck disable=SC2086
    set_selection $line
  fi
elif [ "$1" = "all" ]; then
  SELECTION=()  # empty → render all
else
  set_selection "$@"
fi

if [ "${#SELECTION[@]}" -eq 0 ]; then
  echo "› Rendering ALL diagrams…"
  exec npm run render
else
  echo "› Rendering: ${SELECTION[*]}"
  exec npm run render -- "${SELECTION[@]}"
fi
