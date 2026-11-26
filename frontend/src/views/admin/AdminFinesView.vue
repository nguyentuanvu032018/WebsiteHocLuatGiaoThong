<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '../../services/api';
import Swal from 'sweetalert2';

const router = useRouter();

// Trạng thái dữ liệu
const fines = ref([]);
const categories = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');

// Bộ lọc & Phân trang
const searchKeyword = ref('');
const selectedCategoryId = ref('');
const selectedRange = ref('all'); // all, under1m, 1m-5m, 5m-10m, over10m
const currentPage = ref(1);
const totalPages = ref(1);
const totalFines = ref(0);
const pageSize = ref(10);

// State Modal Thêm / Sửa
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);

const form = reactive({
  id: null,
  fineCategoryId: 1,
  violationTitle: '',
  violationDetail: '',
  minFineAmount: 1000000,
  maxFineAmount: 2000000,
  penaltyAddition: '',
  legalReference: ''
});

// Format tiền tệ VNĐ
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

// Thống kê KPIs theo danh mục phương tiện
const motorbikeCount = computed(() => {
  const cat = categories.value.find(c => c.vehicle_type === 'XE_MAY');
  return cat ? Number(cat.fine_count || 0) : 0;
});

const carCount = computed(() => {
  const cat = categories.value.find(c => c.vehicle_type === 'OTO');
  return cat ? Number(cat.fine_count || 0) : 0;
});

const otherCount = computed(() => {
  const cat = categories.value.find(c => c.vehicle_type === 'KHAC');
  return cat ? Number(cat.fine_count || 0) : 0;
});

// Icon và badge màu phương tiện
const getVehicleBadge = (vehicleType) => {
  switch (vehicleType) {
    case 'XE_MAY':
      return { label: 'Xe máy', icon: 'bi-bicycle', class: 'bg-primary-subtle text-primary border border-primary-subtle' };
    case 'OTO':
      return { label: 'Ô tô', icon: 'bi-car-front-fill', class: 'bg-success-subtle text-success border border-success-subtle' };
    case 'KHAC':
      return { label: 'Khác / Đi bộ', icon: 'bi-person-walking', class: 'bg-warning-subtle text-warning border border-warning-subtle' };
    default:
      return { label: 'Khác', icon: 'bi-signpost-2', class: 'bg-secondary-subtle text-secondary border' };
  }
};

// Tải danh mục nhóm phương tiện
const fetchCategories = async () => {
  try {
    const res = await apiClient.get('/admin/fines/categories');
    if (res.success && res.data?.categories) {
      categories.value = res.data.categories;
    }
  } catch (err) {
    console.error('Lỗi tải danh mục phương tiện:', err);
  }
};

// Tải danh sách mức xử phạt theo bộ lọc
const fetchFines = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    };

    if (selectedCategoryId.value) {
      params.fineCategoryId = selectedCategoryId.value;
    }

    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim();
    }

    // Khoảng mức phạt
    if (selectedRange.value === 'under1m') {
      params.maxFine = 1000000;
    } else if (selectedRange.value === '1m-5m') {
      params.minFine = 1000000;
      params.maxFine = 5000000;
    } else if (selectedRange.value === '5m-10m') {
      params.minFine = 5000000;
      params.maxFine = 10000000;
    } else if (selectedRange.value === 'over10m') {
      params.minFine = 10000000;
    }

    const res = await apiClient.get('/admin/fines', { params });
    if (res.success && res.data?.fines) {
      fines.value = res.data.fines;
      totalFines.value = res.data.total || 0;
      totalPages.value = res.data.totalPages || 1;
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải danh sách mức xử phạt';
  } finally {
    isLoading.value = false;
  }
};

// Reset toàn bộ bộ lọc
const resetFilter = () => {
  searchKeyword.value = '';
  selectedCategoryId.value = '';
  selectedRange.value = 'all';
  currentPage.value = 1;
  fetchFines();
};

