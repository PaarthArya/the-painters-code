// Conditional import: @vercel/postgres for production, postgres.js for local
let sql: any;

if (process.env.VERCEL) {
  // Production: Use @vercel/postgres (Vercel's managed Postgres)
  const { sql: vercelSql } = require('@vercel/postgres');
  sql = vercelSql;

  // Add .begin() wrapper for @vercel/postgres to match postgres.js API
  sql.begin = async (callback: (tx: any) => Promise<void>) => {
    // @vercel/postgres doesn't need explicit transactions for single queries
    // Just execute the callback with sql itself
    await callback(sql);
  };
} else {
  // Local development: Use postgres.js
  const postgres = require('postgres');
  const connectionString = process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5433/classroom_dev';
  sql = postgres(connectionString, {
    ssl: false, // No SSL for local development
  });
}

// Export the sql instance for use in API routes
export { sql };

// Note: Schema initialization is handled via scripts/init-postgres.sql
// Run it manually with: docker exec -i classroom-postgres psql -U postgres -d classroom_dev < scripts/init-postgres.sql

export default sql;
