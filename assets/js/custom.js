(function () {
  "use strict";

  const GITHUB_USER = "aelogonpin";

  /**
   * Theme toggle (light / dark), persisted in localStorage.
   * The initial theme is already applied by the inline script in <head>
   * to avoid a flash; this only wires up the button.
   */
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    const icon = themeToggle.querySelector("i");

    const syncIcon = () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (icon) {
        icon.className = isDark ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
      }
    };

    syncIcon();

    themeToggle.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const next = isDark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      syncIcon();
    });
  }

  /**
   * Live GitHub stats (public repos + total stars) via the public
   * GitHub REST API. No auth required; fails silently on rate limit
   * or network errors, leaving the "–" placeholder.
   */
  const animateCount = (el, end, duration = 1200) => {
    const start = 0;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      el.textContent = Math.floor(progress * (end - start) + start);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = end;
      }
    };

    requestAnimationFrame(step);
  };

  const reposEl = document.getElementById("gh-repos-count");
  const starsEl = document.getElementById("gh-stars-count");

  if (reposEl || starsEl) {
    fetch(`https://api.github.com/users/${GITHUB_USER}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((user) => {
        if (reposEl) animateCount(reposEl, user.public_repos || 0);
        return fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`);
      })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((repos) => {
        if (starsEl && Array.isArray(repos)) {
          const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
          animateCount(starsEl, totalStars);
        }
      })
      .catch(() => {
        if (reposEl) reposEl.textContent = "—";
        if (starsEl) starsEl.textContent = "—";
      });
  }

  /**
   * Hero background: animated node network on a canvas.
   * Lightweight, dependency-free, respects prefers-reduced-motion.
   */
  const networkCanvas = document.getElementById("network-canvas");
  if (networkCanvas) {
    const ctx = networkCanvas.getContext("2d");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const MAX_DIST = 140;
    const AREA_PER_PARTICLE = 11000;
    let width = 0;
    let height = 0;
    let particles = [];
    let rafId = null;

    const resize = () => {
      width = networkCanvas.offsetWidth;
      height = networkCanvas.offsetHeight;
      networkCanvas.width = width;
      networkCanvas.height = height;

      const count = Math.min(90, Math.max(28, Math.floor((width * height) / AREA_PER_PARTICLE)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35
      }));
    };

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x <= 0 || p.x >= width) p.vx *= -1;
        if (p.y <= 0 || p.y >= height) p.vy *= -1;
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            ctx.strokeStyle = `rgba(20, 157, 221, ${1 - dist / MAX_DIST})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        ctx.fillStyle = "rgba(86, 194, 245, 0.9)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const loop = () => {
      drawFrame();
      rafId = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", () => {
      cancelAnimationFrame(rafId);
      resize();
      if (prefersReducedMotion) {
        drawFrame();
      } else {
        loop();
      }
    });

    if (prefersReducedMotion) {
      drawFrame();
    } else {
      loop();
    }
  }

  /**
   * Project details modal: opens with a smooth fade + scale transition
   * instead of navigating to a separate page.
   */
  const PROJECTS = {
    blfs: {
      title: "BLFS · Linux From Scratch",
      category: "Sistemas & Infra",
      date: "Febrero 2022",
      image: "assets/img/BLFS.avif",
      desc: "Beyond Linux From Scratch (BLFS) continúa donde termina el libro LFS: una amplia guía de instrucciones para instalar y configurar paquetes adicionales sobre un sistema Linux construido completamente desde el código fuente.",
      link: "https://www.linuxfromscratch.org/",
      linkLabel: "Sitio oficial de LFS"
    },
    kvm: {
      title: "IPnotics Dashboard & Homelab",
      category: "Sistemas & Infra",
      date: "Agosto 2022",
      image: "assets/img/KVM.png",
      desc: "Dashboard centralizado para mi homelab: acceso a nodos Proxmox, virtualización KVM y herramientas privadas de gestión (DNS, editores cloud, gestión de usuarios) desde un único panel.",
      link: "https://github.com/aelogonpin/Proyecto-Final",
      linkLabel: "Ver repositorio en GitHub"
    },
    asir: {
      title: "Proyecto Final ASIR",
      category: "Sistemas & Infra",
      date: "Agosto 2022",
      image: "assets/img/proyecto-finalasir.avif",
      desc: "Entorno web con sistema de login, dashboard y gestión de servicios de cloud computing sobre Proxmox, desarrollado como proyecto final del ciclo de Administración de Sistemas Informáticos en Red (IES Triana).",
      link: "",
      linkLabel: ""
    },
    monicrisp: {
      title: "monicrisp",
      category: "Herramientas & Open Source",
      date: "Marzo 2025",
      icon: "bx bx-pulse",
      accent: "#149ddd",
      desc: "Status page de disponibilidad al estilo Uptime Kuma, construida en Python, para monitorizar y comunicar en tiempo real el estado de un conjunto de servicios.",
      link: "https://github.com/aelogonpin/monicrisp",
      linkLabel: "Ver repositorio en GitHub"
    },
    "vault-tui": {
      title: "vault-tui",
      category: "Herramientas & Open Source",
      date: "Agosto 2026",
      icon: "bx bx-key",
      accent: "#8957e5",
      desc: "Aplicación TUI (interfaz de terminal) escrita en Go para operar sobre HashiCorp Vault sin necesitar acceso directo a la plataforma: gestión de secretos y operaciones desde la terminal.",
      link: "https://github.com/aelogonpin/vault-tui",
      linkLabel: "Ver repositorio en GitHub"
    },
    logwebui: {
      title: "logwebui",
      category: "Herramientas & Open Source",
      date: "Agosto 2026",
      icon: "bx bx-search-alt",
      accent: "#f97316",
      desc: "Interfaz web para buscar, visualizar y descargar logs desde Loki. Binario único en Go, sin dependencias, con exportación completa del ciclo de vida de los logs y autodescubrimiento de tenants vía Mimir.",
      link: "https://github.com/aelogonpin/logwebui",
      linkLabel: "Ver repositorio en GitHub"
    }
  };

  const modal = document.getElementById("project-modal");
  if (modal) {
    const mediaEl = document.getElementById("pm-media");
    const categoryEl = document.getElementById("pm-category");
    const titleEl = document.getElementById("pm-title");
    const dateEl = document.getElementById("pm-date");
    const descEl = document.getElementById("pm-desc");
    const linkEl = document.getElementById("pm-link");
    const linkLabelEl = document.getElementById("pm-link-label");
    let lastFocused = null;

    const openModal = (id) => {
      const data = PROJECTS[id];
      if (!data) return;

      categoryEl.textContent = data.category || "";
      titleEl.textContent = data.title || "";
      dateEl.textContent = data.date || "";
      descEl.textContent = data.desc || "";

      if (data.image) {
        mediaEl.innerHTML = `<img src="${data.image}" alt="">`;
        mediaEl.style.removeProperty("--accent");
        mediaEl.classList.remove("project-modal-media-generated");
      } else {
        mediaEl.innerHTML = `<i class="${data.icon}"></i>`;
        mediaEl.style.setProperty("--accent", data.accent || "#149ddd");
        mediaEl.classList.add("project-modal-media-generated");
      }

      if (data.link) {
        linkEl.href = data.link;
        linkLabelEl.textContent = data.linkLabel || "Ver proyecto";
        linkEl.style.display = "";
      } else {
        linkEl.style.display = "none";
      }

      lastFocused = document.activeElement;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      modal.querySelector(".project-modal-close").focus();
    };

    const closeModal = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    };

    document.querySelectorAll("[data-project]").forEach((el) => {
      el.addEventListener("click", () => openModal(el.getAttribute("data-project")));
    });

    modal.querySelectorAll("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) {
        closeModal();
      }
    });
  }

})();
