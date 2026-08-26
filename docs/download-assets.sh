#!/usr/bin/env bash
# Downloads all JCBC assets that were still hosted on the old Wix site into the repo.
# RUN THIS ON YOUR MAC, from the repo root, BEFORE moving the domain:  bash docs/download-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p documents images/trustees
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
ok=0; fail=0
get(){ if curl -fsSL -A "$UA" "$2" -o "$1"; then echo "  ok  $1"; ok=$((ok+1)); else echo "  FAIL $1"; fail=$((fail+1)); fi; }

get "documents/code-of-conduct.pdf" "https://www.jesusboatclub.co.uk/_files/ugd/f736e6_45b0ff2ede1e4aba9377784c789d3040.pdf"
get "documents/constitution.pdf" "https://www.jesusboatclub.co.uk/_files/ugd/f736e6_8d4d76ea664d4d488a487e9578baa49a.pdf"
get "documents/fairbairn-coxes-notes-2025.pdf" "https://www.jesusboatclub.co.uk/_files/ugd/f736e6_eae597c55eb14deaabac36e8cb3facd5.pdf"
get "documents/fairbairn-rules-and-regulations-2025.pdf" "https://www.jesusboatclub.co.uk/_files/ugd/f736e6_074ca45cae5d4a44a17b642b9b7d56ec.pdf"
get "documents/fairbairn-safety-plan-2025.pdf" "https://www.jesusboatclub.co.uk/_files/ugd/f736e6_a0b9d5a0c8c8433ba2d0c7e88c6d5598.pdf"
get "documents/guest-code-of-conduct.pdf" "https://www.jesusboatclub.co.uk/_files/ugd/f736e6_20847aebae554879a07db8570339f7f4.pdf"
get "documents/information-brochure-experienced.pdf" "https://www.jesusboatclub.co.uk/_files/ugd/f736e6_7977d8200059431e89cae5b9037ef776.pdf"
get "documents/information-brochure-novice.pdf" "https://www.jesusboatclub.co.uk/_files/ugd/f736e6_21495b776769466784796fb49e973327.pdf"
get "documents/medical-screening-form.pdf" "https://www.jesusboatclub.co.uk/_files/ugd/f736e6_44be1bd9d0da44f4b1d136d33a07c3b6.pdf"
get "documents/safety-and-emergency-plan.pdf" "https://www.jesusboatclub.co.uk/_files/ugd/f736e6_d03c065fdaa4492aaee26c1f1473b1ed.pdf"
get "documents/sponsorship-brochure.pdf" "https://www.jesusboatclub.co.uk/_files/ugd/f736e6_0f94bb0cf0d44ba7b2506ee5d6e6ac70.pdf"
get "documents/trust-graduate-donor-form.pdf" "https://www.jesusboatclub.co.uk/_files/ugd/f736e6_b1d66291e6144f72ac301b671462d75f.pdf"
get "documents/trust-standing-order-form.pdf" "https://www.jesusboatclub.co.uk/_files/ugd/f736e6_95747c8e2bba4677b89767add945a04d.pdf"
get "images/steve-fairbairn.png" "https://static.wixstatic.com/media/f736e6_8e55dc025fa249379c3d38b60de5637b~mv2.png/v1/fill/w_640,h_800,al_c,q_85,enc_auto/file.png"
get "images/trustees/danny-white.jpg" "https://static.wixstatic.com/media/f736e6_9783b8eba10c41a69b12878880cef166~mv2.jpg/v1/fill/w_360,h_360,al_c,q_85,enc_auto/file.jpg"
get "images/trustees/david-reid.jpg" "https://static.wixstatic.com/media/f736e6_ee7752f3a3c7421d82a80ec44513a6f1.jpg/v1/fill/w_360,h_360,al_c,q_85,enc_auto/file.jpg"
get "images/trustees/david-wootton.jpg" "https://static.wixstatic.com/media/f736e6_d15ae3a5e3f94b48a8205a079b7a287f~mv2.jpg/v1/crop/x_111,y_89,w_690,h_963/fill/w_360,h_400,al_c,q_85,enc_auto/file.jpg"
get "images/trustees/ewan-pearson.jpg" "https://static.wixstatic.com/media/f736e6_a0676229d75841d3a4a5bc480888a84d.jpg/v1/fill/w_360,h_360,al_c,q_85,enc_auto/file.jpg"
get "images/trustees/helen-boldon.jpg" "https://static.wixstatic.com/media/f736e6_cdb4316754ff4338814c4e0a0bacdbbd.jpg/v1/crop/x_0,y_0,w_750,h_749/fill/w_360,h_360,al_c,q_85,enc_auto/file.jpg"
get "images/trustees/james-crockford.jpg" "https://static.wixstatic.com/media/f736e6_23e7d84c1a0145fc840793496540e40a~mv2.jpg/v1/fill/w_360,h_360,al_c,q_85,enc_auto/file.jpg"
get "images/trustees/jon-hutton.jpg" "https://static.wixstatic.com/media/f736e6_aca17ea1d3e741a3bc344c181d4c3d8b.jpg/v1/fill/w_360,h_360,al_c,q_85,enc_auto/file.jpg"
get "images/trustees/matt-jones.jpg" "https://static.wixstatic.com/media/f736e6_e92db30c043d49ce80ab7abd888aa0ac.jpg/v1/fill/w_360,h_360,al_c,q_85,enc_auto/file.jpg"
get "images/trustees/richard-tett.png" "https://static.wixstatic.com/media/f736e6_dbf23e917bd2429fa5502a96c2774756~mv2.png/v1/fill/w_360,h_360,al_c,q_85,enc_auto/file.png"
get "images/trustees/sheena-cassidy.png" "https://static.wixstatic.com/media/f736e6_697eb80c6ad948828776295a1b810882~mv2.png/v1/fill/w_360,h_360,al_c,q_85,enc_auto/file.png"

echo "Done. $ok downloaded, $fail failed."
if [ "$fail" -gt 0 ]; then echo "Some files failed - the old Wix site may need to be still live. Re-run before switching the domain."; fi
