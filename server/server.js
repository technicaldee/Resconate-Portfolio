const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const session = require('express-session');
const { pool, initializeDatabase } = require('./database');
const { 
  authenticateAdmin, 
  loginAdmin, 
  logoutAdmin, 
  getCurrentAdmin, 
  createAdmin, 
  getAllAdmins 
} = require('./auth');
const {
  validateJob,
  validateCandidate,
  validateEmployee,
  validateInterview,
  validateAdmin,
  validatePolicy,
  validatePerformanceGoal,
  handleDatabaseError,
  createValidationMiddleware
} = require('./validation');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'hr-platform-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main portfolio page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Serve the HR login page at /hr route
app.get('/hr', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'hr-login.html'));
});

// Serve the HR dashboard for authenticated users
app.get('/hr/dashboard', authenticateAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin-dashboard.html'));
});

// Serve the HR forgot password page
app.get('/hr/forgot', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'hr-forgot.html'));
});

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

// In-memory data storage (replace with database in production)
let hrData = {
  jobs: [],
  candidates: [],
  interviews: [],
  employees: [],
  payroll: [],
  performance: [],
  policies: [],
  documents: []
};

// Routes

// ===== ADMIN AUTHENTICATION ROUTES =====
app.post('/api/auth/login', loginAdmin);
app.post('/api/auth/logout', logoutAdmin);
app.get('/api/auth/me', authenticateAdmin, getCurrentAdmin);
app.post('/api/admin/create', authenticateAdmin, createAdmin);
app.get('/api/admin/all', authenticateAdmin, getAllAdmins);

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }
    
    // Check if user exists (but don't reveal if they exist or not for security)
    const result = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);
    
    // Always return success for security reasons (don't reveal if user exists)
    // In a real application, you would send an email here if the user exists
    res.json({ 
      success: true, 
      message: 'If the username exists, password reset instructions have been sent.' 
    });
    
    // Log the attempt for admin purposes
    console.log(`Password reset requested for username: ${username} - User ${result.rows.length > 0 ? 'exists' : 'does not exist'}`);
    
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// HR API Endpoints (Protected routes require admin authentication)

// ===== RECRUITMENT & TALENT ACQUISITION =====

// Job posting and management
app.get('/api/hr/jobs', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jobs ORDER BY posted_date DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/hr/jobs', authenticateAdmin, createValidationMiddleware(validateJob), async (req, res) => {
  try {
    const { title, department, location, employment_type, salary, description, requirements, benefits } = req.body;
    
    const result = await pool.query(
      'INSERT INTO jobs (title, department, location, employment_type, salary, description, requirements, benefits, status, posted_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [title, department, location, employment_type, salary ? parseFloat(salary) : null, description, requirements, JSON.stringify(benefits || []), 'active', new Date()]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'job creation');
    res.status(errorResponse.status).json({ success: false, error: errorResponse.message });
  }
});

// Candidate sourcing and management
app.get('/api/hr/candidates', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM candidates ORDER BY applied_date DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/hr/candidates', authenticateAdmin, createValidationMiddleware(validateCandidate), upload.single('resume'), async (req, res) => {
  try {
    const { name, email, phone, position, experience, skills, job_id } = req.body;
    const skillsArray = skills ? skills.split(',').map(s => s.trim()) : [];
    
    const result = await pool.query(
      'INSERT INTO candidates (name, email, phone, position, experience, skills, resume_filename, job_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, email, phone, position, parseInt(experience) || 0, skillsArray, req.file ? req.file.filename : null, job_id ? parseInt(job_id) : null]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'candidate creation');
    res.status(errorResponse.status).json({ success: false, error: errorResponse.message });
  }
});

