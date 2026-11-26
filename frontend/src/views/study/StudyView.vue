<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import apiClient, { resolveAssetUrl } from '../../services/api';
import { getLicenseGroup } from '../../utils/licenseGroups';

const route = useRoute();

// State
const chapters = ref([]);
const questions = ref([]);
const totalQuestions = ref(0);
const totalPages = ref(1);
const currentPage = ref(1);
const limit = ref(10);
const selectedChapterId = ref(null);
const searchKeyword = ref('');
const onlyParalysis = ref(false);
const studyMode = ref('practice'); // 'practice' (tự giải) hoặc 'reveal' (xem sẵn đáp án)

const isLoading = ref(false);
const errorMessage = ref('');
const groupCode = computed(() => getLicenseGroup(route.query.group)?.code || null);
const selectedGroup = computed(() => getLicenseGroup(groupCode.value));
const studyChapters = computed(() => {
  if (!selectedGroup.value?.chapterOrders) return chapters.value;
  const allowedOrders = new Set(selectedGroup.value.chapterOrders);
  return chapters.value.filter(chapter => allowedOrders.has(Number(chapter.orderNumber)));
});

// Theo dõi câu trả lời của người dùng trong phiên học: { [questionId]: selectedAnswerId }
const userAnswers = ref({});

// Thống kê phiên học
const stats = computed(() => {
  let correct = 0;
  let wrong = 0;
  
  for (const q of questions.value) {
    const selectedAnsId = userAnswers.value[q.id];
    if (selectedAnsId !== undefined) {
      const correctAns = q.answers.find(a => a.isCorrect);
      if (correctAns && correctAns.id === selectedAnsId) {
        correct++;
      } else {
        wrong++;
      }
    }
  }

  const answered = correct + wrong;
  return { correct, wrong, answered };
});

// Lấy danh sách chương phục vụ phạm vi ôn tập của nhóm hạng
const loadChapters = async () => {
  try {
    const res = await apiClient.get('/chapters');
    if (res.success && res.data?.chapters) {
      chapters.value = res.data.chapters;
    }
  } catch (err) {
    console.error('Lỗi tải danh sách chương:', err);
  }
};

const initializeStudy = async () => {
  errorMessage.value = '';
  questions.value = [];
  selectedChapterId.value = null;
  await loadChapters();

  const requestedChapterId = Number(route.query.chapter);
  selectedChapterId.value = studyChapters.value.some(chapter => Number(chapter.id) === requestedChapterId)
    ? requestedChapterId
    : Number(studyChapters.value[0]?.id) || null;

  await loadQuestions();
};

// Lấy danh sách câu hỏi theo bộ lọc
const loadQuestions = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  if (selectedChapterId.value === null || selectedChapterId.value === undefined || selectedChapterId.value === '') {
    questions.value = [];
    totalQuestions.value = 0;
    totalPages.value = 1;
    currentPage.value = 1;
    isLoading.value = false;
    return;
  }

  try {
    const params = {
      page: currentPage.value,
      limit: limit.value,
      showAnswer: true // Luôn lấy thông tin isCorrect từ backend để frontend tự kiểm tra
    };

    params.chapterId = selectedChapterId.value;
    if (onlyParalysis.value) {
      params.isParalysis = 1;
    }
    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim();
    }

    const res = await apiClient.get('/questions', { params });
    if (res.success && res.data) {
      questions.value = res.data.questions || [];
      totalQuestions.value = res.data.total || 0;
      totalPages.value = res.data.totalPages || 1;
      currentPage.value = res.data.page || 1;
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải danh sách câu hỏi ôn tập';
    questions.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Chọn chương để ôn tập
const selectChapter = (chapterId) => {
  selectedChapterId.value = chapterId;
  currentPage.value = 1;
  loadQuestions();
};

// Xử lý khi học viên chọn một phương án đáp án trong chế độ Luyện tập
const handleSelectAnswer = (question, answer) => {
  // Nếu đã chọn rồi thì không đổi để giữ nguyên kết quả luyện tập
  if (userAnswers.value[question.id] !== undefined) return;
  userAnswers.value[question.id] = answer.id;
};

// Chuyển trang
const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  loadQuestions();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Làm lại / Reset câu trả lời của phiên
const resetPracticeSession = () => {
  userAnswers.value = {};
};

// Debounce tìm kiếm
let searchTimeout = null;
const handleSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadQuestions();
  }, 400);
};

