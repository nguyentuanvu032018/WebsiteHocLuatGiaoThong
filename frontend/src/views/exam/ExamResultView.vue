<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient, { resolveAssetUrl } from '../../services/api';

const route = useRoute();
const router = useRouter();

const sessionId = route.params.id;

// State bài thi
const session = ref(null);
const questions = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');

// Bộ lọc khi xem lại bài thi
const reviewFilter = ref('all'); // 'all', 'wrong', 'paralysis'
const showReviewSection = ref(true);

// Lấy thông tin kết quả bài thi từ API
const loadExamResult = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const res = await apiClient.get(`/exams/${sessionId}`);
    if (res.success && res.data?.examSession) {
      session.value = res.data.examSession;
      questions.value = res.data.examSession.questions || [];
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải kết quả bài thi sát hạch';
  } finally {
    isLoading.value = false;
  }
};

// Định dạng thời gian làm bài (giây -> phút:giây)
const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0 giây';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} giây`;
  return `${m} phút ${s > 0 ? `${s} giây` : ''}`;
};

// Thống kê chi tiết
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

const paralysisFailedCount = computed(() => {
  return questions.value.filter(q => q.isParalysis && q.isCorrect === false).length;
});

// Tỷ lệ phần trăm điểm số
const scorePercentage = computed(() => {
  if (!session.value || !session.value.totalQuestions) return 0;
  return Math.round((session.value.score / session.value.totalQuestions) * 100);
});

// Danh sách câu hỏi sau khi lọc ở phần Xem lại
const filteredReviewQuestions = computed(() => {
  if (reviewFilter.value === 'wrong') {
    return questions.value.filter(q => q.isCorrect === false);
  }
  if (reviewFilter.value === 'paralysis') {
    return questions.value.filter(q => q.isParalysis);
  }
  return questions.value;
});

