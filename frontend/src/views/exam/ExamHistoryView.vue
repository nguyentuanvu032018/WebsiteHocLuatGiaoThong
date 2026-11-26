<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../../services/api';
import { getGroupLicenseTypes, getLicenseGroup } from '../../utils/licenseGroups';

const route = useRoute();

// Trạng thái dữ liệu
const historySessions = ref([]);
const stats = ref({
  totalExams: 0,
  passedExams: 0,
  failedExams: 0,
  paralysisFailedExams: 0,
  averageScore: 0,
  passRate: 0,
  weakChapters: []
});
const licenseTypes = ref([]);
const groupCode = computed(() => getLicenseGroup(route.query.group)?.code || null);
const selectedGroup = computed(() => getLicenseGroup(groupCode.value));
const visibleLicenseTypes = computed(() => selectedGroup.value
  ? getGroupLicenseTypes(licenseTypes.value, groupCode.value)
  : licenseTypes.value);
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
});

// Trạng thái bộ lọc
const filterLicense = ref('all');
const filterStatus = ref('all'); // 'all', 'passed', 'failed', 'paralysis_failed'

const isLoading = ref(true);
const errorMessage = ref('');

// Lấy danh sách hạng bằng để đưa vào bộ lọc
const fetchLicenseTypes = async () => {
  try {
    const res = await apiClient.get('/exams/license-types');
    if (res.success && Array.isArray(res.data?.licenseTypes)) {
      licenseTypes.value = res.data.licenseTypes;
      if (selectedGroup.value) {
        filterLicense.value = 'all';
      }
    }
  } catch (err) {
    console.error('Không thể tải danh sách hạng bằng:', err);
  }
};

// Lấy lịch sử thi và thống kê cá nhân
const fetchHistory = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  if (selectedGroup.value && visibleLicenseTypes.value.length === 0) {
    historySessions.value = [];
    pagination.total = 0;
    pagination.totalPages = 1;
    stats.value = {
      totalExams: 0,
      passedExams: 0,
      failedExams: 0,
      paralysisFailedExams: 0,
      averageScore: 0,
      passRate: 0,
      weakChapters: []
    };
    isLoading.value = false;
    return;
  }

  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      status: filterStatus.value,
      licenseTypeId: filterLicense.value
    };
    if (selectedGroup.value) {
      params.licenseTypeIds = visibleLicenseTypes.value.map(license => license.id).join(',');
    }

    const res = await apiClient.get('/exams/history', { params });
    if (res.success && res.data) {
      historySessions.value = res.data.sessions || [];
      pagination.total = res.data.total || 0;
      pagination.totalPages = res.data.totalPages || 1;

      if (res.data.stats) {
        stats.value = res.data.stats;
      }
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải lịch sử các lần thi thử';
  } finally {
    isLoading.value = false;
  }
};

// Chuyển trang
const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.page) {
    pagination.page = newPage;
    fetchHistory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Watch bộ lọc thay đổi -> reset về page 1 và tải lại
watch([filterLicense, filterStatus], () => {
  pagination.page = 1;
  fetchHistory();
});

watch(groupCode, async () => {
  await fetchLicenseTypes();
  pagination.page = 1;
  fetchHistory();
});

// Định dạng thời gian
const formatDateTime = (dateStr) => {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n) => String(n).padStart(2, '0');
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  return `${hours}:${minutes} - ${day}/${month}/${year}`;
};

// Định dạng thời lượng làm bài
const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0 giây';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} giây`;
  return `${m}p ${s > 0 ? `${s}s` : ''}`;
};

onMounted(() => {
  fetchLicenseTypes().then(fetchHistory);
});
</script>

