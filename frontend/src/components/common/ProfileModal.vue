<script setup>
import { computed, ref, watch } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { resolveAssetUrl } from '../../services/api';
import Swal from 'sweetalert2';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:show', 'saved']);

const authStore = useAuthStore();

const formData = ref({
  fullName: '',
  phone: ''
});

const selectedFile = ref(null);
const previewUrl = ref(null);
const removeAvatarFlag = ref(false);
const isSubmitting = ref(false);
const fileInputRef = ref(null);
const avatarError = ref(false);

const userInitial = computed(() => {
  const name = formData.value.fullName || authStore.userName || 'U';
  const parts = name.trim().split(' ');
  return parts[parts.length - 1].charAt(0).toUpperCase();
});

// Đồng bộ dữ liệu form khi modal mở ra
watch(() => props.show, (newVal) => {
  if (newVal && authStore.user) {
    formData.value.fullName = authStore.user.fullName || authStore.user.full_name || '';
    formData.value.phone = authStore.user.phone || '';
    selectedFile.value = null;
    previewUrl.value = null;
    removeAvatarFlag.value = false;
    avatarError.value = false;
  }
});

// Xử lý khi người dùng chọn tệp ảnh mới
const onFileSelected = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Kiểm tra kích thước tối đa 5MB
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({
      icon: 'warning',
      title: 'Tệp quá lớn',
      text: 'Vui lòng chọn tệp ảnh có dung lượng nhỏ hơn 5MB'
    });
    event.target.value = '';
    return;
  }

  // Kiểm tra định dạng ảnh
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    Swal.fire({
      icon: 'warning',
      title: 'Định dạng không hỗ trợ',
      text: 'Chỉ chấp nhận các tệp ảnh định dạng JPG, PNG, WEBP hoặc GIF'
    });
    event.target.value = '';
    return;
  }

  selectedFile.value = file;
  removeAvatarFlag.value = false;
  avatarError.value = false;

  // Tạo URL xem trước
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = URL.createObjectURL(file);
};

