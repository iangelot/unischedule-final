import fs from 'fs';
import path from 'path';
import { query } from '../src/lib/db';
import { logger } from '../src/lib/logger';

interface Migration {
  name: string;
  up: string;
  down: string;
  appliedAt?: Date;
}

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

/**
 * Create migrations table if it doesn't exist
 */
async function ensureMigrationsTable() {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )`
    );
    logger.info('Migrations table ready');
  } catch (err) {
    logger.error({ err }, 'Failed to create migrations table');
    throw err;
  }
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations(): Promise<string[]> {
  try {
    const result = await query(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY applied_at ASC`);
    return result.rows.map((row: any) => row.name);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch applied migrations');
    return [];
  }
}

/**
 * Read migration file
 */
function readMigration(filename: string): Migration | null {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return null;
  }

  const content = fs.readFileSync(filepath, 'utf-8');
  const parts = content.split('\n-- DOWN\n');

  if (parts.length !== 2) {
    logger.error({ filename }, 'Invalid migration format (missing -- DOWN separator)');
    return null;
  }

  return {
    name: filename.replace('.sql', ''),
    up: parts[0].trim(),
    down: parts[1].trim(),
  };
}

/**
 * Get pending migrations
 */
async function getPendingMigrations(): Promise<Migration[]> {
  const applied = await getAppliedMigrations();
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

  const pending: Migration[] = [];
  for (const file of files) {
    if (!applied.includes(file.replace('.sql', ''))) {
      const migration = readMigration(file);
      if (migration) pending.push(migration);
    }
  }

  return pending;
}

/**
 * Apply a single migration
 */
async function applyMigration(migration: Migration): Promise<void> {
  try {
    logger.info({ migration: migration.name }, 'Applying migration');
    await query(migration.up);
    await query(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`, [migration.name]);
    logger.info({ migration: migration.name }, 'Migration applied successfully');
  } catch (err) {
    logger.error({ migration: migration.name, err }, 'Failed to apply migration');
    throw err;
  }
}

/**
 * Rollback a single migration
 */
async function rollbackMigration(migration: Migration): Promise<void> {
  try {
    logger.info({ migration: migration.name }, 'Rolling back migration');
    await query(migration.down);
    await query(`DELETE FROM ${MIGRATIONS_TABLE} WHERE name = $1`, [migration.name]);
    logger.info({ migration: migration.name }, 'Migration rolled back successfully');
  } catch (err) {
    logger.error({ migration: migration.name, err }, 'Failed to rollback migration');
    throw err;
  }
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    await ensureMigrationsTable();
    const pending = await getPendingMigrations();

    if (pending.length === 0) {
      logger.info('No pending migrations');
      return;
    }

    logger.info({ count: pending.length }, 'Running pending migrations');

    for (const migration of pending) {
      await applyMigration(migration);
    }

    logger.info({ count: pending.length }, 'All migrations applied successfully');
  } catch (err) {
    logger.error({ err }, 'Migration failed');
    process.exit(1);
  }
}

/**
 * Create a new migration file
 */
export function createMigration(name: string): void {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const filename = `${timestamp}_${name}.sql`;
  const filepath = path.join(MIGRATIONS_DIR, filename);

  const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- UP
-- Write your migration SQL here

-- DOWN
-- Write your rollback SQL here
`;

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }

  fs.writeFileSync(filepath, template);
  logger.info({ filename }, 'Migration file created');
  console.log(`Created migration: ${filename}`);
}

/**
 * Rollback the last N migrations
 */
export async function rollbackMigrations(steps = 1): Promise<void> {
  try {
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();

    if (applied.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }

    const toRollback = applied.slice(-steps).reverse();
    logger.info({ count: toRollback.length }, 'Rolling back migrations');

    for (const name of toRollback) {
      const filename = `${name}.sql`;
      const migration = readMigration(filename);
      if (migration) {
        await rollbackMigration(migration);
      }
    }

    logger.info({ count: toRollback.length }, 'Rollback completed successfully');
  } catch (err) {
    logger.error({ err }, 'Rollback failed');
    process.exit(1);
  }
}

// CLI Support
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'create') {
    const name = process.argv[3];
    if (!name) {
      console.error('Usage: npm run db:migrate:create -- <migration-name>');
      process.exit(1);
    }
    createMigration(name);
  } else if (command === 'rollback') {
    const steps = parseInt(process.argv[3]) || 1;
    rollbackMigrations(steps).catch(() => process.exit(1));
  } else {
    runMigrations().catch(() => process.exit(1));
  }
}
