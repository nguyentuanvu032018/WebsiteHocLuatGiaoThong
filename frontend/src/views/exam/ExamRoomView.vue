<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient, { resolveAssetUrl } from '../../services/api';
import Swal from 'sweetalert2';

const route = useRoute();
const router = useRouter();

// Dùng computed để luôn đồng bộ tức thời khi route param thay đổi
const sessionId = computed(() => route.params.id);

// State bài thi
const session = ref(null);
const questions = ref([]);
const currentIndex = ref(0);
const userAnswers = ref({}); // { [questionId]: selectedAnswerId }

// Thời gian & Đồng hồ đếm ngược
const totalSeconds = ref(0);
const remainingSeconds = ref(0);
let timerInterval = null;
const isSubmitting = ref(false);

const isLoading = ref(true);
const errorMessage = ref('');
const hasHeaderPortal = ref(false);

// Câu hỏi hiện tại
const currentQuestion = computed(() => {
  if (questions.value.length === 0) return null;
  return questions.value[currentIndex.value] || null;
});

// Thống kê tiến độ trả lời
const answeredCount = computed(() => Object.keys(userAnswers.value).length);
const totalQuestionsCount = computed(() => questions.value.length);

// % tiến độ đã làm
const progressPercent = computed(() => {
  if (totalQuestionsCount.value === 0) return 0;
  return Math.round((answeredCount.value / totalQuestionsCount.value) * 100);
});

// Định dạng thời gian mm:ss
const formattedTime = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60);
  const s = remainingSeconds.value % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

// Phân lớp màu đồng hồ theo thời gian còn lại
const timerClass = computed(() => {
  if (remainingSeconds.value > 300) return 'timer-normal';
  if (remainingSeconds.value > 120) return 'timer-warning';
  return 'timer-danger';
});

// Tải thông tin phiên thi từ backend
const loadExamSession = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  const id = sessionId.value;
  if (!id) {
    errorMessage.value = 'Mã bài thi không hợp lệ';
    isLoading.value = false;
    return;
  }

  try {
    const res = await apiClient.get(`/exams/${id}`);
    if (res.success && res.data?.examSession) {
      session.value = res.data.examSession;

      // Nếu bài thi đã nộp → chuyển ngay sang trang kết quả
      if (session.value.submittedAt) {
        router.replace(`/exam/result/${id}`);
        return;
      }

      questions.value = res.data.examSession.questions || [];

      // Khôi phục các câu đã chọn (nếu có)
      userAnswers.value = {};
      for (const q of questions.value) {
        if (q.selectedAnswerId) {
          userAnswers.value[q.id] = q.selectedAnswerId;
        }
      }

      // Khởi tạo thời gian làm bài
      const durationMinutes = session.value.durationMinutes || 19;
      totalSeconds.value = durationMinutes * 60;
      remainingSeconds.value = totalSeconds.value;

      // Bắt đầu đếm ngược
      startTimer();
    } else {
      errorMessage.value = res.message || 'Không thể tải thông tin bài thi. Vui lòng thử lại.';
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải phòng thi sát hạch';
  } finally {
    isLoading.value = false;
  }
};

// Đếm ngược mỗi giây
const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
    } else {
      clearInterval(timerInterval);
      handleTimeOut();
    }
  }, 1000);
};

// Xử lý khi hết giờ làm bài
const handleTimeOut = async () => {
  await Swal.fire({
    icon: 'warning',
    title: 'Hết giờ làm bài!',
    text: 'Thời gian thi sát hạch đã kết thúc. Hệ thống sẽ tự động nộp bài thi của bạn ngay bây giờ.',
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Xem kết quả'
  });
  executeSubmission();
};

// Chọn phương án trả lời cho câu hỏi
const selectAnswer = (question, answer) => {
  userAnswers.value[question.id] = answer.id;
};

// Chuyển câu hỏi
const jumpToQuestion = (index) => {
  if (index >= 0 && index < questions.value.length) {
    currentIndex.value = index;
  }
};

const nextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++;
  }
};

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

// Kiểm tra câu đang xem có là câu điểm liệt chưa chọn không
const isParalysisUnanswered = (q) => {
  return q.isParalysis && userAnswers.value[q.id] === undefined;
};

