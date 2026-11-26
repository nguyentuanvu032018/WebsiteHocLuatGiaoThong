<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { isAdminPortal } from '../../utils/portals';
import Swal from 'sweetalert2';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const adminPortal = isAdminPortal();

const LOGIN_LOCK_STORAGE_KEY = 'traffic_exam_login_lock_until';

const email = ref('');
const password = ref('');
const rememberMe = ref(!adminPortal);
const showPassword = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const lockSeconds = ref(0);
let lockTimer = null;

const stopLockCountdown = () => {
  if (lockTimer) {
    clearInterval(lockTimer);
    lockTimer = null;
  }
};

const startLockCountdown = (seconds) => {
  stopLockCountdown();
  const duration = Math.max(1, Number(seconds) || 30);
  const lockUntil = Date.now() + duration * 1000;
  localStorage.setItem(LOGIN_LOCK_STORAGE_KEY, String(lockUntil));
  lockSeconds.value = duration;

  lockTimer = setInterval(() => {
    const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
    if (remaining > 0) {
      lockSeconds.value = remaining;
    } else {
      lockSeconds.value = 0;
      localStorage.removeItem(LOGIN_LOCK_STORAGE_KEY);
      stopLockCountdown();
      errorMessage.value = '';
    }
  }, 1000);
};

// Nếu đã đăng nhập thì tự động chuyển hướng; khôi phục đếm ngược khóa nếu còn hạn
onMounted(() => {
  if (authStore.isAuthenticated) {
    if (adminPortal && authStore.isAdmin) {
      router.replace('/admin/dashboard');
    } else if (!adminPortal && !authStore.isAdmin) {
      router.replace('/');
    } else {
      authStore.logout();
    }
    return;
  }

  const savedLockUntil = Number(localStorage.getItem(LOGIN_LOCK_STORAGE_KEY) || 0);
  if (savedLockUntil > Date.now()) {
    const remaining = Math.ceil((savedLockUntil - Date.now()) / 1000);
    startLockCountdown(remaining);
  } else {
    localStorage.removeItem(LOGIN_LOCK_STORAGE_KEY);
  }
});

onUnmounted(() => {
  stopLockCountdown();
});

// Điền nhanh thông tin tài khoản mẫu để kiểm thử nhanh
const fillDemoAccount = (role) => {
  errorMessage.value = '';
  if (role === 'student') {
    email.value = 'hocvien@gmail.com';
    password.value = 'admin123';
  } else if (role === 'admin') {
    email.value = 'admin@gmail.com';
    password.value = 'admin123';
  }
};

