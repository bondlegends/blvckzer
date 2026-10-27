/**
 * Kerala Follow - PWA Install Banner & Service Worker Handler
 */
(function () {
  let deferredPrompt = null;
  const DISMISS_COOLDOWN_HOURS = 24; // Show again after 24 hours if dismissed

  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  // Check if app is already running in standalone (installed) mode
  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  // Check dismissal cooldown in localStorage
  function isDismissedRecently() {
    const dismissedAt = localStorage.getItem('kfollow_pwa_dismissed');
    if (!dismissedAt) return false;
    const hours = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
    return hours < DISMISS_COOLDOWN_HOURS;
  }

  // Detect iOS Safari
  function isIosSafari() {
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
    return isIos && isSafari;
  }

  // Ensure Banner DOM elements exist
  function createBanner() {
    if (document.getElementById('kf-pwa-banner')) {
      return document.getElementById('kf-pwa-banner');
    }

    const banner = document.createElement('div');
    banner.id = 'kf-pwa-banner';
    banner.innerHTML = `
      <button class="kf-pwa-close-btn" id="kfPwaClose" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="kf-pwa-content">
        <img src="/icons/kf-logo.png?v=1" alt="Kerala Follow Logo" class="kf-pwa-logo" />
        <div class="kf-pwa-info">
          <h4 class="kf-pwa-title">
            Kerala Follow
            <span class="kf-pwa-badge">Fast App</span>
          </h4>
          <p class="kf-pwa-desc">Install app for instant access & seamless experience</p>
        </div>
      </div>
      <div class="kf-pwa-actions">
        <button class="kf-pwa-btn kf-pwa-btn-cancel" id="kfPwaCancel">Cancel</button>
        <button class="kf-pwa-btn kf-pwa-btn-install" id="kfPwaInstall">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Install
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    // Bind event listeners
    document.getElementById('kfPwaCancel').addEventListener('click', dismissBanner);
    document.getElementById('kfPwaClose').addEventListener('click', dismissBanner);
    document.getElementById('kfPwaInstall').addEventListener('click', handleInstallClick);

    return banner;
  }

  // Only display banner on homepage
  function isHomePage() {
    const p = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    return p === '/' || p === '/index.php' || p === '/index.html';
  }

  function showBanner() {
    if (!isHomePage() || isStandalone() || isDismissedRecently()) return;
    const banner = createBanner();
    // Smooth delay before presenting
    setTimeout(() => {
      banner.classList.add('show');
    }, 600);
  }

  function hideBanner() {
    const banner = document.getElementById('kf-pwa-banner');
    if (banner) {
      banner.classList.remove('show');
    }
  }

  function dismissBanner() {
    hideBanner();
    localStorage.setItem('kfollow_pwa_dismissed', Date.now().toString());
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      // Trigger native browser install prompt (Chrome / Android / Edge)
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      console.log('[PWA] User choice:', choice.outcome);
      if (choice.outcome === 'accepted') {
        hideBanner();
      }
      deferredPrompt = null;
    } else if (isIosSafari()) {
      // Guide iOS user
      alert("To install Kerala Follow on iPhone:\n1. Tap the Share button at the bottom (box with arrow)\n2. Scroll down and tap 'Add to Home Screen' (+)");
    } else {
      hideBanner();
    }
  }

  // 2. Intercept beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar on mobile Chrome
    e.preventDefault();
    deferredPrompt = e;
    if (isHomePage()) {
      showBanner();
    }
  });

  // 3. Listen for appinstalled
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Kerala Follow was installed!');
    hideBanner();
    deferredPrompt = null;
    localStorage.removeItem('kfollow_pwa_dismissed');
  });

  // 4. iOS Safari Check
  window.addEventListener('DOMContentLoaded', () => {
    if (isHomePage() && isIosSafari() && !isStandalone() && !isDismissedRecently()) {
      showBanner();
    }
  });
})();
