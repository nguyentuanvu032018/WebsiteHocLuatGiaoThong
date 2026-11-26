/**
 * Script: test_exam_gen_all.js
 * Mục đích: Test sinh đề thi cho tất cả 9 hạng mới
 * Chạy: node database/seeds/test_exam_gen_all.js
 */

const examService = require('../../src/services/exam.service');
const { pool } = require('../../src/config/db.config');

async function testAllLicenses() {
  console.log('🧪 Test sinh đề thi cho 9 hạng mới...\n');

  // Lấy danh sách license types từ DB
  const [licenses] = await pool.query(
    'SELECT id, code, name FROM license_types ORDER BY id'
  );

  console.log(`📋 Tìm thấy ${licenses.length} hạng:\n`);

  const TEST_USER_ID = 1; // Giả sử user ID = 1
  const results = [];

  for (const lic of licenses) {
    try {
      const session = await examService.generateExamSession({
        userId: TEST_USER_ID,
        licenseTypeId: lic.id,
      });

      const questionCount = session.questions ? session.questions.length : 0;
      const status = questionCount > 0 ? '✅' : '❌ (0 câu)';
      console.log(
        `  ${status} Hạng ${lic.code} (ID=${lic.id}): ${questionCount} câu — Session ID: ${session.sessionId || session.id || 'N/A'}`
      );

      results.push({
        code: lic.code,
        id: lic.id,
        questionCount,
        ok: questionCount > 0,
        sessionId: session.sessionId || session.id,
      });

      // Cleanup: xóa session test
      if (session.sessionId || session.id) {
        await pool.query('DELETE FROM exam_sessions WHERE id = ?', [
          session.sessionId || session.id,
        ]);
      }
    } catch (err) {
      console.log(`  ❌ Hạng ${lic.code} (ID=${lic.id}): LỖI — ${err.message}`);
      results.push({ code: lic.code, id: lic.id, questionCount: 0, ok: false, error: err.message });
    }
  }

  console.log('\n📊 Tổng kết:');
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log(`  ✅ Thành công: ${passed}/${results.length}`);
  if (failed.length > 0) {
    console.log('  ❌ Thất bại:');
    for (const f of failed) {
      console.log(`     - Hạng ${f.code}: ${f.error || '0 câu'}`);
    }
  }

  await pool.end();
  console.log('\nTest hoàn tất.');
}

testAllLicenses().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
