// ================================================
// COLLEGE ERP TIMETABLE MANAGEMENT SYSTEM
// Backend Implementation - Node.js + Express
// ================================================

// FILE: server.js
// Main server entry point

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// ================================================
// AUTHENTICATION MIDDLEWARE
// ================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Access token required' }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Invalid or expired token' }
      });
    }
    req.user = user;
    next();
  });
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
    }
    next();
  };
};

// ================================================
// UTILITY FUNCTIONS
// ================================================

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// ================================================
// AUTHENTICATION ROUTES
// ================================================

// Register
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'User with this email already exists' }
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING id, email, first_name, last_name, role, phone, created_at`,
      [email, passwordHash, firstName, lastName, role, phone]
    );

    const user = result.rows[0];

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
        token,
        refreshToken,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to register user' }
    });
  }
});

// Login
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password required' }
      });
    }

    // Get user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    const user = result.rows[0];

    // Check password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          avatar: user.avatar_url,
        },
        token,
        refreshToken,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to login' }
    });
  }
});

// ================================================
// USER ROUTES
// ================================================

// Get current user
app.get('/api/v1/users/me', authenticateToken, async (req, res) => {
  try {
    let query;
    let params = [req.user.id];

    if (req.user.role === 'student') {
      query = `
        SELECT u.*, sp.enrollment_number, sp.current_semester, sp.admission_year,
               d.name as division_name, d.semester, d.academic_year,
               c.name as course_name, c.code as course_code
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        LEFT JOIN divisions d ON sp.division_id = d.id
        LEFT JOIN courses c ON d.course_id = c.id
        WHERE u.id = $1
      `;
    } else if (req.user.role === 'teacher') {
      query = `
        SELECT u.*, tp.employee_id, tp.specialization,
               dept.name as department_name
        FROM users u
        LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
        LEFT JOIN departments dept ON tp.department_id = dept.id
        WHERE u.id = $1
      `;
    } else {
      query = 'SELECT * FROM users WHERE id = $1';
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get user' }
    });
  }
});

// ================================================
// TIMETABLE ROUTES
// ================================================

// Get my schedule (student or teacher)
app.get('/api/v1/timetable/my-schedule', authenticateToken, async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'student') {
      query = `
        SELECT ts.*, 
               subj.code as subject_code, subj.name as subject_name,
               u.first_name || ' ' || u.last_name as teacher_name,
               cr.room_number, cr.building, cr.capacity
        FROM timetable_slots ts
        JOIN student_profiles sp ON sp.user_id = $1
        JOIN subjects subj ON ts.subject_id = subj.id
        JOIN users u ON ts.teacher_id = u.id
        LEFT JOIN classrooms cr ON ts.classroom_id = cr.id
        WHERE ts.division_id = sp.division_id
          AND ts.status = 'scheduled'
        ORDER BY 
          CASE ts.day_of_week
            WHEN 'monday' THEN 1
            WHEN 'tuesday' THEN 2
            WHEN 'wednesday' THEN 3
            WHEN 'thursday' THEN 4
            WHEN 'friday' THEN 5
            WHEN 'saturday' THEN 6
          END,
          ts.start_time
      `;
      params = [req.user.id];
    } else if (req.user.role === 'teacher') {
      query = `
        SELECT ts.*,
               d.name as division_name,
               subj.code as subject_code, subj.name as subject_name,
               cr.room_number, cr.building, cr.capacity
        FROM timetable_slots ts
        JOIN divisions d ON ts.division_id = d.id
        JOIN subjects subj ON ts.subject_id = subj.id
        LEFT JOIN classrooms cr ON ts.classroom_id = cr.id
        WHERE ts.teacher_id = $1
          AND ts.status = 'scheduled'
        ORDER BY 
          CASE ts.day_of_week
            WHEN 'monday' THEN 1
            WHEN 'tuesday' THEN 2
            WHEN 'wednesday' THEN 3
            WHEN 'thursday' THEN 4
            WHEN 'friday' THEN 5
            WHEN 'saturday' THEN 6
          END,
          ts.start_time
      `;
      params = [req.user.id];
    } else {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only students and teachers can view their schedule' }
      });
    }

    const result = await pool.query(query, params);

    // Organize by day
    const schedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
    };

    result.rows.forEach(slot => {
      schedule[slot.day_of_week].push({
        id: slot.id,
        startTime: slot.start_time,
        endTime: slot.end_time,
        subject: {
          code: slot.subject_code,
          name: slot.subject_name,
        },
        teacher: req.user.role === 'student' ? { name: slot.teacher_name } : undefined,
        division: req.user.role === 'teacher' ? slot.division_name : undefined,
        classroom: slot.room_number ? {
          roomNumber: slot.room_number,
          building: slot.building,
          capacity: slot.capacity,
        } : null,
        type: slot.lecture_type,
        status: slot.status,
      });
    });

    res.json({
      success: true,
      data: { schedule }
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get schedule' }
    });
  }
});

// Detect conflicts
app.post('/api/v1/timetable/detect-conflicts', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { divisionId, teacherId, classroomId, dayOfWeek, startTime, endTime, excludeSlotId } = req.body;

    const conflicts = [];

    // Check teacher conflict
    if (teacherId) {
      const teacherQuery = `
        SELECT * FROM timetable_slots
        WHERE teacher_id = $1
          AND day_of_week = $2
          AND status = 'scheduled'
          AND ($3::uuid IS NULL OR id != $3)
          AND (
            (start_time <= $4 AND end_time > $4)
            OR (start_time < $5 AND end_time >= $5)
            OR (start_time >= $4 AND end_time <= $5)
          )
      `;
      const teacherResult = await pool.query(teacherQuery, [teacherId, dayOfWeek, excludeSlotId, startTime, endTime]);
      
      if (teacherResult.rows.length > 0) {
        conflicts.push({
          type: 'teacher_conflict',
          message: 'Teacher already has a lecture at this time',
          existingSlot: teacherResult.rows[0],
        });
      }
    }

    // Check classroom conflict
    if (classroomId) {
      const classroomQuery = `
        SELECT * FROM timetable_slots
        WHERE classroom_id = $1
          AND day_of_week = $2
          AND status = 'scheduled'
          AND ($3::uuid IS NULL OR id != $3)
          AND (
            (start_time <= $4 AND end_time > $4)
            OR (start_time < $5 AND end_time >= $5)
            OR (start_time >= $4 AND end_time <= $5)
          )
      `;
      const classroomResult = await pool.query(classroomQuery, [classroomId, dayOfWeek, excludeSlotId, startTime, endTime]);
      
      if (classroomResult.rows.length > 0) {
        conflicts.push({
          type: 'classroom_conflict',
          message: 'Classroom is already booked',
          existingSlot: classroomResult.rows[0],
        });
      }
    }

    // Check division conflict
    if (divisionId) {
      const divisionQuery = `
        SELECT * FROM timetable_slots
        WHERE division_id = $1
          AND day_of_week = $2
          AND status = 'scheduled'
          AND ($3::uuid IS NULL OR id != $3)
          AND (
            (start_time <= $4 AND end_time > $4)
            OR (start_time < $5 AND end_time >= $5)
            OR (start_time >= $4 AND end_time <= $5)
          )
      `;
      const divisionResult = await pool.query(divisionQuery, [divisionId, dayOfWeek, excludeSlotId, startTime, endTime]);
      
      if (divisionResult.rows.length > 0) {
        conflicts.push({
          type: 'division_conflict',
          message: 'Division already has a lecture at this time',
          existingSlot: divisionResult.rows[0],
        });
      }
    }

    res.json({
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts,
      }
    });
  } catch (error) {
    console.error('Conflict detection error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to detect conflicts' }
    });
  }
});

// Create timetable slot (Admin only)
app.post('/api/v1/timetable/slots', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { divisionId, subjectId, teacherId, classroomId, dayOfWeek, startTime, endTime, lectureType, academicYear, semester } = req.body;

    // Detect conflicts first
    const conflictCheck = await pool.query(`
      SELECT * FROM timetable_slots
      WHERE (
        (teacher_id = $1 OR division_id = $2 OR classroom_id = $3)
        AND day_of_week = $4
        AND status = 'scheduled'
        AND (
          (start_time <= $5 AND end_time > $5)
          OR (start_time < $6 AND end_time >= $6)
          OR (start_time >= $5 AND end_time <= $6)
        )
      )
    `, [teacherId, divisionId, classroomId, dayOfWeek, startTime, endTime]);

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'Scheduling conflict detected' },
        conflicts: conflictCheck.rows,
      });
    }

    // Create slot
    const result = await pool.query(`
      INSERT INTO timetable_slots (division_id, subject_id, teacher_id, classroom_id, day_of_week, start_time, end_time, lecture_type, academic_year, semester, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [divisionId, subjectId, teacherId, classroomId, dayOfWeek, startTime, endTime, lectureType, academicYear, semester, req.user.id]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      conflicts: [],
    });
  } catch (error) {
    console.error('Create slot error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create timetable slot' }
    });
  }
});

