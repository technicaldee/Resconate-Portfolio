const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// Routes

// Projects API
app.get('/api/projects', (req, res) => {
  // This could be replaced with a database query in a more complex app
  const projects = [
    {
      id: 1,
      name: 'Zocket AI',
      description: 'AI-powered marketing platform',
      image: 'https://placehold.co/600x400/111/333',
      category: 'Web App',
      color: 'blue',
      technologies: ['React', 'Node.js', 'TensorFlow']
    },
    {
      id: 2,
      name: 'HeavyOps',
      description: 'Fleet management solution',
      image: 'https://placehold.co/600x400/111/333',
      category: 'Mobile App',
      color: 'orange',
      technologies: ['React Native', 'Firebase', 'Google Maps API']
    },
    {
      id: 3,
      name: 'EasyFund',
      description: 'Fintech payment solution',
      image: 'https://placehold.co/600x400/111/333',
      category: 'Web App',
      color: 'green',
      technologies: ['Vue.js', 'Express', 'MongoDB', 'Stripe API']
    },
    {
      id: 4,
      name: 'Fill Easy',
      description: 'Document automation platform',
      image: 'https://placehold.co/600x400/111/333',
      category: 'SaaS',
      color: 'yellow',
      technologies: ['Angular', 'Python', 'AWS', 'PDF.js']
    },
    {
      id: 5,
      name: 'Noor',
      description: 'Healthcare booking system',
      image: 'https://placehold.co/600x400/111/333',
      category: 'Web App',
      color: 'purple',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Twilio API']
    },
    {
      id: 6,
      name: 'Sharing',
      description: 'Social media platform',
      image: 'https://placehold.co/600x400/111/333',
      category: 'Mobile App',
      color: 'pink',
      technologies: ['Flutter', 'Firebase', 'Cloud Functions']
    },
    {
      id: 7,
      name: 'Kwish Learning',
      description: 'Educational platform',
      image: 'https://placehold.co/600x400/111/333',
      category: 'Web App',
      color: 'teal',
      technologies: ['React', 'Django', 'Redux', 'AWS S3']
    },
    {
      id: 8,
      name: 'Comprehensive',
      description: 'Data analytics dashboard',
      image: 'https://placehold.co/600x400/111/333',
      category: 'Dashboard',
      color: 'red',
      technologies: ['Vue.js', 'Express', 'D3.js', 'MongoDB']
    }
  ];
  
  res.json(projects);
});

// Testimonials API
app.get('/api/testimonials', (req, res) => {
  const testimonials = [
    {
      id: 1,
      text: "Working with Inimfon Udoh was a game-changer for our project. His technical expertise and problem-solving skills helped us overcome complex challenges and deliver on time.",
      name: "Shannon",
      position: "Product Manager",
      initials: "S",
      color: "yellow"
    },
    {
      id: 2,
      text: "An exceptional collaborator who bridges the gap between design and development seamlessly. Inimfon Udoh took our designs and not only implemented them perfectly but enhanced them with thoughtful interactions.",
      name: "Nisha Pashmin",
      position: "UX Designer",
      initials: "N",
      color: "purple"
    },
    {
      id: 3,
      text: "Inimfon Udoh is our team's secret weapon—delivering consistently excellent code with a blend of technical brilliance and reliability that's become absolutely indispensable to our success.",
      name: "Emediong Inwek",
      position: "UI/UX Designer",
      initials: "EI",
      color: "green"
    }
  ];
  
  res.json(testimonials);
});

// Fallback route to serve the main HTML file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 