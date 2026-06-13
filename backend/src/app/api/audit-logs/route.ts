import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { getUserAuditLogs, getResourceAuditLogs, exportAuditLogs } from '@/lib/audit';
import { ok, forbidden, badRequest, serverError } from '@/lib/response';
import { logger } from '@/lib/logger';

/**
 * GET /api/audit-logs
 * Retrieve audit logs for user or resource
 * Query parameters:
 *   - type: 'user' | 'resource'
 *   - userId: UUID (if type=user)
 *   - resourceType: string (if type=resource)
 *   - resourceId: UUID (if type=resource)
 *   - export: 'csv' (optional, for CSV export)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await withAuth(req);

    // Only admins can view audit logs
    if (auth.role !== 'admin' && auth.role !== 'superadmin') {
      return forbidden('Only admins can view audit logs');
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'user';
    const userId = searchParams.get('userId');
    const resourceType = searchParams.get('resourceType');
    const resourceId = searchParams.get('resourceId');
    const exportFormat = searchParams.get('export');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (type === 'user') {
      if (!userId) {
        return badRequest('userId is required when type=user');
      }

      const logs = await getUserAuditLogs(userId, auth.institutionId, limit);

      if (exportFormat === 'csv') {
        const csv = [
          ['Timestamp', 'Action', 'Resource', 'Resource ID', 'IP Address'].join(','),
          ...logs.map((log: any) =>
            [
              log.created_at,
              log.action,
              log.resource_type,
              log.resource_id,
              log.ip_address || 'N/A',
            ].join(',')
          ),
        ].join('\n');

        return new Response(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="user-${userId}-audit.csv"`,
          },
        });
      }

      return ok({ data: logs, count: logs.length });
    }

    if (type === 'resource') {
      if (!resourceType || !resourceId) {
        return badRequest('resourceType and resourceId are required when type=resource');
      }

      const logs = await getResourceAuditLogs(resourceType, resourceId, auth.institutionId);

      if (exportFormat === 'csv') {
        const csv = [
          ['Timestamp', 'User ID', 'Action', 'Before', 'After'].join(','),
          ...logs.map((log: any) =>
            [
              log.created_at,
              log.user_id,
              log.action,
              JSON.stringify(log.before_state),
              JSON.stringify(log.after_state),
            ].join(',')
          ),
        ].join('\n');

        return new Response(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${resourceType}-${resourceId}-audit.csv"`,
          },
        });
      }

      return ok({ data: logs, count: logs.length });
    }

    return badRequest('Invalid type parameter');
  } catch (err) {
    logger.error({ err }, 'Failed to retrieve audit logs');
    return serverError(err);
  }
}

/**
 * POST /api/audit-logs/export
 * Export audit logs for a date range
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await withAuth(req);

    // Only admins can export audit logs
    if (auth.role !== 'admin' && auth.role !== 'superadmin') {
      return forbidden('Only admins can export audit logs');
    }

    const body = await req.json();
    const { fromDate, toDate } = body;

    if (!fromDate || !toDate) {
      return badRequest('fromDate and toDate are required');
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (from > to) {
      return badRequest('fromDate must be before toDate');
    }

    const csv = await exportAuditLogs(auth.institutionId, from, to);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-export-${from.toISOString().split('T')[0]}-to-${to.toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to export audit logs');
    return serverError(err);
  }
}