// Xử lý xóa ảnh đại diện (quay về chữ cái mặc định)
const handleRemoveAvatar = () => {
  selectedFile.value = null;
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
  removeAvatarFlag.value = true;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

// Đóng modal
const closeModal = () => {
  if (isSubmitting.value) return;
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
  emit('update:show', false);
};

// Xử lý lưu thông tin
const handleSubmit = async () => {
  if (!formData.value.fullName.trim()) {
    Swal.fire({
      icon: 'warning',
      title: 'Thiếu thông tin',
      text: 'Vui lòng nhập họ và tên của bạn'
    });
    return;
  }

  isSubmitting.value = true;

  try {
    const data = new FormData();
    data.append('fullName', formData.value.fullName.trim());
    if (formData.value.phone) {
      data.append('phone', formData.value.phone.trim());
    } else {
      data.append('phone', '');
    }

    if (selectedFile.value) {
      data.append('avatar', selectedFile.value);
    } else if (removeAvatarFlag.value) {
      data.append('removeAvatar', 'true');
    }

    const res = await authStore.updateProfile(data);

    Swal.fire({
      icon: 'success',
      title: 'Thành công',
      text: res.message || 'Cập nhật thông tin cá nhân thành công!',
      timer: 1800,
      showConfirmButton: false
    });

    emit('saved', authStore.user);
    closeModal();
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi cập nhật',
      text: error.message || 'Không thể lưu thay đổi. Vui lòng thử lại sau.'
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="show" 
      class="modal fade show d-block" 
      tabindex="-1" 
      style="background: rgba(15, 23, 42, 0.55); z-index: 1060;"
      @click.self="closeModal"
    >
      <div class="modal-dialog modal-dialog-centered" style="max-width: 520px;">
        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          
          <!-- Modal Header -->
          <div class="modal-header border-bottom bg-light px-4 py-3">
            <div class="d-flex align-items-center gap-2">
              <div class="icon-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center rounded-circle" style="width: 36px; height: 36px;">
                <i class="bi bi-person-gear fs-5"></i>
              </div>
              <div>
                <h6 class="modal-title fw-bold text-dark mb-0">Thông tin cá nhân</h6>
                <p class="text-muted fs-xxs mb-0">Quản lý và cập nhật thông tin tài khoản của bạn</p>
              </div>
            </div>
            <button 
              type="button" 
              class="btn-close" 
              :disabled="isSubmitting"
              @click="closeModal"
            ></button>
          </div>

          <!-- Modal Body -->
          <form @submit.prevent="handleSubmit">
            <div class="modal-body p-4">

              <!-- Avatar Preview & Upload Controls -->
              <div class="d-flex flex-column align-items-center mb-4 pb-3 border-bottom">
                <div class="position-relative mb-3">
                  <!-- Ảnh đại diện hiển thị -->
                  <template v-if="(previewUrl || (authStore.userAvatar && !removeAvatarFlag)) && !avatarError">
                    <img 
                      :src="previewUrl || resolveAssetUrl(authStore.userAvatar)" 
                      alt="Avatar" 
                      class="rounded-circle object-fit-cover shadow-sm border border-3 border-primary-subtle"
                      style="width: 96px; height: 96px;"
                      @error="avatarError = true"
                    />
                  </template>

                  <!-- Chữ cái mặc định nếu không có avatar -->
                  <template v-else>
                    <div 
                      class="rounded-circle bg-primary text-white fw-bold d-flex align-items-center justify-content-center shadow-sm border border-3 border-white"
                      style="width: 96px; height: 96px; font-size: 34px;"
                    >
                      {{ userInitial }}
                    </div>
                  </template>

                  <!-- Nút camera nhỏ ở góc -->
                  <button 
                    type="button" 
                    class="btn btn-primary btn-sm rounded-circle position-absolute bottom-0 end-0 p-0 d-flex align-items-center justify-content-center shadow"
                    style="width: 32px; height: 32px;"
                    title="Chọn ảnh đại diện mới"
                    @click="fileInputRef?.click()"
                  >
                    <i class="bi bi-camera-fill text-white fs-6"></i>
                  </button>
                </div>

                <!-- Input file ẩn -->
                <input 
                  type="file" 
                  ref="fileInputRef" 
                  class="d-none" 
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  @change="onFileSelected"
                />

                <!-- Nút thao tác ảnh -->
                <div class="d-flex align-items-center gap-2">
                  <button 
                    type="button" 
                    class="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 fw-medium"
                    @click="fileInputRef?.click()"
                  >
                    <i class="bi bi-upload me-1"></i> Tải ảnh đại diện lên
                  </button>

                  <button 
                    v-if="(authStore.userAvatar && !removeAvatarFlag) || previewUrl"
                    type="button" 
                    class="btn btn-outline-danger btn-sm rounded-pill px-3 py-1"
                    @click="handleRemoveAvatar"
                  >
                    <i class="bi bi-trash3 me-1"></i> Xóa ảnh
                  </button>
                </div>
              </div>

              <!-- Form Fields -->
              <div class="row g-3">
                
                <!-- Họ và tên -->
                <div class="col-12">
                  <label class="form-label small fw-semibold text-dark">
                    Họ và tên <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <span class="input-group-text bg-light text-muted border-end-0">
                      <i class="bi bi-person"></i>
                    </span>
                    <input 
                      type="text" 
                      v-model="formData.fullName"
                      class="form-control border-start-0 ps-0" 
                      placeholder="Nhập họ và tên..."
                      required
                    />
                  </div>
                </div>

                <!-- Địa chỉ Email (KHÔNG CHO PHÉP ĐỔI) -->
                <div class="col-12">
                  <label class="form-label small fw-semibold text-dark d-flex justify-content-between align-items-center">
                    <span>Địa chỉ Email</span>
                    <span class="badge bg-secondary-subtle text-secondary fs-xxs">Cố định</span>
                  </label>
                  <div class="input-group">
                    <span class="input-group-text bg-light text-muted border-end-0">
                      <i class="bi bi-envelope"></i>
                    </span>
                    <input 
                      type="email" 
                      :value="authStore.userEmail"
                      class="form-control bg-light text-muted border-start-0 ps-0" 
                      disabled
                      readonly
                    />
                    <span class="input-group-text bg-light text-muted border-start-0" title="Email định danh không thể thay đổi">
                      <i class="bi bi-lock-fill"></i>
                    </span>
                  </div>
                  <div class="form-text text-muted" style="font-size: 11.5px;">
                    <i class="bi bi-shield-check me-1 text-primary"></i>Email được cố định để xác thực bảo mật tài khoản và không thể chỉnh sửa.
                  </div>
                </div>

                <!-- Số điện thoại liên hệ -->
                <div class="col-12">
                  <label class="form-label small fw-semibold text-dark">
                    Số điện thoại liên hệ
                  </label>
                  <div class="input-group">
                    <span class="input-group-text bg-light text-muted border-end-0">
                      <i class="bi bi-telephone"></i>
                    </span>
                    <input 
                      type="tel" 
                      v-model="formData.phone"
                      class="form-control border-start-0 ps-0" 
                      placeholder="VD: 0912345678"
                    />
                  </div>
                </div>

                <!-- Vai trò tài khoản -->
                <div class="col-12">
                  <label class="form-label small fw-semibold text-dark">Vai trò tài khoản</label>
                  <div>
                    <span 
                      class="badge px-3 py-2 rounded-pill"
                      :class="authStore.isAdmin ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'"
                    >
                      <i :class="authStore.isAdmin ? 'bi bi-shield-lock-fill' : 'bi bi-mortarboard-fill'" class="me-1"></i>
                      {{ authStore.userRoleBadge }}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer border-top bg-light px-4 py-3">
              <button 
                type="button" 
                class="btn btn-outline-secondary px-3 py-2 rounded-3"
                :disabled="isSubmitting"
                @click="closeModal"
              >
                Hủy bỏ
              </button>
              
              <button 
                type="submit" 
                class="btn btn-primary px-4 py-2 rounded-3 fw-semibold shadow-sm d-flex align-items-center gap-2"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm"></span>
                <i v-else class="bi bi-check-lg"></i>
                <span>{{ isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi' }}</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.fs-xxs {
  font-size: 0.72rem;
}
.icon-circle {
  flex-shrink: 0;
}
</style>
