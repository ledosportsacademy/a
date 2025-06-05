# LEDO Sports Academy Management System

A comprehensive membership management system for LEDO Sports Academy, featuring member tracking, payment processing, and financial analysis.

## Features

- Member Management with Photo URLs
- Weekly Payment Tracking
- Expense Management
- Donation Tracking
- Weekly Financial Analysis
- PDF Report Generation
- Admin Authentication

## Tech Stack

- Backend: Node.js, Express, MongoDB
- Frontend: Vanilla JavaScript, HTML5, CSS3
- Database: MongoDB Atlas
- Authentication: JWT

## Deployment Instructions

1. **Prerequisites**
   - Node.js (v14 or higher)
   - MongoDB Atlas account
   - Environment variables setup

2. **Environment Variables**
   Create a `.env` file in the root directory with:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ADMIN_EMAIL=your_admin_email
   ADMIN_PASSWORD=your_admin_password
   PORT=5000
   ```

3. **Installation**
   ```bash
   npm install
   ```

4. **Database Setup**
   ```bash
   node setup-admin.js
   ```

5. **Start the Server**
   ```bash
   npm start
   ```

## Project Structure

```
ledo/
├── public/              # Static files
│   ├── index.html      # Main HTML file
│   ├── styles.css      # Styles
│   └── app.js          # Frontend JavaScript
├── routes/             # API routes
├── models/             # Database models
├── middleware/         # Middleware functions
├── server.js           # Main server file
└── setup-admin.js      # Admin setup script
```

## API Endpoints

- `/api/auth/login` - Admin authentication
- `/api/members` - Member management
- `/api/payments` - Payment processing
- `/api/expenses` - Expense management
- `/api/donations` - Donation tracking

## Security Notes

1. Always use HTTPS in production
2. Keep your JWT secret secure
3. Use strong admin credentials
4. Regularly update dependencies

## License

Copyright © 2025 LEDO Sports Academy 