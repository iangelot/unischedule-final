/**
 * OpenAPI/Swagger Schema Definitions
 * Generated for UniSchedule API
 */

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'UniSchedule Africa API',
    description: 'Timetable scheduling system for African universities',
    version: '1.0.0',
    contact: {
      name: 'UniSchedule Support',
      email: 'support@unischedule.africa',
    },
    license: {
      name: 'MIT',
    },
  },

  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://api.unischedule.africa',
      description: 'Production server',
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },

    schemas: {
      // ─── USER & AUTH ───────────────────────────────────────────────────
      User: {
        type: 'object',
        required: ['id', 'email', 'firstName', 'lastName', 'role'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: {
            type: 'string',
            enum: ['superadmin', 'admin', 'timetabler', 'viewer', 'lecturer'],
          },
          institutionId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      AuthRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },

      AuthResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
        },
      },

      // ─── COURSES ──────────────────────────────────────────────────────
      Course: {
        type: 'object',
        required: ['id', 'code', 'title', 'semester'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', description: 'Unique course code' },
          title: { type: 'string' },
          semester: { type: 'integer', enum: [1, 2] },
          credits: { type: 'number' },
          institutionId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ─── SESSIONS ─────────────────────────────────────────────────────
      Session: {
        type: 'object',
        required: [
          'id',
          'courseId',
          'lecturerId',
          'roomId',
          'groupId',
          'dayOfWeek',
          'slotIndex',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          courseId: { type: 'string', format: 'uuid' },
          lecturerId: { type: 'string', format: 'uuid' },
          roomId: { type: 'string', format: 'uuid' },
          groupId: { type: 'string', format: 'uuid' },
          dayOfWeek: { type: 'integer', minimum: 0, maximum: 5 },
          slotIndex: { type: 'integer', minimum: 0 },
          mode: { type: 'string', enum: ['day', 'evening', 'weekend'] },
          timetableId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ─── TIMETABLES ───────────────────────────────────────────────────
      Timetable: {
        type: 'object',
        required: ['id', 'academicYear', 'semester', 'status'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          academicYear: { type: 'string', pattern: '^\\d{4}/\\d{4}$' },
          semester: { type: 'integer', enum: [1, 2] },
          status: { type: 'string', enum: ['draft', 'generating', 'published', 'archived'] },
          institutionId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },

      // ─── GROUPS ───────────────────────────────────────────────────────
      Group: {
        type: 'object',
        required: ['id', 'name', 'programmeId', 'academicYear', 'semester'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          programmeId: { type: 'string', format: 'uuid' },
          academicYear: { type: 'string', pattern: '^\\d{4}/\\d{4}$' },
          semester: { type: 'integer', enum: [1, 2] },
          enrollmentCount: { type: 'integer', minimum: 0 },
          institutionId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ─── LECTURERS ────────────────────────────────────────────────────
      Lecturer: {
        type: 'object',
        required: ['id', 'firstName', 'lastName', 'email', 'employmentType'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          employmentType: { type: 'string', enum: ['permanent', 'vacataire', 'visiting', 'part_time'] },
          maxHoursPerWeek: { type: 'integer', minimum: 1 },
          institutionId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ─── ROOMS ────────────────────────────────────────────────────────
      Room: {
        type: 'object',
        required: ['id', 'buildingId', 'code', 'capacity', 'roomType'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          buildingId: { type: 'string', format: 'uuid' },
          code: { type: 'string', description: 'Room identifier (e.g., A101)' },
          capacity: { type: 'integer', minimum: 1 },
          roomType: {
            type: 'string',
            enum: ['lecture', 'lab', 'seminar', 'studio', 'auditorium'],
          },
          hasProjector: { type: 'boolean' },
          hasWifi: { type: 'boolean' },
          hasAc: { type: 'boolean' },
          institutionId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ─── EXAMS ────────────────────────────────────────────────────────
      Exam: {
        type: 'object',
        required: ['id', 'courseId', 'examinationDate', 'startTime', 'endTime', 'roomId'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          courseId: { type: 'string', format: 'uuid' },
          examinationDate: { type: 'string', format: 'date' },
          startTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          endTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          roomId: { type: 'string', format: 'uuid' },
          timetableId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ─── NOTIFICATIONS ────────────────────────────────────────────────
      Notification: {
        type: 'object',
        required: ['id', 'userId', 'title', 'message', 'channel', 'status'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          message: { type: 'string' },
          channel: { type: 'string', enum: ['sms', 'whatsapp', 'email', 'in_app'] },
          status: { type: 'string', enum: ['pending', 'sent', 'delivered', 'failed'] },
          createdAt: { type: 'string', format: 'date-time' },
          sentAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },

      // ─── CONFLICTS ────────────────────────────────────────────────────
      Conflict: {
        type: 'object',
        required: ['id', 'type', 'severity', 'sessionIds', 'description'],
        properties: {
          id: { type: 'string' },
          type: {
            type: 'string',
            enum: ['LECTURER_DOUBLE_BOOKED', 'ROOM_DOUBLE_BOOKED', 'GROUP_CONFLICT'],
          },
          severity: { type: 'string', enum: ['hard', 'soft'] },
          sessionIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
          description: { type: 'string' },
          isResolved: { type: 'boolean' },
        },
      },

      // ─── ERRORS ───────────────────────────────────────────────────────
      Error: {
        type: 'object',
        required: ['message', 'code'],
        properties: {
          message: { type: 'string' },
          code: { type: 'string' },
          statusCode: { type: 'integer' },
          details: { type: 'object' },
        },
      },
    },
  },

  paths: {
    // ─── AUTHENTICATION ───────────────────────────────────────────────
    '/api/auth/register': {
      post: {
        summary: 'Register new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          409: {
            description: 'Email already registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/api/auth/login': {
      post: {
        summary: 'Login user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          429: {
            description: 'Too many login attempts',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/api/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Token refreshed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          401: {
            description: 'Invalid refresh token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    // ─── COURSES ──────────────────────────────────────────────────────
    '/api/courses': {
      get: {
        summary: 'List courses',
        tags: ['Courses'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'semester',
            in: 'query',
            schema: { type: 'integer', enum: [1, 2] },
          },
        ],
        responses: {
          200: {
            description: 'List of courses',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Course' },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create course',
        tags: ['Courses'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code', 'title', 'semester'],
                properties: {
                  code: { type: 'string' },
                  title: { type: 'string' },
                  semester: { type: 'integer', enum: [1, 2] },
                  credits: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Course created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Course' },
              },
            },
          },
          400: { description: 'Invalid input' },
          403: { description: 'Insufficient permissions' },
          409: { description: 'Course code already exists' },
        },
      },
    },

    // ─── SESSIONS ─────────────────────────────────────────────────────
    '/api/sessions': {
      get: {
        summary: 'List sessions',
        tags: ['Sessions'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'timetableId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'List of sessions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Session' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create session',
        tags: ['Sessions'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['courseId', 'lecturerId', 'roomId', 'groupId'],
                properties: {
                  courseId: { type: 'string', format: 'uuid' },
                  lecturerId: { type: 'string', format: 'uuid' },
                  roomId: { type: 'string', format: 'uuid' },
                  groupId: { type: 'string', format: 'uuid' },
                  dayOfWeek: { type: 'integer', minimum: 0, maximum: 5 },
                  slotIndex: { type: 'integer', minimum: 0 },
                  mode: { type: 'string', enum: ['day', 'evening', 'weekend'] },
                  timetableId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Session created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Session' },
                    conflicts: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Conflict' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ─── TIMETABLES ───────────────────────────────────────────────────
    '/api/timetables': {
      get: {
        summary: 'List timetables',
        tags: ['Timetables'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['draft', 'generating', 'published', 'archived'] },
          },
        ],
        responses: {
          200: {
            description: 'List of timetables',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Timetable' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create timetable',
        tags: ['Timetables'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['academicYear', 'semester'],
                properties: {
                  academicYear: { type: 'string', pattern: '^\\d{4}/\\d{4}$' },
                  semester: { type: 'integer', enum: [1, 2] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Timetable created' },
          400: { description: 'Invalid input' },
          403: { description: 'Insufficient permissions' },
          409: { description: 'Timetable already exists for this year/semester' },
        },
      },
    },

    '/api/timetables/{id}': {
      get: {
        summary: 'Get timetable details',
        tags: ['Timetables'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Timetable details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Timetable' },
              },
            },
          },
          404: { description: 'Timetable not found' },
        },
      },
    },

    // ─── GROUPS ───────────────────────────────────────────────────────
    '/api/groups': {
      get: {
        summary: 'List student groups',
        tags: ['Groups'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of groups',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Group' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create student group',
        tags: ['Groups'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'programmeId', 'academicYear', 'semester'],
                properties: {
                  name: { type: 'string' },
                  programmeId: { type: 'string', format: 'uuid' },
                  academicYear: { type: 'string', pattern: '^\\d{4}/\\d{4}$' },
                  semester: { type: 'integer', enum: [1, 2] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Group created' },
          400: { description: 'Invalid input' },
          403: { description: 'Insufficient permissions' },
        },
      },
    },

    // ─── LECTURERS ────────────────────────────────────────────────────
    '/api/lecturers': {
      get: {
        summary: 'List lecturers',
        tags: ['Lecturers'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of lecturers',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Lecturer' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create lecturer',
        tags: ['Lecturers'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'employmentType'],
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  employmentType: {
                    type: 'string',
                    enum: ['permanent', 'vacataire', 'visiting', 'part_time'],
                  },
                  maxHoursPerWeek: { type: 'integer', minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Lecturer created' },
          400: { description: 'Invalid input' },
          403: { description: 'Insufficient permissions' },
        },
      },
    },

    // ─── ROOMS ────────────────────────────────────────────────────────
    '/api/rooms': {
      get: {
        summary: 'List rooms',
        tags: ['Rooms'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of rooms',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Room' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create room',
        tags: ['Rooms'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['buildingId', 'code', 'capacity', 'roomType'],
                properties: {
                  buildingId: { type: 'string', format: 'uuid' },
                  code: { type: 'string' },
                  capacity: { type: 'integer', minimum: 1 },
                  roomType: {
                    type: 'string',
                    enum: ['lecture', 'lab', 'seminar', 'studio', 'auditorium'],
                  },
                  hasProjector: { type: 'boolean' },
                  hasWifi: { type: 'boolean' },
                  hasAc: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Room created' },
          400: { description: 'Invalid input' },
          403: { description: 'Insufficient permissions' },
        },
      },
    },

    // ─── EXAMS ────────────────────────────────────────────────────────
    '/api/exams': {
      get: {
        summary: 'List exams',
        tags: ['Exams'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'timetableId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'List of exams',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Exam' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create exam',
        tags: ['Exams'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['courseId', 'examinationDate', 'startTime', 'endTime', 'roomId'],
                properties: {
                  courseId: { type: 'string', format: 'uuid' },
                  examinationDate: { type: 'string', format: 'date' },
                  startTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
                  endTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
                  roomId: { type: 'string', format: 'uuid' },
                  timetableId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Exam created' },
          400: { description: 'Invalid input' },
          403: { description: 'Insufficient permissions' },
        },
      },
    },

    // ─── NOTIFICATIONS ────────────────────────────────────────────────
    '/api/notifications': {
      get: {
        summary: 'List notifications',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of notifications',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Notification' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create notification',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'title', 'message', 'channel'],
                properties: {
                  userId: { type: 'string', format: 'uuid' },
                  title: { type: 'string' },
                  message: { type: 'string' },
                  channel: { type: 'string', enum: ['sms', 'whatsapp', 'email', 'in_app'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Notification created' },
          400: { description: 'Invalid input' },
          403: { description: 'Insufficient permissions' },
        },
      },
    },

    // ─── HEALTH ───────────────────────────────────────────────────────
    '/api/health': {
      get: {
        summary: 'Health check',
        tags: ['System'],
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                    database: { type: 'string' },
                  },
                },
              },
            },
          },
          503: {
            description: 'Service unavailable',
          },
        },
      },
      head: {
        summary: 'Health check (lightweight)',
        tags: ['System'],
        responses: {
          200: { description: 'Service is healthy' },
          503: { description: 'Service unavailable' },
        },
      },
    },
  },

  security: [{ bearerAuth: [] }],

  tags: [
    { name: 'Authentication', description: 'User authentication endpoints' },
    { name: 'Courses', description: 'Course management' },
    { name: 'Sessions', description: 'Timetable sessions' },
    { name: 'Timetables', description: 'Timetable management' },
    { name: 'Groups', description: 'Student group management' },
    { name: 'Lecturers', description: 'Lecturer management' },
    { name: 'Rooms', description: 'Room/facility management' },
    { name: 'Exams', description: 'Exam scheduling' },
    { name: 'Notifications', description: 'Notification system' },
    { name: 'System', description: 'System utilities' },
  ],
};
