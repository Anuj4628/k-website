const loadedComponents = new Set();

function loadComponent(id, file, callback) {
  const container = document.getElementById(id);
  if (!container) return;

  if (loadedComponents.has(id)) {
    if (callback) callback();
    return;
  }

  loadedComponents.add(id);
  fetch(file)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.status}`);
      return res.text();
    })
    .then(data => {
      container.innerHTML = data;
      if (callback) callback();
    })
    .catch(err => {
      console.error(err);
      loadedComponents.delete(id);
    });
}
const themeMap = {
  orange: {
    "--accent": "#f97316",
    "--accent-dark": "#c2410c",
    "--accent-soft": "#fff1e7",
  },
  green: {
    "--accent": "#0f766e",
    "--accent-dark": "#115e59",
    "--accent-soft": "#e7f6f4",
  },
  blue: {
    "--accent": "#1d4ed8",
    "--accent-dark": "#1e40af",
    "--accent-soft": "#e9f0ff",
  },
};


function applyTheme(name) {
  const theme = themeMap[name] || themeMap.orange;
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
  localStorage.setItem("ridge-theme", name);
  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.theme === name);
  });
}

function initThemeSwitcher() {
  applyTheme(localStorage.getItem("ridge-theme") || "orange");
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme]");
    if (!button) return;
    applyTheme(button.dataset.theme);
  });
}

function initNavigation() {
  const current = window.location.pathname.split("/").pop().toLowerCase() || "index.html";
  
  // Set active link
  document.querySelectorAll(".nav-menu a, .menu-flyout a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    const cleanHref = href.split("/").pop().toLowerCase();
    if (cleanHref === current || (current === "" && cleanHref === "index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  document.querySelectorAll(".has-menu").forEach((item) => {
    if (item.querySelector(".menu-flyout a.active")) {
      const topLink = item.querySelector(":scope > a");
      if (topLink) topLink.classList.add("active");
    }
  });

  const navbar = document.querySelector(".navbar") || document.getElementById("navbar");
  const hamburger = document.querySelector(".hamburger") || document.getElementById("hamburger");
  const pill = document.querySelector("[data-nav-pill]") || document.getElementById("navHoverPill");
  const navMenu = document.querySelector(".nav-menu") || document.getElementById("navMenu");
  const topLinks = document.querySelectorAll(".nav-menu > a, .nav-menu > li > a");
  const activeLink = document.querySelector(".nav-menu a.active") || topLinks[0];

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasAnime = typeof window.anime === "function" && !reducedMotion;

  function movePill(link, instant = false) {
    if (!pill || !navMenu || !link || window.innerWidth <= 1080) return;
    const linkBox = link.getBoundingClientRect();
    const menuBox = navMenu.getBoundingClientRect();
    const target = {
      left: linkBox.left - menuBox.left,
      width: linkBox.width,
    };
    pill.classList.add("is-visible");

    if (hasAnime && !instant) {
      window.anime.remove(pill);
      window.anime({
        targets: pill,
        left: target.left,
        width: target.width,
        opacity: 1,
        duration: 350,
        easing: "easeOutQuad",
      });
    } else {
      pill.style.left = `${target.left}px`;
      pill.style.width = `${target.width}px`;
      pill.style.opacity = "1";
    }
  }

  function hidePill() {
    if (!pill || !activeLink || window.innerWidth <= 1080) return;
    movePill(activeLink);
  }

  if (activeLink) movePill(activeLink, true);

  topLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => movePill(link));
    link.addEventListener("focus", () => movePill(link));
  });

  if (navMenu) {
    navMenu.addEventListener("mouseleave", hidePill);
  }

  function closeMobileMenu() {
    if (navbar) navbar.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    if (hamburger) hamburger.setAttribute("aria-expanded", "false");
    document.querySelectorAll(".has-menu").forEach((li) => li.classList.remove("is-open"));
  }

  function toggleMobileMenu() {
    const isOpen = navbar ? navbar.classList.contains("is-open") : document.body.classList.contains("nav-open");
    const nextState = !isOpen;
    if (navbar) navbar.classList.toggle("is-open", nextState);
    document.body.classList.toggle("nav-open", nextState);
    if (hamburger) hamburger.setAttribute("aria-expanded", String(nextState));
  }

  // Global delegated click listener for menu and dropdowns
  document.removeEventListener("click", window._navClickListener);
  window._navClickListener = function (event) {
    const toggleBtn = event.target.closest(".hamburger, [data-nav-toggle]");
    const dropdownBtn = event.target.closest(".dropdown-toggle, .has-menu > a");
    const navLinkItem = event.target.closest(".nav-menu a:not(.dropdown-toggle), .dropdown-item, .mobile-nav-actions a");
    const overlayClick = event.target.closest(".nav-overlay, [data-nav-close]");

    if (overlayClick) {
      closeMobileMenu();
      return;
    }

    if (toggleBtn) {
      event.preventDefault();
      event.stopPropagation();
      toggleMobileMenu();
      return;
    }

    if (dropdownBtn) {
      event.preventDefault();
      const parentLi = dropdownBtn.closest(".has-menu");
      if (parentLi) {
        const wasOpen = parentLi.classList.contains("is-open");
        // Close other open submenus
        document.querySelectorAll(".has-menu").forEach((li) => {
          if (li !== parentLi) li.classList.remove("is-open");
        });
        parentLi.classList.toggle("is-open", !wasOpen);
        dropdownBtn.setAttribute("aria-expanded", String(!wasOpen));
      }
      return;
    }

    if (navLinkItem) {
      document.querySelectorAll(".has-menu").forEach((li) => li.classList.remove("is-open"));
      closeMobileMenu();
      return;
    }

    // Close open dropdowns when clicking outside
    if (!event.target.closest(".has-menu")) {
      document.querySelectorAll(".has-menu").forEach((li) => {
        li.classList.remove("is-open");
        const toggle = li.querySelector(".dropdown-toggle");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      });
    }

    // Close when clicking outside navbar container on mobile
    if (document.body.classList.contains("nav-open") || (navbar && navbar.classList.contains("is-open"))) {
      if (!event.target.closest(".navbar, #navbar")) {
        closeMobileMenu();
      }
    }
  };
  document.addEventListener("click", window._navClickListener);

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileMenu();
  });

  // Header scroll shadow effect
  function syncHeaderScroll() {
    const siteHeader = document.querySelector(".navbar, .site-header");
    if (!siteHeader) return;
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  syncHeaderScroll();
  window.addEventListener("scroll", syncHeaderScroll, { passive: true });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1080) {
      closeMobileMenu();
      if (activeLink) movePill(activeLink, true);
    }
  });
}

function initBackTop() {
  const button = document.querySelector("[data-back-top]");
  if (!button) return;
  window.addEventListener("scroll", () => {
    button.classList.toggle("is-visible", window.scrollY > 500);
  });
  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initScrollProgress() {
  const progress = document.querySelector("[data-scroll-progress]");
  if (!progress) return;

  const fill = progress.querySelector("span");
  if (!fill) return;

  function updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0;
    fill.style.transform = `scaleY(${ratio})`;
  }

  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
}

function initFilters() {
  const filterBars = document.querySelectorAll("[data-filter-group]");
  filterBars.forEach((bar) => {
    bar.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      const target = button.dataset.filter;
      const scope = document.querySelector(bar.dataset.filterGroup);
      if (!scope) return;

      bar.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");

      scope.querySelectorAll("[data-category]").forEach((card) => {
        card.classList.toggle("hidden", target !== "all" && card.dataset.category !== target);
      });
    });
  });
}

function initAccordions() {
  document.querySelectorAll("[data-accordion]").forEach((accordion) => {
    accordion.addEventListener("click", (event) => {
      const trigger = event.target.closest(".accordion-trigger");
      if (!trigger) return;
      const item = trigger.closest(".accordion-item");
      item.classList.toggle("is-open");
    });
  });
}

function initForms() {
  document.querySelectorAll("[data-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector(".form-status");
      if (status) status.textContent = "Thanks. Your request has been captured for follow-up.";
      form.reset();
    });
  });
}

function initShop() {
  let count = 0;
  const cartCount = document.querySelector("[data-cart-count]");
  document.querySelectorAll("[data-add-cart]").forEach((button) => {
    button.addEventListener("click", () => {
      count += 1;
      if (cartCount) cartCount.textContent = String(count);
      button.textContent = "Added";
      setTimeout(() => {
        button.innerHTML = 'Add to Cart <i class="fa-solid fa-plus"></i>';
      }, 1000);
    });
  });
}

function initHeroScene() {
  if (typeof window.THREE === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.querySelectorAll(".hero, .page-hero").forEach((section) => {
    const canvas = document.createElement("canvas");
    canvas.className = "hero-lines-canvas";
    canvas.setAttribute("aria-hidden", "true");
    section.prepend(canvas);

    const renderer = new window.THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new window.THREE.Scene();
    const camera = new window.THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 28;

    const group = new window.THREE.Group();
    scene.add(group);

    const material = new window.THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
    });
    const accentMaterial = new window.THREE.LineBasicMaterial({
      color: getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#f97316",
      transparent: true,
      opacity: 0.42,
    });

    const segments = [];
    for (let i = 0; i < 56; i += 1) {
      const x = (Math.random() - 0.1) * 42;
      const y = (Math.random() - 0.5) * 20;
      const len = 1.4 + Math.random() * 4.8;
      segments.push(x, y, 0, x + len, y + (Math.random() - 0.5) * 1.8, 0);
    }

    const geometry = new window.THREE.BufferGeometry();
    geometry.setAttribute("position", new window.THREE.Float32BufferAttribute(segments, 3));
    group.add(new window.THREE.LineSegments(geometry, material));

    const accentGeometry = new window.THREE.BufferGeometry();
    accentGeometry.setAttribute("position", new window.THREE.Float32BufferAttribute([
      -18, -7, 0, -7, -2, 0,
      -7, -2, 0, 5, -6, 0,
      4, 7, 0, 15, 3, 0,
      15, 3, 0, 22, 7, 0,
    ], 3));
    group.add(new window.THREE.LineSegments(accentGeometry, accentMaterial));

    function resize() {
      const width = section.clientWidth;
      const height = section.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function render(time) {
      group.rotation.z = Math.sin(time * 0.00035) * 0.015;
      group.position.x = Math.sin(time * 0.00025) * 0.35;
      group.position.y = Math.cos(time * 0.00022) * 0.25;
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(render);
  });
}

function initImageAnimations() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasAnime = typeof window.anime === "function" && !reducedMotion;
  document.documentElement.classList.add("motion-ready");
  const targets = document.querySelectorAll(
    ".image-stack img, .project-card, .post-card, .product-card, .team-card, .service-card, .value-card, .info-card, .quote-card, .hero-panel, .metric-card, .about-visual, .featured-project, .about-small-card, .about-main-image, .about-stat-card, .services-showcase, .service-pill, .constrc-cta-box"
  );

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        if (hasAnime) {
          window.anime({
            targets: entry.target,
            opacity: [0, 1],
            translateY: [36, 0],
            scale: [0.96, 1],
            duration: 760,
            delay: Number(entry.target.dataset.revealDelay || 0),
            easing: "easeOutCubic",
          });
        }
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16 });

    targets.forEach((target, index) => {
      target.dataset.revealDelay = String((index % 4) * 70);
      observer.observe(target);
    });
  } else {
    targets.forEach((target) => target.classList.add("is-visible"));
  }

  document.querySelectorAll(".project-card, .post-card, .product-card, .team-card").forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      if (reducedMotion || window.innerWidth < 900) return;
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${y * -5}deg) rotateY(${x * 6}deg) translateY(-7px)`;
      card.style.setProperty("--shine-x", `${(x + 0.5) * 100}%`);
      card.style.setProperty("--shine-y", `${(y + 0.5) * 100}%`);
    });

    card.addEventListener("mouseleave", () => {
      if (hasAnime) {
        window.anime({
          targets: card,
          rotateX: 0,
          rotateY: 0,
          translateY: 0,
          duration: 360,
          easing: "easeOutCubic",
        });
      } else {
        card.style.transform = "";
      }
    });
  });
}

