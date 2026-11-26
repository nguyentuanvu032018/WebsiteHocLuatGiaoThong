<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import Swal from 'sweetalert2';

const router = useRouter();
const authStore = useAuthStore();

// ─── State Điều khiển Bước (Step Control) ──────────────────────────────────
// step = 1: Nhập thông tin đăng ký
// step = 2: Nhập mã xác nhận OTP gửi về email
const step = ref(1);

// Dữ liệu form đăng ký
const fullName = ref('');
const email = ref('');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const agreeTerms = ref(true);
const avatarFile = ref(null);
const avatarPreview = ref(null);
const avatarFileInput = ref(null);

const onAvatarChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'Ảnh đại diện không được vượt quá 5MB';
    return;
  }
  avatarFile.value = file;
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value);
  avatarPreview.value = URL.createObjectURL(file);
};

const clearAvatar = () => {
  avatarFile.value = null;
  if (avatarPreview.value) {
    URL.revokeObjectURL(avatarPreview.value);
    avatarPreview.value = null;
  }
  if (avatarFileInput.value) avatarFileInput.value.value = '';
};

const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');

// ─── State Mã OTP ──────────────────────────────────────────────────────────
const otp = ref(['', '', '', '', '', '']); // 6 ô nhập mã OTP riêng biệt
const otpCode = computed(() => otp.value.join(''));

// Đếm ngược thời gian OTP (3 phút = 180 giây)
const countdown = ref(180);
let countdownTimer = null;

const countdownText = computed(() => {
  const m = Math.floor(countdown.value / 60);
  const s = countdown.value % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

const isExpired = computed(() => countdown.value <= 0);

// Khởi chạy đếm ngược 180s
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

// Dọn dẹp timer khi component bị hủy
onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
});

// Nếu đã đăng nhập thì tự động chuyển hướng
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.replace('/');
  }
});

// ─── Xử lý Nhập OTP (Tự động nhảy ô, Paste, Backspace) ─────────────────────
function onOtpInput(index, event) {
  const val = event.target.value.replace(/\D/g, '');
  otp.value[index] = val.slice(-1);
  if (val && index < 5) {
    const next = document.getElementById(`reg-otp-${index + 1}`);
    if (next) next.focus();
  }
}

function onOtpKeydown(index, event) {
  if (event.key === 'Backspace' && !otp.value[index] && index > 0) {
    const prev = document.getElementById(`reg-otp-${index - 1}`);
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
  const lastIndex = Math.min(pasted.length - 1, 5);
  const el = document.getElementById(`reg-otp-${lastIndex}`);
  if (el) el.focus();
}

// ─── BƯỚC 1: Xử lý Gửi thông tin và nhận OTP qua Email ────────────────────
const handleRegisterStep1 = async () => {
  errorMessage.value = '';

  // 1. Kiểm tra họ và tên
  if (!fullName.value.trim()) {
    errorMessage.value = 'Vui lòng nhập họ và tên của bạn';
    return;
  }

  // 2. Kiểm tra email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
    errorMessage.value = 'Vui lòng nhập địa chỉ email hợp lệ';
    return;
  }

  // 3. Kiểm tra mật khẩu
  if (!password.value || password.value.length < 6) {
    errorMessage.value = 'Mật khẩu phải có độ dài tối thiểu từ 6 ký tự';
    return;
  }

  // 4. Kiểm tra khớp mật khẩu
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Mật khẩu xác nhận không trùng khớp';
    return;
  }

  // 5. Kiểm tra điều khoản
  if (!agreeTerms.value) {
    errorMessage.value = 'Bạn cần đồng ý với điều khoản sử dụng hệ thống';
    return;
  }

  isSubmitting.value = true;

  try {
    const formData = new FormData();
    formData.append('fullName', fullName.value.trim());
    formData.append('email', email.value.trim());
    formData.append('password', password.value);
    if (phone.value.trim()) {
      formData.append('phone', phone.value.trim());
    }
    if (avatarFile.value) {
      formData.append('avatar', avatarFile.value);
    }

    const res = await authStore.sendRegisterOtp(formData);

    // Reset OTP và chuyển sang bước 2
    otp.value = ['', '', '', '', '', ''];
    step.value = 2;
    startCountdown();

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true
    });
    Toast.fire({
      icon: 'info',
      title: res.message || 'Mã xác nhận đã được gửi đến email của bạn!'
    });
  } catch (error) {
    errorMessage.value = error.message || 'Không thể gửi mã xác nhận. Vui lòng kiểm tra lại thông tin.';
  } finally {
    isSubmitting.value = false;
  }
};

