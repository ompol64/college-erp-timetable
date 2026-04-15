# COLLEGE ERP TIMETABLE MANAGEMENT SYSTEM
# REST API Documentation v1.0

BASE_URL: https://api.college-erp.edu/v1
AUTHENTICATION: JWT Bearer Token

## ================================================
## AUTHENTICATION ENDPOINTS
## ================================================

### POST /auth/register
Register a new user account
Request:
{
  "email": "student@college.edu",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "phone": "+1234567890"
}

Response (201):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@college.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

### POST /auth/login
Authenticate user and get JWT token
Request:
{
  "email": "student@college.edu",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@college.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "avatar": "https://..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}

### POST /auth/refresh
Refresh JWT token
Headers: Authorization: Bearer <refresh_token>

Response (200):
{
  "success": true,
  "data": {
    "token": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}

### POST /auth/logout
Invalidate current session
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}

### POST /auth/forgot-password
Request password reset
Request:
{
  "email": "student@college.edu"
}

Response (200):
{
  "success": true,
  "message": "Password reset link sent to email"
}

## ================================================
## USER MANAGEMENT
## ================================================

### GET /users/me
Get current user profile
Headers: Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "student@college.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "phone": "+1234567890",
    "avatar": "https://...",
    "profile": {
      "enrollmentNumber": "EN2024001",
      "divisionId": "uuid",
      "divisionName": "A",
      "semester": 5,
      "admissionYear": 2024
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLogin": "2024-04-13T08:15:00Z"
  }
}

### PUT /users/me
Update current user profile
Request:
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "avatar": "base64_or_url"
}

Response (200):
{
  "success": true,
  "data": { /* updated user object */ }
}

### GET /users (Admin only)
List all users with pagination and filters
Query Params:
  - page: int (default: 1)
  - limit: int (default: 20, max: 100)
  - role: string (student|teacher|admin)
  - status: string (active|inactive|suspended)
  - search: string (search by name or email)

Response (200):
{
  "success": true,
  "data": {
    "users": [/* user objects */],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 450,
      "totalPages": 23
    }
  }
}

### POST /users (Admin only)
Create a new user
Request:
{
  "email": "newteacher@college.edu",
  "password": "TempPass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "teacher",
  "phone": "+1234567890",
  "profile": {
    "employeeId": "EMP2024001",
    "departmentId": "uuid",
    "specialization": "Data Structures"
  }
}

Response (201):
{
  "success": true,
  "data": { /* created user object */ }
}

### PUT /users/:id (Admin only)
Update any user
### DELETE /users/:id (Admin only)
Delete user (soft delete)

## ================================================
## TIMETABLE ENDPOINTS
## ================================================

### GET /timetable/my-schedule
Get timetable for current user (student or teacher)
Query Params:
  - week: string (ISO week, e.g., "2024-W15") - optional
  - semester: int - optional

Response (200):
{
  "success": true,
  "data": {
    "schedule": {
      "monday": [
        {
          "id": "uuid",
          "startTime": "09:00",
          "endTime": "10:00",
          "subject": {
            "code": "CS501",
            "name": "Advanced Algorithms"
          },
          "teacher": {
            "name": "Dr. Jane Smith",
            "avatar": "https://..."
          },
          "classroom": {
            "roomNumber": "LH-301",
            "building": "Main Block",
            "capacity": 60
          },
          "type": "lecture",
          "status": "scheduled"
        }
      ],
      "tuesday": [ /* ... */ ],
      "wednesday": [ /* ... */ ],
      "thursday": [ /* ... */ ],
      "friday": [ /* ... */ ],
      "saturday": [ /* ... */ ]
    },
    "metadata": {
      "academicYear": "2024-25",
      "semester": 5,
      "division": "A"
    }
  }
}

### GET /timetable/division/:divisionId
Get complete timetable for a division
Query Params:
  - academicYear: string (default: current)
  - semester: int (default: current)

Response (200):
{
  "success": true,
  "data": { /* similar structure to my-schedule */ }
}

### POST /timetable/slots (Admin only)
Create new timetable slot
Request:
{
  "divisionId": "uuid",
  "subjectId": "uuid",
  "teacherId": "uuid",
  "classroomId": "uuid",
  "dayOfWeek": "monday",
  "startTime": "09:00",
  "endTime": "10:00",
  "lectureType": "lecture",
  "academicYear": "2024-25",
  "semester": 5
}

Response (201):
{
  "success": true,
  "data": { /* created slot object */ },
  "conflicts": [] // or array of conflicts if any
}

