import { POST, GET } from '@/app/api/groups/route';
import { NextRequest } from 'next/server';

/**
 * Integration tests for Groups API endpoint
 * Tests student group management and enrollment
 */
jest.mock('@/lib/db');
jest.mock('@/lib/logger');
jest.mock('@/middleware/withAuth');

import { query } from '@/lib/db';
import { withAuth } from '@/middleware/withAuth';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;

describe('/api/groups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/groups', () => {
    it('should return list of groups for institution', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/groups'),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'group-1',
            name: 'CS 100 (Morning)',
            programme_id: 'prog-1',
            academic_year: '2024/2025',
            semester: 1,
            enrollment_count: 45,
            institution_id: 'inst-123',
          },
        ],
        rowCount: 1,
      } as any);

      const response = await GET(mockReq);
      expect(response.status).toBe(200);
    });

    it('should filter by programme', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/groups?programmeId=prog-1'),
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
        expect.stringContaining('WHERE programme_id = $'),
        expect.arrayContaining(['prog-1'])
      );
    });

    it('should filter by academic year', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/groups?academicYear=2024/2025'),
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
        expect.stringContaining('WHERE academic_year = $'),
        expect.arrayContaining(['2024/2025'])
      );
    });

    it('should enforce institution isolation', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/groups'),
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

  describe('POST /api/groups', () => {
    const validGroupData = {
      name: 'CS 101 (Afternoon)',
      programmeId: 'prog-1',
      academicYear: '2024/2025',
      semester: 1,
    };

    it('should create a group with valid data', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validGroupData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'group-1', ...validGroupData, institution_id: 'inst-123' }],
        rowCount: 1,
      } as any);

      const response = await POST(mockReq);
      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          name: 'CS 101 (Afternoon)',
          // Missing programmeId, academicYear, semester
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
          ...validGroupData,
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
        json: async () => validGroupData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'viewer',
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(403);
    });

    it('should enforce programme exists', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validGroupData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockRejectedValueOnce({
        code: '23503', // Foreign key constraint
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(409);
    });

    it('should prevent duplicate group names per programme/year/semester', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validGroupData,
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

    it('should trim whitespace from group name', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          ...validGroupData,
          name: '  CS 101 (Afternoon)  ',
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
            id: 'group-1',
            name: 'CS 101 (Afternoon)',
            ...validGroupData,
          },
        ],
        rowCount: 1,
      } as any);

      await POST(mockReq);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.stringMatching(/^CS 101/)])
      );
    });
  });
});
