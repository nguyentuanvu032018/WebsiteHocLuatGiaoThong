import { defineStore } from 'pinia';
import apiClient from '../services/api';
import {
  getAuthToken,
  getAuthUser,
  saveAuthSession,
  updateAuthUser,
  clearAuthSession
} from '../utils/tokenStorage';

/**
 * Pinia Store Quản lý Trạng thái Xác thực & Người dùng (Auth Store)
 */
export const useAuthStore = defineStore('auth', {
  state: () => {
    return {
      user: getAuthUser(),
      token: getAuthToken(),
      isLoading: false,
      error: null
    };
  },

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    userName: (state) => state.user?.fullName || state.user?.full_name || 'Học viên',
    userEmail: (state) => state.user?.email || '',
    userPhone: (state) => state.user?.phone || '',
    userAvatar: (state) => state.user?.avatar || null,
    userRoleBadge: (state) => (state.user?.role === 'admin' ? 'Quản trị viên' : 'Học viên')
  },

  actions: {
    /**
     * Đăng nhập người dùng
     */
    async login(email, password, remember = false) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await apiClient.post('/auth/login', { email, password });
        if (response.success && response.data) {
          this.token = response.data.token;
          this.user = response.data.user;

          saveAuthSession(this.token, this.user, remember);
          return response;
        }
      } catch (err) {
        this.error = err.message || 'Đăng nhập thất bại';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Gửi mã OTP xác nhận đăng ký tài khoản tới email
     */
    async sendRegisterOtp(payload) {
      this.isLoading = true;
      this.error = null;
      try {
        const isFormData = payload instanceof FormData;
        const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        const response = await apiClient.post('/auth/send-register-otp', payload, config);
        return response;
      } catch (err) {
        this.error = err.message || 'Không thể gửi mã xác nhận';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Xác minh mã OTP đăng ký và tạo tài khoản học viên chính thức
     */
    async verifyRegisterOtp({ email, otp }) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await apiClient.post('/auth/verify-register-otp', { email, otp });
        if (response.success && response.data?.token) {
          this.token = response.data.token;
          this.user = response.data.user;

          saveAuthSession(this.token, this.user, false);
        }
        return response;
      } catch (err) {
        this.error = err.message || 'Xác minh mã không thành công';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Cập nhật thông tin cá nhân (Họ tên, SĐT, Avatar)
     */
    async updateProfile(formData) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await apiClient.put('/auth/profile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        if (response.success && response.data?.user) {
          this.user = { ...this.user, ...response.data.user };
          updateAuthUser(this.user);
        }
        return response;
      } catch (err) {
        this.error = err.message || 'Cập nhật thông tin thất bại';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Lấy lại thông tin tài khoản hiện tại từ Backend
     */
    async fetchMe() {
      if (!this.token) return null;
      try {
        const response = await apiClient.get('/auth/me');
        if (response.success && response.data?.user) {
          this.user = response.data.user;
          updateAuthUser(this.user);
        }
        return this.user;
      } catch {
        this.logout();
      }
    },

    /**
     * Đăng xuất khỏi hệ thống
     */
    logout() {
      this.token = null;
      this.user = null;
      clearAuthSession();
    }
  }
});
