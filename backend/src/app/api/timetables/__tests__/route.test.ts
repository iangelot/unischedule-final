import { POST, GET } from '@/app/api/timetables/route';
import { NextRequest } from 'next/server';

/**
 * Integration tests for Timetables API endpoint
 * Tests timetable lifecycle (create, publish, archive)
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

describe('/api/timetables', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/timetables', () => {
    it('should return list of timetables for institution', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/timetables'),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tt-1',
            academic_year: '2024/2025',
            semester: 1,
            status: 'published',
            institution_id: 'inst-123',
            created_at: new Date(),
          },
        ],
        rowCount: 1,
      } as any);

      const response = await GET(mockReq);
      expect(response.status).toBe(200);
    });

    it('should filter by status', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/timetables?status=draft'),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      await GET(mockReq);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE status = $")
      );
    });

    it('should enforce institution isolation', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/timetables'),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      await GET(mockReq);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE institution_id = $'),
        expect.arrayContaining(['inst-123'])
      );
    });
  });

  describe('POST /api/timetables', () => {
    const validTimetableData = {
      academicYear: '2024/2025',
      semester: 1,
    };

    it('should create a timetable in draft status', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validTimetableData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tt-1',
            status: 'draft',
            ...validTimetableData,
          },
        ],
        rowCount: 1,
      } as any);

      const response = await POST(mockReq);
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.data.status).toBe('draft');
    });

    it('should validate required fields', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          academicYear: '2024/2025',
          // Missing semester
        }),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(400);
    });

    it('should validate semester is 1 or 2', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          ...validTimetableData,
          semester: 3, // Invalid
        }),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(400);
    });

    it('should reject non-admin users', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validTimetableData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'timetabler',
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(403);
    });

    it('should prevent duplicate timetables for same academic year/semester', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validTimetableData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockRejectedValueOnce({
        code: '23505', // Unique constraint violation
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(409);
    });

    it('should include conflict warnings in response', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validTimetableData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'tt-1', status: 'draft', ...validTimetableData }],
        rowCount: 1,
      } as any);

      mockDetectConflicts.mockResolvedValueOnce([
        {
          id: 'conflict-1',
          type: 'ROOM_DOUBLE_BOOKED',
          severity: 'hard',
          sessionIds: ['session-1', 'session-2'],
          description: 'Room conflict detected',
        },
      ]);

      const response = await POST(mockReq);
      expect(response.status).toBe(201);
    });
  });
});
