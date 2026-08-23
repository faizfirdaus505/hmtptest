/* =================================================================
   HMTP — script.js
   Himpunan Mahasiswa Teknik Perancangan
   Politeknik Manufaktur Bandung

   DAFTAR ISI:
   ─────────────────────────────────────────────────────────────
   1. HELPERS         — debounce
   2. LOADER          — progress bar, panel split, reveal
   3. NAVIGASI        — hamburger, active link, scroll hide/show
   4. (dihapus — fitur bahasa dinonaktifkan)
   5. HERO            — parallax scroll & mouse, scroll button
   6. SMOOTH SCROLL   — anchor link
   7. CURSOR GLOW     — efek cahaya mengikuti kursor
   8. FADE-IN         — IntersectionObserver untuk sections
   =================================================================

   BUG FIXES dari versi sebelumnya:
   ─────────────────────────────────────────────────────────────
   ▸ navToggle / navMenu — selector salah (.site-nav__toggle,
     .site-nav__menu) → dibenarkan ke #navBurger / #mobileMenu
   ▸ menu-open / active  — kelas CSS tidak ada → diganti
     aria-expanded + is-open
   ▸ updateActiveLink    — "active" → "is-active" (sesuai CSS)
   ▸ (fitur langToggle dihapus)
   ▸ navLogoBtn          — tidak ada handler → scroll ke atas
   ▸ Parallax & scale    — dua handler yang konflik → digabung
   =================================================================
*/

'use strict';

/* ================================================================
   1. HELPERS
================================================================ */

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ================================================================
   2. LOADER
   Alur: progress 0→100% → fade konten → seam emas → panel buka
         → loader dihapus → body.is-revealed
================================================================ */

(function initLoader() {
  const loader             = document.getElementById('loader');
  const loaderContent      = document.getElementById('loaderContent');
  const loaderPercentValue = document.getElementById('loaderPercentValue');
  const loaderBarFill      = document.getElementById('loaderBarFill');

  if (!loader) return;

  let progress = 0;

  function animateProgress() {
    if      (progress < 25) progress += Math.random() * 7;
    else if (progress < 55) progress += Math.random() * 4;
    else if (progress < 80) progress += Math.random() * 2.5;
    else if (progress < 95) progress += Math.random() * 1.2;
    else if (progress < 99) progress += Math.random() * 0.4;
    else                    progress  = 100;

    progress = Math.min(progress, 100);

    if (loaderPercentValue) loaderPercentValue.textContent = Math.floor(progress);
    if (loaderBarFill)      loaderBarFill.style.width      = progress + '%';

    if (progress < 100) {
      setTimeout(animateProgress, 35);
    } else {
      finishLoader();
    }
  }

  function finishLoader() {
    if (loaderPercentValue) loaderPercentValue.textContent = '100';
    if (loaderBarFill)      loaderBarFill.style.width      = '100%';

    setTimeout(() => {                           // diam sebentar di 100%
      loaderContent?.classList.add('is-hidden');

      setTimeout(() => {                         // tunggu fade konten
        loader.classList.add('show-seam');

        setTimeout(() => {                       // tunggu seam emas muncul
          loader.classList.add('is-opening');

          setTimeout(() => {                     // tunggu panel membuka
            loader.remove();
            document.body.classList.add('is-revealed');
          }, 1200);
        }, 250);
      }, 450);
    }, 300);
  }

  window.addEventListener('load', animateProgress);
})();


/* ================================================================
   3. NAVIGASI
   ─ Hamburger menu mobile (aria-expanded + is-open)
   ─ Active link berdasarkan section yang terlihat
   ─ Sembunyikan nav saat scroll turun (is-hidden)
   ─ Logo klik → scroll ke atas
================================================================ */

(function initNav() {
  const nav        = document.getElementById('siteNav');
  const navBurger  = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  const navLogoBtn = document.getElementById('navLogoBtn');
  const allLinks   = document.querySelectorAll('[data-nav-link]');

  if (!nav) return;

  /* ─── Hamburger menu ─────────────────────────────────────── */

  function isMenuOpen() {
    return navBurger?.getAttribute('aria-expanded') === 'true';
  }

  function openMenu() {
    mobileMenu?.classList.add('is-open');
    mobileMenu?.removeAttribute('aria-hidden');
    navBurger?.setAttribute('aria-expanded', 'true');
    navBurger?.setAttribute('aria-label', 'Tutup menu navigasi');
    document.documentElement.classList.add('no-scroll');
  }

  function closeMenu() {
    mobileMenu?.classList.remove('is-open');
    mobileMenu?.setAttribute('aria-hidden', 'true');
    navBurger?.setAttribute('aria-expanded', 'false');
    navBurger?.setAttribute('aria-label', 'Buka menu navigasi');
    document.documentElement.classList.remove('no-scroll');
  }

  navBurger?.addEventListener('click', () => {
    isMenuOpen() ? closeMenu() : openMenu();
  });

  // Tutup saat link diklik
  allLinks.forEach(link => link.addEventListener('click', closeMenu));

  // Tutup dengan tombol Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isMenuOpen()) closeMenu();
  });

  // Tutup saat klik di luar area nav
  document.addEventListener('click', e => {
    if (isMenuOpen() && !nav.contains(e.target)) closeMenu();
  });

  // Tutup saat layar diperbesar ke ukuran desktop
  window.addEventListener('resize', debounce(() => {
    if (window.innerWidth >= 860) closeMenu();
  }, 150));

  /* ─── Logo → scroll ke atas ──────────────────────────────── */

  navLogoBtn?.addEventListener('click', () => {
    if (window.scrollY === 0) {
      window.location.reload();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  /* ─── Active link saat scroll ────────────────────────────── */

  const sections = document.querySelectorAll('section[id]');

  function updateActiveLinks() {
    const scrollPos = window.scrollY + 160;
    sections.forEach(sec => {
      const inView = scrollPos >= sec.offsetTop &&
                     scrollPos < sec.offsetTop + sec.offsetHeight;
      if (inView) {
        allLinks.forEach(link => {
          link.classList.toggle(
            'is-active',
            link.getAttribute('href') === '#' + sec.id
          );
        });
      }
    });
  }

  /* ─── Sembunyikan/tampilkan nav saat scroll ──────────────── */

  let lastScrollY = window.scrollY;
  let navTicking  = false;

  function updateNav() {
    const y = window.scrollY;

    // Latar nav sedikit lebih gelap setelah scroll > 40px
    nav.classList.toggle('is-scrolled', y > 40);

    // Sembunyikan saat scroll turun, tampilkan saat naik
    if (y > 150) {
      nav.classList.toggle('is-hidden', y > lastScrollY);
    } else {
      nav.classList.remove('is-hidden');
    }

    lastScrollY = y;
    updateActiveLinks();
    navTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!navTicking) {
      requestAnimationFrame(updateNav);
      navTicking = true;
    }
  });

  updateNav(); // inisialisasi posisi awal
})();


/* ================================================================
   3b. DROPDOWN NAV (desktop) & ACCORDION NAV (mobile)
   ─ Desktop: hover + klik untuk buka/tutup dropdown
   ─ Mobile : klik trigger untuk buka/tutup accordion
================================================================ */

(function initNavDropdowns() {

  /* ── Desktop dropdowns ──────────────────────────────────────── */
  const dropdowns = document.querySelectorAll('.nav-dropdown');

  function closeAllDropdowns(except) {
    dropdowns.forEach(dd => {
      if (dd === except) return;
      dd.classList.remove('is-open');
      const trigger = dd.querySelector('.nav-dropdown__trigger');
      const panel   = dd.querySelector('.nav-dropdown__menu');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (panel)   panel.setAttribute('aria-hidden', 'true');
    });
  }

  dropdowns.forEach(dd => {
    const trigger = dd.querySelector('.nav-dropdown__trigger');
    const panel   = dd.querySelector('.nav-dropdown__menu');
    if (!trigger || !panel) return;

    function openDD() {
      closeAllDropdowns(dd);
      dd.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      panel.setAttribute('aria-hidden', 'false');
    }

    function closeDD() {
      dd.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
    }

    function toggleDD() {
      dd.classList.contains('is-open') ? closeDD() : openDD();
    }

    // Klik trigger → toggle (buka/tutup)
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      toggleDD();
    });

    // Klik item di dalam panel → tutup dropdown
    panel.querySelectorAll('.nav-dropdown__item').forEach(item => {
      item.addEventListener('click', closeDD);
    });

    // Keyboard: Escape tutup
    dd.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeDD(); trigger.focus(); }
    });
  });

  // Klik di luar area dropdown → tutup semua
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-dropdown')) closeAllDropdowns(null);
  });

  /* ── Mobile accordions ─────────────────────────────────────── */
  const accordions = document.querySelectorAll('.mobile-accordion');

  accordions.forEach(acc => {
    const trigger = acc.querySelector('.mobile-accordion__trigger');
    const panel   = acc.querySelector('.mobile-accordion__panel');
    if (!trigger || !panel) return;

    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';

      // Close all other accordions first
      accordions.forEach(other => {
        if (other === acc) return;
        const ot = other.querySelector('.mobile-accordion__trigger');
        const op = other.querySelector('.mobile-accordion__panel');
        if (ot) ot.setAttribute('aria-expanded', 'false');
        if (op) { op.classList.remove('is-open'); op.setAttribute('aria-hidden', 'true'); }
      });

      // Toggle this one
      if (isOpen) {
        trigger.setAttribute('aria-expanded', 'false');
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        panel.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
      }
    });

    // Close accordion when an item link is clicked
    panel.querySelectorAll('.mobile-accordion__item').forEach(item => {
      item.addEventListener('click', () => {
        trigger.setAttribute('aria-expanded', 'false');
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
      });
    });
  });

  // Reset accordions when mobile menu closes
  const navBurger = document.getElementById('navBurger');
  if (navBurger) {
    navBurger.addEventListener('click', () => {
      // Small delay so close animation of menu runs first
      setTimeout(() => {
        if (navBurger.getAttribute('aria-expanded') === 'false') {
          accordions.forEach(acc => {
            const ot = acc.querySelector('.mobile-accordion__trigger');
            const op = acc.querySelector('.mobile-accordion__panel');
            if (ot) ot.setAttribute('aria-expanded', 'false');
            if (op) { op.classList.remove('is-open'); op.setAttribute('aria-hidden', 'true'); }
          });
        }
      }, 350);
    });
  }

})();





/* ================================================================
   5. HERO
   ─ Scroll parallax gambar & konten
   ─ Mouse parallax (desktop)
   ─ Tombol scroll ke section berikutnya
================================================================ */

(function initHero() {
  const hero        = document.querySelector('.hero');
  const heroMedia   = document.getElementById('heroMedia');
  const heroImage   = document.getElementById('heroImage');
  const heroContent = document.querySelector('.hero__content');
  const heroScroll  = document.getElementById('heroScroll');

  /* ─── Scroll parallax + skala gambar (digabung agar tidak konflik) ── */

  let ticking = false;

  function onScrollHero() {
    const y     = window.scrollY;
    const heroH = hero ? hero.offsetHeight : window.innerHeight;
    const p     = Math.min(y / heroH, 1); // progress: 0.0 (atas) → 1.0 (bawah hero)

    // Gambar latar: zoom in pelan → kesan perspektif & kedalaman
    if (heroImage) {
        heroImage.style.transform = `scale(${1 + p * 0.25})`;
    }

    // Teks: melambung ke atas & fade out
    if (heroContent) {
        heroContent.style.transform = `translateY(${y * -0.45}px)`;
        heroContent.style.opacity   = String(Math.max(1 - p * 2.2, 0));
    }

    ticking = false;
}

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(onScrollHero);
      ticking = true;
    }
  });

  /* ─── Mouse parallax gambar (hanya perangkat mouse) ─────────────── */

  const hasHover = window.matchMedia('(hover: hover)').matches;

  if (hero && heroImage && hasHover) {
    hero.addEventListener('mousemove', e => {
      const r  = hero.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width  - 0.5) * 14;
      const py = ((e.clientY - r.top)  / r.height - 0.5) * 14;
      heroImage.style.transform = `translate3d(${px}px,${py}px,0) scale(1.08)`;
    });

    hero.addEventListener('mouseleave', () => {
      heroImage.style.transform = 'translate3d(0,0,0) scale(1.08)';
    });
  }

  /* ─── Tombol scroll ke section berikutnya ────────────────────────── */

  heroScroll?.addEventListener('click', () => {
    const nextSection = document.querySelector('section:nth-of-type(2)');
    if (nextSection) {
      const navH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-height-mobile')
      ) || 68;
      window.scrollTo({ top: nextSection.offsetTop - navH, behavior: 'smooth' });
    }
  });
})();


/* ================================================================
   6. SMOOTH SCROLL UNTUK LINK ANCHOR
================================================================ */

(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-height-mobile')
      ) || 68;
      window.scrollTo({
        top: Math.max(target.offsetTop - navH, 0),
        behavior: 'smooth'
      });
    });
  });
})();


/* ================================================================
   7. CURSOR GLOW
   Efek cahaya emas transparan mengikuti kursor (desktop only)
================================================================ */

(function initCursorGlow() {
  // Hanya untuk perangkat yang punya mouse (bukan layar sentuh)
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  let mx = innerWidth / 2, my = innerHeight / 2;
  let gx = mx, gy = my;
  const HALF = 240; // setengah lebar/tinggi .cursor-glow (480px ÷ 2)

  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function animGlow() {
    gx += (mx - gx) * 0.12;
    gy += (my - gy) * 0.12;
    glow.style.transform = `translate(${gx - HALF}px,${gy - HALF}px)`;
    requestAnimationFrame(animGlow);
  })();
})();


/* ================================================================
   8. FADE-IN SECTIONS (IntersectionObserver)
   Tambahkan class "in-view" saat section masuk viewport
================================================================ */

(function initFadeIn() {
  if (!('IntersectionObserver' in window)) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        obs.unobserve(e.target); // cukup satu kali
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(
    '.section-placeholder, .konsen-card, .jurusan__stats'
  ).forEach(el => obs.observe(el));
})();


/* ================================================================
   9. BLUR SCROLL TEXT
   ─ Efek blur → tajam per kata saat paragraf digulir ke viewport
   ─ Terinspirasi dari lukebaffait.fr

   CARA UBAH TEKS:
   ▸ Ganti nilai di BLUR_TEXTS.id  → teks bahasa Indonesia
================================================================ */

(function initBlurScrollText() {

  /* ── Teks per bahasa ──────────────────────────────────── */
  const BLUR_TEXTS = {
    id: {
      'jurusan.stmt':
        'Program studi yang membentuk engineer visioner — mampu merancang solusi ' +
        'manufaktur masa depan dengan presisi teknis dan kepekaan estetika tinggi, ' +
        'menjawab tantangan industri global melalui inovasi yang berlandaskan ' +
        'keilmuan solid.'
    }
  };

  /* ── Pecah string menjadi <span class="blur-word">… ────── */
  function buildSpans(container, text) {
    /* Pertahankan spasi antar kata agar layout tidak berantakan */
    const tokens = text.trim().split(/(\s+)/);
    container.innerHTML = tokens
      .map(t => /^\s+$/.test(t) ? t : `<span class="blur-word">${t}</span>`)
      .join('');
    return Array.from(container.querySelectorAll('.blur-word'));
  }

  /* ── Hitung dan terapkan blur berdasarkan posisi scroll ── */
  function applyBlur(wordEls, container) {
    const rect = container.getBoundingClientRect();
    const vh   = window.innerHeight;

    /*
     * rawProgress:
     *   0.0  → elemen menyentuh 85% dari atas viewport  (mulai reveal)
     *   1.0  → elemen menyentuh 15% dari atas viewport  (selesai reveal)
     */
    const rawProgress = (vh * 0.85 - rect.top) / (vh * 0.20);

    const n = wordEls.length;
    wordEls.forEach((span, i) => {
      /*
       * Setiap kata mendapat "jatah" progres sendiri:
       * kata ke-0 mulai lebih dulu, kata terakhir mulai paling akhir.
       * Stagger range: 40% dari total progress.
       */
      const wordProgress = Math.min(1, Math.max(0,
        (rawProgress - (i / n) * 0.4) / 0.6
      ));

      span.style.opacity = 0.08 + wordProgress * 0.92;
      span.style.filter  = `blur(${(1 - wordProgress) * 10}px)`;
    });
  }

  /* ── Inisialisasi semua elemen .js-blur-text ──────────── */
  const containers = document.querySelectorAll('.js-blur-text[data-blur-key]');
  if (!containers.length) return;

  containers.forEach(container => {
    const key    = container.dataset.blurKey;
    const textId = BLUR_TEXTS.id[key];
    if (!textId) return;

    let wordEls = buildSpans(container, textId);

    /* Throttle via rAF agar tidak berat di scroll cepat */
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          applyBlur(wordEls, container);
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    applyBlur(wordEls, container); // inisialisasi posisi awal

  });

})();


