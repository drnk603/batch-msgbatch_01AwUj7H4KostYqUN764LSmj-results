(function() {
  'use strict';

  const CONFIG = {
    HEADER_SELECTOR: '.l-header',
    NAV_SELECTOR: '.c-nav#main-nav',
    NAV_TOGGLE_SELECTOR: '.c-nav__toggle',
    NAV_LIST_SELECTOR: '.c-nav__list',
    NAV_LINK_SELECTOR: '.c-nav__link',
    BURGER_BREAKPOINT: 1024,
    DEBOUNCE_DELAY: 250,
    THROTTLE_LIMIT: 100,
    REGEX: {
      EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      NAME: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/,
      PHONE: /^[\d\s\+\(\)\-]{10,20}$/,
      MESSAGE_MIN_LENGTH: 10
    }
  };

  const state = {
    initialized: false,
    menuOpen: false,
    activeSection: null
  };

  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  function getHeaderHeight() {
    const header = document.querySelector(CONFIG.HEADER_SELECTOR);
    return header ? header.offsetHeight : 80;
  }

  function initBurgerMenu() {
    const nav = document.querySelector(CONFIG.NAV_SELECTOR);
    const toggle = document.querySelector(CONFIG.NAV_TOGGLE_SELECTOR);
    const navList = document.querySelector(CONFIG.NAV_LIST_SELECTOR);
    const body = document.body;

    if (!nav || !toggle || !navList) return;

    const focusableSelector = 'a[href], button:not([disabled]), [tabindex="0"]';
    let firstFocusable, lastFocusable;

    function updateFocusableElements() {
      const elements = navList.querySelectorAll(focusableSelector);
      if (elements.length > 0) {
        firstFocusable = elements[0];
        lastFocusable = elements[elements.length - 1];
      }
    }

    function openMenu() {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      body.classList.add('u-no-scroll');
      state.menuOpen = true;
      updateFocusableElements();
      if (firstFocusable) firstFocusable.focus();
    }

    function closeMenu() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('u-no-scroll');
      state.menuOpen = false;
    }

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      state.menuOpen ? closeMenu() : openMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.menuOpen) {
        closeMenu();
        toggle.focus();
      }
      if (e.key === 'Tab' && state.menuOpen) {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (state.menuOpen && !nav.contains(e.target) && e.target !== toggle) {
        closeMenu();
      }
    });

    const navLinks = navList.querySelectorAll(CONFIG.NAV_LINK_SELECTOR);
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (state.menuOpen) closeMenu();
      });
    });

    const resizeHandler = debounce(() => {
      if (window.innerWidth >= CONFIG.BURGER_BREAKPOINT && state.menuOpen) {
        closeMenu();
      }
    }, CONFIG.DEBOUNCE_DELAY);

    window.addEventListener('resize', resizeHandler, { passive: true });
  }

  function initSmoothScroll() {
    const smoothLinks = document.querySelectorAll('a[href^="#"]:not([href="#"]):not([href="#!"])');

    smoothLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#' || href === '#!') return;

        const targetId = href.startsWith('#') ? href.substring(1) : null;
        if (!targetId) return;

        const target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          const offset = getHeaderHeight();
          const targetPos = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: targetPos, behavior: 'smooth' });
        }
      });
    });
  }

  function initActiveMenu() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(CONFIG.NAV_LINK_SELECTOR);

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      const linkPath = href.split('#')[0];
      if (linkPath === currentPath ||
          (currentPath === '/' && linkPath === 'index.html') ||
          (currentPath === '/index.html' && linkPath === '/')) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('active');
      }
    });
  }

  function createNotification(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>`;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 150);
      });
    }

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 150);
    }, 5000);
  }

  function validateField(field, value) {
    const name = field.name || field.id;
    
    if (field.hasAttribute('required') && !value.trim()) {
      return 'Dieses Feld ist erforderlich.';
    }

    if (field.type === 'email' && value) {
      if (!CONFIG.REGEX.EMAIL.test(value)) {
        return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
      }
    }

    if (field.type === 'tel' && value) {
      if (!CONFIG.REGEX.PHONE.test(value)) {
        return 'Bitte geben Sie eine gültige Telefonnummer ein.';
      }
    }

    if (field.type === 'text' && value && (name === 'firstName' || name === 'lastName' || name === 'name')) {
      if (!CONFIG.REGEX.NAME.test(value)) {
        return 'Bitte verwenden Sie nur Buchstaben, Bindestriche und Apostrophe.';
      }
    }

    if (field.tagName === 'TEXTAREA' && value) {
      if (value.length < CONFIG.REGEX.MESSAGE_MIN_LENGTH) {
        return `Bitte geben Sie mindestens ${CONFIG.REGEX.MESSAGE_MIN_LENGTH} Zeichen ein.`;
      }
    }

    if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
      return 'Bitte akzeptieren Sie die Datenschutzerklärung.';
    }

    return null;
  }

  function showFieldError(field, message) {
    field.classList.add('is-invalid');
    let feedback = field.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      field.parentElement.appendChild(feedback);
    }
    feedback.textContent = message;
  }

  function clearFieldError(field) {
    field.classList.remove('is-invalid');
    const feedback = field.parentElement.querySelector('.invalid-feedback');
    if (feedback) feedback.textContent = '';
  }

  function initForms() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
      const fields = form.querySelectorAll('input, select, textarea');
      
      fields.forEach(field => {
        field.addEventListener('blur', () => {
          const error = validateField(field, field.value);
          if (error) {
            showFieldError(field, error);
          } else {
            clearFieldError(field);
          }
        });

        field.addEventListener('input', () => {
          if (field.classList.contains('is-invalid')) {
            const error = validateField(field, field.value);
            if (!error) {
              clearFieldError(field);
            }
          }
        });
      });

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const fields = form.querySelectorAll('input, select, textarea');
        let isValid = true;
        let firstInvalidField = null;

        fields.forEach(field => {
          const value = field.type === 'checkbox' ? field.checked : field.value;
          const error = validateField(field, value);
          
          if (error) {
            showFieldError(field, error);
            isValid = false;
            if (!firstInvalidField) firstInvalidField = field;
          } else {
            clearFieldError(field);
          }
        });

        if (!isValid) {
          if (firstInvalidField) {
            firstInvalidField.focus();
          }
          createNotification('Bitte überprüfen Sie Ihre Eingaben.', 'danger');
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        let originalText = '';

        if (submitBtn) {
          submitBtn.disabled = true;
          originalText = submitBtn.innerHTML;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird gesendet...';
        }

        setTimeout(() => {
          window.location.href = 'thank_you.html';
        }, 800);
      });
    });
  }

  function initPortfolioFilter() {
    const filterButtons = document.querySelectorAll('.c-filter-btn');
    const portfolioItems = document.querySelectorAll('.c-portfolio-item');

    if (filterButtons.length === 0 || portfolioItems.length === 0) return;

    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        const filter = this.getAttribute('data-filter');

        filterButtons.forEach(btn => btn.classList.remove('is-active'));
        this.classList.add('is-active');

        portfolioItems.forEach(item => {
          if (filter === 'all' || item.classList.contains(filter)) {
            item.classList.remove('is-hidden');
          } else {
            item.classList.add('is-hidden');
          }
        });
      });
    });
  }

  function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll(CONFIG.NAV_LINK_SELECTOR);

    if (sections.length === 0 || navLinks.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: `-${getHeaderHeight()}px 0px -70% 0px`,
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          state.activeSection = id;

          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.classList.add('active');
              link.setAttribute('aria-current', 'page');
            } else {
              link.classList.remove('active');
              link.removeAttribute('aria-current');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
  }

  function initScrollToTop() {
    const scrollBtn = document.querySelector('.scroll-to-top');
    
    if (!scrollBtn) return;

    const toggleVisibility = throttle(() => {
      if (window.pageYOffset > 300) {
        scrollBtn.classList.add('is-visible');
      } else {
        scrollBtn.classList.remove('is-visible');
      }
    }, CONFIG.THROTTLE_LIMIT);

    window.addEventListener('scroll', toggleVisibility, { passive: true });

    scrollBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initLazyLoading() {
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
      if (!img.classList.contains('c-logo__img') && !img.hasAttribute('data-critical')) {
        img.setAttribute('loading', 'lazy');
      }
    });

    const videos = document.querySelectorAll('video:not([loading])');
    videos.forEach(video => {
      video.setAttribute('loading', 'lazy');
    });
  }

  function init() {
    if (state.initialized) return;
    state.initialized = true;

    initBurgerMenu();
    initSmoothScroll();
    initActiveMenu();
    initForms();
    initPortfolioFilter();
    initScrollSpy();
    initScrollToTop();
    initLazyLoading();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
