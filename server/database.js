const { Pool } = require('pg');

// Database configuration - use DATABASE_URL if available, otherwise use individual params
const pool = new Pool(
  process.env.DATABASE_URL ? 
    { connectionString: process.env.DATABASE_URL } :
    {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'postgres',
      password: process.env.DB_PASSWORD || 'Test1234',
      port: process.env.DB_PORT || 5432,
    }
);

// Database schema creation
const createTables = async () => {
  let client = await pool.connect();
  
  try {
    // Skip database creation check when using external database
    if (!process.env.DATABASE_URL) {
      // Check if hr_platform database exists, create if not
      const dbExists = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = 'hr_platform'"
      );
      
      if (dbExists.rows.length === 0) {
        await client.query('CREATE DATABASE hr_platform');
        console.log('Database hr_platform created successfully');
      }
      
      client.release();
       
       // Update the module's pool to use hr_platform database
       pool.options.database = 'hr_platform';
       pool.end(); // Close current connections
       
       // Create new pool with hr_platform database
       const newPool = new Pool({
         user: process.env.DB_USER || 'postgres',
         host: process.env.DB_HOST || 'localhost',
         database: 'hr_platform',
         password: process.env.DB_PASSWORD || 'Test1234',
         port: process.env.DB_PORT || 5432,
       });
       
       // Replace pool properties
       Object.setPrototypeOf(pool, Object.getPrototypeOf(newPool));
       Object.assign(pool, newPool);
       
       client = await pool.connect();
    }

    // Create admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database tables created successfully');

    // Create jobs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        department VARCHAR(100) NOT NULL,
        location VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        requirements TEXT,
        salary VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES admins(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create candidates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        position VARCHAR(100),
        experience INTEGER,
        skills TEXT[],
        resume_filename VARCHAR(255),
        status VARCHAR(20) DEFAULT 'new',
        applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        job_id INTEGER REFERENCES jobs(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create interviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS interviews (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER REFERENCES candidates(id),
        job_id INTEGER REFERENCES jobs(id),
        interviewer VARCHAR(200),
        interview_date DATE,
        interview_time TIME,
        type VARCHAR(50),
        status VARCHAR(20) DEFAULT 'scheduled',
        notes TEXT,
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create employees table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        department VARCHAR(100),
        position VARCHAR(100),
        salary DECIMAL(12,2),
        start_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        benefits JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create payroll table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payroll (
        id SERIAL PRIMARY KEY,
        period VARCHAR(20) NOT NULL,
        employee_ids INTEGER[],
        total_amount DECIMAL(15,2),
        taxes DECIMAL(15,2),
        deductions DECIMAL(15,2),
        status VARCHAR(20) DEFAULT 'processed',
        processed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_by INTEGER REFERENCES admins(id)
      );
    `);

    // Create performance table (goals)
    await client.query(`
      CREATE TABLE IF NOT EXISTS performance_goals (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        target_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        progress INTEGER DEFAULT 0,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create performance reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS performance_reviews (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        reviewer_id INTEGER REFERENCES admins(id),
        period VARCHAR(20),
        ratings JSONB,
        feedback TEXT,
        goals JSONB,
        status VARCHAR(20) DEFAULT 'completed',
        review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create policies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT,
        category VARCHAR(100),
        effective_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES admins(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        type VARCHAR(100),
        category VARCHAR(100),
        filename VARCHAR(255),
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        employee_id INTEGER REFERENCES employees(id),
        uploaded_by INTEGER REFERENCES admins(id)
      );
    `);

    // Create companies table for multi-tenant support
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        industry VARCHAR(100),
        size VARCHAR(50),
        subscription_plan VARCHAR(50) DEFAULT 'basic',
        subscription_status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create company_users table (for company admins)
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_users (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id),
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'company_admin',
        permissions JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id, username),
        UNIQUE(company_id, email)
      );
    `);

    // Create employee_self_service table for employee portal access
    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_self_service (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        username VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        last_login TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id)
      );
    `);

    // Create training_programs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_programs (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        duration_hours INTEGER,
        category VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES company_users(id)
      );
    `);

    // Create employee_training table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_training (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        training_program_id INTEGER REFERENCES training_programs(id),
        status VARCHAR(20) DEFAULT 'enrolled',
        start_date DATE,
        completion_date DATE,
        score INTEGER,
        certificate_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create leave_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        leave_type VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days_requested INTEGER NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        approved_by INTEGER REFERENCES company_users(id),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create attendance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        date DATE NOT NULL,
        clock_in TIME,
        clock_out TIME,
        break_duration INTEGER DEFAULT 0,
        total_hours DECIMAL(4,2),
        status VARCHAR(20) DEFAULT 'present',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, date)
      );
    `);

    // Create payroll_items table for detailed payroll breakdown
    await client.query(`
      CREATE TABLE IF NOT EXISTS payroll_items (
        id SERIAL PRIMARY KEY,
        payroll_id INTEGER REFERENCES payroll(id),
        employee_id INTEGER REFERENCES employees(id),
        basic_salary DECIMAL(12,2),
        allowances DECIMAL(12,2) DEFAULT 0,
        overtime DECIMAL(12,2) DEFAULT 0,
        bonuses DECIMAL(12,2) DEFAULT 0,
        gross_pay DECIMAL(12,2),
        tax_deduction DECIMAL(12,2) DEFAULT 0,
        pension_deduction DECIMAL(12,2) DEFAULT 0,
        other_deductions DECIMAL(12,2) DEFAULT 0,
        net_pay DECIMAL(12,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create compliance_reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance_reports (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id),
        report_type VARCHAR(100) NOT NULL,
        period VARCHAR(20) NOT NULL,
        data JSONB,
        status VARCHAR(20) DEFAULT 'generated',
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        generated_by INTEGER REFERENCES company_users(id)
      );
    `);

    // Create sessions table for admin sessions
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
    `);

    // Update employees table to include company_id for multi-tenant support
    await client.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS emergency_contact JSONB,
      ADD COLUMN IF NOT EXISTS bank_details JSONB;
    `);

    // Update jobs table to include company_id
    await client.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
    `);

    // Update candidates table to include company_id
    await client.query(`
      ALTER TABLE candidates 
      ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
    `);

    // Update payroll table to include company_id
    await client.query(`
      ALTER TABLE payroll 
      ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
    `);

    // Update performance_goals table to include company_id
    await client.query(`
      ALTER TABLE performance_goals 
      ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
    `);

    // Update performance_reviews table to include company_id
    await client.query(`
      ALTER TABLE performance_reviews 
      ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
    `);

    // Update policies table to include company_id
    await client.query(`
      ALTER TABLE policies 
      ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
    `);

    // Update documents table to include company_id
    await client.query(`
      ALTER TABLE documents 
      ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
    `);
    
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Create default admin user
const createDefaultAdmin = async () => {
  const bcrypt = require('bcryptjs');
  const client = await pool.connect();
  
  try {
    // Check if admin already exists
    const existingAdmin = await client.query(
      'SELECT id FROM admins WHERE username = $1',
      ['admin']
    );

    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO admins (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['admin', 'admin@hrplatform.com', hashedPassword, 'super_admin']
      );
      console.log('Default admin user created: username=admin, password=admin123');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  } finally {
    client.release();
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    await createTables();
    await createDefaultAdmin();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

module.exports = {
  pool,
  initializeDatabase
};