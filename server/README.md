# Portfolio Backend

This is the backend server for Inimfon Udoh's portfolio website. It provides API endpoints for project data and testimonials.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   ```

3. Start the server:
   ```
   npm run dev   # Development mode with auto-reload
   npm start     # Production mode
   ```

## API Endpoints

### Projects
- **GET /api/projects**
  - Get a list of all projects

### Testimonials
- **GET /api/testimonials**
  - Get a list of all testimonials

## Folder Structure

```
server/
├── server.js          # Main server file
├── .env               # Environment variables (not committed to git)
├── package.json       # Project dependencies and scripts
└── README.md          # This file
```

## Technology Stack

- Node.js
- Express
- CORS (for cross-origin requests)
- dotenv (for environment variables) 