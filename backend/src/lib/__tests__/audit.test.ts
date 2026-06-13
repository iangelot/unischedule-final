import {
  logAudit,
  getUserAuditLogs,
  getResourceAuditLogs,
  cleanupOldAuditLogs,
  exportAuditLogs,
  AuditLogEntry,
} from '@/lib/audit';

jest.mock('@/lib/db');
jest.mock('@/lib/logger');

import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Audit Logging', () => {
  const sampleEntry: AuditLogEntry = {
    userId: 'user-123',
    institutionId: 'inst-123',
    action: 'UPDATE',
    resourceType: 'courses',
    resourceId: 'course-1',
    beforeState: { title: 'Old Title' },
    afterState: { title: 'New Title' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    metadata: { source: 'web' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logAudit', () => {
    it('should log an audit entry to database', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);

      await logAudit(sampleEntry);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_log'),
        expect.arrayContaining([
          'user-123',
          'inst-123',
          'UPDATE',
          'courses',
          'course-1',
        ])
      );
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      // Should not throw
      await expect(logAudit(sampleEntry)).resolves.toBeUndefined();
    });

    it('should serialize before/after state as JSON', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);

      await logAudit(sampleEntry);

      const callArgs = mockQuery.mock.calls[0][1];
      // beforeState should be JSON stringified
      expect(typeof callArgs[5]).toBe('string');
      expect(JSON.parse(callArgs[5])).toEqual(sampleEntry.beforeState);
    });

    it('should handle missing optional fields', async () => {
      const minimalEntry: AuditLogEntry = {
        userId: 'user-123',
        institutionId: 'inst-123',
        action: 'DELETE',
        resourceType: 'courses',
        resourceId: 'course-1',
        beforeState: {},
        afterState: {},
      };

      mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);

      await logAudit(minimalEntry);

      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('getUserAuditLogs', () => {
    it('should retrieve audit logs for a user', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'log-1',
            action: 'CREATE',
            resource_type: 'courses',
            created_at: new Date(),
          },
        ],
        rowCount: 1,
      } as any);

      const logs = await getUserAuditLogs('user-123', 'inst-123');

      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('CREATE');
    });

    it('should respect limit parameter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await getUserAuditLogs('user-123', 'inst-123', 50);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['user-123', 'inst-123', 50])
      );
    });

    it('should return empty array on error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const logs = await getUserAuditLogs('user-123', 'inst-123');

      expect(logs).toEqual([]);
    });
  });

  describe('getResourceAuditLogs', () => {
    it('should retrieve audit logs for a resource', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            action: 'UPDATE',
            before_state: { title: 'Old' },
            after_state: { title: 'New' },
            created_at: new Date(),
          },
        ],
        rowCount: 1,
      } as any);

      const logs = await getResourceAuditLogs('courses', 'course-1', 'inst-123');

      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('UPDATE');
    });

    it('should filter by resource type and ID', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await getResourceAuditLogs('courses', 'course-1', 'inst-123');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['courses', 'course-1', 'inst-123'])
      );
    });
  });

  describe('cleanupOldAuditLogs', () => {
    it('should delete audit logs older than retention period', async () => {
      mockQuery.mockResolvedValueOnce({
        rowCount: 42,
      } as any);

      const deleted = await cleanupOldAuditLogs(90);

      expect(deleted).toBe(42);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE audit_log')
      );
    });

    it('should use default retention period of 90 days', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 } as any);

      await cleanupOldAuditLogs();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('90 days')
      );
    });

    it('should return 0 on error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const deleted = await cleanupOldAuditLogs(90);

      expect(deleted).toBe(0);
    });
  });

  describe('exportAuditLogs', () => {
    it('should export audit logs as CSV', async () => {
      const fromDate = new Date('2025-01-01');
      const toDate = new Date('2025-01-31');

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            created_at: '2025-01-15T10:00:00Z',
            user_id: 'user-123',
            action: 'CREATE',
            resource_type: 'courses',
            resource_id: 'course-1',
            ip_address: '192.168.1.1',
            before_state: {},
            after_state: { title: 'CS101' },
          },
        ],
        rowCount: 1,
      } as any);

      const csv = await exportAuditLogs('inst-123', fromDate, toDate);

      expect(csv).toContain('Timestamp');
      expect(csv).toContain('user-123');
      expect(csv).toContain('CREATE');
    });

    it('should return message when no logs found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const csv = await exportAuditLogs(
        'inst-123',
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      expect(csv).toContain('No audit logs found');
    });

    it('should use date range filters', async () => {
      const fromDate = new Date('2025-01-01');
      const toDate = new Date('2025-01-31');

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      await exportAuditLogs('inst-123', fromDate, toDate);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['inst-123', fromDate, toDate])
      );
    });

    it('should throw on error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        exportAuditLogs(
          'inst-123',
          new Date('2025-01-01'),
          new Date('2025-01-31')
        )
      ).rejects.toThrow();
    });
  });
});