// Bắt sự kiện bàn phím: 1-4 chọn đáp án, mũi tên trái/phải chuyển câu
const handleKeyDown = (e) => {
  if (isSubmitting.value || document.querySelector('.swal2-container')) return;
  const key = e.key;

  if (['1', '2', '3', '4'].includes(key)) {
    const orderNum = Number(key);
    if (currentQuestion.value?.answers) {
      const targetAns = currentQuestion.value.answers.find(a => a.orderNumber === orderNum);
      if (targetAns) selectAnswer(currentQuestion.value, targetAns);
    }
  }

  if (key === 'ArrowRight' || key === 'ArrowDown') {
    e.preventDefault();
    nextQuestion();
  } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
    e.preventDefault();
    prevQuestion();
  }
};

// Modal xác nhận nộp bài thi
const confirmSubmitExam = async () => {
  const answered = answeredCount.value;
  const total = totalQuestionsCount.value;
  const unanswered = total - answered;

  // Đếm câu điểm liệt chưa chọn
  const paralysisUnanswered = questions.value.filter(q => isParalysisUnanswered(q)).length;

  let messageHtml = `<div class="text-start">
    <p class="mb-2">Bạn đã hoàn thành: <strong class="text-primary">${answered} / ${total}</strong> câu hỏi.</p>`;

  if (paralysisUnanswered > 0) {
    messageHtml += `<div class="alert alert-danger py-2 px-3 small rounded-3 mb-2">
      <i class="bi bi-exclamation-triangle-fill me-1"></i>
      <strong>CẢNH BÁO:</strong> Còn <strong>${paralysisUnanswered} câu ĐIỂM LIỆT</strong> chưa trả lời — sẽ bị đánh trượt trực tiếp!
    </div>`;
  } else if (unanswered > 0) {
    messageHtml += `<div class="alert alert-warning py-2 px-3 small rounded-3 mb-2">
      <i class="bi bi-exclamation-triangle-fill me-1 text-warning"></i>
      Còn <strong>${unanswered} câu</strong> bạn chưa chọn đáp án!
    </div>`;
  } else {
    messageHtml += `<div class="alert alert-success py-2 px-3 small rounded-3 mb-2">
      <i class="bi bi-check-circle-fill me-1 text-success"></i>
      Bạn đã trả lời đầy đủ tất cả các câu hỏi!
    </div>`;
  }

  messageHtml += `<p class="small text-muted mb-0">Sau khi nộp bài, bạn sẽ không thể thay đổi đáp án và hệ thống sẽ chấm điểm ngay lập tức.</p>
  </div>`;

  const result = await Swal.fire({
    title: 'Xác nhận nộp bài thi?',
    html: messageHtml,
    icon: paralysisUnanswered > 0 ? 'error' : unanswered > 0 ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Nộp bài ngay',
    cancelButtonText: 'Tiếp tục làm bài'
  });

  if (result.isConfirmed) executeSubmission();
};

// Thực hiện gửi kết quả lên backend chấm điểm
const executeSubmission = async () => {
  if (timerInterval) clearInterval(timerInterval);
  isSubmitting.value = true;

  const id = sessionId.value;

  try {
    const answersPayload = Object.entries(userAnswers.value).map(([qId, ansId]) => ({
      questionId: Number(qId),
      selectedAnswerId: ansId
    }));

    const timeSpentSeconds = totalSeconds.value - remainingSeconds.value;

    const res = await apiClient.post(`/exams/${id}/submit`, {
      answers: answersPayload,
      timeSpentSeconds: Math.max(1, timeSpentSeconds)
    });

    if (res.success) {
      router.push(`/exam/result/${id}`);
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi nộp bài',
      text: err.message || 'Không thể gửi kết quả bài thi'
    });
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown);
  // Đợi DOM hoàn tất để kiểm tra target teleport
  await nextTick();
  hasHeaderPortal.value = !!document.getElementById('exam-header-portal');
  await loadExamSession();
});

// Watch khi route param thay đổi (ví dụ chuyển từ phòng thi này sang phòng thi khác)
watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      currentIndex.value = 0;
      await nextTick();
      hasHeaderPortal.value = !!document.getElementById('exam-header-portal');
      await loadExamSession();
    }
  }
);