<template>
  <div class="container py-4 py-lg-5">
    <!-- Header Title & Action -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <nav aria-label="breadcrumb" class="mb-2">
          <ol class="breadcrumb small">
            <li class="breadcrumb-item">
              <router-link to="/" class="text-secondary">Trang chủ</router-link>
            </li>
            <li class="breadcrumb-item active text-dark fw-semibold" aria-current="page">
              {{ selectedGroup ? `Lịch sử thi hạng ${selectedGroup.label}` : 'Lịch sử thi' }}
            </li>
          </ol>
        </nav>
        <h2 class="fw-bolder text-dark mb-1">
          Lịch Sử Thi & Tiến Độ Cá Nhân
        </h2>
        <p class="text-secondary small mb-0">
          <template v-if="selectedGroup">
            Theo dõi kết quả thi thuộc nhóm hạng {{ selectedGroup.label }}, tỷ lệ đạt và các chương cần ôn thêm.
          </template>
          <template v-else>
            Theo dõi kết quả các lần thi thử sát hạch, phân tích tỷ lệ đậu và phát hiện các chương cần ôn tập thêm.
          </template>
        </p>
      </div>

      <div>
        <router-link :to="{ path: '/exam', query: selectedGroup ? { group: groupCode } : {} }" class="btn btn-primary px-4 py-2 shadow-sm fw-semibold">
          <i class="bi bi-play-circle-fill me-1"></i> Bắt đầu thi thử mới
        </router-link>
      </div>
    </div>

    <!-- 1. OVERALL STAT METRIC CARDS -->
    <div class="row g-3 mb-4">
      <!-- Card 1: Tổng lượt thi -->
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-secondary small fw-semibold">Tổng số lượt thi</span>
            <div class="p-2 rounded-3 bg-primary-subtle text-primary">
              <i class="bi bi-file-earmark-text-fill fs-5"></i>
            </div>
          </div>
          <div class="fs-2 fw-bolder text-dark">{{ stats.totalExams }}</div>
          <div class="text-secondary small">Các đề thi đã hoàn thành</div>
        </div>
      </div>

      <!-- Card 2: Lượt thi ĐẠT -->
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-secondary small fw-semibold">Lượt thi ĐẠT</span>
            <div class="p-2 rounded-3 bg-success-subtle text-success">
              <i class="bi bi-check-circle-fill fs-5"></i>
            </div>
          </div>
          <div class="fs-2 fw-bolder text-success">{{ stats.passedExams }}</div>
          <div class="text-success small fw-semibold">
            <i class="bi bi-pie-chart-fill me-1"></i>Tỷ lệ đậu: {{ stats.passRate }}%
          </div>
        </div>
      </div>

      <!-- Card 3: Lượt thi KHÔNG ĐẠT -->
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-secondary small fw-semibold">Lượt KHÔNG ĐẠT</span>
            <div class="p-2 rounded-3 bg-danger-subtle text-danger">
              <i class="bi bi-x-circle-fill fs-5"></i>
            </div>
          </div>
          <div class="fs-2 fw-bolder text-danger">{{ stats.failedExams }}</div>
          <div class="text-danger small">
            <span v-if="stats.paralysisFailedExams > 0">
              <i class="bi bi-exclamation-octagon-fill me-1"></i>{{ stats.paralysisFailedExams }} lần dính điểm liệt
            </span>
            <span v-else>Chưa từng dính điểm liệt</span>
          </div>
        </div>
      </div>

      <!-- Card 4: Điểm trung bình -->
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-secondary small fw-semibold">Điểm trung bình</span>
            <div class="p-2 rounded-3 bg-info-subtle text-info">
              <i class="bi bi-speedometer2 fs-5"></i>
            </div>
          </div>
          <div class="fs-2 fw-bolder text-primary">{{ stats.averageScore }}</div>
          <div class="text-secondary small">Điểm bình quân mỗi lượt</div>
        </div>
      </div>
    </div>

    <!-- 2. WEAK CHAPTERS RECOMMENDATION BOX -->
    <div 
      v-if="stats.weakChapters && stats.weakChapters.length > 0" 
      class="card border border-warning-subtle shadow-sm rounded-4 p-4 mb-4 bg-warning-subtle"
    >
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div class="d-flex align-items-start gap-3">
          <div class="p-2 rounded-3 bg-warning text-dark flex-shrink-0">
            <i class="bi bi-lightbulb-fill fs-4"></i>
          </div>
          <div>
            <h5 class="fw-bold text-dark mb-1">
              Phân Tích Trọng Tâm Cần Ôn Tập
            </h5>
            <p class="text-secondary small mb-2">
              Dựa trên các bài thi đã làm, hệ thống nhận thấy bạn thường trả lời sai ở các chương lý thuyết sau:
            </p>
            <div class="d-flex flex-wrap gap-2">
              <span 
                v-for="ch in stats.weakChapters" 
                :key="ch.id"
                class="badge bg-white text-danger border border-danger-subtle px-3 py-2 rounded-pill small"
              >
                <i class="bi bi-exclamation-circle-fill me-1"></i>{{ ch.title }} (Sai {{ ch.wrongCount }} câu)
              </span>
            </div>
          </div>
        </div>

        <div class="flex-shrink-0">
          <router-link :to="selectedGroup ? `/study?group=${groupCode}` : '/exam'" class="btn btn-warning text-dark fw-bold px-3 py-2 shadow-sm">
            <i class="bi bi-book me-1"></i> {{ selectedGroup ? 'Ôn tập theo hạng' : 'Chọn hạng để ôn tập' }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- 3. FILTER BAR -->
    <div class="card border border-light-subtle shadow-sm rounded-4 p-3 mb-4 bg-white">
      <div class="row g-3 align-items-center">
        <!-- Filter License -->
        <div class="col-12 col-md-5">
          <label class="form-label small fw-semibold text-secondary mb-1">Hạng bằng sát hạch:</label>
          <select v-model="filterLicense" class="form-select">
            <option value="all">{{ selectedGroup ? `Tất cả hạng ${selectedGroup.label}` : 'Tất cả các hạng bằng' }}</option>
              <option v-for="lic in visibleLicenseTypes" :key="lic.id" :value="lic.id">
              Hạng {{ lic.code }} - {{ lic.name }}
            </option>
          </select>
        </div>

        <!-- Filter Status -->
        <div class="col-12 col-md-5">
          <label class="form-label small fw-semibold text-secondary mb-1">Trạng thái kết quả:</label>
          <select v-model="filterStatus" class="form-select">
            <option value="all">Tất cả trạng thái</option>
            <option value="passed">Chỉ các bài thi ĐẠT</option>
            <option value="failed">Chỉ các bài thi KHÔNG ĐẠT</option>
            <option value="paralysis_failed">Bài thi trượt vì CÂU ĐIỂM LIỆT</option>
          </select>
        </div>

        <!-- Refresh Button -->
        <div class="col-12 col-md-2 d-flex align-items-end">
          <button 
            type="button" 
            class="btn btn-outline-secondary w-100" 
            @click="fetchHistory"
            :disabled="isLoading"
          >
            <i class="bi bi-arrow-clockwise me-1"></i> Tải lại
          </button>
        </div>
      </div>
    </div>

    <!-- 4. HISTORY SESSIONS TABLE & CONTENT -->
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <h6 class="fw-bold text-dark">Đang tải danh sách lịch sử thi...</h6>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="alert alert-danger rounded-4 p-4 text-center" role="alert">
      <i class="bi bi-exclamation-triangle-fill fs-3 mb-2 d-block"></i>
      <h5 class="fw-bold">Lỗi Khi Tải Lịch Sử Thi</h5>
      <p class="small mb-3">{{ errorMessage }}</p>
      <button @click="fetchHistory" class="btn btn-sm btn-outline-danger px-3">
        Thử lại
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="historySessions.length === 0" class="card border border-light-subtle shadow-sm rounded-4 p-5 text-center bg-white">
      <div class="text-secondary mb-3">
        <i class="bi bi-journal-x display-3"></i>
      </div>
      <h4 class="fw-bolder text-dark mb-2">Chưa Có Lịch Sử Thi Nào</h4>
      <p class="text-secondary small mb-4">
        Bạn chưa hoàn thành bài thi sát hạch nào phù hợp với bộ lọc hiện tại. Hãy thử chọn hạng bằng và bắt đầu làm bài thi đầu tiên!
      </p>
      <div>
        <router-link :to="{ path: '/exam', query: selectedGroup ? { group: groupCode } : {} }" class="btn btn-primary px-4 py-2">
          <i class="bi bi-play-circle-fill me-1"></i> Vào phòng thi thử ngay
        </router-link>
      </div>
    </div>

    <!-- Data Table -->
    <div v-else class="card border border-light-subtle shadow-sm rounded-4 bg-white overflow-hidden mb-4">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col" class="ps-4 text-secondary small fw-bold">MÃ BÀI</th>
              <th scope="col" class="text-secondary small fw-bold">HẠNG BẰNG</th>
              <th scope="col" class="text-secondary small fw-bold">NGÀY THI</th>
              <th scope="col" class="text-secondary small fw-bold">THỜI GIAN LÀM</th>
              <th scope="col" class="text-secondary small fw-bold">ĐIỂM SỐ</th>
              <th scope="col" class="text-secondary small fw-bold">KẾT QUẢ</th>
              <th scope="col" class="text-end pe-4 text-secondary small fw-bold">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in historySessions" :key="item.id">
              <!-- Mã bài thi -->
              <td class="ps-4 fw-bold text-dark">
                #{{ item.id }}
              </td>

              <!-- Hạng bằng -->
              <td>
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1 fw-bold">
                  Hạng {{ item.licenseCode }}
                </span>
                <div class="text-secondary fs-xxs mt-1 text-truncate" style="max-width: 150px;">
                  {{ item.licenseName }}
                </div>
              </td>

              <!-- Ngày thi -->
              <td>
                <div class="small fw-semibold text-dark">
                  {{ formatDateTime(item.submittedAt || item.startedAt) }}
                </div>
              </td>

              <!-- Thời gian làm bài -->
              <td>
                <span class="text-secondary small">
                  <i class="bi bi-clock me-1"></i>{{ formatDuration(item.timeSpentSeconds) }}
                </span>
              </td>

              <!-- Điểm số -->
              <td>
                <div class="fw-bolder" :class="item.isPassed ? 'text-success' : 'text-danger'">
                  {{ item.score }} / {{ item.totalQuestions }}
                </div>
                <div class="text-secondary fs-xxs">
                  (Chuẩn đạt: {{ item.passingScore }}+)
                </div>
              </td>

              <!-- Trạng thái kết quả -->
              <td>
                <div class="d-flex flex-column align-items-start gap-1">
                  <span 
                    v-if="item.isPassed" 
                    class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill"
                  >
                    <i class="bi bi-check-circle-fill me-1"></i>ĐẠT
                  </span>
                  <span 
                    v-else 
                    class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded-pill"
                  >
                    <i class="bi bi-x-circle-fill me-1"></i>KHÔNG ĐẠT
                  </span>

                  <!-- Cảnh báo nếu trượt vì câu điểm liệt -->
                  <span 
                    v-if="item.hasParalysisFailed" 
                    class="badge bg-danger text-white fs-xxs rounded-pill"
                    title="Trượt do sai câu điểm liệt"
                  >
                    <i class="bi bi-exclamation-octagon me-1"></i>Lỗi điểm liệt
                  </span>
                </div>
              </td>

              <!-- Thao tác -->
              <td class="text-end pe-4">
                <div class="d-flex justify-content-end gap-2">
                  <router-link 
                    :to="`/exam/review/${item.id}`" 
                    class="btn btn-sm btn-outline-primary px-3 py-1 fw-semibold"
                    title="Xem lại từng câu hỏi và đáp án"
                  >
                    <i class="bi bi-card-checklist me-1"></i> Xem lại
                  </router-link>
                  <router-link 
                    to="/exam" 
                    class="btn btn-sm btn-soft-primary px-2 py-1"
                    title="Thi lại đề thi mới"
                  >
                    <i class="bi bi-arrow-repeat"></i>
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 p-3 border-top bg-light">
        <div class="text-secondary small">
          Hiển thị 
          <strong class="text-dark">
            {{ (pagination.page - 1) * pagination.limit + (historySessions.length > 0 ? 1 : 0) }}
          </strong> 
          - 
          <strong class="text-dark">
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
          </strong> 
          trên tổng số 
          <strong class="text-dark">{{ pagination.total }}</strong> lượt thi
        </div>

        <nav v-if="pagination.totalPages > 1" aria-label="Page navigation">
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: pagination.page === 1 }">
              <button 
                class="page-link" 
                @click="changePage(pagination.page - 1)" 
                aria-label="Previous"
              >
                &laquo;
              </button>
            </li>

            <li 
              v-for="p in pagination.totalPages" 
              :key="p" 
              class="page-item"
              :class="{ active: pagination.page === p }"
            >
              <button class="page-link" @click="changePage(p)">
                {{ p }}
              </button>
            </li>

            <li class="page-item" :class="{ disabled: pagination.page === pagination.totalPages }">
              <button 
                class="page-link" 
                @click="changePage(pagination.page + 1)" 
                aria-label="Next"
              >
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>
