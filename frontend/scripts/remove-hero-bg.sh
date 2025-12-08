#!/usr/bin/env bash
# Remove near-white background from hero image using ImageMagick
# Usage: ./remove-hero-bg.sh [--fuzz PERCENT] [--color HEX] [--src PATH] [--out PATH]
# Example: ./remove-hero-bg.sh --fuzz 15% --color "#f6f6f6"
# Requires: ImageMagick (`magick` command) installed on your system.

set -euo pipefail

# Defaults
FUZZ="10%"
COLOR="#f6f6f6"
SRC="public/hero-pets.png"
OUT="public/hero-pets-transparent.png"

print_help(){
  cat <<EOF
Usage: $0 [options]

Options:
  --fuzz PERCENT      fuzz percentage to match near-colors (default: $FUZZ)
  --color HEX         color to make transparent (default: $COLOR)
  --src PATH          source image path (default: $SRC)
  --out PATH          output path (default: $OUT)
  -h, --help          show this help

Example:
  $0 --fuzz 20% --color "#f5f5f5"
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --fuzz)
      FUZZ="$2"; shift 2 ;;
    --color)
      COLOR="$2"; shift 2 ;;
    --src)
      SRC="$2"; shift 2 ;;
    --out)
      OUT="$2"; shift 2 ;;
    -h|--help)
      print_help; exit 0 ;;
    *)
      echo "Unknown arg: $1"; print_help; exit 1 ;;
  esac
done

if [ ! -f "$SRC" ]; then
  echo "Source image $SRC not found. Place your hero PNG at $SRC and re-run."
  exit 1
fi

echo "Creating transparent hero image: $OUT"
echo "  fuzz: $FUZZ"
echo "  color: $COLOR"
echo "  src: $SRC"

# Use ImageMagick to replace near-color pixels with transparency
magick convert "$SRC" -fuzz "$FUZZ" -transparent "$COLOR" "$OUT"

echo "Done. If the background isn't fully removed, try a larger --fuzz value (e.g. 15% or 20%) or a slightly different --color hex."
