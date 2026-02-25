# 📚 Student Management System

A modern, full-stack Student Management System designed for educational institutions to streamline administration, tracking, and interaction related to students. Built with React, Node.js, and MongoDB, this application provides a comprehensive platform for managing students, teachers, courses, attendance, assignments, and more.

![Dashboard Preview](https://res.cloudinary.com/dhyo79gy1/image/upload/v1772033714/dashboard_yo1w8n.png)


## ✨ Features

### 👥 User Roles
- **Admin**: Full system access, user management, analytics
- **Teacher**: Course management, attendance marking, grading
- **Student**: View courses, assignments, grades, attendance

### 📊 Core Functionality
- **Dashboard**: Role-specific dashboards with real-time analytics
- **Student Management**: CRUD operations with bulk import
- **Teacher Management**: Profile management and course assignment
- **Course Management**: Create and manage courses with schedules
- **Attendance Tracking**: Digital attendance with reports
- **Assignments & Grading**: Create, submit, and grade assignments
- **Real-time Chat**: Instant messaging between users
- **Notifications**: Real-time alerts and announcements

### 🎨 Design Features
- Modern, responsive UI with light/dark theme support
- Professional dashboard with interactive charts
- Collapsible sidebar with smooth animations
- Real-time connection status indicator
- Mobile-optimized interface

## 🚀 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and development server
- **React Router DOM** - Navigation and routing
- **Bootstrap 5** - UI components and styling
- **Chart.js & react-chartjs-2** - Data visualization
- **Socket.io-client** - Real-time communication
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **date-fns** - Date manipulation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Nodemailer** - Email notifications

## 📁 Project Structure

```
student-management-system/
├── frontend/               # React application
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── layout/     # Layout components
│   │   │   └── common/     # Common components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # CSS styles
│   └── package.json
│
└── backend/                # Node.js application
    ├── src/
    │   ├── controllers/    # Route controllers
    │   ├── models/         # Mongoose models
    │   ├── routes/         # Express routes
    │   ├── middleware/     # Custom middleware
    │   └── config/         # Configuration files
    ├── uploads/            # File uploads
    └── package.json
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Environment Variables

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/level-3.git
   cd student-management-system
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   - Create `.env` files in both backend and frontend directories
   - Add the required variables as shown above

5. **Create admin user**
   ```bash
   cd backend
   node createAdmin.js
   ```

6. **Run the application**

   **Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🌐 Deployment

### Frontend (Vercel)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables
4. Deploy

### Backend (Render)
1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your repository
4. Set environment variables
5. Deploy

## 👥 Default User Accounts

After seeding the database, you can log in with:

| Role     | Email                 | Password   |
|----------|----------------------|------------|
| Admin    | admin@school.com     | admin123   |
| Teacher  | teacher1@school.com  | teacher123 |
| Student  | student1@school.com  | student123 |

## 📊 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Teachers
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/:id` - Update teacher

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course
- `POST /api/courses/:id/enroll` - Enroll student

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/student/:studentId` - Get student attendance

### Assignments
- `GET /api/assignments` - Get assignments
- `POST /api/assignments` - Create assignment
- `POST /api/assignments/:id/submit` - Submit assignment

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

Your Name - [oscarkimenyi49@gmail.com](mailto:oscarkimenyi49@gmail.com)

Project Link: [https://github.com/OscarKimenyi/level-3](https://github.com/OscarKimenyi/level-3)
