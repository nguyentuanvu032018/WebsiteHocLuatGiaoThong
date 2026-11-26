<script setup>
import { ref, computed, onMounted } from 'vue';
import apiClient from '../../services/api';

const isLoading = ref(true);
const errorMessage = ref('');
const lastUpdated = ref('');

const kpi = ref({
  totalStudents: 0,
  totalAdmins: 0,
  totalQuestions: 0,
  totalParalysisQuestions: 0,
  totalExams: 0,
  passedExams: 0,
  failedExams: 0,
  normalFailedExams: 0,
  paralysisFailedExams: 0,
  passRate: 0,
  averageScore: 0,
  totalSigns: 0,
  totalFines: 0
});

const licenseStats = ref([]);
const chapterStats = ref([]);
const trends = ref([]);
const recentExams = ref([]);
const topStudents = ref([]);
const selectedTrendIndex = ref(null);

const fetchDashboardStats = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const res = await apiClient.get('/admin/dashboard/stats');
    if (res.success && res.data) {
      kpi.value = {
        ...kpi.value,
        ...res.data.kpi
      };

      if (kpi.value.normalFailedExams === undefined) {
        kpi.value.normalFailedExams = Math.max(0, kpi.value.failedExams - kpi.value.paralysisFailedExams);
      }

      licenseStats.value = res.data.licenseStats || [];
      chapterStats.value = res.data.chapterStats || [];
      trends.value = res.data.trends || [];
      recentExams.value = res.data.recentExams || [];
      topStudents.value = res.data.topStudents || [];

      if (trends.value.length > 0) {
        selectedTrendIndex.value = trends.value.length - 1;
      }

      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      lastUpdated.value = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải số liệu thống kê Dashboard';
  } finally {
    isLoading.value = false;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0 giây';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} giây`;
  return `${m}p ${s > 0 ? `${s}s` : ''}`;
};

const total7DaysExams = computed(() =>
  trends.value.reduce((acc, cur) => acc + (cur.totalCount || 0), 0)
);

const passed7DaysExams = computed(() =>
  trends.value.reduce((acc, cur) => acc + (cur.passedCount || 0), 0)
);

const failed7DaysExams = computed(() =>
  trends.value.reduce((acc, cur) => acc + (cur.failedCount || 0), 0)
);

const passRate7Days = computed(() => {
  if (total7DaysExams.value === 0) return 0;
  return Math.round((passed7DaysExams.value / total7DaysExams.value) * 100);
});

const maxTrendCount = computed(() => {
  const max = Math.max(...trends.value.map((t) => t.totalCount || 0), 0);
  return max < 5 ? 5 : max;
});

const activeTrendDay = computed(() => {
  if (selectedTrendIndex.value !== null && trends.value[selectedTrendIndex.value]) {
    return trends.value[selectedTrendIndex.value];
  }
  return null;
});

const DONUT_RADIUS = 60;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