// Đổi trang
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page;
    fetchFines();
  }
};

// Mở Modal Thêm mới
const openAddModal = () => {
  isEditing.value = false;
  form.id = null;
  form.fineCategoryId = categories.value.length > 0 ? categories.value[0].id : 1;
  form.violationTitle = '';
  form.violationDetail = '';
  form.minFineAmount = 1000000;
  form.maxFineAmount = 2000000;
  form.penaltyAddition = '';
  form.legalReference = 'Nghị định 100/2019/NĐ-CP (sửa đổi NĐ 123/2021/NĐ-CP)';
  showModal.value = true;
};

// Mở Modal Chỉnh sửa
const openEditModal = (fine) => {
  isEditing.value = true;
  form.id = fine.id;
  form.fineCategoryId = fine.fineCategoryId;
  form.violationTitle = fine.violationTitle;
  form.violationDetail = fine.violationDetail;
  form.minFineAmount = fine.minFineAmount;
  form.maxFineAmount = fine.maxFineAmount;
  form.penaltyAddition = fine.penaltyAddition || '';
  form.legalReference = fine.legalReference || '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

// Lưu thông tin mức phạt (Thêm mới / Sửa)
const handleSaveFine = async () => {
  if (!form.violationTitle.trim()) {
    Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Vui lòng nhập tên hành vi vi phạm' });
    return;
  }
  if (!form.violationDetail.trim()) {
    Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Vui lòng nhập chi tiết hành vi vi phạm' });
    return;
  }
  if (form.minFineAmount < 0 || form.maxFineAmount < 0) {
    Swal.fire({ icon: 'warning', title: 'Thông số không hợp lệ', text: 'Mức tiền phạt không được là số âm' });
    return;
  }
  if (form.maxFineAmount > 0 && form.minFineAmount > form.maxFineAmount) {
    Swal.fire({ icon: 'warning', title: 'Thông số không hợp lệ', text: 'Mức phạt tối thiểu không được lớn hơn mức phạt tối đa' });
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = {
      fineCategoryId: Number(form.fineCategoryId),
      violationTitle: form.violationTitle.trim(),
      violationDetail: form.violationDetail.trim(),
      minFineAmount: Number(form.minFineAmount),
      maxFineAmount: Number(form.maxFineAmount),
      penaltyAddition: form.penaltyAddition ? form.penaltyAddition.trim() : null,
      legalReference: form.legalReference.trim()
    };

    if (isEditing.value) {
      const res = await apiClient.put(`/admin/fines/${form.id}`, payload);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Cập nhật thành công',
          text: 'Đã cập nhật mức xử phạt vi phạm!',
          timer: 1500,
          showConfirmButton: false
        });
        showModal.value = false;
        await fetchFines();
        await fetchCategories();
      }
    } else {
      const res = await apiClient.post('/admin/fines', payload);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Thêm mới thành công',
          text: 'Đã thêm mức xử phạt vi phạm mới!',
          timer: 1800,
          showConfirmButton: false
        });
        showModal.value = false;
        await fetchFines();
        await fetchCategories();
      }
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi xử lý',
      text: err.message || 'Không thể lưu mức xử phạt'
    });
  } finally {
    isSubmitting.value = false;
  }
};