// Đổi bộ lọc câu điểm liệt
const toggleParalysisFilter = () => {
  onlyParalysis.value = !onlyParalysis.value;
  currentPage.value = 1;
  loadQuestions();
};

onMounted(async () => {
  await initializeStudy();
});

watch(() => [route.query.group, route.query.chapter], async () => {
  await initializeStudy();
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
            <li class="breadcrumb-item active" aria-current="page">
              Ôn thi hạng {{ selectedGroup.label }}
            </li>
          </ol>
        </nav>
        <h2 class="fw-bolder text-dark mb-1">
          <i class="bi bi-journal-check text-primary me-2"></i>
          Ôn thi hạng {{ selectedGroup.label }}
        </h2>
        <p class="text-secondary small mb-0">
          Ôn tập {{ selectedGroup.studyScope.toLowerCase() }} dành cho nhóm hạng {{ selectedGroup.label }}.
        </p>
      </div>

      <!-- Quick Action: Go to 60 Paralysis Questions -->
      <div class="d-flex align-items-center gap-2">
        <router-link :to="{ path: '/exam', query: { group: groupCode } }" class="btn btn-primary px-3 py-2 fw-semibold shadow-sm">
          <i class="bi bi-play-circle me-1"></i>Thi thử hạng {{ selectedGroup.label }}
        </router-link>
        <router-link :to="{ path: '/exam/history', query: { group: groupCode } }" class="btn btn-outline-primary px-3 py-2 fw-semibold">
          <i class="bi bi-clock-history me-1"></i>Lịch sử
        </router-link>
      </div>
    </div>

    <!-- Chapter Selection Carousel / Pill Tabs -->
    <div class="card border border-light-subtle shadow-sm rounded-4 p-3 mb-4 bg-white">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <span class="fw-bold text-dark small">
          <i class="bi bi-collection-fill text-primary me-1"></i>
          {{ selectedGroup.studyScope }} dành cho hạng {{ selectedGroup.label }}:
        </span>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <!-- 7 Chương -->
        <button
          v-for="chap in studyChapters"
          :key="chap.id"
          type="button"
          class="btn btn-sm px-3 py-2 study-chapter-pill d-flex align-items-center gap-2"
          :class="selectedChapterId === chap.id ? 'active' : 'btn-light border text-dark'"
          @click="selectChapter(chap.id)"
        >
          <span>{{ chap.title.split(':')[0] }}</span>
          <span 
            class="badge rounded-pill"
            :class="selectedChapterId === chap.id ? 'bg-white text-primary' : 'bg-primary-subtle text-primary'"
          >
            {{ chap.totalQuestions }} câu
          </span>
          <span 
            v-if="chap.paralysisQuestions > 0" 
            class="badge bg-danger rounded-pill fs-xxs" 
            title="Số câu điểm liệt trong chương"
          >
            {{ chap.paralysisQuestions }} liệt
          </span>
        </button>
      </div>
    </div>

    <!-- Control Bar: Search, Paralysis Filter, Mode Toggle -->
    <div class="card border border-light-subtle shadow-sm rounded-4 p-3 mb-4 bg-white">
      <div class="row g-3 align-items-center">
        <!-- Search Input -->
        <div class="col-12 col-md-5">
          <div class="input-group">
            <span class="input-group-text bg-light text-secondary border-end-0">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="searchKeyword"
              @input="handleSearchInput"
              type="text"
              class="form-control border-start-0 ps-0"
              placeholder="Tìm kiếm nội dung câu hỏi..."
            />
            <button 
              v-if="searchKeyword" 
              @click="searchKeyword = ''; loadQuestions();" 
              class="btn btn-outline-secondary border-start-0" 
              type="button"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <!-- Paralysis Filter Button -->
        <div class="col-6 col-md-3">
          <button
            type="button"
            class="btn w-100 py-2 d-flex align-items-center justify-content-center gap-1"
            :class="onlyParalysis ? 'btn-danger shadow-sm' : 'btn-outline-danger'"
            @click="toggleParalysisFilter"
          >
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span class="fw-semibold small">
              {{ onlyParalysis ? 'Đang lọc câu điểm liệt' : 'Chỉ lọc câu điểm liệt' }}
            </span>
          </button>
        </div>

        <!-- Mode Toggle (Luyện tập / Xem nhanh đáp án) -->
        <div class="col-6 col-md-4 text-end">
          <div class="btn-group w-100" role="group">
            <button
              type="button"
              class="btn btn-sm py-2"
              :class="studyMode === 'practice' ? 'btn-primary' : 'btn-outline-primary'"
              @click="studyMode = 'practice'"
            >
              <i class="bi bi-pencil-square me-1"></i> Tự giải bài
            </button>
            <button
              type="button"
              class="btn btn-sm py-2"
              :class="studyMode === 'reveal' ? 'btn-primary' : 'btn-outline-primary'"
              @click="studyMode = 'reveal'"
            >
              <i class="bi bi-eye-fill me-1"></i> Xem đáp án & mẹo
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Filter Info & Session Stats Bar -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light p-3 rounded-4 border mb-4">
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-secondary rounded-pill px-3 py-2">
          Tổng số: {{ totalQuestions }} câu hỏi
        </span>
        <span v-if="selectedChapterId" class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2">
          Đang xem chương {{ selectedChapterId }}
        </span>
        <span v-if="onlyParalysis" class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2">
          Chỉ xem câu điểm liệt
        </span>
      </div>

      <!-- Practice Session Stats Counter -->
      <div v-if="studyMode === 'practice'" class="d-flex align-items-center gap-2">
        <span class="small fw-semibold text-secondary">Tiến độ trang này:</span>
        <span class="badge bg-white text-dark border px-2 py-1">
          {{ stats.answered }}/{{ questions.length }} đã trả lời
        </span>
        <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
          <i class="bi bi-check-lg"></i> {{ stats.correct }} đúng
        </span>
        <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
          <i class="bi bi-x-lg"></i> {{ stats.wrong }} sai
        </span>
        <button 
          v-if="stats.answered > 0" 
          @click="resetPracticeSession" 
          class="btn btn-sm btn-outline-secondary py-0 px-2 fs-xs"
          title="Làm lại các câu trên trang này"
        >
          <i class="bi bi-arrow-clockwise"></i> Làm lại
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <p class="text-muted fw-semibold">Đang tải danh sách câu hỏi ôn tập...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="alert alert-danger rounded-4 p-4 text-center" role="alert">
      <i class="bi bi-exclamation-triangle-fill fs-2 text-danger mb-2"></i>
      <h5 class="fw-bold">Có lỗi xảy ra</h5>
      <p class="mb-3">{{ errorMessage }}</p>
      <button @click="loadQuestions" class="btn btn-outline-danger btn-sm">
        <i class="bi bi-arrow-repeat me-1"></i> Thử lại
      </button>
    </div>

    <!-- No chapter selected -->
    <div v-else-if="selectedChapterId === null || selectedChapterId === undefined || selectedChapterId === ''" class="card border border-light-subtle shadow-sm rounded-4 p-5 text-center bg-white">
      <i class="bi bi-info-circle fs-1 text-primary mb-3"></i>
      <h5 class="fw-bold text-dark mb-2">Vui lòng chọn chương</h5>
      <p class="text-secondary small mb-0">Hãy chọn một chương ở danh sách trên để bắt đầu ôn tập.</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="questions.length === 0" class="text-center py-5 card border-0 shadow-sm rounded-4 p-5">
      <i class="bi bi-folder-x fs-1 text-secondary mb-3"></i>
      <h5 class="fw-bold text-dark">Không tìm thấy câu hỏi phù hợp</h5>
      <p class="text-muted small">Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn chương khác.</p>
      <div>
        <button @click="selectedChapterId = null; searchKeyword = ''; onlyParalysis = false; loadQuestions();" class="btn btn-primary btn-sm">
          Khôi phục bộ lọc
        </button>
      </div>
    </div>

    <!-- Question Cards List -->
    <div v-else class="d-flex flex-column gap-4">
      <div
        v-for="(question, index) in questions"
        :key="question.id"
        class="study-question-card p-4"
        :class="{ 'border-paralysis': question.isParalysis }"
      >
        <!-- Card Header: Badges & Tags -->
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div class="d-flex align-items-center gap-2">
            <!-- Question Number Badge -->
            <span class="badge bg-primary px-3 py-2 rounded-pill fw-bold">
              Câu {{ (currentPage - 1) * limit + index + 1 }}
            </span>
            <!-- Chapter Badge -->
            <span class="badge bg-light text-secondary border px-3 py-2 rounded-pill">
              {{ question.chapterTitle ? question.chapterTitle.split(':')[0] : 'Chương ' + question.chapterId }}
            </span>
          </div>

          <!-- Paralysis Warning Badge -->
          <span 
            v-if="question.isParalysis" 
            class="badge bg-danger-gradient px-3 py-2 rounded-pill shadow-sm animate-pulse"
          >
            <i class="bi bi-exclamation-triangle-fill me-1"></i> CÂU ĐIỂM LIỆT (BẮT BUỘC ĐÚNG)
          </span>
        </div>

        <!-- Question Content -->
        <h5 class="fw-bold text-dark lh-base mb-3">
          {{ question.content }}
        </h5>

        <!-- Question Image (If applicable) -->
        <div v-if="question.imageUrl" class="text-center my-3 bg-light p-2 rounded-3 border">
          <img 
            :src="resolveAssetUrl(question.imageUrl)" 
            :alt="'Hình minh họa câu hỏi ' + question.id" 
            class="question-img-container" 
          />
        </div>

        <!-- Answers Options -->
        <div class="d-flex flex-column gap-2 mb-3">
          <div
            v-for="ans in question.answers"
            :key="ans.id"
            class="study-option-item d-flex align-items-center justify-content-between"
            :class="{
              // Chế độ Luyện tập
              'correct': (studyMode === 'practice' && userAnswers[question.id] !== undefined && ans.isCorrect) || (studyMode === 'reveal' && ans.isCorrect),
              'wrong': studyMode === 'practice' && userAnswers[question.id] === ans.id && !ans.isCorrect,
              'locked': studyMode === 'practice' && userAnswers[question.id] !== undefined
            }"
            @click="handleSelectAnswer(question, ans)"
          >
            <div class="d-flex align-items-center gap-3">
              <!-- Option Order Letter/Number Badge -->
              <div class="study-option-badge">
                {{ ans.orderNumber }}
              </div>
              <!-- Answer Text -->
              <div class="fw-semibold text-dark">
                {{ ans.answerText }}
              </div>
            </div>

            <!-- Result Status Icon -->
            <div>
              <!-- Khi người dùng chọn đúng hoặc chế độ xem sẵn -->
              <i 
                v-if="(studyMode === 'practice' && userAnswers[question.id] !== undefined && ans.isCorrect) || (studyMode === 'reveal' && ans.isCorrect)" 
                class="bi bi-check-circle-fill text-success fs-5"
              ></i>
              <!-- Khi người dùng chọn phương án sai này -->
              <i 
                v-else-if="studyMode === 'practice' && userAnswers[question.id] === ans.id && !ans.isCorrect" 
                class="bi bi-x-circle-fill text-danger fs-5"
              ></i>
            </div>
          </div>
        </div>

        <!-- Interactive Feedback Message (Practice Mode) -->
        <div 
          v-if="studyMode === 'practice' && userAnswers[question.id] !== undefined"
          class="alert py-2 px-3 mb-3 d-flex align-items-center gap-2 rounded-3"
          :class="question.answers.find(a => a.id === userAnswers[question.id])?.isCorrect ? 'alert-success' : 'alert-danger'"
        >
          <i 
            class="bi fs-5"
            :class="question.answers.find(a => a.id === userAnswers[question.id])?.isCorrect ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'"
          ></i>
          <span class="small fw-semibold">
            <template v-if="question.answers.find(a => a.id === userAnswers[question.id])?.isCorrect">
              Chính xác! Bạn đã chọn đúng đáp án cho câu hỏi này.
            </template>
            <template v-else>
              Chưa chính xác! Đáp án đúng là phương án {{ question.answers.find(a => a.isCorrect)?.orderNumber }}.
              <span v-if="question.isParalysis" class="fw-bold text-danger">
                (Lưu ý: Đây là câu điểm liệt, nếu làm sai trong bài thi thật bạn sẽ bị trượt trực tiếp!)
              </span>
            </template>
          </span>
        </div>

        <!-- Explanation / Memo Tips Box -->
        <div 
          v-if="(studyMode === 'reveal' || userAnswers[question.id] !== undefined) && question.explanation" 
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

    <!-- Pagination Controls -->
    <div v-if="totalPages > 1" class="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 mt-4 pt-3 border-top">
      <div class="small text-secondary">
        Trang <span class="fw-bold text-dark">{{ currentPage }}</span> / <span class="fw-bold text-dark">{{ totalPages }}</span> 
        (Tổng số {{ totalQuestions }} câu hỏi)
      </div>

      <nav aria-label="Phân trang câu hỏi ôn tập">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button class="page-link" @click="changePage(currentPage - 1)">
              <i class="bi bi-chevron-left me-1"></i> Trang trước
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
              Trang sau <i class="bi bi-chevron-right ms-1"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>
