/**
 * Login Attempt Store — Giới hạn số lần đăng nhập sai (In-Memory)
 * Quy tắc: Nhập sai tối đa 5 lần liên tiếp -> Khóa tạm thời 30 giây.
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 1000; // 30 giây
const ENTRY_TTL_MS = 15 * 60 * 1000; // Tự dọn sau 15 phút không hoạt động

const attemptsMap = new Map(); // Map<key, { count, lockedUntil, lastAttemptAt }>

function normalizeKey(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * Kiểm tra tài khoản/email có đang trong thời gian chờ 30 giây hay không
 * @param {string} email
 * @returns {{ locked: boolean, remainingSeconds: number }}
 */
function checkLoginLock(email) {
  const key = normalizeKey(email);
  if (!key) return { locked: false, remainingSeconds: 0 };

  const entry = attemptsMap.get(key);
  if (!entry) return { locked: false, remainingSeconds: 0 };

  if (entry.lockedUntil) {
    const diffMs = entry.lockedUntil - Date.now();
    if (diffMs > 0) {
      return {
        locked: true,
        remainingSeconds: Math.ceil(diffMs / 1000)
      };
    }
    // Hết thời gian phạt 30 giây -> xóa bộ đếm để cho phép nhập lại
    attemptsMap.delete(key);
  }

  return { locked: false, remainingSeconds: 0 };
}

/**
 * Ghi nhận 1 lần đăng nhập sai mật khẩu / sai thông tin
 * @param {string} email
 * @returns {{ locked: boolean, remainingSeconds: number, remainingAttempts: number }}
 */
function recordFailedAttempt(email) {
  const key = normalizeKey(email);
  if (!key) {
    return { locked: false, remainingSeconds: 0, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const currentLock = checkLoginLock(key);
  if (currentLock.locked) {
    return {
      locked: true,
      remainingSeconds: currentLock.remainingSeconds,
      remainingAttempts: 0
    };
  }

  const prev = attemptsMap.get(key) || { count: 0, lockedUntil: null, lastAttemptAt: Date.now() };
  const nextCount = prev.count + 1;

  if (nextCount >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCK_DURATION_MS;
    attemptsMap.set(key, {
      count: nextCount,
      lockedUntil,
      lastAttemptAt: Date.now()
    });
    return {
      locked: true,
      remainingSeconds: Math.ceil(LOCK_DURATION_MS / 1000),
      remainingAttempts: 0
    };
  }

  attemptsMap.set(key, {
    count: nextCount,
    lockedUntil: null,
    lastAttemptAt: Date.now()
  });

  return {
    locked: false,
    remainingSeconds: 0,
    remainingAttempts: MAX_FAILED_ATTEMPTS - nextCount
  };
}

/**
 * Xóa bộ đếm sai khi đăng nhập thành công
 * @param {string} email
 */
function clearFailedAttempts(email) {
  const key = normalizeKey(email);
  if (key) {
    attemptsMap.delete(key);
  }
}

// Dọn dẹp định kỳ các bản ghi cũ để tránh rò rỉ bộ nhớ
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attemptsMap.entries()) {
    const isExpiredLock = entry.lockedUntil && now >= entry.lockedUntil;
    const isStale = now - entry.lastAttemptAt > ENTRY_TTL_MS;
    if (isExpiredLock || isStale) {
      attemptsMap.delete(key);
    }
  }
}, 5 * 60 * 1000);
if (typeof cleanupTimer.unref === 'function') cleanupTimer.unref();

module.exports = {
  MAX_FAILED_ATTEMPTS,
  LOCK_DURATION_MS,
  checkLoginLock,
  recordFailedAttempt,
  clearFailedAttempts
};