onUnmounted(() => {
  hasHeaderPortal.value = false;
  if (timerInterval) clearInterval(timerInterval);
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="h-100 d-flex flex-column exam-page-container">
    <!-- Teleport Portal to ExamLayout Header Center (Chỉ teleport khi target tồn tại và đã tải xong dữ liệu) -->
    <Teleport to="#exam-header-portal" :disabled="!hasHeaderPortal" v-if="hasHeaderPortal && session && !isLoading">
      <div class="d-flex align-items-center gap-3">
        <!-- License Type Badge -->
        <div class="d-none d-lg-flex align-items-center gap-2 bg-white px-3 py-1 rounded-pill border shadow-sm">
          <span class="badge bg-primary text-white rounded-pill px-2.5 py-1 fw-bold fs-xxs">
            HẠNG {{ session.licenseCode }}
          </span>
          <span class="header-license-desc fs-xs fw-bold">
            {{ session.totalQuestions }} câu &bull; {{ session.durationMinutes }} phút
          </span>
        </div>

        <!-- Countdown Timer -->
        <div class="exam-timer-box shadow-sm" :class="timerClass">
          <i class="bi bi-clock-fill me-2 fs-6"></i>
          <span>{{ formattedTime }}</span>
        </div>
      </div>
    </Teleport>

    <!-- ===================== LOADING STATE ===================== -->
    <div v-if="isLoading" class="h-100 d-flex flex-column align-items-center justify-content-center bg-light">
      <div class="card border-0 shadow-sm rounded-4 p-5 text-center" style="max-width: 420px;">
        <div class="mb-4 position-relative mx-auto" style="width:80px;height:80px;">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" stroke-width="6"/>
            <circle cx="40" cy="40" r="34" fill="none" stroke="#2563eb" stroke-width="6"
              stroke-dasharray="213" stroke-dashoffset="53"
              stroke-linecap="round" transform="rotate(-90 40 40)">
              <animateTransform attributeName="transform" type="rotate" from="0 40 40" to="360 40 40" dur="1.2s" repeatCount="indefinite"/>
            </circle>
          </svg>
          <div class="position-absolute top-50 start-50 translate-middle">
            <i class="bi bi-clipboard2-check text-primary fs-4"></i>
          </div>
        </div>
        <h5 class="fw-bold text-dark mb-1">Đang chuẩn bị đề thi...</h5>
        <p class="text-muted small mb-3">Hệ thống đang tải câu hỏi và ma trận sát hạch theo chuẩn Bộ GTVT</p>
        <div class="d-flex align-items-center justify-content-center gap-2 mt-2">
          <button 
            type="button" 
            class="btn btn-sm btn-outline-primary px-3 py-1.5 rounded-3 fw-semibold"
            @click="loadExamSession"
          >
            <i class="bi bi-arrow-clockwise me-1"></i>Tải lại đề thi
          </button>
          <router-link to="/exam" class="btn btn-sm btn-outline-secondary px-3 py-1.5 rounded-3 fw-semibold">
            <i class="bi bi-arrow-left me-1"></i>Chọn đề khác
          </router-link>
        </div>
      </div>
    </div>

    <!-- ===================== ERROR STATE ===================== -->
    <div v-else-if="errorMessage" class="h-100 d-flex align-items-center justify-content-center p-4 bg-light">
      <div class="card border-0 shadow-sm rounded-4 p-5 text-center" style="max-width: 420px;">
        <div class="mb-3">
          <div class="rounded-circle bg-danger bg-opacity-10 mx-auto d-flex align-items-center justify-content-center" style="width:72px;height:72px;">
            <i class="bi bi-exclamation-triangle-fill text-danger fs-2"></i>
          </div>
        </div>
        <h4 class="fw-bold text-dark mb-2">Không thể truy cập bài thi</h4>
        <p class="text-secondary small mb-4">{{ errorMessage }}</p>
        <router-link to="/exam" class="btn btn-primary px-4 py-2 rounded-3">
          <i class="bi bi-arrow-left me-2"></i>Chọn đề thi khác
        </router-link>
      </div>
    </div>

    <!-- ===================== MAIN EXAM ARENA ===================== -->
    <div v-else class="exam-arena h-100 d-flex flex-column overflow-hidden">
      <!-- Mobile: Progress bar on top -->
      <div class="d-lg-none bg-white border-bottom px-3 py-2">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="small fw-semibold text-secondary">Tiến độ làm bài</span>
          <span class="small fw-bold text-primary">{{ answeredCount }}/{{ totalQuestionsCount }} câu</span>
        </div>
        <div class="progress" style="height:6px;border-radius:3px;">
          <div class="progress-bar bg-primary" :style="`width:${progressPercent}%`" style="transition:width .3s;"></div>
        </div>
      </div>

      <div class="flex-grow-1 overflow-hidden d-flex">
        <!-- ============ LEFT: Question Panel ============ -->
        <div class="exam-question-panel flex-grow-1 d-flex flex-column overflow-hidden p-3 p-md-4">

          <!-- Question Card -->
          <div v-if="currentQuestion" class="exam-question-card flex-grow-1 d-flex flex-column rounded-4 bg-white shadow-sm overflow-hidden">

            <!-- Card Top Bar -->
            <div class="exam-card-topbar d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-primary px-3 py-2 rounded-pill fw-bold fs-6 shadow-xs">
                  Câu {{ currentIndex + 1 }} / {{ totalQuestionsCount }}
                </span>
                <span class="badge chapter-badge border px-2.5 py-1.5 rounded-pill fs-xxs d-none d-sm-inline">
                  {{ currentQuestion.chapterTitle ? currentQuestion.chapterTitle.split(':')[0].trim() : ('Chương ' + currentQuestion.chapterId) }}
                </span>
              </div>

              <div class="d-flex align-items-center gap-2">
                <!-- Paralysis warning -->
                <span v-if="currentQuestion.isParalysis" class="badge bg-danger px-2.5 py-1.5 rounded-pill fs-xxs animate-pulse fw-bold">
                  <i class="bi bi-lightning-fill me-1"></i>CÂU ĐIỂM LIỆT
                </span>
                <!-- Answered indicator -->
                <span v-if="userAnswers[currentQuestion.id]" class="badge bg-success bg-opacity-15 text-success px-2.5 py-1.5 rounded-pill fs-xxs fw-bold">
                  <i class="bi bi-check2-circle me-1"></i>Đã chọn đáp án
                </span>
              </div>
            </div>

            <!-- Scrollable Content -->
            <div class="flex-grow-1 overflow-auto exam-scroll-area px-4 py-4">
              <!-- Question Text -->
              <h5 class="exam-question-title fw-bold lh-base mb-4">
                {{ currentQuestion.content }}
              </h5>

              <!-- Question Image -->
              <div v-if="currentQuestion.imageUrl" class="text-center mb-4">
                <div class="bg-light rounded-4 p-3 border d-inline-block shadow-2xs">
                  <img
                    :src="resolveAssetUrl(currentQuestion.imageUrl)"
                    :alt="'Hình minh họa câu hỏi ' + currentQuestion.id"
                    class="question-img-container rounded-3"
                  />
                </div>
              </div>

              <!-- Answer Options -->
              <div class="d-flex flex-column gap-3">
                <button
                  v-for="ans in currentQuestion.answers"
                  :key="ans.id"
                  type="button"
                  class="exam-option-btn text-start"
                  :class="{
                    'selected': userAnswers[currentQuestion.id] === ans.id,
                    'unselected': userAnswers[currentQuestion.id] && userAnswers[currentQuestion.id] !== ans.id
                  }"
                  @click="selectAnswer(currentQuestion, ans)"
                >
                  <div class="d-flex align-items-center gap-3 w-100">
                    <!-- Shortcut Key -->
                    <div class="exam-key-badge flex-shrink-0" :class="{ 'active': userAnswers[currentQuestion.id] === ans.id }">
                      {{ ans.orderNumber }}
                    </div>
                    <!-- Text -->
                    <span class="exam-answer-text flex-grow-1">{{ ans.answerText }}</span>
                    <!-- Check icon -->
                    <i
                      class="bi flex-shrink-0 fs-5"
                      :class="userAnswers[currentQuestion.id] === ans.id
                        ? 'bi-check-circle-fill text-primary'
                        : 'bi-circle text-muted opacity-50'"
                    ></i>
                  </div>
                </button>
              </div>
            </div>

            <!-- Card Bottom Navigation -->
            <div class="exam-card-bottombar d-flex align-items-center justify-content-between px-4 py-3 border-top bg-light bg-opacity-60">
              <!-- Keyboard hint -->
              <div class="keyboard-hint fs-xs d-none d-md-flex align-items-center gap-2">
                <i class="bi bi-keyboard text-primary fs-5"></i>
                <span>Phím <kbd>1-4</kbd> chọn đáp án &nbsp;&bull;&nbsp; <kbd>&larr;</kbd><kbd>&rarr;</kbd> chuyển câu</span>
              </div>

              <!-- Navigation Buttons -->
              <div class="d-flex align-items-center gap-2 ms-auto">
                <button
                  type="button"
                  class="btn btn-outline-secondary px-3 py-2 rounded-3 fw-semibold nav-btn"
                  :disabled="currentIndex === 0"
                  @click="prevQuestion"
                >
                  <i class="bi bi-chevron-left me-1"></i>Câu trước
                </button>

                <button
                  v-if="currentIndex < totalQuestionsCount - 1"
                  type="button"
                  class="btn btn-primary px-4 py-2 rounded-3 fw-semibold shadow-sm nav-btn"
                  @click="nextQuestion"
                >
                  Câu tiếp <i class="bi bi-chevron-right ms-1"></i>
                </button>
                <button
                  v-else
                  type="button"
                  class="btn btn-success px-4 py-2 rounded-3 fw-bold shadow-sm nav-btn"
                  @click="confirmSubmitExam"
                >
                  <i class="bi bi-send-check-fill me-1"></i>Nộp bài
                </button>
              </div>
            </div>
          </div>

          <!-- No question fallback -->
          <div v-else class="flex-grow-1 d-flex align-items-center justify-content-center text-secondary">
            <p class="fw-semibold">Không có câu hỏi trong đề thi này.</p>
          </div>
        </div>

        <!-- ============ RIGHT: Sidebar Palette ============ -->
        <div class="exam-sidebar d-flex flex-column bg-white border-start overflow-hidden shadow-2xs">
          <!-- Sidebar Header -->
          <div class="px-3 pt-3 pb-3 border-bottom">
            <!-- Progress Ring + Stats -->
            <div class="d-flex align-items-center gap-3 mb-3">
              <!-- Circular progress -->
              <div class="position-relative flex-shrink-0" style="width:58px;height:58px;">
                <svg width="58" height="58" viewBox="0 0 58 58">
                  <circle cx="29" cy="29" r="24" fill="none" stroke="#e2e8f0" stroke-width="5"/>
                  <circle cx="29" cy="29" r="24" fill="none" :stroke="progressPercent === 100 ? '#10b981' : '#2563eb'" stroke-width="5"
                    :stroke-dasharray="150.8"
                    :stroke-dashoffset="150.8 * (1 - progressPercent / 100)"
                    stroke-linecap="round" transform="rotate(-90 29 29)"
                    style="transition:stroke-dashoffset .4s ease;"
                  />
                </svg>
                <div class="position-absolute top-50 start-50 translate-middle text-center">
                  <div class="fw-bolder lh-1" style="font-size:12px;" :class="progressPercent === 100 ? 'text-success' : 'text-primary'">
                    {{ progressPercent }}%
                  </div>
                </div>
              </div>

              <div>
                <div class="fw-bolder stats-total-text">
                  {{ answeredCount }} / {{ totalQuestionsCount }}
                </div>
                <div class="stats-sub-text">câu đã hoàn thành</div>
                <div class="stats-sub-text mt-0.5">
                  còn lại <span class="text-danger fw-bold">{{ totalQuestionsCount - answeredCount }}</span> câu
                </div>
              </div>
            </div>

            <!-- Legend Grid (2 cột rõ ràng, không bị tràn) -->
            <div class="palette-legend-grid pt-1 border-top">
              <div class="legend-item">
                <span class="palette-dot palette-dot--current"></span>
                <span>Đang xem</span>
              </div>
              <div class="legend-item">
                <span class="palette-dot palette-dot--answered"></span>
                <span>Đã làm</span>
              </div>
              <div class="legend-item">
                <span class="palette-dot palette-dot--paralysis"></span>
                <span>Điểm liệt</span>
              </div>
              <div class="legend-item">
                <span class="palette-dot palette-dot--empty"></span>
                <span>Chưa làm</span>
              </div>
            </div>
          </div>

          <!-- Question Grid (Scrollable, 5 cột đều đặn 100% không tràn) -->
          <div class="flex-grow-1 overflow-y-auto overflow-x-hidden p-3 exam-scroll-area">
            <div class="exam-palette-grid">
              <button
                v-for="(q, idx) in questions"
                :key="q.id"
                type="button"
                class="exam-palette-btn"
                :class="{
                  'current': idx === currentIndex,
                  'answered': userAnswers[q.id] !== undefined,
                  'paralysis': q.isParalysis,
                  'paralysis-warn': q.isParalysis && userAnswers[q.id] === undefined
                }"
                :title="`Câu ${idx + 1}${q.isParalysis ? ' (Điểm liệt)' : ''}`"
                @click="jumpToQuestion(idx)"
              >
                {{ idx + 1 }}
                <span v-if="q.isParalysis" class="palette-paralysis-dot" title="Câu điểm liệt"></span>
              </button>
            </div>
          </div>

          <!-- Submit Section (Cố định ở đáy) -->
          <div class="p-3 border-top mt-auto bg-light bg-opacity-40">
            <button
              type="button"
              class="btn btn-danger w-100 py-2.5 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 submit-exam-btn"
              :disabled="isSubmitting"
              @click="confirmSubmitExam"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status"></span>
              <i v-else class="bi bi-send-check-fill fs-6"></i>
              <span>{{ isSubmitting ? 'ĐANG NỘP BÀI...' : 'NỘP BÀI THI' }}</span>
            </button>
            <div class="text-center submit-hint-text mt-2">
              <i class="bi bi-shield-check me-1 text-success"></i>
              Kiểm tra kỹ câu điểm liệt trước khi nộp
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==============================================================================
   TÙY BIẾN GIAO DIỆN PHÒNG THI (EXAM ROOM VIEW SCOPED & GLOBAL HEADER)
   ============================================================================== */