// Xóa mức xử phạt
const handleDeleteFine = async (fine) => {
  const result = await Swal.fire({
    title: 'Xác nhận xóa mức phạt?',
    html: `Bạn có chắc chắn muốn xóa hành vi vi phạm:<br><strong class="text-danger">${fine.violationTitle}</strong>?<br><span class="text-muted small">Thao tác này không thể hoàn tác.</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Xóa vĩnh viễn',
    cancelButtonText: 'Hủy'
  });

  if (!result.isConfirmed) return;

  try {
    const res = await apiClient.delete(`/admin/fines/${fine.id}`);
    if (res.success) {
      Swal.fire({
        icon: 'success',
        title: 'Đã xóa',
        text: 'Đã xóa mức xử phạt thành công.',
        timer: 1500,
        showConfirmButton: false
      });
      await fetchFines();
      await fetchCategories();
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Không thể xóa',
      text: err.message || 'Đã xảy ra lỗi khi xóa mức phạt'
    });
  }
};

// Debounce search
let searchTimeout = null;
watch(searchKeyword, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchFines();
  }, 400);
});

watch([selectedCategoryId, selectedRange], () => {
  currentPage.value = 1;
  fetchFines();
});

onMounted(async () => {
  await fetchCategories();
  await fetchFines();
});
</script>

<template>
  <div class="admin-fines container-fluid px-0">
    <!-- Header Page -->
    <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
      <div>
        <!-- <nav aria-label="breadcrumb">
          <ol class="breadcrumb small mb-1">
            <li class="breadcrumb-item"><router-link to="/admin/dashboard" class="text-decoration-none">Dashboard</router-link></li>
            <li class="breadcrumb-item active" aria-current="page">Quản lý mức phạt</li>
          </ol>
        </nav> -->
        <div class="d-flex align-items-center gap-2">
          <h3 class="fw-bold text-dark mb-0">
            <!-- <i class="bi bi-shield-slash-fill text-danger me-2"></i>-->Quản Lý Mức Xử Phạt Giao Thông 
          </h3>
          <!-- <span class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-1 fs-xxs">
            Nghị định 100/123
          </span> -->
        </div>
        <p class="text-secondary small mb-0 mt-1">
          Quản trị ngân hàng mức xử phạt vi phạm hành chính đường bộ theo Nghị định 100/2019/NĐ-CP và Nghị định 123/2021/NĐ-CP.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex align-items-center gap-2">
        <button 
          type="button" 
          class="btn btn-outline-secondary px-3 py-2 rounded-3 fw-semibold d-flex align-items-center gap-1 shadow-sm"
          @click="fetchFines"
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
          <span>Thêm mức phạt mới</span>
        </button>
      </div>
    </div>

    <!-- ===================== KPI CARDS ===================== -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold d-block">Tổng số mức phạt</span>
              <h3 class="fw-bolder text-dark mb-0 mt-1">{{ totalFines }}</h3>
              <span class="fs-xxs text-primary fw-semibold">Các hành vi vi phạm</span>
            </div>
            <div class="rounded-3 bg-primary bg-opacity-10 text-primary p-3 fs-3">
              <i class="bi bi-file-earmark-ruled-fill"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold d-block">Xe môtô, xe gắn máy</span>
              <h3 class="fw-bolder text-primary mb-0 mt-1">{{ motorbikeCount }}</h3>
              <span class="fs-xxs text-muted fw-semibold">Vi phạm xe 2-3 bánh</span>
            </div>
            <div class="rounded-3 bg-primary bg-opacity-10 text-primary p-3 fs-3">
              <i class="bi bi-bicycle"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold d-block">Xe ôtô & xe tải</span>
              <h3 class="fw-bolder text-success mb-0 mt-1">{{ carCount }}</h3>
              <span class="fs-xxs text-muted fw-semibold">Vi phạm phương tiện ô tô</span>
            </div>
            <div class="rounded-3 bg-success bg-opacity-10 text-success p-3 fs-3">
              <i class="bi bi-car-front-fill"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold d-block">Phương tiện khác & Đi bộ</span>
              <h3 class="fw-bolder text-warning mb-0 mt-1">{{ otherCount }}</h3>
              <span class="fs-xxs text-muted fw-semibold">Xe thô sơ, người đi bộ</span>
            </div>
            <div class="rounded-3 bg-warning bg-opacity-10 text-warning p-3 fs-3">
              <i class="bi bi-person-walking"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================== TOOLBAR & FILTER ===================== -->
    <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
      <div class="row g-2 align-items-center justify-content-between">
        <!-- Search Input -->
        <div class="col-12 col-lg-5">
          <div class="input-group">
            <span class="input-group-text bg-light border-end-0 rounded-start-3 text-muted">
              <i class="bi bi-search"></i>
            </span>
            <input 
              v-model="searchKeyword" 
              type="text" 
              class="form-control bg-light border-start-0 rounded-end-3 py-2 small"
              placeholder="Tìm theo hành vi, chi tiết vi phạm, điều khoản NĐ 100/123..."
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

        <!-- Filter Selects -->
        <div class="col-12 col-lg-7 d-flex flex-wrap align-items-center justify-content-lg-end gap-2">
          <!-- Dropdown nhóm phương tiện -->
          <select v-model="selectedCategoryId" class="form-select form-select-sm py-2 rounded-3 small" style="max-width: 200px;">
            <option value="">Tất cả phương tiện</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }} ({{ cat.fine_count }})
            </option>
          </select>

          <!-- Dropdown khoảng tiền phạt -->
          <select v-model="selectedRange" class="form-select form-select-sm py-2 rounded-3 small" style="max-width: 180px;">
            <option value="all">Tất cả mức tiền</option>
            <option value="under1m">Dưới 1 triệu</option>
            <option value="1m-5m">Từ 1 - 5 triệu</option>
            <option value="5m-10m">Từ 5 - 10 triệu</option>
            <option value="over10m">Trên 10 triệu</option>
          </select>

          <!-- Nút reset filter -->
          <button 
            type="button" 
            class="btn btn-light border btn-sm py-2 px-3 rounded-3 text-secondary"
            @click="resetFilter"
            title="Xóa bộ lọc"
          >
            <i class="bi bi-arrow-counterclockwise me-1"></i>Đặt lại
          </button>
        </div>
      </div>
    </div>

    <!-- ===================== LOADING / ERROR STATES ===================== -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-danger mb-3" role="status"></div>
      <p class="text-muted fw-semibold">Đang tải danh sách mức xử phạt giao thông...</p>
    </div>

    <div v-else-if="errorMessage" class="alert alert-danger rounded-4 p-4 text-center shadow-sm">
      <i class="bi bi-exclamation-triangle-fill fs-2 text-danger mb-2 d-block"></i>
      <h5 class="fw-bold">Không thể tải dữ liệu mức phạt</h5>
      <p class="mb-3 small">{{ errorMessage }}</p>
      <button @click="fetchFines" class="btn btn-outline-danger btn-sm rounded-3 px-3">
        <i class="bi bi-arrow-clockwise me-1"></i>Thử lại
      </button>
    </div>

    <div v-else-if="fines.length === 0" class="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
      <div class="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 70px; height: 70px;">
        <i class="bi bi-search text-muted fs-3"></i>
      </div>
      <h6 class="fw-bold text-dark mb-1">Không tìm thấy mức phạt phù hợp</h6>
      <p class="text-muted small mb-3">Vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
      <button @click="resetFilter" class="btn btn-outline-danger btn-sm rounded-3 mx-auto">
        Xóa tìm kiếm & bộ lọc
      </button>
    </div>

    <!-- ===================== DATA TABLE ===================== -->
    <div v-else class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light text-secondary fs-xs text-uppercase border-bottom">
            <tr>
              <th scope="col" class="py-3 ps-4" style="width: 60px;">STT</th>
              <th scope="col" class="py-3" style="width: 140px;">Phương tiện</th>
              <th scope="col" class="py-3" style="min-width: 280px;">Hành vi vi phạm & Chi tiết</th>
              <th scope="col" class="py-3 text-nowrap" style="width: 190px;">Mức tiền phạt</th>
              <th scope="col" class="py-3" style="width: 220px;">Phạt bổ sung</th>
              <th scope="col" class="py-3" style="width: 180px;">Căn cứ pháp lý</th>
              <th scope="col" class="py-3 text-end pe-4" style="width: 120px;">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="(fine, index) in fines" :key="fine.id">
              <!-- STT -->
              <td class="ps-4 fw-bold text-muted small">
                {{ (currentPage - 1) * pageSize + index + 1 }}
              </td>

              <!-- Phương tiện -->
              <td>
                <span class="badge rounded-pill px-2.5 py-1.5 fs-xxs fw-bold d-inline-flex align-items-center gap-1"
                      :class="getVehicleBadge(fine.vehicleType).class">
                  <i :class="['bi', getVehicleBadge(fine.vehicleType).icon]"></i>
                  {{ getVehicleBadge(fine.vehicleType).label }}
                </span>
              </td>

              <!-- Hành vi vi phạm -->
              <td>
                <h6 class="fw-bold text-dark mb-1 lh-sm fs-sm">
                  {{ fine.violationTitle }}
                </h6>
                <p class="text-secondary small mb-0 lh-sm text-truncate-2">
                  {{ fine.violationDetail }}
                </p>
              </td>

              <!-- Mức tiền phạt -->
              <td class="text-nowrap">
                <div class="fw-bold text-danger fs-sm">
                  {{ formatCurrency(fine.minFineAmount) }} - {{ formatCurrency(fine.maxFineAmount) }}
                </div>
              </td>

              <!-- Phạt bổ sung -->
              <td>
                <div v-if="fine.penaltyAddition" class="text-danger small d-flex align-items-start gap-1">
                  <i class="bi bi-exclamation-octagon-fill fs-xxs mt-1 flex-shrink-0"></i>
                  <span class="lh-sm fs-xxs fw-semibold">{{ fine.penaltyAddition }}</span>
                </div>
                <span v-else class="text-muted fs-xxs fst-italic">Không áp dụng</span>
              </td>

              <!-- Căn cứ pháp lý -->
              <td>
                <span class="badge bg-light text-secondary border px-2 py-1 fs-xxs text-truncate d-inline-block" style="max-width: 170px;" :title="fine.legalReference">
                  <i class="bi bi-book me-1"></i>{{ fine.legalReference || 'Nghị định 100/123' }}
                </span>
              </td>

              <!-- Thao tác -->
              <td class="text-end pe-4">
                <div class="btn-group btn-group-sm">
                  <button 
                    type="button" 
                    class="btn btn-outline-secondary" 
                    @click="openEditModal(fine)"
                    title="Chỉnh sửa mức phạt"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-outline-danger" 
                    @click="handleDeleteFine(fine)"
                    title="Xóa mức phạt"
                  >
                    <i class="bi bi-trash3"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="d-flex flex-column flex-sm-row align-items-center justify-content-between p-3 border-top gap-3">
        <div class="text-muted small">
          Hiển thị <strong>{{ (currentPage - 1) * pageSize + 1 }}</strong> - 
          <strong>{{ Math.min(currentPage * pageSize, totalFines) }}</strong> trong tổng số 
          <strong>{{ totalFines }}</strong> mức phạt
        </div>

        <nav v-if="totalPages > 1" aria-label="Page navigation">
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="changePage(currentPage - 1)" aria-label="Previous">
                <i class="bi bi-chevron-left"></i>
              </button>
            </li>

            <li 
              v-for="p in totalPages" 
              :key="p" 
              class="page-item"
              :class="{ active: p === currentPage }"
            >
              <button class="page-link" @click="changePage(p)">{{ p }}</button>
            </li>

            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link" @click="changePage(currentPage + 1)" aria-label="Next">
                <i class="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: THÊM MỚI / CHỈNH SỬA MỨC XỬ PHẠT                                   -->
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
              <i class="bi text-danger" :class="isEditing ? 'bi-pencil-square' : 'bi-plus-circle-fill'"></i>
              <span>{{ isEditing ? 'Chỉnh sửa mức xử phạt' : 'Thêm mức xử phạt vi phạm mới' }}</span>
            </h5>
            <button type="button" class="btn-close" @click="closeModal" :disabled="isSubmitting"></button>
          </div>

          <form @submit.prevent="handleSaveFine">
            <div class="modal-body p-4">
              <div class="row g-3">
                <!-- Nhóm phương tiện -->
                <div class="col-12 col-md-6">
                  <label class="form-label small fw-bold text-dark">
                    Nhóm Phương Tiện Áp Dụng <span class="text-danger">*</span>
                  </label>
                  <select v-model="form.fineCategoryId" class="form-select rounded-3 fw-semibold" required>
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                      {{ cat.name }} ({{ cat.vehicle_type }})
                    </option>
                  </select>
                </div>

                <!-- Căn cứ pháp lý -->
                <div class="col-12 col-md-6">
                  <label class="form-label small fw-bold text-dark">
                    Căn Cứ Pháp Lý (Nghị định / Điều khoản)
                  </label>
                  <input 
                    v-model="form.legalReference"
                    type="text" 
                    class="form-control rounded-3"
                    placeholder="VD: Điểm c Khoản 6 Điều 6 Nghị định 100/2019/NĐ-CP"
                  />
                </div>

                <!-- Tên hành vi vi phạm -->
                <div class="col-12">
                  <label class="form-label small fw-bold text-dark">
                    Tên Hành Vi Vi Phạm <span class="text-danger">*</span>
                  </label>
                  <input 
                    v-model="form.violationTitle"
                    type="text" 
                    class="form-control rounded-3 fw-semibold"
                    placeholder="VD: Điều khiển xe chạy quá tốc độ quy định từ 10 km/h đến 20 km/h"
                    required
                  />
                </div>

                <!-- Chi tiết hành vi vi phạm -->
                <div class="col-12">
                  <label class="form-label small fw-bold text-dark">
                    Chi Tiết Hành Vi Vi Phạm <span class="text-danger">*</span>
                  </label>
                  <textarea 
                    v-model="form.violationDetail"
                    rows="3" 
                    class="form-control rounded-3 small"
                    placeholder="Mô tả cụ thể hành vi vi phạm, các tình huống liên quan..."
                    required
                  ></textarea>
                </div>

                <!-- Mức phạt tiền tối thiểu -->
                <div class="col-12 col-md-6">
                  <label class="form-label small fw-bold text-dark">
                    Mức Phạt Tối Thiểu (VNĐ) <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <input 
                      v-model.number="form.minFineAmount"
                      type="number" 
                      min="0" 
                      step="50000"
                      class="form-control rounded-start-3 fw-bold text-danger"
                      required
                    />
                    <span class="input-group-text bg-light rounded-end-3 small text-muted">VNĐ</span>
                  </div>
                  <small class="text-muted fs-xxs">Định dạng: {{ formatCurrency(form.minFineAmount) }}</small>
                </div>

                <!-- Mức phạt tiền tối đa -->
                <div class="col-12 col-md-6">
                  <label class="form-label small fw-bold text-dark">
                    Mức Phạt Tối Đa (VNĐ) <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <input 
                      v-model.number="form.maxFineAmount"
                      type="number" 
                      min="0" 
                      step="50000"
                      class="form-control rounded-start-3 fw-bold text-danger"
                      required
                    />
                    <span class="input-group-text bg-light rounded-end-3 small text-muted">VNĐ</span>
                  </div>
                  <small class="text-muted fs-xxs">Định dạng: {{ formatCurrency(form.maxFineAmount) }}</small>
                </div>

                <!-- Hình phạt bổ sung -->
                <div class="col-12">
                  <label class="form-label small fw-bold text-dark">
                    Hình Phạt Bổ Sung & Biện Pháp Khắc Phục (Nếu có)
                  </label>
                  <textarea 
                    v-model="form.penaltyAddition"
                    rows="2" 
                    class="form-control rounded-3 small"
                    placeholder="VD: Tước quyền sử dụng Giấy phép lái xe từ 01 tháng đến 03 tháng..."
                  ></textarea>
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
                <span>{{ isEditing ? 'Lưu thay đổi' : 'Tạo mức phạt' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

