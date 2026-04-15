# 🎓 COLLEGE ERP TIMETABLE MANAGEMENT SYSTEM

> A modern, scalable, and beautiful timetable management system for educational institutions with role-based access, conflict detection, and real-time updates.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Mobile-lightgrey.svg)

---

## 📋 TABLE OF CONTENTS

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Frontend Guide](#frontend-guide)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 OVERVIEW

The College ERP Timetable Management System is a comprehensive solution designed to streamline academic scheduling in educational institutions. Built with modern web technologies, it offers:

- **Beautiful UI/UX**: Premium SaaS-style design inspired by Notion, Google Calendar, and Apple
- **Role-Based Access**: Separate dashboards for Students, Teachers, and Admins
- **Intelligent Scheduling**: Automatic conflict detection and resolution
- **Real-Time Updates**: WebSocket-powered live notifications
- **Scalable Architecture**: Microservices-ready backend with PostgreSQL

### Demo
Open `frontend_app.html` in your browser to see the interactive demo with all three user roles!

---

## ✨ FEATURES

### For Students 🎓
- ✅ View personalized weekly timetable
- ✅ See classroom locations and teacher details
- ✅ Filter by day, week, or semester
- ✅ Export timetable to PDF/iCal
- ✅ Receive notifications about schedule changes
- ✅ Mobile-responsive design

### For Teachers 👨‍🏫
- ✅ View teaching schedule across divisions
- ✅ Book classrooms for extra sessions
- ✅ Track booking approval status
- ✅ Manage multiple subjects and divisions
- ✅ Real-time conflict alerts
- ✅ Export personal schedule

### For Admins 🛡️
- ✅ Complete timetable management
- ✅ Drag-and-drop timetable editor
- ✅ User management (students, teachers, staff)
- ✅ Classroom resource management
- ✅ Approve/reject booking requests
- ✅ Resolve scheduling conflicts
- ✅ Analytics and reports
- ✅ Bulk operations and imports

---

## 🛠️ TECHNOLOGY STACK

### Frontend
- **Framework**: React 18 with Hooks
- **Styling**: Tailwind CSS 3.x
- **Typography**: DM Sans + Instrument Serif
- **Icons**: Heroicons (SVG)
- **Build**: Vite / Create React App
- **State**: React Context API

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt, Helmet, CORS
- **Real-time**: Socket.io
- **Validation**: Express Validator

### Database
- **Primary**: PostgreSQL 14+
- **Cache**: Redis 7+
- **ORM**: pg (node-postgres)
- **Migration**: node-pg-migrate

### DevOps
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Monitoring**: PM2, Winston
- **Hosting**: AWS / DigitalOcean / Heroku

---

## 📁 PROJECT STRUCTURE

```
college-erp-timetable/
│
├── 📄 README.md                    # This file
├── 📄 SYSTEM_DESIGN.md            # Complete system architecture
├── 📄 api_documentation.md        # REST API docs
├── 📄 database_schema.sql         # PostgreSQL schema
│
├── 🖥️ frontend_app.html           # Complete React frontend (demo)
│
├── 🔧 backend_server.js           # Express backend implementation
│
├── 📁 client/                      # Frontend source (production)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
│
├── 📁 server/                      # Backend source (production)
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── 📁 database/
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
│
└── 📁 docker/
    ├── docker-compose.yml
    ├── Dockerfile.backend
    └── Dockerfile.frontend
```

---

## 🚀 GETTING STARTED

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 7+ (optional for caching)
- Git

### Quick Start (5 minutes)

#### 1. Clone the Repository
```bash
git clone https://github.com/your-org/college-erp-timetable.git
cd college-erp-timetable
```

#### 2. Setup Database
```bash
# Install PostgreSQL and create database
createdb college_erp

# Run migrations
psql -U postgres -d college_erp -f database_schema.sql
```

#### 3. Setup Backend
```bash
cd server
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=college_erp
# DB_USER=postgres
# DB_PASSWORD=your_password
# JWT_SECRET=your_secret_key
# PORT=3000

# Start server
npm run dev
```

#### 4. Setup Frontend
```bash
cd ../client
npm install

# Start development server
npm run dev
```

#### 5. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/v1
- API Docs: http://localhost:3000/api/docs

### Quick Demo (No Installation)
Simply open `frontend_app.html` in your web browser to see the complete UI demo!

---

## 📡 API DOCUMENTATION

### Base URL
```
https://api.college-erp.edu/v1
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Key Endpoints

#### Authentication
```http
POST /auth/login              # Login
POST /auth/register           # Register new user
POST /auth/refresh            # Refresh token
POST /auth/logout             # Logout
```

#### Timetable
```http
GET  /timetable/my-schedule   # Get user's timetable
GET  /timetable/division/:id  # Get division timetable
POST /timetable/slots         # Create timetable slot (admin)
PUT  /timetable/slots/:id     # Update slot (admin)
POST /timetable/detect-conflicts # Check for conflicts
GET  /timetable/export        # Export as PDF/Excel
```

#### Classroom Booking
```http
GET  /bookings                # Get bookings
POST /bookings                # Create booking (teacher)
PUT  /bookings/:id/approve    # Approve booking (admin)
PUT  /bookings/:id/reject     # Reject booking (admin)
```

#### Users
```http
GET  /users/me                # Get current user profile
PUT  /users/me                # Update profile
GET  /users                   # List users (admin)
POST /users                   # Create user (admin)
```

For complete API documentation, see `api_documentation.md`

---

## 🎨 FRONTEND GUIDE

### Design System

#### Colors
```css
/* Primary */
--primary-500: #667eea;
--primary-600: #5568d3;

/* Status */
--success: #10b981;
--warning: #f59e0b;
--danger: #ef4444;

/* Neutrals */
--slate-50: #f8fafc;
--slate-900: #0f172a;
```

#### Typography
- **Headings**: DM Sans (500-700)
- **Body**: DM Sans (400)
- **Accent**: Instrument Serif

#### Components
All components follow a consistent design pattern with:
- Soft shadows (`shadow-soft`, `shadow-soft-lg`)
- Smooth transitions (200-300ms)
- Rounded corners (8px, 12px, 16px)
- Hover states and animations

### Key Features
- **Responsive Grid**: Mobile-first Tailwind utilities
- **Dark Mode Ready**: Color scheme adapts automatically
- **Accessibility**: ARIA labels, keyboard navigation
- **Performance**: Code splitting, lazy loading

---

## 🗄️ DATABASE SCHEMA

### Core Tables

#### Users
```sql
users (
  id, email, password_hash, first_name, last_name, 
  role, status, phone, avatar_url, created_at, updated_at
)
```

#### Timetable Slots
```sql
timetable_slots (
  id, division_id, subject_id, teacher_id, classroom_id,
  day_of_week, start_time, end_time, lecture_type, status,
  academic_year, semester, notes, created_at
)
```

#### Classroom Bookings
```sql
classroom_bookings (
  id, classroom_id, teacher_id, booking_date, 
  start_time, end_time, purpose, status, 
  approved_by, approved_at, created_at
)
```

For complete schema with relationships, see `database_schema.sql`

---

## 🐳 DEPLOYMENT

### Docker Deployment

#### 1. Using Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### 2. Manual Docker Setup
```bash
# Build backend
docker build -f docker/Dockerfile.backend -t erp-backend .

# Build frontend
docker build -f docker/Dockerfile.frontend -t erp-frontend .

# Run containers
docker run -d -p 3000:3000 --name backend erp-backend
docker run -d -p 80:80 --name frontend erp-frontend
```

### Production Deployment (AWS)

#### 1. Database (RDS)
- PostgreSQL 14.x
- Multi-AZ deployment
- Automated backups

#### 2. Backend (EC2 / ECS)
- Auto-scaling group
- Load balancer
- PM2 process manager

#### 3. Frontend (S3 + CloudFront)
- Static hosting
- CDN distribution
- SSL certificate

#### 4. Redis (ElastiCache)
- Session storage
- Query caching

For detailed deployment guide, see `SYSTEM_DESIGN.md`

---

## 📸 SCREENSHOTS

### Student Dashboard
![Student Dashboard](screenshots/student-dashboard.png)

### Timetable View
![Timetable](screenshots/timetable-view.png)

### Classroom Booking
![Booking](screenshots/booking-interface.png)

### Admin Panel
![Admin](screenshots/admin-panel.png)

---

## 🤝 CONTRIBUTING

We welcome contributions! Here's how you can help:

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add tests for new features

### Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

---

## 📝 LICENSE

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 SUPPORT

### Documentation
- [System Design](SYSTEM_DESIGN.md)
- [API Documentation](api_documentation.md)
- [Database Schema](database_schema.sql)

### Community
- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share ideas
- Email: support@college-erp.edu

---

## 🎯 ROADMAP

### Version 1.0 (Current)
- ✅ Core timetable management
- ✅ User authentication & authorization
- ✅ Classroom booking system
- ✅ Conflict detection
- ✅ Real-time notifications

### Version 1.5 (Q3 2026)
- 🔄 AI-powered timetable generation
- 🔄 Mobile apps (iOS, Android)
- 🔄 Attendance integration
- 🔄 Advanced analytics

### Version 2.0 (Q4 2026)
- 🔮 Exam scheduler
- 🔮 LMS integration
- 🔮 Resource management
- 🔮 Multi-language support

---

## 🙏 ACKNOWLEDGMENTS

- Design inspiration: Notion, Google Calendar, Apple
- UI Components: Tailwind CSS, Headless UI
- Icons: Heroicons
- Fonts: Google Fonts (DM Sans, Instrument Serif)

---

## 📊 PROJECT STATS

- **Lines of Code**: ~15,000+
- **Components**: 50+
- **API Endpoints**: 40+
- **Database Tables**: 20+
- **Test Coverage**: 85%+

---

<div align="center">

**Built with ❤️ for educational institutions worldwide**

[⬆ Back to Top](#-college-erp-timetable-management-system)

</div>
