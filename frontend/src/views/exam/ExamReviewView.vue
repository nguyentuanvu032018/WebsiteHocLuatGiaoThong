<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient, { resolveAssetUrl } from '../../services/api';

const route = useRoute();
const router = useRouter();

const sessionId = route.params.id;

// Trạng thái bài thi
const session = ref(null);
const questions = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');

// Bộ lọc & tìm kiếm
const selectedFilter = ref('all'); // 'all', 'wrong', 'unanswered', 'correct', 'paralysis'
const selectedChapter = ref('all');
const searchKeyword = ref('');
const activeQuestionId = ref(null);

// Lấy thông tin phiên thi đã nộp từ API
const fetchExamSession = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const res = await apiClient.get(`/exams/${sessionId}`);
    if (res.success && res.data?.examSession) {
      session.value = res.data.examSession;
      // Gán thêm index thứ tự 1..N vào câu hỏi để dễ hiển thị
      questions.value = (res.data.examSession.questions || []).map((q, idx) => ({
        ...q,
        indexInExam: idx + 1
      }));
    } else {
      errorMessage.value = 'Không tìm thấy thông tin bài thi này';
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải chi tiết bài thi để xem lại';
  } finally {
    isLoading.value = false;
  }
};

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

// Định dạng thời lượng
const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0 giây';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} giây`;
  return `${m} phút ${s > 0 ? `${s} giây` : ''}`;
};

// Thống kê số lượng
const correctCount = computed(() => {
  return questions.value.filter(q => q.isCorrect === true).length;
});

const wrongCount = computed(() => {
  return questions.value.filter(q => q.isCorrect === false && q.selectedAnswerId !== null).length;
});

const unansweredCount = computed(() => {
  return questions.value.filter(q => q.selectedAnswerId === null).length;
});

const paralysisQuestions = computed(() => {
  return questions.value.filter(q => q.isParalysis);
});

const paralysisWrongCount = computed(() => {
  return questions.value.filter(q => q.isParalysis && q.isCorrect === false).length;
});

const scorePercentage = computed(() => {
  if (!session.value || !session.value.totalQuestions) return 0;
  return Math.round((session.value.score / session.value.totalQuestions) * 100);
});

// Danh sách các chương có trong đề thi
const availableChapters = computed(() => {
  const chaptersMap = new Map();
  questions.value.forEach(q => {
    if (q.chapterId && q.chapterTitle) {
      chaptersMap.set(q.chapterId, q.chapterTitle);
    }
  });
  return Array.from(chaptersMap.entries()).map(([id, title]) => ({ id, title }));
});

// Danh sách câu hỏi sau khi áp dụng bộ lọc và tìm kiếm
const filteredQuestions = computed(() => {
  return questions.value.filter(q => {
    // 1. Lọc theo trạng thái kết quả
    if (selectedFilter.value === 'wrong') {
      if (q.isCorrect === true || q.selectedAnswerId === null) return false;
    } else if (selectedFilter.value === 'unanswered') {
      if (q.selectedAnswerId !== null) return false;
    } else if (selectedFilter.value === 'correct') {
      if (q.isCorrect !== true) return false;
    } else if (selectedFilter.value === 'paralysis') {
      if (!q.isParalysis) return false;
    }

    // 2. Lọc theo chương
    if (selectedChapter.value !== 'all' && q.chapterId !== Number(selectedChapter.value)) {
      return false;
    }

    // 3. Tìm kiếm theo từ khóa
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim().toLowerCase();
      const inContent = (q.content || '').toLowerCase().includes(keyword);
      const inAnswers = (q.answers || []).some(a => (a.answerText || '').toLowerCase().includes(keyword));
      const inExplanation = (q.explanation || '').toLowerCase().includes(keyword);
      if (!inContent && !inAnswers && !inExplanation) return false;
    }

    return true;
  });
});