// Cuộn đến câu hỏi cụ thể trong phần xem lại
const scrollToQuestion = (questionId) => {
  const el = document.getElementById(`review-q-${questionId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

onMounted(() => {
  loadExamResult();
});
</script>

<template>
  <div class="container py-4 py-lg-5">
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="mb-4">
      <ol class="breadcrumb small">
        <li class="breadcrumb-item"><router-link to="/">Trang chủ</router-link></li>
        <li class="breadcrumb-item"><router-link to="/exam">Thi thử</router-link></li>
        <li class="breadcrumb-item active" aria-current="page">Kết quả bài thi</li>
      </ol>
    </nav>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <h5 class="fw-bold text-dark">Đang tải kết quả bài thi sát hạch...</h5>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="row justify-content-center">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="alert alert-danger rounded-4 p-5 text-center shadow-sm" role="alert">
          <i class="bi bi-exclamation-triangle-fill fs-1 text-danger mb-3"></i>
          <h4 class="fw-bold">Có lỗi xảy ra</h4>
          <p class="mb-4">{{ errorMessage }}</p>
          <router-link to="/exam" class="btn btn-primary px-4 py-2">
            Quay lại phòng chọn đề thi
          </router-link>
        </div>
      </div>
    </div>

    <!-- Main Results Section -->
    <div v-else-if="session" class="d-flex flex-column gap-4">
      <!-- 1. HERO RESULT OUTCOME CARD -->
      <div 
        class="result-hero-card p-4 p-md-5 text-center"
        :class="session.isPassed ? 'result-card-passed' : 'result-card-failed'"
      >
        <!-- Icon Badge -->
        <div 
          class="result-badge-icon"
          :class="session.isPassed ? 'badge-passed' : 'badge-failed'"
        >
          <i v-if="session.isPassed" class="bi bi-trophy-fill fs-1"></i>
          <i v-else-if="session.hasParalysisFailed" class="bi bi-shield-slash-fill fs-1"></i>
          <i v-else class="bi bi-x-circle-fill fs-1"></i>
        </div>

        <!-- Result Title -->
        <div class="mb-2">
          <span 
            class="badge rounded-pill px-3 py-1 fw-bold fs-xs mb-2"
            :class="session.isPassed ? 'bg-success text-white' : 'bg-danger text-white'"
          >
            HẠNG {{ session.licenseCode }} &bull; ĐỀ THI SÁT HẠCH SỐ #{{ session.id }}
          </span>

          <h2 class="display-6 fw-extrabold mb-2" :class="session.isPassed ? 'text-success' : 'text-danger'">
            <template v-if="session.isPassed">
              CHÚC MỪNG BẠN ĐÃ ĐẠT!
            </template>
            <template v-else-if="session.hasParalysisFailed">
              KẾT QUẢ: KHÔNG ĐẠT (TRƯỢT ĐIỂM LIỆT)
            </template>
            <template v-else>
              KẾT QUẢ: CHƯA ĐẠT YÊU CẦU
            </template>
          </h2>

          <div class="row justify-content-center">
            <div class="col-12 col-md-10 col-lg-8">
              <p class="lead text-secondary fs-6 mb-0">
                <template v-if="session.isPassed">
                  Bạn đã xuất sắc vượt qua bài thi sát hạch lý thuyết lái xe với số điểm <strong>{{ session.score }} / {{ session.totalQuestions }} câu</strong>.
                </template>
                <template v-else-if="session.hasParalysisFailed">
                  Bạn đạt được <strong>{{ session.score }} / {{ session.totalQuestions }} câu</strong>, tuy nhiên đã làm <strong>sai câu hỏi điểm liệt</strong> trong bài thi.
                </template>
                <template v-else>
                  Bạn đạt được <strong>{{ session.score }} / {{ session.totalQuestions }} câu</strong>, chưa đạt mức điểm tối thiểu <strong>{{ session.passingScore }} câu</strong> theo quy định.
                </template>
              </p>
            </div>
          </div>
        </div>

        <!-- Paralysis Disqualification Specific Warning Box -->
        <div v-if="session.hasParalysisFailed" class="row justify-content-center mt-4">
          <div class="col-12 col-md-10 col-lg-8">
            <div class="alert alert-danger border-danger-subtle rounded-4 p-3 text-start shadow-sm mb-0">
              <div class="d-flex align-items-start gap-2">
                <i class="bi bi-exclamation-octagon-fill text-danger fs-4 flex-shrink-0"></i>
                <div>
                  <strong class="text-danger d-block mb-1">CẢNH BÁO QUY CHẾ SÁT HẠCH:</strong>
                  <small class="text-secondary lh-base d-block">
                    Theo quy chuẩn sát hạch cấp Giấy phép lái xe của Bộ GTVT, thí sinh làm <strong>sai bất kỳ 1 câu điểm liệt nào</strong> sẽ bị <strong>TRƯỢT NGAY LẬP TỨC</strong> mà không xét đến tổng điểm đạt được.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. FOUR PERFORMANCE METRICS CARDS -->
      <div class="row g-3">
        <!-- Score Card -->
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="stat-metric-card text-center h-100 d-flex flex-column justify-content-center">
            <div class="text-secondary fs-xs fw-semibold mb-1">KẾT QUẢ ĐIỂM SỐ</div>
            <div class="fs-3 fw-extrabold text-dark mb-1">
              {{ session.score }} <span class="fs-6 text-muted">/ {{ session.totalQuestions }}</span>
            </div>
            <div class="fs-xs fw-bold" :class="session.score >= session.passingScore ? 'text-success' : 'text-danger'">
              Tỉ lệ chính xác: {{ scorePercentage }}%
            </div>
          </div>
        </div>

        <!-- Passing Score Requirement -->
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="stat-metric-card text-center h-100 d-flex flex-column justify-content-center">
            <div class="text-secondary fs-xs fw-semibold mb-1">ĐIỂM CHUẨN ĐẠT</div>
            <div class="fs-3 fw-extrabold text-primary mb-1">
              {{ session.passingScore }} <span class="fs-6 text-muted">/ {{ session.totalQuestions }}</span>
            </div>
            <div class="fs-xs text-muted">
              Yêu cầu tối thiểu để đỗ
            </div>
          </div>
        </div>

        <!-- Time Spent -->
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="stat-metric-card text-center h-100 d-flex flex-column justify-content-center">
            <div class="text-secondary fs-xs fw-semibold mb-1">THỜI GIAN LÀM BÀI</div>
            <div class="fs-4 fw-extrabold text-dark mb-1">
              {{ formatDuration(session.timeSpentSeconds) }}
            </div>
            <div class="fs-xs text-muted">
              Quy định: {{ session.durationMinutes }} phút
            </div>
          </div>
        </div>

        <!-- Paralysis Result -->
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="stat-metric-card text-center h-100 d-flex flex-column justify-content-center">
            <div class="text-secondary fs-xs fw-semibold mb-1">CÂU HỎI ĐIỂM LIỆT</div>
            <div class="fs-4 fw-extrabold mb-1" :class="session.hasParalysisFailed ? 'text-danger' : 'text-success'">
              <i class="bi me-1" :class="session.hasParalysisFailed ? 'bi-shield-x' : 'bi-shield-check'"></i>
              {{ session.hasParalysisFailed ? 'Bị lỗi' : 'An toàn' }}
            </div>
            <div class="fs-xs" :class="session.hasParalysisFailed ? 'text-danger fw-bold' : 'text-success'">
              {{ session.hasParalysisFailed ? `Sai ${paralysisFailedCount} câu điểm liệt` : 'Đúng 100% câu điểm liệt' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 3. ACTION BUTTONS TOOLBAR -->
      <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div class="d-flex flex-wrap align-items-center gap-2">
            <router-link :to="`/exam/review/${sessionId}`" class="btn btn-outline-primary px-3 py-2 fw-semibold">
              <i class="bi bi-card-checklist me-1"></i> Xem lại chi tiết bài làm
            </router-link>
            <router-link to="/exam" class="btn btn-primary px-4 py-2 fw-semibold shadow-sm">
              <i class="bi bi-arrow-repeat me-1"></i> Thi lại đề khác
            </router-link>
            <router-link to="/exam/history" class="btn btn-soft-primary px-3 py-2 fw-semibold">
              <i class="bi bi-clock-history me-1"></i> Lịch sử thi của tôi
            </router-link>
            <router-link to="/study/paralysis" class="btn btn-soft-danger px-3 py-2 fw-semibold">
              <i class="bi bi-exclamation-octagon-fill me-1"></i> Ôn lại 60 câu điểm liệt
            </router-link>
          </div>

          <div>
            <router-link to="/" class="btn btn-outline-secondary px-3 py-2">
              <i class="bi bi-house-door me-1"></i> Về trang chủ
            </router-link>
          </div>
        </div>
      </div>

      <!-- 4. DETAILED QUESTION REVIEW SECTION -->
      <div class="card border border-light-subtle shadow-sm rounded-4 p-4 bg-white">
        <!-- Review Header & Filter Chips -->
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-3 border-bottom">
          <div>
            <h4 class="fw-bolder text-dark mb-1">
              <i class="bi bi-card-checklist text-primary me-2"></i>Xem Lại Chi Tiết Bài Làm
            </h4>
            <p class="text-secondary small mb-0">
              Đối chiếu đáp án đã chọn của bạn với đáp án chính thức và giải thích từ Bộ GTVT.
            </p>
          </div>

          <!-- Filter buttons -->
          <div class="btn-group" role="group">
            <button
              type="button"
              class="btn btn-sm py-2 px-3"
              :class="reviewFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'"
              @click="reviewFilter = 'all'"
            >
              Tất cả ({{ questions.length }})
            </button>
            <button
              type="button"
              class="btn btn-sm py-2 px-3"
              :class="reviewFilter === 'wrong' ? 'btn-danger' : 'btn-outline-danger'"
              @click="reviewFilter = 'wrong'"
            >
              <i class="bi bi-x-circle me-1"></i> Câu sai ({{ wrongCount + unansweredCount }})
            </button>
            <button
              type="button"
              class="btn btn-sm py-2 px-3"
              :class="reviewFilter === 'paralysis' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'"
              @click="reviewFilter = 'paralysis'"
            >
              <i class="bi bi-exclamation-octagon me-1"></i> Câu điểm liệt ({{ paralysisQuestions.length }})
            </button>
          </div>
        </div>

        <!-- Question Palette Quick Jumper Bar -->
        <div class="bg-light p-3 rounded-4 border mb-4">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="small fw-bold text-dark">
              <i class="bi bi-grid-3x3-gap-fill text-secondary me-1"></i> Bảng đối chiếu nhanh:
            </span>
            <div class="d-flex align-items-center gap-3 text-secondary small">
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
          </div>

          <!-- Grid buttons -->
          <div class="question-palette-grid">
            <button
              v-for="(q, idx) in questions"
              :key="q.id"
              type="button"
              class="question-palette-btn"
              :class="{
                'palette-correct': q.isCorrect === true,
                'palette-wrong': q.isCorrect === false && q.selectedAnswerId !== null,
                'palette-skipped': q.selectedAnswerId === null
              }"
              @click="scrollToQuestion(q.id)"
            >
              {{ idx + 1 }}
              <span v-if="q.isParalysis" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger fs-xxs">!</span>
            </button>
          </div>
        </div>

        <!-- Questions List with detailed answers and explanation -->
        <div class="d-flex flex-column gap-4">
          <div
            v-for="(question, index) in filteredReviewQuestions"
            :id="'review-q-' + question.id"
            :key="question.id"
            class="study-question-card p-4"
            :class="{
              'border-danger': question.isCorrect === false,
              'border-success': question.isCorrect === true,
              'border-paralysis': question.isParalysis
            }"
          >
            <!-- Card Header -->
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div class="d-flex align-items-center gap-2">
                <span 
                  class="badge px-3 py-2 rounded-pill fw-bold"
                  :class="question.isCorrect ? 'bg-success text-white' : 'bg-danger text-white'"
                >
                  <i class="bi me-1" :class="question.isCorrect ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  Câu {{ index + 1 }} - {{ question.isCorrect ? 'ĐÚNG' : (question.selectedAnswerId ? 'SAI' : 'CHƯA TRẢ LỜI') }}
                </span>
                <span class="badge bg-light text-secondary border px-3 py-2 rounded-pill">
                  {{ question.chapterTitle ? question.chapterTitle.split(':')[0] : 'Chương ' + question.chapterId }}
                </span>
              </div>

              <!-- Paralysis Warning Badge -->
              <span 
                v-if="question.isParalysis" 
                class="badge bg-danger-gradient px-3 py-2 rounded-pill shadow-sm"
              >
                <i class="bi bi-exclamation-triangle-fill me-1"></i> CÂU ĐIỂM LIỆT
              </span>
            </div>

            <!-- Question Content -->
            <h5 class="fw-bold text-dark lh-base mb-3">
              {{ question.content }}
            </h5>

            <!-- Question Image -->
            <div v-if="question.imageUrl" class="text-center my-3 bg-light p-2 rounded-3 border">
              <img 
                :src="resolveAssetUrl(question.imageUrl)" 
                :alt="'Hình minh họa câu hỏi ' + question.id" 
                class="question-img-container" 
              />
            </div>

            <!-- Answers List with Comparative Status -->
            <div class="d-flex flex-column mb-3">
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

                <!-- Answer Tag Badges -->
                <div>
                  <span v-if="ans.isCorrect" class="badge bg-success px-2 py-1 fs-xxs">
                    <i class="bi bi-check2 me-1"></i> Đáp án đúng
                  </span>
                  <span v-else-if="question.selectedAnswerId === ans.id" class="badge bg-danger px-2 py-1 fs-xxs">
                    <i class="bi bi-x me-1"></i> Bạn đã chọn đáp án này
                  </span>
                </div>
              </div>
            </div>

            <!-- Explanation Box -->
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
    </div>
  </div>
</template>
