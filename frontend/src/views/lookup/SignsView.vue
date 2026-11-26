<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient, { resolveAssetUrl } from '../../services/api';

const route = useRoute();
const router = useRouter();

// State
const categories = ref([]);
const signs = ref([]);
const selectedCategoryId = ref(null);
const failedImages = ref(new Set());

const handleImageError = (id) => {
  failedImages.value.add(id);
};
const searchKeyword = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const totalSigns = ref(0);
const limit = ref(12);

const isLoading = ref(false);
const errorMessage = ref('');

// Modal chi tiết biển báo
const selectedSign = ref(null);

// Lấy danh mục 5 nhóm biển báo
const loadCategories = async () => {
  try {
    const res = await apiClient.get('/lookup/signs/categories');
    if (res.success && res.data?.categories) {
      categories.value = res.data.categories;
    }
  } catch (err) {
    console.error('Lỗi tải danh mục biển báo:', err);
  }
};

// Lấy danh sách biển báo theo bộ lọc
const loadSigns = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const params = {
      page: currentPage.value,
      limit: limit.value
    };

    if (selectedCategoryId.value) {
      params.categoryId = selectedCategoryId.value;
    }
    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim();
    }

    const res = await apiClient.get('/lookup/signs', { params });
    if (res.success && res.data) {
      signs.value = res.data.signs || [];
      totalSigns.value = res.data.total || 0;
      totalPages.value = res.data.totalPages || 1;
      currentPage.value = res.data.page || 1;
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải danh sách biển báo';
    signs.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Chọn nhóm biển báo
const selectCategory = (categoryId) => {
  selectedCategoryId.value = categoryId;
  currentPage.value = 1;
  loadSigns();
};

// Phân trang
const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  loadSigns();
  window.scrollTo({ top: 150, behavior: 'smooth' });
};

// Debounce tìm kiếm
let searchTimeout = null;
const handleSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadSigns();
  }, 350);
};

// Màu huy hiệu theo nhóm biển báo
const getCategoryBadgeClass = (categoryCode) => {
  switch (categoryCode) {
    case 'CAM':
      return 'bg-danger-subtle text-danger border border-danger-subtle';
    case 'NGUY_HIEM':
      return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
    case 'HIEU_LENH':
      return 'bg-primary-subtle text-primary border border-primary-subtle';
    case 'CHI_DAN':
      return 'bg-info-subtle text-info-emphasis border border-info-subtle';
    case 'PHU':
      return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
    default:
      return 'bg-light text-dark border';
  }
};

// Màu nút mã biển báo (Sign Code)
const getSignCodeBadgeClass = (categoryCode) => {
  switch (categoryCode) {
    case 'CAM':
      return 'bg-danger text-white';
    case 'NGUY_HIEM':
      return 'bg-warning text-dark';
    case 'HIEU_LENH':
      return 'bg-primary text-white';
    case 'CHI_DAN':
      return 'bg-info text-dark';
    case 'PHU':
      return 'bg-dark text-white';
    default:
      return 'bg-secondary text-white';
  }
};

// Icon fallback nếu ảnh lỗi
const getFallbackIcon = (categoryCode) => {
  switch (categoryCode) {
    case 'CAM':
      return 'bi-slash-circle text-danger';
    case 'NGUY_HIEM':
      return 'bi-exclamation-triangle text-warning';
    case 'HIEU_LENH':
      return 'bi-arrow-up-circle text-primary';
    case 'CHI_DAN':
      return 'bi-info-square text-info';
    case 'PHU':
      return 'bi-card-text text-secondary';
    default:
      return 'bi-signpost-2 text-secondary';
  }
};

// Mở modal chi tiết
const openSignDetail = (sign) => {
  selectedSign.value = sign;
};

// Đóng modal
const closeSignDetail = () => {
  selectedSign.value = null;
};

onMounted(async () => {
  if (route.query.category) {
    selectedCategoryId.value = Number(route.query.category) || null;
  }
  await loadCategories();
  await loadSigns();
});

