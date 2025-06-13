// Mobile menu functionality
const mobileMenuButton = document.getElementById('mobile-menu-button');
const closeMenuButton = document.getElementById('close-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

// Open mobile menu
mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
});

// Close mobile menu
closeMenuButton.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    document.body.style.overflow = ''; // Re-enable scrolling
});

// Close mobile menu when clicking on a link
const mobileMenuLinks = mobileMenu.querySelectorAll('a');
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        document.body.style.overflow = '';
    });
});

// Project card hover effects
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach(card => {
    const image = card.querySelector('img');
    
    card.addEventListener('mouseenter', () => {
        if (image) {
            image.style.transform = 'scale(1.05)';
        }
    });
    
    card.addEventListener('mouseleave', () => {
        if (image) {
            image.style.transform = 'scale(1)';
        }
    });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Offset for header
                behavior: 'smooth'
            });
        }
    });
});

// Update current year in footer
document.getElementById('current-year').textContent = new Date().getFullYear();

// Image Modal Functionality
const profileImage = document.getElementById('profileImage');
const imageModal = document.getElementById('imageModal');
const expandedImage = document.getElementById('expandedImage');
const closeImageModal = document.getElementById('closeImageModal');

if (profileImage && imageModal && expandedImage) {
    // Open modal when profile image is clicked
    profileImage.addEventListener('click', () => {
        expandedImage.src = profileImage.src;
        imageModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    });

    // Close modal when clicking the close button
    if (closeImageModal) {
        closeImageModal.addEventListener('click', (e) => {
            e.stopPropagation();
            imageModal.classList.add('hidden');
            document.body.style.overflow = ''; // Re-enable scrolling
        });
    }

    // Close modal when clicking outside the image
    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) {
            imageModal.classList.add('hidden');
            document.body.style.overflow = ''; // Re-enable scrolling
        }
    });
}

// Project Image Modal Functionality
const projectImages = document.querySelectorAll('.project-image');
const projectImageModal = document.getElementById('projectImageModal');
const expandedProjectImage = document.getElementById('expandedProjectImage');
const closeProjectImageModal = document.getElementById('closeProjectImageModal');

if (projectImages.length > 0 && projectImageModal && expandedProjectImage) {
    // Open modal when a project image is clicked
    projectImages.forEach(img => {
        img.addEventListener('click', () => {
            expandedProjectImage.src = img.src;
            expandedProjectImage.alt = img.alt;
            projectImageModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
        });
    });

    // Close modal when clicking the close button
    if (closeProjectImageModal) {
        closeProjectImageModal.addEventListener('click', (e) => {
            e.stopPropagation();
            projectImageModal.classList.add('hidden');
            document.body.style.overflow = ''; // Re-enable scrolling
        });
    }

    // Close modal when clicking outside the image
    projectImageModal.addEventListener('click', (e) => {
        if (e.target === projectImageModal) {
            projectImageModal.classList.add('hidden');
            document.body.style.overflow = ''; // Re-enable scrolling
        }
    });
}

// Add animation to elements when they come into view
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.project-card, .certificate-card');
    
    elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;
        
        if (elementPosition < screenPosition) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
};

// Set initial state for animated elements
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.project-card, .certificate-card');
    
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Trigger animation for elements in initial viewport
    animateOnScroll();
});

// Listen for scroll events to trigger animations
window.addEventListener('scroll', animateOnScroll);

