<script setup>
import { ref, computed, onMounted } from 'vue';
import apiClient, { resolveAssetUrl } from '../../services/api';
import Swal from 'sweetalert2';

// State
const paralysisQuestions = ref([]);
const currentIndex = ref(0);
const viewMode = ref('stepper'); // 'stepper' (từng câu tập trung) hoặc 'list' (danh sách cuộn)
const searchKeyword = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

// Trạng thái trả lời của học viên trong phiên: { [questionId]: selectedAnswerId }
const userAnswers = ref({});

// Lấy danh sách câu hỏi điểm liệt từ API
const loadParalysisQuestions = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const res = await apiClient.get('/questions/paralysis', {
      params: {
        limit: 100, // Lấy toàn bộ bộ câu điểm liệt (tối đa 60 câu)
        showAnswer: true
      }
    });

    if (res.success && res.data?.questions) {
      paralysisQuestions.value = res.data.questions;
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải danh sách câu hỏi điểm liệt';
  } finally {
    isLoading.value = false;
  }
};

// Lọc câu hỏi theo từ khóa tìm kiếm (khi ở chế độ danh sách hoặc stepper)
const filteredQuestions = computed(() => {
  if (!searchKeyword.value.trim()) return paralysisQuestions.value;
  const kw = searchKeyword.value.toLowerCase().trim();
  return paralysisQuestions.value.filter(q => 
    q.content.toLowerCase().includes(kw) ||
    (q.explanation && q.explanation.toLowerCase().includes(kw))
  );
});

// Câu hỏi hiện tại khi ở chế độ Stepper
const currentQuestion = computed(() => {
  if (filteredQuestions.value.length === 0) return null;
  const safeIndex = Math.min(currentIndex.value, filteredQuestions.value.length - 1);
  return filteredQuestions.value[safeIndex];
});

// Thống kê tiến độ học câu điểm liệt
const stats = computed(() => {
  let correct = 0;
  let wrong = 0;

  for (const q of paralysisQuestions.value) {
    const ansId = userAnswers.value[q.id];
    if (ansId !== undefined) {
      const correctAns = q.answers.find(a => a.isCorrect);
      if (correctAns && correctAns.id === ansId) {
        correct++;
      } else {
        wrong++;
      }
    }
  }

  const answered = correct + wrong;
  const total = paralysisQuestions.value.length;
  const progressPercent = total > 0 ? Math.round((answered / total) * 100) : 0;

  return { correct, wrong, answered, total, progressPercent };
});

// Kiểm tra trạng thái của một câu hỏi để tô màu cho nút Palette
const getQuestionStatus = (questionId) => {
  const ansId = userAnswers.value[questionId];
  if (ansId === undefined) return 'unanswered';

  const q = paralysisQuestions.value.find(item => item.id === questionId);
  if (!q) return 'unanswered';

  const correctAns = q.answers.find(a => a.isCorrect);
  return correctAns && correctAns.id === ansId ? 'correct' : 'wrong';
};

// Chọn đáp án
const handleSelectAnswer = (question, answer) => {
  if (userAnswers.value[question.id] !== undefined) return;
  userAnswers.value[question.id] = answer.id;

  // Nếu chọn sai câu điểm liệt, hiển thị thông báo cảnh báo nghiêm trọng
  if (!answer.isCorrect) {
    Swal.fire({
      icon: 'error',
      title: 'BẠN ĐÃ CHỌN SAI CÂU ĐIỂM LIỆT!',
      html: `
        <div class="text-start">
          <p class="text-danger fw-bold mb-2">
            <i class="bi bi-exclamation-octagon-fill me-1"></i> CẢNH BÁO QUY CHẾ THI:
          </p>
          <p class="small text-secondary mb-3">
            Trong kỳ thi sát hạch lý thuyết chính thức, chỉ cần <strong>sai duy nhất 1 câu điểm liệt</strong>, bạn sẽ bị <strong>TRƯỢT NGAY LẬP TỨC</strong> dù tất cả các câu hỏi khác làm đúng 100%.
          </p>
          <div class="p-2 bg-light border rounded small">
            <strong>Đáp án đúng:</strong> Phương án ${question.answers.find(a => a.isCorrect)?.orderNumber} - "${question.answers.find(a => a.isCorrect)?.answerText}"
          </div>
        </div>
      `,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Tôi đã hiểu & ghi nhớ'
    });
  }
};

