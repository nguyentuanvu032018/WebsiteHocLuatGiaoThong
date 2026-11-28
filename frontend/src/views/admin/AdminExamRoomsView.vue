<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '../../services/api';
import Swal from 'sweetalert2';

const router = useRouter();

// Trạng thái dữ liệu
const licenseTypes = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');
const searchKeyword = ref('');
const statusFilter = ref('all'); // all, active, inactive
const viewMode = ref('grid'); // grid (cards như ảnh), table

// State Modal Thêm / Sửa Phòng Thi
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);

const form = reactive({
  id: null,
  code: '',
  name: '',
  totalQuestions: 30,
  durationMinutes: 20,
  passingScore: 27,
  description: '',
  isActive: true
});

// State Modal Cấu hình Ma Trận Đề Thi
const showMatrixModal = ref(false);
const selectedRoom = ref(null);
const matrixRules = ref([]);
const isMatrixLoading = ref(false);
const isMatrixSaving = ref(false);

// Chỉ số thống kê (KPIs)
const totalRooms = computed(() => licenseTypes.value.length);
const activeRoomsCount = computed(() => licenseTypes.value.filter(l => l.isActive).length);
const inactiveRoomsCount = computed(() => licenseTypes.value.filter(l => !l.isActive).length);
const totalExamSessions = computed(() => {
  return licenseTypes.value.reduce((sum, l) => sum + (Number(l.totalSessions) || 0), 0);
});

// Danh sách sau khi tìm kiếm & lọc
const filteredLicenseTypes = computed(() => {
  let list = licenseTypes.value;

  // 1. Lọc theo trạng thái
  if (statusFilter.value === 'active') {
    list = list.filter(l => l.isActive);
  } else if (statusFilter.value === 'inactive') {
    list = list.filter(l => !l.isActive);
  }

  // 2. Tìm kiếm theo từ khóa
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.toLowerCase().trim();
    list = list.filter(l => 
      (l.code && l.code.toLowerCase().includes(kw)) ||
      (l.name && l.name.toLowerCase().includes(kw)) ||
      (l.description && l.description.toLowerCase().includes(kw))
    );
  }

  return list;
});

// Tính tổng số câu đã cấu hình trong modal ma trận
const matrixTotalConfigured = computed(() => {
  return matrixRules.value.reduce((sum, r) => sum + (Number(r.questionCount) || 0), 0);
});

const matrixTotalParalysis = computed(() => {
  return matrixRules.value.reduce((sum, r) => sum + (Number(r.paralysisCount) || 0), 0);
});

const isMatrixValid = computed(() => {
  if (!selectedRoom.value) return false;
  return matrixTotalConfigured.value === selectedRoom.value.totalQuestions;
});

// Icon minh họa phương tiện theo mã hạng
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
    default:
      return 'bi-speedometer text-secondary';
  }
};

// Tải danh sách phòng thi từ Backend
const fetchLicenseTypes = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const res = await apiClient.get('/admin/license-types');
    if (res.success && res.data?.licenseTypes) {
      licenseTypes.value = res.data.licenseTypes;
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải danh sách phòng thi sát hạch';
  } finally {
    isLoading.value = false;
  }
};

// Mở Modal Thêm mới
const openAddModal = () => {
  isEditing.value = false;
  form.id = null;
  form.code = '';
  form.name = '';
  form.totalQuestions = 30;
  form.durationMinutes = 20;
  form.passingScore = 27;
  form.description = '';
  form.isActive = true;
  showModal.value = true;
};

// Mở Modal Chỉnh sửa
const openEditModal = (room) => {
  isEditing.value = true;
  form.id = room.id;
  form.code = room.code;
  form.name = room.name;
  form.totalQuestions = room.totalQuestions;
  form.durationMinutes = room.durationMinutes;
  form.passingScore = room.passingScore;
  form.description = room.description || '';
  form.isActive = !!room.isActive;
  showModal.value = true;
};

// Đóng modal phòng thi
const closeModal = () => {
  showModal.value = false;
};

// Lưu phòng thi (Thêm mới / Cập nhật)
const handleSaveRoom = async () => {
  if (!form.code.trim()) {
    Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Vui lòng nhập mã hạng bằng (A, B1, C...)' });
    return;
  }
  if (!form.name.trim()) {
    Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Vui lòng nhập tên phòng thi sát hạch' });
    return;
  }
  if (form.totalQuestions <= 0 || form.durationMinutes <= 0 || form.passingScore <= 0) {
    Swal.fire({ icon: 'warning', title: 'Thông số không hợp lệ', text: 'Số câu, thời gian và điểm đạt phải lớn hơn 0' });
    return;
  }
  if (form.passingScore > form.totalQuestions) {
    Swal.fire({ icon: 'warning', title: 'Thông số không hợp lệ', text: 'Điểm yêu cầu đạt không được vượt quá tổng số câu hỏi' });
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      totalQuestions: Number(form.totalQuestions),
      durationMinutes: Number(form.durationMinutes),
      passingScore: Number(form.passingScore),
      description: form.description.trim(),
      isActive: form.isActive
    };

    if (isEditing.value) {
      const res = await apiClient.put(`/admin/license-types/${form.id}`, payload);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Cập nhật thành công',
          text: `Đã cập nhật phòng thi Hạng ${payload.code}!`,
          timer: 1500,
          showConfirmButton: false
        });
        showModal.value = false;
        await fetchLicenseTypes();
      }
    } else {
      const res = await apiClient.post('/admin/license-types', payload);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Thêm mới thành công',
          text: `Đã tạo phòng thi Hạng ${payload.code} cùng ma trận đề thi mặc định!`,
          timer: 2000,
          showConfirmButton: false
        });
        showModal.value = false;
        await fetchLicenseTypes();
      }
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi xử lý',
      text: err.message || 'Không thể lưu thông tin phòng thi'
    });
  } finally {
    isSubmitting.value = false;
  }
};