watch(() => route.query.category, (newVal) => {
  selectedCategoryId.value = newVal ? Number(newVal) : null;
  currentPage.value = 1;
  loadSigns();
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
            <li class="breadcrumb-item"><router-link to="/lookup/signs">Tra cứu</router-link></li>
            <li class="breadcrumb-item active" aria-current="page">Biển báo đường bộ</li>
          </ol>
        </nav>
        <div class="d-flex align-items-center gap-2">
          <h2 class="fw-bolder text-dark mb-0">
            <i class="bi bi-signpost-2-fill text-primary me-2"></i>Hệ Thống Biển Báo Đường Bộ
          </h2>
          <span class="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 fs-xxs">QCVN 41:2019/BGTVT</span>
        </div>
        <p class="text-secondary small mt-1 mb-0">
          Tra cứu đầy đủ 5 nhóm biển báo đường bộ Việt Nam với quy cách hình dạng, màu sắc và ý nghĩa hiệu lệnh.
        </p>
      </div>

      <!-- Quick Link to AI Recognition & Fines Lookup -->
      <div class="d-flex flex-wrap gap-2">
        <router-link to="/lookup/recognize" class="btn btn-primary px-3 py-2 fw-semibold shadow-sm">
          <i class="bi bi-camera-fill me-1"></i> Nhận diện biển báo AI
        </router-link>
        <router-link to="/lookup/fines" class="btn btn-soft-warning px-3 py-2 fw-semibold">
          <i class="bi bi-cash-stack me-1"></i> Tra cứu mức phạt
        </router-link>
      </div>
    </div>

    <!-- Category Tabs / Filter Pills -->
    <div class="card border border-light-subtle shadow-sm rounded-4 p-3 mb-4 bg-white">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <span class="fw-bold text-dark small">
          <i class="bi bi-funnel-fill text-primary me-1"></i> Phân loại theo 5 nhóm biển báo:
        </span>
        <button 
          v-if="selectedCategoryId !== null" 
          @click="selectCategory(null)" 
          class="btn btn-sm btn-link text-decoration-none p-0 text-primary small fw-semibold"
        >
          <i class="bi bi-arrow-repeat me-1"></i> Xem tất cả
        </button>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <!-- Tất cả -->
        <button
          type="button"
          class="btn btn-sm px-3 py-2 study-chapter-pill"
          :class="selectedCategoryId === null ? 'active' : 'btn-light border text-secondary'"
          @click="selectCategory(null)"
        >
          Tất cả biển báo (53)
        </button>

        <!-- 5 nhóm biển -->
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          class="btn btn-sm px-3 py-2 study-chapter-pill d-flex align-items-center gap-2"
          :class="selectedCategoryId === cat.id ? 'active' : 'btn-light border text-dark'"
          @click="selectCategory(cat.id)"
        >
          <span>{{ cat.name }}</span>
          <span 
            class="badge rounded-pill"
            :class="selectedCategoryId === cat.id ? 'bg-white text-primary' : 'bg-primary-subtle text-primary'"
          >
            {{ cat.sign_count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Search Input & Limit Controls -->
    <div class="card border border-light-subtle shadow-sm rounded-4 p-3 mb-4 bg-white">
      <div class="row g-3 align-items-center justify-content-between">
        <!-- Search Keyword -->
        <div class="col-12 col-md-7 col-lg-6">
          <div class="input-group">
            <span class="input-group-text bg-light text-secondary border-end-0">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="searchKeyword"
              @input="handleSearchInput"
              type="text"
              class="form-control border-start-0 ps-0"
              placeholder="Nhập mã biển (P.101, W.201...) hoặc tên biển báo để tra cứu..."
            />
            <button 
              v-if="searchKeyword" 
              @click="searchKeyword = ''; loadSigns();" 
              class="btn btn-outline-secondary border-start-0" 
              type="button"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <!-- Counter & Per Page -->
        <div class="col-12 col-md-5 col-lg-4 text-md-end d-flex align-items-center justify-content-md-end gap-2">
          <span class="small text-secondary">
            Tìm thấy <strong class="text-dark">{{ totalSigns }}</strong> biển báo
          </span>
          <select 
            v-model="limit" 
            @change="currentPage = 1; loadSigns();" 
            class="form-select form-select-sm w-auto"
          >
            <option :value="12">12 biển / trang</option>
            <option :value="24">24 biển / trang</option>
            <option :value="48">48 biển / trang</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <p class="text-muted fw-semibold">Đang tải dữ liệu biển báo...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="alert alert-danger rounded-4 p-4 text-center" role="alert">
      <i class="bi bi-exclamation-triangle-fill fs-2 text-danger mb-2"></i>
      <h5 class="fw-bold">Có lỗi xảy ra</h5>
      <p class="mb-3">{{ errorMessage }}</p>
      <button @click="loadSigns" class="btn btn-outline-danger btn-sm">
        <i class="bi bi-arrow-repeat me-1"></i> Thử lại
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="signs.length === 0" class="text-center py-5 card border-0 shadow-sm rounded-4 p-5">
      <i class="bi bi-sign-stop fs-1 text-secondary mb-3"></i>
      <h5 class="fw-bold text-dark">Không tìm thấy biển báo nào phù hợp</h5>
      <p class="text-muted small">Hãy thử xóa từ khóa tìm kiếm hoặc chọn danh mục khác.</p>
      <div>
        <button @click="selectedCategoryId = null; searchKeyword = ''; loadSigns();" class="btn btn-primary btn-sm">
          Xem tất cả biển báo
        </button>
      </div>
    </div>

    <!-- Signs Grid -->
    <div v-else class="row g-4 mb-4">
      <div 
        v-for="sign in signs" 
        :key="sign.id" 
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <div class="sign-card h-100 p-3 cursor-pointer" @click="openSignDetail(sign)">
          <!-- Top Badges: Sign Code & Category -->
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="badge fw-bold px-2 py-1 rounded-pill fs-xs" :class="getSignCodeBadgeClass(sign.categoryCode)">
              {{ sign.signCode }}
            </span>
            <span class="badge rounded-pill fs-xxs" :class="getCategoryBadgeClass(sign.categoryCode)">
              {{ sign.categoryName }}
            </span>
          </div>

          <!-- Image Container -->
          <div class="sign-img-box rounded-3 mb-3 border">
            <img 
              v-if="sign.imageUrl && !failedImages.has(sign.id)" 
              :src="resolveAssetUrl(sign.imageUrl)" 
              :alt="sign.name" 
              class="sign-img"
              loading="lazy"
              @error="handleImageError(sign.id)"
            />
            <div v-else class="text-center">
              <i class="bi fs-1" :class="getFallbackIcon(sign.categoryCode)"></i>
            </div>
          </div>

          <!-- Sign Name -->
          <h6 class="fw-bolder text-dark mb-1 text-truncate" :title="sign.name">
            {{ sign.name }}
          </h6>

          <!-- Sign Description -->
          <p class="text-secondary fs-xs lh-sm flex-grow-1 mb-3 text-truncate-2">
            {{ sign.description }}
          </p>

          <!-- Action Button -->
          <div class="mt-auto pt-2 border-top d-flex align-items-center justify-content-between">
            <span class="text-primary small fw-semibold">
              Chi tiết quy định <i class="bi bi-arrow-right"></i>
            </span>
            <i class="bi bi-info-circle text-muted"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 pt-3 border-top">
      <div class="small text-secondary">
        Trang <span class="fw-bold text-dark">{{ currentPage }}</span> / <span class="fw-bold text-dark">{{ totalPages }}</span> 
        (Tổng số {{ totalSigns }} biển báo)
      </div>

      <nav aria-label="Phân trang biển báo">
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

    <!-- Modal Chi Tiết Biển Báo -->
    <div 
      v-if="selectedSign" 
      class="modal fade show d-block modal-backdrop-blur" 
      tabindex="-1" 
      role="dialog"
      aria-modal="true"
      @click.self="closeSignDetail"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content rounded-4 border-0 shadow-lg p-3 p-md-4">
          <!-- Modal Header -->
          <div class="modal-header border-0 pb-0">
            <div class="d-flex align-items-center gap-2">
              <span class="badge fw-bold px-3 py-2 rounded-pill fs-6" :class="getSignCodeBadgeClass(selectedSign.categoryCode)">
                {{ selectedSign.signCode }}
              </span>
              <span class="badge rounded-pill px-3 py-2 fs-xs" :class="getCategoryBadgeClass(selectedSign.categoryCode)">
                {{ selectedSign.categoryName }}
              </span>
            </div>
            <button type="button" class="btn-close" @click="closeSignDetail" aria-label="Close"></button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body py-4">
            <div class="row g-4 align-items-center">
              <!-- Sign Image -->
              <div class="col-12 col-md-5 text-center">
                <div class="bg-light p-4 rounded-4 border d-inline-block">
                  <img 
                    v-if="selectedSign.imageUrl && !failedImages.has(selectedSign.id)" 
                    :src="resolveAssetUrl(selectedSign.imageUrl)" 
                    :alt="selectedSign.name" 
                    class="sign-modal-img" 
                    @error="handleImageError(selectedSign.id)"
                  />
                  <div v-else class="py-4">
                    <i class="bi display-1" :class="getFallbackIcon(selectedSign.categoryCode)"></i>
                  </div>
                </div>
              </div>

              <!-- Sign Info & Rules -->
              <div class="col-12 col-md-7">
                <h4 class="fw-bolder text-dark mb-2">
                  {{ selectedSign.name }}
                </h4>
                <div class="text-muted small mb-3">
                  Số hiệu chuẩn: <strong class="text-primary">{{ selectedSign.signCode }}</strong> &bull; QCVN 41:2019/BGTVT
                </div>

                <div class="card bg-light border-0 rounded-3 p-3 mb-3">
                  <div class="fw-bold text-dark small mb-1">
                    <i class="bi bi-info-circle-fill text-primary me-1"></i> Ý nghĩa & Hướng dẫn thi hành:
                  </div>
                  <p class="text-secondary small mb-0 lh-base">
                    {{ selectedSign.description }}
                  </p>
                </div>

                <div class="alert alert-info py-2 px-3 small rounded-3 mb-0">
                  <i class="bi bi-shield-check text-info-emphasis me-1"></i>
                  Tuân thủ nghiêm túc hiệu lệnh của biển báo để đảm bảo an toàn giao thông và tránh bị xử phạt theo Nghị định 100/123.
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-outline-secondary" @click="closeSignDetail">
              Đóng
            </button>
            <router-link to="/lookup/fines" class="btn btn-primary" @click="closeSignDetail">
              <i class="bi bi-cash-stack me-1"></i> Xem mức phạt liên quan
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
