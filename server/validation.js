// Validation utilities for HR platform

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation (at least 8 characters, one uppercase, one lowercase, one number)
const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Phone number validation
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Date validation
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Salary validation (positive number)
const isValidSalary = (salary) => {
  const num = parseFloat(salary);
  return !isNaN(num) && num > 0;
};

// Required field validation
const validateRequired = (fields, data) => {
  const errors = [];
  fields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  });
  return errors;
};

// Job validation
const validateJob = (jobData) => {
  const errors = [];
  const requiredFields = ['title', 'department', 'location', 'employment_type'];
  
  errors.push(...validateRequired(requiredFields, jobData));
  
  if (jobData.salary && !isValidSalary(jobData.salary)) {
    errors.push('Salary must be a positive number');
  }
  
  return errors;
};

// Candidate validation
const validateCandidate = (candidateData) => {
  const errors = [];
  const requiredFields = ['name', 'email', 'phone'];
  
  errors.push(...validateRequired(requiredFields, candidateData));
  
  if (candidateData.email && !isValidEmail(candidateData.email)) {
    errors.push('Invalid email format');
  }
  
  if (candidateData.phone && !isValidPhone(candidateData.phone)) {
    errors.push('Invalid phone number format');
  }
  
  return errors;
};

// Employee validation
const validateEmployee = (employeeData) => {
  const errors = [];
  const requiredFields = ['name', 'email', 'department', 'position'];
  
  errors.push(...validateRequired(requiredFields, employeeData));
  
  if (employeeData.email && !isValidEmail(employeeData.email)) {
    errors.push('Invalid email format');
  }
  
  if (employeeData.salary && !isValidSalary(employeeData.salary)) {
    errors.push('Salary must be a positive number');
  }
  
  if (employeeData.start_date && !isValidDate(employeeData.start_date)) {
    errors.push('Invalid start date format');
  }
  
  return errors;
};

// Interview validation
const validateInterview = (interviewData) => {
  const errors = [];
  const requiredFields = ['candidate_id', 'job_id', 'interview_date', 'interview_type'];
  
  errors.push(...validateRequired(requiredFields, interviewData));
  
  if (interviewData.interview_date && !isValidDate(interviewData.interview_date)) {
    errors.push('Invalid interview date format');
  }
  
  if (interviewData.candidate_id && isNaN(parseInt(interviewData.candidate_id))) {
    errors.push('Invalid candidate ID');
  }
  
  if (interviewData.job_id && isNaN(parseInt(interviewData.job_id))) {
    errors.push('Invalid job ID');
  }
  
  return errors;
};

// Admin validation
const validateAdmin = (adminData) => {
  const errors = [];
  const requiredFields = ['username', 'email', 'password'];
  
  errors.push(...validateRequired(requiredFields, adminData));
  
  if (adminData.email && !isValidEmail(adminData.email)) {
    errors.push('Invalid email format');
  }
  
  if (adminData.password && !isValidPassword(adminData.password)) {
    errors.push('Password must be at least 8 characters with uppercase, lowercase, and number');
  }
  
  if (adminData.role && !['admin', 'super_admin'].includes(adminData.role)) {
    errors.push('Invalid role. Must be admin or super_admin');
  }
  
  return errors;
};

// Policy validation
const validatePolicy = (policyData) => {
  const errors = [];
  const requiredFields = ['title', 'content', 'category'];
  
  errors.push(...validateRequired(requiredFields, policyData));
  
  if (policyData.effective_date && !isValidDate(policyData.effective_date)) {
    errors.push('Invalid effective date format');
  }
  
  return errors;
};

// Performance goal validation
const validatePerformanceGoal = (goalData) => {
  const errors = [];
  const requiredFields = ['employee_id', 'title', 'description'];
  
  errors.push(...validateRequired(requiredFields, goalData));
  
  if (goalData.employee_id && isNaN(parseInt(goalData.employee_id))) {
    errors.push('Invalid employee ID');
  }
  
  if (goalData.target_date && !isValidDate(goalData.target_date)) {
    errors.push('Invalid target date format');
  }
  
  if (goalData.progress && (isNaN(parseInt(goalData.progress)) || goalData.progress < 0 || goalData.progress > 100)) {
    errors.push('Progress must be a number between 0 and 100');
  }
  
  return errors;
};

// Database error handler
const handleDatabaseError = (error, operation = 'database operation') => {
  console.error(`Database error during ${operation}:`, error);
  
  // Handle specific PostgreSQL errors
  switch (error.code) {
    case '23505': // Unique violation
      return { status: 409, message: 'Record already exists' };
    case '23503': // Foreign key violation
      return { status: 400, message: 'Referenced record does not exist' };
    case '23502': // Not null violation
      return { status: 400, message: 'Required field is missing' };
    case '22P02': // Invalid text representation
      return { status: 400, message: 'Invalid data format' };
    case '42P01': // Undefined table
      return { status: 500, message: 'Database table not found' };
    case '28P01': // Invalid password
      return { status: 500, message: 'Database authentication failed' };
    case '3D000': // Invalid database name
      return { status: 500, message: 'Database not found' };
    default:
      return { status: 500, message: 'Internal server error' };
  }
};

// Validation middleware factory
const createValidationMiddleware = (validator) => {
  return (req, res, next) => {
    const errors = validator(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    next();
  };
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  isValidDate,
  isValidSalary,
  validateRequired,
  validateJob,
  validateCandidate,
  validateEmployee,
  validateInterview,
  validateAdmin,
  validatePolicy,
  validatePerformanceGoal,
  handleDatabaseError,
  createValidationMiddleware
};