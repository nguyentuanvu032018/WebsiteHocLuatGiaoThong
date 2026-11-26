<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '../../services/api';
import Swal from 'sweetalert2';

const router = useRouter();

// ─── State ───────────────────────────────────────────────────────────────────
const step = ref(1); // 1: Nhập email | 2: Nhập OTP | 3: Đặt mật khẩu mới

const email = ref('');
const otp = ref(['', '', '', '', '', '']); // 6 ô nhập OTP riêng biệt
const newPassword = ref('');
const confirmPassword = ref('');
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const isLoading = ref(false);
const errorMessage = ref('');

// Đếm ngược thời gian OTP
const countdown = ref(180); // 3 phút = 180 giây
let countdownTimer = null;

const countdownText = computed(() => {
  const m = Math.floor(countdown.value / 60);
  const s = countdown.value % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

const isExpired = computed(() => countdown.value <= 0);

// ─── Đếm ngược ───────────────────────────────────────────────────────────────
function startCountdown() {
  countdown.value = 180;
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    } else {
      clearInterval(countdownTimer);
    }
  }, 1000);
}

// ─── Nhập OTP từng ô ─────────────────────────────────────────────────────────
function onOtpInput(index, event) {
  const val = event.target.value.replace(/\D/g, '');
  otp.value[index] = val.slice(-1); // chỉ giữ 1 ký tự số
  // Tự động chuyển sang ô tiếp theo
  if (val && index < 5) {
    const next = document.getElementById(`otp-${index + 1}`);
    if (next) next.focus();
  }
}

function onOtpKeydown(index, event) {
  if (event.key === 'Backspace' && !otp.value[index] && index > 0) {
    const prev = document.getElementById(`otp-${index - 1}`);
    if (prev) {
      prev.focus();
      otp.value[index - 1] = '';
    }
  }
}

function onOtpPaste(event) {
  event.preventDefault();
  const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
  pasted.split('').forEach((char, i) => {
    if (i < 6) otp.value[i] = char;
  });
  // Focus ô cuối cùng được điền
  const lastIndex = Math.min(pasted.length - 1, 5);
  const el = document.getElementById(`otp-${lastIndex}`);
  if (el) el.focus();
}

const otpCode = computed(() => otp.value.join(''));

// ─── Bước 1: Gửi OTP ─────────────────────────────────────────────────────────
async function handleSendOtp() {
  errorMessage.value = '';
  if (!email.value.trim()) {
    errorMessage.value = 'Vui lòng nhập địa chỉ email của bạn';
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value.trim())) {
    errorMessage.value = 'Địa chỉ email không đúng định dạng';
    return;
  }

  isLoading.value = true;
  try {
    await apiClient.post('/auth/forgot-password', { email: email.value.trim() });
    step.value = 2;
    startCountdown();
  } catch (err) {
    errorMessage.value = err.message || 'Có lỗi xảy ra. Vui lòng thử lại';
  } finally {
    isLoading.value = false;
  }
}

// ─── Bước 2: Xác minh OTP ────────────────────────────────────────────────────
async function handleVerifyOtp() {
  errorMessage.value = '';
  if (otpCode.value.length < 6) {
    errorMessage.value = 'Vui lòng nhập đủ 6 chữ số của mã xác nhận';
    return;
  }

  isLoading.value = true;
  try {
    await apiClient.post('/auth/verify-otp', { email: email.value.trim(), otp: otpCode.value });
    clearInterval(countdownTimer);
    step.value = 3;
  } catch (err) {
    errorMessage.value = err.message || 'Mã xác nhận không đúng hoặc đã hết hạn';
  } finally {
    isLoading.value = false;
  }
}

// ─── Gửi lại OTP ─────────────────────────────────────────────────────────────
async function handleResendOtp() {
  errorMessage.value = '';
  otp.value = ['', '', '', '', '', ''];
  isLoading.value = true;
  try {
    await apiClient.post('/auth/forgot-password', { email: email.value.trim() });
    startCountdown();
    const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
    Toast.fire({ icon: 'success', title: 'Đã gửi lại mã xác nhận mới!' });
  } catch (err) {
    errorMessage.value = err.message || 'Có lỗi xảy ra. Vui lòng thử lại';
  } finally {
    isLoading.value = false;
  }
}