/* ================================================================
   10. ABOUT — Scroll-driven Image Sequence + blur reveal kartu & teks
   ─ Canvas  : image sequence di-render via Canvas 2D API
   ─ Sequence: assets/about-sequence/esx_0001.webp … esx_0360.webp
   ─ Kartu   : blur 16px→0 secara bertahap, stagger tiap kartu
   ─ Teks    : blur-per-kata, sinkron scroll progress section
   ─ Smooth  : interpolasi lerp (currentFrame → targetFrame × 0.12)
   ─ Loop    : rendering dilakukan di requestAnimationFrame, bukan
               langsung di event scroll

   ALUR DATA:
     scroll → updateTargetFrame()   → targetFrame berubah
     rAF    → currentFrame lerp ke targetFrame
            → drawFrame()           → canvas diperbarui
            → renderFrame()         → bar / teks / kartu

   CARA PASANG FRAME:
   ▸ Buat folder output/assets/about-sequence/
   ▸ Export frame sebagai esx_0001.webp … esx_0360.webp
================================================================ */

(function initAboutScroll() {

  /* ══════════════════════════════════════════════════════════
     A. KONFIGURASI
  ══════════════════════════════════════════════════════════ */

  /** Jumlah total frame (harus cocok dengan jumlah file WebP). */
  const TOTAL_FRAMES = 240;
  /** Folder tempat frame berada. */
  const FRAME_DIR    = 'assets/about-sequence/';
  /** Prefix nama file. */
  const FRAME_PREFIX = 'esx-';
  /** Ekstensi file. */
  const FRAME_EXT    = '.webp';
  /**
   * Faktor lerp (0.0 = beku, 1.0 = langsung pindah).
   * 0.12 → animasi mulus seperti Apple / Nothing.
   */
  const LERP         = 0.12;

  /* ══════════════════════════════════════════════════════════
     B. ELEMEN DOM
  ══════════════════════════════════════════════════════════ */

  const section = document.querySelector('.about');
  if (!section) return;

  const canvas  = document.getElementById('aboutCanvas');
  if (!canvas)  return;

  const ctx     = canvas.getContext('2d');
  const fill    = document.getElementById('aboutVideoFill');
  const lbl     = document.getElementById('aboutVideoLbl');
  const ph      = document.getElementById('aboutCanvasPh');
  const phSub   = document.getElementById('aboutCanvasPhSub');
  const cards     = [...section.querySelectorAll('[data-about-card]')];
  const stmt      = section.querySelector('.about__stmt');
  const leftInner = section.querySelector('.about__left-inner');

  /* ══════════════════════════════════════════════════════════
     C. STATE ANIMASI
  ══════════════════════════════════════════════════════════ */

  /** Cache semua Image objects setelah preload. */
  let frames      = new Array(TOTAL_FRAMES);
  /** true setelah preloadFrames() selesai. */
  let isReady     = false;
  /** Frame saat ini (float). Diinterpolasi setiap rAF. */
  let currentFrame = 0;
  /** Target frame berdasarkan posisi scroll. */
  let targetFrame  = 0;
  /** Index frame terakhir yang di-draw — cegah redraw sia-sia. */
  let lastDrawn    = -1;

  /* ══════════════════════════════════════════════════════════
     D. KONSTANTA REVEAL (tidak diubah dari versi sebelumnya)
  ══════════════════════════════════════════════════════════ */

  const IS_MOBILE  = window.innerWidth <= 768;
  const TEXT_END   = IS_MOBILE ? 0.38 : 0.78;
  const CARD_START = [0.05, 0.25, 0.45];
  const CARD_WIN   = 0.22;

  /* ══════════════════════════════════════════════════════════
     E. TEKS DUA BAHASA (.about__stmt)
  ══════════════════════════════════════════════════════════ */

  const STMT = {
    id: 'Teknik Perancangan adalah disiplin ilmu yang berfokus pada perancangan sistem, komponen, ' +
        'dan proses manufaktur melalui penerapan ilmu keteknikan, matematika, serta teknologi ' +
        'modern. Mahasiswa dibekali kemampuan dalam gambar teknik, CAD, dan CAE untuk merancang ' +
        'berbagai produk seperti press tool, injection mold, jigs & fixtures, mesin perkakas,' +
        'mesin otomatis, hingga desain produk. Pembelajaran diperkuat dengan praktik industri dan ' +
        'tugas akhir sehingga lulusan siap menghadapi tantangan dunia manufaktur.'
  };

  let wordSpans = [];

  function buildStmtSpans(text) {
    if (!stmt) return;
    stmt.innerHTML = text.trim()
      .split(/(\s+)/)
      .map(t => /^\s+$/.test(t) ? t : `<span class="blur-word">${t}</span>`)
      .join('');
    wordSpans = [...stmt.querySelectorAll('.blur-word')];
  }

  buildStmtSpans(STMT.id);


  /* ══════════════════════════════════════════════════════════
     1. resizeCanvas()
     Sinkronkan resolusi canvas dengan ukuran kontainer.
     Dipanggil saat init dan saat resize window.
  ══════════════════════════════════════════════════════════ */

  function resizeCanvas() {
  const parent = canvas.parentElement;

  const cssW = parent.clientWidth;
  const cssH = parent.clientHeight;

  const dpr = window.devicePixelRatio || 1;

  canvas.width  = cssW * dpr;
  canvas.height = cssH * dpr;

  canvas.style.width  = cssW + "px";
  canvas.style.height = cssH + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (isReady) drawFrame(currentFrame + 0.5 | 0);
}

  /* ══════════════════════════════════════════════════════════
     2. preloadFrames()
     Muat seluruh 360 frame ke Image objects.
     Mengembalikan Promise — resolve setelah semua frame selesai.
     Error pada satu frame tidak menghentikan proses.
  ══════════════════════════════════════════════════════════ */

  function preloadFrames() {
    return new Promise(resolve => {
      let settled = 0;

      function onSettle() {
        settled++;

        /* Perbarui teks progress di placeholder */
        if (phSub) {
          const pct = Math.round(settled / TOTAL_FRAMES * 100);
          phSub.textContent = `Memuat animasi\u2026 ${pct}%`;
        }

        if (settled >= TOTAL_FRAMES) resolve();
      }

      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const n   = String(i + 1).padStart(4, '0');
        const img = new Image();
        img.onload  = onSettle;
        img.onerror = onSettle; /* tetap lanjut meski satu frame gagal dimuat */
        img.src     = `${FRAME_DIR}${FRAME_PREFIX}${n}${FRAME_EXT}`;
        frames[i]   = img;
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     3. drawFrame()
     Render satu frame ke canvas dengan perilaku object-fit: cover.
     Hanya menggambar jika Image sudah complete & ada naturalWidth.
  ══════════════════════════════════════════════════════════ */

  function drawFrame(frameIndex) {
    const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex | 0));
    const img = frames[idx];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    /* object-fit: cover — potong sisi yang lebih panjang */
const isMobile = window.innerWidth <= 1059;

let scale;

if (isMobile) {
    // HP & Tablet
    scale = Math.min(cw / iw, ch / ih) * 2;
} else {
    // Desktop
    scale = Math.max(cw / iw, ch / ih);
}

const dw = iw * scale;
const dh = ih * scale;

ctx.clearRect(0, 0, cw, ch);

ctx.drawImage(
    img,
    (cw - dw) * 0.5,
    (ch - dh) * 0.5,
    dw,
    dh
);

    lastDrawn = idx;
  }

  /* ══════════════════════════════════════════════════════════
     4. getProgress()
     Hitung progress scroll di dalam section (0.0 → 1.0).
     Sama persis dengan sistem sebelumnya — tidak ada perubahan.
  ══════════════════════════════════════════════════════════ */

  function getProgress() {
    const rect    = section.getBoundingClientRect();
    const sHeight = section.offsetHeight;   /* 200vh */
    const scrolled = -rect.top + window.innerHeight * 0.35;
    return Math.max(0, Math.min(1, scrolled / (sHeight - window.innerHeight)));
  }

  /* ══════════════════════════════════════════════════════════
     5. updateTargetFrame()
     Ubah targetFrame berdasarkan scroll progress.
     TIDAK melakukan draw — hanya set variabel.
     Rendering dilakukan di animate().
  ══════════════════════════════════════════════════════════ */

  function updateTargetFrame(p) {
    targetFrame = p * (TOTAL_FRAMES - 1);
  }

  /* ══════════════════════════════════════════════════════════
     6. renderFrame()
     Update elemen UI non-canvas: progress bar, teks, kartu.
     Dipanggil dari scroll listener dan saat resize.
  ══════════════════════════════════════════════════════════ */

  function updateBar(p) {
    if (fill) fill.style.transform = `scaleX(${p})`;
  }

  function updateText(p) {
    if (!wordSpans.length) return;

    if (p >= TEXT_END) {
      wordSpans.forEach(s => { s.style.opacity = '1'; s.style.filter = 'blur(0px)'; });
      return;
    }

    const textP = Math.max(0, Math.min(1, p / TEXT_END));
    const n     = wordSpans.length;

    wordSpans.forEach((s, i) => {
      const wP = Math.max(0, Math.min(1, (textP - (i / n) * 0.1) / 0.22));
      s.style.opacity = 0.15 + wP * 0.85;
      s.style.filter  = `blur(${(1 - wP) * 6}px)`;
    });
  }

  function updateCards(p) {
    cards.forEach((card, i) => {
      const start = CARD_START[i] ?? (0.05 + i * 0.2);

      if (p < start) {
        card.style.filter    = 'blur(16px)';
        card.style.opacity   = '0.04';
        card.style.transform = 'translateY(12px)';
      } else if (p >= start + CARD_WIN) {
        card.style.filter    = 'none';
        card.style.opacity   = '1';
        card.style.transform = 'translateY(0)';
      } else {
        const cP = (p - start) / CARD_WIN;
        card.style.filter    = `blur(${(1 - cP) * 16}px)`;
        card.style.opacity   = String(cP);
        card.style.transform = `translateY(${(1 - cP) * 12}px)`;
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     6b. updateLeftScroll()
     Geser konten kiri seiring progress scroll sehingga kiri dan
     kanan "berjalan bersama". Konten di-translateY dari 0 → -overflow.
     Tidak memakai CSS transition — dikendalikan rAF di renderFrame.
  ══════════════════════════════════════════════════════════ */

  function updateLeftScroll(p) {
    if (!leftInner) return;
    const containerH = leftInner.parentElement.offsetHeight;
    const contentH   = leftInner.scrollHeight;
    const maxScroll  = Math.max(0, contentH - containerH);
    leftInner.style.transform = `translateY(${-p * maxScroll}px)`;
  }

  function renderFrame(p) {
    updateBar(p);
    updateText(p);
    updateCards(p);
    updateLeftScroll(p);   /* kiri ikut scroll seiring animasi canvas */
  }

  /* ══════════════════════════════════════════════════════════
     7. animate()
     Loop utama requestAnimationFrame.
     Interpolasi currentFrame → targetFrame, lalu draw ke canvas.
     Hanya draw jika frame index berubah (cegah CPU sia-sia).
  ══════════════════════════════════════════════════════════ */

  function animate() {
    requestAnimationFrame(animate);

    if (!isReady) return; /* tunggu preload selesai */

    /* Lerp: gerak halus menuju targetFrame */
    currentFrame += (targetFrame - currentFrame) * LERP;

    /* Round cepat: (float + 0.5) | 0  ≡  Math.round(float) */
    const frameIdx = currentFrame + 0.5 | 0;

    /* Hanya draw jika frame index benar-benar berubah */
    if (frameIdx !== lastDrawn) {
      drawFrame(frameIdx);
    }
  }

  /* ══════════════════════════════════════════════════════════
     8. updateLabel()
     Update teks label overlay.
     Tidak perlu rAF — bisa langsung dari scroll event.
  ══════════════════════════════════════════════════════════ */

  let lblTimer;

  function updateLabel(p) {
    if (!lbl) return;
    clearTimeout(lblTimer);
    lbl.classList.add('is-active');
    lbl.textContent = `\u25B6 ${Math.round(p * 100)}%`;
    lblTimer = setTimeout(() => {
      lbl.classList.remove('is-active');
      lbl.textContent = '\u25B6 Scroll untuk memutar';
    }, 700);
  }

  /* ══════════════════════════════════════════════════════════
     SCROLL LISTENER
     Hanya mengubah targetFrame + update UI non-canvas.
     TIDAK melakukan draw langsung.
  ══════════════════════════════════════════════════════════ */

  window.addEventListener('scroll', () => {
    const p = getProgress();
    updateTargetFrame(p);  /* → animate() akan lerp & draw */
    updateLabel(p);        /* label tidak perlu rAF */
    renderFrame(p);        /* bar / teks / kartu */
  }, { passive: true });

  /* ══════════════════════════════════════════════════════════
     RESIZE LISTENER
  ══════════════════════════════════════════════════════════ */

  window.addEventListener('resize',
    debounce(() => {
      resizeCanvas();
      renderFrame(getProgress());
    }, 120),
    { passive: true }
  );

  /* ══════════════════════════════════════════════════════════
     START — Inisialisasi urutan
  ══════════════════════════════════════════════════════════ */

  /* 1. Sinkronkan ukuran canvas dengan kontainer */
  resizeCanvas();

  /* 2. Mulai loop rAF sekarang (akan skip draw sampai isReady = true) */
  animate();

  /* 3. Mulai preload seluruh frame */
  preloadFrames().then(() => {
    isReady = true;

    /* Sembunyikan placeholder dengan fade-out */
    if (ph) {
      ph.style.transition = 'opacity 0.5s ease';
      ph.style.opacity    = '0';
      setTimeout(() => { if (ph) ph.style.display = 'none'; }, 500);
    }

    /* Snap langsung ke posisi scroll saat ini tanpa lerp awal */
    const p0 = getProgress();
    updateTargetFrame(p0);
    currentFrame = targetFrame;   /* skip lerp untuk frame pertama */
    drawFrame(currentFrame + 0.5 | 0);
    renderFrame(p0);
  });

  /* 4. Render state awal (sebelum ada scroll) */
  renderFrame(getProgress());

})();


/* ================================================================
   9. STATISTIK — Scroll-triggered card animation
      • MASUK : kartu naik dari bawah, mulai dari KANAN (Mahasiswa)
                bergerak ke KIRI (Studio & Lab) — stagger 130ms
      • KELUAR: kartu turun, mulai dari KIRI (Studio & Lab)
                bergerak ke KANAN (Mahasiswa) — stagger 90ms
================================================================ */

(function initStatistik() {

  const section = document.getElementById('statistik');
  const header  = document.getElementById('statHeader');
  const rule    = document.getElementById('statRule');
  const cards   = section
    ? Array.from(section.querySelectorAll('.stat-card'))
    : [];

  if (!section || !cards.length) return;

  const STAGGER_IN  = 130;   /* ms antar kartu saat masuk (kanan→kiri) */
  const STAGGER_OUT = 90;    /* ms antar kartu saat keluar (kiri→kanan) */

  let timers = [];

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  /* ── Animasi MASUK ── */
  function animateIn() {
    clearTimers();
    header?.classList.remove('stat-out');
    header?.classList.add('stat-in');

    /* Kanan (i=4) masuk duluan, kiri (i=0) terakhir */
    cards.forEach((card, i) => {
      const delay = (cards.length - 1 - i) * STAGGER_IN;
      const t = setTimeout(() => {
        card.classList.remove('stat-out');
        card.classList.add('stat-in');
      }, delay);
      timers.push(t);
    });

    /* Rule muncul setelah semua kartu */
    const ruleDelay = (cards.length - 1) * STAGGER_IN + 280;
    const rt = setTimeout(() => {
      rule?.classList.remove('stat-out');
      rule?.classList.add('stat-in');
    }, ruleDelay);
    timers.push(rt);
  }

  /* ── Animasi KELUAR ── */
  function animateOut() {
    clearTimers();
    header?.classList.remove('stat-in');
    header?.classList.add('stat-out');
    rule?.classList.remove('stat-in');
    rule?.classList.add('stat-out');

    /* Kiri (i=0) keluar duluan, kanan (i=4) terakhir */
    cards.forEach((card, i) => {
      const delay = i * STAGGER_OUT;
      const t = setTimeout(() => {
        card.classList.remove('stat-in');
        card.classList.add('stat-out');
      }, delay);
      timers.push(t);
    });
  }

  /* ── IntersectionObserver ── */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) animateIn();
        else animateOut();
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  );

  io.observe(section);

})();

/* ============================================================
   STATISTIK MARQUEE
============================================================ */

(() => {

    const section = document.querySelector(".statistik");
    if (!section) return;

    const header  = section.querySelector(".statistik__header");
    const marquee = section.querySelector(".stat-marquee");
    const rule    = section.querySelector(".statistik__rule");

    const cards = section.querySelectorAll(".stat-card");

    /* -----------------------------
       Scroll Reveal
    ----------------------------- */

    const observer = new IntersectionObserver((entries)=>{

        entries.forEach(entry=>{

            if(entry.isIntersecting){

                header.classList.add("stat-in");
                marquee.classList.add("stat-in");
                rule.classList.add("stat-in");

                header.classList.remove("stat-out");
                marquee.classList.remove("stat-out");
                rule.classList.remove("stat-out");

            }else{

                header.classList.remove("stat-in");
                marquee.classList.remove("stat-in");
                rule.classList.remove("stat-in");

                header.classList.add("stat-out");
                marquee.classList.add("stat-out");
                rule.classList.add("stat-out");

            }

        });

    },{
        threshold:0.25
    });

    observer.observe(section);

    /* -----------------------------
       Hover Pause
    ----------------------------- */

    cards.forEach(card=>{

        card.addEventListener("mouseenter",()=>{

            marquee.classList.add("is-paused");

            cards.forEach(c=>c.classList.remove("is-hovered"));
            card.classList.add("is-hovered");

        });

        card.addEventListener("mouseleave",()=>{

            marquee.classList.remove("is-paused");

            card.classList.remove("is-hovered");

        });

    });

})();

/* ================================================================
   10. MATERI — 3D Coverflow + Semester Repository
   ─────────────────────────────────────────────────────────────────
   1. DATA        — Prodi, semester, link Google Drive
   2. COVERFLOW   — Carousel 3D (drag, swipe, arrows, keyboard)
   3. DROPDOWN    — Panel semester muncul dari kartu aktif
   4. INFO PANEL  — Detail semester + Google Drive button
   5. ENTRANCE    — Blur-in reveal saat section masuk viewport
================================================================ */

'use strict';

/* ── 1. DATA ──────────────────────────────────────────────────── */

const PRODI_DATA = {
  tppp: { code:'TPPP', name:'Teknik Perancangan Manufaktur',          badge:'DEA', idx:'01' },
  rpm: { code:'RPM', name:'Rekayasa Perancangan Mekanik',           badge:'DEB', idx:'02' },
  trpm: { code:'TRPM', name:'Teknologi Perancangan Perkakas Presisi', badge:'DEC', idx:'03' },
};

const SEMESTER_DATA = {
  tppp: {
    1:{title:'Fondasi Teknik & Matematika',  count:8,desc:'Pengenalan konsep dasar teknik, matematika terapan, dan pengantar gambar teknik serta material.'},
    2:{title:'Material & Proses Manufaktur', count:7,desc:'Material teknik, proses produksi, metrologi industri, dan pengujian sifat mekanik bahan.'},
    3:{title:'CAD & Perancangan Produk',     count:8,desc:'Pelatihan intensif software CAD 2D/3D, perancangan komponen mesin, dan analisis teknis geometri.'},
    4:{title:'Mold & Press Tool Design',     count:7,desc:'Perancangan cetakan injeksi plastik, sistem punch & die, serta tooling manufaktur terintegrasi.'},
    5:{title:'CAE & Simulasi Rekayasa',      count:8,desc:'Analisis tegangan FEA, simulasi aliran CFD, dan optimasi desain menggunakan software CAE modern.'},
    6:{title:'Otomasi & Jigs–Fixtures',      count:7,desc:'Perancangan jig, fixture, dan sistem otomasi manufaktur berbasis PLC dan kontrol numerik CNC.'},
  },
  rpm: {
    1:{title:'Dasar Rekayasa Mekanik',       count:8,desc:'Fondasi ilmu rekayasa, mekanika teknik, statika, dan pengantar termodinamika terapan.'},
    2:{title:'Dinamika & Kinematika Mesin',  count:7,desc:'Analisis dinamika, kinematika mesin, getaran mekanik, dan pengantar fenomena fluida.'},
    3:{title:'CAD Mekanik & Simulasi',       count:8,desc:'Perancangan komponen mekanik dengan software CAD profesional dan tools simulasi terintegrasi.'},
    4:{title:'Desain Elemen Mesin',          count:7,desc:'Perancangan roda gigi, poros, bantalan, kopling, rem, dan sistem transmisi daya mekanik.'},
    5:{title:'Rekayasa Sistem Mekanik',      count:8,desc:'Analisis sistem mekanik terintegrasi, kontrol mekanik, dan pengantar robotika industri.'},
    6:{title:'Manufaktur & Metrologi',       count:7,desc:'Teknik manufaktur presisi, pengukuran dimensi 3D, dan sistem manajemen kontrol kualitas.'},
    7:{title:'Proyek Rekayasa',              count:6,desc:'Implementasi proyek rekayasa mekanik nyata dalam konteks kerja industri mitra terpilih.'},
    8:{title:'Tugas Akhir',                  count:4,desc:'Proyek akhir rekayasa sebagai demonstrasi kompetensi vokasi bidang rekayasa mekanik.'},
  },
  trpm: {
    1:{title:'Dasar Perkakas & Material',    count:8,desc:'Pengenalan perkakas presisi, material teknik perkakas, dan proses pembentukan logam dasar.'},
    2:{title:'Gambar Teknik Presisi',        count:7,desc:'Gambar teknik lanjutan, toleransi ISO, geometri produk, dan pengantar metrologi presisi.'},
    3:{title:'CAD/CAM & Pemrograman CNC',    count:8,desc:'Integrasi CAD/CAM profesional dan pemrograman mesin CNC untuk perkakas presisi industri.'},
    4:{title:'Desain Tooling & Perkakas',    count:7,desc:'Perancangan tooling sistem, cutting tools, dan perkakas presisi terintegrasi untuk manufaktur.'},
    5:{title:'CNC Lanjutan & Otomasi',       count:8,desc:'Pemrograman CNC multi-sumbu, otomasi sel manufaktur, dan pengantar sistem robotika industri.'},
    6:{title:'Fabrikasi Non-Konvensional',   count:7,desc:'EDM, laser cutting, waterjet, dan additive manufacturing sebagai solusi perkakas presisi tinggi.'},
    7:{title:'Proyek Perkakas Industri',     count:6,desc:'Perancangan dan fabrikasi perkakas presisi nyata bersama mitra industri manufaktur unggulan.'},
    8:{title:'Tugas Akhir',                  count:4,desc:'Tugas akhir komprehensif dalam perancangan dan fabrikasi perkakas presisi industri manufaktur.'},
  },
};

const DRIVE_LINKS = {
  tppp: {1:'https://drive.google.com/drive/u/0/folders/1DfzL-8A4WXd7XvB7qZGiXvApIca9C_Nc',2:'',3:'',4:'',5:'',6:''},
  rpm: {1:'',2:'',3:'',4:'',5:'',6:'',7:'',8:''},
  trpm: {1:'',2:'',3:'',4:'',5:'',6:'',7:'',8:''},
};

const SEM_COLORS = [
  {bg:'#FFD84A',text:'rgba(0,0,0,.72)',  tag:'rgba(0,0,0,.38)'},
  {bg:'#F2C63D',text:'rgba(0,0,0,.72)',  tag:'rgba(0,0,0,.38)'},
  {bg:'#E6B532',text:'rgba(0,0,0,.7)',   tag:'rgba(0,0,0,.35)'},
  {bg:'#D39B18',text:'rgba(0,0,0,.75)',  tag:'rgba(0,0,0,.38)'},
  {bg:'#B88310',text:'rgba(255,255,255,.82)',tag:'rgba(255,255,255,.4)'},
  {bg:'#95650B',text:'rgba(255,255,255,.85)',tag:'rgba(255,255,255,.42)'},
  {bg:'#6F4A06',text:'rgba(255,255,255,.88)',tag:'rgba(255,255,255,.45)'},
  {bg:'#463003',text:'rgba(255,255,255,.88)',tag:'rgba(255,255,255,.45)'},
];

/* ── 2. COVERFLOW ─────────────────────────────────────────────── */

let _currentProdi = null;
let _currentSem   = null;

(function initCoverflow() {
  const track  = document.getElementById('cfTrack');
  const stage  = document.getElementById('cfStage');
  if (!track || !stage) return;

  const cards   = [...track.querySelectorAll('.cflow-card')];
  const prevBtn = document.getElementById('cfPrev');
  const nextBtn = document.getElementById('cfNext');
  const dots    = [...document.querySelectorAll('.cflow-dot')];
  const TOTAL   = cards.length;

  let activeIdx   = 0;
  let isDragging  = false;
  let dragStartX  = 0;
  let dragDeltaX  = 0;
  let wasDragging = false;
  let dragTimerId = null;

  function getGap() {
    const w = window.innerWidth;
    if (w < 560)  return 210;
    if (w < 860)  return 248;
    if (w < 1200) return 285;
    return 305;
  }

  function getT(offset) {
    if (offset === 0)
      return {tx:'-50%',tz:0,ry:0,sc:1,br:1,op:1,zi:10,pe:'auto'};
    const dir = offset > 0 ? 1 : -1;
    const abs = Math.abs(offset);
    const gap = getGap();
    return {
      tx: `calc(-50% + ${dir*gap*abs}px)`,
      tz: -220*abs,
      ry: dir * -35,
      sc: Math.max(0.60, 0.82-(abs-1)*.12),
      br: Math.max(0.22, 0.55-(abs-1)*.20),
      op: Math.max(0.22, 0.72-(abs-1)*.28),
      zi: 10-abs,
      pe: abs>1?'none':'auto',
    };
  }

  function render(instant) {
    cards.forEach((card,idx) => {
      const offset = idx - activeIdx;
      const t = getT(offset);
      if (instant) card.style.transition = 'none';
      card.style.transform     = `translateX(${t.tx}) translateY(-50%) translateZ(${t.tz}px) rotateY(${t.ry}deg) scale(${t.sc})`;
      card.style.filter        = `brightness(${t.br})`;
      card.style.opacity       = t.op;
      card.style.zIndex        = t.zi;
      card.style.pointerEvents = t.pe;
      card.classList.toggle('is-active', idx===activeIdx);
    });
    if (instant) requestAnimationFrame(()=>requestAnimationFrame(()=>cards.forEach(c=>c.style.transition='')));
    dots.forEach((d,i)=>d.classList.toggle('is-active',i===activeIdx));
    if (prevBtn) prevBtn.disabled = activeIdx===0;
    if (nextBtn) nextBtn.disabled = activeIdx===TOTAL-1;
  }

  function goTo(idx, source) {
    if (idx<0||idx>=TOTAL) return;
    if (idx===activeIdx && source!=='init') return;
    activeIdx = idx;
    render(false);
    notifyProdiChange(cards[activeIdx].dataset.prodi);
  }

  prevBtn?.addEventListener('click',()=>goTo(activeIdx-1,'btn'));
  nextBtn?.addEventListener('click',()=>goTo(activeIdx+1,'btn'));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>goTo(i,'dot')));

  cards.forEach((card,idx)=>{
    card.addEventListener('click',()=>{
      if (wasDragging){wasDragging=false;return;}
      if (idx!==activeIdx) goTo(idx,'card');
      else toggleCardDropdown();
    });
    card.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();idx===activeIdx?toggleCardDropdown():goTo(idx,'key');}
    });
  });

  document.addEventListener('click',e=>{
    const dd=document.getElementById('cardDropdown');
    if(!dd||!dd.classList.contains('is-open'))return;
    if(!dd.contains(e.target)&&!stage.contains(e.target)) closeCardDropdown();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCardDropdown();});

  stage.addEventListener('mousedown',e=>{
    if(e.button!==0)return;
    isDragging=true; dragStartX=e.clientX; dragDeltaX=0;
    stage.style.cursor='grabbing'; e.preventDefault();
  });
  window.addEventListener('mousemove',e=>{if(!isDragging)return; dragDeltaX=e.clientX-dragStartX;});
  window.addEventListener('mouseup',()=>{
    if(!isDragging)return;
    isDragging=false; stage.style.cursor='';
    if(Math.abs(dragDeltaX)>52){wasDragging=true;goTo(activeIdx+(dragDeltaX<0?1:-1),'drag');}
    else{clearTimeout(dragTimerId);dragTimerId=setTimeout(()=>{wasDragging=false;},50);}
  });

  let touchX0=0;
  stage.addEventListener('touchstart',e=>{touchX0=e.touches[0].clientX;},{passive:true});
  stage.addEventListener('touchend',e=>{
    const delta=e.changedTouches[0].clientX-touchX0;
    if(Math.abs(delta)>48)goTo(activeIdx+(delta<0?1:-1),'touch');
  });

  stage.setAttribute('tabindex','0');
  stage.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'){e.preventDefault();goTo(activeIdx-1,'key');}
    if(e.key==='ArrowRight'){e.preventDefault();goTo(activeIdx+1,'key');}
  });

  cards.forEach(card=>{
    const inner=card.querySelector('.cflow-card__inner');
    if(!inner)return;
    card.addEventListener('mousemove',e=>{
      if(!card.classList.contains('is-active'))return;
      const rect=card.getBoundingClientRect();
      const dx=(e.clientX-rect.left-rect.width/2)/(rect.width/2);
      const dy=(e.clientY-rect.top-rect.height/2)/(rect.height/2);
      inner.style.transform=`perspective(700px) rotateX(${dy*-5}deg) rotateY(${dx*5}deg)`;
    });
    card.addEventListener('mouseleave',()=>{inner.style.transform='';});
  });

  let resizeTimer;
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>render(true),120);});

  render(true);
  notifyProdiChange(cards[activeIdx].dataset.prodi);
}());

