#!/usr/bin/env bash
# Regenerates the game-sized character art in public/art from the originals in art-src.
#
# Each original is cropped to the animal (the boxes below were measured from the alpha channel),
# resized to a fixed width (3x the size it is shown at, so it stays sharp on retina iPads), and
# flipped where the original faces left: the game expects every character to face RIGHT.
# Resizing is done on premultiplied alpha so the edges don't pick up dark/white fringes.
#
# Requires ffmpeg. Usage: npm run build:art
set -euo pipefail
cd "$(dirname "$0")/.."

# name  crop (w:h:x:y of the animal in the original)  output width  flip(0/1)
build() {
  local name=$1 crop=$2 width=$3 flip=$4
  local filters="crop=${crop},format=gbrap,premultiply=inplace=1,scale=${width}:-1:flags=lanczos,unpremultiply=inplace=1,format=rgba"
  if [ "$flip" = "1" ]; then filters="hflip,${filters}"; fi
  ffmpeg -v error -y -i "art-src/${name}.webp" -vf "$filters" -frames:v 1 "public/art/${name}.png"
  echo "public/art/${name}.png  $(sips -g pixelWidth -g pixelHeight "public/art/${name}.png" | awk '/pixel/{printf "%s ",$2}')px  $(du -k "public/art/${name}.png" | cut -f1)KB"
}

# Note: for flipped art the crop is applied AFTER the flip, so x is measured from the flipped left edge.
build lizard 1424:422:12:378 450 0   # 1448x1086 original, faces right
build snake  1752:718:10:92  510 0   # 1774x887 original, faces right
# turtle: original faces left (head at the left). Flip first, then crop the flipped image.
build turtle 1666:768:46:82  420 1   # 1774x887 original; after hflip the animal spans x 54..1704