function initHomeShowcase() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasAnime = typeof window.anime === "function" && !reducedMotion;
  const hero = document.querySelector(".constrc-hero");

  if (hero && hasAnime) {
    const heroIntroItems = hero.querySelectorAll(".constrc-hero-content > *, .hero-rail span, .hero-breadcrumbs, .hero-scroll-cue");
    const heroFloatCard = hero.querySelector(".hero-float-card");

    window.anime({
      targets: heroIntroItems,
      opacity: [0, 1],
      translateY: [26, 0],
      delay: window.anime.stagger(110),
      duration: 820,
      easing: "easeOutCubic",
    });

    if (heroFloatCard) {
      window.anime({
        targets: heroFloatCard,
        opacity: [0, 1],
        translateX: [42, 0],
        scale: [0.96, 1],
        duration: 950,
        delay: 220,
        easing: "easeOutExpo",
      });
    }
  } else if (hero) {
    hero.querySelectorAll(".constrc-hero-content > *, .hero-rail span, .hero-breadcrumbs, .hero-scroll-cue, .hero-float-card").forEach((item) => {
      item.style.opacity = "1";
    });
  }

  const countTargets = document.querySelectorAll("[data-count-up]");
  if (countTargets.length) {
    const animateCount = (element) => {
      if (element.dataset.counted === "true") return;

      const rawTarget = element.dataset.countUp || element.textContent.trim();
      const suffix = element.dataset.countSuffix || "";
      const value = Number(rawTarget);

      if (!Number.isFinite(value)) {
        element.dataset.counted = "true";
        return;
      }

      element.dataset.counted = "true";

      if (reducedMotion) {
        const finalValue = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-US");
        element.textContent = `${finalValue}${suffixText}`;
        return;
      }

      const decimals = rawTarget.includes(".") || suffix.startsWith(".") ? 1 : 0;
      const suffixText = suffix.startsWith(".") ? "" : suffix;
      const start = { value: 0 };

      window.anime({
        targets: start,
        value,
        round: decimals ? undefined : 1,
        duration: 1400,
        easing: "easeOutExpo",
        update: () => {
          const current = decimals ? start.value.toFixed(decimals) : Math.round(start.value).toLocaleString("en-US");
          element.textContent = `${current}${suffixText}`;
        },
        complete: () => {
          const finalValue = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-US");
          element.textContent = `${finalValue}${suffixText}`;
        },
      });
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.45 });

      countTargets.forEach((target) => observer.observe(target));
    } else {
      countTargets.forEach(animateCount);
    }
  }

  document.querySelectorAll("[data-parallax-card]").forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      if (reducedMotion || window.innerWidth < 960) return;
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      card.style.transform = `perspective(1200px) rotateX(${y * -4}deg) rotateY(${x * 5}deg) translateY(-6px)`;
    });

    card.addEventListener("mouseleave", () => {
      if (hasAnime) {
        window.anime({
          targets: card,
          rotateX: 0,
          rotateY: 0,
          translateY: 0,
          duration: 380,
          easing: "easeOutCubic",
        });
      } else {
        card.style.transform = "";
      }
    });
  });
}

