import pg from "pg"

const { Pool } = pg

export function sslFor(connectionString) {
  const url = new URL(connectionString)
  const mode = url.searchParams.get("sslmode")
  const host = url.hostname.replace(/^\[|\]$/g, "")
  const local = host === "localhost" || host === "127.0.0.1" || host === "::1"
  if (mode === "disable") return false
  if (mode === "verify-full" || mode === "verify-ca") {
    return { rejectUnauthorized: true }
  }
  if (
    mode === "require" ||
    mode === "prefer" ||
    mode === "no-verify" ||
    mode === "allow"
  ) {
    return { rejectUnauthorized: false }
  }
  if (local) return false
  return { rejectUnauthorized: false }
}

export function createPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required")
  }
  return new Pool({
    connectionString,
    ssl: sslFor(connectionString),
    max: 4,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
  })
}

export async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id uuid PRIMARY KEY,
      nickname text NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 16),
      slip_number integer NOT NULL CHECK (slip_number BETWEEN 0 AND 100000),
      slip_text text NOT NULL CHECK (char_length(slip_text) BETWEEN 1 AND 500),
      story text NOT NULL CHECK (char_length(story) BETWEEN 1 AND 200),
      client_id text NOT NULL CHECK (char_length(client_id) = 36),
      ip_hash text NOT NULL,
      hidden boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS likes (
      post_id uuid NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
      client_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (post_id, client_id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      post_id uuid NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
      client_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (post_id, client_id)
    );

    CREATE INDEX IF NOT EXISTS posts_feed_idx
      ON posts (created_at DESC, id DESC)
      WHERE hidden = false;

    CREATE INDEX IF NOT EXISTS posts_client_recent_idx
      ON posts (client_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS posts_ip_recent_idx
      ON posts (ip_hash, created_at DESC);
  `)
}