// ================================================
// ADMIN ANALYTICS ROUTES
// ================================================

app.get('/api/v1/analytics/dashboard', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const [students, teachers, classrooms, pendingBookings] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'teacher'"),
      pool.query("SELECT COUNT(*) FROM classrooms"),
      pool.query("SELECT COUNT(*) FROM classroom_bookings WHERE status = 'pending'")
    ]);

    res.json({
      success: true,
      data: {
        totalStudents: parseInt(students.rows[0].count),
        totalTeachers: parseInt(teachers.rows[0].count),
        totalClassrooms: parseInt(classrooms.rows[0].count),
        pendingBookings: parseInt(pendingBookings.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch analytics' } });
  }
});

// ================================================
// CLASSROOM BOOKING ROUTES
// ================================================
// Get all classrooms for booking dropdown
app.get('/api/v1/classrooms', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM classrooms');
    res.json({ success: true, data: { classrooms: result.rows } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch classrooms' } });
  }
});
// Get bookings
app.get('/api/v1/bookings', authenticateToken, async (req, res) => {
  try {
    const { status, date, classroomId } = req.query;

    let query = `
      SELECT cb.*,
             cr.room_number, cr.building,
             u.first_name || ' ' || u.last_name as teacher_name,
             tp.employee_id
      FROM classroom_bookings cb
      JOIN classrooms cr ON cb.classroom_id = cr.id
      JOIN users u ON cb.teacher_id = u.id
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Filter by role
    if (req.user.role === 'teacher') {
      query += ` AND cb.teacher_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }

    // Filter by status
    if (status) {
      query += ` AND cb.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Filter by date
    if (date) {
      query += ` AND cb.booking_date = $${paramCount}`;
      params.push(date);
      paramCount++;
    }

    // Filter by classroom
    if (classroomId) {
      query += ` AND cb.classroom_id = $${paramCount}`;
      params.push(classroomId);
      paramCount++;
    }

    query += ' ORDER BY cb.booking_date DESC, cb.start_time DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: { bookings: result.rows }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get bookings' }
    });
  }
});

// Create booking
app.post('/api/v1/bookings', authenticateToken, authorize('teacher'), async (req, res) => {
  try {
    const { classroomId, bookingDate, startTime, endTime, purpose, expectedAttendees } = req.body;

    // Check availability
    const conflictCheck = await pool.query(`
      SELECT * FROM classroom_bookings
      WHERE classroom_id = $1
        AND booking_date = $2
        AND status IN ('pending', 'approved')
        AND (
          (start_time <= $3 AND end_time > $3)
          OR (start_time < $4 AND end_time >= $4)
          OR (start_time >= $3 AND end_time <= $4)
        )
    `, [classroomId, bookingDate, startTime, endTime]);

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'Classroom is already booked for this time slot' }
      });
    }

    // Create booking
    const result = await pool.query(`
      INSERT INTO classroom_bookings (classroom_id, teacher_id, booking_date, start_time, end_time, purpose, expected_attendees)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [classroomId, req.user.id, bookingDate, startTime, endTime, purpose, expectedAttendees]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Booking request submitted for approval'
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create booking' }
    });
  }
});

