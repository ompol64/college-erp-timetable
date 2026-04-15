-- ================================================
-- COLLEGE ERP TIMETABLE MANAGEMENT SYSTEM
-- PostgreSQL Database Schema
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- USERS & AUTHENTICATION
-- ================================================

CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    status user_status DEFAULT 'active',
    phone VARCHAR(20),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ================================================
-- ACADEMIC STRUCTURE
-- ================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    head_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    credits INTEGER NOT NULL,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_department ON courses(department_id);
CREATE INDEX idx_courses_semester ON courses(semester);

CREATE TABLE divisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    max_students INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_division_per_course UNIQUE(course_id, name, semester, academic_year)
);

CREATE INDEX idx_divisions_course ON divisions(course_id);
CREATE INDEX idx_divisions_academic_year ON divisions(academic_year);

-- ================================================
-- STUDENT & TEACHER PROFILES
-- ================================================

CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    enrollment_number VARCHAR(50) UNIQUE NOT NULL,
    division_id UUID REFERENCES divisions(id) ON DELETE SET NULL,
    admission_year INTEGER NOT NULL,
    current_semester INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_profiles_division ON student_profiles(division_id);
CREATE INDEX idx_student_profiles_enrollment ON student_profiles(enrollment_number);

CREATE TABLE teacher_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    specialization TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teacher_profiles_department ON teacher_profiles(department_id);
CREATE INDEX idx_teacher_profiles_employee ON teacher_profiles(employee_id);

-- ================================================
-- SUBJECTS & ASSIGNMENTS
-- ================================================

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    credits INTEGER NOT NULL,
    lecture_hours INTEGER DEFAULT 3,
    practical_hours INTEGER DEFAULT 0,
    tutorial_hours INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subjects_course ON subjects(course_id);
CREATE INDEX idx_subjects_semester ON subjects(semester);

CREATE TABLE subject_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_subject_teacher_division UNIQUE(subject_id, division_id, academic_year)
);

CREATE INDEX idx_subject_assignments_teacher ON subject_assignments(teacher_id);
CREATE INDEX idx_subject_assignments_division ON subject_assignments(division_id);

-- ================================================
-- CLASSROOMS
-- ================================================

CREATE TYPE room_type AS ENUM ('lecture_hall', 'laboratory', 'tutorial_room', 'seminar_hall', 'auditorium');

CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number VARCHAR(50) UNIQUE NOT NULL,
    building VARCHAR(100),
    floor INTEGER,
    capacity INTEGER NOT NULL,
    room_type room_type NOT NULL,
    has_projector BOOLEAN DEFAULT FALSE,
    has_whiteboard BOOLEAN DEFAULT TRUE,
    has_ac BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_classrooms_type ON classrooms(room_type);
CREATE INDEX idx_classrooms_capacity ON classrooms(capacity);
CREATE INDEX idx_classrooms_available ON classrooms(is_available);

-- ================================================
-- TIMETABLE
-- ================================================

CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');
CREATE TYPE lecture_type AS ENUM ('lecture', 'practical', 'tutorial');
CREATE TYPE lecture_status AS ENUM ('scheduled', 'cancelled', 'rescheduled', 'completed');

CREATE TABLE timetable_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    
    day_of_week day_of_week NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    lecture_type lecture_type DEFAULT 'lecture',
    status lecture_status DEFAULT 'scheduled',
    
    academic_year VARCHAR(20) NOT NULL,
    semester INTEGER NOT NULL,
    
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_timetable_division ON timetable_slots(division_id);
CREATE INDEX idx_timetable_teacher ON timetable_slots(teacher_id);
CREATE INDEX idx_timetable_classroom ON timetable_slots(classroom_id);
CREATE INDEX idx_timetable_day_time ON timetable_slots(day_of_week, start_time, end_time);
CREATE INDEX idx_timetable_academic_year ON timetable_slots(academic_year, semester);

-- ================================================
-- CLASSROOM BOOKINGS
-- ================================================

CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

CREATE TABLE classroom_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    purpose TEXT NOT NULL,
    expected_attendees INTEGER,
    
    status booking_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_booking_time CHECK (end_time > start_time),
    CONSTRAINT future_booking CHECK (booking_date >= CURRENT_DATE)
);

CREATE INDEX idx_bookings_classroom ON classroom_bookings(classroom_id);
CREATE INDEX idx_bookings_teacher ON classroom_bookings(teacher_id);
CREATE INDEX idx_bookings_date ON classroom_bookings(booking_date);
CREATE INDEX idx_bookings_status ON classroom_bookings(status);

-- ================================================
-- CONFLICT DETECTION & NOTIFICATIONS
-- ================================================

CREATE TABLE schedule_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conflict_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    related_slot_ids UUID[] NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conflicts_resolved ON schedule_conflicts(resolved);
CREATE INDEX idx_conflicts_created ON schedule_conflicts(created_at DESC);

CREATE TYPE notification_type AS ENUM ('timetable_change', 'booking_approved', 'booking_rejected', 'conflict_detected', 'general');
CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status notification_status DEFAULT 'unread',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ================================================
-- AUDIT LOGS
-- ================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_profiles_updated_at BEFORE UPDATE ON teacher_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON classrooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timetable_slots_updated_at BEFORE UPDATE ON timetable_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classroom_bookings_updated_at BEFORE UPDATE ON classroom_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- VIEWS FOR COMMON QUERIES
-- ================================================

-- Complete student view
CREATE VIEW student_complete_view AS
SELECT 
    u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url,
    sp.enrollment_number, sp.admission_year, sp.current_semester,
    d.name as division_name, d.semester, d.academic_year,
    c.name as course_name, c.code as course_code,
    dept.name as department_name
FROM users u
JOIN student_profiles sp ON u.id = sp.user_id
LEFT JOIN divisions d ON sp.division_id = d.id
LEFT JOIN courses c ON d.course_id = c.id
LEFT JOIN departments dept ON c.department_id = dept.id
WHERE u.role = 'student';

-- Complete teacher view
CREATE VIEW teacher_complete_view AS
SELECT 
    u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url,
    tp.employee_id, tp.specialization,
    dept.name as department_name, dept.code as department_code
FROM users u
JOIN teacher_profiles tp ON u.id = tp.user_id
LEFT JOIN departments dept ON tp.department_id = dept.id
WHERE u.role = 'teacher';

-- Complete timetable view
CREATE VIEW timetable_complete_view AS
SELECT 
    ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.lecture_type, ts.status,
    ts.academic_year, ts.semester, ts.notes,
    d.name as division_name,
    subj.code as subject_code, subj.name as subject_name,
    u.first_name || ' ' || u.last_name as teacher_name,
    cr.room_number, cr.building, cr.capacity,
    ts.created_at, ts.updated_at
FROM timetable_slots ts
JOIN divisions d ON ts.division_id = d.id
JOIN subjects subj ON ts.subject_id = subj.id
JOIN users u ON ts.teacher_id = u.id
LEFT JOIN classrooms cr ON ts.classroom_id = cr.id;

-- ================================================
-- SAMPLE DATA (OPTIONAL)
-- ================================================

-- Insert sample admin user (password: Admin@123)
INSERT INTO users (email, password_hash, first_name, last_name, role, status)
VALUES ('admin@college.edu', '$2b$10$YourHashedPasswordHere', 'System', 'Administrator', 'admin', 'active');

COMMIT;
