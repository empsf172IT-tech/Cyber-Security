/**
 * VANTA//SEC - Core Platform Scripts
 * Manages theme switching, RTL localization, audio synthesis, mobile nav, and telemetry.
 */

// Acoustic feedback synthesizer using Web Audio API
class TacticalAudio {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('vanta_sound') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playClick(freq = 800, duration = 0.04) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('vanta_sound', this.enabled);
    return this.enabled;
  }
}

const tacticalSound = new TacticalAudio();

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Management
  const themeToggleButtons = document.querySelectorAll('.btn-theme-toggle');
  const storedTheme = localStorage.getItem('vanta_theme') || 'dark';

  function setTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
      themeToggleButtons.forEach(btn => {
        const showText = btn.classList.contains('gap-1.5');
        btn.innerHTML = `
          <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          ${showText ? `<span class="text-xs font-mono hidden sm:inline text-slate-700">LIGHT</span>` : ''}
        `;
      });
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.add('dark');
      themeToggleButtons.forEach(btn => {
        const showText = btn.classList.contains('gap-1.5');
        btn.innerHTML = `
          <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          ${showText ? `<span class="text-xs font-mono hidden sm:inline">DARK</span>` : ''}
        `;
      });
    }
    localStorage.setItem('vanta_theme', theme);
  }

  setTheme(storedTheme);

  themeToggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tacticalSound.playClick(1000, 0.05);
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      setTheme(current === 'light' ? 'dark' : 'light');
    });
  });

  // 3. Audio Toggle Buttons
  const soundToggles = document.querySelectorAll('.btn-sound-toggle');
  function updateSoundButtonUI(btn) {
    const isMuted = !tacticalSound.enabled;
    btn.setAttribute('title', isMuted ? 'Tactical Audio: OFF' : 'Tactical Audio: ON');
    btn.innerHTML = isMuted ? `
      <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
      </svg>
    ` : `
      <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
    `;
  }

  soundToggles.forEach(btn => {
    updateSoundButtonUI(btn);
    btn.addEventListener('click', () => {
      const active = tacticalSound.toggle();
      updateSoundButtonUI(btn);
      if (active) tacticalSound.playClick(1200, 0.06);
    });
  });

  // Attach soft clicks to general interactive elements
  document.querySelectorAll('a, button, input[type="radio"], input[type="checkbox"]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      tacticalSound.playClick(1400, 0.015);
    });
  });

  // 4. Mobile Navigation Drawer
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const drawerBackdrop = document.getElementById('drawer-backdrop');

  function openMobileMenu() {
    if (mobileDrawer) {
      mobileDrawer.classList.remove('translate-x-full', '-translate-x-full');
      mobileDrawer.classList.add('translate-x-0');
    }
    if (drawerBackdrop) {
      drawerBackdrop.classList.remove('opacity-0', 'pointer-events-none');
      drawerBackdrop.classList.add('opacity-100');
    }
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (mobileDrawer) {
      mobileDrawer.classList.remove('translate-x-0');
      mobileDrawer.classList.add('translate-x-full');
    }
    if (drawerBackdrop) {
      drawerBackdrop.classList.add('opacity-0', 'pointer-events-none');
      drawerBackdrop.classList.remove('opacity-100');
    }
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeMobileMenu);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeMobileMenu);

  // 5. Sticky Header blur & elevation
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (!header) return;
    if (window.scrollY > 25) {
      header.classList.add('shadow-lg', 'border-b', 'border-cyan-500/20');
      header.style.backgroundColor = 'var(--header-bg)';
    } else {
      header.classList.remove('shadow-lg', 'border-b', 'border-cyan-500/20');
      header.style.backgroundColor = 'var(--header-bg)';
    }
  });

  // 6. Threat Pulse Telemetry Fluctuations
  const telemetryScanEl = document.getElementById('telemetry-scan');
  const telemetryEventsEl = document.getElementById('telemetry-events');
  const telemetryNodesEl = document.getElementById('telemetry-nodes');
  const telemetryBlockedEl = document.getElementById('telemetry-blocked');

  if (telemetryEventsEl) {
    setInterval(() => {
      // Subtle fluctuations for realism
      const current = parseInt(telemetryEventsEl.textContent || '24', 10);
      const delta = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      const nextVal = Math.max(18, Math.min(32, current + delta));
      telemetryEventsEl.textContent = nextVal.toString().padStart(2, '0');
    }, 4000);
  }

  if (telemetryBlockedEl) {
    let count = 48190;
    setInterval(() => {
      count += Math.floor(Math.random() * 4) + 1;
      telemetryBlockedEl.textContent = count.toLocaleString();
    }, 2800);
  }

  // 7. Back to Top Button
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
        backToTopBtn.classList.add('opacity-100');
      } else {
        backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
        backToTopBtn.classList.remove('opacity-100');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      tacticalSound.playClick(1100, 0.05);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
