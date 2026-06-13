import { POST, GET } from '@/app/api/rooms/route';
import { NextRequest } from 'next/server';

/**
 * Integration tests for Rooms API endpoint
 * Tests room inventory management and capacity tracking
 */
jest.mock('@/lib/db');
jest.mock('@/lib/logger');
jest.mock('@/middleware/withAuth');

import { query } from '@/lib/db';
import { withAuth } from '@/middleware/withAuth';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;

describe('/api/rooms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/rooms', () => {
    it('should return list of rooms for institution', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/rooms'),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'room-1',
            building_id: 'bldg-1',
            code: 'A101',
            capacity: 50,
            room_type: 'lecture',
            has_projector: true,
            has_wifi: true,
            has_ac: true,
            institution_id: 'inst-123',
          },
        ],
        rowCount: 1,
      } as any);

      const response = await GET(mockReq);
      expect(response.status).toBe(200);
    });

    it('should filter by building', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/rooms?buildingId=bldg-1'),
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
        expect.stringContaining('WHERE building_id = $'),
        expect.arrayContaining(['bldg-1'])
      );
    });

    it('should filter by room type', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/rooms?type=lab'),
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
        expect.stringContaining('WHERE room_type = $'),
        expect.arrayContaining(['lab'])
      );
    });

    it('should filter by minimum capacity', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/rooms?minCapacity=100'),
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
        expect.stringContaining('WHERE capacity >= $')
      );
    });
  });

  describe('POST /api/rooms', () => {
    const validRoomData = {
      buildingId: 'bldg-1',
      code: 'B205',
      capacity: 60,
      roomType: 'lecture',
      hasProjector: true,
      hasWifi: true,
      hasAc: false,
    };

    it('should create a room with valid data', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validRoomData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'room-2', ...validRoomData, institution_id: 'inst-123' }],
        rowCount: 1,
      } as any);

      const response = await POST(mockReq);
      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          buildingId: 'bldg-1',
          code: 'B205',
          // Missing capacity and roomType
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

    it('should validate room code format', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          ...validRoomData,
          code: '', // Empty code
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

    it('should validate capacity is positive', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          ...validRoomData,
          capacity: 0,
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

    it('should validate room type is valid', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          ...validRoomData,
          roomType: 'invalid', // Valid: lecture|lab|seminar|studio|auditorium
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
        json: async () => validRoomData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'viewer',
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(403);
    });

    it('should prevent duplicate room codes per building', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validRoomData,
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

    it('should enforce building exists', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validRoomData,
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
  });
});