/* ── 3. DROPDOWN ──────────────────────────────────────────────── */

function notifyProdiChange(prodi) {
  if (prodi===_currentProdi) return;
  _currentProdi = prodi; _currentSem = null;
  const nameEl = document.getElementById('cdProdiName');
  if (nameEl) nameEl.textContent = PRODI_DATA[prodi]?.name ?? prodi.toUpperCase();
  buildDropdownOptions(prodi);
  closeCardDropdown();
  closeInfoPanel();
}

function openCardDropdown() {
  const dd   = document.getElementById('cardDropdown');
  const card = document.querySelector('.cflow-card.is-active');
  if (dd)   {dd.classList.add('is-open'); dd.setAttribute('aria-hidden','false');}
  if (card) card.classList.add('dd-open');
}
function closeCardDropdown() {
  const dd = document.getElementById('cardDropdown');
  if (dd) {dd.classList.remove('is-open'); dd.setAttribute('aria-hidden','true');}
  document.querySelectorAll('.cflow-card.dd-open').forEach(c=>c.classList.remove('dd-open'));
}
function toggleCardDropdown() {
  const dd = document.getElementById('cardDropdown');
  if (dd&&dd.classList.contains('is-open')) closeCardDropdown();
  else openCardDropdown();
}

function buildDropdownOptions(prodi) {
  const panel = document.getElementById('cardDropdownPanel');
  if (!panel) return;
  panel.innerHTML='';
  for (let s=1;s<=8;s++) {
    const col  = SEM_COLORS[s-1];
    const data = SEMESTER_DATA[prodi]?.[s];
    const opt  = document.createElement('button');
    opt.className = 'sem-option';
    opt.type      = 'button';
    opt.dataset.sem = s; opt.dataset.prodi = prodi;
    opt.setAttribute('role','option');
    opt.setAttribute('aria-label',`Semester ${s}: ${data?.title??''}`);
    opt.innerHTML=`
      <span class="sem-option__badge" style="background:${col.bg};color:${col.text}">
        <span class="sem-option__tag" style="color:${col.tag}">SEM</span>
        <span class="sem-option__num">${s}</span>
      </span>
      <span class="sem-option__content">
        <span class="sem-option__title">${data?.title??'—'}</span>
        <span class="sem-option__meta">${data?.count??'—'} Mata Kuliah</span>
      </span>
      <span class="sem-option__arrow" aria-hidden="true">→</span>`;
    opt.addEventListener('click',()=>{
      panel.querySelectorAll('.sem-option').forEach(o=>o.classList.remove('s-active'));
      opt.classList.add('s-active');
      closeCardDropdown();
      onSemSelect(prodi,s);
    });
    panel.appendChild(opt);
  }
}

/* ── 4. INFO PANEL ────────────────────────────────────────────── */

function onSemSelect(prodi, sem) {
  _currentSem = sem;
  const panel = document.getElementById('cardDropdownPanel');
  if (panel) panel.querySelectorAll('.sem-option').forEach(o=>o.classList.toggle('s-active',parseInt(o.dataset.sem)===sem));
  renderInfoPanel(prodi, sem);
}

function renderInfoPanel(prodi, sem) {
  const wrap  = document.getElementById('infoWrap');
  const data  = SEMESTER_DATA[prodi]?.[sem];
  const link  = DRIVE_LINKS[prodi]?.[sem];
  const pData = PRODI_DATA[prodi];
  if (!wrap||!data) return;
  const q = id => document.getElementById(id);
  if (q('infoTag'))   q('infoTag').textContent   = pData?.name??prodi.toUpperCase();
  if (q('infoSem'))   q('infoSem').textContent   = `SEMESTER ${sem}`;
  if (q('infoTitle')) q('infoTitle').textContent = data.title;
  if (q('infoCount')) q('infoCount').textContent = data.count;
  if (q('infoDesc'))  q('infoDesc').textContent  = data.desc;
  const btn = q('driveBtn');
  if (btn) {
    if (link&&link.trim()) {
      btn.href=link; btn.classList.remove('no-link');
      btn.onclick=null; btn.setAttribute('aria-disabled','false');
    } else {
      btn.href='#'; btn.classList.add('no-link');
      btn.setAttribute('aria-disabled','true');
      btn.onclick=e=>e.preventDefault();
    }
  }
  wrap.classList.add('i-open');
}

