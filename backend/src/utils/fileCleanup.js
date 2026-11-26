const fs = require('fs');
const path = require('path');

const AVATARS_DIR = path.resolve(__dirname, '../../uploads/avatars');

/**
 * Xóa an toàn tệp ảnh avatar nằm trong thư mục uploads/avatars
 * Ngăn chặn path traversal bằng path.basename và kiểm tra thư mục đích.
 * @param {string|null|undefined} avatarPath - Đường dẫn dạng /uploads/avatars/<filename>
 * @returns {boolean}
 */
function deleteAvatarFile(avatarPath) {
  if (!avatarPath || typeof avatarPath !== 'string') return false;
  if (!avatarPath.startsWith('/uploads/avatars/')) return false;

  const filename = path.basename(avatarPath);
  if (!filename || filename === '.' || filename === '..') return false;

  const fullPath = path.resolve(AVATARS_DIR, filename);
  if (!fullPath.startsWith(AVATARS_DIR + path.sep)) return false;

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
  } catch (err) {
    console.error('[FileCleanup] Không thể xóa tệp avatar cũ:', err.message);
  }
  return false;
}

module.exports = {
  AVATARS_DIR,
  deleteAvatarFile
};