// Interview scheduling
app.get('/api/hr/interviews', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, c.name as candidate_name, j.title as job_title 
      FROM interviews i 
      LEFT JOIN candidates c ON i.candidate_id = c.id 
      LEFT JOIN jobs j ON i.job_id = j.id 
      ORDER BY i.interview_date DESC, i.interview_time DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/hr/interviews', authenticateAdmin, async (req, res) => {
  try {
    const { candidate_id, job_id, interviewer, interview_date, interview_time, type, notes } = req.body;
    
    const result = await pool.query(
      'INSERT INTO interviews (candidate_id, job_id, interviewer, interview_date, interview_time, type, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [candidate_id, job_id, interviewer, interview_date, interview_time, type, notes]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Background checks
app.post('/api/hr/background-check', (req, res) => {
  const check = {
    candidateId: req.body.candidateId,
    type: req.body.type, // criminal, employment, education
    status: 'pending',
    requestDate: new Date().toISOString(),
    results: null
  };
  res.json({ success: true, message: 'Background check initiated', data: check });
});

// Employee onboarding
app.post('/api/hr/onboarding', (req, res) => {
  const onboarding = {
    employeeId: req.body.employeeId,
    tasks: [
      'Complete personal information',
      'Sign employment contract',
      'Setup IT equipment',
      'Complete compliance training',
      'Meet team members'
    ],
    completedTasks: [],
    startDate: req.body.startDate,
    status: 'in-progress'
  };
  res.json({ success: true, data: onboarding });
});

// ===== PAYROLL & BENEFITS MANAGEMENT =====

// Employee management
app.get('/api/hr/employees', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/hr/employees', authenticateAdmin, async (req, res) => {
  try {
    const { employee_id, name, email, department, position, salary, start_date, benefits } = req.body;
    
    const result = await pool.query(
      'INSERT INTO employees (employee_id, name, email, department, position, salary, start_date, benefits) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [employee_id, name, email, department, position, parseFloat(salary), start_date, JSON.stringify(benefits || [])]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Payroll processing
app.get('/api/hr/payroll', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payroll ORDER BY processed_date DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/hr/payroll/process', authenticateAdmin, async (req, res) => {
  try {
    const { period, employee_ids, total_amount, taxes, deductions } = req.body;
    
    const result = await pool.query(
      'INSERT INTO payroll (period, employee_ids, total_amount, taxes, deductions, processed_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [period, employee_ids, parseFloat(total_amount), parseFloat(taxes), parseFloat(deductions), req.admin.id]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error processing payroll:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== PERFORMANCE MANAGEMENT =====

// Performance goals
app.get('/api/hr/goals', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pg.*, e.name as employee_name 
      FROM performance_goals pg 
      LEFT JOIN employees e ON pg.employee_id = e.id 
      ORDER BY pg.created_date DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/hr/goals', authenticateAdmin, async (req, res) => {
  try {
    const { employee_id, title, description, target_date, progress } = req.body;
    
    const result = await pool.query(
      'INSERT INTO performance_goals (employee_id, title, description, target_date, progress) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [employee_id, title, description, target_date, parseInt(progress) || 0]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Performance reviews
app.post('/api/hr/performance-review', authenticateAdmin, async (req, res) => {
  try {
    const { employee_id, period, ratings, feedback, goals } = req.body;
    
    const result = await pool.query(
      'INSERT INTO performance_reviews (employee_id, reviewer_id, period, ratings, feedback, goals) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [employee_id, req.admin.id, period, JSON.stringify(ratings), feedback, JSON.stringify(goals)]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating performance review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== COMPLIANCE & DOCUMENT MANAGEMENT =====

// Policies
app.get('/api/hr/policies', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM policies ORDER BY created_date DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/hr/policies', authenticateAdmin, async (req, res) => {
  try {
    const { title, content, category, effective_date } = req.body;
    
    const result = await pool.query(
      'INSERT INTO policies (title, content, category, effective_date, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, content, category, effective_date, req.admin.id]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Documents
app.get('/api/hr/documents', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, e.name as employee_name 
      FROM documents d 
      LEFT JOIN employees e ON d.employee_id = e.id 
      ORDER BY d.upload_date DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/hr/documents', authenticateAdmin, upload.single('document'), async (req, res) => {
  try {
    const { name, type, category, employee_id } = req.body;
    
    const result = await pool.query(
      'INSERT INTO documents (name, type, category, filename, employee_id, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, type, category, req.file ? req.file.filename : null, employee_id ? parseInt(employee_id) : null, req.admin.id]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== ANALYTICS & REPORTING =====

// HR Analytics
app.get('/api/hr/analytics', authenticateAdmin, async (req, res) => {
  try {
    const [jobsCount, candidatesCount, employeesCount, interviewsCount] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM jobs WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*) FROM candidates'),
      pool.query('SELECT COUNT(*) FROM employees WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*) FROM interviews WHERE status = $1', ['scheduled'])
    ]);

    const analytics = {
      totalJobs: parseInt(jobsCount.rows[0].count),
      totalCandidates: parseInt(candidatesCount.rows[0].count),
      totalEmployees: parseInt(employeesCount.rows[0].count),
      scheduledInterviews: parseInt(interviewsCount.rows[0].count)
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

// Employee authentication routes
app.post('/api/employee/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const client = await pool.connect();
    
    // First check employee_self_service table
    const employeeAuthResult = await client.query(
      'SELECT ess.*, e.* FROM employee_self_service ess JOIN employees e ON ess.employee_id = e.id WHERE ess.username = $1',
      [username]
    );

    if (employeeAuthResult.rows.length === 0) {
      client.release();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const employee = employeeAuthResult.rows[0];
    const isValidPassword = await bcrypt.compare(password, employee.password_hash);

    if (!isValidPassword) {
      client.release();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await client.query(
      'UPDATE employee_self_service SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [employee.id]
    );

    client.release();

    // Set session
    req.session.employeeId = employee.employee_id;
    req.session.employeeRole = 'employee';

    res.json({
      message: 'Login successful',
      employee: {
        id: employee.employee_id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position
      }
    });
  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/employee/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/employee/me', async (req, res) => {
  if (!req.session.employeeId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM employees WHERE employee_id = $1',
      [req.session.employeeId]
    );
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const employee = result.rows[0];
    res.json({
      id: employee.employee_id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      position: employee.position,
      salary: employee.salary,
      start_date: employee.start_date
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/employee/profile', async (req, res) => {
  if (!req.session.employeeId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { phone } = req.body;

  try {
    const client = await pool.connect();
    await client.query(
      'UPDATE employees SET phone = $1, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $2',
      [phone, req.session.employeeId]
    );
    client.release();

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/employee/leave-request', async (req, res) => {
  if (!req.session.employeeId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { leave_type, start_date, end_date, days_requested, reason } = req.body;

  try {
    const client = await pool.connect();
    
    // Get employee ID
    const employeeResult = await client.query(
      'SELECT id FROM employees WHERE employee_id = $1',
      [req.session.employeeId]
    );

    if (employeeResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'Employee not found' });
    }

    const employeeId = employeeResult.rows[0].id;

    await client.query(
      'INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_requested, reason) VALUES ($1, $2, $3, $4, $5, $6)',
      [employeeId, leave_type, start_date, end_date, days_requested, reason]
    );

    client.release();
    res.json({ message: 'Leave request submitted successfully' });
  } catch (error) {
    console.error('Leave request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/employee/leave-history', async (req, res) => {
  if (!req.session.employeeId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const client = await pool.connect();
    
    // Get employee ID
    const employeeResult = await client.query(
      'SELECT id FROM employees WHERE employee_id = $1',
      [req.session.employeeId]
    );

    if (employeeResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'Employee not found' });
    }

    const employeeId = employeeResult.rows[0].id;

    const result = await client.query(
      'SELECT * FROM leave_requests WHERE employee_id = $1 ORDER BY created_at DESC',
      [employeeId]
    );

    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Leave history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Payroll management endpoints
app.get('/api/payroll/stats', authenticateAdmin, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    // Get total employees
    const employeeCount = await pool.query('SELECT COUNT(*) as count FROM employees WHERE company_id = ?', [companyId]);
    
    // Get monthly payroll total
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyPayroll = await pool.query(
      'SELECT SUM(net_pay) as total FROM payroll WHERE company_id = ? AND DATE_FORMAT(period, "%Y-%m") = ?',
      [companyId, currentMonth]
    );
    
    // Get pending payroll count
    const pendingPayroll = await pool.query(
      'SELECT COUNT(*) as count FROM payroll WHERE company_id = ? AND status = "pending"',
      [companyId]
    );
    
    // Calculate tax liability
    const taxLiability = await pool.query(
      'SELECT SUM(paye_tax + nhf_tax + nsitf_tax + itf_tax) as total FROM payroll WHERE company_id = ? AND DATE_FORMAT(period, "%Y-%m") = ?',
      [companyId, currentMonth]
    );

    res.json({
      totalEmployees: employeeCount[0]?.count || 0,
      monthlyPayroll: monthlyPayroll[0]?.total || 0,
      pendingPayroll: pendingPayroll[0]?.count || 0,
      taxLiability: taxLiability[0]?.total || 0
    });
  } catch (error) {
    console.error('Error fetching payroll stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/payroll/history', authenticateAdmin, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    const payrolls = await pool.query(`
      SELECT 
        p.id,
        p.period,
        COUNT(DISTINCT p.employee_id) as employee_count,
        SUM(p.gross_pay) as gross_pay,
        SUM(p.total_deductions) as total_deductions,
        SUM(p.net_pay) as net_pay,
        SUM(p.paye_tax + p.nhf_tax + p.nsitf_tax + p.itf_tax) as total_tax,
        p.status
      FROM payroll p
      WHERE p.company_id = ?
      GROUP BY p.period, p.status
      ORDER BY p.period DESC
    `, [companyId]);

    res.json(payrolls);
  } catch (error) {
    console.error('Error fetching payroll history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/payroll/preview', authenticateAdmin, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { month } = req.query;
    
    // Get all active employees
    const employees = await pool.query(
      'SELECT id, salary, allowances FROM employees WHERE company_id = ? AND status = "active"',
      [companyId]
    );

    let totalGrossPay = 0;
    let totalDeductions = 0;
    let totalTaxes = {
      paye: 0,
      nhf: 0,
      nsitf: 0,
      itf: 0
    };

    employees.forEach(employee => {
      const grossPay = parseFloat(employee.salary) + parseFloat(employee.allowances || 0);
      totalGrossPay += grossPay;

      // Calculate Nigerian taxes
      const paye = calculatePAYE(grossPay);
      const nhf = grossPay * 0.025; // 2.5% NHF
      const nsitf = grossPay * 0.01; // 1% NSITF
      const itf = grossPay * 0.01; // 1% ITF

      totalTaxes.paye += paye;
      totalTaxes.nhf += nhf;
      totalTaxes.nsitf += nsitf;
      totalTaxes.itf += itf;

      totalDeductions += paye + nhf + nsitf + itf;
    });

    const netPay = totalGrossPay - totalDeductions;

    res.json({
      employeeCount: employees.length,
      grossPay: totalGrossPay,
      totalDeductions: totalDeductions,
      netPay: netPay,
      taxes: totalTaxes
    });
  } catch (error) {
    console.error('Error calculating payroll preview:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/payroll/process', authenticateAdmin, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { month } = req.body;
    
    // Check if payroll already exists for this month
    const existingPayroll = await pool.query(
      'SELECT id FROM payroll WHERE company_id = ? AND DATE_FORMAT(period, "%Y-%m") = ?',
      [companyId, month]
    );

    if (existingPayroll.length > 0) {
      return res.status(400).json({ message: 'Payroll already processed for this month' });
    }

    // Get all active employees
    const employees = await pool.query(
      'SELECT * FROM employees WHERE company_id = ? AND status = "active"',
      [companyId]
    );

    const payrollEntries = [];

    for (const employee of employees) {
      const grossPay = parseFloat(employee.salary) + parseFloat(employee.allowances || 0);
      
      // Calculate Nigerian taxes
      const paye = calculatePAYE(grossPay);
      const nhf = grossPay * 0.025;
      const nsitf = grossPay * 0.01;
      const itf = grossPay * 0.01;
      
      const totalDeductions = paye + nhf + nsitf + itf;
      const netPay = grossPay - totalDeductions;

      payrollEntries.push([
        companyId,
        employee.id,
        `${month}-01`,
        grossPay,
        totalDeductions,
        netPay,
        paye,
        nhf,
        nsitf,
        itf,
        'processed'
      ]);
    }

    // Insert payroll entries
    await pool.query(`
      INSERT INTO payroll 
      (company_id, employee_id, period, gross_pay, total_deductions, net_pay, paye_tax, nhf_tax, nsitf_tax, itf_tax, status)
      VALUES ?
    `, [payrollEntries]);

    res.json({ message: 'Payroll processed successfully', processedCount: payrollEntries.length });
  } catch (error) {
    console.error('Error processing payroll:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Nigerian PAYE calculation function
function calculatePAYE(annualIncome) {
  // Nigerian PAYE tax brackets (2024)
  const taxBrackets = [
    { min: 0, max: 300000, rate: 0.07 },
    { min: 300000, max: 600000, rate: 0.11 },
    { min: 600000, max: 1100000, rate: 0.15 },
    { min: 1100000, max: 1600000, rate: 0.19 },
    { min: 1600000, max: 3200000, rate: 0.21 },
    { min: 3200000, max: Infinity, rate: 0.24 }
  ];

  let tax = 0;
  let remainingIncome = annualIncome;

  for (const bracket of taxBrackets) {
    if (remainingIncome <= 0) break;
    
    const taxableInThisBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    tax += taxableInThisBracket * bracket.rate;
    remainingIncome -= taxableInThisBracket;
  }

  return tax / 12; // Convert to monthly
}

// Payroll management page route
app.get('/payroll', authenticateAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'payroll-management.html'));
});

// Performance Management API Endpoints

// Get performance dashboard statistics
app.get('/api/performance/stats', async (req, res) => {
    try {
        const activeGoalsQuery = 'SELECT COUNT(*) as count FROM performance_goals WHERE status IN ("pending", "in_progress")';
        const pendingReviewsQuery = 'SELECT COUNT(*) as count FROM performance_reviews WHERE status = "pending"';
        const completedTrainingQuery = 'SELECT COUNT(*) as count FROM training_assignments WHERE status = "completed"';
        const avgPerformanceQuery = 'SELECT AVG(overall_rating) as avg FROM performance_reviews WHERE overall_rating > 0';

        const [activeGoals] = await db.promise().query(activeGoalsQuery);
        const [pendingReviews] = await db.promise().query(pendingReviewsQuery);
        const [completedTraining] = await db.promise().query(completedTrainingQuery);
        const [avgPerformance] = await db.promise().query(avgPerformanceQuery);

        res.json({
            activeGoals: activeGoals[0].count,
            pendingReviews: pendingReviews[0].count,
            completedTraining: completedTraining[0].count,
            avgPerformance: Math.round((avgPerformance[0].avg || 0) * 20) // Convert 5-star to percentage
        });
    } catch (error) {
        console.error('Error fetching performance stats:', error);
        res.status(500).json({ message: 'Error fetching performance statistics' });
    }
});

// Get recent performance activities
app.get('/api/performance/recent-activities', async (req, res) => {
    try {
        const query = `
            SELECT 'Goal Set' as activity, e.name as employee_name, pg.status, pg.created_at, pg.id
            FROM performance_goals pg
            JOIN employees e ON pg.employee_id = e.id
            UNION ALL
            SELECT 'Review Created' as activity, e.name as employee_name, pr.status, pr.created_at, pr.id
            FROM performance_reviews pr
            JOIN employees e ON pr.employee_id = e.id
            UNION ALL
            SELECT 'Training Assigned' as activity, e.name as employee_name, ta.status, ta.created_at, ta.id
            FROM training_assignments ta
            JOIN employees e ON ta.employee_id = e.id
            ORDER BY created_at DESC
            LIMIT 10
        `;
        
        const [activities] = await db.promise().query(query);
        res.json(activities);
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({ message: 'Error fetching recent activities' });
    }
});

// Goals management
app.get('/api/performance/goals', async (req, res) => {
    try {
        const query = `
            SELECT pg.*, e.name as employee_name
            FROM performance_goals pg
            JOIN employees e ON pg.employee_id = e.id
            ORDER BY pg.created_at DESC
        `;
        
        const [goals] = await db.promise().query(query);
        res.json(goals);
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ message: 'Error fetching goals' });
    }
});

app.post('/api/performance/goals', async (req, res) => {
    try {
        const { employee_id, title, description, category, due_date, priority } = req.body;

        // Validate required fields
        if (!employee_id || !title || !description || !due_date) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const query = `
            INSERT INTO performance_goals (employee_id, title, description, category, due_date, priority, status, progress, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, NOW())
        `;

        await db.promise().query(query, [employee_id, title, description, category, due_date, priority]);
        res.json({ message: 'Goal set successfully' });
    } catch (error) {
        console.error('Error setting goal:', error);
        res.status(500).json({ message: 'Error setting goal' });
    }
});

app.put('/api/performance/goals/:id/progress', async (req, res) => {
    try {
        const { id } = req.params;
        const { progress, status } = req.body;

        const query = 'UPDATE performance_goals SET progress = ?, status = ?, updated_at = NOW() WHERE id = ?';
        await db.promise().query(query, [progress, status, id]);
        
        res.json({ message: 'Goal progress updated successfully' });
    } catch (error) {
        console.error('Error updating goal progress:', error);
        res.status(500).json({ message: 'Error updating goal progress' });
    }
});

// Performance reviews management
app.get('/api/performance/reviews', async (req, res) => {
    try {
        const query = `
            SELECT pr.*, e.name as employee_name
            FROM performance_reviews pr
            JOIN employees e ON pr.employee_id = e.id
            ORDER BY pr.created_at DESC
        `;
        
        const [reviews] = await db.promise().query(query);
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Error fetching reviews' });
    }
});

app.post('/api/performance/reviews', async (req, res) => {
    try {
        const { 
            employee_id, 
            review_period, 
            overall_rating, 
            strengths, 
            areas_for_improvement, 
            goals_next_period, 
            due_date 
        } = req.body;

        // Validate required fields
        if (!employee_id || !review_period || !overall_rating || !due_date) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const query = `
            INSERT INTO performance_reviews (
                employee_id, review_period, overall_rating, strengths, 
                areas_for_improvement, goals_next_period, due_date, 
                status, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        `;

        await db.promise().query(query, [
            employee_id, review_period, overall_rating, strengths,
            areas_for_improvement, goals_next_period, due_date
        ]);
        
        res.json({ message: 'Performance review created successfully' });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Error creating performance review' });
    }
});

app.put('/api/performance/reviews/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, feedback } = req.body;

        const query = 'UPDATE performance_reviews SET status = ?, feedback = ?, updated_at = NOW() WHERE id = ?';
        await db.promise().query(query, [status, feedback, id]);
        
        res.json({ message: 'Review updated successfully' });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ message: 'Error updating review' });
    }
});

// Training management
app.get('/api/performance/training', async (req, res) => {
    try {
        const query = `
            SELECT ta.*, e.name as employee_name
            FROM training_assignments ta
            JOIN employees e ON ta.employee_id = e.id
            ORDER BY ta.created_at DESC
        `;
        
        const [training] = await db.promise().query(query);
        res.json(training);
    } catch (error) {
        console.error('Error fetching training:', error);
        res.status(500).json({ message: 'Error fetching training data' });
    }
});

app.post('/api/performance/training', async (req, res) => {
    try {
        const { 
            program_name, 
            description, 
            employee_ids, 
            training_type, 
            duration_hours, 
            due_date 
        } = req.body;

        // Validate required fields
        if (!program_name || !employee_ids || !training_type || !due_date) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Insert training assignments for each employee
        const query = `
            INSERT INTO training_assignments (
                employee_id, program_name, description, training_type, 
                duration_hours, due_date, status, progress, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 'assigned', 0, NOW())
        `;

        for (const employeeId of employee_ids) {
            await db.promise().query(query, [
                employeeId, program_name, description, training_type,
                duration_hours, due_date
            ]);
        }
        
        res.json({ message: 'Training assigned successfully' });
    } catch (error) {
        console.error('Error assigning training:', error);
        res.status(500).json({ message: 'Error assigning training' });
    }
});

app.put('/api/performance/training/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const { completion_notes } = req.body;

        const query = `
            UPDATE training_assignments 
            SET status = 'completed', progress = 100, completion_notes = ?, completed_at = NOW(), updated_at = NOW()
            WHERE id = ?
        `;
        
        await db.promise().query(query, [completion_notes, id]);
        res.json({ message: 'Training marked as completed' });
    } catch (error) {
        console.error('Error completing training:', error);
        res.status(500).json({ message: 'Error completing training' });
    }
});

// Performance analytics
app.get('/api/performance/analytics', async (req, res) => {
    try {
        const { period = 'monthly' } = req.query;
        
        // Goal completion rates
        const goalCompletionQuery = `
            SELECT 
                COUNT(*) as total_goals,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_goals,
                AVG(progress) as avg_progress
            FROM performance_goals
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 ${period === 'monthly' ? 'MONTH' : 'YEAR'})
        `;

        // Review ratings distribution
        const reviewRatingsQuery = `
            SELECT 
                overall_rating,
                COUNT(*) as count
            FROM performance_reviews
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 ${period === 'monthly' ? 'MONTH' : 'YEAR'})
            GROUP BY overall_rating
            ORDER BY overall_rating
        `;

        // Training completion rates
        const trainingCompletionQuery = `
            SELECT 
                training_type,
                COUNT(*) as total_assigned,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                AVG(progress) as avg_progress
            FROM training_assignments
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 ${period === 'monthly' ? 'MONTH' : 'YEAR'})
            GROUP BY training_type
        `;

        const [goalCompletion] = await db.promise().query(goalCompletionQuery);
        const [reviewRatings] = await db.promise().query(reviewRatingsQuery);
        const [trainingCompletion] = await db.promise().query(trainingCompletionQuery);

        res.json({
            goalCompletion: goalCompletion[0],
            reviewRatings,
            trainingCompletion
        });
    } catch (error) {
        console.error('Error fetching performance analytics:', error);
        res.status(500).json({ message: 'Error fetching performance analytics' });
    }
});

// Performance management page route
app.get('/performance', (req, res) => {
    res.sendFile(path.join(__dirname, '../performance-management.html'));
});

// Banking Integration API Endpoints

// Get banking dashboard statistics
app.get('/api/banking/stats', async (req, res) => {
    try {
        const connectedBanksQuery = 'SELECT COUNT(*) as count FROM bank_connections WHERE status = "connected"';
        const monthlyTransactionsQuery = 'SELECT COUNT(*) as count FROM payment_transactions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
        const taxFilingsQuery = 'SELECT COUNT(*) as count FROM tax_filings WHERE YEAR(created_at) = YEAR(NOW())';
        const complianceQuery = 'SELECT AVG(compliance_score) as score FROM compliance_reports WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';

        const [connectedBanks] = await db.promise().query(connectedBanksQuery);
        const [monthlyTransactions] = await db.promise().query(monthlyTransactionsQuery);
        const [taxFilings] = await db.promise().query(taxFilingsQuery);
        const [compliance] = await db.promise().query(complianceQuery);

        res.json({
            connectedBanks: connectedBanks[0].count,
            monthlyTransactions: monthlyTransactions[0].count,
            taxFilings: taxFilings[0].count,
            complianceScore: Math.round(compliance[0].score || 85)
        });
    } catch (error) {
        console.error('Error fetching banking stats:', error);
        res.status(500).json({ message: 'Error fetching banking statistics' });
    }
});

// Bank connection management
app.post('/api/banking/connect', async (req, res) => {
    try {
        const { bank_code, api_key, api_secret, account_number, environment } = req.body;

        // Validate required fields
        if (!bank_code || !api_key || !api_secret || !account_number) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Simulate bank API validation
        const isValid = await validateBankCredentials(bank_code, api_key, api_secret, environment);
        
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid bank credentials' });
        }

        // Store encrypted credentials
        const query = `
            INSERT INTO bank_connections (bank_code, api_key_encrypted, api_secret_encrypted, 
                                        account_number, environment, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'connected', NOW())
            ON DUPLICATE KEY UPDATE
            api_key_encrypted = VALUES(api_key_encrypted),
            api_secret_encrypted = VALUES(api_secret_encrypted),
            account_number = VALUES(account_number),
            environment = VALUES(environment),
            status = 'connected',
            updated_at = NOW()
        `;

        // In production, encrypt these values
        const encryptedApiKey = Buffer.from(api_key).toString('base64');
        const encryptedSecret = Buffer.from(api_secret).toString('base64');

        await db.promise().query(query, [
            bank_code, encryptedApiKey, encryptedSecret, account_number, environment
        ]);

        res.json({ message: 'Bank connected successfully' });
    } catch (error) {
        console.error('Error connecting bank:', error);
        res.status(500).json({ message: 'Error connecting to bank' });
    }
});

// Get bank connections
app.get('/api/banking/connections', async (req, res) => {
    try {
        const query = 'SELECT bank_code, status, created_at FROM bank_connections';
        const [connections] = await db.promise().query(query);
        res.json(connections);
    } catch (error) {
        console.error('Error fetching bank connections:', error);
        res.status(500).json({ message: 'Error fetching bank connections' });
    }
});

// Payment processing
app.get('/api/banking/payments', async (req, res) => {
    try {
        const query = `
            SELECT pt.*, e.name as employee_name, bc.bank_code as bank
            FROM payment_transactions pt
            LEFT JOIN employees e ON pt.employee_id = e.id
            LEFT JOIN bank_connections bc ON pt.bank_connection_id = bc.id
            ORDER BY pt.created_at DESC
            LIMIT 50
        `;
        const [payments] = await db.promise().query(query);
        res.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Error fetching payments' });
    }
});

// Process payroll payments
app.post('/api/banking/process-payroll', async (req, res) => {
    try {
        // Get all employees with active payroll
        const employeesQuery = `
            SELECT e.id, e.name, e.email, e.bank_account, p.net_salary
            FROM employees e
            JOIN payroll p ON e.id = p.employee_id
            WHERE p.status = 'approved' AND p.payment_status = 'pending'
            AND p.pay_period_start >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
        
        const [employees] = await db.promise().query(employeesQuery);
        
        if (employees.length === 0) {
            return res.status(400).json({ message: 'No pending payroll found' });
        }

        // Get primary bank connection
        const bankQuery = 'SELECT * FROM bank_connections WHERE status = "connected" LIMIT 1';
        const [banks] = await db.promise().query(bankQuery);
        
        if (banks.length === 0) {
            return res.status(400).json({ message: 'No bank connection available' });
        }

        const bank = banks[0];
        let successCount = 0;
        let failureCount = 0;

        // Process each employee payment
        for (const employee of employees) {
            try {
                const transactionId = generateTransactionId();
                
                // Simulate bank transfer
                const transferResult = await processBankTransfer(
                    bank,
                    employee.bank_account,
                    employee.net_salary,
                    `Salary payment for ${employee.name}`
                );

                const status = transferResult.success ? 'completed' : 'failed';
                
                // Record transaction
                const insertQuery = `
                    INSERT INTO payment_transactions (transaction_id, employee_id, bank_connection_id,
                                                    amount, type, status, created_at)
                    VALUES (?, ?, ?, ?, 'salary', ?, NOW())
                `;
                
                await db.promise().query(insertQuery, [
                    transactionId, employee.id, bank.id, employee.net_salary, status
                ]);

                if (transferResult.success) {
                    // Update payroll status
                    await db.promise().query(
                        'UPDATE payroll SET payment_status = "paid" WHERE employee_id = ? AND payment_status = "pending"',
                        [employee.id]
                    );
                    successCount++;
                } else {
                    failureCount++;
                }
            } catch (error) {
                console.error(`Error processing payment for employee ${employee.id}:`, error);
                failureCount++;
            }
        }

        res.json({
            message: 'Payroll processing completed',
            successful: successCount,
            failed: failureCount,
            total: employees.length
        });
    } catch (error) {
        console.error('Error processing payroll:', error);
        res.status(500).json({ message: 'Error processing payroll' });
    }
});

// Tax report generation
app.post('/api/banking/tax-report', async (req, res) => {
    try {
        const { year, month } = req.body;
        const reportYear = year || new Date().getFullYear();
        const reportMonth = month || new Date().getMonth() + 1;

        // Generate PAYE report
        const payeQuery = `
            SELECT e.name, e.tin, p.gross_salary, p.paye_tax, p.pension_contribution
            FROM employees e
            JOIN payroll p ON e.id = p.employee_id
            WHERE YEAR(p.pay_period_start) = ? AND MONTH(p.pay_period_start) = ?
        `;
        
        const [payeData] = await db.promise().query(payeQuery, [reportYear, reportMonth]);
        
        // Calculate totals
        const totals = payeData.reduce((acc, record) => {
            acc.grossSalary += record.gross_salary || 0;
            acc.payeTax += record.paye_tax || 0;
            acc.pensionContribution += record.pension_contribution || 0;
            return acc;
        }, { grossSalary: 0, payeTax: 0, pensionContribution: 0 });

        // Store tax filing record
        const filingQuery = `
            INSERT INTO tax_filings (filing_type, period_year, period_month, total_amount, status, created_at)
            VALUES ('PAYE', ?, ?, ?, 'generated', NOW())
        `;
        
        await db.promise().query(filingQuery, [reportYear, reportMonth, totals.payeTax]);

        // In a real implementation, generate PDF report
        const reportData = {
            period: `${reportMonth}/${reportYear}`,
            employees: payeData,
            totals: totals,
            generatedAt: new Date().toISOString()
        };

        res.json({
            message: 'Tax report generated successfully',
            data: reportData
        });
    } catch (error) {
        console.error('Error generating tax report:', error);
        res.status(500).json({ message: 'Error generating tax report' });
    }
});

// Nigerian PAYE calculation function
function calculateNigerianPAYE(grossSalary, pensionContribution = 0) {
    const annualGross = grossSalary * 12;
    const annualPension = pensionContribution * 12;
    const taxableIncome = annualGross - annualPension;
    
    let tax = 0;
    
    // Nigerian PAYE tax bands (2024)
    if (taxableIncome > 300000) {
        if (taxableIncome <= 600000) {
            tax = (taxableIncome - 300000) * 0.07;
        } else if (taxableIncome <= 1100000) {
            tax = 21000 + (taxableIncome - 600000) * 0.11;
        } else if (taxableIncome <= 1600000) {
            tax = 76000 + (taxableIncome - 1100000) * 0.15;
        } else if (taxableIncome <= 3200000) {
            tax = 151000 + (taxableIncome - 1600000) * 0.19;
        } else {
            tax = 455000 + (taxableIncome - 3200000) * 0.21;
        }
    }
    
    return Math.round(tax / 12); // Monthly PAYE
}

// Helper functions
async function validateBankCredentials(bankCode, apiKey, apiSecret, environment) {
    // Simulate bank API validation
    // In production, make actual API calls to validate credentials
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate 90% success rate
            resolve(Math.random() > 0.1);
        }, 1000);
    });
}

async function processBankTransfer(bankConnection, accountNumber, amount, description) {
    // Simulate bank transfer processing
    // In production, use actual bank APIs
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate 95% success rate
            const success = Math.random() > 0.05;
            resolve({
                success,
                transactionId: success ? generateTransactionId() : null,
                message: success ? 'Transfer successful' : 'Transfer failed'
            });
        }, 2000);
    });
}

function generateTransactionId() {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Banking integration page route
app.get('/banking', (req, res) => {
    res.sendFile(path.join(__dirname, '../banking-integration.html'));
});

// Recruitment System API Endpoints

// Get recruitment dashboard statistics
app.get('/api/recruitment/stats', async (req, res) => {
    try {
        const activeJobsQuery = 'SELECT COUNT(*) as count FROM jobs WHERE status = "active"';
        const totalCandidatesQuery = 'SELECT COUNT(*) as count FROM candidates';
        const scheduledInterviewsQuery = 'SELECT COUNT(*) as count FROM interviews WHERE status = "scheduled"';
        const hiredCandidatesQuery = 'SELECT COUNT(*) as count FROM candidates WHERE status = "hired" AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';

        const [activeJobs] = await db.promise().query(activeJobsQuery);
        const [totalCandidates] = await db.promise().query(totalCandidatesQuery);
        const [scheduledInterviews] = await db.promise().query(scheduledInterviewsQuery);
        const [hiredCandidates] = await db.promise().query(hiredCandidatesQuery);

        res.json({
            activeJobs: activeJobs[0].count,
            totalCandidates: totalCandidates[0].count,
            scheduledInterviews: scheduledInterviews[0].count,
            hiredCandidates: hiredCandidates[0].count
        });
    } catch (error) {
        console.error('Error fetching recruitment stats:', error);
        res.status(500).json({ message: 'Error fetching recruitment statistics' });
    }
});

// Job Management Endpoints

// Get all jobs
app.get('/api/hr/jobs', async (req, res) => {
    try {
        const query = `
            SELECT j.*, 
                   COUNT(c.id) as application_count
            FROM jobs j
            LEFT JOIN candidates c ON j.id = c.job_id
            GROUP BY j.id
            ORDER BY j.created_at DESC
        `;
        const [jobs] = await db.promise().query(query);
        res.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ message: 'Error fetching jobs' });
    }
});

// Create new job posting
app.post('/api/hr/jobs', async (req, res) => {
    try {
        const {
            title, department, location, type, salary_min, salary_max,
            description, requirements, skills
        } = req.body;

        // Validate required fields
        if (!title || !department || !location || !type || !description || !requirements) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const query = `
            INSERT INTO jobs (title, department, location, type, salary_min, salary_max, 
                            description, requirements, skills, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
        `;

        const [result] = await db.promise().query(query, [
            title, department, location, type, salary_min || null, salary_max || null,
            description, requirements, skills || null
        ]);

        res.status(201).json({
            message: 'Job posted successfully',
            jobId: result.insertId
        });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ message: 'Error creating job posting' });
    }
});

// Update job status
app.put('/api/hr/jobs/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const query = 'UPDATE jobs SET status = ? WHERE id = ?';
        await db.promise().query(query, [status, id]);

        res.json({ message: 'Job status updated successfully' });
    } catch (error) {
        console.error('Error updating job status:', error);
        res.status(500).json({ message: 'Error updating job status' });
    }
});

// Candidate Management Endpoints

// Get all candidates
app.get('/api/hr/candidates', async (req, res) => {
    try {
        const query = `
            SELECT c.*, j.title as position
            FROM candidates c
            LEFT JOIN jobs j ON c.job_id = j.id
            ORDER BY c.created_at DESC
        `;
        const [candidates] = await db.promise().query(query);
        res.json(candidates);
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ message: 'Error fetching candidates' });
    }
});

// Add new candidate (application)
app.post('/api/hr/candidates', async (req, res) => {
    try {
        const {
            job_id, name, email, phone, experience, skills, resume_url, cover_letter
        } = req.body;

        // Validate required fields
        if (!job_id || !name || !email || !phone) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if candidate already applied for this job
        const existingQuery = 'SELECT id FROM candidates WHERE email = ? AND job_id = ?';
        const [existing] = await db.promise().query(existingQuery, [email, job_id]);

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Candidate has already applied for this position' });
        }

        const query = `
            INSERT INTO candidates (job_id, name, email, phone, experience, skills, 
                                  resume_url, cover_letter, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'applied', NOW())
        `;

        const [result] = await db.promise().query(query, [
            job_id, name, email, phone, experience || 0, skills || null,
            resume_url || null, cover_letter || null
        ]);

        res.status(201).json({
            message: 'Application submitted successfully',
            candidateId: result.insertId
        });
    } catch (error) {
        console.error('Error creating candidate:', error);
        res.status(500).json({ message: 'Error submitting application' });
    }
});

// Update candidate status
app.put('/api/hr/candidates/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const query = 'UPDATE candidates SET status = ?, updated_at = NOW() WHERE id = ?';
        await db.promise().query(query, [status, id]);

        res.json({ message: 'Candidate status updated successfully' });
    } catch (error) {
        console.error('Error updating candidate status:', error);
        res.status(500).json({ message: 'Error updating candidate status' });
    }
});

// Interview Management Endpoints

// Get all interviews
app.get('/api/hr/interviews', async (req, res) => {
    try {
        const query = `
            SELECT i.*, c.name as candidate_name, j.title as position
            FROM interviews i
            JOIN candidates c ON i.candidate_id = c.id
            JOIN jobs j ON c.job_id = j.id
            ORDER BY i.date DESC, i.time DESC
        `;
        const [interviews] = await db.promise().query(query);
        res.json(interviews);
    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({ message: 'Error fetching interviews' });
    }
});

// Schedule new interview
app.post('/api/hr/interviews', async (req, res) => {
    try {
        const {
            candidate_id, date, time, interviewer, type, notes
        } = req.body;

        // Validate required fields
        if (!candidate_id || !date || !time || !interviewer || !type) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if candidate exists
        const candidateQuery = 'SELECT id FROM candidates WHERE id = ?';
        const [candidate] = await db.promise().query(candidateQuery, [candidate_id]);

        if (candidate.length === 0) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        const query = `
            INSERT INTO interviews (candidate_id, date, time, interviewer, type, notes, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'scheduled', NOW())
        `;

        const [result] = await db.promise().query(query, [
            candidate_id, date, time, interviewer, type, notes || null
        ]);

        // Update candidate status to interviewed
        await db.promise().query(
            'UPDATE candidates SET status = "interviewed", updated_at = NOW() WHERE id = ?',
            [candidate_id]
        );

        res.status(201).json({
            message: 'Interview scheduled successfully',
            interviewId: result.insertId
        });
    } catch (error) {
        console.error('Error scheduling interview:', error);
        res.status(500).json({ message: 'Error scheduling interview' });
    }
});

// Update interview status
app.put('/api/hr/interviews/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const query = 'UPDATE interviews SET status = ?, updated_at = NOW() WHERE id = ?';
        await db.promise().query(query, [status, id]);

        res.json({ message: 'Interview status updated successfully' });
    } catch (error) {
        console.error('Error updating interview status:', error);
        res.status(500).json({ message: 'Error updating interview status' });
    }
});

// Recruitment system page route
app.get('/recruitment', (req, res) => {
    res.sendFile(path.join(__dirname, '../recruitment-system.html'));
});

// Compliance & Reporting API endpoints
app.get('/api/compliance/stats', (req, res) => {
    const stats = {
        activePolicies: 12,
        totalDocuments: 45,
        pendingReports: 3,
        complianceScore: 95
    };
    res.json(stats);
});

app.get('/api/compliance/recent-activities', (req, res) => {
    const activities = [
        {
            id: 1,
            activity: 'PAYE Tax Report Generated',
            type: 'Tax Report',
            status: 'completed',
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            activity: 'Employee Handbook Updated',
            type: 'Policy Update',
            status: 'active',
            created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 3,
            activity: 'Pension Contribution Report',
            type: 'Compliance Report',
            status: 'pending',
            created_at: new Date(Date.now() - 172800000).toISOString()
        },
        {
            id: 4,
            activity: 'Data Protection Policy Review',
            type: 'Policy Review',
            status: 'active',
            created_at: new Date(Date.now() - 259200000).toISOString()
        }
    ];
    res.json(activities);
});

app.get('/api/compliance/policies', (req, res) => {
    const policies = [
        {
            id: 1,
            name: 'Employee Handbook',
            category: 'hr',
            version: '2.1',
            status: 'active',
            updated_at: new Date().toISOString()
        },
        {
            id: 2,
            name: 'Data Protection Policy',
            category: 'data_protection',
            version: '1.3',
            status: 'active',
            updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 3,
            name: 'Health & Safety Guidelines',
            category: 'safety',
            version: '1.0',
            status: 'draft',
            updated_at: new Date(Date.now() - 172800000).toISOString()
        },
        {
            id: 4,
            name: 'Code of Conduct',
            category: 'conduct',
            version: '1.5',
            status: 'active',
            updated_at: new Date(Date.now() - 259200000).toISOString()
        },
        {
            id: 5,
            name: 'Financial Procedures',
            category: 'financial',
            version: '1.2',
            status: 'active',
            updated_at: new Date(Date.now() - 345600000).toISOString()
        }
    ];
    res.json(policies);
});

app.post('/api/compliance/policies', (req, res) => {
    const { name, category, description, content, version, effective_date } = req.body;
    
    // Simulate policy creation
    const newPolicy = {
        id: Date.now(),
        name,
        category,
        description,
        content,
        version,
        effective_date,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    res.json({ success: true, policy: newPolicy });
});

app.get('/api/compliance/documents', (req, res) => {
    const documents = [
        {
            id: 1,
            name: 'Employee Contract Template',
            category: 'contract',
            description: 'Standard employment contract template for new hires',
            file_size: 245760,
            tags: 'contract, employment, template',
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            name: 'Tax Compliance Certificate',
            category: 'certificate',
            description: 'Current tax compliance certificate from FIRS',
            file_size: 1048576,
            tags: 'tax, compliance, certificate',
            created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 3,
            name: 'Pension Registration Certificate',
            category: 'certificate',
            description: 'PenCom registration certificate',
            file_size: 512000,
            tags: 'pension, registration, certificate',
            created_at: new Date(Date.now() - 172800000).toISOString()
        },
        {
            id: 4,
            name: 'Monthly PAYE Report - December 2024',
            category: 'report',
            description: 'PAYE tax report for December 2024',
            file_size: 102400,
            tags: 'paye, tax, report, december',
            created_at: new Date(Date.now() - 259200000).toISOString()
        },
        {
            id: 5,
            name: 'Employee Onboarding Checklist',
            category: 'form',
            description: 'Checklist for new employee onboarding process',
            file_size: 51200,
            tags: 'onboarding, checklist, hr',
            created_at: new Date(Date.now() - 345600000).toISOString()
        }
    ];
    res.json(documents);
});

app.post('/api/compliance/documents', upload.single('file'), (req, res) => {
    const { name, category, description, tags } = req.body;
    const file = req.file;
    
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Simulate document storage
    const newDocument = {
        id: Date.now(),
        name,
        category,
        description,
        tags,
        file_name: file.originalname,
        file_size: file.size,
        file_path: file.path,
        created_at: new Date().toISOString()
    };
    
    res.json({ success: true, document: newDocument });
});

app.get('/api/compliance/reports', (req, res) => {
    const reports = [
        {
            id: 1,
            name: 'PAYE Tax Report - December 2024',
            type: 'paye',
            period: 'monthly',
            status: 'completed',
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            name: 'Pension Contribution Report - Q4 2024',
            type: 'pension',
            period: 'quarterly',
            status: 'completed',
            created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 3,
            name: 'NHF Contribution Report - 2024',
            type: 'nhf',
            period: 'annually',
            status: 'pending',
            created_at: new Date(Date.now() - 172800000).toISOString()
        },
        {
            id: 4,
            name: 'NSITF Report - November 2024',
            type: 'nsitf',
            period: 'monthly',
            status: 'completed',
            created_at: new Date(Date.now() - 259200000).toISOString()
        },
        {
            id: 5,
            name: 'ITF Report - Q3 2024',
            type: 'itf',
            period: 'quarterly',
            status: 'completed',
            created_at: new Date(Date.now() - 345600000).toISOString()
        },
        {
            id: 6,
            name: 'Employee Summary Report - 2024',
            type: 'employee_summary',
            period: 'annually',
            status: 'pending',
            created_at: new Date(Date.now() - 432000000).toISOString()
        }
    ];
    res.json(reports);
});

app.post('/api/compliance/generate-report', (req, res) => {
    const { reportType, period, year, month } = req.body;
    
    // Simulate report generation
    const reportName = `${reportType.toUpperCase()} Report - ${period} ${year}${month ? ` (${getMonthName(month)})` : ''}`;
    
    const newReport = {
        id: Date.now(),
        name: reportName,
        type: reportType,
        period,
        year,
        month,
        status: 'completed',
        created_at: new Date().toISOString()
    };
    
    res.json({ success: true, report: newReport });
});

// Helper function to get month name
function getMonthName(monthNumber) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[parseInt(monthNumber) - 1];
}

// Nigerian regulatory compliance calculations
function calculateNigerianTaxes(grossSalary, allowances = 0) {
    const totalIncome = grossSalary + allowances;
    const consolidatedAllowance = Math.min(totalIncome * 0.01 + 200000, 2400000); // 1% + ₦200,000 or max ₦2.4M
    const taxableIncome = Math.max(0, totalIncome - consolidatedAllowance);
    
    let paye = 0;
    
    // Nigerian PAYE tax brackets (2024)
    if (taxableIncome <= 300000) {
        paye = taxableIncome * 0.07; // 7%
    } else if (taxableIncome <= 600000) {
        paye = 300000 * 0.07 + (taxableIncome - 300000) * 0.11; // 11%
    } else if (taxableIncome <= 1100000) {
        paye = 300000 * 0.07 + 300000 * 0.11 + (taxableIncome - 600000) * 0.15; // 15%
    } else if (taxableIncome <= 1600000) {
        paye = 300000 * 0.07 + 300000 * 0.11 + 500000 * 0.15 + (taxableIncome - 1100000) * 0.19; // 19%
    } else if (taxableIncome <= 3200000) {
        paye = 300000 * 0.07 + 300000 * 0.11 + 500000 * 0.15 + 500000 * 0.19 + (taxableIncome - 1600000) * 0.21; // 21%
    } else {
        paye = 300000 * 0.07 + 300000 * 0.11 + 500000 * 0.15 + 500000 * 0.19 + 1600000 * 0.21 + (taxableIncome - 3200000) * 0.24; // 24%
    }
    
    // Other statutory deductions
    const pension = totalIncome * 0.08; // 8% pension contribution
    const nhf = Math.min(totalIncome * 0.025, 100000); // 2.5% NHF or max ₦100,000
    const nsitf = totalIncome * 0.01; // 1% NSITF
    const itf = totalIncome * 0.01; // 1% ITF
    
    return {
        grossSalary: totalIncome,
        consolidatedAllowance,
        taxableIncome,
        paye: Math.round(paye),
        pension: Math.round(pension),
        nhf: Math.round(nhf),
        nsitf: Math.round(nsitf),
        itf: Math.round(itf),
        totalDeductions: Math.round(paye + pension + nhf + nsitf + itf),
        netSalary: Math.round(totalIncome - (paye + pension + nhf + nsitf + itf))
    };
}

// Compliance route
app.get('/compliance', (req, res) => {
    res.sendFile(path.join(__dirname, '../compliance-reporting.html'));
});

// Company registration endpoint
app.post('/api/company/register', async (req, res) => {
  try {
    const {
      companyName,
      industry,
      companySize,
      address,
      phone,
      email,
      website,
      contactPerson,
      position,
      username,
      password
    } = req.body;

    // Validate required fields
    if (!companyName || !industry || !companySize || !address || !phone || !email || !contactPerson || !position || !username || !password) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    // Check if company email already exists
    const existingCompany = await pool.query('SELECT id FROM companies WHERE email = ?', [email]);
    if (existingCompany.length > 0) {
      return res.status(400).json({ message: 'Company with this email already exists' });
    }

    // Check if username already exists
    const existingAdmin = await pool.query('SELECT id FROM admins WHERE username = ?', [username]);
    if (existingAdmin.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create company
    const companyResult = await pool.query(
      'INSERT INTO companies (name, industry, size, address, phone, email, website, contact_person, contact_position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [companyName, industry, companySize, address, phone, email, website || null, contactPerson, position]
    );

    const companyId = companyResult.insertId;

    // Create admin user for the company
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query(
      'INSERT INTO admins (username, password, email, company_id, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email, companyId, 'company_admin']
    );

    res.status(201).json({ 
      message: 'Company registered successfully',
      companyId: companyId
    });

  } catch (error) {
    console.error('Company registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Company registration page route
app.get('/company/register', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'company-registration.html'));
});

// Employee portal routes
app.get('/employee', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'employee-login.html'));
});

app.get('/employee/portal', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'employee-portal.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});