function closeInfoPanel() {
  const wrap = document.getElementById('infoWrap');
  if (wrap) wrap.classList.remove('i-open');
}

/* ── 5. ENTRANCE — blur-in/out saat section masuk/keluar viewport */

(function initMateriEntrance() {
  const section = document.getElementById('materi');
  if (!section) return;

  const header = section.querySelector('.materi__header');
  const stage  = document.getElementById('cfStage');
  const dots   = document.getElementById('cfDots');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        header?.classList.add('m-in');    header?.classList.remove('m-out');
        stage?.classList.add('m-in');     stage?.classList.remove('m-out');
        dots?.classList.add('m-in');      dots?.classList.remove('m-out');
      } else {
        header?.classList.remove('m-in'); header?.classList.add('m-out');
        stage?.classList.remove('m-in');  stage?.classList.add('m-out');
        dots?.classList.remove('m-in');   dots?.classList.add('m-out');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

  obs.observe(section);
}());

/* ================================================================
   9. PROYEK — Galeri Karya Mahasiswa + Modal
   Blur-in / blur-out via IntersectionObserver (pola identik materi)
================================================================ */

(function initProyek() {
  'use strict';

  /* ── DATA PROYEK ─────────────────────────────────────────────
     Tambah/edit objek di array ini untuk menambah karya.
     media.type: 'image' | '3d' | 'placeholder'
     media.src : path file gambar/3D, atau null
  ─────────────────────────────────────────────────────────── */
  var DATA = [
    {
      id:'p1', num:'01', prodi:'DEA',
      title:'Progressive Die Stamping',
      author:'Ahmad Fadlilah  ·  DEA 2022',
      desc:'Perancangan progressive die stamping untuk komponen bracket otomotif berbahan SPCC 1,2 mm. Desain mencakup operasi blanking, bending, dan drawing dalam satu rangkaian. Analisis gaya potong dan estimasi umur pakai die dilakukan dengan simulasi FEM.',
      color:'#100800',
      media:[
        {type:'placeholder', label:'Tampak Isometrik',  icon:'cube'},
        {type:'placeholder', label:'Detail Punch & Die', icon:'detail'},
        {type:'placeholder', label:'Hasil Produk',       icon:'product'},
      ]
    },
    {
      id:'p2', num:'02', prodi:'DEB',
      title:'Jig Pengeboran Presisi',
      author:'Reza Pratama  ·  DEB 2021',
      desc:'Perancangan jig pengeboran untuk komponen blok mesin dengan 8 lubang diameter 8 mm toleransi H7. Sistem locating menggunakan pin silinder dan rest pad untuk akurasi posisi ±0,02 mm.',
      color:'#001308',
      media:[
        {type:'placeholder', label:'Assembly Jig',    icon:'cube'},
        {type:'placeholder', label:'Detail Locating', icon:'detail'},
      ]
    },
    {
      id:'p3', num:'03', prodi:'DEC',
      title:'Injection Mold Tutup Botol',
      author:'Siti Nurhaliza  ·  DEC 2023',
      desc:'Perancangan cetakan injeksi plastik untuk produksi tutup botol minuman 30 ml berbahan PP dengan conformal cooling channel. Simulasi aliran material dan warpage dilakukan dengan Moldflow.',
      color:'#080018',
      media:[
        {type:'placeholder', label:'Cavity & Core', icon:'cube'},
        {type:'placeholder', label:'Runner System', icon:'detail'},
        {type:'placeholder', label:'Produk Akhir',  icon:'product'},
        {type:'3d',          label:'3D Interaktif', src:null},
      ]
    },
    {
      id:'p4', num:'04', prodi:'DEB',
      title:'Mesin Bending Semi-Otomatis',
      author:'Dimas Aditya  ·  DEB 2022',
      desc:'Perancangan mesin bending pelat baja 3 mm kapasitas 300 mm dengan sistem hidrolik 50 bar. Kontrol sudut bending menggunakan sensor rotary encoder dan PLC.',
      color:'#0a0a00',
      media:[
        {type:'placeholder', label:'Mesin Keseluruhan', icon:'cube'},
        {type:'placeholder', label:'Sistem Hidrolik',   icon:'detail'},
      ]
    },
    {
      id:'p5', num:'05', prodi:'DEA',
      title:'Fixture Welding Chasis',
      author:'Nur Aini Safitri  ·  DEA 2023',
      desc:'Fixture pengelasan rangka chasis kendaraan roda tiga dengan 12 titik clamp. Mempertahankan toleransi geometri ±0,1 mm setelah proses pengelasan GMAW.',
      color:'#100005',
      media:[
        {type:'placeholder', label:'Fixture Assembly', icon:'cube'},
        {type:'placeholder', label:'Detail Clamp',     icon:'detail'},
        {type:'placeholder', label:'Proses Welding',   icon:'product'},
      ]
    },
    {
      id:'p6', num:'06', prodi:'DEC',
      title:'Optimasi Desain Sprocket',
      author:'Rizki Maulana  ·  DEC 2021',
      desc:'Optimasi sprocket rantai motor menggunakan FEA Ansys Workbench. Pengurangan massa 23% dengan Al 7075 tanpa mengurangi batas fatigue cycle minimum 10⁶ siklus.',
      color:'#000f10',
      media:[
        {type:'placeholder', label:'Model 3D',      icon:'cube'},
        {type:'placeholder', label:'Analisis FEA',  icon:'detail'},
        {type:'3d',          label:'3D Interaktif', src:null},
      ]
    },
  ];

  /* ── Ikon SVG inline ──────────────────────────────────────── */
  function icon(type, s) {
    s = s || 36;
    if (type === 'cube')
      return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.1"><path d="M18 4L4 11v14l14 7 14-7V11L18 4z"/><path d="M4 11l14 7 14-7"/><line x1="18" y1="18" x2="18" y2="32"/></svg>';
    if (type === 'detail')
      return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.1"><rect x="5" y="5" width="26" height="26"/><line x1="10" y1="13" x2="26" y2="13"/><line x1="10" y1="18" x2="26" y2="18"/><line x1="10" y1="23" x2="20" y2="23"/></svg>';
    return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.1"><circle cx="18" cy="15" r="8"/><path d="M8 31c0-5.5 4.5-10 10-10s10 4.5 10 10"/></svg>';
  }

  /* FIX: expose DATA agar devmode.js bisa edit/hapus kartu statis */
  window.hmtpProyekStaticData = DATA;

  /* ── Bangun Grid Kartu ────────────────────────────────────── */
  var grid = document.getElementById('proyekGrid');
  if (!grid) return;

  DATA.forEach(function(p) {
    var card = document.createElement('article');
    card.className = 'proyek-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Buka proyek: ' + p.title);
    card.setAttribute('data-proyek-id', p.id); /* FIX: ID untuk devmode */

    var has3d = p.media.some(function(m){ return m.type === '3d'; });

    card.innerHTML =
      '<div class="proyek-card__bg" style="background:'+p.color+'">'+
        icon(p.media[0].icon || 'cube', 40)+
      '</div>'+
      '<div class="proyek-card__overlay"></div>'+
      '<span class="proyek-card__num">'+p.num+'</span>'+
      '<span class="proyek-card__tag">'+p.prodi+'</span>'+
      '<div class="proyek-card__info">'+
        '<p class="proyek-card__name">'+p.title+'</p>'+
        '<p class="proyek-card__author">'+p.author+'</p>'+
      '</div>'+
      '<span class="proyek-card__media">'+
        '<svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1" y="1.5" width="7" height="6"/><line x1="3.5" y1="1.5" x2="3.5" y2="7.5"/></svg>'+
        ' '+p.media.length+(has3d ? ' · 3D' : '')+
      '</span>';

    card.addEventListener('click',   function(){  openModal(p); });
    card.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openModal(p); } });
    grid.appendChild(card);
  });

  /* ── Entrance + Exit blur observer ───────────────────────── */
  if ('IntersectionObserver' in window) {

    /* Header */
    var ioH = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.add('p-in');    e.target.classList.remove('p-out');
        } else {
          e.target.classList.remove('p-in'); e.target.classList.add('p-out');
        }
      });
    }, { threshold: 0.2 });
    var hdr = document.getElementById('proyekHeader');
    if (hdr) ioH.observe(hdr);

    /* Tombol tambah */
    var addBtn = document.getElementById('proyekAddBtn');
    if (addBtn) ioH.observe(addBtn);

    /* Kartu — staggered delay */
    var ioC = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.add('p-in');    e.target.classList.remove('p-out');
        } else {
          e.target.classList.remove('p-in'); e.target.classList.add('p-out');
        }
      });
    }, { threshold: 0.1 });

    grid.querySelectorAll('.proyek-card').forEach(function(c, i) {
      c.style.transitionDelay = (i * 0.07) + 's';
      ioC.observe(c);
    });
  }

  /* ── Modal ────────────────────────────────────────────────── */
  var modal      = document.getElementById('proyekModal');
  var backdrop   = document.getElementById('proyekModalBackdrop');
  var closeBtn   = document.getElementById('proyekModalClose');
  var slidesEl   = document.getElementById('proyekModalSlides');
  var sliderLeft = document.getElementById('proyekModalLeft');
  var prevBtn    = document.getElementById('proyekModalPrev');
  var nextBtn    = document.getElementById('proyekModalNext');
  var dotsEl     = document.getElementById('proyekModalDots');
  var counterEl  = document.getElementById('proyekModalCounter');
  var nameEl     = document.getElementById('proyekModalName');
  var authorEl   = document.getElementById('proyekModalAuthor');
  var descEl     = document.getElementById('proyekModalDesc');
  var numEl      = document.getElementById('proyekModalNum');
  var prodiEl    = document.getElementById('proyekModalProdi');
  var btn3d      = document.getElementById('proyekUpload3dBtn');
  var inp3d      = document.getElementById('proyekUpload3dInput');

  if (!modal) return;

  var curProject = null;
  var curIdx     = 0;
  var mediaList  = [];

  /* Buka / tutup */
  /* Expose ke devmode.js agar proyek dinamis bisa pakai modal yang sama */
  window.proyekOpenModal = function(p) { openModal(p); };

  function openModal(p) {
    curProject = p;
    curIdx     = 0;
    mediaList  = p.media ? p.media.slice() : [];

    if (numEl)    numEl.textContent    = p.num;
    if (prodiEl)  prodiEl.textContent  = p.prodi;
    if (nameEl)   nameEl.textContent   = p.title;
    if (authorEl) authorEl.textContent = p.author;
    if (descEl)   descEl.textContent   = p.desc;

    buildSlides();
    goTo(0, false);

    modal.classList.add('is-open');
    modal.removeAttribute('aria-hidden');
    document.documentElement.classList.add('no-scroll');
    setTimeout(function(){ if (closeBtn) closeBtn.focus(); }, 100);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('no-scroll');
    if (slidesEl) {
      slidesEl.querySelectorAll('model-viewer').forEach(function(mv){
        if (mv.src && mv.src.startsWith('blob:')) URL.revokeObjectURL(mv.src);
      });
    }
  }

  if (backdrop) backdrop.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', function(e) {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape')      closeModal();
    if (e.key === 'ArrowLeft')   goTo(curIdx - 1);
    if (e.key === 'ArrowRight')  goTo(curIdx + 1);
  });

  /* Bangun slide */
  function buildSlides() {
    if (!slidesEl || !dotsEl) return;
    slidesEl.innerHTML = '';
    dotsEl.innerHTML   = '';
    slidesEl.style.transform  = 'translateX(0)';
    slidesEl.style.transition = 'none';

    mediaList.forEach(function(m, i) {
      var slide = document.createElement('div');
      slide.className = 'proyek-modal__slide';

      if (m.type === 'image' && m.src) {
        var img = document.createElement('img');
        img.src = m.src; img.alt = m.label || ''; img.loading = 'lazy'; img.draggable = false;
        slide.appendChild(img);
      } else if (m.type === '3d' && m.src) {
        slide.innerHTML =
          '<model-viewer src="'+m.src+'" auto-rotate camera-controls '+
          'shadow-intensity="0.4" exposure="0.9" '+
          'style="width:100%;height:100%;background:transparent;" '+
          'alt="'+(m.label || '3D Model')+'"></model-viewer>';
      } else {
        slide.classList.add('proyek-modal__slide--ph');
        slide.style.setProperty('--_ph-bg', curProject.color || '#111');
        slide.innerHTML =
          '<div class="ph-icon">'+icon(m.icon || 'cube', 36)+'</div>'+
          '<span class="ph-lbl">'+(m.label || 'Slide '+(i+1))+'</span>';
      }

      var badge = document.createElement('span');
      badge.className = 'proyek-modal__slide-type';
      badge.textContent = m.type === '3d' ? '3D MODEL' : m.type === 'image' ? 'IMAGE' : 'PREVIEW';
      slide.appendChild(badge);
      slidesEl.appendChild(slide);

      var dot = document.createElement('button');
      dot.className = 'proyek-modal__dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Slide '+(i+1));
      (function(idx){ dot.addEventListener('click', function(){ goTo(idx); }); })(i);
      dotsEl.appendChild(dot);
    });
  }

  /* Navigasi slide */
  function goTo(idx, animate) {
    var total = mediaList.length;
    if (!total) return;
    curIdx = Math.max(0, Math.min(idx, total - 1));

    if (slidesEl) {
      slidesEl.style.transition = animate === false
        ? 'none'
        : 'transform .4s cubic-bezier(0.16,1,0.3,1)';
      slidesEl.style.transform = 'translateX('+(-curIdx * 100)+'%)';
    }

    if (dotsEl) dotsEl.querySelectorAll('.proyek-modal__dot').forEach(function(d,i){
      d.classList.toggle('is-active', i === curIdx);
    });

    if (counterEl) counterEl.textContent = (curIdx+1)+' / '+total;
    if (prevBtn)   prevBtn.disabled = (curIdx === 0);
    if (nextBtn)   nextBtn.disabled = (curIdx === total - 1);
  }

  if (prevBtn) prevBtn.addEventListener('click', function(){ goTo(curIdx - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function(){ goTo(curIdx + 1); });

  /* Swipe & drag */
  var startX = 0, dragging = false;
  function dragStart(x){ startX = x; dragging = true; }
  function dragEnd(x){
    if (!dragging) return; dragging = false;
    var diff = x - startX;
    if      (diff < -45) goTo(curIdx + 1);
    else if (diff >  45) goTo(curIdx - 1);
  }
  if (sliderLeft) {
    sliderLeft.addEventListener('touchstart', function(e){ dragStart(e.touches[0].clientX); }, {passive:true});
    sliderLeft.addEventListener('touchend',   function(e){ dragEnd(e.changedTouches[0].clientX); }, {passive:true});
    sliderLeft.addEventListener('mousedown',  function(e){ dragStart(e.clientX); e.preventDefault(); });
  }
  document.addEventListener('mouseup', function(e){ dragEnd(e.clientX); });

  /* Upload 3D */
  if (btn3d) btn3d.addEventListener('click', function(){ if (inp3d) inp3d.click(); });
  if (inp3d) inp3d.addEventListener('change', function(e){
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'glb' && ext !== 'gltf'){ alert('Format didukung: .glb atau .gltf'); inp3d.value=''; return; }
    var url = URL.createObjectURL(file);
    mediaList.push({type:'3d', label:file.name, src:url});
    buildSlides();
    goTo(mediaList.length - 1, false);
    inp3d.value = '';
  });

  /* Tambah proyek — buka dev form jika dev mode, fallback ke alert */
  var addBtnEl = document.getElementById('proyekAddBtn');
  if (addBtnEl) addBtnEl.addEventListener('click', function(){
    if (typeof window.devModeOpenProyek === 'function') {
      window.devModeOpenProyek();
    } else {
      alert('Tambah proyek: masukkan data ke array DATA di script.js bagian "9. PROYEK".');
    }
  });

}());


/* ================================================================
   9. EXPLORE STUDIO
   Virtual tour overlay — fullscreen photo navigation
   openExplore() / closeExplore() bisa dipanggil dari mana saja
================================================================ */

