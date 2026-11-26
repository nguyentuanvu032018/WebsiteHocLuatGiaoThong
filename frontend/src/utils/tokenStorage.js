const TOKEN_KEY = 'traffic_exam_token';
const USER_KEY = 'traffic_exam_user';

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
}

export function getAuthUser() {
  try {
    const rawUser = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function saveAuthSession(token, user, remember = false) {
  clearAuthSession();
  const targetStorage = remember ? localStorage : sessionStorage;
  if (token) targetStorage.setItem(TOKEN_KEY, token);
  if (user) targetStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateAuthUser(user) {
  const serialized = JSON.stringify(user);
  if (sessionStorage.getItem(TOKEN_KEY)) {
    sessionStorage.setItem(USER_KEY, serialized);
  } else {
    localStorage.setItem(USER_KEY, serialized);
  }
}
