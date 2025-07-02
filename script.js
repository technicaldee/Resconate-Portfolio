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
    this.initializePortfolioFiltering();
    
    // Add window resize handler
    window.addEventListener('resize', () => this.handleWindowResize());
  }

  initializeHeader() {
    this.setupEventListeners();
    this.setupIntersectionObserver();
    this.setupHeaderScrollEffect();
    this.setupFormValidation();
    this.initializeAnimations();
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

    // Service card hover effects
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
      });
    });

    // Team card hover effects
    const teamCards = document.querySelectorAll('.team-card');
    teamCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
      });
    });

    // Scroll to top button visibility
    const scrollToTopBtn = document.querySelector('.scroll-to-top');
    if (scrollToTopBtn) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
          scrollToTopBtn.classList.add('visible');
        } else {
          scrollToTopBtn.classList.remove('visible');
        }
      });
    }
  }

  initializeThemeToggle() {
    // Load saved theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);

    // Set up theme toggle
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

  // Team Modal Methods
  openTeamModal(memberId) {
    const modalId = `${memberId}Modal`;
    this.openModal(modalId);
  }

  closeTeamModal(memberId) {
    const modalId = `${memberId}Modal`;
    this.closeModal(modalId);
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
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update theme toggle icon
    this.updateThemeIcon(newTheme);
  }

  updateThemeIcon(theme) {
    const icon = this.themeToggle?.querySelector('i');
    if (icon) {
      icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
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
      // Send form data to backend (multipart/form-data, do not set Content-Type)
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (response.ok) {
        this.showNotification(result.message || 'Message sent successfully!', 'success');
        form.reset();
      } else {
        this.showNotification(result.error || 'Failed to send message. Please try again.', 'error');
      }
    } catch (error) {
      this.showNotification('Network error. Please try again later.', 'error');
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

  // Setup Methods
  setupEventListeners() {
    // Window resize handler
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });

    // Scroll to top functionality
    const scrollToTopBtn = document.querySelector('.scroll-to-top');
    if (scrollToTopBtn) {
      scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // External link handling
    document.querySelectorAll('a[href^="http"]').forEach(link => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
  }

  setupHeaderScrollEffect() {
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

  setupFormValidation() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      // Real-time validation
      input.addEventListener('blur', () => {
        this.validateField(input);
      });

      input.addEventListener('input', () => {
        this.clearFieldError(input);
      });
    });
  }

  setupThemeToggle() {
    // Load saved theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);

    // Set up theme toggle
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  initializeNotifications() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
      const container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
  }

  initializeStatistics() {
    // Initialize statistics counter animation
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounter(entry.target);
          }
        });
      }, { threshold: 0.5 });

      statCards.forEach(card => observer.observe(card));
    }
  }

  // Utility Methods
  handleWindowResize() {
    // Close mobile menu on window resize if screen becomes large
    if (window.innerWidth > 768 && this.mobileMenu?.classList.contains('active')) {
      this.closeMobileMenu();
    }
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
      }
    }

    // Phone validation
    if (field.type === 'tel' && value) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(value.replace(/\s/g, ''))) {
        isValid = false;
        errorMessage = 'Please enter a valid phone number';
      }
    }

    if (!isValid) {
      this.showFieldError(field, errorMessage);
    } else {
      this.clearFieldError(field);
    }

    return isValid;
  }

  showFieldError(field, message) {
    this.clearFieldError(field);
    
    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
  }

  clearFieldError(field) {
    field.classList.remove('error');
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  closeAllModals() {
    const modals = document.querySelectorAll('[id$="Modal"]');
    modals.forEach(modal => {
      if (modal.style.display !== 'none') {
        this.closeModal(modal.id);
      }
    });
  }

  // Portfolio Filtering
  initializePortfolioFiltering() {
    const filterBar = document.getElementById('project-filters');
    const projectGrid = document.querySelector('#projects .mb-16 .grid');
    if (!filterBar || !projectGrid) return;

    let allProjects = [];

    // Fetch projects from backend
    fetch('/api/projects')
      .then(res => res.json())
      .then(projects => {
        allProjects = projects;
        this.renderProjects(projects, projectGrid);
      });

    // Filter logic
    filterBar.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        // Set active state
        filterBar.querySelectorAll('.filter-btn').forEach(btn => btn.setAttribute('aria-pressed', 'false'));
        e.target.setAttribute('aria-pressed', 'true');
        const filter = e.target.dataset.filter;
        let filtered = allProjects;
        if (filter && filter !== 'all') {
          filtered = allProjects.filter(p => p.category === filter);
        }
        this.renderProjects(filtered, projectGrid);
      }
    });
  }

  renderProjects(projects, grid) {
    grid.innerHTML = '';
    if (!projects.length) {
      grid.innerHTML = '<div class="col-span-full text-center text-gray-400">No projects found for this category.</div>';
      return;
    }
    projects.forEach(project => {
      const card = document.createElement('div');
      card.className = 'project-card bg-black/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-800 hover:border-[' + (project.color || '#6366F1') + '] transition-all duration-300';
      card.innerHTML = `
        <div class="relative overflow-hidden h-48">
          <img src="${project.image}" alt="${project.name}" class="w-full h-full object-contain bg-black/20 project-image cursor-pointer">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
            <div>
              <h4 class="text-white font-bold mb-2">${project.name}</h4>
              <p class="text-gray-300 text-sm">${project.description}</p>
            </div>
          </div>
        </div>
        <div class="p-6">
          <div class="flex flex-wrap gap-2 mb-4">
            ${(project.technologies || []).map(tech => `<span class='px-3 py-1 bg-[${project.color || '#6366F1'}]/20 text-[${project.color || '#6366F1'}] rounded-full text-sm'>${tech}</span>`).join('')}
          </div>
          <a href="#" class="text-[${project.color || '#6366F1'}] hover:text-[#EC4899] transition-colors inline-flex items-center">View Project <i class="fas fa-arrow-right ml-2"></i></a>
        </div>
      `;
      grid.appendChild(card);
    });
  }
}

// --- Universal Modal System ---
const universalModal = document.getElementById('universalModal');
const universalModalContent = document.getElementById('universalModalContent');
const universalModalClose = document.getElementById('universalModalClose');

const modalContent = {
  about: `<h2>About Us</h2><p>Resconate is a multi-service secular agency ...</p>`,
  privacy: `<h2>Privacy Policy</h2><p>Your privacy is important to us ...</p>`,
  terms: `<h2>Terms of Service</h2><p>By using this site you agree to ...</p>`,
  cookie: `<h2>Cookie Policy</h2><p>We use cookies to improve your experience ...</p>`,
  careers: `<h2>Careers</h2><p>Join our team! Email us at careers@resconate.com</p>`,
  contact: `<h2>Contact</h2><p>Email: contact@resconate.com<br>Phone: +1 (234) 567-890</p>`
};

const teamData = {
  sarah: {
    name: 'Sarah Chen',
    role: 'Lead Designer',
    bio: 'Sarah is a creative lead ...',
    img: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    socials: [
      { icon: 'fab fa-linkedin-in', label: 'LinkedIn', url: '#' },
      { icon: 'fab fa-dribbble', label: 'Dribbble', url: '#' }
    ]
  },
  david: {
    name: 'David Rodriguez',
    role: 'Full Stack Developer',
    bio: 'David builds robust ...',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    socials: [
      { icon: 'fab fa-linkedin-in', label: 'LinkedIn', url: '#' },
      { icon: 'fab fa-twitter', label: 'Twitter', url: '#' }
    ]
  }
  // ...add other team members
};

function openUniversalModal(type, idOrData) {
  let content = '';
  if (type === 'team' && teamData[idOrData]) {
    const member = teamData[idOrData];
    content = `
      <div class="modal__header">
        <img src="${member.img}" alt="${member.name}" class="w-24 h-24 rounded-full mb-4">
        <div>
          <h2 class="modal__title">${member.name}</h2>
          <p class="text-gray-400 mb-2">${member.role}</p>
        </div>
      </div>
      <p class="mb-4">${member.bio}</p>
      <div class="flex space-x-4">
        ${member.socials.map(s => `<a href="${s.url}" aria-label="${s.label}" title="${s.label}" class="text-xl"><i class="${s.icon}"></i></a>`).join('')}
      </div>
    `;
  } else if (type === 'image' && idOrData) {
    content = `<img src="${idOrData.src}" alt="${idOrData.alt || ''}" class="max-h-[90vh] max-w-full">`;
  } else if (modalContent[type]) {
    content = modalContent[type];
  } else {
    content = '<p>Content not found.</p>';
  }
  universalModalContent.innerHTML = content;
  universalModal.style.display = 'flex';
  setTimeout(() => universalModal.classList.add('active'), 10);
  document.body.style.overflow = 'hidden';
}

function closeUniversalModal() {
  universalModal.classList.remove('active');
  setTimeout(() => {
    universalModal.style.display = 'none';
    universalModalContent.innerHTML = '';
    document.body.style.overflow = '';
  }, 300);
}

if (universalModalClose) universalModalClose.onclick = closeUniversalModal;
if (universalModal) {
  universalModal.onclick = function(e) {
    if (e.target === universalModal) closeUniversalModal();
  };
}
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && universalModal.classList.contains('active')) closeUniversalModal();
});

document.addEventListener('click', function(e) {
  const btn = e.target.closest('[data-modal-type]');
  if (btn) {
    e.preventDefault();
    const type = btn.getAttribute('data-modal-type');
    const id = btn.getAttribute('data-modal-id');
    if (type === 'image') {
      openUniversalModal('image', { src: btn.getAttribute('data-img-src'), alt: btn.getAttribute('data-img-alt') });
    } else {
      openUniversalModal(type, id);
    }
  }
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PortfolioApp();
});

// --- Project Section Logic ---
const projectCategories = {
  web: [
    { name: 'Web Project 1', image: 'web1.png', link: 'https://example.com/web1', description: 'Web project description 1' },
    { name: 'Web Project 2', image: 'web2.png', link: 'https://example.com/web2', description: 'Web project description 2' },
    { name: 'Web Project 3', image: 'web3.png', link: 'https://example.com/web3', description: 'Web project description 3' },
    { name: 'Web Project 4', image: 'web4.png', link: 'https://example.com/web4', description: 'Web project description 4' },
    { name: 'Web Project 5', image: 'web5.png', link: 'https://example.com/web5', description: 'Web project description 5' },
    { name: 'Web Project 6', image: 'web6.png', link: 'https://example.com/web6', description: 'Web project description 6' }
  ],
  mobile: [
    { name: 'Mobile Project 1', image: 'mobile1.png', link: 'https://example.com/mobile1', description: 'Mobile project description 1' },
    { name: 'Mobile Project 2', image: 'mobile2.png', link: 'https://example.com/mobile2', description: 'Mobile project description 2' },
    { name: 'Mobile Project 3', image: 'mobile3.png', link: 'https://example.com/mobile3', description: 'Mobile project description 3' },
    { name: 'Mobile Project 4', image: 'mobile4.png', link: 'https://example.com/mobile4', description: 'Mobile project description 4' },
    { name: 'Mobile Project 5', image: 'mobile5.png', link: 'https://example.com/mobile5', description: 'Mobile project description 5' },
    { name: 'Mobile Project 6', image: 'mobile6.png', link: 'https://example.com/mobile6', description: 'Mobile project description 6' }
  ],
  design: [
    { 
      name: 'Purdy and Figg Design', 
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=764&q=80', 
      link: 'https://www.figma.com/design/N0yjQ9UBdWbhBxGwk0jbkJ/Purdy-and-Figg?node-id=0-1&t=621Q84JDdSsSd495-1', 
      description: 'Modern design system and brand identity for Purdy and Figg' 
    },
    { 
      name: 'Slate Landing Page', 
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=815&q=80', 
      link: 'https://www.figma.com/design/sGXReqpIdFw5YScNsl6nuw/Landing-Page-For-Slate?node-id=0-1&t=vRvZvOm8hS2IYUG9-1', 
      description: 'Responsive landing page design for Slate platform' 
    },
    { 
      name: 'Slate App Dashboard', 
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80', 
      link: 'https://www.figma.com/design/ADlt8KWFyMpqLKQXRr3M8U/Slate?node-id=0-1&t=1dFmosVPtLWcduTB-1', 
      description: 'User interface design for Slate mobile app and dashboard' 
    },
    { 
      name: 'Movie Ticketing App', 
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80', 
      link: 'https://www.figma.com/design/APy8rMh2oDd520HJB1A5qu/Movie-TIcket-App?node-id=0-1&t=bYUeGFE8K6gfFLL0-1', 
      description: 'Mobile app design for movie ticket booking and management' 
    },
    { 
      name: 'Simpsons Illustration', 
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80', 
      link: 'https://www.figma.com/design/aJjzSj6OJ5clYf3XXG41TD/bArt-Simpsons?node-id=0-1&t=zlIc5SUkhr8sQbgv-1', 
      description: 'Creative illustration project featuring The Simpsons characters' 
    },
    { 
      name: 'Design System Components', 
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=764&q=80', 
      link: 'https://www.figma.com/design/N0yjQ9UBdWbhBxGwk0jbkJ/Purdy-and-Figg?node-id=0-1&t=621Q84JDdSsSd495-1', 
      description: 'Comprehensive design system with reusable components and patterns' 
    }
  ],
  writing: [
    { name: 'Writing Project 1', image: 'writing1.png', link: 'https://example.com/writing1', description: 'Writing project description 1' },
    { name: 'Writing Project 2', image: 'writing2.png', link: 'https://example.com/writing2', description: 'Writing project description 2' },
    { name: 'Writing Project 3', image: 'writing3.png', link: 'https://example.com/writing3', description: 'Writing project description 3' },
    { name: 'Writing Project 4', image: 'writing4.png', link: 'https://example.com/writing4', description: 'Writing project description 4' },
    { name: 'Writing Project 5', image: 'writing5.png', link: 'https://example.com/writing5', description: 'Writing project description 5' },
    { name: 'Writing Project 6', image: 'writing6.png', link: 'https://example.com/writing6', description: 'Writing project description 6' }
  ],
  cybersecurity: [
    {
      name: 'Web Pentesting',
      image: 'https://images.unsplash.com/photo-1510511233900-192d6d7d963d?ixlib=rb-4.0.3&auto=format&fit=crop&w=870&q=80',
      link: 'https://github.com/deejonsen/Web_pentesting',
      description: 'Comprehensive web application security testing tools and methodologies for vulnerability assessment.'
    },
    {
      name: 'Steganography Challenge',
      image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=870&q=80',
      link: 'https://github.com/deejonsen/Steghide_Task.md',
      description: 'Solutions for extracting hidden messages from images using steganography tools.'
    },
    {
      name: 'Exploitation Task',
      image: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=870&q=80',
      link: 'https://github.com/deejonsen/Exploitation_Task',
      description: 'Educational demonstration of gaining initial access to a Windows machine using a Meterpreter reverse shell.'
    },
    {
      name: 'Advanced Persistent Threat',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=870&q=80',
      link: 'https://github.com/deejonsen/Advanced_Persistent_Threat',
      description: 'Comprehensive analysis of APT breaches and their impact on information security infrastructure.'
    }
  ]
};

// Initialize project filtering when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const projectGrid = document.getElementById('project-grid');
  const categoryBtns = document.querySelectorAll('.category-btn');

  function showProjects(category) {
    if (!projectGrid) return;
    // Remove previous content and animation
    projectGrid.innerHTML = '';
    projectGrid.classList.remove('active');
    projectGrid.style.pointerEvents = 'none';

    // Highlight active button
    categoryBtns.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.category-btn[data-category="${category}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Add new projects after a short delay for animation
    setTimeout(() => {
      const projects = projectCategories[category] || [];
      projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card bg-black/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-800 hover:border-[#6366F1] transition-all duration-300 cursor-pointer';
        card.innerHTML = `
          <div class="relative overflow-hidden h-48 flex items-center justify-center">
            <img src="${project.image}" alt="${project.name}" class="w-full h-full object-contain bg-black/20 project-image">
          </div>
          <div class="p-6">
            <p class="text-white font-bold mb-2">${project.name}</p>
            <p class="text-gray-300 text-sm mb-4">${project.description}</p>
          </div>
        `;
        card.addEventListener('click', () => {
          window.open(project.link, '_blank');
        });
        projectGrid.appendChild(card);
      });
      projectGrid.classList.add('active');
      projectGrid.style.pointerEvents = 'auto';
    }, 100);
  }

  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      showProjects(category);
    });
  });
});