// ─── BƯỚC 2: Xác thực OTP và Hoàn tất tạo tài khoản ───────────────────────
const handleVerifyAndComplete = async () => {
  errorMessage.value = '';

  if (otpCode.value.length < 6) {
    errorMessage.value = 'Vui lòng nhập đủ 6 chữ số của mã xác nhận';
    return;
  }

  isSubmitting.value = true;

  try {
    const res = await authStore.verifyRegisterOtp({
      email: email.value.trim(),
      otp: otpCode.value
    });

    clearInterval(countdownTimer);

    await Swal.fire({
      icon: 'success',
      title: 'Đăng ký thành công! 🎉',
      text: `Chào mừng ${fullName.value} đã gia nhập hệ thống ôn thi sát hạch Tập Lái 24h!`,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Bắt đầu ôn thi ngay'
    });

    router.push('/exam');
  } catch (error) {
    errorMessage.value = error.message || 'Mã xác nhận không đúng hoặc đã hết hạn';
  } finally {
    isSubmitting.value = false;
  }
};

// ─── Gửi lại mã OTP ───────────────────────────────────────────────────────
const handleResendOtp = async () => {
  errorMessage.value = '';
  otp.value = ['', '', '', '', '', ''];
  isSubmitting.value = true;

  try {
    await authStore.sendRegisterOtp({
      fullName: fullName.value.trim(),
      email: email.value.trim(),
      password: password.value,
      phone: phone.value.trim() || null
    });

    startCountdown();

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
    Toast.fire({
      icon: 'success',
      title: 'Đã gửi lại mã xác nhận mới đến email!'
    });
  } catch (error) {
    errorMessage.value = error.message || 'Không thể gửi lại mã. Vui lòng thử lại sau.';
  } finally {
    isSubmitting.value = false;
  }
};

// Quay lại bước 1 để chỉnh sửa thông tin
const handleBackToStep1 = () => {
  clearInterval(countdownTimer);
  errorMessage.value = '';
  step.value = 1;
};
</script>