(function initExploreStudio() {
  'use strict';

  /* ── Data ruangan ─────────────────────────────────────────── */
  const ROOM = {
    'Lobby':    { name: 'LOBBY',              desc: 'Pintu masuk utama kompleks studio HMTP' },
    'B102':     { name: 'STUDIO B102',         desc: 'Studio rekaman dengan acoustic treatment premium' },
    'B104':     { name: 'STUDIO B104',         desc: 'Ruang serbaguna untuk berbagai kebutuhan produksi' },
    'B106':     { name: 'STUDIO B106',         desc: 'Studio dengan pencahayaan profesional' },
    'B108':     { name: 'STUDIO B108',         desc: 'Studio produksi video & audio berkualitas tinggi' },
    'B006':     { name: 'STUDIO B006',         desc: 'Studio lantai dasar dengan akses mudah' },
    'B008':     { name: 'STUDIO B008',         desc: 'Studio berkapasitas besar untuk produksi skala penuh' },
    'B110':     { name: 'STUDIO B110',         desc: 'Studio premium dengan peralatan terkini' },
    'B109':     { name: 'STUDIO B109',         desc: 'Studio dengan desain akustik superior' },
    'B107':     { name: 'STUDIO B107',         desc: 'Studio multifungsi untuk kreasi tanpa batas' },
    'B105':     { name: 'STUDIO B105',         desc: 'Studio compact dengan kualitas rekaman profesional' },
    'B103':     { name: 'STUDIO B103',         desc: 'Studio dengan atmosfer kreatif yang mendukung' },
    'Loker':    { name: 'AREA LOKER',          desc: 'Fasilitas penyimpanan pribadi untuk pengguna studio' },
    'Selasar1': { name: 'SELASAR',             desc: 'Koridor penghubung antar area studio' },
    'Selasar2': { name: 'SELASAR 2',           desc: 'Jalur koridor menuju area administrasi' },
    'Admin':    { name: 'ADMINISTRASI',        desc: 'Pusat layanan dan administrasi studio' },
    'C104':     { name: 'RUANG C104',          desc: 'Ruang serbaguna di area C' },
    'A201':     { name: 'RUANG A201',          desc: 'Ruang lantai dua di area A' },
  };

  /* ── Fixed loops (urutan FINAL) ──────────────────────────── */
  const LOOPS = {
    studio:  ['Lobby','B102','B104','B106','B108','B006','B008','B110','B109','B107','B105','B103'],
    koridor: ['Lobby','Loker','Selasar1','Selasar2','Admin','C104','A201'],
  };
  const BADGE = { entry:'EXPLORE STUDIO', studio:'LOOP — STUDIO', koridor:'LOOP — KORIDOR' };

  /* ── Path foto (relatif dari index.html) ─────────────────── */
  const IMG_BASE = 'explore/';

  /* ── State ─────────────────────────────────────────────────  */
  const S = { open:false, busy:false, mode:'entry', idx:0 };

  /* ── DOM ───────────────────────────────────────────────────── */
  const ov         = document.getElementById('explore-overlay');
  const bg         = document.getElementById('es-photo');
  const fd         = document.getElementById('es-fade');
  const nameEl     = document.getElementById('es-room-name');
  const descEl     = document.getElementById('es-room-desc');
  const badgeEl    = document.getElementById('es-badge-label');
  const progEl     = document.getElementById('es-progress');
  const hsStudio   = document.getElementById('es-hs-studio');
  const hsKoridor  = document.getElementById('es-hs-koridor');
  const cta        = document.getElementById('es-cta');
  const hsPrev     = document.getElementById('es-hs-prev');
  const hsNext     = document.getElementById('es-hs-next');
  const hsHome     = document.getElementById('es-home');
  const exitBtn    = document.getElementById('es-exit');
  const openBtn    = document.getElementById('studioOpenBtn');
  const siteNav    = document.getElementById('siteNav');

  if (!ov) return; /* overlay tidak ada di halaman */

  /* ── Image cache & preload ──────────────────────────────────  */
  const cache = {};
  function preload(key) {
    if (!key || cache[key]) return;
    const img = new Image(); img.src = IMG_BASE + key + '.webp'; cache[key] = img;
  }
  function setBg(key) {
    bg.style.backgroundImage = "url('" + IMG_BASE + key + ".webp')";
  }

  /* ── UI helpers ─────────────────────────────────────────────  */
  function updateInfo(key) {
    const d = ROOM[key] || { name: key, desc: '' };
    nameEl.textContent = d.name;
    descEl.textContent = d.desc;
  }

  function showEntry() {
    [hsStudio, hsKoridor, cta].forEach(el => { if(el) el.style.display = ''; });
    [hsPrev, hsNext, hsHome].forEach(el => { if(el) el.style.display = 'none'; });
    if (badgeEl) badgeEl.textContent = BADGE.entry;
    if (progEl)  progEl.innerHTML = '';
  }

  function showNav() {
    [hsStudio, hsKoridor, cta].forEach(el => { if(el) el.style.display = 'none'; });
    [hsPrev, hsNext, hsHome].forEach(el => { if(el) el.style.display = ''; });
    if (badgeEl) badgeEl.textContent = BADGE[S.mode];
    buildDots(); preloadNeighbors();
  }

  function buildDots() {
    if (!progEl) return;
    const loop = LOOPS[S.mode];
    progEl.innerHTML = loop.map((_,i) =>
      '<div class="es-pdot' + (i === S.idx ? ' cur' : '') + '"></div>'
    ).join('');
  }

  function preloadNeighbors() {
    const loop = LOOPS[S.mode], len = loop.length;
    preload(loop[(S.idx - 1 + len) % len]);
    preload(loop[(S.idx + 1) % len]);
  }

  /* ── Fade transition ────────────────────────────────────────  */
  const wait  = ms => new Promise(r => setTimeout(r, ms));
  const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  async function transition(doUpdate) {
    if (S.busy) return;
    S.busy = true;
    if (fd) fd.classList.add('dark');
    await wait(350);
    doUpdate();
    await frame();
    if (fd) fd.classList.remove('dark');
    await wait(380);
    S.busy = false;
  }

  /* ── Navigation ─────────────────────────────────────────────  */
  function enterLoop(loopName) {
    transition(() => {
      S.mode = loopName; S.idx = 1;
      const room = LOOPS[loopName][1];
      setBg(room); updateInfo(room); showNav();
    });
  }

  function navigate(dir) {
    if (S.mode === 'entry') return;
    const loop = LOOPS[S.mode];
    const next = (S.idx + dir + loop.length) % loop.length;
    transition(() => {
      S.idx = next;
      setBg(loop[next]); updateInfo(loop[next]);
      if (next === 0) { S.mode = 'entry'; showEntry(); }
      else showNav();
    });
  }

  function goLobby() {
    if (S.mode === 'entry') return;
    transition(() => {
      S.mode = 'entry'; S.idx = 0;
      setBg('Lobby'); updateInfo('Lobby'); showEntry();
    });
  }

  /* ── Open / Close ───────────────────────────────────────────  */
  window.openExplore = function () {
    if (S.open) return;
    S.open = true; S.mode = 'entry'; S.idx = 0; S.busy = false;
    setBg('Lobby'); updateInfo('Lobby'); showEntry();
    ov.classList.add('es-open');
    document.body.style.overflow = 'hidden';
    /* Sembunyikan nav agar tidak menumpuk overlay */
    if (siteNav) siteNav.classList.add('is-hidden');
    /* Preload semua foto di background */
    setTimeout(() => { [...LOOPS.studio, ...LOOPS.koridor].forEach(preload); }, 800);
  };

  window.closeExplore = function () {
    if (!S.open) return;
    S.open = false;
    ov.classList.remove('es-open');
    document.body.style.overflow = '';
    if (siteNav) siteNav.classList.remove('is-hidden');
  };

  /* ── Event listeners ────────────────────────────────────────  */
  if (hsStudio)  hsStudio.addEventListener('click',  () => enterLoop('studio'));
  if (hsKoridor) hsKoridor.addEventListener('click', () => enterLoop('koridor'));
  if (hsPrev)    hsPrev.addEventListener('click',    () => navigate(-1));
  if (hsNext)    hsNext.addEventListener('click',    () => navigate(1));
  if (hsHome)    hsHome.addEventListener('click',    () => goLobby());
  if (exitBtn)   exitBtn.addEventListener('click',   () => window.closeExplore());
  if (openBtn)   openBtn.addEventListener('click',   () => window.openExplore());

  /* Keyboard */
  document.addEventListener('keydown', e => {
    if (!S.open) return;
    if (e.key === 'ArrowLeft')  navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
    if (e.key === 'Escape')     window.closeExplore();
    if (e.key === 'h' || e.key === 'H') goLobby();
  });

  /* Preload lobby segera */
  preload('Lobby');

}());

/* ── i18n keys tambahan untuk Studio ─────────────────────────────
   Anda bisa menambahkan teks ini ke dalam objek T.id dan T.en
   di bagian "4. BAHASA (i18n)" di atas, jika dibutuhkan.
   Saat ini tombol Studio tidak menggunakan data-i18n pada teks
   dalam overlay (teks sudah tetap/fixed).
   Keys yang sudah ditambahkan ke HTML:
     nav.studio    → link nav "Studio"
     studio.title  → judul section trigger
     studio.sub    → subjudul section trigger
     studio.btn    → teks tombol CTA
──────────────────────────────────────────────────────────────── */

/* ═══════════════════════════════════════════════════════════════
   HMTP TRANSITION
   EXPLORE → BLACK → LOGOS → HMTP
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const transition = document.querySelector('.hmtp-transition');

  if (!transition) return;

  const black = transition.querySelector(
    '.hmtp-transition__black'
  );

  const logos = transition.querySelector(
    '.hmtp-transition__logos'
  );

  const title = transition.querySelector(
    '.hmtp-transition__title'
  );


  let targetProgress = 0;
  let currentProgress = 0;


  /* ─────────────────────────────────────────────
     GET SCROLL PROGRESS
     ───────────────────────────────────────────── */

  function updateProgress() {

    const rect = transition.getBoundingClientRect();

    const scrollDistance =
      transition.offsetHeight - window.innerHeight;

    const scrolled =
      -rect.top;

    targetProgress =
      scrolled / scrollDistance;

    targetProgress =
      Math.max(
        0,
        Math.min(1, targetProgress)
      );
  }


  /* ─────────────────────────────────────────────
     ANIMATION
     ───────────────────────────────────────────── */

  function animate() {

    /*
     * Smooth mengikuti scroll
     */
    currentProgress +=
      (targetProgress - currentProgress) * 0.12;


    const p = currentProgress;


    /* ═══════════════════════════════════════════
       1. BLACK RISING
       0 → 45%
       ═══════════════════════════════════════════ */

const blackProgress = Math.min(
  1,
  p / 0.45
);

black.style.height =
  `${blackProgress * 150}%`;

    /* ═══════════════════════════════════════════
       2. LOGOS
       55 → 75%
       ═══════════════════════════════════════════ */

    let logoProgress =
      (p - 0.55) / 0.20;

    logoProgress =
      Math.max(
        0,
        Math.min(1, logoProgress)
      );


    /*
     * Smooth ease
     */
    const logoEase =
      1 - Math.pow(
        1 - logoProgress,
        3
      );


    logos.style.opacity =
      logoEase;


    logos.style.transform =
      `scale(${1.05 - (logoEase * 0.05)})`;


    /* ═══════════════════════════════════════════
       3. HMTP TITLE
       72 → 95%
       ═══════════════════════════════════════════ */

    let titleProgress =
      (p - 0.72) / 0.23;

    titleProgress =
      Math.max(
        0,
        Math.min(1, titleProgress)
      );


    const titleEase =
      1 - Math.pow(
        1 - titleProgress,
        3
      );


    title.style.opacity =
      titleEase;


    title.style.transform =
      `scale(${1.12 - (titleEase * 0.12)})`;


    requestAnimationFrame(animate);
  }


  /* ─────────────────────────────────────────────
     SCROLL
     ───────────────────────────────────────────── */

  window.addEventListener(
    'scroll',
    updateProgress,
    { passive: true }
  );


  /* Initial */

  updateProgress();
  animate();

});

const aboutText = document.querySelector(
    '#aboutHimpunanText'
);

/* Pecah teks per kata agar line-break hanya terjadi antar kata,
   bukan di tengah kata. Spasi dibiarkan sebagai plain text node.
   Huruf tiap kata tetap dibungkus <span> untuk animasi warna. */
(function buildCharSpans() {
    const segments = aboutText.textContent.trim().split(/(\s+)/);
    let html = '';
    segments.forEach(function(seg) {
        if (/^\s+$/.test(seg)) {
            html += seg; /* spasi = plain text, tidak dibungkus span */
        } else {
            seg.split('').forEach(function(ch) {
                html += '<span>' + ch + '</span>';
            });
        }
    });
    aboutText.innerHTML = html;
})();


const aboutSection =
    document.querySelector('.about-himpunan');


const aboutChars =
    aboutText.querySelectorAll('span');


function updateAboutColor() {

    const rect =
        aboutSection.getBoundingClientRect();

    const sectionHeight =
        aboutSection.offsetHeight;

    const viewport =
        window.innerHeight;


    /*
     * progress:
     *
     * 0 = baru masuk
     * 1 = seluruh section selesai
     */

    let progress =
        -rect.top /
        (sectionHeight - viewport);


    progress =
        Math.max(0, Math.min(1, progress));


    aboutChars.forEach((char, index) => {

        /*
         * Setiap huruf mendapat
         * progress yang sedikit berbeda.
         */

        const charProgress =
            progress * (aboutChars.length + 8)
            - index;


        const p =
            Math.max(
                0,
                Math.min(1, charProgress)
            );


        /*
         * Dark grey → yellow
         */

        const start = [50, 50, 50];

        const end = [255, 187, 0];


        const r =
            Math.round(
                start[0] +
                (end[0] - start[0]) * p
            );

        const g =
            Math.round(
                start[1] +
                (end[1] - start[1]) * p
            );

        const b =
            Math.round(
                start[2] +
                (end[2] - start[2]) * p
            );


        char.style.color =
            `rgb(${r}, ${g}, ${b})`;
    });
}


window.addEventListener(
    'scroll',
    updateAboutColor,
    { passive: true }
);


updateAboutColor();

/* ================================================================
   TENTANG HIMPUNAN — In / Out Reveal (IntersectionObserver)
   ─────────────────────────────────────────────────────────────────
   Semua elemen [data-hmpn-reveal] mendapat kelas .is-in saat masuk
   viewport → animasi muncul.
   Kelas .is-in dihapus saat elemen keluar viewport → animasi hilang
   (efek out). Ini membuat animasi bisa terulang saat scroll naik/turun.
================================================================ */

(function initHimpunanReveal() {
    if (!('IntersectionObserver' in window)) {
        /* Fallback: langsung tampilkan semua jika browser lama */
        document.querySelectorAll('[data-hmpn-reveal]').forEach(function(el) {
            el.classList.add('is-in');
        });
        return;
    }

    var els = document.querySelectorAll('[data-hmpn-reveal]');
    if (!els.length) return;

    var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
            if (e.isIntersecting) {
                e.target.classList.add('is-in');     /* efek IN  */
            } else {
                e.target.classList.remove('is-in');  /* efek OUT */
            }
        });
    }, {
        threshold:  0.18,
        rootMargin: '0px 0px -40px 0px'   /* trigger sedikit sebelum tepi bawah */
    });

    els.forEach(function(el) { io.observe(el); });
})();

/* =========================================================
   HMTP — DEPARTMENTS
   Vertical Pair Carousel  ·  Scroll-Locked Navigation
   ========================================================= */

