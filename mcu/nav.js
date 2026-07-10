(function () {
  const path = window.location.pathname.replace(/\/$/, "");
  const active =
    path === "/mcu" || path === "/mcu/index.html" ? "home"
    : path.includes("/upcoming") ? "upcoming"
    : path.includes("/shows")    ? "shows"
    : path.includes("/faq")      ? "faq"
    : path.includes("/changelog") ? "changelog"
    : "home";

  function link(href, id, label) {
    const cur = active === id ? ' aria-current="page"' : "";
    return `<a href="${href}"${cur}>${label}</a>`;
  }

  function dlink(href, id, icon, label, extra) {
    const cur = active === id ? ' aria-current="page"' : "";
    return `<a href="${href}"${cur}${extra || ""}>
              <img src="/menubar/${icon}" class="dropdown-icon" alt="">
              <span>${label}</span>
            </a>`;
  }

  const homeExtras = active === "home" ? `
            <button id="printBtn" type="button">
              <svg class="dropdown-icon" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>
              </svg>
              <span>Print Watch Order</span>
            </button>
            <button id="exportProgressBtn" type="button">
              <svg class="dropdown-icon" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>Export Progress</span>
            </button>
            <button id="importProgressBtn" type="button">
              <img src="/menubar/import.svg" class="dropdown-icon" alt="">
              <span>Import Progress</span>
            </button>
            <hr class="dropdown-separator">` : "";

  const html = `
    <div class="brand">
      <a href="/" aria-label="Aaron Perris home"><img src="/favicon/favicon-96x96.png" class="brand-mark" alt="" width="38" height="38"></a>
      <a href="/mcu" class="brand-text-link"><span class="brand-text">
        <strong>MCU Viewing Order</strong>
        <span>@aaronp613</span>
      </span></a>
    </div>
    <nav class="topbar-nav" aria-label="Primary">
      ${link("/mcu", "home", "Viewing Order")}
      ${link("/mcu/upcoming/", "upcoming", "Upcoming")}
      ${link("/mcu/shows/", "shows", "Show Status")}
      ${link("/mcu/faq/", "faq", "FAQ")}
      ${link("/mcu/changelog/", "changelog", "Change Log")}
      <a href="https://paypal.me/aaronp613" target="_blank" rel="noopener noreferrer">Donate</a>
    </nav>
    <div class="topbar-actions">
      <div class="menu-toggle">
        <button id="hamburger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="dropdown">
          <svg id="hamburger-icon" class="hamburger-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
            <line x1="2" y1="4.5" x2="14" y2="4.5"/>
            <line x1="2" y1="8" x2="14" y2="8"/>
            <line x1="2" y1="11.5" x2="14" y2="11.5"/>
          </svg>
        </button>
        <div id="dropdown" class="dropdown hidden">
          ${dlink("/mcu", "home", "home.svg", "Viewing Order", ' class="nav-only-mobile"')}
          ${dlink("/mcu/upcoming/", "upcoming", "articles.svg", "Upcoming", ' class="nav-only-mobile"')}
          ${dlink("/mcu/shows/", "shows", "products.svg", "Show Status", ' class="nav-only-mobile"')}
          ${dlink("/mcu/faq/", "faq", "faq.svg", "FAQ", ' class="nav-only-mobile"')}
          ${dlink("/mcu/changelog/", "changelog", "projects.svg", "Change Log", ' class="nav-only-mobile"')}
          <hr class="dropdown-separator nav-only-mobile">
          ${homeExtras}
          <a href="https://discord.com/invite/YCh8qet" target="_blank" rel="noopener noreferrer">
            <img src="/menubar/discord.svg" class="dropdown-icon" alt="">
            <span>Marvel Studios Discord</span>
          </a>
          <a href="https://x.com/aaronp613" target="_blank" rel="noopener noreferrer">
            <img src="/menubar/x.svg" class="dropdown-icon" alt="">
            <span>@aaronp613</span>
          </a>
          <a class="nav-only-mobile" href="https://paypal.me/aaronp613" target="_blank" rel="noopener noreferrer">
            <img src="/menubar/pay.svg" class="dropdown-icon" alt="">
            <span>Donate</span>
          </a>
          <hr class="dropdown-separator">
          <button id="installAppBtn" type="button" hidden>
            <img src="/mcu/icon.svg" class="dropdown-icon" alt="">
            <span>Install MCU App</span>
          </button>
          <button id="floating-theme-toggle" type="button" title="Toggle Theme" aria-label="Toggle color theme">
            <img src="/menubar/toggletheme.svg" class="dropdown-icon" alt="">
            <span>Toggle Theme</span>
          </button>
        </div>
      </div>
    </div>`;

  const header = document.createElement("header");
  header.className = "topbar";
  header.innerHTML = html;

  const shell = document.querySelector(".page-shell");
  if (shell) shell.insertBefore(header, shell.firstChild);

  // ── Theme ──
  function applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.body.classList.toggle("dark", theme === "dark");
    // single meta (faq/upcoming/shows/changelog)
    const single = document.getElementById("theme-color-meta");
    if (single) single.setAttribute("content", theme === "dark" ? "#0d1016" : "#eef1f6");
    // dual meta (index)
    const light = document.getElementById("theme-color-light");
    const dark  = document.getElementById("theme-color-dark");
    if (light) { light.media = theme === "dark" ? "not all" : "all"; }
    if (dark)  { dark.media  = theme === "dark" ? "all" : "not all"; }
    localStorage.setItem("theme", theme);
  }

  applyTheme(localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  document.getElementById("floating-theme-toggle").addEventListener("click", () => {
    applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
  });

  // ── Installable app ──
  const installButton = document.getElementById("installAppBtn");
  let installPrompt = null;

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!installPrompt) return;
    installButton.disabled = true;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
    installButton.disabled = false;
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    installButton.hidden = true;
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/mcu/sw.js", { scope: "/mcu/" }).catch(() => {
        // The tracker continues to work online when service-worker registration fails.
      });
    });
  }

  // ── Hamburger ──
  const hamburger     = document.getElementById("hamburger");
  const hamburgerIcon = document.getElementById("hamburger-icon");
  const dropdown      = document.getElementById("dropdown");

  hamburger.addEventListener("click", e => {
    e.stopPropagation();
    const isOpen = !dropdown.classList.toggle("hidden");
    hamburger.setAttribute("aria-expanded", String(isOpen));
    hamburgerIcon.classList.toggle("open", isOpen);
  });

  dropdown.addEventListener("click", e => e.stopPropagation());

  document.addEventListener("click", () => {
    dropdown.classList.add("hidden");
    hamburger.setAttribute("aria-expanded", "false");
    hamburgerIcon.classList.remove("open");
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || dropdown.classList.contains("hidden")) return;
    dropdown.classList.add("hidden");
    hamburger.setAttribute("aria-expanded", "false");
    hamburgerIcon.classList.remove("open");
    hamburger.focus();
  });

  // ── Overflow: move nav items to dropdown when they don't fit ──
  const navLinks     = Array.from(document.querySelectorAll(".topbar-nav a"));
  const dropNavLinks = Array.from(document.querySelectorAll("#dropdown .nav-only-mobile:not(hr)"));
  const dropSep      = document.querySelector("#dropdown hr.nav-only-mobile");

  function syncOverflow() {
    const nav = document.querySelector(".topbar-nav");
    if (!nav) return;

    const isMobile = window.getComputedStyle(nav).display === "none";
    if (isMobile) {
      navLinks.forEach(a => a.style.display = "");
      dropNavLinks.forEach(a => a.style.removeProperty("display"));
      if (dropSep) dropSep.style.removeProperty("display");
      return;
    }

    // Show all items so we can measure their natural positions
    navLinks.forEach(a => a.style.display = "");

    // Measure in one pass before making any changes
    const navRect     = nav.getBoundingClientRect();
    const overflowing = navLinks.map(a => {
      const r = a.getBoundingClientRect();
      return r.left < navRect.left - 1 || r.right > navRect.right + 1;
    });

    let anyPageOverflow = false;
    overflowing.forEach((over, i) => {
      navLinks[i].style.display = over ? "none" : "";
      const drop = dropNavLinks[i];
      if (drop) {
        if (over) {
          drop.style.setProperty("display", "flex", "important");
          // Only count internal page links, not external ones like Donate
          if (navLinks[i].hostname === location.hostname) anyPageOverflow = true;
        } else {
          drop.style.setProperty("display", "none", "important");
        }
      }
    });

    if (dropSep) {
      dropSep.style.setProperty("display", anyPageOverflow ? "block" : "none", "important");
    }
  }

  new ResizeObserver(syncOverflow).observe(document.querySelector(".topbar"));
  syncOverflow();
})();
