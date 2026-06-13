#!/usr/bin/env node

import { createMigration } from './run';

const name = process.argv[2];
if (!name) {
  console.error('Usage: npm run db:migrate:create -- <migration-name>');
  console.error('Example: npm run db:migrate:create -- add_audit_logs_table');
  process.exit(1);
}

createMigration(name);
