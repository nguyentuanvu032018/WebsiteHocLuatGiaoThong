<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../../services/api';

const route = useRoute();

// State
const categories = ref([]);
const fines = ref([]);
const selectedVehicleType = ref(null); // 'XE_MAY', 'OTO', 'KHAC' hoặc null
const searchKeyword = ref('');
const fineRange = ref('all'); // 'all', 'under1m', '1m-5m', '5m-10m', 'over10m'
const currentPage = ref(1);
const totalPages = ref(1);
const totalFines = ref(0);
const limit = ref(10);

const isLoading = ref(false);
const errorMessage = ref('');

// Format tiền tệ VNĐ
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

// Lấy danh mục nhóm phương tiện vi phạm
const loadCategories = async () => {
  try {
    const res = await apiClient.get('/lookup/fines/categories');
    if (res.success && res.data?.categories) {
      categories.value = res.data.categories;
    }
  } catch (err) {
    console.error('Lỗi tải danh mục phương tiện:', err);
  }
};

// Lấy danh sách mức phạt vi phạm theo bộ lọc
const loadFines = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const params = {
      page: currentPage.value,
      limit: limit.value
    };

    if (selectedVehicleType.value) {
      params.vehicleType = selectedVehicleType.value;
    }
    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim();
    }

    // Xử lý khoảng tiền phạt
    if (fineRange.value === 'under1m') {
      params.maxFine = 1000000;
    } else if (fineRange.value === '1m-5m') {
      params.minFine = 1000000;
      params.maxFine = 5000000;
    } else if (fineRange.value === '5m-10m') {
      params.minFine = 5000000;
      params.maxFine = 10000000;
    } else if (fineRange.value === 'over10m') {
      params.minFine = 10000000;
    }

    const res = await apiClient.get('/lookup/fines', { params });
    if (res.success && res.data) {
      fines.value = res.data.fines || [];
      totalFines.value = res.data.total || 0;
      totalPages.value = res.data.totalPages || 1;
      currentPage.value = res.data.page || 1;
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải danh sách mức xử phạt';
    fines.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Chọn nhóm phương tiện
const selectVehicleType = (type) => {
  selectedVehicleType.value = type;
  currentPage.value = 1;
  loadFines();
};

// Đổi khoảng tiền phạt
const changeFineRange = (range) => {
  fineRange.value = range;
  currentPage.value = 1;
  loadFines();
};

// Chuyển trang
const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  loadFines();
  window.scrollTo({ top: 150, behavior: 'smooth' });
};

// Debounce tìm kiếm
let searchTimeout = null;
const handleSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadFines();
  }, 350);
};

// Helper: Phân loại viền màu theo loại phương tiện
const getFineCardClass = (vehicleType) => {
  switch (vehicleType) {
    case 'XE_MAY':
      return 'fine-card-motorcycle';
    case 'OTO':
      return 'fine-card-car';
    default:
      return 'fine-card-other';
  }
};

// Helper: Huy hiệu phương tiện
const getVehicleBadge = (vehicleType) => {
  switch (vehicleType) {
    case 'XE_MAY':
      return {
        text: 'Xe mô tô, xe máy',
        icon: 'bi-bicycle',
        class: 'bg-primary-subtle text-primary border border-primary-subtle'
      };
    case 'OTO':
      return {
        text: 'Xe ô tô',
        icon: 'bi-car-front-fill',
        class: 'bg-danger-subtle text-danger border border-danger-subtle'
      };
    default:
      return {
        text: 'Xe đạp / Người đi bộ',
        icon: 'bi-person-walking',
        class: 'bg-secondary-subtle text-secondary border border-secondary-subtle'
      };
  }
};

// Kiểm tra xem hình thức phạt bổ sung có phải tước bằng hoặc tạm giữ xe không
const isSeverePenalty = (penaltyText) => {
  if (!penaltyText) return false;
  const lower = penaltyText.toLowerCase();
  return lower.includes('tước') || lower.includes('tạm giữ') || lower.includes('tịch thu');
};

