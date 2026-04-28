#!/usr/bin/env node
// infra/scripts/seed.js
// Seeds an admin user and demo data.

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Simple bcrypt-like hash using SHA-256 + salt (for seed only; real auth uses bcrypt)
// Actually we'll use bcrypt via requiring it if available, else fallback
async function hashPassword(password) {
  try {
    const bcrypt = require('bcrypt');
    return bcrypt.hash(password, 12);
  } catch {
    // fallback: deterministic but not secure — only for seed demo
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');
    return `$sha256$${salt}$${hash}`;
  }
}

async function main() {
  const client = await pool.connect();
  try {
    // Check if admin already exists
    const { rows: existing } = await client.query(
      "SELECT id FROM users WHERE email = 'admin@vaga.local'"
    );

    if (existing.length === 0) {
      const adminHash = await hashPassword('Admin1234!');
      const { rows: [admin] } = await client.query(
        "INSERT INTO users (email, password_hash, role) VALUES ('admin@vaga.local', $1, 'admin') RETURNING id",
        [adminHash]
      );
      console.log('[seed] Admin user created: admin@vaga.local / Admin1234!');

      // Demo user
      const demoHash = await hashPassword('Demo1234!');
      const { rows: [demoUser] } = await client.query(
        "INSERT INTO users (email, password_hash, role) VALUES ('demo@vaga.local', $1, 'user') RETURNING id",
        [demoHash]
      );
      console.log('[seed] Demo user created: demo@vaga.local / Demo1234!');

      // Demo dock
      const { rows: [dock] } = await client.query(
        "INSERT INTO docks (user_id, name) VALUES ($1, 'Demo Dock') RETURNING id",
        [demoUser.id]
      );
      console.log('[seed] Demo dock created:', dock.id);

      // Demo VM
      const { rows: [vm] } = await client.query(
        "INSERT INTO vms (dock_id, name, type, status) VALUES ($1, 'Analysis VM', 'analysis-vm', 'stopped') RETURNING id",
        [dock.id]
      );
      console.log('[seed] Demo VM created:', vm.id);

    } else {
      console.log('[seed] Admin user already exists, skipping seed.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[seed] FAILED:', err);
  process.exit(1);
});
