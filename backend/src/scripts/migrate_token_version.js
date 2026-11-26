const { pool } = require('../config/db.config');

async function migrate() {
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'token_version'");
    if (cols.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 1 AFTER is_active');
      console.log('Added column token_version to users table successfully!');
    } else {
      console.log('Column token_version already exists in users table.');
    }
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrate();
