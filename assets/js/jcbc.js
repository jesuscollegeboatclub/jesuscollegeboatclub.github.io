/* JESUS COLLEGE BOAT CLUB — shared interactions
   Progressive enhancement: if JS is off, everything still shows. */
(function () {
  "use strict";

  /* ============================================================
     SHOP SWITCH — turn the online shop on or off in ONE place.
       false = Shop hidden from every menu, and the shop page shows
               a "coming soon" notice instead of products.
       true  = Shop live.
     Flip this to true once there's real stash to sell.
     ============================================================ */
  var SHOP_LIVE = false;

  function setupShopVisibility() {
    if (SHOP_LIVE) return;
    // 1) Hide every link to the shop, site-wide (top nav + mobile menu + footer).
    Array.prototype.forEach.call(
      document.querySelectorAll('a[href="merch.html"]'),
      function (a) { a.style.display = "none"; }
    );
    // 2) On the shop page itself, hide the basket + all product sections
    //    and drop in a friendly "coming soon" notice.
    var basket = document.getElementById("basketBtn");
    if (!basket) return;                 // not the shop page
    basket.style.display = "none";
    var hero = document.querySelector(".page-hero");
    // sections that should stay visible even while the shop is off (e.g. the books)
    var keep = document.querySelectorAll(".page-hero, .shop-keep");
    var kept = Array.prototype.slice.call(keep);
    Array.prototype.forEach.call(document.querySelectorAll("body > section"), function (s) {
      if (kept.indexOf(s) === -1) s.style.display = "none";
    });
    var anchor = kept.length ? kept[kept.length - 1] : hero;  // put notice after the last kept section
    if (anchor) {
      hero = anchor;
      var notice = document.createElement("section");
      notice.className = "bg-paper";
      notice.innerHTML =
        '<div class="wrap narrow" style="text-align:center">' +
        '<span class="eyebrow">Coming soon</span>' +
        '<h2 style="font-size:clamp(1.9rem,4vw,2.8rem);font-weight:900;margin:12px 0 14px">' +
        'The shop is being restocked</h2>' +
        '<p style="color:var(--ink-soft);max-width:560px;margin:0 auto 24px">' +
        'Our bicentenary stash is on its way. Check back soon &mdash; in the meantime, ' +
        'follow us on Instagram for the latest.</p>' +
        '<div class="btn-row center">' +
        '<a class="btn btn-primary" href="index.html">Back to home</a>' +
        '<a class="btn btn-outline" href="https://www.instagram.com/jesuscollegeboatclub/">' +
        '@jesuscollegeboatclub</a></div></div>';
      hero.parentNode.insertBefore(notice, hero.nextSibling);
    }
  }

  /* ---- 1. Scroll-reveal via IntersectionObserver ---- */
  function setupReveal() {
    var sel = ".sec-head, .card, .panel, .tile, .dl, .contact-card, " +
              ".tl-item, .media, .gallery, .dtable, .btn-row, .fb-meta, .fleet-facts";
    var els = Array.prototype.slice.call(document.querySelectorAll(sel));
    if (!("IntersectionObserver" in window) || !els.length) return;

    els.forEach(function (el, i) {
      el.classList.add("reveal");
      // gentle stagger for items that sit in a row
      var mod = i % 3;
      if (mod === 1) el.classList.add("d1");
      if (mod === 2) el.classList.add("d2");
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    els.forEach(function (el) { io.observe(el); });

    // safety net: reveal anything still hidden after load
    window.addEventListener("load", function () {
      setTimeout(function () {
        els.forEach(function (el) { el.classList.add("in"); });
      }, 1200);
    });
  }

  /* ---- 2. Mobile menu toggle ---- */
  function setupMenu() {
    var btn = document.querySelector(".menu-toggle");
    var links = document.querySelector(".navlinks");
    if (!btn || !links) return;
    function setOpen(open) {
      links.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.innerHTML = open ? "&times;" : "&#9776;";
    }
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!links.classList.contains("open"));
    });
    Array.prototype.forEach.call(links.querySelectorAll("a"), function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("click", function (e) {
      if (links.classList.contains("open") && !links.contains(e.target) && e.target !== btn) {
        setOpen(false);
      }
    });
  }

  function init() { setupShopVisibility(); setupReveal(); setupMenu(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
