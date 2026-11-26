import axios from 'axios';
import { getAuthToken, clearAuthSession } from '../utils/tokenStorage';

const API_BASE_ORIGIN = (import.meta.env.VITE_API_BASE_URL || '/api/v1')
  .replace(/\/api\/v1\/?$/, '');

export const resolveAssetUrl = (value) => {
  if (!value) return '';
  if (typeof value !== 'string') return value;
  if (value.startsWith('blob:') || value.startsWith('data:')) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/uploads/')) return `${API_BASE_ORIGIN}${value}`;
  return value;
};

/**
 * Cấu hình Axios Client giao tiếp với Backend REST API
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
  timeout: 60000
});

// Request Interceptor: Tự động đính kèm JWT Bearer Token nếu có trong sessionStorage/localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Chuẩn hóa phản hồi hoặc xử lý lỗi tập trung
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const customError = {
      message: error.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ',
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors || null
    };

    // Nếu mã lỗi 401 (Hết hạn hoặc Token bị thu hồi), xóa phiên đăng nhập ở cả 2 storage
    if (error.response?.status === 401) {
      clearAuthSession();
    }

    return Promise.reject(customError);
  }
);

export default apiClient;