// Cuộn mượt đến câu hỏi cụ thể
const scrollToQuestion = (questionId) => {
  activeQuestionId.value = questionId;
  const el = document.getElementById(`review-question-${questionId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

onMounted(() => {
  fetchExamSession();
});
</script>

<template>
  <div class="container py-4 py-lg-5">
    <!-- 1. LOADING STATE -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <h5 class="fw-bold text-dark">Đang tải chi tiết bài thi sát hạch...</h5>
      <p class="text-secondary small">Vui lòng chờ trong giây lát</p>
    </div>

    <!-- 2. ERROR STATE -->
    <div v-else-if="errorMessage" class="text-center py-5">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">
          <div class="card border border-light-subtle shadow-sm rounded-4 p-4 p-md-5 bg-white">
            <div class="text-danger mb-3">
              <i class="bi bi-exclamation-triangle-fill display-4"></i>
            </div>
            <h4 class="fw-bold text-dark mb-2">Không Thể Tải Bài Thi</h4>
            <p class="text-secondary small mb-4">{{ errorMessage }}</p>
            <div class="d-flex justify-content-center gap-2">
              <button @click="fetchExamSession" class="btn btn-primary px-4 py-2">
                <i class="bi bi-arrow-clockwise me-1"></i> Thử lại
              </button>
              <router-link to="/exam/history" class="btn btn-outline-secondary px-4 py-2">
                <i class="bi bi-clock-history me-1"></i> Lịch sử thi
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. MAIN REVIEW CONTENT -->
    <div v-else-if="session">
      <!-- Breadcrumb Navigation -->
      <nav aria-label="breadcrumb" class="mb-3 d-print-none">
        <ol class="breadcrumb small">
          <li class="breadcrumb-item">
            <router-link to="/" class="text-secondary">Trang chủ</router-link>
          </li>
          <li class="breadcrumb-item">
            <router-link to="/exam/history" class="text-secondary">Lịch sử thi</router-link>
          </li>
          <li class="breadcrumb-item active text-dark fw-semibold" aria-current="page">
            Xem lại bài thi #{{ session.id }}
          </li>
        </ol>
      </nav>

      <!-- Exam Summary Header Card -->
      <div class="card border border-light-subtle shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-3 border-bottom">
          <div>
            <div class="d-flex align-items-center gap-2 mb-2">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill fw-bold">
                HẠNG {{ session.licenseCode }}
              </span>
              <span class="text-secondary small">
                Bài thi mã số: #{{ session.id }}
              </span>
            </div>
            <h2 class="fw-bolder text-dark mb-1">
              Xem Lại Chi Tiết Bài Làm Sát Hạch
            </h2>
            <div class="d-flex flex-wrap align-items-center gap-3 text-secondary small">
              <span>
                <i class="bi bi-calendar-event me-1"></i>Nộp bài: {{ formatDateTime(session.submittedAt) }}
              </span>
              <span>
                <i class="bi bi-stopwatch me-1"></i>Thời gian làm: {{ formatDuration(session.timeSpentSeconds) }}
              </span>
              <span>
                <i class="bi bi-file-earmark-text me-1"></i>Tổng số: {{ session.totalQuestions }} câu hỏi
              </span>
            </div>
          </div>

          <!-- Result & Score Box -->
          <div class="text-md-end">
            <div class="mb-2">
              <span 
                v-if="session.isPassed" 
                class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fs-6 rounded-pill fw-bold"
              >
                <i class="bi bi-check-circle-fill me-1"></i>ĐẠT YÊU CẦU
              </span>
              <span 
                v-else 
                class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 fs-6 rounded-pill fw-bold"
              >
                <i class="bi bi-x-circle-fill me-1"></i>KHÔNG ĐẠT
              </span>
            </div>
            <div class="display-6 fw-bolder" :class="session.isPassed ? 'text-success' : 'text-danger'">
              {{ session.score }} / {{ session.totalQuestions }}
              <span class="fs-6 text-secondary fw-normal">điểm (Đạt: {{ session.passingScore }}+)</span>
            </div>
          </div>
        </div>

        <!-- Paralysis Failure Alert if Applicable -->
        <div 
          v-if="session.hasParalysisFailed" 
          class="alert alert-danger d-flex align-items-center gap-3 mt-3 mb-0 rounded-3 py-3 px-4" 
          role="alert"
        >
          <i class="bi bi-exclamation-octagon-fill fs-3 text-danger flex-shrink-0"></i>
          <div>
            <div class="fw-bold">CẢNH BÁO: BÀI THI BỊ ĐÁNH TRƯỢT VÌ CÂU HỎI ĐIỂM LIỆT!</div>
            <div class="small text-danger-emphasis">
              Thí sinh đã trả lời sai {{ paralysisWrongCount }} câu hỏi điểm liệt bắt buộc. Theo quy chế của Bộ GTVT, dù tổng điểm đạt nhưng sai câu điểm liệt thì bài thi vẫn bị đánh Không Đạt.
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Bar -->
      <div class="row g-3 mb-4">
        <!-- Metric 1: Đúng -->
        <div class="col-6 col-md-3">
          <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white h-100">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="text-secondary small fw-semibold">Số câu đúng</span>
              <i class="bi bi-check-circle-fill text-success fs-5"></i>
            </div>
            <div class="fs-3 fw-bold text-success">{{ correctCount }}</div>
            <div class="small text-secondary">Tỷ lệ: {{ scorePercentage }}%</div>
          </div>
        </div>

        <!-- Metric 2: Sai -->
        <div class="col-6 col-md-3">
          <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white h-100">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="text-secondary small fw-semibold">Số câu sai</span>
              <i class="bi bi-x-circle-fill text-danger fs-5"></i>
            </div>
            <div class="fs-3 fw-bold text-danger">{{ wrongCount }}</div>
            <div class="small text-secondary">Chọn nhầm đáp án</div>
          </div>
        </div>

        <!-- Metric 3: Bỏ trống -->
        <div class="col-6 col-md-3">
          <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white h-100">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="text-secondary small fw-semibold">Bỏ trống</span>
              <i class="bi bi-dash-circle-fill text-secondary fs-5"></i>
            </div>
            <div class="fs-3 fw-bold text-secondary">{{ unansweredCount }}</div>
            <div class="small text-secondary">Chưa chọn câu trả lời</div>
          </div>
        </div>

        <!-- Metric 4: Câu điểm liệt -->
        <div class="col-6 col-md-3">
          <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white h-100">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="text-secondary small fw-semibold">Câu điểm liệt</span>
              <i class="bi bi-shield-exclamation text-warning fs-5"></i>
            </div>
            <div class="fs-3 fw-bold" :class="session.hasParalysisFailed ? 'text-danger' : 'text-success'">
              {{ paralysisQuestions.length }}
            </div>
            <div class="small" :class="session.hasParalysisFailed ? 'text-danger fw-semibold' : 'text-success'">
              {{ session.hasParalysisFailed ? `Sai ${paralysisWrongCount} câu` : 'Đúng 100%' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Main Review Two-Column Layout -->
      <div class="row g-4">
        <!-- LEFT COLUMN: Filter Bar & Questions List -->
        <div class="col-12 col-lg-8 col-xl-9 print-full-width">
          <!-- Filter Controls Card -->
          <div class="card border border-light-subtle shadow-sm rounded-4 p-3 mb-4 bg-white d-print-none">
            <div class="row g-3 align-items-center">
              <!-- Search Input -->
              <div class="col-12 col-md-6">
                <div class="input-group">
                  <span class="input-group-text bg-light text-secondary border-end-0">
                    <i class="bi bi-search"></i>
                  </span>
                  <input
                    v-model="searchKeyword"
                    type="text"
                    class="form-control border-start-0 ps-0"
                    placeholder="Tìm câu hỏi theo từ khóa..."
                  />
                  <button 
                    v-if="searchKeyword" 
                    @click="searchKeyword = ''" 
                    class="btn btn-outline-secondary border-start-0" 
                    type="button"
                  >
                    <i class="bi bi-x"></i>
                  </button>
                </div>
              </div>

              <!-- Chapter Selector -->
              <div class="col-12 col-md-6">
                <select v-model="selectedChapter" class="form-select">
                  <option value="all">Tất cả các chương ({{ questions.length }} câu)</option>
                  <option v-for="ch in availableChapters" :key="ch.id" :value="ch.id">
                    {{ ch.title }}
                  </option>
                </select>
              </div>

              <!-- Status Filter Buttons -->
              <div class="col-12">
                <div class="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="btn btn-sm py-1 px-3 rounded-pill"
                    :class="selectedFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'"
                    @click="selectedFilter = 'all'"
                  >
                    Tất cả ({{ questions.length }})
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm py-1 px-3 rounded-pill"
                    :class="selectedFilter === 'wrong' ? 'btn-danger' : 'btn-outline-danger'"
                    @click="selectedFilter = 'wrong'"
                  >
                    <i class="bi bi-x-circle me-1"></i> Câu làm sai ({{ wrongCount }})
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm py-1 px-3 rounded-pill"
                    :class="selectedFilter === 'unanswered' ? 'btn-secondary text-white' : 'btn-outline-secondary'"
                    @click="selectedFilter = 'unanswered'"
                  >
                    <i class="bi bi-dash-circle me-1"></i> Bỏ trống ({{ unansweredCount }})
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm py-1 px-3 rounded-pill"
                    :class="selectedFilter === 'correct' ? 'btn-success' : 'btn-outline-success'"
                    @click="selectedFilter = 'correct'"
                  >
                    <i class="bi bi-check-circle me-1"></i> Làm đúng ({{ correctCount }})
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm py-1 px-3 rounded-pill"
                    :class="selectedFilter === 'paralysis' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'"
                    @click="selectedFilter = 'paralysis'"
                  >
                    <i class="bi bi-exclamation-octagon me-1"></i> Câu điểm liệt ({{ paralysisQuestions.length }})
                  </button>
                </div>
              </div>
            </div>

            <!-- Filter Status Summary -->
            <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top text-secondary small">
              <div>
                Đang hiển thị: <strong class="text-dark">{{ filteredQuestions.length }}</strong> / {{ questions.length }} câu hỏi
              </div>
              <div v-if="selectedFilter !== 'all' || selectedChapter !== 'all' || searchKeyword">
                <button 
                  type="button" 
                  class="btn btn-link btn-sm text-decoration-none p-0 text-primary"
                  @click="selectedFilter = 'all'; selectedChapter = 'all'; searchKeyword = '';"
                >
                  <i class="bi bi-arrow-counterclockwise me-1"></i>Đặt lại bộ lọc
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State When No Questions Match Filter -->
          <div v-if="filteredQuestions.length === 0" class="card border border-light-subtle shadow-sm rounded-4 p-5 text-center bg-white">
            <i class="bi bi-filter-circle display-4 text-secondary mb-3"></i>
            <h5 class="fw-bold text-dark">Không Tìm Thấy Câu Hỏi Nào</h5>
            <p class="text-secondary small mb-3">
              Không có câu hỏi nào khớp với các điều kiện lọc và tìm kiếm hiện tại của bạn.
            </p>
            <div>
              <button 
                type="button" 
                class="btn btn-outline-primary btn-sm px-3"
                @click="selectedFilter = 'all'; selectedChapter = 'all'; searchKeyword = '';"
              >
                Xem lại toàn bộ đề thi
              </button>
            </div>
          </div>

          <!-- Questions List -->
          <div v-else class="d-flex flex-column gap-4">
            <div
              v-for="(question, qIndex) in filteredQuestions"
              :id="`review-question-${question.id}`"
              :key="question.id"
              class="card border border-light-subtle shadow-sm rounded-4 p-4 bg-white"
              :class="{
                'border-paralysis': question.isParalysis,
                'border-primary': activeQuestionId === question.id
              }"
            >
              <!-- Question Header -->
              <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-primary text-white px-2 py-1 fs-6 rounded-3">
                    Câu {{ question.indexInExam || (qIndex + 1) }}
                  </span>
                  <span v-if="question.chapterTitle" class="badge bg-light text-secondary border rounded-pill">
                    {{ question.chapterTitle }}
                  </span>
                  <span v-if="question.isParalysis" class="badge bg-danger rounded-pill px-2 py-1">
                    <i class="bi bi-exclamation-octagon-fill me-1"></i>CÂU ĐIỂM LIỆT
                  </span>
                </div>

                <!-- User Result Badge -->
                <div>
                  <span 
                    v-if="question.isCorrect === true" 
                    class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill"
                  >
                    <i class="bi bi-check-circle-fill me-1"></i>Làm Đúng (+1 điểm)
                  </span>
                  <span 
                    v-else-if="question.selectedAnswerId !== null" 
                    class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-1 rounded-pill"
                  >
                    <i class="bi bi-x-circle-fill me-1"></i>Làm Sai (0 điểm)
                  </span>
                  <span 
                    v-else 
                    class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-1 rounded-pill"
                  >
                    <i class="bi bi-dash-circle-fill me-1"></i>Chưa Trả Lời (0 điểm)
                  </span>
                </div>
              </div>

              <!-- Question Content -->
              <h5 class="fw-bold text-dark lh-base mb-3">
                {{ question.content }}
              </h5>

              <!-- Question Illustration Image (if applicable) -->
              <div v-if="question.imageUrl" class="text-center my-3 bg-light p-2 rounded-3 border">
                <img 
                  :src="resolveAssetUrl(question.imageUrl)" 
                  :alt="`Hình minh họa câu ${question.indexInExam}`"
                  class="question-img-container" 
                />
              </div>

              <!-- Comparative Answers List -->
              <div class="d-flex flex-column gap-2 mb-3">
                <div
                  v-for="ans in question.answers"
                  :key="ans.id"
                  class="review-option-item"
                  :class="{
                    'correct-ans': ans.isCorrect,
                    'user-wrong-ans': question.selectedAnswerId === ans.id && !ans.isCorrect
                  }"
                >
                  <div class="d-flex align-items-center gap-3">
                    <div class="study-option-badge">
                      {{ ans.orderNumber }}
                    </div>
                    <div class="fw-semibold">
                      {{ ans.answerText }}
                    </div>
                  </div>

                  <!-- Status Tags -->
                  <div>
                    <span 
                      v-if="ans.isCorrect && question.selectedAnswerId === ans.id" 
                      class="badge bg-success px-2 py-1 fs-xxs"
                    >
                      <i class="bi bi-check-circle-fill me-1"></i>Bạn chọn chính xác
                    </span>
                    <span 
                      v-else-if="ans.isCorrect" 
                      class="badge bg-success px-2 py-1 fs-xxs"
                    >
                      <i class="bi bi-check2 me-1"></i>Đáp án chuẩn của Bộ GTVT
                    </span>
                    <span 
                      v-else-if="question.selectedAnswerId === ans.id" 
                      class="badge bg-danger px-2 py-1 fs-xxs"
                    >
                      <i class="bi bi-x me-1"></i>Bạn đã chọn phương án này
                    </span>
                  </div>
                </div>
              </div>

              <!-- Official Explanation Box -->
              <div v-if="question.explanation" class="explanation-box">
                <div class="d-flex align-items-center gap-2 fw-bold text-warning-emphasis mb-1">
                  <i class="bi bi-lightbulb-fill text-warning fs-5"></i>
                  <span>Giải thích chi tiết & Mẹo ghi nhớ:</span>
                </div>
                <div class="text-dark small lh-base">
                  {{ question.explanation }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Sticky Question Palette Navigator -->
        <div class="col-12 col-lg-4 col-xl-3 d-print-none">
          <div class="sticky-top pt-2">
            <!-- Question Palette Card -->
            <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white mb-3">
              <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <h6 class="fw-bold text-dark mb-0">
                  <i class="bi bi-grid-3x3-gap-fill text-primary me-2"></i>Bảng Câu Hỏi
                </h6>
                <span class="text-secondary small">{{ questions.length }} câu</span>
              </div>

              <!-- Color Legend -->
              <div class="d-flex flex-wrap gap-2 text-secondary small mb-3 pb-2 border-bottom">
                <span class="d-flex align-items-center gap-1">
                  <i class="bi bi-circle-fill text-success"></i> Đúng ({{ correctCount }})
                </span>
                <span class="d-flex align-items-center gap-1">
                  <i class="bi bi-circle-fill text-danger"></i> Sai ({{ wrongCount }})
                </span>
                <span class="d-flex align-items-center gap-1">
                  <i class="bi bi-circle-fill text-secondary"></i> Bỏ trống ({{ unansweredCount }})
                </span>
              </div>

              <!-- Question Palette Grid -->
              <div class="question-palette-grid">
                <button
                  v-for="(q, idx) in questions"
                  :key="q.id"
                  type="button"
                  class="question-palette-btn position-relative"
                  :class="{
                    'palette-correct': q.isCorrect === true,
                    'palette-wrong': q.isCorrect === false && q.selectedAnswerId !== null,
                    'palette-skipped': q.selectedAnswerId === null,
                    'active': activeQuestionId === q.id
                  }"
                  @click="scrollToQuestion(q.id)"
                  :title="`Câu ${idx + 1}: ${q.isCorrect ? 'Đúng' : (q.selectedAnswerId ? 'Sai' : 'Bỏ trống')}`"
                >
                  {{ idx + 1 }}
                  <!-- Paralysis Dot Flag -->
                  <span 
                    v-if="q.isParalysis" 
                    class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger fs-xxs"
                    title="Câu điểm liệt"
                  >
                    !
                  </span>
                </button>
              </div>
            </div>

            <!-- Action Buttons Card -->
            <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white">
              <div class="d-flex flex-column gap-2">
                <router-link to="/exam" class="btn btn-primary w-100 py-2">
                  <i class="bi bi-arrow-repeat me-2"></i>Thi lại đề thi khác
                </router-link>
                <router-link to="/exam/history" class="btn btn-soft-primary w-100 py-2">
                  <i class="bi bi-clock-history me-2"></i>Lịch sử thi cá nhân
                </router-link>
                <router-link to="/" class="btn btn-outline-secondary w-100 py-2">
                  <i class="bi bi-house-door me-2"></i>Về trang chủ
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