(function initDepartments() {

    'use strict';


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const section =
        document.getElementById('departments');

    if (!section) return;


    const carousel =
        document.getElementById(
            'departmentCarousel'
        );

    if (!carousel) return;


    /*
     * Ambil SEMUA pair.
     */

    const allPairs =
        Array.from(
            carousel.querySelectorAll(
                '.department-pair'
            )
        );


    /*
     * Pair departemen ASLI.
     *
     * BUFFER sengaja dikeluarkan.
     */

    const pairs =
        allPairs.filter(function(pair) {

            return !pair.classList.contains(
                'department-pair--buffer'
            );

        });


    /*
     * Ambil buffer.
     */

    const buffer =
        carousel.querySelector(
            '.department-pair--buffer'
        );


    const counter =
        document.getElementById(
            'departmentCurrent'
        );


    if (!pairs.length) return;


    /* =====================================================
       CONFIG
       ===================================================== */

    const PAIR_COUNT =
        pairs.length;


    /*
     * Jarak antar pair.
     *
     * Jangan dibuat terlalu besar.
     */

    let PAIR_DISTANCE =
        window.innerHeight * 0.72;


    let ticking = false;


    /* =====================================================
       SECTION PROGRESS
       ===================================================== */

    function getProgress() {

        const rect =
            section.getBoundingClientRect();


        const scrollable =
            section.offsetHeight -
            window.innerHeight;


        if (scrollable <= 0) {

            return 0;

        }


        const progress =
            -rect.top / scrollable;


        return Math.max(
            0,
            Math.min(
                1,
                progress
            )
        );

    }


    /* =====================================================
       UPDATE
       ===================================================== */

    function updateDepartments() {

        ticking = false;


        const progress =
            getProgress();


        /*
         * HANYA 4 PAIR ASLI
         *
         * 0.00 → Pair 1
         * 0.33 → Pair 2
         * 0.66 → Pair 3
         * 1.00 → Pair 4
         */

        const virtualIndex =
            progress *
            (PAIR_COUNT - 1);


        const activeIndex =
            Math.round(
                virtualIndex
            );


        /* =================================================
           POSITION PAIR ASLI
           ================================================= */

        pairs.forEach(
            function(pair, index) {

                const distance =
                    index -
                    virtualIndex;


                const distanceAbs =
                    Math.abs(
                        distance
                    );


                /*
                 * Posisi vertikal.
                 */

                const translateY =
                    distance *
                    PAIR_DISTANCE;


                pair.style.transform =
                    `translate3d(
                        0,
                        calc(-50% + ${translateY}px),
                        0
                    )`;


                /* =========================================
                   SCALE
                ========================================= */

                const scale =
                    Math.max(
                        0.90,
                        1 -
                        distanceAbs *
                        0.06
                    );


                /* =========================================
                   OPACITY
                ========================================= */

                const opacity =
                    Math.max(
                        0.12,
                        1 -
                        distanceAbs *
                        0.72
                    );


                /* =========================================
                   BLUR
                ========================================= */

                const blur =
                    Math.min(
                        10,
                        distanceAbs *
                        8
                    );


                /* =========================================
                   CARD
                ========================================= */

                const cards =
                    pair.querySelectorAll(
                        '.department-card'
                    );


                cards.forEach(
                    function(card) {

                        card.style.transform =
                            `scale(${scale})`;


                        card.style.opacity =
                            opacity;


                        card.style.filter =
                            `blur(${blur}px)`;

                    }
                );


                /* =========================================
                   ACTIVE
                ========================================= */

                if (
                    index ===
                    activeIndex
                ) {

                    pair.classList.add(
                        'is-active'
                    );

                } else {

                    pair.classList.remove(
                        'is-active'
                    );

                }

            }
        );


        /* =================================================
           BUFFER
           =================================================

           Buffer TIDAK ikut active.

           Buffer hanya mengikuti posisi setelah Pair 4.
        */

        if (buffer) {

            /*
             * Posisi buffer selalu satu step
             * setelah Pair terakhir.
             */

            const bufferDistance =
                (PAIR_COUNT - virtualIndex);


            const bufferTranslateY =
                bufferDistance *
                PAIR_DISTANCE;


            buffer.style.transform =
                `translate3d(
                    0,
                    calc(-50% + ${bufferTranslateY}px),
                    0
                )`;


            /*
             * Paksa buffer tetap invisible.
             */

            buffer.style.opacity =
                '0';


            buffer.style.pointerEvents =
                'none';

        }


        /* =================================================
           COUNTER
           ================================================= */

        if (counter) {

            const number =
                String(
                    activeIndex + 1
                ).padStart(
                    2,
                    '0'
                );


            counter.textContent =
                number;

        }

    }


    /* =====================================================
       SCROLL  (passive — for visual sync)
       ===================================================== */

    function requestUpdate() {

        if (ticking) return;

        ticking = true;

        requestAnimationFrame(
            updateDepartments
        );

    }

    window.addEventListener(
        'scroll',
        requestUpdate,
        { passive: true }
    );


    /* =====================================================
       SCROLL LOCK
       ─────────────────────────────────────────────────────
       While the departments section is in sticky mode
       (its sticky child fills the viewport), wheel / touch
       events are intercepted and mapped to pair advances.
       Normal scroll is restored once the user has scrolled
       past the last pair (going down) or before the first
       pair (going up).
       ===================================================== */

    let lockedPairIndex   = 0;   /* current snapped pair  */
    let lockAnimating     = false;
    let lastScrollY       = window.scrollY;


    /* --------------------------------------------------
       Helper — scroll-Y that corresponds to a given pair
       -------------------------------------------------- */

    function scrollYForPair(index) {

        const sectionTop =
            section.getBoundingClientRect().top +
            window.scrollY;

        const scrollable =
            section.offsetHeight -
            window.innerHeight;

        const pairProgress =
            PAIR_COUNT > 1
                ? index / (PAIR_COUNT - 1)
                : 0;

        return sectionTop + pairProgress * scrollable;

    }


    /* --------------------------------------------------
       Helper — is the departments section in sticky mode?
       (sticky child is fully covering the viewport)
       -------------------------------------------------- */

    function isDeptSticky() {

        const r = section.getBoundingClientRect();

        return r.top <= 1 && r.bottom >= window.innerHeight - 1;

    }


    /* --------------------------------------------------
       Smooth scroll utility (easeInOutQuad)
       -------------------------------------------------- */

    function smoothScrollTo(targetY, onDone) {

        const startY    = window.scrollY;
        const distance  = targetY - startY;
        const duration  = 520;
        let   startTime = null;

        function ease(t) {
            return t < 0.5
                ? 2 * t * t
                : -1 + (4 - 2 * t) * t;
        }

        function step(ts) {
            if (!startTime) startTime = ts;

            const elapsed = ts - startTime;
            const t       = Math.min(elapsed / duration, 1);

            window.scrollTo(0, startY + distance * ease(t));

            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                if (onDone) onDone();
            }
        }

        requestAnimationFrame(step);

    }


    /* --------------------------------------------------
       Navigate to a pair with smooth scroll
       -------------------------------------------------- */

    function goToPair(index) {

        if (lockAnimating) return;

        lockAnimating = true;

        lockedPairIndex = index;

        smoothScrollTo(
            scrollYForPair(index),
            function() {
                lockAnimating = false;
            }
        );

    }


    /* --------------------------------------------------
       Advance past the department section downward
       (scroll to just below the section's scroll range)
       -------------------------------------------------- */

    function exitDown() {

        if (lockAnimating) return;

        lockAnimating = true;

        const sectionTop =
            section.getBoundingClientRect().top +
            window.scrollY;

        const exitY =
            sectionTop +
            section.offsetHeight -
            window.innerHeight +
            4;

        smoothScrollTo(
            exitY,
            function() { lockAnimating = false; }
        );

    }


    /* --------------------------------------------------
       Advance past the department section upward
       -------------------------------------------------- */

    function exitUp() {

        if (lockAnimating) return;

        lockAnimating = true;

        const sectionTop =
            section.getBoundingClientRect().top +
            window.scrollY;

        smoothScrollTo(
            sectionTop - 4,
            function() { lockAnimating = false; }
        );

    }


    /* --------------------------------------------------
       Wheel handler — intercept while sticky
       -------------------------------------------------- */

    function handleWheel(e) {

        if (!isDeptSticky()) return;

        /* Consume the event so the page doesn't scroll */
        e.preventDefault();

        if (lockAnimating) return;

        const dir =
            e.deltaY > 0 ? 1 : -1;

        const next =
            lockedPairIndex + dir;


        if (next < 0) {
            /* User scrolled up past pair 0 → exit upward */
            exitUp();
            return;
        }

        if (next >= PAIR_COUNT) {
            /* User scrolled down past last pair → exit down */
            exitDown();
            return;
        }

        goToPair(next);

    }

    window.addEventListener(
        'wheel',
        handleWheel,
        { passive: false }
    );


    /* --------------------------------------------------
       Touch support
       -------------------------------------------------- */

    let touchStartY = null;

    window.addEventListener(
        'touchstart',
        function(e) {
            if (!isDeptSticky()) return;
            touchStartY = e.touches[0].clientY;
        },
        { passive: true }
    );

    window.addEventListener(
        'touchmove',
        function(e) {

            if (!isDeptSticky()) return;
            if (touchStartY === null) return;

            e.preventDefault();

            if (lockAnimating) return;

            const delta =
                touchStartY - e.touches[0].clientY;

            /* Require a minimum swipe distance before acting */
            if (Math.abs(delta) < 40) return;

            touchStartY = null;

            const dir  = delta > 0 ? 1 : -1;
            const next = lockedPairIndex + dir;

            if (next < 0)            { exitUp();     return; }
            if (next >= PAIR_COUNT)  { exitDown();   return; }

            goToPair(next);

        },
        { passive: false }
    );

    window.addEventListener(
        'touchend',
        function() { touchStartY = null; },
        { passive: true }
    );


    /* --------------------------------------------------
       Sync lockedPairIndex when user arrives by anchor /
       browser back-forward navigation
       -------------------------------------------------- */

    window.addEventListener(
        'scroll',
        function() {

            if (lockAnimating) return;
            if (!isDeptSticky()) return;

            const prog = getProgress();

            lockedPairIndex = Math.round(
                prog * (PAIR_COUNT - 1)
            );

        },
        { passive: true }
    );


    /* =====================================================
       RESIZE
       ===================================================== */

    window.addEventListener(
        'resize',
        function() {

            PAIR_DISTANCE =
                window.innerHeight * 0.72;

            requestUpdate();

        }
    );


    /* =====================================================
       INITIAL
       ===================================================== */

    updateDepartments();

})();

/* =========================================================
   HMTP — ORGANIZATION STRUCTURE
   SVG CONNECTOR + PROFILE MODAL
========================================================= */

(function initOrganization() {

  'use strict';


  /* =======================================================
     ELEMENTS
  ======================================================= */

  const canvas =
    document.getElementById('organizationCanvas');

  const svg =
    document.getElementById(
      'organizationConnections'
    );

  const modal =
    document.getElementById('personModal');


  if (!canvas || !svg) {
    return;
  }


  /* =======================================================
     HELPERS
  ======================================================= */

  function getElement(selector) {

    return document.querySelector(selector);

  }


  function getPoint(element, side) {

    const rect =
      element.getBoundingClientRect();

    const canvasRect =
      canvas.getBoundingClientRect();


    const x =
      rect.left -
      canvasRect.left;

    const y =
      rect.top -
      canvasRect.top;


    switch (side) {

      case 'top':

        return {
          x: x + rect.width / 2,
          y: y
        };


      case 'bottom':

        return {
          x: x + rect.width / 2,
          y: y + rect.height
        };


      case 'left':

        return {
          x: x,
          y: y + rect.height / 2
        };


      case 'right':

        return {
          x: x + rect.width,
          y: y + rect.height / 2
        };

    }


    return {
      x: x + rect.width / 2,
      y: y + rect.height / 2
    };

  }


  /* =======================================================
     SVG PATH
  ======================================================= */

  function createPath(
    start,
    end,
    className = ''
  ) {

    const ns =
      'http://www.w3.org/2000/svg';


    const path =
      document.createElementNS(
        ns,
        'path'
      );


    const middleY =
      start.y +
      (end.y - start.y) * 0.5;


    const d = `
      M ${start.x} ${start.y}
      C
        ${start.x} ${middleY},
        ${end.x} ${middleY},
        ${end.x} ${end.y}
    `;


    path.setAttribute(
      'd',
      d
    );


    if (className) {

      path.setAttribute(
        'class',
        className
      );

    }


    svg.appendChild(path);

  }


  /* =======================================================
     HORIZONTAL BUS
  ======================================================= */

  function createBus(
    parent,
    children
  ) {

    if (
      !parent ||
      !children.length
    ) {
      return;
    }


    const parentPoint =
      getPoint(
        parent,
        'bottom'
      );


    const childPoints =
      children.map(
        child =>
          getPoint(
            child,
            'top'
          )
      );


    const ns =
      'http://www.w3.org/2000/svg';


    const minX =
      Math.min(
        ...childPoints.map(
          p => p.x
        )
      );


    const maxX =
      Math.max(
        ...childPoints.map(
          p => p.x
        )
      );


    const busY =
      parentPoint.y +
      25;


    /*
     * Parent → vertical bus
     */

    const parentPath =
      document.createElementNS(
        ns,
        'path'
      );


    parentPath.setAttribute(
      'd',
      `
      M ${parentPoint.x} ${parentPoint.y}
      L ${parentPoint.x} ${busY}
      `
    );


    parentPath.setAttribute(
      'class',
      'connection-main'
    );


    svg.appendChild(
      parentPath
    );


    /*
     * Horizontal bus
     */

    const busPath =
      document.createElementNS(
        ns,
        'path'
      );


    busPath.setAttribute(
      'd',
      `
      M ${minX} ${busY}
      L ${maxX} ${busY}
      `
    );


    busPath.setAttribute(
      'class',
      'connection-main'
    );


    svg.appendChild(
      busPath
    );


    /*
     * Bus → children
     */

    childPoints.forEach(
      point => {

        const childPath =
          document.createElementNS(
            ns,
            'path'
          );


        childPath.setAttribute(
          'd',
          `
          M ${point.x} ${busY}
          L ${point.x} ${point.y}
          `
        );


        svg.appendChild(
          childPath
        );

      }
    );

  }


  /* =======================================================
     DRAW ALL CONNECTIONS
  ======================================================= */

  function drawConnections() {

    svg.innerHTML = '';


    /*
     * ===============================================
     * KETUA → WAKIL
     * ===============================================
     */

    const chairman =
      getElement(
        '[data-person="chairman"]'
      );


    const vice1 =
      getElement(
        '[data-person="vice1"]'
      );


    const vice2 =
      getElement(
        '[data-person="vice2"]'
      );


    createBus(
      chairman,
      [
        vice1,
        vice2
      ]
    );


    /*
     * ===============================================
     * WAKIL → ANGKATAN
     * ===============================================
     */

    const generation24 =
      getElement(
        '[data-person="generation24"]'
      );


    const generation25 =
      getElement(
        '[data-person="generation25"]'
      );


    createPath(
      getPoint(
        vice1,
        'bottom'
      ),
      getPoint(
        generation24,
        'top'
      )
    );


    createPath(
      getPoint(
        vice2,
        'bottom'
      ),
      getPoint(
        generation25,
        'top'
      )
    );


    /*
     * ===============================================
     * ANGKATAN → DEPARTMENTS
     *
     * Satu bus besar.
     * ===============================================
     */

    const departmentCards =
      Array.from(
        document.querySelectorAll(
          '.org-card--department'
        )
      );


    const generationPoints = [
      getPoint(
        generation24,
        'bottom'
      ),
      getPoint(
        generation25,
        'bottom'
      )
    ];


    const departmentPoints =
      departmentCards.map(
        card =>
          getPoint(
            card,
            'top'
          )
      );


    const ns =
      'http://www.w3.org/2000/svg';


    const allGenerationX =
      generationPoints.map(
        p => p.x
      );


    const allDepartmentX =
      departmentPoints.map(
        p => p.x
      );


    const minX =
      Math.min(
        ...allGenerationX,
        ...allDepartmentX
      );


    const maxX =
      Math.max(
        ...allGenerationX,
        ...allDepartmentX
      );


    const generationBusY =
      Math.max(
        ...generationPoints.map(
          p => p.y
        )
      ) + 30;


    const departmentBusY =
      Math.min(
        ...departmentPoints.map(
          p => p.y
        )
      ) - 30;


    /*
     * Angkatan 24 → bus
     */

    generationPoints.forEach(
      point => {

        const path =
          document.createElementNS(
            ns,
            'path'
          );


        path.setAttribute(
          'd',
          `
          M ${point.x} ${point.y}
          L ${point.x} ${generationBusY}
          `
        );


        svg.appendChild(path);

      }
    );


    /*
     * Generation horizontal bus
     */

    const generationBus =
      document.createElementNS(
        ns,
        'path'
      );


    generationBus.setAttribute(
      'd',
      `
      M ${minX} ${generationBusY}
      L ${maxX} ${generationBusY}
      `
    );


    generationBus.setAttribute(
      'class',
      'connection-main'
    );


    svg.appendChild(
      generationBus
    );


    /*
     * Bus turun menuju department bus
     */

    const centralX =
      (minX + maxX) / 2;


    const centralPath =
      document.createElementNS(
        ns,
        'path'
      );


    centralPath.setAttribute(
      'd',
      `
      M ${centralX} ${generationBusY}
      L ${centralX} ${departmentBusY}
      `
    );


    centralPath.setAttribute(
      'class',
      'connection-main'
    );


    svg.appendChild(
      centralPath
    );


    /*
     * Department bus
     */

    const departmentBus =
      document.createElementNS(
        ns,
        'path'
      );


    departmentBus.setAttribute(
      'd',
      `
      M ${minX} ${departmentBusY}
      L ${maxX} ${departmentBusY}
      `
    );


    departmentBus.setAttribute(
      'class',
      'connection-main'
    );


    svg.appendChild(
      departmentBus
    );


    /*
     * Department → masing-masing department
     */

    departmentPoints.forEach(
      point => {

        const path =
          document.createElementNS(
            ns,
            'path'
          );


        path.setAttribute(
          'd',
          `
          M ${point.x} ${departmentBusY}
          L ${point.x} ${point.y}
          `
        );


        svg.appendChild(
          path
        );

      }
    );


    /*
     * ===============================================
     * DEPARTMENT → DIVISIONS
     * ===============================================
     */

    const columns =
      Array.from(
        document.querySelectorAll(
          '.department-column'
        )
      );


    columns.forEach(
      column => {

        const department =
          column.querySelector(
            '.org-card--department'
          );


        const divisions =
          Array.from(
            column.querySelectorAll(
              '.org-card--division'
            )
          );


        if (
          !department ||
          !divisions.length
        ) {
          return;
        }


        createBus(
          department,
          divisions
        );

      }
    );


    /*
     * ===============================================
     * LEGISLATIVE
     * ===============================================
     */

    const legislative =
      getElement(
        '[data-person="legislative"]'
      );


    const legislativeVice1 =
      getElement(
        '[data-person="legislativeVice1"]'
      );


    const legislativeVice2 =
      getElement(
        '[data-person="legislativeVice2"]'
      );


    const commission1 =
      getElement(
        '[data-person="commission1"]'
      );


    const commission2 =
      getElement(
        '[data-person="commission2"]'
      );


    const commission3 =
      getElement(
        '[data-person="commission3"]'
      );


    createBus(
      legislative,
      [
        legislativeVice1,
        legislativeVice2
      ]
    );


    createBus(
      legislativeVice1,
      [
        commission1
      ]
    );


    createBus(
      legislativeVice2,
      [
        commission2,
        commission3
      ]
    );

  }


  /* =======================================================
     PROFILE DATA
  ======================================================= */

  const people = {

    chairman: {
      name: 'Debi Gideon Pandiangan',
      role: 'Ketua HMTP',
      nim: '224422027',
      photo: 'kabinet/ketua-hmtp.png',
      instagram: '@username',
      instagramUrl: 'https://instagram.com/',
      description:
        'Ketua Himpunan Mahasiswa Teknik Perancangan.'
    },

    vice1: {
      name: 'Rafi Altarizky Athallah',
      role: 'Wakil Ketua HMTP I',
      nim: '224321041',
      photo: 'kabinet/wakil-ketua-1.png',
      instagram: '@username',
      instagramUrl: 'https://instagram.com/',
      description:
        'Wakil Ketua Himpunan Mahasiswa Teknik Perancangan.'
    },

    vice2: {
      name: 'Muhammad Ajian Karim',
      role: 'Wakil Ketua HMTP II',
      nim: '225422014',
      photo: 'kabinet/wakil-ketua-2.png',
      instagram: '@username',
      instagramUrl: 'https://instagram.com/',
      description:
        'Wakil Ketua Himpunan Mahasiswa Teknik Perancangan.'
    },

    secretary1: {
      name: 'Mulyana',
      role: 'Sekretaris I',
      nim: '224321038',
      photo: 'kabinet/sekretaris-1.png',
      instagram: '@username',
      instagramUrl: 'https://instagram.com/',
      description:
        'Sekretaris HMTP.'
    },

    secretary2: {
      name: 'Faris Faturrahman',
      role: 'Sekretaris II',
      nim: '224321003',
      photo: 'kabinet/sekretaris-2.png',
      instagram: '@username',
      instagramUrl: 'https://instagram.com/',
      description:
        'Sekretaris HMTP.'
    },

    treasurer1: {
      name: 'M. Dzikri A. W.',
      role: 'Bendahara I',
      nim: '224321034',
      photo: 'kabinet/bendahara-1.png',
      instagram: '@username',
      instagramUrl: 'https://instagram.com/',
      description:
        'Bendahara HMTP.'
    },

    treasurer2: {
      name: 'Serla Marviyah',
      role: 'Bendahara II',
      nim: '224421046',
      photo: 'kabinet/bendahara-2.png',
      instagram: '@username',
      instagramUrl: 'https://instagram.com/',
      description:
        'Bendahara HMTP.'
    },

    legislative: {
      name: 'M. Satria Tri Lesmana',
      role: 'Badan Legislatif HMTP',
      nim: '224421018',
      photo: 'kabinet/badan-legislatif.png',
      instagram: '@username',
      instagramUrl: 'https://instagram.com/',
      description:
        'Ketua Badan Legislatif HMTP.'
    },

    kaderisasi: {
      name: 'Amr Nasrullah Robbani',
      role: 'Kepala Dept. Kaderisasi',
      nim: '224421027',
      photo: 'kabinet/kadep-kaderisasi.png',
      instagram: '@username',
      instagramUrl: 'https://instagram.com/',
      description:
        'Kepala Departemen Kaderisasi HMTP.'
    },

    internal: {
      name: 'M. Difaush Sidqi',
      role: 'Kepala Dept. Internal',
      nim: '224321011',
      photo: 'kabinet/kadep-internal.png',
      instagram: '@username',
      instagramUrl: 'https://instagram.com/',
      description:
        'Kepala Departemen Internal HMTP.'
    },

    external: {
      name: 'Moch. Rahman Nawawei',
      role: 'Kepala Dept. Eksternal',
      nim: '224422009',
      photo: 'kabinet/kadep-eksternal.png',
      instagram: '@username',
      instagramUrl: 'https://instagram.com/',
      description:
        'Kepala Departemen Eksternal HMTP.'
    },

    mediaCenter: {
      name: 'Agung Darmawan',
      role: 'Kepala Dept. Media Center',
      nim: '224421026',
      photo: 'kabinet/kadep-medcen.png',
      instagram: '@username',
      instagramUrl: 'https://instagram.com/',
      description:
        'Kepala Departemen Media Center HMTP.'
    },

    generation24: {
      name: 'Ketua Angkatan 2024',
      role: 'Ketua Angkatan',
      nim: '-',
      photo: 'kabinet/ketua-angkatan-24.png',
      instagram: '@username',
      instagramUrl: 'https://instagram.com/',
      description:
        'Ketua Angkatan 2024.'
    },

    generation25: {
      name: 'Ketua Angkatan 2025',
      role: 'Ketua Angkatan',
      nim: '-',
      photo: 'kabinet/ketua-angkatan-25.png',
      instagram: '@username',
      instagramUrl: 'https://instagram.com/',
      description:
        'Ketua Angkatan 2025.'
    }

  };


  /* =======================================================
     MODAL
  ======================================================= */

  const modalPhoto =
    document.getElementById(
      'personModalPhoto'
    );

  const modalRole =
    document.getElementById(
      'personModalRole'
    );

  const modalName =
    document.getElementById(
      'personModalName'
    );

  const modalNim =
    document.getElementById(
      'personModalNim'
    );

  const modalInstagram =
    document.getElementById(
      'personModalInstagram'
    );

  const modalDescription =
    document.getElementById(
      'personModalDescription'
    );


  function openPerson(personId) {

    if (!modal) {
      return;
    }


    const person =
      people[personId];


    /*
     * Untuk data yang belum dimasukkan
     * tetap buka popup.
     */

    if (person) {

      modalPhoto.src =
        person.photo || '';

      modalPhoto.alt =
        person.name || '';

      modalRole.textContent =
        person.role || '';

      modalName.textContent =
        person.name || '';

      modalNim.textContent =
        person.nim || '-';

      modalInstagram.textContent =
        person.instagram || '@username';

      modalInstagram.href =
        person.instagramUrl || '#';

      modalDescription.textContent =
        person.description || '';

    }


    modal.classList.add(
      'is-open'
    );

    modal.setAttribute(
      'aria-hidden',
      'false'
    );

    document.body.style.overflow =
      'hidden';

  }


  function closePerson() {

    if (!modal) {
      return;
    }


    modal.classList.remove(
      'is-open'
    );

    modal.setAttribute(
      'aria-hidden',
      'true'
    );

    document.body.style.overflow =
      '';

  }


  /* =======================================================
     CARD CLICK
  ======================================================= */

  const cards =
    document.querySelectorAll(
      '[data-person]'
    );


  cards.forEach(
    card => {

      card.addEventListener(
        'click',
        function () {

          const personId =
            this.dataset.person;


          openPerson(
            personId
          );

        }
      );

    }
  );


  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  document
    .querySelectorAll(
      '[data-close-modal]'
    )
    .forEach(
      element => {

        element.addEventListener(
          'click',
          closePerson
        );

      }
    );


  document.addEventListener(
    'keydown',
    event => {

      if (
        event.key === 'Escape'
      ) {

        closePerson();

      }

    }
  );


  /* =======================================================
     DRAW
  ======================================================= */

  let resizeTimer;


  function redraw() {

    requestAnimationFrame(
      function () {

        drawConnections();

      }
    );

  }


  window.addEventListener(
    'resize',
    function () {

      clearTimeout(
        resizeTimer
      );

      resizeTimer =
        setTimeout(
          redraw,
          100
        );

    }
  );


  /*
   * Jalankan setelah seluruh gambar
   * dan layout selesai dihitung.
   */

  window.addEventListener(
    'load',
    redraw
  );


  redraw();


})();


