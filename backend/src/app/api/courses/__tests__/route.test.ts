import { POST, GET } from '@/app/api/courses/route';
import { NextRequest } from 'next/server';

/**
 * Integration tests for Courses API endpoint
 * Tests authentication, authorization, and business logic
 */
jest.mock('@/lib/db');
jest.mock('@/lib/logger');
jest.mock('@/middleware/withAuth');

import { query } from '@/lib/db';
import { withAuth } from '@/middleware/withAuth';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;

describe('/api/courses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/courses', () => {
    it('should return list of courses for authenticated user', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'course-1',
            code: 'CS101',
            title: 'Introduction to CS',
            semester: 1,
            institution_id: 'inst-123',
          },
        ],
        rowCount: 1,
      } as any);

      const response = await GET(mockReq);
      expect(response.status).toBe(200);
    });

    it('should reject unauthenticated requests', async () => {
      const mockReq = {
        headers: new Headers({}),
      } as unknown as NextRequest;

      mockWithAuth.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(GET(mockReq)).rejects.toThrow('Unauthorized');
    });

    it('should filter courses by institution_id', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
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
        expect.stringContaining('WHERE institution_id = $1'),
        ['inst-123']
      );
    });
  });

  describe('POST /api/courses', () => {
    it('should create a course with valid data', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          code: 'CS102',
          title: 'Data Structures',
          semester: 1,
        }),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'course-2',
            code: 'CS102',
            title: 'Data Structures',
            semester: 1,
            institution_id: 'inst-123',
          },
        ],
        rowCount: 1,
      } as any);

      const response = await POST(mockReq);
      expect(response.status).toBe(201);
    });

    it('should reject non-admin users from creating courses', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          code: 'CS102',
          title: 'Data Structures',
          semester: 1,
        }),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'viewer', // Low privilege
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          code: 'CS102',
          // Missing title and semester
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

    it('should enforce unique course code per institution', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          code: 'CS101',
          title: 'Duplicate Course',
          semester: 1,
        }),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockRejectedValueOnce({
        code: '23505', // PostgreSQL unique constraint violation
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(409);
    });
  });
});