### PUT /timetable/slots/:id (Admin only)
Update timetable slot

### DELETE /timetable/slots/:id (Admin only)
Delete timetable slot

### POST /timetable/detect-conflicts
Check for scheduling conflicts
Request:
{
  "divisionId": "uuid",
  "teacherId": "uuid",
  "classroomId": "uuid",
  "dayOfWeek": "monday",
  "startTime": "09:00",
  "endTime": "10:00",
  "excludeSlotId": "uuid" // optional, for updates
}

Response (200):
{
  "success": true,
  "data": {
    "hasConflicts": true,
    "conflicts": [
      {
        "type": "teacher_conflict",
        "message": "Teacher already has a lecture at this time",
        "existingSlot": { /* slot details */ }
      },
      {
        "type": "classroom_conflict",
        "message": "Classroom is already booked",
        "existingSlot": { /* slot details */ }
      }
    ]
  }
}

### POST /timetable/bulk-update (Admin only)
Update multiple slots at once (drag-and-drop support)
Request:
{
  "slots": [
    {
      "id": "uuid",
      "dayOfWeek": "tuesday",
      "startTime": "10:00",
      "endTime": "11:00",
      "classroomId": "uuid"
    }
  ]
}

Response (200):
{
  "success": true,
  "data": {
    "updated": 5,
    "failed": 1,
    "errors": [ /* conflict details */ ]
  }
}

### GET /timetable/export
Export timetable as PDF
Query Params:
  - divisionId: uuid (for admin)
  - format: pdf|excel|ical
  - week: string (optional)

Response (200):
{
  "success": true,
  "data": {
    "downloadUrl": "https://...",
    "expiresAt": "2024-04-14T10:00:00Z"
  }
}

## ================================================
## CLASSROOM MANAGEMENT
## ================================================

### GET /classrooms
Get all classrooms with filters
Query Params:
  - type: lecture_hall|laboratory|tutorial_room|seminar_hall|auditorium
  - capacity: int (minimum capacity)
  - available: boolean
  - hasProjector: boolean
  - hasAC: boolean

Response (200):
{
  "success": true,
  "data": {
    "classrooms": [
      {
        "id": "uuid",
        "roomNumber": "LH-301",
        "building": "Main Block",
        "floor": 3,
        "capacity": 60,
        "type": "lecture_hall",
        "hasProjector": true,
        "hasWhiteboard": true,
        "hasAC": true,
        "isAvailable": true
      }
    ]
  }
}

### GET /classrooms/:id/availability
Check classroom availability
Query Params:
  - date: string (YYYY-MM-DD)
  - startTime: string (HH:MM)
  - endTime: string (HH:MM)

Response (200):
{
  "success": true,
  "data": {
    "isAvailable": false,
    "bookedSlots": [
      {
        "startTime": "09:00",
        "endTime": "10:00",
        "purpose": "CS501 Lecture",
        "bookedBy": "Dr. Jane Smith"
      }
    ],
    "availableSlots": [
      { "startTime": "08:00", "endTime": "09:00" },
      { "startTime": "10:00", "endTime": "12:00" }
    ]
  }
}

### POST /classrooms (Admin only)
Create new classroom

### PUT /classrooms/:id (Admin only)
Update classroom details

### DELETE /classrooms/:id (Admin only)
Delete classroom

## ================================================
## CLASSROOM BOOKING
## ================================================

### GET /bookings
Get bookings (filtered by role)
Query Params:
  - status: pending|approved|rejected|cancelled
  - date: string (YYYY-MM-DD)
  - classroomId: uuid

Response (200):
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "uuid",
        "classroom": {
          "roomNumber": "LH-301",
          "building": "Main Block"
        },
        "teacher": {
          "name": "Dr. Jane Smith",
          "employeeId": "EMP2024001"
        },
        "bookingDate": "2024-04-20",
        "startTime": "14:00",
        "endTime": "16:00",
        "purpose": "Extra class for Algorithm Analysis",
        "expectedAttendees": 45,
        "status": "pending",
        "createdAt": "2024-04-13T10:00:00Z"
      }
    ]
  }
}

### POST /bookings (Teacher role)
Request classroom booking
Request:
{
  "classroomId": "uuid",
  "bookingDate": "2024-04-20",
  "startTime": "14:00",
  "endTime": "16:00",
  "purpose": "Extra class for Algorithm Analysis",
  "expectedAttendees": 45
}

Response (201):
{
  "success": true,
  "data": { /* created booking object */ },
  "message": "Booking request submitted for approval"
}

