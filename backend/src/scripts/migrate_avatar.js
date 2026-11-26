const { pool } = require('../config/db.config');

async function migrate() {
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'avatar'");
    if (cols.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL AFTER phone');
      console.log('✅ Added column avatar to users table successfully!');
    } else {
      console.log('ℹ️ Column avatar already exists in users table.');
    }
    const [updated] = await pool.query('DESCRIBE users');
    console.table(updated);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit();
  }
}

migrate();