/* Đồng bộ Header của ExamLayout sang nền sáng sắc nét, tương phản cao */
:global(.exam-header-bar) {
  background: #ffffff !important;
  border-bottom: 1px solid #e2e8f0 !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05) !important;
}

:global(.exam-header-bar .lh-1) {
  color: #0f172a !important;
  font-weight: 800 !important;
  letter-spacing: -0.01em;
}

:global(.exam-header-bar .bg-dark-subtle) {
  background-color: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
}

:global(.exam-header-bar .text-light) {
  color: #1e293b !important;
  font-weight: 700 !important;
}

:global(.exam-header-bar .btn-outline-light) {
  color: #475569 !important;
  border-color: #cbd5e1 !important;
}

:global(.exam-header-bar .btn-outline-light:hover) {
  background-color: #f1f5f9 !important;
  color: #0f172a !important;
}

/* Header license badge description */
.header-license-desc {
  color: #334155;
}

/* ===== Exam Arena Layout ===== */
.exam-arena {
  background: #f1f5f9;
}

/* ===== Question Panel ===== */
.exam-question-panel {
  min-width: 0;
}

.exam-question-card {
  border: 1px solid #e2e8f0;
}

.exam-card-topbar {
  background: #f8fafc;
  min-height: 56px;
}

.chapter-badge {
  background-color: #ffffff;
  color: #475569;
  border-color: #cbd5e1 !important;
  font-weight: 600;
}