// Function to load projects dynamically
const loadProjects = async () => {
    const projectsContainer = document.querySelector('#projects .grid');
    
    if (!projectsContainer) return;
    
    try {
        const response = await fetch('http://localhost:5000/api/projects');
        const projects = await response.json();
        
        // Clear existing projects
        projectsContainer.innerHTML = '';
        
        // Add projects from API
        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = `project-card ${project.color}-gradient rounded-lg overflow-hidden p-4 cursor-pointer transform hover:-translate-y-1 transition-transform`;
            
            projectCard.innerHTML = `
                <div class="h-40 mb-4 overflow-hidden rounded-lg">
                    <img src="${project.image}" alt="${project.name}" class="w-full h-full object-cover project-image cursor-pointer transition-transform duration-300 hover:scale-105">
                </div>
                <h3 class="text-xl font-bold mb-1">${project.name}</h3>
                <p class="text-gray-400 text-sm">${project.description}</p>
                <div class="absolute bottom-4 right-4 w-4 h-4 rounded-full flex items-center justify-center">
                    <div class="w-3 h-3 rounded-full bg-${project.color}-500"></div>
                </div>
            `;
            
            projectsContainer.appendChild(projectCard);
        });
        
        // Add click event listeners to dynamically loaded project images
        const newProjectImages = document.querySelectorAll('.project-image');
        if (projectImageModal && expandedProjectImage) {
            newProjectImages.forEach(img => {
                img.addEventListener('click', () => {
                    expandedProjectImage.src = img.src;
                    expandedProjectImage.alt = img.alt;
                    projectImageModal.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                });
            });
        }
        
        // Reinitialize hover effects for dynamically added projects
        const newProjectCards = document.querySelectorAll('.project-card');
        newProjectCards.forEach(card => {
            const image = card.querySelector('img');
            
            card.addEventListener('mouseenter', () => {
                if (image) {
                    image.style.transform = 'scale(1.05)';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                if (image) {
                    image.style.transform = 'scale(1)';
                }
            });
        });
    } catch (error) {
        console.error('Error loading projects:', error);
    }
};

// Function to load testimonials dynamically
const loadTestimonials = async () => {
    console.log('Attempting to load testimonials...');
    const testimonialsContainer = document.querySelector('#testimonials .grid');
    
    if (!testimonialsContainer) {
        console.error('Testimonials container not found in the DOM');
        return;
    }
    
    try {
        console.log('Fetching testimonials from API...');
        const response = await fetch('http://localhost:5000/api/testimonials');
        console.log('API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch testimonials: ${response.status} ${response.statusText}`);
        }
        
        const testimonials = await response.json();
        console.log('Testimonials data received:', testimonials);
        
        // Clear existing testimonials
        testimonialsContainer.innerHTML = '';
        
        // Add testimonials from API
        testimonials.forEach(testimonial => {
            console.log('Creating testimonial card for:', testimonial.name);
            const testimonialCard = document.createElement('div');
            testimonialCard.className = 'bg-gray-900 p-6 rounded-lg';
            
            testimonialCard.innerHTML = `
                <p class="text-gray-400 mb-6">"${testimonial.text}"</p>
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-${testimonial.color || 'green'}-500 flex items-center justify-center text-white font-bold">
                        ${testimonial.initials}
                    </div>
                    <div class="ml-3">
                        <h4 class="font-bold">${testimonial.name}</h4>
                        <p class="text-sm text-gray-500">${testimonial.position}</p>
                    </div>
                </div>
            `;
            
            testimonialsContainer.appendChild(testimonialCard);
        });
        console.log('Testimonials loaded successfully');
    } catch (error) {
        console.error('Error loading testimonials:', error);
    }
};

// Load projects and testimonials when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize animations
    const elements = document.querySelectorAll('.project-card, .certificate-card');
    
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Trigger animation for elements in initial viewport
    animateOnScroll();
    
    // Load dynamic content
    loadProjects();
    loadTestimonials();
});

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modals = ['privacyModal', 'termsModal', 'cookieModal', 'aboutModal', 'teamModal', 'careersModal', 'contactModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            closeModal(modalId);
        }
    });
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modals = ['privacyModal', 'termsModal', 'cookieModal', 'aboutModal', 'teamModal', 'careersModal', 'contactModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (!modal.classList.contains('hidden')) {
                closeModal(modalId);
            }
        });
    }
});