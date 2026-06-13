import { POST, GET } from '@/app/api/exams/route';
import { NextRequest } from 'next/server';

/**
 * Integration tests for Exams API endpoint
 * Tests exam scheduling and conflict detection
 */
jest.mock('@/lib/db');
jest.mock('@/lib/logger');
jest.mock('@/middleware/withAuth');

import { query } from '@/lib/db';
import { withAuth } from '@/middleware/withAuth';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;

describe('/api/exams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/exams', () => {
    it('should return list of exams for timetable', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/exams?timetableId=tt-1'),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'exam-1',
            course_id: 'course-1',
            examination_date: '2025-01-15',
            start_time: '09:00',
            end_time: '11:00',
            room_id: 'room-1',
            timetable_id: 'tt-1',
          },
        ],
        rowCount: 1,
      } as any);

      const response = await GET(mockReq);
      expect(response.status).toBe(200);
    });

    it('should filter by examination date', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/exams?date=2025-01-15'),
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
        expect.stringContaining('WHERE examination_date = $'),
        expect.arrayContaining(['2025-01-15'])
      );
    });

    it('should return 400 if timetableId is missing', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        nextUrl: new URL('http://localhost:3000/api/exams'),
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      const response = await GET(mockReq);
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/exams', () => {
    const validExamData = {
      courseId: 'course-1',
      examinationDate: '2025-01-15',
      startTime: '09:00',
      endTime: '11:00',
      roomId: 'room-1',
      timetableId: 'tt-1',
    };

    it('should create an exam with valid data', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validExamData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'exam-1', ...validExamData }],
        rowCount: 1,
      } as any);

      const response = await POST(mockReq);
      expect(response.status).toBe(201);
    });

    it('should validate date is in future', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          ...validExamData,
          examinationDate: '2020-01-15', // Past date
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

    it('should validate time format', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          ...validExamData,
          startTime: '25:00', // Invalid hour
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

    it('should ensure end time is after start time', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => ({
          ...validExamData,
          startTime: '11:00',
          endTime: '09:00', // Before start
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
        json: async () => validExamData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'viewer',
      });

      const response = await POST(mockReq);
      expect(response.status).toBe(403);
    });

    it('should prevent room double-booking for exams', async () => {
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer token' }),
        json: async () => validExamData,
      } as unknown as NextRequest;

      mockWithAuth.mockResolvedValueOnce({
        userId: 'user-123',
        institutionId: 'inst-123',
        role: 'admin',
      });

      // Check for existing exams in room during time slot
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'exam-existing',
              start_time: '09:30',
              end_time: '10:30',
            },
          ],
          rowCount: 1,
        } as any);

      const response = await POST(mockReq);
      expect(response.status).toBe(409);
    });
  });
});