.exam-question-title {
  color: #0f172a;
  font-size: 1.18rem;
  font-weight: 700;
  line-height: 1.6;
}

.exam-card-bottombar {
  min-height: 60px;
}

/* ===== Answer Buttons ===== */
.exam-option-btn {
  display: flex;
  align-items: center;
  width: 100%;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 18px;
  cursor: pointer;
  transition: all 0.18s ease;
  color: #0f172a;
}

.exam-option-btn:hover {
  border-color: #93c5fd;
  background: #f0f7ff;
  transform: translateX(3px);
}

.exam-option-btn.selected {
  border-color: #2563eb !important;
  background: #eff6ff !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  transform: translateX(4px);
}

.exam-option-btn.unselected {
  opacity: 0.7;
}

.exam-answer-text {
  color: #0f172a;
  font-weight: 600;
  font-size: 0.98rem;
  line-height: 1.5;
}

.exam-option-btn.selected .exam-answer-text {
  color: #1d4ed8;
  font-weight: 700;
}

/* ===== Key Badge (1, 2, 3...) ===== */
.exam-key-badge {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f1f5f9;
  border: 1.5px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.88rem;
  color: #334155;
  transition: all 0.18s;
  flex-shrink: 0;
}

.exam-key-badge.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

/* ===== Bottom Hints & Buttons ===== */
.keyboard-hint {
  color: #475569;
  font-weight: 500;
}

