import { POST, GET } from '@/app/api/notifications/route';
import { NextRequest } from 'next/server';

/**
 * Integration tests for Notifications API endpoint
 * Tests notification delivery and status tracking
 */
jest.mock('@/lib/db');
jest.mock('@/lib/logger');
jest.mock('@/middleware/withAuth');

import { query } from '@/lib/db';
import { withAuth } from '@/middleware/withAuth';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;

describe('/api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('should return notifications for authenticated user', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/notifications'),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'notif-1',
            user_id: 'user-123',
            title: 'Timetable Published',
            message: 'Your timetable has been published',
            channel: 'in_app',
            status: 'delivered',
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
        nextUrl: new URL('http://localhost:3000/api/notifications?status=pending'),
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
        expect.stringContaining('WHERE status = $'),
        expect.arrayContaining(['pending'])
      );
    });

    it('should filter by channel', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/notifications?channel=sms'),
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
        expect.stringContaining('WHERE channel = $'),
        expect.arrayContaining(['sms'])
      );
    });

    it('should paginate results', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/notifications?page=2&limit=10'),
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
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([10])
      );
    });
  });

  describe('POST /api/notifications', () => {
    const validNotificationData = {
      userId: 'user-456',
      title: 'Conflict Detected',
      message: 'Your timetable has 2 conflicts',
      channel: 'in_app',
    };

    it('should create an in-app notification', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validNotificationData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'notif-1',
            status: 'delivered',
            ...validNotificationData,
          },
        ],
        rowCount: 1,
      } as any);

      const response = await POST(mockReq);
      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          userId: 'user-456',
          // Missing title, message, channel
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

    it('should validate channel is valid', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          ...validNotificationData,
          channel: 'invalid', // Valid: sms|whatsapp|email|in_app
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

    it('should enforce user exists', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validNotificationData,
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

    it('should allow broadcast notifications to multiple users', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          userIds: ['user-1', 'user-2', 'user-3'],
          title: 'Maintenance Scheduled',
          message: 'System maintenance on Saturday',
          channel: 'email',
        }),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValue({
        rows: [{ id: 'notif-batch' }],
        rowCount: 1,
      } as any);

      const response = await POST(mockReq);
      expect(response.status).toBe(201);
    });

    it('should require admin role for creating notifications', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validNotificationData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'viewer',
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(403);
    });

    it('should set status to pending for new notifications', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validNotificationData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'notif-1',
            status: 'pending',
            ...validNotificationData,
          },
        ],
        rowCount: 1,
      } as any);

      const response = await POST(mockReq);
      const body = await response.json();
      expect(body.data.status).toBe('pending');
    });
  });
});
