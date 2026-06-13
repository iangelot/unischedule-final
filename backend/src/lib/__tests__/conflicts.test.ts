import { detectTimetableConflicts, ConflictResult } from '@/lib/conflicts';

/**
 * Mock database query function for testing
 * In real tests, you'd use a test database
 */
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Conflict Detection', () => {
  const timetableId = 'timetable-123';
  const institutionId = 'institution-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Lecturer Double-Booking Detection', () => {
    it('should detect when a lecturer is assigned to two sessions at the same time', async () => {
      mockQuery
        .mockResolvedValueOnce({
          // Lecturer conflicts
          rows: [
            {
              s1_id: 'session-1',
              s2_id: 'session-2',
              lecturer_name: 'Dr. Tamo',
              day_of_week: 1,
              slot_index: 0,
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          // Room conflicts
          rows: [],
          rowCount: 0,
        } as any)
        .mockResolvedValueOnce({
          // Group conflicts
          rows: [],
          rowCount: 0,
        } as any);

      const conflicts = await detectTimetableConflicts(timetableId, institutionId);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toMatchObject({
        type: 'LECTURER_DOUBLE_BOOKED',
        severity: 'hard',
        sessionIds: ['session-1', 'session-2'],
      });
      expect(conflicts[0].description).toContain('Dr. Tamo');
    });

    it('should return no conflicts when lecturer schedule is clean', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const conflicts = await detectTimetableConflicts(timetableId, institutionId);

      expect(conflicts).toHaveLength(0);
    });

    it('should handle multiple lecturer conflicts', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              s1_id: 'session-1',
              s2_id: 'session-2',
              lecturer_name: 'Dr. Tamo',
              day_of_week: 1,
              slot_index: 0,
            },
            {
              s1_id: 'session-3',
              s2_id: 'session-4',
              lecturer_name: 'Prof. Ndi',
              day_of_week: 2,
              slot_index: 1,
            },
          ],
          rowCount: 2,
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any);

      const conflicts = await detectTimetableConflicts(timetableId, institutionId);

      expect(conflicts).toHaveLength(2);
      expect(conflicts.map((c) => c.type)).toEqual([
        'LECTURER_DOUBLE_BOOKED',
        'LECTURER_DOUBLE_BOOKED',
      ]);
    });
  });

  describe('Room Conflict Detection', () => {
    it('should detect when a room is booked for two sessions at the same time', async () => {
      mockQuery
        .mockResolvedValueOnce({
          // Lecturer conflicts
          rows: [],
          rowCount: 0,
        } as any)
        .mockResolvedValueOnce({
          // Room conflicts
          rows: [
            {
              s1_id: 'session-1',
              s2_id: 'session-2',
              room_name: 'Amphi 500',
              day_of_week: 1,
              slot_index: 2,
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          // Group conflicts
          rows: [],
          rowCount: 0,
        } as any);

      const conflicts = await detectTimetableConflicts(timetableId, institutionId);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toMatchObject({
        type: 'ROOM_DOUBLE_BOOKED',
        severity: 'hard',
        sessionIds: ['session-1', 'session-2'],
      });
      expect(conflicts[0].description).toContain('Amphi 500');
    });

    it('should return no conflicts when room schedule is clean', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const conflicts = await detectTimetableConflicts(timetableId, institutionId);

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('Conflict Metadata', () => {
    it('should include conflict severity', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              s1_id: 'session-1',
              s2_id: 'session-2',
              lecturer_name: 'Dr. Tamo',
              day_of_week: 1,
              slot_index: 0,
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any);

      const conflicts = await detectTimetableConflicts(timetableId, institutionId);

      expect(conflicts[0].severity).toBe('hard');
    });

    it('should include unique conflict IDs', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              s1_id: 'session-1',
              s2_id: 'session-2',
              lecturer_name: 'Dr. Tamo',
              day_of_week: 1,
              slot_index: 0,
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any);

      const conflicts = await detectTimetableConflicts(timetableId, institutionId);

      expect(conflicts[0]).toHaveProperty('id');
      expect(conflicts[0].id).toMatch(/^lec-/);
    });

    it('should describe conflicts clearly', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              s1_id: 'session-1',
              s2_id: 'session-2',
              lecturer_name: 'Dr. Tamo',
              day_of_week: 2,
              slot_index: 3,
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any);

      const conflicts = await detectTimetableConflicts(timetableId, institutionId);

      expect(conflicts[0].description).toContain('Dr. Tamo');
      expect(conflicts[0].description).toContain('jour 2');
      expect(conflicts[0].description).toContain('créneau 3');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(detectTimetableConflicts(timetableId, institutionId)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should not crash with missing lecturer name', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              s1_id: 'session-1',
              s2_id: 'session-2',
              lecturer_name: null,
              day_of_week: 1,
              slot_index: 0,
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any);

      const conflicts = await detectTimetableConflicts(timetableId, institutionId);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].description).toBeTruthy();
    });
  });
});