// Approve booking
app.put('/api/v1/bookings/:id/approve', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await pool.query(`
      UPDATE classroom_bookings
      SET status = 'approved',
          approved_by = $1,
          approved_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [req.user.id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' }
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Booking approved successfully'
    });
  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to approve booking' }
    });
  }
});

// ============================================
// ADMIN BOOKING APPROVAL ENDPOINTS (Claude's Code)
// ============================================

// Middleware to check if user is admin 
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            error: 'Access denied. Admin privileges required.' 
        });
    }
    next();
}

// Get all bookings (admin only)
app.get('/api/v1/admin/bookings', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                b.id,
                b.booking_date,
                b.start_time,
                b.end_time,
                b.purpose,
                b.status,
                u.first_name || ' ' || u.last_name AS teacher_name,
                c.room_number AS classroom_name
            FROM classroom_bookings b
            JOIN users u ON b.teacher_id = u.id
            JOIN classrooms c ON b.classroom_id = c.id
            ORDER BY 
                CASE 
                    WHEN b.status = 'pending' THEN 1
                    WHEN b.status = 'approved' THEN 2
                    ELSE 3
                END,
                b.booking_date DESC
        `);
        
        res.json({ 
            success: true,
            data: {
                bookings: result.rows
            }
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch bookings' 
        });
    }
});

// Approve booking (admin only)
app.patch('/api/v1/admin/bookings/:id/approved', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query(
            'UPDATE classroom_bookings SET status = $1 WHERE id = $2 RETURNING *',
            ['approved', id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Booking not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Booking approved successfully',
            data: {
                booking: result.rows[0]
            }
        });
    } catch (error) {
        console.error('Error approving booking:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to approve booking' 
        });
    }
});

// Reject booking (admin only)
app.patch('/api/v1/admin/bookings/:id/rejected', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query(
            'UPDATE classroom_bookings SET status = $1 WHERE id = $2 RETURNING *',
            ['rejected', id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Booking not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Booking rejected successfully',
            data: {
                booking: result.rows[0]
            }
        });
    } catch (error) {
        console.error('Error rejecting booking:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to reject booking' 
        });
    }
});

// ================================================
// HEALTH CHECK
// ================================================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ================================================
// ERROR HANDLER
// ================================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
  });
});

// ================================================
// START SERVER
// ================================================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;