// Đóng / Mở phòng thi nhanh chóng (Toggle Active)
const toggleRoomStatus = async (room) => {
  const actionText = room.isActive ? 'ĐÓNG PHÒNG THI' : 'MỞ PHÒNG THI';
  const confirmMsg = room.isActive
    ? `Tạm đóng phòng thi Hạng ${room.code}? Thí sinh sẽ tạm thời không thể bắt đầu thi thử hạng này.`
    : `Mở lại phòng thi Hạng ${room.code} cho thí sinh tham gia sát hạch?`;

  const confirm = await Swal.fire({
    title: `Xác nhận ${actionText}?`,
    text: confirmMsg,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: room.isActive ? '#eab308' : '#10b981',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Xác nhận',
    cancelButtonText: 'Hủy'
  });

  if (!confirm.isConfirmed) return;

  try {
    const res = await apiClient.patch(`/admin/license-types/${room.id}/toggle-status`);
    if (res.success) {
      room.isActive = !room.isActive;
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: res.message || 'Đã thay đổi trạng thái phòng thi',
        timer: 1500,
        showConfirmButton: false
      });
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: err.message || 'Không thể thay đổi trạng thái phòng thi'
    });
  }
};

// Xóa phòng thi
const handleDeleteRoom = async (room) => {
  if (room.totalSessions > 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Không thể xóa phòng thi',
      html: `Phòng thi <strong>Hạng ${room.code}</strong> hiện đã có <strong>${room.totalSessions} lượt thi</strong> của học viên.<br><br><span class="text-secondary small">Để bảo toàn dữ liệu lịch sử thi cử, bạn chỉ có thể chọn <strong>"Đóng phòng thi"</strong> thay vì xóa khỏi hệ thống.</span>`,
      confirmButtonText: 'Đã hiểu'
    });
    return;
  }

  const result = await Swal.fire({
    title: `Xóa phòng thi Hạng ${room.code}?`,
    text: `Bạn có chắc chắn muốn xóa phòng thi "${room.name}"? Ma trận đề thi liên quan sẽ bị xóa theo.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Xóa vĩnh viễn',
    cancelButtonText: 'Hủy'
  });

  if (!result.isConfirmed) return;

  try {
    const res = await apiClient.delete(`/admin/license-types/${room.id}`);
    if (res.success) {
      Swal.fire({
        icon: 'success',
        title: 'Đã xóa',
        text: 'Đã xóa phòng thi sát hạch thành công.',
        timer: 1500,
        showConfirmButton: false
      });
      await fetchLicenseTypes();
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Không thể xóa',
      text: err.message || 'Đã xảy ra lỗi khi xóa phòng thi'
    });
  }
};

// =========================================================================
// QUẢN LÝ CẤU HÌNH MA TRẬN ĐỀ THI (EXAM MATRIX RULES)
// =========================================================================

const openMatrixModal = async (room) => {
  selectedRoom.value = room;
  showMatrixModal.value = true;
  isMatrixLoading.value = true;
  matrixRules.value = [];

  try {
    const res = await apiClient.get(`/admin/license-types/${room.id}/matrix`);
    if (res.success && res.data?.matrix) {
      matrixRules.value = res.data.matrix.map(m => ({
        chapterId: m.chapterId,
        chapterTitle: m.chapterTitle,
        orderNumber: m.orderNumber,
        totalQuestionsInBank: m.totalQuestionsInBank,
        paralysisInBank: m.paralysisInBank,
        questionCount: Number(m.questionCount || 0),
        paralysisCount: Number(m.paralysisCount || 0)
      }));
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi tải ma trận',
      text: err.message || 'Không thể tải cấu hình ma trận đề thi'
    });
    showMatrixModal.value = false;
  } finally {
    isMatrixLoading.value = false;
  }
};

const closeMatrixModal = () => {
  showMatrixModal.value = false;
  selectedRoom.value = null;
  matrixRules.value = [];
};

const handleSaveMatrix = async () => {
  if (!selectedRoom.value) return;

  const total = matrixTotalConfigured.value;
  const target = selectedRoom.value.totalQuestions;

  if (total !== target) {
    Swal.fire({
      icon: 'warning',
      title: 'Tổng số câu chưa khớp',
      html: `Hiện tại ma trận đang phân bổ <strong>${total} câu</strong>, nhưng phòng thi Hạng <strong>${selectedRoom.value.code}</strong> quy định <strong>${target} câu</strong>.<br>Vui lòng điều chỉnh số câu cho đúng chính xác ${target} câu.`
    });
    return;
  }

  isMatrixSaving.value = true;
  try {
    const payload = {
      rules: matrixRules.value.map(r => ({
        chapterId: r.chapterId,
        questionCount: Number(r.questionCount || 0),
        paralysisCount: Number(r.paralysisCount || 0)
      }))
    };

    const res = await apiClient.put(`/admin/license-types/${selectedRoom.value.id}/matrix`, payload);
    if (res.success) {
      Swal.fire({
        icon: 'success',
        title: 'Lưu thành công',
        text: `Đã lưu cấu hình ma trận đề thi cho Hạng ${selectedRoom.value.code}!`,
        timer: 1800,
        showConfirmButton: false
      });
      closeMatrixModal();
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi lưu ma trận',
      text: err.message || 'Không thể cập nhật ma trận đề thi'
    });
  } finally {
    isMatrixSaving.value = false;
  }
};

onMounted(() => {
  fetchLicenseTypes();
});
</script>

<template>
  <div class="admin-exam-rooms container-fluid px-0">
    <!-- Header Page -->
    <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
      <div>
        <!-- <nav aria-label="breadcrumb">
          <ol class="breadcrumb small mb-1">
            <li class="breadcrumb-item"><router-link to="/admin/dashboard" class="text-decoration-none">Dashboard</router-link></li>
            <li class="breadcrumb-item active" aria-current="page">Quản lý phòng thi</li>
          </ol>
        </nav> -->
        <div class="d-flex align-items-center gap-2">
          <h3 class="fw-bold text-dark mb-0">
            <!-- <i class="bi bi-laptop text-primary me-2"></i>-->Quản Lý Phòng Thi Sát Hạch 
          </h3>
          <!-- <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1 fs-xxs">
            9 Hạng Chuẩn Bộ GTVT
          </span> -->
        </div>
        <p class="text-secondary small mb-0 mt-1">
          Cấu hình thông số phòng thi sát hạch lý thuyết và điều phối ma trận phân bổ đề thi theo từng hạng bằng.
        </p>
      </div>

      <!-- Button Action -->
      <div class="d-flex align-items-center gap-2">
        <button 
          type="button" 
          class="btn btn-outline-secondary px-3 py-2 rounded-3 fw-semibold d-flex align-items-center gap-1 shadow-sm"
          @click="fetchLicenseTypes"
          :disabled="isLoading"
          title="Tải lại dữ liệu"
        >
          <i class="bi bi-arrow-clockwise" :class="{ 'spin-animate': isLoading }"></i>
          <span class="d-none d-sm-inline">Làm mới</span>
        </button>

        <button 
          type="button" 
          class="btn btn-primary px-3 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-sm"
          @click="openAddModal"
        >
          <i class="bi bi-plus-circle-fill"></i>
          <span>Thêm phòng thi mới</span>
        </button>
      </div>
    </div>

    <!-- ===================== KPI CARDS ===================== -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold d-block">Tổng số phòng thi</span>
              <h3 class="fw-bolder text-dark mb-0 mt-1">{{ totalRooms }}</h3>
              <span class="fs-xxs text-primary fw-semibold">Hạng A, A1, B, B1, C, C1...</span>
            </div>
            <div class="rounded-3 bg-primary bg-opacity-10 text-primary p-3 fs-3">
              <i class="bi bi-collection-play-fill"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold d-block">Đang mở phòng</span>
              <h3 class="fw-bolder text-success mb-0 mt-1">{{ activeRoomsCount }}</h3>
              <span class="fs-xxs text-success fw-semibold">Sẵn sàng phục vụ sát hạch</span>
            </div>
            <div class="rounded-3 bg-success bg-opacity-10 text-success p-3 fs-3">
              <i class="bi bi-check-circle-fill"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold d-block">Tạm đóng phòng</span>
              <h3 class="fw-bolder text-warning mb-0 mt-1">{{ inactiveRoomsCount }}</h3>
              <span class="fs-xxs text-secondary fw-semibold">Tạm khóa thi thử</span>
            </div>
            <div class="rounded-3 bg-warning bg-opacity-10 text-warning p-3 fs-3">
              <i class="bi bi-pause-circle-fill"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold d-block">Tổng lượt sát hạch</span>
              <h3 class="fw-bolder text-info mb-0 mt-1">{{ totalExamSessions }}</h3>
              <span class="fs-xxs text-info fw-semibold">Lượt thi đã khởi tạo</span>
            </div>
            <div class="rounded-3 bg-info bg-opacity-10 text-info p-3 fs-3">
              <i class="bi bi-person-workspace"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================== TOOLBAR & FILTER ===================== -->
    <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
      <div class="row g-2 align-items-center justify-content-between">
        <!-- Search Input -->
        <div class="col-12 col-md-5">
          <div class="input-group">
            <span class="input-group-text bg-light border-end-0 rounded-start-3 text-muted">
              <i class="bi bi-search"></i>
            </span>
            <input 
              v-model="searchKeyword" 
              type="text" 
              class="form-control bg-light border-start-0 rounded-end-3 py-2 small"
              placeholder="Tìm theo mã hạng (A, B1...), tên phòng thi hoặc mô tả..."
            />
            <button 
              v-if="searchKeyword" 
              @click="searchKeyword = ''" 
              class="btn btn-light border-0 text-muted" 
              type="button"
            >
              <i class="bi bi-x-circle-fill"></i>
            </button>
          </div>
        </div>

        <!-- Filter Status & View Switcher -->
        <div class="col-12 col-md-7 d-flex flex-wrap align-items-center justify-content-md-end gap-2">
          <!-- Status Filter Pills -->
          <div class="btn-group btn-group-sm" role="group">
            <button 
              type="button" 
              class="btn fw-semibold" 
              :class="statusFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'"
              @click="statusFilter = 'all'"
            >
              Tất cả ({{ totalRooms }})
            </button>
            <button 
              type="button" 
              class="btn fw-semibold" 
              :class="statusFilter === 'active' ? 'btn-success text-white' : 'btn-outline-secondary'"
              @click="statusFilter = 'active'"
            >
              Đang mở ({{ activeRoomsCount }})
            </button>
            <button 
              type="button" 
              class="btn fw-semibold" 
              :class="statusFilter === 'inactive' ? 'btn-warning text-dark' : 'btn-outline-secondary'"
              @click="statusFilter = 'inactive'"
            >
              Tạm đóng ({{ inactiveRoomsCount }})
            </button>
          </div>

          <!-- View Mode: Grid vs Table -->
          <div class="btn-group btn-group-sm ms-md-2" role="group">
            <button 
              type="button" 
              class="btn" 
              :class="viewMode === 'grid' ? 'btn-dark' : 'btn-outline-dark'"
              @click="viewMode = 'grid'"
              title="Chế độ lưới thẻ (như giao diện học viên)"
            >
              <i class="bi bi-grid-fill me-1"></i>Lưới thẻ
            </button>
            <button 
              type="button" 
              class="btn" 
              :class="viewMode === 'table' ? 'btn-dark' : 'btn-outline-dark'"
              @click="viewMode = 'table'"
              title="Chế độ bảng dữ liệu chi tiết"
            >
              <i class="bi bi-table me-1"></i>Bảng
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================== LOADING / ERROR STATES ===================== -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <p class="text-muted fw-semibold">Đang tải danh sách phòng thi sát hạch...</p>
    </div>

    <div v-else-if="errorMessage" class="alert alert-danger rounded-4 p-4 text-center shadow-sm">
      <i class="bi bi-exclamation-triangle-fill fs-2 text-danger mb-2 d-block"></i>
      <h5 class="fw-bold">Không thể tải dữ liệu phòng thi</h5>
      <p class="mb-3 small">{{ errorMessage }}</p>
      <button @click="fetchLicenseTypes" class="btn btn-outline-danger btn-sm rounded-3 px-3">
        <i class="bi bi-arrow-clockwise me-1"></i>Thử lại
      </button>
    </div>

    <div v-else-if="filteredLicenseTypes.length === 0" class="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
      <div class="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 70px; height: 70px;">
        <i class="bi bi-search text-muted fs-3"></i>
      </div>
      <h6 class="fw-bold text-dark mb-1">Không tìm thấy phòng thi phù hợp</h6>
      <p class="text-muted small mb-3">Vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
      <button @click="searchKeyword = ''; statusFilter = 'all'" class="btn btn-outline-primary btn-sm rounded-3 mx-auto">
        Xóa tìm kiếm
      </button>
    </div>

    <!-- ===================== VIEW 1: CARDS GRID (GIỐNG ẢNH NGƯỜI DÙNG) ===================== -->
    <div v-else-if="viewMode === 'grid'" class="row g-4 mb-4">
      <div
        v-for="room in filteredLicenseTypes"
        :key="room.id"
        class="col-12 col-sm-6 col-lg-4 col-xl-4"
      >
        <div class="card border-0 shadow-sm rounded-4 h-100 p-4 d-flex flex-column justify-content-between room-card transition-all"
             :class="{ 'opacity-75 bg-light': !room.isActive }">
          <div>
            <!-- Header: Badge mã hạng, Icon và Status -->
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-primary px-3 py-2 rounded-pill fw-bolder fs-5 shadow-xs">
                  {{ room.code }}
                </span>
                <span 
                  class="badge rounded-pill px-2.5 py-1 fs-xxs fw-bold"
                  :class="room.isActive ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' : 'bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25'"
                >
                  <i class="bi me-1" :class="room.isActive ? 'bi-check-circle-fill' : 'bi-pause-circle-fill'"></i>
                  {{ room.isActive ? 'ĐANG MỞ THI' : 'TẠM ĐÓNG' }}
                </span>
              </div>
              <div class="fs-2">
                <i :class="['bi', getLicenseIcon(room.code)]"></i>
              </div>
            </div>

            <!-- Tên & Mô tả -->
            <h5 class="fw-bolder text-dark mb-1 lh-sm">
              {{ room.name }}
            </h5>
            <p class="text-secondary fs-xs mb-3 lh-sm text-truncate-2" style="min-height: 2.4em;">
              {{ room.description || 'Chưa có thông tin mô tả quy chuẩn phương tiện.' }}
            </p>

            <!-- Khung thông số chuẩn GTVT (Y hệt trong ảnh) -->
            <div class="bg-light p-3 rounded-3 border mb-3">
              <div class="d-flex justify-content-between align-items-center small py-1.5 border-bottom">
                <span class="text-muted fw-medium">Số lượng câu:</span>
                <span class="fw-bold text-dark">{{ room.totalQuestions }} câu</span>
              </div>
              <div class="d-flex justify-content-between align-items-center small py-1.5 border-bottom">
                <span class="text-muted fw-medium">Thời gian làm bài:</span>
                <span class="fw-bold text-primary">{{ room.durationMinutes }} phút</span>
              </div>
              <div class="d-flex justify-content-between align-items-center small py-1.5 border-bottom">
                <span class="text-muted fw-medium">Yêu cầu đạt:</span>
                <span class="fw-bold text-success">{{ room.passingScore }} / {{ room.totalQuestions }} câu</span>
              </div>
              <div class="d-flex justify-content-between align-items-center small py-1.5">
                <span class="text-muted fw-medium">Lượt thi học viên:</span>
                <span class="fw-bold text-info">
                  {{ room.totalSessions }} lượt ({{ room.passedSessions }} đỗ)
                </span>
              </div>
            </div>
          </div>

          <!-- Các nút thao tác Admin -->
          <div class="pt-2 border-top">
            <div class="row g-2 mb-2">
              <!-- Nút cấu hình ma trận đề thi -->
              <div class="col-12">
                <button 
                  type="button" 
                  class="btn btn-outline-primary w-100 py-2 rounded-3 fw-semibold small d-flex align-items-center justify-content-center gap-2 shadow-xs"
                  @click="openMatrixModal(room)"
                >
                  <i class="bi bi-diagram-3-fill text-primary"></i>
                  <span>Cấu hình ma trận đề thi</span>
                </button>
              </div>
            </div>

            <div class="d-flex align-items-center justify-content-between gap-2">
              <!-- Nút sửa thông số -->
              <button 
                type="button" 
                class="btn btn-light border py-1.5 px-3 rounded-3 fw-semibold small flex-grow-1 text-dark d-flex align-items-center justify-content-center gap-1"
                @click="openEditModal(room)"
              >
                <i class="bi bi-pencil-square text-primary"></i> Sửa
              </button>

              <!-- Nút Bật / Tắt trạng thái mở phòng thi -->
              <button 
                type="button" 
                class="btn py-1.5 px-3 rounded-3 fw-semibold small flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                :class="room.isActive ? 'btn-outline-warning text-dark' : 'btn-outline-success'"
                @click="toggleRoomStatus(room)"
                :title="room.isActive ? 'Tạm đóng phòng thi này' : 'Mở lại phòng thi này'"
              >
                <i class="bi" :class="room.isActive ? 'bi-pause-fill' : 'bi-play-fill'"></i>
                {{ room.isActive ? 'Đóng phòng' : 'Mở phòng' }}
              </button>

              <!-- Nút Xóa -->
              <button 
                type="button" 
                class="btn btn-light border text-danger py-1.5 px-2.5 rounded-3 fw-semibold small"
                @click="handleDeleteRoom(room)"
                title="Xóa phòng thi này"
              >
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================== VIEW 2: DATA TABLE ===================== -->
    <div v-else class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light text-secondary fs-xs text-uppercase border-bottom">
            <tr>
              <th scope="col" class="py-3 ps-4" style="width: 80px;">Hạng</th>
              <th scope="col" class="py-3">Tên phòng thi sát hạch</th>
              <th scope="col" class="py-3 text-center" style="width: 110px;">Số câu</th>
              <th scope="col" class="py-3 text-center" style="width: 110px;">Thời gian</th>
              <th scope="col" class="py-3 text-center" style="width: 120px;">Điểm đạt</th>
              <th scope="col" class="py-3 text-center" style="width: 140px;">Lượt thi</th>
              <th scope="col" class="py-3 text-center" style="width: 140px;">Trạng thái</th>
              <th scope="col" class="py-3 text-end pe-4" style="width: 220px;">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="room in filteredLicenseTypes" :key="room.id">
              <td class="ps-4">
                <span class="badge bg-primary px-2.5 py-1.5 rounded-pill fw-bold fs-6">
                  {{ room.code }}
                </span>
              </td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <i :class="['bi', getLicenseIcon(room.code), 'fs-5']"></i>
                  <div>
                    <h6 class="fw-bold text-dark mb-0">{{ room.name }}</h6>
                    <small class="text-muted d-block text-truncate" style="max-width: 320px;">
                      {{ room.description || 'Chưa có mô tả' }}
                    </small>
                  </div>
                </div>
              </td>
              <td class="text-center fw-bold text-dark">
                {{ room.totalQuestions }} câu
              </td>
              <td class="text-center fw-bold text-primary">
                {{ room.durationMinutes }} phút
              </td>
              <td class="text-center fw-bold text-success">
                {{ room.passingScore }} / {{ room.totalQuestions }}
              </td>
              <td class="text-center">
                <span class="badge bg-light text-dark border px-2 py-1">
                  {{ room.totalSessions }} lượt
                </span>
              </td>
              <td class="text-center">
                <span 
                  class="badge rounded-pill px-2.5 py-1 fs-xxs fw-bold cursor-pointer"
                  :class="room.isActive ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-secondary bg-opacity-10 text-secondary border border-secondary'"
                  @click="toggleRoomStatus(room)"
                  title="Nhấn để bật/tắt trạng thái"
                >
                  {{ room.isActive ? 'ĐANG MỞ' : 'TẠM ĐÓNG' }}
                </span>
              </td>
              <td class="text-end pe-4">
                <div class="btn-group btn-group-sm">
                  <button 
                    type="button" 
                    class="btn btn-outline-primary"
                    @click="openMatrixModal(room)"
                    title="Cấu hình ma trận đề thi"
                  >
                    <i class="bi bi-diagram-3-fill"></i>
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-outline-secondary"
                    @click="openEditModal(room)"
                    title="Chỉnh sửa thông số"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button 
                    type="button" 
                    class="btn"
                    :class="room.isActive ? 'btn-outline-warning text-dark' : 'btn-outline-success'"
                    @click="toggleRoomStatus(room)"
                    :title="room.isActive ? 'Tạm đóng phòng thi' : 'Mở lại phòng thi'"
                  >
                    <i class="bi" :class="room.isActive ? 'bi-pause-fill' : 'bi-play-fill'"></i>
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-outline-danger"
                    @click="handleDeleteRoom(room)"
                    title="Xóa phòng thi"
                  >
                    <i class="bi bi-trash3"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL 1: THÊM MỚI / CHỈNH SỬA PHÒNG THI                                    -->
    <!-- ========================================================================= -->
    <div 
      v-if="showModal" 
      class="modal fade show d-block" 
      tabindex="-1" 
      style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div class="modal-header border-bottom py-3 px-4 bg-light">
            <h5 class="modal-title fw-bold text-dark d-flex align-items-center gap-2">
              <i class="bi text-primary" :class="isEditing ? 'bi-pencil-square' : 'bi-plus-circle-fill'"></i>
              <span>{{ isEditing ? `Chỉnh sửa phòng thi: Hạng ${form.code}` : 'Thêm phòng thi sát hạch mới' }}</span>
            </h5>
            <button type="button" class="btn-close" @click="closeModal" :disabled="isSubmitting"></button>
          </div>

          <form @submit.prevent="handleSaveRoom">
            <div class="modal-body p-4">
              <div class="row g-3">
                <!-- Mã hạng bằng -->
                <div class="col-12 col-md-4">
                  <label class="form-label small fw-bold text-dark">
                    Mã Hạng Bằng <span class="text-danger">*</span>
                  </label>
                  <input 
                    v-model="form.code"
                    type="text" 
                    class="form-control rounded-3 text-uppercase fw-bold"
                    placeholder="VD: A, B1, C..."
                    required
                    maxlength="10"
                  />
                  <small class="text-muted fs-xxs">Mã định danh duy nhất (A, A1, B...)</small>
                </div>

                <!-- Tên phòng thi -->
                <div class="col-12 col-md-8">
                  <label class="form-label small fw-bold text-dark">
                    Tên Phòng Thi Sát Hạch <span class="text-danger">*</span>
                  </label>
                  <input 
                    v-model="form.name"
                    type="text" 
                    class="form-control rounded-3 fw-semibold"
                    placeholder="VD: Hạng B - Ô tô con & xe tải nhẹ"
                    required
                  />
                </div>

                <!-- Số lượng câu hỏi -->
                <div class="col-12 col-md-4">
                  <label class="form-label small fw-bold text-dark">
                    Số lượng câu hỏi <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <input 
                      v-model.number="form.totalQuestions"
                      type="number" 
                      min="5" 
                      max="100" 
                      class="form-control rounded-start-3 fw-bold"
                      required
                    />
                    <span class="input-group-text bg-light rounded-end-3 small text-muted">câu</span>
                  </div>
                  <small class="text-muted fs-xxs">Quy định số câu trong 1 đề thi</small>
                </div>

                <!-- Thời gian làm bài -->
                <div class="col-12 col-md-4">
                  <label class="form-label small fw-bold text-dark">
                    Thời gian làm bài <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <input 
                      v-model.number="form.durationMinutes"
                      type="number" 
                      min="1" 
                      max="120" 
                      class="form-control rounded-start-3 fw-bold text-primary"
                      required
                    />
                    <span class="input-group-text bg-light rounded-end-3 small text-muted">phút</span>
                  </div>
                  <small class="text-muted fs-xxs">Thời gian đếm ngược tự động nộp</small>
                </div>

                <!-- Yêu cầu đạt -->
                <div class="col-12 col-md-4">
                  <label class="form-label small fw-bold text-dark">
                    Điểm yêu cầu đạt <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <input 
                      v-model.number="form.passingScore"
                      type="number" 
                      min="1" 
                      :max="form.totalQuestions"
                      class="form-control rounded-start-3 fw-bold text-success"
                      required
                    />
                    <span class="input-group-text bg-light rounded-end-3 small text-muted">câu</span>
                  </div>
                  <small class="text-muted fs-xxs">Số câu đúng tối thiểu để đỗ</small>
                </div>

                <!-- Mô tả quy chuẩn phương tiện -->
                <div class="col-12">
                  <label class="form-label small fw-bold text-dark">
                    Mô tả phạm vi điều khiển / Quy chuẩn
                  </label>
                  <textarea 
                    v-model="form.description"
                    rows="3" 
                    class="form-control rounded-3 small"
                    placeholder="Nhập thông tin phạm vi điều khiển phương tiện theo chuẩn Bộ GTVT..."
                  ></textarea>
                </div>

                <!-- Trạng thái phòng thi -->
                <div class="col-12">
                  <div class="form-check form-switch p-3 bg-light rounded-3 border">
                    <input 
                      v-model="form.isActive" 
                      class="form-check-input ms-0 me-3" 
                      type="checkbox" 
                      role="switch" 
                      id="roomActiveSwitch"
                    />
                    <label class="form-check-label fw-bold text-dark" for="roomActiveSwitch">
                      Kích hoạt mở phòng thi sát hạch
                    </label>
                    <p class="text-muted small mb-0 mt-0.5">
                      Khi bật, học viên có thể nhìn thấy phòng thi này trên giao diện và bắt đầu làm bài thi thử.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer border-top py-3 px-4 bg-light">
              <button 
                type="button" 
                class="btn btn-outline-secondary px-4 rounded-3 fw-semibold" 
                @click="closeModal"
                :disabled="isSubmitting"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                class="btn btn-primary px-4 rounded-3 fw-semibold d-flex align-items-center gap-2"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm"></span>
                <span>{{ isEditing ? 'Lưu thay đổi' : 'Tạo phòng thi' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL 2: CẤU HÌNH MA TRẬN ĐỀ THI (7 CHƯƠNG)                               -->
    <!-- ========================================================================= -->
    <div 
      v-if="showMatrixModal && selectedRoom" 
      class="modal fade show d-block" 
      tabindex="-1" 
      style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);"
    >
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div class="modal-header border-bottom py-3 px-4 bg-light">
            <div>
              <h5 class="modal-title fw-bold text-dark d-flex align-items-center gap-2 mb-1">
                <i class="bi bi-diagram-3-fill text-primary"></i>
                <span>Cấu hình Ma Trận Đề Thi: Hạng {{ selectedRoom.code }}</span>
              </h5>
              <p class="text-muted small mb-0">
                Phòng thi: <strong>{{ selectedRoom.name }}</strong> &bull; Quy định đề thi: 
                <strong class="text-primary">{{ selectedRoom.totalQuestions }} câu</strong> &bull; 
                Thời gian: <strong>{{ selectedRoom.durationMinutes }} phút</strong>
              </p>
            </div>
            <button type="button" class="btn-close" @click="closeMatrixModal" :disabled="isMatrixSaving"></button>
          </div>

          <div class="modal-body p-4">
            <!-- Loading Matrix -->
            <div v-if="isMatrixLoading" class="text-center py-5">
              <div class="spinner-border text-primary mb-2" role="status"></div>
              <p class="text-muted small">Đang tải ma trận cấu trúc 7 chương...</p>
            </div>

            <div v-else>
              <!-- Progress Alert Matrix Status -->
              <div 
                class="alert rounded-3 py-2 px-3 mb-3 d-flex align-items-center justify-content-between"
                :class="isMatrixValid ? 'alert-success border-success' : 'alert-warning border-warning'"
              >
                <div class="d-flex align-items-center gap-2 small">
                  <i class="bi fs-5" :class="isMatrixValid ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-warning'"></i>
                  <div>
                    <strong>Tổng câu đã cấu hình: </strong>
                    <span class="fs-6 fw-bolder" :class="isMatrixValid ? 'text-success' : 'text-danger'">
                      {{ matrixTotalConfigured }} / {{ selectedRoom.totalQuestions }} câu
                    </span>
                    <span v-if="matrixTotalParalysis > 0" class="ms-2 badge bg-danger rounded-pill">
                      {{ matrixTotalParalysis }} câu điểm liệt bắt buộc
                    </span>
                  </div>
                </div>

                <div class="small fw-semibold">
                  <span v-if="isMatrixValid" class="text-success">
                    <i class="bi bi-shield-check me-1"></i>Hợp lệ, sẵn sàng lưu
                  </span>
                  <span v-else class="text-danger">
                    <i class="bi bi-exclamation-circle me-1"></i>
                    {{ matrixTotalConfigured < selectedRoom.totalQuestions ? `Còn thiếu ${selectedRoom.totalQuestions - matrixTotalConfigured} câu` : `Thừa ${matrixTotalConfigured - selectedRoom.totalQuestions} câu` }}
                  </span>
                </div>
              </div>

              <!-- Matrix Table -->
              <div class="table-responsive border rounded-3 overflow-hidden">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light text-secondary fs-xs text-uppercase border-bottom">
                    <tr>
                      <th scope="col" class="py-2.5 ps-3" style="width: 70px;">STT</th>
                      <th scope="col" class="py-2.5">Chương giáo trình lý thuyết</th>
                      <th scope="col" class="py-2.5 text-center" style="width: 140px;">Ngân hàng câu</th>
                      <th scope="col" class="py-2.5 text-center" style="width: 180px;">Số câu lấy trong đề</th>
                      <th scope="col" class="py-2.5 text-center" style="width: 180px;">Số câu điểm liệt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(rule, idx) in matrixRules" :key="rule.chapterId">
                      <td class="ps-3 fw-bold text-muted">
                        {{ idx + 1 }}
                      </td>
                      <td>
                        <h6 class="fw-bold text-dark mb-0 fs-sm">{{ rule.chapterTitle }}</h6>
                        <small class="text-muted fs-xxs">Mã chương ID: {{ rule.chapterId }}</small>
                      </td>
                      <td class="text-center small">
                        <span class="badge bg-light text-dark border">
                          {{ rule.totalQuestionsInBank || 0 }} câu
                        </span>
                        <span v-if="rule.paralysisInBank > 0" class="badge bg-danger-subtle text-danger border border-danger-subtle ms-1">
                          {{ rule.paralysisInBank }} câu liệt
                        </span>
                      </td>
                      <td class="text-center">
                        <div class="input-group input-group-sm mx-auto" style="max-width: 130px;">
                          <input 
                            v-model.number="rule.questionCount"
                            type="number" 
                            min="0" 
                            :max="rule.totalQuestionsInBank"
                            class="form-control text-center fw-bold"
                          />
                          <span class="input-group-text bg-light text-muted">câu</span>
                        </div>
                      </td>
                      <td class="text-center">
                        <div class="input-group input-group-sm mx-auto" style="max-width: 130px;">
                          <input 
                            v-model.number="rule.paralysisCount"
                            type="number" 
                            min="0" 
                            :max="Math.min(rule.questionCount || 0, rule.paralysisInBank || 0)"
                            class="form-control text-center fw-bold text-danger"
                          />
                          <span class="input-group-text bg-light text-muted">liệt</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot class="table-light fw-bold">
                    <tr>
                      <td colspan="2" class="ps-3 text-uppercase text-secondary small">
                        Tổng cộng phân bổ toàn đề thi:
                      </td>
                      <td class="text-center small text-muted">7 Chương</td>
                      <td class="text-center">
                        <span class="fs-6" :class="isMatrixValid ? 'text-success fw-bolder' : 'text-danger fw-bolder'">
                          {{ matrixTotalConfigured }} / {{ selectedRoom.totalQuestions }} câu
                        </span>
                      </td>
                      <td class="text-center">
                        <span class="text-danger fs-6 fw-bolder">
                          {{ matrixTotalParalysis }} câu
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div class="modal-footer border-top py-3 px-4 bg-light">
            <button 
              type="button" 
              class="btn btn-outline-secondary px-4 rounded-3 fw-semibold" 
              @click="closeMatrixModal"
              :disabled="isMatrixSaving"
            >
              Đóng
            </button>
            <button 
              type="button" 
              class="btn btn-primary px-4 rounded-3 fw-semibold d-flex align-items-center gap-2"
              @click="handleSaveMatrix"
              :disabled="isMatrixSaving || !isMatrixValid"
            >
              <span v-if="isMatrixSaving" class="spinner-border spinner-border-sm"></span>
              <i v-else class="bi bi-check2-circle"></i>
              <span>Lưu Ma Trận Đề Thi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.room-card {
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
  background-color: #ffffff;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.room-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.08) !important;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cursor-pointer {
  cursor: pointer;
}

.spin-animate {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
