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

  function init() { setupReveal(); setupMenu(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
