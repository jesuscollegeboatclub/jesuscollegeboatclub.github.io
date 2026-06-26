/* JESUS COLLEGE BOAT CLUB — shared interactions
   Progressive enhancement: if JS is off, everything still shows. */
(function () {
  "use strict";

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
    btn.addEventListener("click", function () {
      var open = links.style.display === "flex";
      links.style.display = open ? "" : "flex";
      links.style.flexDirection = "column";
      links.style.position = "absolute";
      links.style.top = "74px";
      links.style.left = "0";
      links.style.right = "0";
      links.style.background = "rgba(23,20,17,.97)";
      links.style.padding = open ? "" : "20px 28px";
      links.style.gap = "14px";
    });
  }

  function init() { setupReveal(); setupMenu(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
