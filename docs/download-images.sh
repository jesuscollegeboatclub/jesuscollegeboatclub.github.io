#!/usr/bin/env bash
# ============================================================
#  JCBC website — fetch all images into ./images and repoint
#  the site at them. Run once from the repo root:
#
#      bash download-images.sh
#
#  It downloads every photo currently hot-linked from the live
#  Wix site, saves it under a clear name in ./images, and then
#  rewrites the HTML so the pages use the local copies.
#  Safe to re-run.
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p images
BASE="https://static.wixstatic.com/media"

dl () {  # <url> <output-path>
  if curl -fsSL "$1" -o "$2"; then echo "  ok   $2"; else echo "  FAIL $2"; fi
}

echo "1/3  Background & content images…"
backgrounds=(
  "hero-home.jpg|f736e6_d2f8eb4e702c4168a20e33881875d09d~mv2.jpeg"
  "home-president.jpg|f736e6_9222be25591d4f2ba981ef528bb42715~mv2.jpg"
  "boathouse.jpg|f736e6_e27afed8aa7141afa247892a34e2e39c~mv2.jpeg"
  "coaching.jpg|f736e6_71ceb8c9741a442c93b0989d6fd1f887~mv2.jpeg"
  "novices.jpg|f736e6_270f7f216133427b982c989cd3a9a501~mv2.jpeg"
  "training-camp.png|f736e6_79558a82d98a448e904dcb30f96a0721~mv2.png"
  "eights.jpg|f736e6_01c45043dfdf4f8bbcceee1e608a029c~mv2.jpeg"
  "on-the-water.jpg|f736e6_63268eb112014a78be9ca912fbe47018~mv2.jpeg"
  "small-boats.jpg|f736e6_bf2c165ee3dd49519126da002e3fd16f~mv2.jpeg"
  "racing.jpg|f736e6_8ead62c074f147d6a464696ebb259aa6~mv2.jpeg"
  "fairbairn-course.jpg|f736e6_258c3162c61f4b9ba269b3d7ec375c74~mv2.jpeg"
)
for e in "${backgrounds[@]}"; do dl "$BASE/${e##*|}" "images/${e%%|*}"; done

echo "2/3  Committee photos (overwrite the placeholders)…"
# These keep the role-based filenames the committee page already uses.
committee=(
  "president.png|f736e6_88f6bb15c30e462692c420cac273744e~mv2.jpeg"
  "captainwomen.png|f736e6_991b6bbd19694406a162de2766c5bbdc~mv2.jpg"
  "captainmen.png|f736e6_1d1e1d9a7e0e43daa05c406dae870a8c~mv2.jpg"
  "coxingcaptain.png|f736e6_0be10ba5fd284837a48d341493d519a6~mv2.jpeg"
  "vicecaptainwomen.png|f736e6_c9405bd6da7e494d8f1321ede762edf7~mv2.jpg"
  "vicecaptainmen.png|f736e6_77b1e5c86c044d12bb1e9e43d5a467d0~mv2.jpg"
  "lowerboatcaptainwomen1.png|f736e6_d36cb080f56843fc8670bd1eb38546cf~mv2.jpeg"
  "lowerboatcaptainwomen2.png|f736e6_7fbb9105f54849b6968232828ca9c64c~mv2.jpeg"
  "lowerboatcaptainmen1.png|f736e6_7da9da9295ef4ed1b09e2f877bc65bd1~mv2.jpeg"
  "lowerboatcaptainmen2.png|f736e6_7da9da9295ef4ed1b09e2f877bc65bd1~mv2.jpeg"
  "webmaster.png|f736e6_de2c9f524c2e46de966420639124c5c6~mv2.jpg"
  "secretary.png|f736e6_a9d31fbea4324af6a0c51e4427621aac~mv2.jpg"
  "alumnioutreach.png|f736e6_5c78c1b435ef4c8abaec97aa3169c680~mv2.jpeg"
  "welfareofficer.png|f736e6_201af3465fa84d4994c3eafe64dbb0e0~mv2.jpeg"
  "socialsecretary.png|f736e6_27d5dd2ad3fa496dafc9f691df596c2b~mv2.jpeg"
  "sponsorshipofficer.png|f736e6_32d38bd7f3f547138fddfaf31affb82e~mv2.jpg"
  "assistantcoach.png|f736e6_767ca7f96ac24c37a00b574b0a7ca1a6~mv2.jpeg"
  "boathousedog.png|f736e6_558edfe08e3d440cadf41616e4e8bff9~mv2.jpg"
)
for e in "${committee[@]}"; do dl "$BASE/${e##*|}" "images/${e%%|*}"; done
echo "  note: treasurer.png, fairbairnssecretary.png and headcoach.png have no"
echo "        photo on the live site, so their placeholders are left in place."
echo "  note: Finn & Jake share one source photo (lowerboatcaptainmen1/2);"
echo "        crop each to the right person if you wish."

echo "3/3  Pointing the pages at the local images…"
map=(
  "d2f8eb4e702c4168a20e33881875d09d hero-home.jpg"
  "9222be25591d4f2ba981ef528bb42715 home-president.jpg"
  "e27afed8aa7141afa247892a34e2e39c boathouse.jpg"
  "71ceb8c9741a442c93b0989d6fd1f887 coaching.jpg"
  "270f7f216133427b982c989cd3a9a501 novices.jpg"
  "79558a82d98a448e904dcb30f96a0721 training-camp.png"
  "01c45043dfdf4f8bbcceee1e608a029c eights.jpg"
  "63268eb112014a78be9ca912fbe47018 on-the-water.jpg"
  "bf2c165ee3dd49519126da002e3fd16f small-boats.jpg"
  "8ead62c074f147d6a464696ebb259aa6 racing.jpg"
  "258c3162c61f4b9ba269b3d7ec375c74 fairbairn-course.jpg"
)
for m in "${map[@]}"; do
  h="${m%% *}"; n="${m##* }"
  perl -pi -e "s#https://static\\.wixstatic\\.com/media/f736e6_${h}[^\"')[:space:]]*#images/${n}#g" ./*.html
done

echo "Done. Every image is in ./images and the site now uses the local copies."
