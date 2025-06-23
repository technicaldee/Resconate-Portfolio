// Modern JavaScript for Resconate Portfolio
// ES6+ syntax with modular architecture and performance optimizations

class PortfolioApp {
  constructor() {
    this.header = document.querySelector('.header');
    this.mobileMenu = document.getElementById('mobile-menu');
    this.mobileMenuButton = document.getElementById('mobile-menu-button');
    this.closeMenuButton = document.getElementById('close-menu-button');
    this.themeToggle = document.getElementById('theme-toggle');
    this.observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    this.initializeHeader();
    this.initializeMobileMenu();
    this.initializeSmoothScrolling();
    this.initializeScrollAnimations();
    this.initializeImageModals();
    this.initializeFormHandling();
    this.initializeThemeToggle();
    this.initializeNotifications();
    this.initializeStatistics();
    this.initializeModals();
  }

  initializeHeader() {
    this.setupEventListeners();
    this.setupIntersectionObserver();
    this.setupSmoothScrolling();
    this.setupHeaderScrollEffect();
    this.setupImageModals();
    this.setupFormValidation();
    this.setupAnimations();
    this.setupThemeToggle();
    this.updateCurrentYear();
  }

  initializeMobileMenu() {
    // Mobile menu functionality
    if (this.mobileMenuButton) {
      this.mobileMenuButton.addEventListener('click', () => this.openMobileMenu());
    }

    if (this.closeMenuButton) {
      this.closeMenuButton.addEventListener('click', () => this.closeMobileMenu());
    }

    // Close mobile menu when clicking on links
    const mobileMenuLinks = this.mobileMenu?.querySelectorAll('a');
    if (mobileMenuLinks) {
      mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => this.closeMobileMenu());
      });
    }

    // Close mobile menu when clicking outside
    if (this.mobileMenu) {
      this.mobileMenu.addEventListener('click', (e) => {
        if (e.target === this.mobileMenu) {
          this.closeMobileMenu();
        }
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeMobileMenu();
        this.closeAllModals();
      }
    });
  }

  initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          const headerHeight = this.header?.offsetHeight || 80;
          const targetPosition = targetElement.offsetTop - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Update active navigation link
          this.updateActiveNavLink(targetId);
        }
      });
    });
  }

  initializeScrollAnimations() {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateHeader = () => {
      if (this.header) {
        if (window.scrollY > 100) {
          this.header.classList.add('scrolled');
        } else {
          this.header.classList.remove('scrolled');
        }
      }
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestTick, { passive: true });
  }

  initializeImageModals() {
    // Profile image modal
    const profileImage = document.getElementById('profileImage');
    const imageModal = document.getElementById('imageModal');
    const expandedImage = document.getElementById('expandedImage');
    const closeImageModal = document.getElementById('closeImageModal');

    if (profileImage && imageModal && expandedImage && closeImageModal) {
      profileImage.addEventListener('click', () => {
        expandedImage.src = profileImage.src;
        this.openModal('imageModal');
      });

      closeImageModal.addEventListener('click', () => {
        this.closeModal('imageModal');
      });

      // Close when clicking outside
      imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) {
          this.closeModal('imageModal');
        }
      });
    }

    // Project image modals
    const projectImages = document.querySelectorAll('.project-image');
    const projectImageModal = document.getElementById('projectImageModal');
    const expandedProjectImage = document.getElementById('expandedProjectImage');
    const closeProjectImageModal = document.getElementById('closeProjectImageModal');

    if (projectImageModal && expandedProjectImage && closeProjectImageModal) {
      projectImages.forEach(img => {
        img.addEventListener('click', () => {
          expandedProjectImage.src = img.src;
          expandedProjectImage.alt = img.alt;
          this.openModal('projectImageModal');
        });
      });

      closeProjectImageModal.addEventListener('click', () => {
        this.closeModal('projectImageModal');
      });

      // Close when clicking outside
      projectImageModal.addEventListener('click', (e) => {
        if (e.target === projectImageModal) {
          this.closeModal('projectImageModal');
        }
      });
    }
  }

  initializeFormHandling() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmission(contactForm);
      });
    }
  }

  initializeAnimations() {
    // Project card hover effects
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
      const image = card.querySelector('img');
      
      if (image) {
        card.addEventListener('mouseenter', () => {
          image.style.transform = 'scale(1.05)';
        });
        
        card.addEventListener('mouseleave', () => {
          image.style.transform = 'scale(1)';
        });
      }
    });

    // Certificate card hover effects
    const certificateCards = document.querySelectorAll('.certificate-card');
    certificateCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
      });
    });
  }

  initializeThemeToggle() {
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  initializeModals() {
    // Get all modals
    const modals = document.querySelectorAll('[id$="Modal"]');
    
    modals.forEach(modal => {
      // Hide modal by default
      modal.style.display = 'none';
      
      // Find close button within this modal
      const closeBtn = modal.querySelector('[id^="close"]') || modal.querySelector('.modal__close');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.closeModal(modal.id);
        });
      }
      
      // Close modal when clicking outside content
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });
    });
    
    // Add click handlers for modal triggers
    document.addEventListener('click', (e) => {
      if (e.target.matches('[onclick*="openModal"]')) {
        e.preventDefault();
        const modalId = e.target.getAttribute('onclick').match(/openModal\('([^']+)'\)/)?.[1];
        if (modalId) {
          this.openModal(modalId);
        }
      }
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
      // Use setTimeout to ensure display change is applied before adding active class
      setTimeout(() => {
        modal.classList.add('active');
      }, 10);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      // Wait for transition to complete before hiding
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
      
      // Restore body scroll
      document.body.style.overflow = '';
    }
  }

  // Mobile Menu Methods
  openMobileMenu() {
    if (this.mobileMenu) {
      this.mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.mobileMenuButton?.setAttribute('aria-expanded', 'true');
    }
  }

  closeMobileMenu() {
    if (this.mobileMenu) {
      this.mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
      this.mobileMenuButton?.setAttribute('aria-expanded', 'false');
    }
  }

  // Animation Methods
  animateCounter(element) {
    const counter = element.querySelector('[data-count]');
    if (!counter || counter.dataset.animated === 'true') return;

    const target = parseInt(counter.dataset.count);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    counter.dataset.animated = 'true';

    const updateCounter = () => {
      current += step;
      if (current < target) {
        counter.textContent = Math.floor(current);
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target;
      }
    };

    updateCounter();
  }

  // Navigation Methods
  updateActiveNavLink(targetId) {
    const navLinks = document.querySelectorAll('.header__nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === targetId) {
        link.classList.add('active');
      }
    });
  }

  // Theme Methods
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update theme toggle icon
    const icon = this.themeToggle?.querySelector('i');
    if (icon) {
      icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
  }

  // Form Methods
  async handleFormSubmission(form) {
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add('loading');
    }

    try {
      // Simulate form submission (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.showNotification('Message sent successfully!', 'success');
      form.reset();
    } catch (error) {
      this.showNotification('Failed to send message. Please try again.', 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
      }
    }
  }

  // Utility Methods
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('notification--visible'), 100);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      notification.classList.remove('notification--visible');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  updateCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          // Trigger counter animation for statistics
          if (entry.target.classList.contains('stat-card')) {
            this.animateCounter(entry.target);
          }
        }
      });
    }, this.observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll(
      '.fade-in, .slide-in-left, .slide-in-right, .stat-card, .project-card, .team-card, .certificate-card'
    );
    
    animatedElements.forEach(el => observer.observe(el));
  }
}

// Global modal functions for HTML onclick handlers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PortfolioApp();
});