### PUT /bookings/:id (Teacher - own bookings only)
Update booking request (only if status is pending)

### PUT /bookings/:id/approve (Admin only)
Approve booking request
Request:
{
  "notes": "Approved for special session"
}

Response (200):
{
  "success": true,
  "data": { /* updated booking */ },
  "message": "Booking approved successfully"
}

### PUT /bookings/:id/reject (Admin only)
Reject booking request
Request:
{
  "reason": "Classroom needed for department meeting"
}

Response (200):
{
  "success": true,
  "data": { /* updated booking */ },
  "message": "Booking rejected"
}

### DELETE /bookings/:id (Teacher - own bookings, Admin - any)
Cancel booking

## ================================================
## SUBJECTS & ASSIGNMENTS
## ================================================

### GET /subjects
Get all subjects with filters
Query Params:
  - courseId: uuid
  - semester: int
  - teacherId: uuid

Response (200):
{
  "success": true,
  "data": {
    "subjects": [
      {
        "id": "uuid",
        "code": "CS501",
        "name": "Advanced Algorithms",
        "credits": 4,
        "lectureHours": 3,
        "practicalHours": 2,
        "course": {
          "name": "Computer Science",
          "semester": 5
        },
        "teachers": [
          {
            "id": "uuid",
            "name": "Dr. Jane Smith",
            "division": "A"
          }
        ]
      }
    ]
  }
}

### POST /subjects (Admin only)
Create new subject

### GET /subjects/:id/assignments
Get teacher assignments for a subject

### POST /subjects/:id/assign (Admin only)
Assign teacher to subject for a division

## ================================================
## NOTIFICATIONS
## ================================================

### GET /notifications
Get user notifications
Query Params:
  - status: unread|read|archived
  - type: timetable_change|booking_approved|booking_rejected|conflict_detected
  - limit: int (default: 20)

Response (200):
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "timetable_change",
        "title": "Timetable Updated",
        "message": "Your Monday 9 AM lecture has been moved to Room LH-401",
        "status": "unread",
        "metadata": {
          "slotId": "uuid",
          "oldClassroom": "LH-301",
          "newClassroom": "LH-401"
        },
        "createdAt": "2024-04-13T09:00:00Z"
      }
    ],
    "unreadCount": 5
  }
}

### PUT /notifications/:id/read
Mark notification as read

### PUT /notifications/mark-all-read
Mark all notifications as read

### DELETE /notifications/:id
Delete notification

## ================================================
## ANALYTICS & REPORTS (Admin only)
## ================================================

### GET /analytics/dashboard
Get admin dashboard statistics
Response (200):
{
  "success": true,
  "data": {
    "totalStudents": 1250,
    "totalTeachers": 85,
    "totalClassrooms": 42,
    "utilizationRate": 78.5,
    "pendingBookings": 12,
    "upcomingConflicts": 3,
    "weeklyStats": {
      "lecturesScheduled": 340,
      "practicals": 85,
      "tutorials": 45
    }
  }
}

### GET /analytics/classroom-utilization
Classroom usage statistics
Query Params:
  - startDate: string
  - endDate: string
  - classroomId: uuid (optional)

### GET /analytics/teacher-workload
Teacher workload distribution

### GET /reports/timetable-summary
Generate timetable summary report

## ================================================
## ERROR RESPONSES
## ================================================

All error responses follow this format:

{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // optional, validation errors etc.
  }
}

Common Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (e.g., scheduling conflicts)
- 422: Unprocessable Entity (business logic error)
- 429: Too Many Requests (rate limit)
- 500: Internal Server Error

## ================================================
## RATE LIMITING
## ================================================

API Rate Limits (per IP/user):
- Anonymous: 20 requests/minute
- Authenticated: 100 requests/minute
- Admin: 200 requests/minute

Rate limit headers in response:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1681392000

## ================================================
## WEBSOCKET ENDPOINTS (Real-time updates)
## ================================================

WS_URL: wss://api.college-erp.edu/v1/ws

### Connection
Connect with JWT token:
ws://api.college-erp.edu/v1/ws?token=<jwt_token>

### Subscribe to channels:
{
  "action": "subscribe",
  "channel": "timetable:division:uuid"
}

{
  "action": "subscribe",
  "channel": "notifications:user:uuid"
}

### Real-time events:
- timetable.updated
- booking.approved
- booking.rejected
- notification.new
- conflict.detected

Event format:
{
  "event": "timetable.updated",
  "data": { /* event payload */ },
  "timestamp": "2024-04-13T10:00:00Z"
}