function initSnapSlider() {
  const sliders = document.querySelectorAll('#project-grid');
  
  sliders.forEach((slider) => {
    if (slider.id === 'project-grid') {
      slider.style.display = 'flex';
      slider.style.overflowX = 'auto';
      slider.style.scrollSnapType = 'x mandatory';
      slider.style.scrollBehavior = 'smooth';
      slider.style.scrollbarWidth = 'none';
      slider.style.gap = '24px';
      slider.style.paddingBottom = '24px';
      
      Array.from(slider.children).forEach((card) => {
        card.style.flex = '0 0 min(400px, 85vw)';
        card.style.scrollSnapAlign = 'center';
        card.style.scrollSnapStop = 'always';
      });
    }

    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
      isDown = true;
      slider.style.scrollSnapType = 'none';
      slider.style.cursor = 'grabbing';
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener('mouseleave', () => {
      isDown = false;
      slider.style.scrollSnapType = 'x mandatory';
      slider.style.cursor = 'auto';
    });
    slider.addEventListener('mouseup', () => {
      isDown = false;
      slider.style.scrollSnapType = 'x mandatory';
      slider.style.cursor = 'auto';
    });
    slider.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;
      slider.scrollLeft = scrollLeft - walk;
    });

    slider.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
        const isAtEnd = slider.scrollLeft >= maxScrollLeft - 5;
        const isAtStart = slider.scrollLeft <= 5;
        
        if ((e.deltaY > 0 && !isAtEnd) || (e.deltaY < 0 && !isAtStart)) {
          e.preventDefault();
          slider.scrollBy({
            left: e.deltaY > 0 ? window.innerWidth * 0.4 : -window.innerWidth * 0.4,
            behavior: 'smooth'
          });
        }
      }
    }, { passive: false });
  });
}

document.addEventListener("DOMContentLoaded", () => {

  // LOAD HEADER
  loadComponent("header", "header.html", () => {
    const navbar = document.querySelector(".navbar");
    if (navbar) navbar.classList.add("is-ready");
    initNavigation();
  });

  // LOAD FOOTER
  loadComponent("footer", "footer.html");

  // INITIALIZE OTHER UTILITIES
  initThemeSwitcher();
  initNavigation();
  initBackTop();
  initScrollProgress();
  initFilters();
  initAccordions();
  initForms();
  initShop();
  initHeroScene();
  initImageAnimations();
  initHomeShowcase();
  initSnapSlider();
});