// ─── Bước 3: Đặt lại mật khẩu ───────────────────────────────────────────────
async function handleResetPassword() {
  errorMessage.value = '';
  if (!newPassword.value || newPassword.value.length < 6) {
    errorMessage.value = 'Mật khẩu mới phải chứa ít nhất 6 ký tự';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Xác nhận mật khẩu không khớp. Vui lòng kiểm tra lại';
    return;
  }

  isLoading.value = true;
  try {
    await apiClient.post('/auth/reset-password', {
      email: email.value.trim(),
      otp: otpCode.value,
      newPassword: newPassword.value
    });

    await Swal.fire({
      icon: 'success',
      title: 'Đặt lại mật khẩu thành công!',
      text: 'Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.',
      confirmButtonText: 'Đăng nhập ngay',
      confirmButtonColor: '#1a56db'
    });
    router.push('/login');
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="container py-5">
    <div class="row justify-content-center align-items-center py-lg-4">
      <div class="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
        <div class="card border border-light-subtle shadow-lg rounded-4 p-4 p-md-5 bg-white">

          <!-- ── Logo & Tiêu đề ── -->
          <div class="text-center mb-4">
            <img src="/logo.png" alt="Logo" class="mx-auto mb-3 rounded-4 bg-white p-2 shadow-sm border" style="width:64px;height:64px;object-fit:contain;" />
            <h3 class="fw-bolder text-dark mb-1">Quên Mật Khẩu</h3>
            <p class="text-secondary small mb-0">Đặt lại mật khẩu qua mã xác nhận email</p>
          </div>

          <!-- ── Thanh bước (Step Indicator) ── -->
          <div class="d-flex align-items-center justify-content-center mb-4 gap-1">
            <template v-for="s in 3" :key="s">
              <div
                class="step-dot rounded-circle d-flex align-items-center justify-content-center fw-semibold small"
                :class="step >= s ? 'bg-primary text-white' : 'bg-light text-secondary border'"
                style="width:30px;height:30px;font-size:13px;"
              >
                <i v-if="step > s" class="bi bi-check-lg" style="font-size:12px;"></i>
                <span v-else>{{ s }}</span>
              </div>
              <div v-if="s < 3" class="flex-grow-1" style="height:2px;" :class="step > s ? 'bg-primary' : 'bg-light border-bottom'"></div>
            </template>
          </div>
          <p class="text-center small text-secondary mb-4" style="margin-top:-8px;">
            <span v-if="step === 1">Nhập email đã đăng ký</span>
            <span v-if="step === 2">Nhập mã xác nhận</span>
            <span v-if="step === 3">Tạo mật khẩu mới</span>
          </p>

          <!-- ── Alert lỗi ── -->
          <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show d-flex align-items-center small py-2 px-3 mb-3 rounded-3" role="alert">
            <i class="bi bi-exclamation-circle-fill fs-5 me-2 flex-shrink-0"></i>
            <div>{{ errorMessage }}</div>
            <button type="button" class="btn-close py-2" @click="errorMessage = ''" aria-label="Close"></button>
          </div>

          <!-- ══════════════════════════════════════
               BƯỚC 1: Nhập email
          ══════════════════════════════════════ -->
          <form v-if="step === 1" @submit.prevent="handleSendOtp">
            <div class="mb-3">
              <label for="fpEmail" class="form-label small fw-semibold text-dark">
                Địa chỉ Email <span class="text-danger">*</span>
              </label>
              <div class="input-group">
                <span class="input-group-text bg-light text-secondary border-end-0">
                  <i class="bi bi-envelope"></i>
                </span>
                <input
                  id="fpEmail"
                  v-model="email"
                  type="email"
                  class="form-control border-start-0 ps-0"
                  placeholder="name@example.com"
                  autocomplete="email"
                  required
                />
              </div>
              <div class="form-text text-secondary mt-2">
                <i class="bi bi-info-circle me-1"></i>
                Chúng tôi sẽ gửi mã xác nhận gồm 6 chữ số đến email này.
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-100 py-2 mb-3" :disabled="isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              <span v-if="isLoading">Đang gửi mã...</span>
              <span v-else><i class="bi bi-send me-1"></i> Gửi mã xác nhận</span>
            </button>
          </form>

          <!-- ══════════════════════════════════════
               BƯỚC 2: Nhập OTP
          ══════════════════════════════════════ -->
          <form v-if="step === 2" @submit.prevent="handleVerifyOtp">
            <div class="text-center mb-3">
              <div class="small text-secondary mb-1">Mã xác nhận đã được gửi đến</div>
              <strong class="text-primary">{{ email }}</strong>
            </div>

            <!-- 6 ô OTP -->
            <div class="d-flex gap-2 justify-content-center mb-3">
              <input
                v-for="(_, i) in otp"
                :key="i"
                :id="`otp-${i}`"
                v-model="otp[i]"
                type="text"
                inputmode="numeric"
                maxlength="1"
                class="form-control text-center fw-bold fs-4 p-0 otp-input"
                style="width:44px;height:52px;border-radius:8px;"
                :class="otp[i] ? 'border-primary' : ''"
                @input="onOtpInput(i, $event)"
                @keydown="onOtpKeydown(i, $event)"
                @paste="i === 0 ? onOtpPaste($event) : null"
                autocomplete="off"
              />
            </div>

            <!-- Đếm ngược -->
            <div class="text-center mb-3">
              <span v-if="!isExpired" class="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 rounded-pill">
                <i class="bi bi-clock me-1"></i>Mã hết hạn sau: <strong>{{ countdownText }}</strong>
              </span>
              <span v-else class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-pill">
                <i class="bi bi-x-circle me-1"></i>Mã xác nhận đã hết hạn
              </span>
            </div>

            <button type="submit" class="btn btn-primary w-100 py-2 mb-2" :disabled="isLoading || isExpired || otpCode.length < 6">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              <span v-if="isLoading">Đang xác minh...</span>
              <span v-else><i class="bi bi-shield-check me-1"></i> Xác nhận mã</span>
            </button>

            <button type="button" class="btn btn-outline-secondary w-100 py-2 mb-2 small" @click="handleResendOtp" :disabled="isLoading || !isExpired">
              <i class="bi bi-arrow-clockwise me-1"></i>
              {{ isExpired ? 'Gửi lại mã mới' : `Gửi lại sau ${countdownText}` }}
            </button>
          </form>

          <!-- ══════════════════════════════════════
               BƯỚC 3: Đặt mật khẩu mới
          ══════════════════════════════════════ -->
          <form v-if="step === 3" @submit.prevent="handleResetPassword">
            <!-- Mật khẩu mới -->
            <div class="mb-3">
              <label for="newPassword" class="form-label small fw-semibold text-dark">
                Mật khẩu mới <span class="text-danger">*</span>
              </label>
              <div class="input-group">
                <span class="input-group-text bg-light text-secondary border-end-0">
                  <i class="bi bi-lock"></i>
                </span>
                <input
                  id="newPassword"
                  v-model="newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  class="form-control border-start-0 border-end-0 ps-0"
                  placeholder="Tối thiểu 6 ký tự"
                  autocomplete="new-password"
                  required
                />
                <button type="button" @click="showNewPassword = !showNewPassword"
                  class="input-group-text bg-light text-secondary border-start-0" tabindex="-1">
                  <i :class="showNewPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
            </div>

            <!-- Xác nhận mật khẩu -->
            <div class="mb-4">
              <label for="confirmPassword" class="form-label small fw-semibold text-dark">
                Xác nhận mật khẩu <span class="text-danger">*</span>
              </label>
              <div class="input-group">
                <span class="input-group-text bg-light text-secondary border-end-0">
                  <i class="bi bi-lock-fill"></i>
                </span>
                <input
                  id="confirmPassword"
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="form-control border-start-0 border-end-0 ps-0"
                  :class="confirmPassword && newPassword !== confirmPassword ? 'border-danger' : ''"
                  placeholder="Nhập lại mật khẩu mới"
                  autocomplete="new-password"
                  required
                />
                <button type="button" @click="showConfirmPassword = !showConfirmPassword"
                  class="input-group-text bg-light text-secondary border-start-0" tabindex="-1">
                  <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
              <div v-if="confirmPassword && newPassword !== confirmPassword" class="form-text text-danger mt-1">
                <i class="bi bi-x-circle me-1"></i>Mật khẩu không khớp
              </div>
            </div>

            <button type="submit" class="btn btn-success w-100 py-2 mb-2"
              :disabled="isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              <span v-if="isLoading">Đang cập nhật...</span>
              <span v-else><i class="bi bi-check-circle me-1"></i> Đặt lại mật khẩu</span>
            </button>
          </form>

          <!-- ── Link quay lại đăng nhập ── -->
          <div class="text-center small text-secondary mt-3 pt-3 border-top">
            <router-link to="/login" class="fw-semibold text-primary">
              <i class="bi bi-arrow-left me-1"></i>Quay lại trang đăng nhập
            </router-link>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.otp-input {
  font-family: 'Courier New', monospace;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.otp-input:focus {
  border-color: #1a56db;
  box-shadow: 0 0 0 3px rgba(26, 86, 219, 0.18);
}
</style>