<template>
  <div class="container py-5">
    <div class="row justify-content-center align-items-center py-lg-4">
      <div class="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
        <!-- Auth Card -->
        <div class="card border border-light-subtle shadow-lg rounded-4 p-4 p-md-5 bg-white">
          <!-- Logo & Header -->
          <div class="text-center mb-4">
            <img src="/logo.png" alt="Logo GPLX" class="mx-auto mb-3 rounded-4 bg-white p-2 shadow-sm border" style="width: 64px; height: 64px; object-fit: contain;" />
            <h3 class="fw-bolder text-dark mb-1">Đăng Ký Tài Khoản</h3>
            <p class="text-secondary small mb-0">Tạo tài khoản học viên để thi thử và theo dõi tiến độ</p>
          </div>

          <!-- ── Thanh tiến trình (Step Indicator) ── -->
          <div class="d-flex align-items-center justify-content-center mb-4 gap-1">
            <div
              class="step-dot rounded-circle d-flex align-items-center justify-content-center fw-semibold small"
              :class="step >= 1 ? 'bg-primary text-white' : 'bg-light text-secondary border'"
              style="width: 32px; height: 32px; font-size: 13px;"
            >
              <i v-if="step > 1" class="bi bi-check-lg" style="font-size: 14px;"></i>
              <span v-else>1</span>
            </div>
            <div class="flex-grow-1" style="height: 2px; max-width: 80px;" :class="step > 1 ? 'bg-primary' : 'bg-light border-bottom'"></div>
            <div
              class="step-dot rounded-circle d-flex align-items-center justify-content-center fw-semibold small"
              :class="step >= 2 ? 'bg-primary text-white' : 'bg-light text-secondary border'"
              style="width: 32px; height: 32px; font-size: 13px;"
            >
              2
            </div>
          </div>
          <p class="text-center small text-secondary mb-4" style="margin-top: -8px;">
            <span v-if="step === 1" class="fw-medium text-dark"><i class="bi bi-pencil-square me-1 text-primary"></i>Bước 1: Điền thông tin học viên</span>
            <span v-if="step === 2" class="fw-medium text-primary"><i class="bi bi-envelope-check me-1"></i>Bước 2: Xác thực mã OTP qua email</span>
          </p>

          <!-- Alert Error Message -->
          <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show d-flex align-items-center small py-2 px-3 mb-3 rounded-3" role="alert">
            <i class="bi bi-exclamation-circle-fill fs-5 me-2 flex-shrink-0"></i>
            <div>{{ errorMessage }}</div>
            <button type="button" class="btn-close py-2" @click="errorMessage = ''" aria-label="Close"></button>
          </div>

          <!-- ═════════════════════════════════════════════════════════════════
               BƯỚC 1: FORM NHẬP THÔNG TIN ĐĂNG KÝ
          ═════════════════════════════════════════════════════════════════ -->
          <form v-if="step === 1" @submit.prevent="handleRegisterStep1">
            <!-- Optional Avatar Picker -->
            <div class="d-flex flex-column align-items-center mb-3 pb-2 border-bottom">
              <div class="position-relative">
                <template v-if="avatarPreview">
                  <img 
                    :src="avatarPreview" 
                    alt="Preview Avatar" 
                    class="rounded-circle object-fit-cover shadow-sm border border-2 border-primary"
                    style="width: 72px; height: 72px;"
                  />
                  <button 
                    type="button" 
                    class="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center shadow-sm"
                    style="width: 22px; height: 22px; font-size: 11px;"
                    title="Xóa ảnh"
                    @click="clearAvatar"
                  >
                    <i class="bi bi-x"></i>
                  </button>
                </template>
                <template v-else>
                  <div 
                    class="rounded-circle bg-light border border-2 border-dashed border-primary-subtle d-flex flex-column align-items-center justify-content-center text-primary shadow-sm"
                    style="width: 72px; height: 72px; cursor: pointer;"
                    @click="avatarFileInput?.click()"
                    title="Bấm để chọn ảnh đại diện"
                  >
                    <i class="bi bi-camera-fill fs-5"></i>
                  </div>
                </template>
              </div>
              <input 
                type="file" 
                ref="avatarFileInput" 
                class="d-none" 
                accept="image/png,image/jpeg,image/webp,image/gif"
                @change="onAvatarChange"
              />
              <button 
                type="button" 
                class="btn btn-link btn-sm text-decoration-none text-secondary p-0 mt-1" 
                style="font-size: 12px;"
                @click="avatarFileInput?.click()"
              >
                {{ avatarPreview ? 'Đổi ảnh đại diện' : 'Thêm ảnh đại diện (tùy chọn)' }}
              </button>
            </div>

            <!-- Full Name Input -->
            <div class="mb-3">
              <label for="regFullName" class="form-label small fw-semibold text-dark">
                Họ và tên thí sinh <span class="text-danger">*</span>
              </label>
              <div class="input-group">
                <span class="input-group-text bg-light text-secondary border-end-0">
                  <i class="bi bi-person"></i>
                </span>
                <input 
                  id="regFullName"
                  v-model="fullName" 
                  type="text" 
                  class="form-control border-start-0 ps-0" 
                  placeholder="Ví dụ: Nguyễn Văn A"
                  required 
                />
              </div>
            </div>

            <!-- Email Input -->
            <div class="mb-3">
              <label for="regEmail" class="form-label small fw-semibold text-dark">
                Địa chỉ Email <span class="text-danger">*</span>
              </label>
              <div class="input-group">
                <span class="input-group-text bg-light text-secondary border-end-0">
                  <i class="bi bi-envelope"></i>
                </span>
                <input 
                  id="regEmail"
                  v-model="email" 
                  type="email" 
                  class="form-control border-start-0 ps-0" 
                  placeholder="name@example.com"
                  autocomplete="username"
                  required 
                />
              </div>
              <div class="form-text text-muted" style="font-size: 11.5px;">
                <i class="bi bi-info-circle me-1"></i>Hệ thống sẽ gửi mã OTP kích hoạt 3 phút đến email này.
              </div>
            </div>

            <!-- Phone Input (Optional) -->
            <div class="mb-3">
              <label for="regPhone" class="form-label small fw-semibold text-dark">
                Số điện thoại liên hệ <span class="text-muted fw-normal">(tùy chọn)</span>
              </label>
              <div class="input-group">
                <span class="input-group-text bg-light text-secondary border-end-0">
                  <i class="bi bi-telephone"></i>
                </span>
                <input 
                  id="regPhone"
                  v-model="phone" 
                  type="tel" 
                  class="form-control border-start-0 ps-0" 
                  placeholder="0912345678"
                />
              </div>
            </div>

            <!-- Password Input -->
            <div class="mb-3">
              <label for="regPassword" class="form-label small fw-semibold text-dark">
                Mật khẩu <span class="text-danger">*</span>
              </label>
              <div class="input-group">
                <span class="input-group-text bg-light text-secondary border-end-0">
                  <i class="bi bi-lock"></i>
                </span>
                <input 
                  id="regPassword"
                  v-model="password" 
                  :type="showPassword ? 'text' : 'password'" 
                  class="form-control border-start-0 border-end-0 ps-0" 
                  placeholder="Tối thiểu 6 ký tự"
                  autocomplete="new-password"
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

            <!-- Confirm Password Input -->
            <div class="mb-3">
              <label for="regConfirmPassword" class="form-label small fw-semibold text-dark">
                Xác nhận mật khẩu <span class="text-danger">*</span>
              </label>
              <div class="input-group">
                <span class="input-group-text bg-light text-secondary border-end-0">
                  <i class="bi bi-shield-lock"></i>
                </span>
                <input 
                  id="regConfirmPassword"
                  v-model="confirmPassword" 
                  :type="showConfirmPassword ? 'text' : 'password'" 
                  class="form-control border-start-0 border-end-0 ps-0" 
                  placeholder="Nhập lại mật khẩu"
                  autocomplete="new-password"
                  required 
                />
                <button 
                  type="button" 
                  @click="showConfirmPassword = !showConfirmPassword" 
                  class="input-group-text bg-light text-secondary border-start-0 cursor-pointer"
                  tabindex="-1"
                  title="Hiện/Ẩn mật khẩu"
                >
                  <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
            </div>

            <!-- Terms Agreement -->
            <div class="mb-4">
              <div class="form-check">
                <input 
                  id="agreeTerms" 
                  v-model="agreeTerms" 
                  type="checkbox" 
                  class="form-check-input"
                  required
                />
                <label for="agreeTerms" class="form-check-label small text-secondary">
                  Tôi đồng ý với quy chế thi thử và điều khoản sử dụng
                </label>
              </div>
            </div>

            <!-- Submit Button (Hoàn tất đăng ký) -->
            <button 
              type="submit" 
              class="btn btn-primary w-100 py-2 fs-6 mb-3 shadow-sm"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              <span v-if="isSubmitting">Đang kiểm tra & gửi mã xác nhận...</span>
              <span v-else><i class="bi bi-check2-circle me-1"></i> Hoàn tất đăng ký</span>
            </button>
          </form>

          <!-- ═════════════════════════════════════════════════════════════════
               BƯỚC 2: FORM NHẬP MÃ XÁC NHẬN OTP (3 PHÚT)
          ═════════════════════════════════════════════════════════════════ -->
          <form v-if="step === 2" @submit.prevent="handleVerifyAndComplete">
            <div class="text-center mb-3">
              <div class="small text-secondary mb-1">Mã xác nhận 6 chữ số đã được gửi đến:</div>
              <strong class="text-primary fs-6">{{ email }}</strong>
              <div class="text-muted mt-1" style="font-size: 12px;">
                Vui lòng kiểm tra hộp thư đến (hoặc hòm thư Spam/Rác).
              </div>
            </div>

            <!-- 6 ô nhập mã OTP -->
            <div class="d-flex gap-2 justify-content-center mb-3">
              <input
                v-for="(_, i) in otp"
                :key="i"
                :id="`reg-otp-${i}`"
                v-model="otp[i]"
                type="text"
                inputmode="numeric"
                maxlength="1"
                class="form-control text-center fw-bold fs-4 p-0 otp-input"
                style="width: 44px; height: 52px; border-radius: 8px;"
                :class="otp[i] ? 'border-primary' : ''"
                @input="onOtpInput(i, $event)"
                @keydown="onOtpKeydown(i, $event)"
                @paste="i === 0 ? onOtpPaste($event) : null"
                autocomplete="off"
              />
            </div>

            <!-- Đồng hồ đếm ngược 3 phút -->
            <div class="text-center mb-3">
              <span v-if="!isExpired" class="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 rounded-pill">
                <i class="bi bi-clock me-1"></i>Mã có hiệu lực trong: <strong>{{ countdownText }}</strong>
              </span>
              <span v-else class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-pill">
                <i class="bi bi-x-circle me-1"></i>Mã xác nhận đã hết hạn (3 phút)
              </span>
            </div>

            <!-- Nút Xác nhận tạo tài khoản -->
            <button 
              type="submit" 
              class="btn btn-primary w-100 py-2 mb-2 shadow-sm" 
              :disabled="isSubmitting || isExpired || otpCode.length < 6"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
              <span v-if="isSubmitting">Đang kích hoạt tài khoản...</span>
              <span v-else><i class="bi bi-shield-check me-1"></i> Xác nhận & Hoàn tất tạo tài khoản</span>
            </button>

            <!-- Nút Gửi lại mã -->
            <button 
              type="button" 
              class="btn btn-outline-secondary w-100 py-2 mb-2 small" 
              @click="handleResendOtp" 
              :disabled="isSubmitting || !isExpired"
            >
              <i class="bi bi-arrow-clockwise me-1"></i>
              {{ isExpired ? 'Gửi lại mã xác nhận mới' : `Gửi lại mã sau ${countdownText}` }}
            </button>

            <!-- Nút Quay lại Bước 1 -->
            <div class="text-center mt-3">
              <button 
                type="button" 
                class="btn btn-link text-secondary text-decoration-none small p-0" 
                @click="handleBackToStep1"
                :disabled="isSubmitting"
              >
                <i class="bi bi-arrow-left me-1"></i>Quay lại chỉnh sửa thông tin
              </button>
            </div>
          </form>

          <!-- Login Navigation Link -->
          <div class="text-center small text-secondary mt-3 pt-3 border-top">
            Đã có tài khoản học viên? 
            <router-link to="/login" class="fw-bold text-primary">
              Đăng nhập ngay
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.otp-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 0.25rem rgba(37, 99, 235, 0.15);
}
.cursor-pointer {
  cursor: pointer;
}
</style>
