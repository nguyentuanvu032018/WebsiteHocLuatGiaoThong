<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import apiClient from '../../services/api';
import Swal from 'sweetalert2';
import { getGroupLicenseTypes, getLicenseGroup } from '../../utils/licenseGroups';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const licenseTypes = ref([]);
const isLoading = ref(false);
const isGenerating = ref(false);
const generatingCode = ref(null);
const errorMessage = ref('');
const groupCode = computed(() => getLicenseGroup(route.query.group)?.code || null);
const selectedGroup = computed(() => getLicenseGroup(groupCode.value));
const visibleLicenseTypes = computed(() => selectedGroup.value
  ? getGroupLicenseTypes(licenseTypes.value, groupCode.value)
  : licenseTypes.value);

// Load danh sách hạng bằng từ API
const loadLicenseTypes = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const res = await apiClient.get('/exams/license-types');
    if (res.success && res.data?.licenseTypes) {
      licenseTypes.value = res.data.licenseTypes;
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải danh sách hạng bằng lái xe';
  } finally {
    isLoading.value = false;
  }
};

// Khởi tạo bài thi sát hạch cho hạng bằng đã chọn
const startExam = async (license) => {
  // 1. Kiểm tra đăng nhập
  if (!authStore.isAuthenticated) {
    const confirmLogin = await Swal.fire({
      title: 'Yêu cầu đăng nhập',
      text: 'Bạn cần đăng nhập tài khoản học viên để hệ thống cấp đề thi và ghi nhận kết quả.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Đăng nhập ngay',
      cancelButtonText: 'Để sau'
    });

    if (confirmLogin.isConfirmed) {
      router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`);
    }
    return;
  }

  // 2. Gọi API sinh đề thi ngẫu nhiên theo ma trận
  isGenerating.value = true;
  generatingCode.value = license.code;

  try {
    const res = await apiClient.post('/exams/generate', {
      licenseTypeId: license.id,
      licenseCode: license.code
    });

    if (res.success && res.data?.examSession) {
      const sessionId = res.data.examSession.id;
      
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true
      });
      Toast.fire({
        icon: 'success',
        title: `Đã sinh đề thi Hạng ${license.code}! Đang vào phòng thi...`
      });

      router.push(`/exam/room/${sessionId}`);
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Không thể tạo đề thi',
      text: err.message || 'Có lỗi xảy ra khi tạo đề thi ngẫu nhiên'
    });
  } finally {
    isGenerating.value = false;
    generatingCode.value = null;
  }
};

// Lấy icon minh họa phương tiện theo hạng bằng
const getLicenseIcon = (code) => {
  switch (code) {
    case 'A':
    case 'A1':
      return 'bi-bicycle text-primary';
    case 'B':
    case 'B1':
      return 'bi-car-front-fill text-success';
    case 'C':
    case 'C1':
      return 'bi-truck text-warning';
    case 'D':
    case 'D1':
    case 'D2':
      return 'bi-bus-front-fill text-info';
    default:
      return 'bi-speedometer text-secondary';
  }
};

onMounted(() => {
  loadLicenseTypes();
});

watch(groupCode, () => {
  loadLicenseTypes();
});
</script>

<template>
  <div class="container py-4 py-lg-5">
    <!-- Breadcrumb & Header Title -->
    <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
      <div>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb small mb-1">
            <li class="breadcrumb-item"><router-link to="/">Trang chủ</router-link></li>
            <li v-if="selectedGroup" class="breadcrumb-item">
              <router-link :to="`/study?group=${groupCode}`">Ôn thi hạng {{ selectedGroup.label }}</router-link>
            </li>
            <li class="breadcrumb-item active" aria-current="page">Thi thử</li>
          </ol>
        </nav>
        <div class="d-flex align-items-center gap-2">
          <h2 class="fw-bolder text-dark mb-0">
            <i class="bi bi-laptop text-primary me-2"></i>
            {{ selectedGroup ? `Thi thử hạng ${selectedGroup.label}` : 'Thi Thử Sát Hạch Lý Thuyết Trực Tuyến' }}
          </h2>
          <span class="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 fs-xxs">Chuẩn Ma Trận 2026</span>
        </div>
        <p class="text-secondary small mt-1 mb-0">
          <template v-if="selectedGroup">
            Chọn hạng {{ selectedGroup.label }} để tạo đề thi theo ma trận riêng, có bấm giờ và chấm câu điểm liệt.
          </template>
          <template v-else>
            Hệ thống tự động bốc đề ngẫu nhiên theo đúng ma trận quy định của Bộ GTVT, bấm giờ đếm ngược và kiểm tra câu điểm liệt.
          </template>
        </p>
      </div>

      <!-- Quick Action: Go to Exam History -->
      <div>
        <router-link :to="{ path: '/exam/history', query: selectedGroup ? { group: groupCode } : {} }" class="btn btn-outline-primary px-3 py-2 fw-semibold">
          <i class="bi bi-clock-history me-1"></i> Xem lịch sử các lần thi
        </router-link>
      </div>
    </div>

    <!-- Exam Rules Notice Banner -->
    <div class="card border border-primary-subtle bg-primary-subtle bg-opacity-10 rounded-4 p-3 p-md-4 mb-4">
      <div class="d-flex align-items-start gap-3">
        <div class="text-primary fs-2 lh-1 flex-shrink-0">
          <i class="bi bi-shield-check"></i>
        </div>
        <div>
          <h6 class="fw-bold text-primary mb-1">
            QUY CHẾ THI SÁT HẠCH LÝ THUYẾT LÁI XE BỘ GIAO THÔNG VẬN TẢI:
          </h6>
          <ul class="text-secondary small mb-0 ps-3 lh-base">
            <li>Đề thi được tạo ngẫu nhiên theo ma trận tỷ lệ câu hỏi từng chương giáo trình chuẩn.</li>
            <li>Đồng hồ đếm ngược tự động khóa bài khi hết thời gian quy định.</li>
            <li><strong class="text-danger">LƯU Ý ĐẶC BIỆT:</strong> Nếu làm <strong>sai câu hỏi điểm liệt</strong>, thí sinh sẽ bị <strong>TRƯỢT TRỰC TIẾP</strong> bất kể tổng điểm đạt bao nhiêu.</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <p class="text-muted fw-semibold">Đang tải danh mục các hạng bằng thi sát hạch...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="alert alert-danger rounded-4 p-4 text-center" role="alert">
      <i class="bi bi-exclamation-triangle-fill fs-2 text-danger mb-2"></i>
      <h5 class="fw-bold">Có lỗi xảy ra</h5>
      <p class="mb-3">{{ errorMessage }}</p>
      <button @click="loadLicenseTypes" class="btn btn-outline-danger btn-sm">
        <i class="bi bi-arrow-repeat me-1"></i> Thử lại
      </button>
    </div>

    <div v-else-if="selectedGroup && visibleLicenseTypes.length === 0" class="card border border-light-subtle shadow-sm rounded-4 p-5 text-center bg-white">
      <i class="bi bi-info-circle display-3 text-primary mb-3"></i>
      <h4 class="fw-bolder text-dark mb-2">Chưa có hạng bằng khả dụng</h4>
      <p class="text-secondary small mb-3">Nhóm hạng {{ selectedGroup.label }} hiện chưa có hạng bằng đang hoạt động.</p>
      <router-link :to="`/study?group=${groupCode}`" class="btn btn-outline-primary px-4">
        Quay lại ôn tập
      </router-link>
    </div>

    <!-- License Types Cards Grid -->
    <div v-else class="row g-4">
      <div
        v-for="license in visibleLicenseTypes"
        :key="license.id"
        class="col-12 col-sm-6 col-lg-3"
      >
        <div class="card-custom h-100 p-4 d-flex flex-column justify-content-between">
          <div>
            <!-- Header: Code & Icon -->
            <div class="d-flex align-items-center justify-content-between mb-3">
              <span class="badge bg-primary px-3 py-2 rounded-pill fw-bolder fs-5">
                {{ license.code }}
              </span>
              <div class="fs-2">
                <i :class="['bi', getLicenseIcon(license.code)]"></i>
              </div>
            </div>

            <!-- License Name & Description -->
            <h5 class="fw-bolder text-dark mb-1">
              {{ license.name }}
            </h5>
            <p class="text-secondary fs-xs mb-3 lh-sm">
              {{ license.description }}
            </p>

            <!-- Exam Specs Badges -->
            <div class="bg-light p-3 rounded-3 border mb-3">
              <div class="d-flex justify-content-between align-items-center small py-1 border-bottom">
                <span class="text-muted">Số lượng câu:</span>
                <span class="fw-bold text-dark">{{ license.totalQuestions }} câu</span>
              </div>
              <div class="d-flex justify-content-between align-items-center small py-1 border-bottom">
                <span class="text-muted">Thời gian làm bài:</span>
                <span class="fw-bold text-primary">{{ license.durationMinutes }} phút</span>
              </div>
              <div class="d-flex justify-content-between align-items-center small py-1">
                <span class="text-muted">Yêu cầu đạt:</span>
                <span class="fw-bold text-success">{{ license.passingScore }} / {{ license.totalQuestions }} câu</span>
              </div>
            </div>
          </div>

          <!-- Action Button: Start Exam -->
          <div>
            <button
              type="button"
              class="btn btn-primary w-100 py-2 fw-semibold shadow-sm"
              :disabled="isGenerating"
              @click="startExam(license)"
            >
              <span v-if="isGenerating && generatingCode === license.code" class="spinner-border spinner-border-sm me-2"></span>
              <span v-if="isGenerating && generatingCode === license.code">Đang tạo đề thi...</span>
              <span v-else><i class="bi bi-play-circle me-1"></i> Bắt đầu thi thử</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