/* ============================================================
   11. BERITA — News Carousel
   ============================================================
   Data disimpan di localStorage key "hmtp_berita".
   Struktur tiap item: { id, title, link, image, date }
   ============================================================ */
(function () {
  'use strict';

  /* ── Konstanta ────────────────────────────────────────── */
  var STORAGE_KEY   = 'hmtp_berita';
  var CARD_W_DESK   = 248;
  var CARD_W_MOB    = 200;
  var CARD_GAP      = 16;

  /* ── State ────────────────────────────────────────────── */
  var data         = [];
  var currentIdx   = 0;
  var isDragging   = false;
  var dragStartX   = 0;
  var dragMoved    = 0;
  var editingId    = null;

  /* ── DOM refs ─────────────────────────────────────────── */
  var track        = document.getElementById('beritaTrack');
  var trackOuter   = document.getElementById('beritaTrackOuter');
  var prevBtn      = document.getElementById('beritaPrev');
  var nextBtn      = document.getElementById('beritaNext');
  var dotsWrap     = document.getElementById('beritaDots');
  var addBtn       = document.getElementById('beritaAddBtn');
  var header       = document.getElementById('beritaHeader');
  var modal        = document.getElementById('beritaModal');
  var modalClose   = document.getElementById('beritaModalClose');
  var modalBack    = document.getElementById('beritaModalBackdrop');
  var cancelBtn    = document.getElementById('beritaCancelBtn');
  var modalHeading = document.getElementById('beritaModalHeading');
  var form         = document.getElementById('beritaForm');
  var inpTitle        = document.getElementById('beritaInputTitle');
  var inpLink         = document.getElementById('beritaInputLink');
  /* FIX: gambar dari upload file, bukan URL */
  var inpImageFile    = document.getElementById('beritaInputImageFile');
  var beritaUploadArea  = document.getElementById('beritaUploadArea');
  var beritaPreviewImg  = document.getElementById('beritaPreviewImg');
  var beritaUploadInner = document.getElementById('beritaUploadInner');
  var beritaImageSrc    = null; /* base64 atau URL gambar saat ini */

  if (!track) return; /* section tidak ada di halaman ini */

  /* ── Helpers ──────────────────────────────────────────── */
  function uid() {
    return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }

  function cardW() {
    return window.innerWidth <= 768 ? CARD_W_MOB : CARD_W_DESK;
  }

  function visibleCount() {
    var outer = trackOuter.offsetWidth;
    return Math.max(1, Math.floor((outer + CARD_GAP) / (cardW() + CARD_GAP)));
  }

  function maxIndex() {
    return Math.max(0, data.length - visibleCount());
  }

  function formatDate(str) {
    try {
      var d = new Date(str);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return str; }
  }

  /* ── Data ─────────────────────────────────────────────── */
  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { data = JSON.parse(raw); }
    } catch (e) { data = []; }
    if (!data || !data.length) { data = defaultData(); }
  }

  function saveData() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    /* Simpan ke GitHub jika dev mode aktif */
    if (window.hmtpGH && document.body.classList.contains('dev-mode')) {
      window.hmtpGH.pushBerita(data);
    }
  }

  function defaultData() {
    var today = new Date().toISOString().slice(0, 10);
    return [
      { id: uid(), title: 'Selamat Datang di HMTP Ewedan', link: '#', image: '', date: today },
      { id: uid(), title: 'Pengumuman Kegiatan Semester Ganjil 2026/2027', link: '#', image: '', date: today },
      { id: uid(), title: 'Rekrutmen Anggota Baru HMTP — Buka Pendaftaran', link: '#', image: '', date: today },
      { id: uid(), title: 'Hasil Lomba Desain Manufaktur Tingkat Nasional', link: '#', image: '', date: today },
      { id: uid(), title: 'Workshop CAD/CAM Gratis untuk Mahasiswa Aktif', link: '#', image: '', date: today },
    ];
  }

  /* ── Render ───────────────────────────────────────────── */
  function render() {
    track.innerHTML  = '';
    dotsWrap.innerHTML = '';

    var cw = cardW();

    data.forEach(function (item, i) {

      /* ── Card element ─── */
      /* Outer wrapper div (devActs akan jadi sibling link, bukan di dalam link) */
      var card = document.createElement('div');
      card.className = 'berita-card';
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', item.title);
      card.style.setProperty('--berita-card-w', cw + 'px');

      /* Inner link (hanya konten kartu, bukan devActs) */
      var a = document.createElement('a');
      a.className = 'berita-card__inner';
      a.href      = item.link || '#';
      a.target    = (item.link && item.link !== '#') ? '_blank' : '_self';
      a.rel       = 'noopener noreferrer';

      /* ── Image area ─── */
      var imgWrap = document.createElement('div');
      imgWrap.className = 'berita-card__img';

      if (item.image) {
        var img   = document.createElement('img');
        img.src     = item.image;
        img.alt     = item.title;
        img.loading = 'lazy';
        imgWrap.appendChild(img);
      } else {
        var ph = document.createElement('div');
        ph.className = 'berita-card__img-ph';
        ph.innerHTML =
          '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#bbb" stroke-width="1.4">' +
          '<rect x="3" y="7" width="34" height="26" rx="2"/>' +
          '<circle cx="13" cy="16" r="3.5"/>' +
          '<path d="M3 26l10-9 7 7 5-5 12 13"/>' +
          '</svg>';
        imgWrap.appendChild(ph);
      }

      /* Date badge */
      if (item.date) {
        var badge = document.createElement('span');
        badge.className   = 'berita-card__date';
        badge.textContent = formatDate(item.date);
        imgWrap.appendChild(badge);
      }

      /* Dev-mode edit / delete buttons */
      var devActs = document.createElement('div');
      devActs.className = 'berita-card__dev-acts';
      devActs.addEventListener('click', function (e) { e.preventDefault(); });

      var editB = document.createElement('button');
      editB.className = 'berita-card__act berita-card__act--edit';
      editB.type      = 'button';
      editB.title     = 'Edit';
      editB.innerHTML = '&#9998;';
      editB.addEventListener('click', (function (id) {
        return function (e) { e.preventDefault(); e.stopPropagation(); openModal(id); };
      }(item.id)));

      var delB = document.createElement('button');
      delB.className = 'berita-card__act berita-card__act--del';
      delB.type      = 'button';
      delB.title     = 'Hapus';
      delB.textContent = '×';
      delB.addEventListener('click', (function (id) {
        return function (e) { e.preventDefault(); e.stopPropagation(); deleteItem(id); };
      }(item.id)));

      devActs.appendChild(editB);
      devActs.appendChild(delB);
      /* devActs masuk ke card (outer div), BUKAN ke imgWrap/inner link */

      /* ── Card body ─── */
      var body = document.createElement('div');
      body.className = 'berita-card__body';

      var src = document.createElement('span');
      src.className   = 'berita-card__source';
      src.textContent = 'HMTP EWEDAN';

      var ttl = document.createElement('h3');
      ttl.className   = 'berita-card__title';
      ttl.textContent = item.title;

      var rm = document.createElement('span');
      rm.className = 'berita-card__readmore';
      rm.innerHTML =
        '<span>Baca selengkapnya</span>' +
        '<svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
        '<path d="M1 4.5h7M5.5 1.5l3 3-3 3"/>' +
        '</svg>';

      body.appendChild(src);
      body.appendChild(ttl);
      body.appendChild(rm);

      a.appendChild(imgWrap);
      a.appendChild(body);
      card.appendChild(a);
      card.appendChild(devActs); /* devActs di luar link, di dalam card wrapper */
      track.appendChild(card);

      /* staggered blur-in */
      (function (el, delay) {
        setTimeout(function () {
          requestAnimationFrame(function () { el.classList.add('b-in'); });
        }, delay);
      }(card, i * 55 + 60));

      /* ── Dot ─── */
      var dot = document.createElement('button');
      dot.className = 'berita__dot' + (i === currentIdx ? ' is-active' : '');
      dot.type      = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Berita ' + (i + 1));
      dot.addEventListener('click', (function (idx) {
        return function () { goTo(idx); };
      }(i)));
      dotsWrap.appendChild(dot);
    });

    updatePosition(false);
    updateNav();
    updateDots();
  }

  /* ── Navigation ────────────────────────────────────────── */
  function goTo(idx) {
    currentIdx = Math.max(0, Math.min(idx, maxIndex()));
    updatePosition(true);
    updateNav();
    updateDots();
  }

  function updatePosition(animate) {
    var offset = currentIdx * (cardW() + CARD_GAP);
    if (!animate) {
      track.style.transition = 'none';
      track.style.transform  = 'translateX(-' + offset + 'px)';
      requestAnimationFrame(function () { track.style.transition = ''; });
    } else {
      track.style.transform = 'translateX(-' + offset + 'px)';
    }
  }

  function updateNav() {
    prevBtn.disabled = (currentIdx <= 0);
    nextBtn.disabled = (currentIdx >= maxIndex());
  }

  function updateDots() {
    var dots = dotsWrap.querySelectorAll('.berita__dot');
    var mx   = maxIndex();
    dots.forEach(function (d, i) {
      d.classList.toggle(
        'is-active',
        i === currentIdx || (currentIdx >= mx && i === dots.length - 1)
      );
    });
  }

  /* ── Upload gambar berita ──────────────────────────────── */
  function resetBeritaUpload() {
    if (beritaPreviewImg)  { beritaPreviewImg.style.display = 'none'; beritaPreviewImg.src = ''; }
    if (beritaUploadInner)   beritaUploadInner.style.display = '';
    if (inpImageFile)        inpImageFile.value = '';
    beritaImageSrc = null;
  }

  function handleBeritaFile(file) {
    var reader = new FileReader();
    reader.onload = function (ev) {
      beritaImageSrc = ev.target.result;
      if (beritaPreviewImg) { beritaPreviewImg.src = beritaImageSrc; beritaPreviewImg.style.display = 'block'; }
      if (beritaUploadInner) beritaUploadInner.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  /* ── Modal ─────────────────────────────────────────────── */
  function openModal(id) {
    editingId = id || null;
    beritaImageSrc = null;
    var item  = id ? data.find(function (b) { return b.id === id; }) : null;

    modalHeading.textContent = id ? 'Edit Berita' : 'Tambah Berita';
    inpTitle.value = item ? item.title : '';
    inpLink.value  = item ? item.link  : '';

    /* Tampilkan preview gambar jika ada */
    if (item && item.image) {
      beritaImageSrc = item.image;
      if (beritaPreviewImg) { beritaPreviewImg.src = item.image; beritaPreviewImg.style.display = 'block'; }
      if (beritaUploadInner) beritaUploadInner.style.display = 'none';
    } else {
      resetBeritaUpload();
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(function () { inpTitle.focus(); }, 80);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    editingId = null;
    form.reset();
    resetBeritaUpload();
  }

  function handleSubmit(e) {
    e.preventDefault();
    var title = inpTitle.value.trim();
    var link  = inpLink.value.trim();
    var image = beritaImageSrc || '';   /* FIX: pakai file upload, bukan URL */
    if (!title || !link) return;

    if (editingId) {
      var item = data.find(function (b) { return b.id === editingId; });
      if (item) { item.title = title; item.link = link; item.image = image; }
    } else {
      data.push({
        id:    uid(),
        title: title,
        link:  link,
        image: image,
        date:  new Date().toISOString().slice(0, 10)
      });
    }

    saveData();
    closeModal();
    render();
  }

  function deleteItem(id) {
    if (!confirm('Hapus berita ini?')) return;
    data = data.filter(function (b) { return b.id !== id; });
    currentIdx = Math.max(0, Math.min(currentIdx, maxIndex()));
    saveData();
    render();
  }

  /* ── Drag / swipe ──────────────────────────────────────── */
  function initDrag() {
    trackOuter.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      /* FIX: jangan capture pointer saat klik tombol edit/hapus */
      if (e.target.closest('button, .berita-card__dev-acts')) return;
      isDragging = true;
      dragStartX = e.clientX;
      dragMoved  = 0;
      track.style.transition = 'none';
      trackOuter.setPointerCapture(e.pointerId);
    });

    trackOuter.addEventListener('pointermove', function (e) {
      if (!isDragging) return;
      dragMoved    = e.clientX - dragStartX;
      var base     = currentIdx * (cardW() + CARD_GAP);
      track.style.transform = 'translateX(-' + (base - dragMoved) + 'px)';
    });

    function endDrag() {
      if (!isDragging) return;
      isDragging             = false;
      track.style.transition = '';
      var threshold = cardW() * 0.22;
      if (Math.abs(dragMoved) > threshold) {
        goTo(dragMoved < 0 ? currentIdx + 1 : currentIdx - 1);
      } else {
        updatePosition(true);
      }
    }

    trackOuter.addEventListener('pointerup',     endDrag);
    trackOuter.addEventListener('pointercancel', function () {
      isDragging = false;
      track.style.transition = '';
      updatePosition(true);
    });

    /* prevent native link click while dragging */
    trackOuter.addEventListener('click', function (e) {
      if (Math.abs(dragMoved) > 5) e.preventDefault();
    });
  }

  /* ── IntersectionObserver for header blur-in ────────────── */
  function initObserver() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          header.classList.add('b-in');
          io.unobserve(header);
        }
      });
    }, { threshold: 0.25 });
    io.observe(header);
  }

  /* ── Init ──────────────────────────────────────────────── */
  function init() {
    loadData();
    render();
    initDrag();
    initObserver();

    prevBtn.addEventListener('click', function () { goTo(currentIdx - 1); });
    nextBtn.addEventListener('click', function () { goTo(currentIdx + 1); });

    addBtn.addEventListener('click',      function () { openModal(null); });
    modalClose.addEventListener('click',  closeModal);
    modalBack.addEventListener('click',   closeModal);
    cancelBtn.addEventListener('click',   closeModal);
    form.addEventListener('submit',       handleSubmit);

    /* FIX: handler upload gambar berita */
    if (beritaUploadArea && inpImageFile) {
      beritaUploadArea.addEventListener('click', function (e) {
        if (e.target !== beritaPreviewImg) inpImageFile.click();
      });
      beritaUploadArea.addEventListener('dragover', function (e) {
        e.preventDefault(); beritaUploadArea.classList.add('drag-over');
      });
      beritaUploadArea.addEventListener('dragleave', function () {
        beritaUploadArea.classList.remove('drag-over');
      });
      beritaUploadArea.addEventListener('drop', function (e) {
        e.preventDefault(); beritaUploadArea.classList.remove('drag-over');
        var file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleBeritaFile(file);
      });
      inpImageFile.addEventListener('change', function () {
        if (inpImageFile.files[0]) handleBeritaFile(inpImageFile.files[0]);
      });
    }
    if (beritaPreviewImg) {
      beritaPreviewImg.addEventListener('click', function (e) {
        e.stopPropagation(); resetBeritaUpload();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeModal();
    });

    window.addEventListener('resize', function () {
      updatePosition(false);
      updateNav();
      updateDots();
    });
  }

  init();

}());

