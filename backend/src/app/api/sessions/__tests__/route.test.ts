import { POST, GET } from '@/app/api/sessions/route';
import { NextRequest } from 'next/server';

/**
 * Integration tests for Sessions API endpoint
 * Tests session creation, retrieval, and conflict validation
 */
jest.mock('@/lib/db');
jest.mock('@/lib/logger');
jest.mock('@/middleware/withAuth');
jest.mock('@/lib/conflicts');

import { query } from '@/lib/db';
import { withAuth } from '@/middleware/withAuth';
import { detectTimetableConflicts } from '@/lib/conflicts';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
const mockDetectConflicts = detectTimetableConflicts as jest.MockedFunction<
  typeof detectTimetableConflicts
>;

describe('/api/sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/sessions', () => {
    it('should return list of sessions for timetable', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/sessions?timetableId=tt-1'),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'timetabler',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'session-1',
            course_id: 'course-1',
            lecturer_id: 'lecturer-1',
            room_id: 'room-1',
            group_id: 'group-1',
            day_of_week: 1,
            slot_index: 0,
            mode: 'day',
            timetable_id: 'tt-1',
          },
        ],
        rowCount: 1,
      } as any);

      const response = await GET(mockReq);
      expect(response.status).toBe(200);
    });

    it('should filter sessions by timetable ID', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/sessions?timetableId=tt-1'),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'timetabler',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      await GET(mockReq);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE s.timetable_id = $1'),
        expect.arrayContaining(['tt-1'])
      );
    });

    it('should return 400 if timetableId is missing', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/sessions'),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'timetabler',
      });

      const response = await GET(mockReq);
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/sessions', () => {
    const validSessionData = {
      courseId: 'course-1',
      lecturerId: 'lecturer-1',
      roomId: 'room-1',
      groupId: 'group-1',
      dayOfWeek: 1,
      slotIndex: 0,
      mode: 'day',
      timetableId: 'tt-1',
    };

    it('should create a session with valid data', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validSessionData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'timetabler',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'session-1', ...validSessionData }],
        rowCount: 1,
      } as any);

      mockDetectConflicts.mockResolvedValueOnce([]);

      const response = await POST(mockReq);
      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          courseId: 'course-1',
          // Missing other required fields
        }),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'timetabler',
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(400);
    });

    it('should validate dayOfWeek is 0-5', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          ...validSessionData,
          dayOfWeek: 7, // Invalid
        }),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'timetabler',
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(400);
    });

    it('should validate mode is valid', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          ...validSessionData,
          mode: 'invalid',
        }),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'timetabler',
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(400);
    });

    it('should reject non-timetabler users', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validSessionData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'viewer',
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(403);
    });

    it('should warn about conflicts but still create session', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validSessionData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'timetabler',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'session-1', ...validSessionData }],
        rowCount: 1,
      } as any);

      mockDetectConflicts.mockResolvedValueOnce([
        {
          id: 'conflict-1',
          type: 'LECTURER_DOUBLE_BOOKED',
          severity: 'hard',
          sessionIds: ['session-1', 'session-2'],
          description: 'Dr. Tamo is double-booked',
        },
      ]);

      const response = await POST(mockReq);
      expect(response.status).toBe(201); // Still created
      const body = await response.json();
      expect(body.conflicts).toHaveLength(1);
    });

    it('should enforce timetable exists', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validSessionData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'timetabler',
      });

      mockQuery.mockRejectedValueOnce({
        code: '23503', // Foreign key constraint
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(409);
    });
  });
});
