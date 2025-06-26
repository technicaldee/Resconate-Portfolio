const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

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

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Routes

// Projects API
app.get('/api/projects', (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
});

// Testimonials API
app.get('/api/testimonials', (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
});

// Contact Form API (with file upload)
app.post('/api/contact', upload.single('file'), (req, res, next) => {
  try {
    const { name, email, company, projectType, budget, timeline, message } = req.body;
    // Validate required fields
    if (!name || !email || !projectType || !budget || !message) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    // File info
    let fileInfo = null;
    if (req.file) {
      fileInfo = {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      };
    }
    // Here you would normally send an email or store the message in a database
    // For now, just simulate success and return file info
    return res.status(200).json({
      message: 'Your message has been received. We will contact you soon.',
      data: {
        name, email, company, projectType, budget, timeline, message, file: fileInfo
      }
    });
  } catch (err) {
    next(err);
  }
});

// Fallback route to serve the main HTML file for client-side routing
app.get('*', (req, res, next) => {
  try {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  } catch (err) {
    next(err);
  }
});

// Generic error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 