onMounted(async () => {
  if (route.query.vehicle) {
    selectedVehicleType.value = route.query.vehicle.toUpperCase();
  }
  await loadCategories();
  await loadFines();
});

watch(() => route.query.vehicle, (newVal) => {
  selectedVehicleType.value = newVal ? newVal.toUpperCase() : null;
  currentPage.value = 1;
  loadFines();
});
</script>

<template>
  <div class="container py-4 py-lg-5">
    <!-- Breadcrumb & Header -->
    <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
      <div>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb small mb-1">
            <li class="breadcrumb-item"><router-link to="/">Trang chủ</router-link></li>
            <li class="breadcrumb-item"><router-link to="/lookup/signs">Tra cứu</router-link></li>
            <li class="breadcrumb-item active" aria-current="page">Mức xử phạt vi phạm</li>
          </ol>
        </nav>
        <div class="d-flex align-items-center gap-2">
          <h2 class="fw-bolder text-dark mb-0">
            <i class="bi bi-cash-stack text-warning me-2"></i>Tra Cứu Mức Xử Phạt Vi Phạm Giao Thông
          </h2>
          <span class="badge bg-warning-subtle text-warning-emphasis rounded-pill px-3 py-1 fs-xxs">Nghị định 100/123</span>
        </div>
        <p class="text-secondary small mt-1 mb-0">
          Căn cứ Nghị định 100/2019/NĐ-CP và Nghị định 123/2021/NĐ-CP sửa đổi, bổ sung quy định xử phạt vi phạm hành chính đường bộ.
        </p>
      </div>

      <!-- Quick Link to Signs Lookup -->
      <div>
        <router-link to="/lookup/signs" class="btn btn-soft-primary px-3 py-2 fw-semibold">
          <i class="bi bi-signpost-2 me-1"></i> Tra cứu biển báo giao thông
        </router-link>
      </div>
    </div>

    <!-- Vehicle Tabs Filter -->
    <div class="card border border-light-subtle shadow-sm rounded-4 p-3 mb-4 bg-white">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <span class="fw-bold text-dark small">
          <i class="bi bi-truck-front-fill text-primary me-1"></i> Lọc theo loại phương tiện:
        </span>
        <button 
          v-if="selectedVehicleType !== null" 
          @click="selectVehicleType(null)" 
          class="btn btn-sm btn-link text-decoration-none p-0 text-primary small fw-semibold"
        >
          <i class="bi bi-arrow-repeat me-1"></i> Xem tất cả phương tiện
        </button>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <!-- Tất cả -->
        <button
          type="button"
          class="btn btn-sm px-3 py-2 study-chapter-pill"
          :class="selectedVehicleType === null ? 'active' : 'btn-light border text-secondary'"
          @click="selectVehicleType(null)"
        >
          <i class="bi bi-grid-fill me-1"></i> Tất cả phương tiện (35)
        </button>

        <!-- Nhóm phương tiện -->
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          class="btn btn-sm px-3 py-2 study-chapter-pill d-flex align-items-center gap-2"
          :class="selectedVehicleType === cat.vehicle_type ? 'active' : 'btn-light border text-dark'"
          @click="selectVehicleType(cat.vehicle_type)"
        >
          <i 
            class="bi"
            :class="cat.vehicle_type === 'XE_MAY' ? 'bi-bicycle' : (cat.vehicle_type === 'OTO' ? 'bi-car-front-fill' : 'bi-person-walking')"
          ></i>
          <span>{{ cat.name }}</span>
          <span 
            class="badge rounded-pill"
            :class="selectedVehicleType === cat.vehicle_type ? 'bg-white text-primary' : 'bg-primary-subtle text-primary'"
          >
            {{ cat.fine_count }} lỗi
          </span>
        </button>
      </div>
    </div>

    <!-- Filter Control Bar: Keyword Search & Amount Range Filter -->
    <div class="card border border-light-subtle shadow-sm rounded-4 p-3 mb-4 bg-white">
      <div class="row g-3 align-items-center">
        <!-- Search Keyword -->
        <div class="col-12 col-md-6 col-lg-5">
          <div class="input-group">
            <span class="input-group-text bg-light text-secondary border-end-0">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="searchKeyword"
              @input="handleSearchInput"
              type="text"
              class="form-control border-start-0 ps-0"
              placeholder="Nhập hành vi: nồng độ cồn, tốc độ, đèn đỏ, mũ bảo hiểm..."
            />
            <button 
              v-if="searchKeyword" 
              @click="searchKeyword = ''; loadFines();" 
              class="btn btn-outline-secondary border-start-0" 
              type="button"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <!-- Fine Amount Range Chips -->
        <div class="col-12 col-md-6 col-lg-7">
          <div class="d-flex flex-wrap align-items-center justify-content-md-end gap-1">
            <span class="small text-secondary me-1 d-none d-lg-inline">Khung phạt:</span>
            <button
              type="button"
              class="btn btn-sm py-1 px-2"
              :class="fineRange === 'all' ? 'btn-secondary text-white' : 'btn-outline-secondary'"
              @click="changeFineRange('all')"
            >
              Tất cả
            </button>
            <button
              type="button"
              class="btn btn-sm py-1 px-2"
              :class="fineRange === 'under1m' ? 'btn-success text-white' : 'btn-outline-success'"
              @click="changeFineRange('under1m')"
            >
              &lt; 1 Triệu
            </button>
            <button
              type="button"
              class="btn btn-sm py-1 px-2"
              :class="fineRange === '1m-5m' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'"
              @click="changeFineRange('1m-5m')"
            >
              1 - 5 Triệu
            </button>
            <button
              type="button"
              class="btn btn-sm py-1 px-2"
              :class="fineRange === '5m-10m' ? 'btn-primary text-white' : 'btn-outline-primary'"
              @click="changeFineRange('5m-10m')"
            >
              5 - 10 Triệu
            </button>
            <button
              type="button"
              class="btn btn-sm py-1 px-2"
              :class="fineRange === 'over10m' ? 'btn-danger text-white' : 'btn-outline-danger'"
              @click="changeFineRange('over10m')"
            >
              &gt; 10 Triệu (Nặng)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Filter Summary -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <div class="small text-secondary">
        Tìm thấy <strong class="text-dark">{{ totalFines }}</strong> hành vi vi phạm giao thông
        <span v-if="selectedVehicleType" class="badge bg-primary-subtle text-primary ms-1">
          {{ getVehicleBadge(selectedVehicleType).text }}
        </span>
        <span v-if="fineRange !== 'all'" class="badge bg-warning-subtle text-warning-emphasis ms-1">
          Khung tiền: {{ fineRange }}
        </span>
      </div>

      <div class="d-flex align-items-center gap-2">
        <select 
          v-model="limit" 
          @change="currentPage = 1; loadFines();" 
          class="form-select form-select-sm w-auto"
        >
          <option :value="10">10 kết quả / trang</option>
          <option :value="20">20 kết quả / trang</option>
          <option :value="35">Toàn bộ 35 kết quả</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-warning mb-3" role="status"></div>
      <p class="text-muted fw-semibold">Đang tra cứu cơ sở dữ liệu mức phạt...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="alert alert-danger rounded-4 p-4 text-center" role="alert">
      <i class="bi bi-exclamation-triangle-fill fs-2 text-danger mb-2"></i>
      <h5 class="fw-bold">Có lỗi xảy ra</h5>
      <p class="mb-3">{{ errorMessage }}</p>
      <button @click="loadFines" class="btn btn-outline-danger btn-sm">
        <i class="bi bi-arrow-repeat me-1"></i> Thử lại
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="fines.length === 0" class="text-center py-5 card border-0 shadow-sm rounded-4 p-5">
      <i class="bi bi-search fs-1 text-secondary mb-3"></i>
      <h5 class="fw-bold text-dark">Không tìm thấy mức phạt phù hợp</h5>
      <p class="text-muted small">Hãy thử xóa từ khóa tìm kiếm hoặc chọn lại mức tiền phạt.</p>
      <div>
        <button @click="selectedVehicleType = null; searchKeyword = ''; fineRange = 'all'; loadFines();" class="btn btn-primary btn-sm">
          Khôi phục bộ lọc
        </button>
      </div>
    </div>

    <!-- Fines List -->
    <div v-else class="d-flex flex-column gap-3 mb-4">
      <div
        v-for="fine in fines"
        :key="fine.id"
        class="fine-card p-4"
        :class="getFineCardClass(fine.vehicleType)"
      >
        <div class="d-flex flex-column flex-md-row align-items-md-start justify-content-between gap-3">
          <!-- Left: Violation Content -->
          <div class="flex-grow-1">
            <!-- Badge: Vehicle & Law Reference -->
            <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span class="badge rounded-pill px-3 py-1 fs-xxs" :class="getVehicleBadge(fine.vehicleType).class">
                <i class="bi me-1" :class="getVehicleBadge(fine.vehicleType).icon"></i>
                {{ getVehicleBadge(fine.vehicleType).text }}
              </span>

              <span class="badge bg-light text-secondary border px-2 py-1 rounded-pill fs-xxs">
                <i class="bi bi-book me-1"></i> {{ fine.legalReference }}
              </span>
            </div>

            <!-- Violation Title -->
            <h5 class="fw-bolder text-dark mb-2">
              {{ fine.violationTitle }}
            </h5>

            <!-- Violation Detail Description -->
            <p class="text-secondary small mb-3 lh-base">
              {{ fine.violationDetail }}
            </p>

            <!-- Additional Penalty (Hình phạt bổ sung) -->
            <div 
              v-if="fine.penaltyAddition && fine.penaltyAddition !== 'Không áp dụng hình phạt bổ sung.'"
              class="penalty-addition-box d-flex align-items-start gap-2"
            >
              <i class="bi bi-exclamation-octagon-fill text-danger fs-6 flex-shrink-0 mt-1"></i>
              <div>
                <strong class="text-danger">Hình phạt bổ sung:</strong> 
                <span class="text-dark">{{ fine.penaltyAddition }}</span>
              </div>
            </div>
            <div v-else class="text-muted fs-xxs">
              <i class="bi bi-dash-circle me-1"></i> Không áp dụng hình phạt bổ sung hoặc tạm giữ xe.
            </div>
          </div>

          <!-- Right: Fine Amount Highlight Box -->
          <div class="text-md-end flex-shrink-0 bg-light p-3 rounded-3 border text-center text-md-end">
            <div class="text-secondary fs-xxs fw-bold text-uppercase mb-1">
              Mức tiền phạt
            </div>
            <div class="fine-amount-badge mb-1">
              {{ formatCurrency(fine.minFineAmount) }} - {{ formatCurrency(fine.maxFineAmount) }}
            </div>
            <div class="fs-xxs text-muted">
              Áp dụng theo NĐ 100 & 123
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 pt-3 border-top">
      <div class="small text-secondary">
        Trang <span class="fw-bold text-dark">{{ currentPage }}</span> / <span class="fw-bold text-dark">{{ totalPages }}</span> 
        (Tổng số {{ totalFines }} hành vi vi phạm)
      </div>

      <nav aria-label="Phân trang mức phạt">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button class="page-link" @click="changePage(currentPage - 1)">
              <i class="bi bi-chevron-left me-1"></i> Trước
            </button>
          </li>
          
          <li 
            v-for="p in totalPages" 
            :key="p" 
            class="page-item"
            :class="{ active: p === currentPage }"
          >
            <button 
              v-if="p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)" 
              class="page-link" 
              @click="changePage(p)"
            >
              {{ p }}
            </button>
            <span v-else-if="p === currentPage - 3 || p === currentPage + 3" class="page-link disabled">
              ...
            </span>
          </li>

          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <button class="page-link" @click="changePage(currentPage + 1)">
              Sau <i class="bi bi-chevron-right ms-1"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>
