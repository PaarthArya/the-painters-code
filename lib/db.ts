// Conditional import: @vercel/postgres for production, postgres.js for local
let sql: any;

if (process.env.VERCEL) {
  // Production: Use @vercel/postgres (Vercel's managed Postgres)
  const { sql: vercelSql } = require('@vercel/postgres');

  // Wrap @vercel/postgres to normalize result format to match postgres.js
  const wrappedSql = async (strings: TemplateStringsArray, ...values: any[]) => {
    const result = await vercelSql(strings, ...values);
    // @vercel/postgres returns { rows: [...] }, but we want just the array
    return result.rows;
  };

  // Preserve tagged template literal functionality
  Object.setPrototypeOf(wrappedSql, Function.prototype);

  // Add .begin() wrapper for transactions
  wrappedSql.begin = async (callback: (tx: any) => Promise<void>) => {
    // @vercel/postgres doesn't need explicit transactions for single queries
    // Just execute the callback with the wrapped sql itself
    await callback(wrappedSql);
  };

  sql = wrappedSql;
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
