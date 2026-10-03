/* ==========================================================================
   Croft House — interactions
   Vanilla JS only. Every effect degrades gracefully and respects
   the user's reduced-motion preference.
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------- preloader */
  var pre = $('.preloader');
  var PRELOAD_MS = 1250;

  function hidePreloader() {
    if (!pre || pre.classList.contains('is-done')) return;
    pre.classList.add('is-done');
    window.setTimeout(function () {
      pre.setAttribute('hidden', '');
      pre.style.display = 'none';
    }, 750);
  }

  if (pre) {
    if (reduce.matches) { hidePreloader(); }
    else {
      document.documentElement.style.setProperty('overflow', '');
      var t0 = window.performance && performance.now ? performance.now() : Date.now();
      window.addEventListener('load', function () {
        var elapsed = (window.performance && performance.now ? performance.now() : Date.now()) - t0;
        window.setTimeout(hidePreloader, Math.max(0, PRELOAD_MS - elapsed));
      });
      /* hard safety net so the veil can never trap the visitor */
      window.setTimeout(hidePreloader, 2200);
    }
    document.body.style.overflow = 'hidden';
    window.setTimeout(function () { document.body.style.overflow = ''; }, reduce.matches ? 0 : PRELOAD_MS + 250);
  }

  /* ---------------------------------------------------------- nav on scroll */
  var nav = $('.nav');
  var lastKnown = 0;
  function onScrollNav() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('is-scrolled', y > 28);
    var wa = $('.wafloat');
    if (wa) wa.classList.toggle('is-on', y > window.innerHeight * 0.55);
    lastKnown = y;
  }

  /* ---------------------------------------------------------- hero parallax */
  var heroMedia = $('.hero__media');
  var ticking = false;
  function parallax() {
    if (heroMedia && !reduce.matches) {
      var y = lastKnown;
      if (y < window.innerHeight * 1.25) {
        heroMedia.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(2) + 'px,0)';
      }
    }
    ticking = false;
  }
  function onScroll() {
    onScrollNav();
    if (!ticking) { ticking = true; window.requestAnimationFrame(parallax); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScrollNav();

  /* ---------------------------------------------------------- drawer */
  var burger = $('.burger');
  var drawer = $('#drawer');

  function setDrawer(open) {
    if (!drawer || !burger) return;
    drawer.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('is-locked', open);
    if (open) {
      var first = $('.drawer__link', drawer);
      if (first) window.setTimeout(function () { first.focus(); }, 320);
    }
  }

  if (burger) {
    burger.addEventListener('click', function () {
      setDrawer(!drawer.classList.contains('is-open'));
    });
  }

  /* ---------------------------------------------------------- smooth anchor scroll */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      setDrawer(false);
      var top = target.getBoundingClientRect().top + window.pageYOffset - (window.innerWidth >= 1024 ? 68 : 56);
      window.scrollTo({ top: top, behavior: reduce.matches ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  /* ---------------------------------------------------------- reveals */
  var revealables = $$('[data-reveal], .rv-img');
  if ('IntersectionObserver' in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -9% 0px', threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* stagger children of a group */
  $$('[data-stagger]').forEach(function (group) {
    var step = parseInt(group.getAttribute('data-stagger'), 10) || 90;
    $$('[data-reveal]', group).forEach(function (el, i) {
      el.style.setProperty('--d', (i * step) + 'ms');
    });
  });

  /* ---------------------------------------------------------- scroll spy */
  var sections = $$('main section[id]');
  var navLinks = $$('.nav__link');
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.getAttribute('id');
        navLinks.forEach(function (l) {
          l.classList.toggle('is-active', l.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------------------------------------------------------- gallery lightbox */
  var items = $$('.mosaic__item');
  var lb = $('#lightbox');

  if (items.length && lb) {
    var lbImg = $('img', lb);
    var lbCap = $('.lightbox__cap', lb);
    var lbCount = $('.lightbox__count', lb);
    var index = 0;
    var lastFocus = null;

    function show(i) {
      index = (i + items.length) % items.length;
      var el = items[index];
      var img = $('img', el);
      var big = img.getAttribute('data-full') || img.currentSrc || img.src;
      lbImg.setAttribute('src', big);
      lbImg.setAttribute('alt', img.getAttribute('alt') || '');
      if (lbCap) lbCap.textContent = el.getAttribute('data-caption') || '';
      if (lbCount) lbCount.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0');
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      var close = $('.lightbox__close', lb);
      if (close) window.setTimeout(function () { close.focus(); }, 120);
    }

    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    items.forEach(function (el, i) {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.addEventListener('click', function () { open(i); });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });

    $$('[data-lb]', lb).forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.getAttribute('data-lb');
        if (act === 'close') close();
        if (act === 'next') show(index + 1);
        if (act === 'prev') show(index - 1);
      });
    });

    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'Tab') {
        var f = $$('button', lb);
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    /* touch swipe */
    var sx = 0, sy = 0;
    lb.addEventListener('touchstart', function (e) {
      sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ---------------------------------------------------------- map fallback */
  var map = $('.map');
  if (map) {
    var frame = $('iframe', map);
    var loaded = false;
    if (frame) {
      frame.addEventListener('load', function () { loaded = true; });
      window.setTimeout(function () { if (!loaded) map.classList.add('is-fallback'); }, 4200);
      frame.addEventListener('error', function () { map.classList.add('is-fallback'); });
    }
  }

  /* ---------------------------------------------------------- year */
  var yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------- reduced-motion, live */
  if (reduce.addEventListener) {
    reduce.addEventListener('change', function () {
      if (reduce.matches && heroMedia) heroMedia.style.transform = '';
    });
  }
})();
