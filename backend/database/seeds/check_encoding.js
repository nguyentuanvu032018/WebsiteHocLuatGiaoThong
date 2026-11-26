const mysql = require('mysql2/promise');

async function checkEncoding() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'traffic_exam_db',
    charset: 'utf8mb4'
  });

  // Check DB charset
  const [vars] = await conn.query("SHOW VARIABLES LIKE 'character%'");
  console.log('\n=== DB Character Set Variables ===');
  for (const v of vars) {
    console.log(`  ${v.Variable_name}: ${v.Value}`);
  }

  // Check column charset
  const [cols] = await conn.query(`
    SELECT COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'traffic_exam_db'
    AND TABLE_NAME = 'license_types'
    AND COLUMN_NAME IN ('code','name','description')
  `);
  console.log('\n=== license_types Column Charset ===');
  for (const c of cols) {
    console.log(`  ${c.COLUMN_NAME}: charset=${c.CHARACTER_SET_NAME} collation=${c.COLLATION_NAME}`);
  }

  // Check actual data
  const [rows] = await conn.query('SELECT id, code, name FROM license_types ORDER BY id LIMIT 3');
  console.log('\n=== Sample Data ===');
  for (const r of rows) {
    console.log(`  ID ${r.id}: [${r.code}] ${r.name}`);
    const hex = Buffer.from(r.name, 'utf8').toString('hex');
    console.log(`  HEX: ${hex.substring(0,30)}...`);
  }

  await conn.end();
}

checkEncoding().catch(console.error);