// Xử lý nộp form đăng nhập
const handleLogin = async () => {
  if (lockSeconds.value > 0) return;

  errorMessage.value = '';

  // Kiểm tra dữ liệu đầu vào
  if (!email.value.trim()) {
    errorMessage.value = 'Vui lòng nhập địa chỉ email';
    return;
  }
  if (!password.value) {
    errorMessage.value = 'Vui lòng nhập mật khẩu';
    return;
  }

  isSubmitting.value = true;

  try {
    const res = await authStore.login(email.value.trim(), password.value, rememberMe.value);

    if (authStore.isAdmin !== adminPortal) {
      authStore.logout();
      errorMessage.value = 'Thông tin đăng nhập không chính xác';
      return;
    }

    localStorage.removeItem(LOGIN_LOCK_STORAGE_KEY);
    stopLockCountdown();
    lockSeconds.value = 0;
    
    // Thông báo đăng nhập thành công
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
    Toast.fire({
      icon: 'success',
      title: `Xin chào, ${res.data.user.fullName}!`
    });

    const redirectPath = adminPortal
      ? '/admin/dashboard'
      : (route.query.redirect || '/');
    router.push(redirectPath);
  } catch (error) {
    if (error.statusCode === 429) {
      const retryAfter = error.errors?.retryAfter || 30;
      startLockCountdown(retryAfter);
      errorMessage.value = '';
    } else if (error.statusCode === 403) {
      errorMessage.value = error.message;
    } else if (error.errors?.remainingAttempts !== undefined) {
      errorMessage.value = `Thông tin đăng nhập không chính xác (Còn ${error.errors.remainingAttempts} lần thử)`;
    } else {
      errorMessage.value = 'Thông tin đăng nhập không chính xác';
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="container py-5">
    <div class="row justify-content-center align-items-center py-lg-4">
      <div class="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
        <!-- Auth Card -->
        <div class="card border border-light-subtle shadow-lg rounded-4 p-4 p-md-5 bg-white">
          <!-- Logo & Header -->
          <div class="text-center mb-4">
            <img src="/logo.png" alt="Logo GPLX" class="mx-auto mb-3 rounded-4 bg-white p-2 shadow-sm border" style="width: 64px; height: 64px; object-fit: contain;" />
            <h3 class="fw-bolder text-dark mb-1">Đăng Nhập</h3>
            <p class="text-secondary small mb-2">
              {{ adminPortal ? 'Cổng quản trị hệ thống' : 'Hệ thống học & thi thử sát hạch GPLX' }}
            </p>
            <!-- <span class="badge bg-primary-subtle text-primary border border-primary-subtle small fw-normal px-2 py-1 rounded-pill">
              <i class="bi bi-arrow-left-right me-1"></i>Tự động chuyển giao diện theo vai trò
            </span> -->
          </div>

          <!-- Quick Fill Demo Accounts -->
          <!-- <div class="bg-light p-2 rounded-3 border mb-4 text-center">
            <div class="small text-secondary fw-semibold mb-2">
              <i class="bi bi-key-fill text-warning me-1"></i> Tài khoản mẫu dùng thử:
            </div>
            <div class="d-flex gap-2 justify-content-center">
              <button 
                type="button" 
                @click="fillDemoAccount('student')" 
                class="btn btn-sm btn-outline-primary py-1 px-2 fs-xs"
                title="Đăng nhập với tài khoản Học viên mẫu"
              >
                <i class="bi bi-person me-1"></i> Học viên
              </button>
              <button 
                type="button" 
                @click="fillDemoAccount('admin')" 
                class="btn btn-sm btn-outline-danger py-1 px-2 fs-xs"
                title="Đăng nhập với tài khoản Quản trị viên mẫu"
              >
                <i class="bi bi-shield-shaded me-1"></i> Quản trị viên
              </button>
            </div>
          </div> -->

          <!-- Alert Lockout Countdown -->
          <div v-if="lockSeconds > 0" class="alert alert-warning d-flex align-items-center small py-2 px-3 mb-3 rounded-3 border-warning" role="alert">
            <i class="bi bi-hourglass-split fs-5 me-2 text-warning-emphasis flex-shrink-0"></i>
            <div>
              Bạn đã nhập sai mật khẩu quá 5 lần. Vui lòng đợi <strong>{{ lockSeconds }} giây</strong> để thử lại.
            </div>
          </div>

          <!-- Alert Error Message -->
          <div v-else-if="errorMessage" class="alert alert-danger alert-dismissible fade show d-flex align-items-center small py-2 px-3 mb-3 rounded-3" role="alert">
            <i class="bi bi-exclamation-circle-fill fs-5 me-2 flex-shrink-0"></i>
            <div>{{ errorMessage }}</div>
            <button type="button" class="btn-close py-2 login-alert-close" @click="errorMessage = ''" aria-label="Close"></button>
          </div>

          <!-- Login Form -->
          <form @submit.prevent="handleLogin">
            <!-- Email Input -->
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <label for="loginEmail" class="form-label small fw-semibold text-dark mb-0">
                  Địa chỉ Email <span class="text-danger">*</span>
                </label>
                <!-- <span class="text-secondary" style="font-size: 11px;">
                  <i class="bi bi-fonts me-1"></i>Phân biệt hoa/thường
                </span> -->
              </div>
              <div class="input-group">
                <span class="input-group-text bg-light text-secondary border-end-0">
                  <i class="bi bi-envelope"></i>
                </span>
                <input 
                  id="loginEmail"
                  v-model="email" 
                  type="email" 
                  class="form-control border-start-0 ps-0" 
                  placeholder="name@example.com"
                  autocomplete="username"
                  :disabled="lockSeconds > 0 || isSubmitting"
                  required 
                />
              </div>
            </div>

            <!-- Password Input -->
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <label for="loginPassword" class="form-label small fw-semibold text-dark mb-0">
                  Mật khẩu <span class="text-danger">*</span>
                </label>
                <!-- <span class="text-secondary" style="font-size: 11px;">
                  <i class="bi bi-shield-lock me-1"></i>Phân biệt hoa/thường
                </span> -->
              </div>
              <div class="input-group">
                <span class="input-group-text bg-light text-secondary border-end-0">
                  <i class="bi bi-lock"></i>
                </span>
                <input 
                  id="loginPassword"
                  v-model="password" 
                  :type="showPassword ? 'text' : 'password'" 
                  class="form-control border-start-0 border-end-0 ps-0" 
                  placeholder="Nhập mật khẩu"
                  autocomplete="current-password"
                  :disabled="lockSeconds > 0 || isSubmitting"
                  required 
                />
                <button 
                  type="button" 
                  @click="showPassword = !showPassword" 
                  class="input-group-text bg-light text-secondary border-start-0 cursor-pointer"
                  tabindex="-1"
                  title="Hiện/Ẩn mật khẩu"
                >
                  <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
            </div>

            <!-- Remember Me -->
            <div class="d-flex justify-content-between align-items-center mb-4">
              <div class="form-check">
                <input 
                  id="rememberMe" 
                  v-model="rememberMe" 
                  type="checkbox" 
                  class="form-check-input"
                />
                <label for="rememberMe" class="form-check-label small text-secondary">
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <router-link to="/forgot-password" class="small text-primary fw-semibold text-decoration-none">
                Quên mật khẩu?
              </router-link>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              class="btn btn-primary w-100 py-2 fs-6 mb-3 shadow-sm"
              :disabled="isSubmitting || lockSeconds > 0"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              <span v-if="isSubmitting">Đang xác thực...</span>
              <span v-else-if="lockSeconds > 0"><i class="bi bi-clock-history me-1"></i> Vui lòng đợi ({{ lockSeconds }}s)</span>
              <span v-else><i class="bi bi-box-arrow-in-right me-1"></i> Đăng nhập</span>
            </button>
          </form>

          <!-- Register Navigation Link -->
          <div v-if="!adminPortal" class="text-center small text-secondary mt-3 pt-3 border-top">
            Chưa có tài khoản học viên? 
            <router-link to="/register" class="fw-bold text-primary">
              Đăng ký ngay
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