// Chuyển câu hỏi (Stepper)
const goToNext = () => {
  if (currentIndex.value < filteredQuestions.value.length - 1) {
    currentIndex.value++;
  }
};

const goToPrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

const jumpToQuestion = (index) => {
  currentIndex.value = index;
};

// Làm lại câu hiện tại
const resetCurrentQuestion = (questionId) => {
  delete userAnswers.value[questionId];
};

// Làm lại toàn bộ 60 câu điểm liệt
const resetAllQuestions = async () => {
  const result = await Swal.fire({
    title: 'Làm lại toàn bộ câu điểm liệt?',
    text: 'Tất cả kết quả ôn tập hiện tại sẽ được thiết lập lại từ đầu.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Đồng ý làm lại',
    cancelButtonText: 'Hủy'
  });

  if (result.isConfirmed) {
    userAnswers.value = {};
    currentIndex.value = 0;
  }
};

onMounted(() => {
  loadParalysisQuestions();
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
            <li class="breadcrumb-item active text-danger" aria-current="page">60 Câu điểm liệt</li>
          </ol>
        </nav>
        <div class="d-flex align-items-center gap-2">
          <h2 class="fw-bolder text-danger mb-0">
            <i class="bi bi-exclamation-octagon-fill me-2"></i>Bộ 60 Câu Hỏi Điểm Liệt
          </h2>
          <span class="badge bg-danger rounded-pill px-3 py-1 fs-xxs">Đặc biệt quan trọng</span>
        </div>
        <p class="text-secondary small mt-1 mb-0">
          Tuyệt đối không được sai bất kỳ câu nào trong bộ đề này để không bị truất quyền công nhận kết quả thi.
        </p>
      </div>

      <!-- Navigation back to the home page -->
      <div>
        <router-link to="/" class="btn btn-outline-secondary px-3 py-2 fw-semibold">
          <i class="bi bi-arrow-left me-1"></i> Về trang chủ
        </router-link>
      </div>
    </div>

    <!-- Critical Exam Warning Banner -->
    <div class="paralysis-warning-box p-3 p-md-4 mb-4">
      <div class="d-flex align-items-start gap-3">
        <div class="text-danger fs-1 lh-1 flex-shrink-0">
          <i class="bi bi-shield-slash-fill"></i>
        </div>
        <div>
          <h5 class="fw-bolder text-danger mb-1">
            QUY ĐỊNH BẮT BUỘC TRONG KỲ THI SÁT HẠCH LÝ THUYẾT GPLX
          </h5>
          <p class="text-dark small mb-2 lh-base">
            Mỗi đề thi thật của các hạng bằng (A, A1, B, B1, C, C1) luôn chứa câu hỏi điểm liệt.
            Thí sinh trả lời <strong>sai 1 câu điểm liệt thì bị TRƯỢT NGAY LẬP TỨC</strong>, kể cả khi tất cả các câu hỏi khác đều đạt điểm tối đa.
          </p>
          <div class="d-flex flex-wrap align-items-center gap-3 fs-xs text-danger-emphasis fw-bold">
            <div><i class="bi bi-check2-all me-1"></i> Mục tiêu: Đúng 100% các câu điểm liệt</div>
            <div><i class="bi bi-lightbulb-fill me-1 text-warning"></i> Nắm vững mẹo nhận diện từ khóa nghiêm cấm</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats & Progress Metric Bar -->
    <div class="row g-3 mb-4">
      <!-- Total Questions -->
      <div class="col-6 col-md-3">
        <div class="stat-metric-card text-center">
          <div class="text-secondary fs-xs fw-semibold mb-1">TỔNG SỐ CÂU ĐIỂM LIỆT</div>
          <div class="fs-4 fw-bolder text-dark">{{ stats.total }} câu</div>
          <div class="fs-xxs text-muted mt-1">Dữ liệu chuẩn Bộ GTVT</div>
        </div>
      </div>

      <!-- Answered Progress -->
      <div class="col-6 col-md-3">
        <div class="stat-metric-card text-center">
          <div class="text-secondary fs-xs fw-semibold mb-1">TIẾN ĐỘ LUYỆN TẬP</div>
          <div class="fs-4 fw-bolder text-primary">{{ stats.answered }} / {{ stats.total }}</div>
          <div class="progress mt-2" role="progressbar">
            <div 
              class="progress-bar bg-primary" 
              :style="{ width: stats.progressPercent + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Correct Answers -->
      <div class="col-6 col-md-3">
        <div class="stat-metric-card text-center">
          <div class="text-secondary fs-xs fw-semibold mb-1">TRẢ LỜI ĐÚNG</div>
          <div class="fs-4 fw-bolder text-success">
            <i class="bi bi-check-circle-fill me-1"></i>{{ stats.correct }}
          </div>
          <div class="fs-xxs text-success mt-1">Đạt yêu cầu an toàn</div>
        </div>
      </div>

      <!-- Wrong Answers -->
      <div class="col-6 col-md-3">
        <div class="stat-metric-card text-center">
          <div class="text-secondary fs-xs fw-semibold mb-1">TRẢ LỜI SAI (BÁO ĐỘNG)</div>
          <div class="fs-4 fw-bolder text-danger">
            <i class="bi bi-x-circle-fill me-1"></i>{{ stats.wrong }}
          </div>
          <div class="fs-xxs text-danger mt-1">
            {{ stats.wrong > 0 ? 'Nguy cơ trượt sát hạch!' : 'Chưa có lỗi nào' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Mode Selector & Search Filter Bar -->
    <div class="card border border-light-subtle shadow-sm rounded-4 p-3 mb-4 bg-white">
      <div class="row g-3 align-items-center justify-content-between">
        <!-- Search Keyword -->
        <div class="col-12 col-md-6 col-lg-5">
          <div class="input-group">
            <span class="input-group-text bg-light text-secondary border-end-0">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="searchKeyword"
              type="text"
              class="form-control border-start-0 ps-0"
              placeholder="Tìm kiếm nội dung câu điểm liệt..."
            />
            <button 
              v-if="searchKeyword" 
              @click="searchKeyword = ''" 
              class="btn btn-outline-secondary border-start-0" 
              type="button"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <!-- Mode Toggle & Reset -->
        <div class="col-12 col-md-6 col-lg-6 text-md-end d-flex align-items-center justify-content-md-end gap-2">
          <!-- Reset button -->
          <button 
            v-if="stats.answered > 0" 
            @click="resetAllQuestions" 
            class="btn btn-outline-danger btn-sm py-2 px-3 fw-semibold"
          >
            <i class="bi bi-arrow-counterclockwise me-1"></i> Làm lại từ đầu
          </button>

          <!-- Toggle View Mode: Stepper vs List -->
          <div class="btn-group" role="group">
            <button
              type="button"
              class="btn btn-sm py-2 px-3"
              :class="viewMode === 'stepper' ? 'btn-danger' : 'btn-outline-danger'"
              @click="viewMode = 'stepper'"
            >
              <i class="bi bi-card-text me-1"></i> Từng câu một
            </button>
            <button
              type="button"
              class="btn btn-sm py-2 px-3"
              :class="viewMode === 'list' ? 'btn-danger' : 'btn-outline-danger'"
              @click="viewMode = 'list'"
            >
              <i class="bi bi-list-task me-1"></i> Danh sách tất cả
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-danger mb-3" role="status"></div>
      <p class="text-muted fw-semibold">Đang tải danh sách câu hỏi điểm liệt...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="alert alert-danger rounded-4 p-4 text-center" role="alert">
      <i class="bi bi-exclamation-triangle-fill fs-2 text-danger mb-2"></i>
      <h5 class="fw-bold">Có lỗi xảy ra</h5>
      <p class="mb-3">{{ errorMessage }}</p>
      <button @click="loadParalysisQuestions" class="btn btn-outline-danger btn-sm">
        <i class="bi bi-arrow-repeat me-1"></i> Thử lại
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredQuestions.length === 0" class="text-center py-5 card border-0 shadow-sm rounded-4 p-5">
      <i class="bi bi-search fs-1 text-secondary mb-3"></i>
      <h5 class="fw-bold text-dark">Không tìm thấy câu hỏi điểm liệt phù hợp</h5>
      <p class="text-muted small">Hãy xóa từ khóa tìm kiếm để xem đầy đủ danh sách.</p>
      <div>
        <button @click="searchKeyword = ''" class="btn btn-danger btn-sm">
          Xóa tìm kiếm
        </button>
      </div>
    </div>

    <!-- MAIN VIEW MODE: 1. STEPPER MODE (TỪNG CÂU TẬP TRUNG) -->
    <div v-else-if="viewMode === 'stepper'" class="row g-4">
      <!-- Left Column: Question Palette Sidebar -->
      <div class="col-12 col-lg-4 col-xl-3">
        <div class="card border border-light-subtle shadow-sm rounded-4 p-3 bg-white sticky-top">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <span class="fw-bold text-dark small">
              <i class="bi bi-grid-3x3-gap-fill text-danger me-1"></i> Bảng điều hướng câu:
            </span>
            <span class="badge bg-secondary rounded-pill fs-xxs">
              {{ currentIndex + 1 }} / {{ filteredQuestions.length }}
            </span>
          </div>

          <!-- Color Legend -->
          <div class="d-flex flex-wrap gap-2 mb-3 pb-2 border-bottom fs-xxs text-secondary">
            <div class="d-flex align-items-center gap-1">
              <i class="bi bi-circle-fill text-success"></i>
              <span>Đúng</span>
            </div>
            <div class="d-flex align-items-center gap-1">
              <i class="bi bi-circle-fill text-danger"></i>
              <span>Sai</span>
            </div>
            <div class="d-flex align-items-center gap-1">
              <i class="bi bi-circle-fill text-secondary"></i>
              <span>Chưa làm</span>
            </div>
          </div>

          <!-- Question Buttons Grid -->
          <div class="question-palette-grid">
            <button
              v-for="(q, idx) in filteredQuestions"
              :key="q.id"
              type="button"
              class="question-palette-btn"
              :class="{
                'active': idx === currentIndex,
                'palette-correct': getQuestionStatus(q.id) === 'correct',
                'palette-wrong': getQuestionStatus(q.id) === 'wrong'
              }"
              @click="jumpToQuestion(idx)"
            >
              {{ idx + 1 }}
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column: Active Question Flashcard -->
      <div class="col-12 col-lg-8 col-xl-9">
        <div v-if="currentQuestion" class="study-question-card border-paralysis p-4 p-md-5">
          <!-- Card Header -->
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-danger px-3 py-2 rounded-pill fw-bold">
                Câu {{ currentIndex + 1 }} / {{ filteredQuestions.length }}
              </span>
              <span class="badge bg-light text-secondary border px-3 py-2 rounded-pill">
                {{ currentQuestion.chapterTitle ? currentQuestion.chapterTitle.split(':')[0] : 'Chương ' + currentQuestion.chapterId }}
              </span>
            </div>
            <span class="badge bg-danger-gradient px-3 py-2 rounded-pill shadow-sm">
              <i class="bi bi-exclamation-triangle-fill me-1"></i> ĐIỂM LIỆT (BẮT BUỘC ĐÚNG)
            </span>
          </div>

          <!-- Question Content -->
          <h4 class="fw-bold text-dark lh-base mb-4">
            {{ currentQuestion.content }}
          </h4>

          <!-- Question Image (If any) -->
          <div v-if="currentQuestion.imageUrl" class="text-center my-3 bg-light p-2 rounded-3 border">
            <img 
              :src="resolveAssetUrl(currentQuestion.imageUrl)" 
              :alt="'Hình minh họa câu hỏi ' + currentQuestion.id" 
              class="question-img-container" 
            />
          </div>

          <!-- Answer Options -->
          <div class="d-flex flex-column gap-3 mb-4">
            <div
              v-for="ans in currentQuestion.answers"
              :key="ans.id"
              class="study-option-item d-flex align-items-center justify-content-between p-3"
              :class="{
                'correct': userAnswers[currentQuestion.id] !== undefined && ans.isCorrect,
                'wrong': userAnswers[currentQuestion.id] === ans.id && !ans.isCorrect,
                'locked': userAnswers[currentQuestion.id] !== undefined
              }"
              @click="handleSelectAnswer(currentQuestion, ans)"
            >
              <div class="d-flex align-items-center gap-3">
                <div class="study-option-badge">
                  {{ ans.orderNumber }}
                </div>
                <div class="fw-semibold text-dark fs-6">
                  {{ ans.answerText }}
                </div>
              </div>

              <!-- Check/Cross Icon -->
              <div>
                <i 
                  v-if="userAnswers[currentQuestion.id] !== undefined && ans.isCorrect" 
                  class="bi bi-check-circle-fill text-success fs-4"
                ></i>
                <i 
                  v-else-if="userAnswers[currentQuestion.id] === ans.id && !ans.isCorrect" 
                  class="bi bi-x-circle-fill text-danger fs-4"
                ></i>
              </div>
            </div>
          </div>

          <!-- Feedback Status Banner -->
          <div 
            v-if="userAnswers[currentQuestion.id] !== undefined"
            class="alert py-3 px-4 mb-4 d-flex align-items-center gap-3 rounded-4 shadow-sm"
            :class="currentQuestion.answers.find(a => a.id === userAnswers[currentQuestion.id])?.isCorrect ? 'alert-success border-success' : 'alert-danger border-danger'"
          >
            <i 
              class="bi fs-3"
              :class="currentQuestion.answers.find(a => a.id === userAnswers[currentQuestion.id])?.isCorrect ? 'bi-check-circle-fill text-success' : 'bi-slash-circle-fill text-danger'"
            ></i>
            <div>
              <div class="fw-bold fs-6">
                {{ currentQuestion.answers.find(a => a.id === userAnswers[currentQuestion.id])?.isCorrect ? 'Chính xác! Bạn đã ghi nhớ đúng tình huống này.' : 'CẢNH BÁO: BẠN ĐÃ CHỌN SAI CÂU ĐIỂM LIỆT!' }}
              </div>
              <small class="text-secondary">
                {{ currentQuestion.answers.find(a => a.id === userAnswers[currentQuestion.id])?.isCorrect ? 'Hãy tiếp tục giữ vững phong độ cho các câu tiếp theo.' : 'Trong bài thi sát hạch thực tế, sai câu này đồng nghĩa với việc TRƯỢT TRỰC TIẾP.' }}
              </small>
            </div>
          </div>

          <!-- Explanation Box -->
          <div 
            v-if="userAnswers[currentQuestion.id] !== undefined && currentQuestion.explanation" 
            class="explanation-box mb-4"
          >
            <div class="d-flex align-items-center gap-2 fw-bold text-warning-emphasis mb-2">
              <i class="bi bi-lightbulb-fill text-warning fs-5"></i>
              <span>Giải thích chi tiết & Mẹo ghi nhớ câu điểm liệt này:</span>
            </div>
            <div class="text-dark small lh-base">
              {{ currentQuestion.explanation }}
            </div>
          </div>

          <!-- Navigation Stepper Buttons -->
          <div class="d-flex align-items-center justify-content-between pt-3 border-top">
            <button
              type="button"
              class="btn btn-outline-secondary px-3 py-2 fw-semibold"
              :disabled="currentIndex === 0"
              @click="goToPrev"
            >
              <i class="bi bi-chevron-left me-1"></i> Câu trước
            </button>

            <button
              v-if="userAnswers[currentQuestion.id] !== undefined"
              type="button"
              class="btn btn-link text-decoration-none text-secondary small fw-semibold"
              @click="resetCurrentQuestion(currentQuestion.id)"
            >
              <i class="bi bi-arrow-repeat me-1"></i> Chọn lại câu này
            </button>

            <button
              type="button"
              class="btn btn-danger px-4 py-2 fw-semibold shadow-sm"
              :disabled="currentIndex >= filteredQuestions.length - 1"
              @click="goToNext"
            >
              Câu tiếp theo <i class="bi bi-chevron-right ms-1"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN VIEW MODE: 2. LIST ALL MODE (DANH SÁCH CUỘN TẤT CẢ) -->
    <div v-else class="d-flex flex-column gap-4">
      <div
        v-for="(question, index) in filteredQuestions"
        :key="question.id"
        class="study-question-card border-paralysis p-4"
      >
        <!-- Card Header -->
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-danger px-3 py-2 rounded-pill fw-bold">
              Câu {{ index + 1 }}
            </span>
            <span class="badge bg-light text-secondary border px-3 py-2 rounded-pill">
              {{ question.chapterTitle ? question.chapterTitle.split(':')[0] : 'Chương ' + question.chapterId }}
            </span>
          </div>
          <span class="badge bg-danger-gradient px-3 py-2 rounded-pill shadow-sm">
            <i class="bi bi-exclamation-triangle-fill me-1"></i> ĐIỂM LIỆT (BẮT BUỘC ĐÚNG)
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

        <!-- Answer Options -->
        <div class="d-flex flex-column gap-2 mb-3">
          <div
            v-for="ans in question.answers"
            :key="ans.id"
            class="study-option-item d-flex align-items-center justify-content-between"
            :class="{
              'correct': userAnswers[question.id] !== undefined && ans.isCorrect,
              'wrong': userAnswers[question.id] === ans.id && !ans.isCorrect,
              'locked': userAnswers[question.id] !== undefined
            }"
            @click="handleSelectAnswer(question, ans)"
          >
            <div class="d-flex align-items-center gap-3">
              <div class="study-option-badge">
                {{ ans.orderNumber }}
              </div>
              <div class="fw-semibold text-dark">
                {{ ans.answerText }}
              </div>
            </div>

            <div>
              <i 
                v-if="userAnswers[question.id] !== undefined && ans.isCorrect" 
                class="bi bi-check-circle-fill text-success fs-5"
              ></i>
              <i 
                v-else-if="userAnswers[question.id] === ans.id && !ans.isCorrect" 
                class="bi bi-x-circle-fill text-danger fs-5"
              ></i>
            </div>
          </div>
        </div>

        <!-- Feedback Alert -->
        <div 
          v-if="userAnswers[question.id] !== undefined"
          class="alert py-2 px-3 mb-3 d-flex align-items-center gap-2 rounded-3"
          :class="question.answers.find(a => a.id === userAnswers[question.id])?.isCorrect ? 'alert-success' : 'alert-danger'"
        >
          <i 
            class="bi fs-5"
            :class="question.answers.find(a => a.id === userAnswers[question.id])?.isCorrect ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'"
          ></i>
          <span class="small fw-semibold">
            {{ question.answers.find(a => a.id === userAnswers[question.id])?.isCorrect ? 'Chính xác! Bạn đã ghi nhớ đúng tình huống này.' : 'CẢNH BÁO: BẠN ĐÃ CHỌN SAI CÂU ĐIỂM LIỆT!' }}
          </span>
        </div>

        <!-- Explanation Box -->
        <div 
          v-if="userAnswers[question.id] !== undefined && question.explanation" 
          class="explanation-box"
        >
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
</template>
