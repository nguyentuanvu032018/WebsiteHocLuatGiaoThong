export const ADMIN_PORT = '5174';

export const isAdminPortal = () => window.location.port === ADMIN_PORT;

export const STUDENT_PORT = '5173';
export const ADMIN_PREVIEW_HASH = '#admin-preview';

export const getPortalHost = () => window.location.hostname || 'localhost';

export const getStudentPortalUrl = (path = '/') => {
  const urlPath = path.startsWith('/') ? path : `/${path}`;
  return `http://${getPortalHost()}:${STUDENT_PORT}${urlPath}`;
};

export const getAdminPortalUrl = (path = '/admin/dashboard') => {
  const urlPath = path.startsWith('/') ? path : `/${path}`;
  return `http://${getPortalHost()}:${ADMIN_PORT}${urlPath}`;
};

