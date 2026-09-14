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

})();