kbd {
  background: #e2e8f0;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 700;
}

.nav-btn {
  font-size: 0.9rem;
}

/* ===== Sidebar (Cố định chiều rộng chuẩn, không bị tràn) ===== */
.exam-sidebar {
  width: 285px;
  min-width: 285px;
  max-width: 285px;
  flex-shrink: 0;
  box-sizing: border-box;
}

@media (max-width: 991.98px) {
  .exam-sidebar {
    display: none !important;
  }
}

.stats-total-text {
  font-size: 15px;
  color: #0f172a;
}

.stats-sub-text {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

/* ===== Palette Legend ===== */
.palette-legend-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.palette-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.palette-dot--current  { background: #2563eb; }
.palette-dot--answered { background: #93c5fd; border: 1px solid #60a5fa; }
.palette-dot--paralysis { background: #fca5a5; border: 1px solid #f87171; }
.palette-dot--empty    { background: #f1f5f9; border: 1px solid #cbd5e1; }

/* ===== Palette Grid (5 Cột đều tăm tắp, 100% không tràn) ===== */
.exam-palette-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
  gap: 6px !important;
  width: 100% !important;
  box-sizing: border-box;
}

.exam-palette-btn {
  position: relative;
  width: 100% !important;
  height: 38px !important;
  min-width: 0 !important;
  padding: 0 !important;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.exam-palette-btn:hover {
  border-color: #2563eb;
  background: #eff6ff;
  color: #2563eb;
  transform: translateY(-1px);
}

.exam-palette-btn.current {
  border-color: #2563eb !important;
  background: #2563eb !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
}

.exam-palette-btn.answered {
  background: #dbeafe !important;
  border-color: #60a5fa !important;
  color: #1d4ed8 !important;
}

.exam-palette-btn.current.answered {
  background: #2563eb !important;
  border-color: #2563eb !important;
  color: #ffffff !important;
}

.exam-palette-btn.paralysis-warn {
  border-color: #fca5a5;
  background: #fff1f2;
  color: #dc2626;
}

/* Chấm đỏ trên góc câu điểm liệt */
.palette-paralysis-dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
}

/* Nút nộp bài */
.submit-exam-btn {
  font-size: 0.92rem;
  letter-spacing: 0.03em;
}

.submit-hint-text {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

/* ===== Timer Box (Rõ nét, tương phản cao) ===== */
.exam-timer-box {
  display: flex;
  align-items: center;
  padding: 6px 18px;
  border-radius: 999px;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.timer-normal {
  background: #ecfdf5;
  color: #065f46;
  border: 1.5px solid #a7f3d0;
}

.timer-warning {
  background: #fffbeb;
  color: #92400e;
  border: 1.5px solid #fde68a;
  animation: pulse-warning 2s infinite;
}

.timer-danger {
  background: #fef2f2;
  color: #991b1b;
  border: 1.5px solid #fecaca;
  animation: pulse-danger 1s infinite;
}

/* ===== Scrollbar tùy biến mượt mà ===== */
.exam-scroll-area {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}
.exam-scroll-area::-webkit-scrollbar { width: 5px; }
.exam-scroll-area::-webkit-scrollbar-track { background: transparent; }
.exam-scroll-area::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }

/* ===== Question Image ===== */
.question-img-container {
  max-width: 100%;
  max-height: 250px;
  object-fit: contain;
}

/* ===== Animations ===== */
@keyframes pulse-warning {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
  50% { box-shadow: 0 0 0 5px rgba(245,158,11,0.2); }
}

@keyframes pulse-danger {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
  50% { box-shadow: 0 0 0 6px rgba(239,68,68,0.25); }
}

.animate-pulse {
  animation: pulse-danger 1.5s infinite;
}

@media (max-width: 991.98px) {
  .exam-question-panel {
    padding-bottom: 75px !important;
  }
}
</style>