/* ================================================================
   12. GALERI KEGIATAN — Marquee dua baris + lightbox + dev modal
   ================================================================
   Data tersimpan di localStorage key "hmtp_galeri".
   Struktur tiap item: { id, src, caption }
   Row 1 (galeriTrack1) — kanan→kiri: foto indeks genap (0,2,4…)
   Row 2 (galeriTrack2) — kiri→kanan: foto indeks ganjil (1,3,5…)
   Foto diklik → lightbox. Hover kartu → tombol hapus (dev mode).
   ================================================================ */

(function initGaleri() {
  'use strict';

  /* ── Konstanta ────────────────────────────────────────── */
  var STORAGE_KEY  = 'hmtp_galeri';
  var CARD_W       = 224;   /* lebar kartu px  — harus sesuai CSS */
  var CARD_MARGIN  = 10;    /* margin-right px — harus sesuai CSS */
  var MIN_ITEMS    = 5;     /* minimal item per baris sebelum duplikat */

  /* ── DOM refs ─────────────────────────────────────────── */
  var track1        = document.getElementById('galeriTrack1');
  var track2        = document.getElementById('galeriTrack2');
  var row1El        = document.getElementById('galeriRow1');
  var row2El        = document.getElementById('galeriRow2');
  var emptyEl       = document.getElementById('galeriEmpty');
  var addBtn        = document.getElementById('galeriAddBtn');

  /* Lightbox */
  var lightbox      = document.getElementById('galeriLightbox');
  var lightboxBack  = document.getElementById('galeriLightboxBackdrop');
  var lightboxClose = document.getElementById('galeriLightboxClose');
  var lightboxImg   = document.getElementById('galeriLightboxImg');
  var lightboxCap   = document.getElementById('galeriLightboxCaption');

  /* Add modal */
  var modal         = document.getElementById('galeriModal');
  var modalBack     = document.getElementById('galeriModalBackdrop');
  var modalClose    = document.getElementById('galeriModalClose');
  var cancelBtn     = document.getElementById('galeriCancelBtn');
  var form          = document.getElementById('galeriForm');
  var inputFile     = document.getElementById('galeriInputFile');
  var uploadArea    = document.getElementById('galeriUploadArea');
  var uploadPh      = document.getElementById('galeriUploadPh');
  var previewImg    = document.getElementById('galeriPreviewImg');
  var inputUrl      = document.getElementById('galeriInputUrl');
  var inputCaption  = document.getElementById('galeriInputCaption');

  /* Guard — exit if section not present */
  if (!track1 || !track2 || !lightbox || !modal) return;

  /* ── State ────────────────────────────────────────────── */
  var data         = [];
  var pendingBase64 = null;

  /* ── Helpers ──────────────────────────────────────────── */
  function uid() {
    return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }

  /* ── Data ─────────────────────────────────────────────── */
  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { data = JSON.parse(raw); }
    } catch (e) { data = []; }
    if (!Array.isArray(data)) { data = []; }
  }

  function saveData() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    /* Simpan ke GitHub jika dev mode aktif */
    if (window.hmtpGH && document.body.classList.contains('dev-mode')) {
      window.hmtpGH.pushGaleri(data).then(function (prepared) {
        if (prepared) { data = prepared; }
      });
    }
  }

  /* ── Render ───────────────────────────────────────────── */
  function render() {
    track1.innerHTML = '';
    track2.innerHTML = '';

    var hasPhotos = data.length > 0;

    /* Toggle empty state & marquee rows */
    if (emptyEl) {
      emptyEl.setAttribute('aria-hidden', hasPhotos ? 'true' : 'false');
    }
    if (row1El) row1El.setAttribute('aria-hidden', hasPhotos ? 'false' : 'true');
    if (row2El) row2El.setAttribute('aria-hidden', hasPhotos ? 'false' : 'true');

    if (!hasPhotos) return;

    /* Split photos into two rows (alternating index) */
    var photos1 = data.filter(function(_, i) { return i % 2 === 0; });
    var photos2 = data.filter(function(_, i) { return i % 2 !== 0; });

    /* If only one row has photos, mirror to the other so both scroll */
    if (!photos2.length) { photos2 = photos1.slice(); }
    if (!photos1.length) { photos1 = photos2.slice(); }

    /* Pad each row to MIN_ITEMS so the marquee looks full */
    photos1 = padToMin(photos1);
    photos2 = padToMin(photos2);

    /* Build each track with doubled photos for seamless loop */
    buildTrack(track1, photos1);
    buildTrack(track2, photos2);
  }

  /* Repeat array until at least MIN_ITEMS long */
  function padToMin(arr) {
    while (arr.length < MIN_ITEMS) {
      arr = arr.concat(arr);
    }
    return arr;
  }

  /* Render all photos twice in track (original + clone = seamless loop) */
  function buildTrack(trackEl, photos) {
    /* Doubled array: original then clone */
    var all = photos.concat(photos);
    all.forEach(function(item) {
      trackEl.appendChild(makeCard(item));
    });
  }

  /* ── Card element ─────────────────────────────────────── */
  function makeCard(item) {
    var div = document.createElement('div');
    div.className = 'galeri-photo';

    /* Prevent dragging images */
    div.setAttribute('draggable', 'false');

    /* Image or placeholder */
    if (item.src) {
      var img = document.createElement('img');
      img.src     = item.src;
      img.alt     = item.caption || 'Foto kegiatan HMTP';
      img.loading = 'lazy';
      img.setAttribute('draggable', 'false');
      div.appendChild(img);
    } else {
      var ph = document.createElement('div');
      ph.className = 'galeri-photo__ph';
      ph.innerHTML =
        '<svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">' +
        '<rect x="2" y="6" width="30" height="22" rx="3"/>' +
        '<circle cx="11" cy="13" r="3"/>' +
        '<path d="M2 22l9-8 6 6 4-4 13 12" stroke-linecap="round"/>' +
        '</svg>';
      div.appendChild(ph);
    }

    /* Caption overlay */
    if (item.caption) {
      var cap = document.createElement('span');
      cap.className   = 'galeri-photo__caption';
      cap.textContent = item.caption;
      div.appendChild(cap);
    }

    /* Click → lightbox */
    div.addEventListener('click', function(e) {
      if (e.target.closest('.galeri-photo__dev-acts')) return;
      if (item.src) openLightbox(item.src, item.caption || '');
    });

    /* Dev-mode delete button (visible on hover) */
    var devActs = document.createElement('div');
    devActs.className = 'galeri-photo__dev-acts';
    devActs.addEventListener('click', function(e) { e.stopPropagation(); });

    var delBtn = document.createElement('button');
    delBtn.className   = 'galeri-photo__act galeri-photo__act--del';
    delBtn.type        = 'button';
    delBtn.title       = 'Hapus foto ini';
    delBtn.textContent = '×';
    delBtn.addEventListener('click', (function(id) {
      return function(e) {
        e.stopPropagation();
        deletePhoto(id);
      };
    }(item.id)));

    devActs.appendChild(delBtn);
    div.appendChild(devActs);

    return div;
  }

  /* ── Lightbox ─────────────────────────────────────────── */
  function openLightbox(src, caption) {
    lightboxImg.src = src;
    if (lightboxCap) lightboxCap.textContent = caption || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('no-scroll');
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('no-scroll');
    /* Clear src after transition to avoid stale flash on next open */
    setTimeout(function() {
      lightboxImg.src = '';
      if (lightboxCap) lightboxCap.textContent = '';
    }, 380);
  }

  if (lightboxBack)  lightboxBack.addEventListener('click',  closeLightbox);
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

  /* ── Add photo modal ──────────────────────────────────── */
  function openModal() {
    pendingBase64 = null;
    form.reset();
    /* Reset preview */
    previewImg.src         = '';
    previewImg.style.display = 'none';
    uploadPh.style.display = 'flex';

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('no-scroll');
    setTimeout(function() { if (inputCaption) inputCaption.focus(); }, 100);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('no-scroll');
    pendingBase64 = null;
  }

  /* File input → base64 preview */
  uploadArea.addEventListener('click', function(e) {
    /* Avoid infinite loop when clicking the hidden input itself */
    if (e.target === inputFile) return;
    inputFile.click();
  });

  inputFile.addEventListener('change', function(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Pilih file gambar (JPG, PNG, WEBP, dll.)');
      return;
    }
    var reader = new FileReader();
    reader.onload = function(evt) {
      pendingBase64         = evt.target.result;
      previewImg.src        = pendingBase64;
      previewImg.style.display = 'block';
      uploadPh.style.display   = 'none';
      /* Clear URL field since file takes priority */
      if (inputUrl) inputUrl.value = '';
    };
    reader.readAsDataURL(file);
  });

  /* URL field → show preview live */
  if (inputUrl) {
    inputUrl.addEventListener('input', function() {
      var val = inputUrl.value.trim();
      if (val && (val.startsWith('http://') || val.startsWith('https://'))) {
        pendingBase64           = null;
        previewImg.src          = val;
        previewImg.style.display = 'block';
        uploadPh.style.display   = 'none';
      } else if (!val) {
        previewImg.src           = '';
        previewImg.style.display = 'none';
        uploadPh.style.display   = 'flex';
      }
    });
  }

  /* Form submit */
  function handleSubmit(e) {
    e.preventDefault();
    var src     = pendingBase64 || (inputUrl ? inputUrl.value.trim() : '');
    var caption = inputCaption ? inputCaption.value.trim() : '';

    if (!src) {
      alert('Pilih foto dari perangkat atau masukkan URL gambar terlebih dahulu.');
      return;
    }

    data.push({ id: uid(), src: src, caption: caption });
    saveData();
    closeModal();
    render();
  }

  if (addBtn)   addBtn.addEventListener('click',    openModal);
  if (modalBack) modalBack.addEventListener('click', closeModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (cancelBtn)  cancelBtn.addEventListener('click',  closeModal);
  if (form)       form.addEventListener('submit', handleSubmit);

  /* ── Delete ───────────────────────────────────────────── */
  function deletePhoto(id) {
    if (!confirm('Hapus foto ini dari galeri?')) return;
    data = data.filter(function(p) { return p.id !== id; });
    saveData();
    render();
  }

  /* ── Keyboard shortcuts ───────────────────────────────── */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (lightbox.classList.contains('is-open')) closeLightbox();
      else if (modal.classList.contains('is-open')) closeModal();
    }
  });

  /* ── Init ─────────────────────────────────────────────── */
  loadData();
  render();

}());

/* ================================================================
   KONTAK — Reveal Animation (IntersectionObserver)
   Memunculkan elemen kontak saat di-scroll ke section ini.
   ▸ .kontak__left  → fade+slide dari bawah
   ▸ .kontak-card   → staggered fade+slide (kartu 1, lalu kartu 2)
================================================================ */

(function initKontakReveal() {

  if (!('IntersectionObserver' in window)) {
    /* Fallback: langsung tampilkan semua */
    var fallbackEls = document.querySelectorAll(
      '.kontak__left, .kontak-card'
    );
    fallbackEls.forEach(function(el) {
      el.classList.add('is-visible');
    });
    return;
  }

  /* ── Observer untuk elemen kiri (headline) ── */
  var leftEl = document.getElementById('kontakLeft');

  if (leftEl) {
    var leftObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          leftObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    leftObs.observe(leftEl);
  }

  /* ── Observer untuk kartu-kartu (stagger) ── */
  var cards = document.querySelectorAll('.kontak-card');

  if (cards.length) {
    var cardObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var idx   = parseInt(entry.target.dataset.kontakIdx || 0);
          var delay = idx * 120; /* ms antar kartu */

          setTimeout(function() {
            entry.target.classList.add('is-visible');
          }, delay);

          cardObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    cards.forEach(function(card, i) {
      card.dataset.kontakIdx = i;
      cardObs.observe(card);
    });
  }

})();