const donutData = computed(() => {
  const total = kpi.value.totalExams || 0;
  if (total === 0) {
    return {
      empty: true,
      passedDash: '0 377',
      passedOffset: 0,
      normalFailDash: '0 377',
      normalFailOffset: 0,
      paralysisFailDash: '0 377',
      paralysisFailOffset: 0,
      passPercent: 0,
      normalFailPercent: 0,
      paralysisFailPercent: 0
    };
  }

  const passed = kpi.value.passedExams || 0;
  const normalFail = kpi.value.normalFailedExams || 0;
  const paralysisFail = kpi.value.paralysisFailedExams || 0;
  const passRatio = passed / total;
  const normalFailRatio = normalFail / total;
  const paralysisFailRatio = paralysisFail / total;

  const passedLength = passRatio * DONUT_CIRCUMFERENCE;
  const normalFailLength = normalFailRatio * DONUT_CIRCUMFERENCE;
  const paralysisFailLength = paralysisFailRatio * DONUT_CIRCUMFERENCE;
  const exactPercentages = [passed, normalFail, paralysisFail].map((count) => (count / total) * 100);
  const displayPercentages = exactPercentages.map(Math.floor);
  const remainingPercentagePoints = 100 - displayPercentages.reduce((sum, percentage) => sum + percentage, 0);
  const remainderOrder = exactPercentages
    .map((percentage, index) => ({ index, remainder: percentage - Math.floor(percentage) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  for (let i = 0; i < remainingPercentagePoints; i += 1) {
    displayPercentages[remainderOrder[i].index] += 1;
  }

  return {
    empty: false,
    passedDash: `${passedLength} ${DONUT_CIRCUMFERENCE}`,
    passedOffset: 0,
    normalFailDash: `${normalFailLength} ${DONUT_CIRCUMFERENCE}`,
    normalFailOffset: -passedLength,
    paralysisFailDash: `${paralysisFailLength} ${DONUT_CIRCUMFERENCE}`,
    paralysisFailOffset: -(passedLength + normalFailLength),
    passPercent: displayPercentages[0],
    normalFailPercent: displayPercentages[1],
    paralysisFailPercent: displayPercentages[2]
  };
});

onMounted(() => {
  fetchDashboardStats();
});
</script>

<template>
  <div class="container-fluid py-4 px-md-4">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <!-- <nav aria-label="breadcrumb" class="mb-2">
          <ol class="breadcrumb small">
            <li class="breadcrumb-item">
              <router-link to="/" class="text-secondary">Cổng học viên</router-link>
            </li>
            <li class="breadcrumb-item active text-dark fw-semibold" aria-current="page">
              Admin Dashboard
            </li>
          </ol>
        </nav> -->
        <div class="d-flex align-items-center gap-2">
          <h2 class="fw-bolder text-dark mb-0">Bảng Điều Khiển Quản Trị Hệ Thống</h2>
          <span v-if="lastUpdated" class="badge bg-light text-secondary border d-none d-sm-inline-block">
            <i class="bi bi-clock me-1"></i>Cập nhật lúc {{ lastUpdated }}
          </span>
        </div>
        <p class="text-secondary small mb-0 mt-1">
          Theo dõi số lượng học viên, số lượt thi sát hạch và các chỉ số biểu đồ kết quả thời gian thực.
        </p>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <!-- <router-link to="/admin/questions" class="btn btn-outline-primary px-3 py-2 fw-semibold">
          <i class="bi bi-question-diamond me-1"></i> Quản lý câu hỏi
        </router-link>
        <router-link to="/admin/users" class="btn btn-outline-primary px-3 py-2 fw-semibold">
          <i class="bi bi-people me-1"></i> Quản lý người dùng
        </router-link> -->
        <button @click="fetchDashboardStats" class="btn btn-primary px-3 py-2 fw-semibold shadow-sm" :disabled="isLoading">
          <i class="bi bi-arrow-clockwise me-1" :class="{ 'animate-spin': isLoading }"></i> Làm mới dữ liệu
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <h5 class="fw-bold text-dark">Đang tổng hợp dữ liệu thống kê hệ thống...</h5>
      <p class="text-secondary small">Vui lòng đợi trong giây lát</p>
    </div>

    <div v-else-if="errorMessage" class="alert alert-danger rounded-4 p-4 text-center mb-4" role="alert">
      <i class="bi bi-exclamation-triangle-fill fs-3 mb-2 d-block"></i>
      <h5 class="fw-bold">Lỗi Khi Tải Số Liệu Dashboard</h5>
      <p class="small mb-3">{{ errorMessage }}</p>
      <button @click="fetchDashboardStats" class="btn btn-sm btn-outline-danger px-4 py-2">Thử lại</button>
    </div>

    <div v-else>
      <div class="row g-3 mb-4">
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-semibold">Tổng số học viên</span>
              <div class="p-2 rounded-3 bg-primary-subtle text-primary"><i class="bi bi-people-fill fs-4"></i></div>
            </div>
            <div class="display-6 fw-bolder text-dark">{{ kpi.totalStudents }}</div>
            <div class="text-secondary small mt-1">+{{ kpi.totalAdmins }} tài khoản quản trị viên</div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-semibold">Tổng lượt thi đã nộp</span>
              <div class="p-2 rounded-3 bg-info-subtle text-info"><i class="bi bi-file-earmark-check-fill fs-4"></i></div>
            </div>
            <div class="display-6 fw-bolder text-info">{{ kpi.totalExams }}</div>
            <div class="text-secondary small mt-1">
              Đạt: <strong class="text-success">{{ kpi.passedExams }}</strong> | Rớt: <strong class="text-danger">{{ kpi.failedExams }}</strong>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-semibold">Tỷ lệ đậu bình quân</span>
              <div class="p-2 rounded-3 bg-success-subtle text-success"><i class="bi bi-check-circle-fill fs-4"></i></div>
            </div>
            <div class="display-6 fw-bolder text-success">{{ kpi.passRate }}%</div>
            <div class="progress mt-2" role="progressbar" aria-label="Tỷ lệ đậu">
              <div class="progress-bar bg-success" :style="{ width: kpi.passRate + '%' }"></div>
            </div>
            <div class="text-secondary small mt-2">Điểm trung bình: <strong class="text-dark">{{ kpi.averageScore }}</strong> câu đúng</div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-semibold">Ngân hàng câu hỏi</span>
              <div class="p-2 rounded-3 bg-warning-subtle text-warning-emphasis"><i class="bi bi-question-diamond-fill fs-4 text-warning"></i></div>
            </div>
            <div class="display-6 fw-bolder text-dark">{{ kpi.totalQuestions }}</div>
            <div class="text-danger small mt-1 fw-semibold"><i class="bi bi-exclamation-octagon-fill me-1"></i>{{ kpi.totalParalysisQuestions }} câu hỏi điểm liệt</div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-12 col-xl-8">
          <div class="card border border-light-subtle shadow-sm rounded-4 p-4 bg-white h-100">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom">
              <div>
                <h5 class="fw-bold text-dark mb-0"><i class="bi bi-bar-chart-line-fill text-primary me-2"></i>Biểu Đồ Xu Hướng Sát Hạch 7 Ngày Gần Nhất</h5>
                <p class="text-secondary small mb-0">So sánh số lượng bài thi ĐẠT và RỚT theo từng ngày trong tuần</p>
              </div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="badge bg-light text-secondary border px-3 py-2">Tổng 7 ngày: <strong class="text-dark">{{ total7DaysExams }}</strong> lượt</span>
                <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2"><i class="bi bi-check-circle-fill me-1"></i>Đạt: {{ passed7DaysExams }} ({{ passRate7Days }}%)</span>
              </div>
            </div>

            <div class="w-100 position-relative py-2">
              <div class="d-flex align-items-end gap-3" style="height: 220px;">
                <div v-for="(t, idx) in trends" :key="t.dateKey" class="flex-fill position-relative d-flex flex-column align-items-center justify-content-end" style="height: 100%;">
                  <div v-if="selectedTrendIndex === idx" class="small text-primary mb-2 fw-semibold">{{ t.totalCount || 0 }}</div>
                  <div class="d-flex align-items-end gap-1" style="height: 170px;">
                    <div class="rounded-top" :style="{ height: ((t.passedCount || 0) / Math.max(maxTrendCount, 1) * 100) + '%', width: '18px', background: '#2ac59f' }" :title="`Đạt: ${t.passedCount || 0}`"></div>
                    <div class="rounded-top" :style="{ height: ((t.failedCount || 0) / Math.max(maxTrendCount, 1) * 100) + '%', width: '18px', background: '#ef4444' }" :title="`Rớt: ${t.failedCount || 0}`"></div>
                  </div>
                  <div class="mt-2 small text-secondary">{{ t.dateLabel || t.dateKey }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-xl-4">
          <div class="card border border-light-subtle shadow-sm rounded-4 p-4 bg-white h-100">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <h5 class="fw-bold text-dark mb-0"><i class="bi bi-pie-chart-fill text-primary me-2"></i>Tỷ Lệ Kết Quả Thi</h5>
              <span class="badge bg-soft-light text-secondary border">{{ kpi.totalExams }} lượt</span>
            </div>

            <div class="d-flex align-items-center justify-content-center py-3">
              <svg width="220" height="220" viewBox="0 0 220 220" aria-label="Biểu đồ kết quả thi" class="me-2">
                <circle cx="110" cy="110" r="60" fill="none" stroke="#e2e8f0" stroke-width="26"></circle>
                <circle cx="110" cy="110" r="60" fill="none" stroke="#22c55e" stroke-width="26" stroke-linecap="round" :stroke-dasharray="donutData.passedDash" :stroke-dashoffset="donutData.passedOffset" transform="rotate(-90 110 110)"></circle>
                <circle cx="110" cy="110" r="60" fill="none" stroke="#f59e0b" stroke-width="26" stroke-linecap="round" :stroke-dasharray="donutData.normalFailDash" :stroke-dashoffset="donutData.normalFailOffset" transform="rotate(-90 110 110)"></circle>
                <circle cx="110" cy="110" r="60" fill="none" stroke="#ef4444" stroke-width="26" stroke-linecap="round" :stroke-dasharray="donutData.paralysisFailDash" :stroke-dashoffset="donutData.paralysisFailOffset" transform="rotate(-90 110 110)"></circle>
              </svg>
              <div class="text-center">
                <div class="display-6 fw-bolder text-dark">{{ kpi.passRate }}%</div>
                <div class="text-secondary small">Tỷ lệ đạt</div>
              </div>
            </div>

            <div class="mt-3">
              <div class="d-flex justify-content-between align-items-center mb-2"><span class="text-success"><i class="bi bi-circle-fill me-2"></i>Đạt</span><strong>{{ donutData.passPercent }}%</strong></div>
              <div class="d-flex justify-content-between align-items-center mb-2"><span class="text-warning"><i class="bi bi-circle-fill me-2"></i>Rớt thông thường</span><strong>{{ donutData.normalFailPercent }}%</strong></div>
              <div class="d-flex justify-content-between align-items-center"><span class="text-danger"><i class="bi bi-circle-fill me-2"></i>Rớt điểm liệt</span><strong>{{ donutData.paralysisFailPercent }}%</strong></div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-12 col-xl-7">
          <div class="card border border-light-subtle shadow-sm rounded-4 p-4 bg-white h-100">
            <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h5 class="fw-bold text-dark mb-0"><i class="bi bi-people-fill text-primary me-2"></i>Học viên xuất sắc</h5>
              <span class="text-secondary small">Top 5</span>
            </div>
            <div class="table-responsive">
              <table class="table table-borderless align-middle mb-0">
                <thead>
                  <tr class="small text-secondary">
                    <th>Học viên</th>
                    <th>Điểm TB</th>
                    <th>Lượt thi</th>
                    <th>Đạt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in topStudents" :key="student.id">
                    <td class="fw-semibold text-dark">{{ student.fullName || 'Học viên' }}</td>
                    <td>{{ student.avgScore ?? 0 }}</td>
                    <td>{{ student.examCount || 0 }}</td>
                    <td><span class="badge bg-success-subtle text-success">{{ student.passedCount || 0 }}</span></td>
                  </tr>
                  <tr v-if="topStudents.length === 0">
                    <td colspan="4" class="text-secondary text-center py-3">Chưa có dữ liệu học viên xuất sắc</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="col-12 col-xl-5">
          <div class="card border border-light-subtle shadow-sm rounded-4 p-4 bg-white h-100">
            <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h5 class="fw-bold text-dark mb-0"><i class="bi bi-clock-history text-primary me-2"></i>Thi gần đây</h5>
              <span class="text-secondary small">Mới nhất</span>
            </div>
            <div class="d-flex flex-column gap-3">
              <div v-for="exam in recentExams.slice(0, 5)" :key="exam.id" class="d-flex justify-content-between align-items-center border rounded-3 p-3 bg-light-subtle">
                <div>
                  <div class="fw-semibold text-dark">{{ exam.userName || 'Học viên' }}</div>
                  <div class="small text-secondary">{{ exam.licenseCode || 'Lý thuyết' }} • {{ formatDateTime(exam.submittedAt) }}</div>
                </div>
                <span :class="exam.isPassed ? 'badge bg-success-subtle text-success' : 'badge bg-danger-subtle text-danger'">
                  {{ exam.isPassed ? 'Đạt' : 'Rớt' }}
                </span>
              </div>
              <div v-if="recentExams.length === 0" class="text-secondary small text-center py-3">Chưa có lịch sử thi gần đây.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
