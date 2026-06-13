import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface AuditLogEntry {
  userId: string;
  institutionId: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  resourceType: string;
  resourceId: string;
  beforeState: Record<string, any>;
  afterState: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an audit entry to the database
 * Used to track all user actions for compliance
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const sql = `
      INSERT INTO audit_log (
        user_id,
        institution_id,
        action,
        resource_type,
        resource_id,
        before_state,
        after_state,
        ip_address,
        user_agent,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
    `;

    const values = [
      entry.userId,
      entry.institutionId,
      entry.action,
      entry.resourceType,
      entry.resourceId,
      JSON.stringify(entry.beforeState),
      JSON.stringify(entry.afterState),
      entry.ipAddress || null,
      entry.userAgent || null,
      JSON.stringify(entry.metadata || {}),
    ];

    await query(sql, values);

    logger.debug(
      {
        audit: entry,
      },
      `Audit logged: ${entry.action} ${entry.resourceType} ${entry.resourceId}`
    );
  } catch (err) {
    logger.error(
      { err, entry },
      'Failed to log audit entry'
    );
    // Don't throw - audit logging should not fail the main operation
  }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  institutionId: string,
  limit = 100
): Promise<any[]> {
  try {
    const sql = `
      SELECT
        id,
        user_id,
        action,
        resource_type,
        resource_id,
        before_state,
        after_state,
        ip_address,
        created_at
      FROM audit_log
      WHERE user_id = $1 AND institution_id = $2 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $3
    `;

    const result = await query(sql, [userId, institutionId, limit]);
    return result.rows || [];
  } catch (err) {
    logger.error({ err }, 'Failed to retrieve audit logs');
    return [];
  }
}

/**
 * Get audit logs for a resource
 */
export async function getResourceAuditLogs(
  resourceType: string,
  resourceId: string,
  institutionId: string
): Promise<any[]> {
  try {
    const sql = `
      SELECT
        id,
        user_id,
        action,
        before_state,
        after_state,
        created_at
      FROM audit_log
      WHERE resource_type = $1 AND resource_id = $2 AND institution_id = $3 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    const result = await query(sql, [resourceType, resourceId, institutionId]);
    return result.rows || [];
  } catch (err) {
    logger.error({ err }, 'Failed to retrieve resource audit logs');
    return [];
  }
}

/**
 * Delete old audit logs (retention policy)
 * Deletes records older than specified days
 */
export async function cleanupOldAuditLogs(retentionDays = 90): Promise<number> {
  try {
    const sql = `
      UPDATE audit_log
      SET deleted_at = now()
      WHERE created_at < now() - INTERVAL '${retentionDays} days'
      AND deleted_at IS NULL
    `;

    const result = await query(sql);
    const deletedCount = result.rowCount || 0;

    logger.info(
      { retentionDays, deletedCount },
      'Cleaned up old audit logs'
    );

    return deletedCount;
  } catch (err) {
    logger.error({ err, retentionDays }, 'Failed to cleanup audit logs');
    return 0;
  }
}

/**
 * Export audit logs as CSV
 * Returns CSV string ready for download
 */
export async function exportAuditLogs(
  institutionId: string,
  fromDate: Date,
  toDate: Date
): Promise<string> {
  try {
    const sql = `
      SELECT
        created_at,
        user_id,
        action,
        resource_type,
        resource_id,
        ip_address,
        before_state,
        after_state
      FROM audit_log
      WHERE institution_id = $1
      AND created_at BETWEEN $2 AND $3
      AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    const result = await query(sql, [
      institutionId,
      fromDate,
      toDate,
    ]);

    if (!result.rows || result.rows.length === 0) {
      return 'No audit logs found for this period\n';
    }

    // Build CSV header
    const headers = [
      'Timestamp',
      'User ID',
      'Action',
      'Resource Type',
      'Resource ID',
      'IP Address',
      'Before State',
      'After State',
    ];

    const rows = result.rows.map((row: any) => [
      row.created_at,
      row.user_id,
      row.action,
      row.resource_type,
      row.resource_id,
      row.ip_address || 'N/A',
      JSON.stringify(row.before_state),
      JSON.stringify(row.after_state),
    ]);

    // Create CSV content
    const csvContent = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((r: any[]) => r.map((v) => `"${v}"`).join(',')),
    ].join('\n');

    logger.info(
      { institutionId, rowCount: rows.length },
      'Exported audit logs'
    );

    return csvContent;
  } catch (err) {
    logger.error({ err, institutionId }, 'Failed to export audit logs');
    throw err;
  }
}
