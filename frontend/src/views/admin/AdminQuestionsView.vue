<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import apiClient, { resolveAssetUrl } from '../../services/api';
import { useAuthStore } from '../../stores/auth';
import Swal from 'sweetalert2';

const authStore = useAuthStore();
const lastSelectedChapterStorageKey = `traffic_exam_admin_last_question_chapter_${authStore.user?.id || 'default'}`;

const getChapterOptionLabel = (chapter) => {
  const title = String(chapter.title || '')
    .trim();
  const hasChapterPrefix = /^Chương\s+(?:\d+|[IVXLCDM]+(?:\s+[A-Z])?)\s*:/i.test(title);
  const maxTitleLength = 65;
  const shortTitle = title.length > maxTitleLength
    ? `${title.slice(0, maxTitleLength - 1).trimEnd()}…`
    : title;

  return hasChapterPrefix
    ? shortTitle
    : `Chương ${chapter.orderNumber ?? chapter.id}: ${shortTitle}`;
};

// Danh sách dữ liệu
const questions = ref([]);
const chapters = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');

// Phân trang
const pagination = reactive({
  page: 1,
  limit: 15,
  total: 0,
  totalPages: 1
});

// Bộ lọc
const filterChapter = ref('');
const filterParalysis = ref('all'); // 'all', '1', '0'
const filterActive = ref('all'); // 'all', '1', '0'
const searchKeyword = ref('');

// Trạng thái Modal Thêm / Sửa
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const modalErrorMessage = ref('');
const imageFile = ref(null);
const imagePreviewUrl = ref('');

// Form dữ liệu câu hỏi
const form = reactive({
  id: null,
  chapterId: '',
  content: '',
  imageUrl: '',
  isParalysis: false,
  explanation: '',
  isActive: true,
  answers: [
    { answerText: '', isCorrect: true, orderNumber: 1 },
    { answerText: '', isCorrect: false, orderNumber: 2 },
    { answerText: '', isCorrect: false, orderNumber: 3 },
    { answerText: '', isCorrect: false, orderNumber: 4 }
  ]
});

// 1. Tải danh sách 7 chương
const fetchChapters = async () => {
  try {
    const res = await apiClient.get('/chapters');
    if (res.success && Array.isArray(res.data?.chapters)) {
      chapters.value = res.data.chapters;
    }
  } catch (err) {
    console.error('Không thể tải danh sách chương:', err);
  }
};

const rememberSelectedChapter = () => {
  if (form.chapterId) {
    localStorage.setItem(lastSelectedChapterStorageKey, String(form.chapterId));
  }
};

// 2. Tải danh sách câu hỏi theo bộ lọc và phân trang
const fetchQuestions = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  if (!filterChapter.value) {
    questions.value = [];
    pagination.total = 0;
    pagination.totalPages = 1;
    isLoading.value = false;
    return;
  }

  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      chapterId: filterChapter.value,
      isParalysis: filterParalysis.value,
      isActive: filterActive.value,
      keyword: searchKeyword.value.trim()
    };

    const res = await apiClient.get('/questions/admin', { params });
    if (res.success && res.data) {
      questions.value = res.data.questions || [];
      pagination.total = res.data.total || 0;
      pagination.totalPages = res.data.totalPages || 1;
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải danh sách câu hỏi';
  } finally {
    isLoading.value = false;
  }
};

// Chuyển trang
const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.page) {
    pagination.page = newPage;
    fetchQuestions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Theo dõi bộ lọc -> tải lại trang 1
watch([filterChapter, filterParalysis, filterActive], () => {
  pagination.page = 1;
  fetchQuestions();
});

// Tìm kiếm theo từ khóa (debounce nhẹ)
let searchTimeout = null;
const handleSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.page = 1;
    fetchQuestions();
  }, 400);
};

// 3. Mở Modal Thêm mới
const openCreateModal = () => {
  isEditing.value = false;
  modalErrorMessage.value = '';
  imageFile.value = null;
  imagePreviewUrl.value = '';

  form.id = null;
  const lastSelectedChapterId = localStorage.getItem(lastSelectedChapterStorageKey);
  const rememberedChapter = chapters.value.find(
    (chapter) => String(chapter.id) === lastSelectedChapterId
  );
  form.chapterId = rememberedChapter?.id ?? chapters.value[0]?.id ?? '';
  form.content = '';
  form.imageUrl = '';
  form.isParalysis = false;
  form.explanation = '';
  form.isActive = true;
  form.answers = [
    { answerText: '', isCorrect: true, orderNumber: 1 },
    { answerText: '', isCorrect: false, orderNumber: 2 },
    { answerText: '', isCorrect: false, orderNumber: 3 },
    { answerText: '', isCorrect: false, orderNumber: 4 }
  ];

  showModal.value = true;
};

// 4. Mở Modal Chỉnh sửa
const openEditModal = async (q) => {
  isEditing.value = true;
  modalErrorMessage.value = '';
  imageFile.value = null;
  imagePreviewUrl.value = resolveAssetUrl(q.imageUrl);

  try {
    // Tải chi tiết câu hỏi kèm đáp án đầy đủ
    const res = await apiClient.get(`/questions/admin/${q.id}?showAnswer=true`);
    const detail = res.success ? res.data?.question : q;

    form.id = detail.id;
    form.chapterId = detail.chapterId;
    form.content = detail.content;
    form.imageUrl = detail.imageUrl || '';
    imagePreviewUrl.value = resolveAssetUrl(detail.imageUrl);
    form.isParalysis = !!detail.isParalysis;
    form.explanation = detail.explanation || '';
    form.isActive = detail.isActive !== undefined ? !!detail.isActive : true;

    if (Array.isArray(detail.answers) && detail.answers.length > 0) {
      form.answers = detail.answers.map((a, idx) => ({
        id: a.id,
        answerText: a.answerText || '',
        isCorrect: !!a.isCorrect,
        orderNumber: a.orderNumber || idx + 1
      }));
    } else {
      form.answers = [
        { answerText: '', isCorrect: true, orderNumber: 1 },
        { answerText: '', isCorrect: false, orderNumber: 2 }
      ];
    }

    showModal.value = true;
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: err.message || 'Không thể tải chi tiết câu hỏi để sửa'
    });
  }
};

// Đóng modal
const closeModal = () => {
  showModal.value = false;
  imageFile.value = null;
  imagePreviewUrl.value = '';
};

// Thêm phương án đáp án mới
const addAnswerOption = () => {
  if (form.answers.length >= 6) {
    Swal.fire({
      icon: 'info',
      title: 'Giới hạn phương án',
      text: 'Mỗi câu hỏi trắc nghiệm tối đa 6 phương án trả lời'
    });
    return;
  }
  form.answers.push({
    answerText: '',
    isCorrect: false,
    orderNumber: form.answers.length + 1
  });
};

// Xóa bớt phương án đáp án
const removeAnswerOption = (index) => {
  if (form.answers.length <= 2) {
    Swal.fire({
      icon: 'warning',
      title: 'Không thể xóa',
      text: 'Câu hỏi trắc nghiệm phải có tối thiểu 2 phương án đáp án'
    });
    return;
  }
  const wasCorrect = form.answers[index].isCorrect;
  form.answers.splice(index, 1);
  // Đánh số lại thứ tự
  form.answers.forEach((ans, idx) => {
    ans.orderNumber = idx + 1;
  });
  // Nếu vừa xóa đáp án đúng, tự động gán đáp án đầu tiên làm đáp án đúng
  if (wasCorrect && form.answers.length > 0) {
    form.answers[0].isCorrect = true;
  }
};

// Chọn đáp án đúng duy nhất
const setCorrectAnswer = (index) => {
  form.answers.forEach((a, idx) => {
    a.isCorrect = idx === index;
  });
};

// Xử lý chọn tệp ảnh sa hình minh họa
const handleImageFileChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Kiểm tra kích thước (5MB)
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({
      icon: 'warning',
      title: 'Tệp quá lớn',
      text: 'Kích thước tệp ảnh không được vượt quá 5MB'
    });
    return;
  }

  imageFile.value = file;
  imagePreviewUrl.value = URL.createObjectURL(file);
};

// Xóa ảnh hiện tại
const removeImage = () => {
  imageFile.value = null;
  imagePreviewUrl.value = '';
  form.imageUrl = '';
};

// 5. Lưu câu hỏi (Thêm mới hoặc Cập nhật)
const handleSaveQuestion = async () => {
  modalErrorMessage.value = '';

  // Kiểm tra đầu vào
  if (!form.chapterId) {
    modalErrorMessage.value = 'Vui lòng chọn chương lý thuyết cho câu hỏi';
    return;
  }
  if (!form.content.trim()) {
    modalErrorMessage.value = 'Vui lòng nhập nội dung câu hỏi';
    return;
  }
  if (form.answers.length < 2) {
    modalErrorMessage.value = 'Câu hỏi phải có tối thiểu 2 phương án đáp án';
    return;
  }
  for (let i = 0; i < form.answers.length; i++) {
    if (!form.answers[i].answerText.trim()) {
      modalErrorMessage.value = `Phương án ${i + 1} chưa có nội dung. Vui lòng nhập đầy đủ`;
      return;
    }
  }
  const correctCount = form.answers.filter(a => a.isCorrect).length;
  if (correctCount !== 1) {
    modalErrorMessage.value = 'Vui lòng chọn chính xác 1 đáp án đúng cho câu hỏi';
    return;
  }

  isSubmitting.value = true;

  try {
    // Nếu có chọn tệp ảnh mới, tải ảnh lên trước qua multipart
    let finalImageUrl = form.imageUrl;
    if (imageFile.value) {
      const formData = new FormData();
      formData.append('image', imageFile.value);
      const uploadRes = await apiClient.post('/questions/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (uploadRes.success && uploadRes.data?.imageUrl) {
        finalImageUrl = uploadRes.data.imageUrl;
      }
    }

    const payload = {
      chapterId: Number(form.chapterId),
      content: form.content.trim(),
      imageUrl: finalImageUrl || null,
      isParalysis: form.isParalysis,
      explanation: form.explanation.trim(),
      isActive: form.isActive,
      answers: form.answers.map((a, idx) => ({
        id: a.id,
        answerText: a.answerText.trim(),
        isCorrect: !!a.isCorrect,
        orderNumber: idx + 1
      }))
    };

    if (isEditing.value) {
      await apiClient.put(`/questions/${form.id}`, payload);
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: `Đã cập nhật câu hỏi #${form.id} thành công!`,
        timer: 1800,
        showConfirmButton: false
      });
    } else {
      await apiClient.post('/questions', payload);
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Đã tạo câu hỏi mới vào ngân hàng đề thi!',
        timer: 1800,
        showConfirmButton: false
      });
    }

    closeModal();
    fetchQuestions();
  } catch (err) {
    modalErrorMessage.value = err.message || 'Lỗi khi lưu câu hỏi';
  } finally {
    isSubmitting.value = false;
  }
};

// 6. XÓA CÂU HỎI - XỬ LÝ NGHIÊM NGẶT RÀNG BUỘC KHÓA NGOẠI
const handleDeleteQuestion = (q) => {
  Swal.fire({
    title: `Xác nhận xóa câu hỏi #${q.id}?`,
    html: `
      <div class="text-start">
        <p class="mb-2"><strong>Nội dung:</strong> ${q.content}</p>
        <p class="small text-danger mb-0">
          <i class="bi bi-exclamation-triangle-fill me-1"></i>
          Hành động này sẽ xóa vĩnh viễn câu hỏi khỏi cơ sở dữ liệu nếu câu hỏi chưa từng xuất hiện trong lịch sử thi.
        </p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Đồng ý xóa vĩnh viễn',
    cancelButtonText: 'Hủy thao tác'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await apiClient.delete(`/questions/${q.id}`);
        Swal.fire({
          icon: 'success',
          title: 'Đã xóa!',
          text: res.message || `Đã xóa câu hỏi #${q.id} thành công!`,
          timer: 1800,
          showConfirmButton: false
        });
        fetchQuestions();
      } catch (err) {
        // KIỂM TRA RÀNG BUỘC KHÓA NGOẠI: Bắt lỗi 409 hoặc mã lỗi FK
        const isFkError = err.statusCode === 409 || err.isForeignKeyConstraint || (err.message && err.message.includes('khóa ngoại'));
        
        if (isFkError) {
          Swal.fire({
            icon: 'error',
            title: 'VI PHẠM RÀNG BUỘC KHÓA NGOẠI!',
            html: `
              <div class="text-start">
                <div class="alert alert-danger py-2 px-3 mb-3 small">
                  <strong>Không thể xóa câu hỏi #${q.id}!</strong><br>
                  ${err.message || 'Câu hỏi này đang được liên kết trong lịch sử làm bài thi của học viên (Bảng exam_session_details).'}
                </div>
                <p class="small text-secondary mb-3">
                  Theo quy định toàn vẹn dữ liệu cơ sở dữ liệu, không thể xóa một câu hỏi đã có học viên làm bài thi trong quá khứ.
                </p>
                <div class="p-3 bg-light rounded-3 border small">
                  <div class="fw-bold text-primary mb-1">
                    <i class="bi bi-lightbulb-fill me-1"></i> Giải pháp đề xuất:
                  </div>
                  Bạn hãy sử dụng tính năng <strong>"Ẩn câu hỏi"</strong>. Câu hỏi sẽ ngừng xuất hiện trong các bài thi mới nhưng vẫn bảo toàn đầy đủ dữ liệu lịch sử thi cũ của thí sinh.
                </div>
              </div>
            `,
            showCancelButton: true,
            confirmButtonColor: '#ffc107',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<span class="text-dark fw-bold"><i class="bi bi-eye-slash-fill me-1"></i> Ẩn câu hỏi này ngay</span>',
            cancelButtonText: 'Đóng'
          }).then(async (actionRes) => {
            if (actionRes.isConfirmed) {
              await handleToggleActive(q);
            }
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Lỗi Khi Xóa',
            text: err.message || 'Không thể xóa câu hỏi'
          });
        }
      }
    }
  });
};

// 7. Bật / Tắt trạng thái hiển thị câu hỏi (Ẩn / Hiện)
const handleToggleActive = async (q) => {
  try {
    const res = await apiClient.patch(`/questions/${q.id}/toggle-active`);
    q.isActive = res.data?.isActive;
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
    Toast.fire({
      icon: 'success',
      title: res.message || (q.isActive ? 'Đã kích hoạt câu hỏi' : 'Đã ẩn câu hỏi')
    });
  } catch (err) {
    Swal.fire({
      icon: err.statusCode === 409 ? 'warning' : 'error',
      title: err.statusCode === 409 ? 'Không thể ẩn câu hỏi' : 'Lỗi',
      text: err.message || 'Không thể đổi trạng thái câu hỏi'
    });
  }
};

onMounted(() => {
  fetchChapters();
  fetchQuestions();
});
</script>

<template>
  <div class="container-fluid py-4 px-md-4">
    <!-- Header Page -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <!-- <nav aria-label="breadcrumb" class="mb-2">
          <ol class="breadcrumb small">
            <li class="breadcrumb-item">
              <router-link to="/admin/dashboard" class="text-secondary">Admin Dashboard</router-link>
            </li>
            <li class="breadcrumb-item active text-dark fw-semibold" aria-current="page">
              Quản lý câu hỏi 600 câu
            </li>
          </ol>
        </nav> -->
        <h2 class="fw-bolder text-dark mb-1">
          Quản Lý Ngân Hàng Câu Hỏi
        </h2>
        <p class="text-secondary small mb-0">
          Thêm mới, sửa, xóa, gắn cờ câu hỏi điểm liệt, upload hình ảnh sa hình và kiểm soát trạng thái hiển thị.
        </p>
      </div>

      <div>
        <button @click="openCreateModal" class="btn btn-primary px-4 py-2 shadow-sm fw-semibold">
          <i class="bi bi-plus-circle-fill me-2"></i> Thêm câu hỏi mới
        </button>
      </div>
    </div>

    <!-- 1. BỘ LỌC VÀ TÌM KIẾM -->
    <div class="card border border-light-subtle shadow-sm rounded-4 p-3 mb-4 bg-white">
      <div class="row g-3 align-items-center">
        <!-- Tìm kiếm từ khóa -->
        <div class="col-12 col-md-4">
          <label class="form-label small fw-semibold text-secondary mb-1">Tìm kiếm nội dung:</label>
          <div class="input-group">
            <span class="input-group-text bg-light text-secondary border-end-0">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="searchKeyword"
              @input="handleSearchInput"
              type="text"
              class="form-control border-start-0 ps-0"
              placeholder="Nhập từ khóa câu hỏi..."
            />
            <button 
              v-if="searchKeyword" 
              @click="searchKeyword = ''; fetchQuestions();" 
              class="btn btn-outline-secondary border-start-0" 
              type="button"
            >
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>

        <!-- Lọc Chương -->
        <div class="col-12 col-sm-6 col-md-3">
          <label class="form-label small fw-semibold text-secondary mb-1">Chương lý thuyết:</label>
          <select v-model="filterChapter" class="form-select">
            <option value="">Vui lòng chọn chương</option>
            <option v-for="ch in chapters" :key="ch.id" :value="ch.id">
              {{ getChapterOptionLabel(ch) }}
            </option>
          </select>
        </div>

        <!-- Lọc Điểm liệt -->
        <div class="col-6 col-sm-3 col-md-2">
          <label class="form-label small fw-semibold text-secondary mb-1">Loại câu hỏi:</label>
          <select v-model="filterParalysis" class="form-select">
            <option value="all">Tất cả</option>
            <option value="1">Câu điểm liệt</option>
            <option value="0">Câu thường</option>
          </select>
        </div>

        <!-- Lọc Trạng thái Kích hoạt -->
        <div class="col-6 col-sm-3 col-md-2">
          <label class="form-label small fw-semibold text-secondary mb-1">Trạng thái:</label>
          <select v-model="filterActive" class="form-select">
            <option value="all">Tất cả</option>
            <option value="1">Đang kích hoạt</option>
            <option value="0">Đang ẩn</option>
          </select>
        </div>

        <!-- Nút tải lại -->
        <div class="col-12 col-md-1 d-flex align-items-end">
          <button 
            type="button" 
            class="btn btn-outline-secondary w-100" 
            @click="fetchQuestions" 
            title="Tải lại danh sách"
          >
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 2. BẢNG DANH SÁCH CÂU HỎI -->
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <h6 class="fw-bold text-dark">Đang tải danh sách câu hỏi...</h6>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="alert alert-danger rounded-4 p-4 text-center" role="alert">
      <i class="bi bi-exclamation-triangle-fill fs-3 mb-2 d-block"></i>
      <h5 class="fw-bold">Lỗi Khi Tải Câu Hỏi</h5>
      <p class="small mb-3">{{ errorMessage }}</p>
      <button @click="fetchQuestions" class="btn btn-sm btn-outline-danger px-3">Thử lại</button>
    </div>

    <!-- No chapter selected -->
    <div v-else-if="!filterChapter" class="card border border-light-subtle shadow-sm rounded-4 p-5 text-center bg-white">
      <i class="bi bi-info-circle display-3 text-primary mb-3"></i>
      <h4 class="fw-bolder text-dark mb-2">Vui lòng chọn chương</h4>
      <p class="text-secondary small mb-0">
        Chọn một chương từ danh sách để xem và quản lý câu hỏi tương ứng.
      </p>
    </div>

    <!-- Empty State -->
    <div v-else-if="questions.length === 0" class="card border border-light-subtle shadow-sm rounded-4 p-5 text-center bg-white">
      <i class="bi bi-inbox display-3 text-secondary mb-3"></i>
      <h4 class="fw-bolder text-dark mb-2">Không Tìm Thấy Câu Hỏi Nào</h4>
      <p class="text-secondary small mb-4">
        Không có câu hỏi nào khớp với các tiêu chí tìm kiếm và lọc hiện tại.
      </p>
      <div>
        <button @click="openCreateModal" class="btn btn-primary px-4 py-2">
          <i class="bi bi-plus-circle-fill me-1"></i> Thêm câu hỏi mới ngay
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <div v-else class="card border border-light-subtle shadow-sm rounded-4 bg-white overflow-hidden mb-4">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 admin-question-table">
          <thead class="table-light">
            <tr>
              <th scope="col" class="question-id-column ps-4 text-secondary small fw-bold text-center">#ID</th>
              <th scope="col" class="question-chapter-column text-secondary small fw-bold">CHƯƠNG</th>
              <th scope="col" class="question-content-column text-secondary small fw-bold">NỘI DUNG CÂU HỎI</th>
              <th scope="col" class="question-paralysis-column text-center text-secondary small fw-bold">ĐIỂM LIỆT</th>
              <th scope="col" class="question-answers-column text-center text-secondary small fw-bold">ĐÁP ÁN</th>
              <th scope="col" class="question-status-column text-center text-secondary small fw-bold">TRẠNG THÁI</th>
              <th scope="col" class="question-actions-column text-end pe-4 text-secondary small fw-bold">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="q in questions" :key="q.id">
              <!-- ID -->
              <td class="question-id-column ps-4 text-center fw-bold text-secondary">
                {{ q.id }}
              </td>

              <!-- Chương -->
              <td class="question-chapter-column">
                <span class="badge bg-light text-secondary border rounded-pill px-3 py-1 text-truncate">
                  Chương {{ q.chapterId }}
                </span>
                <div class="text-muted fs-xxs mt-1 question-chapter-title">
                  {{ q.chapterTitle }}
                </div>
              </td>

              <!-- Nội dung & Ảnh minh họa -->
              <td class="question-content-column">
                <div class="d-flex align-items-start gap-3">
                  <!-- Thumbnail ảnh minh họa nếu có -->
                  <div v-if="q.imageUrl" class="flex-shrink-0">
                    <img 
                      :src="resolveAssetUrl(q.imageUrl)" 
                      :alt="`Ảnh câu ${q.id}`" 
                      class="rounded border" 
                      style="width: 50px; height: 50px; object-fit: cover;"
                    />
                  </div>
                  <div class="flex-grow-1 question-content-copy">
                    <div class="fw-semibold text-dark text-truncate-2">
                      {{ q.content }}
                    </div>
                    <div v-if="q.explanation" class="text-secondary fs-xxs mt-1 question-explanation">
                      <i class="bi bi-lightbulb me-1 text-warning"></i>{{ q.explanation }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Điểm liệt -->
              <td class="question-paralysis-column text-center">
                <span 
                  v-if="q.isParalysis" 
                  class="badge bg-danger rounded-pill px-3 py-1"
                  title="Câu hỏi điểm liệt bắt buộc"
                >
                  <i class="bi bi-exclamation-octagon-fill me-1"></i>ĐIỂM LIỆT
                </span>
                <span v-else class="badge bg-light text-secondary border rounded-pill px-2 py-1">
                  Thường
                </span>
              </td>

              <!-- Số đáp án -->
              <td class="question-answers-column text-center">
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill">
                  {{ q.answers?.length || 0 }} phương án
                </span>
              </td>

              <!-- Trạng thái Kích hoạt / Ẩn -->
              <td class="question-status-column text-center">
                <button
                  type="button"
                  class="btn btn-sm py-1 px-2 rounded-pill"
                  :class="q.isActive ? 'btn-success-subtle text-success border border-success-subtle' : 'btn-light text-secondary border'"
                  @click="handleToggleActive(q)"
                  :title="q.isActive ? 'Bấm để ẩn câu hỏi' : 'Bấm để kích hoạt lại câu hỏi'"
                >
                  <i class="bi me-1" :class="q.isActive ? 'bi-check-circle-fill' : 'bi-eye-slash-fill'"></i>
                  {{ q.isActive ? 'Kích hoạt' : 'Đang ẩn' }}
                </button>
              </td>

              <!-- Thao tác Sửa / Xóa -->
              <td class="question-actions-column text-end pe-4">
                <div class="d-flex justify-content-end gap-2">
                  <button 
                    @click="openEditModal(q)" 
                    class="btn btn-sm btn-outline-primary px-2 py-1" 
                    title="Chỉnh sửa câu hỏi"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button 
                    @click="handleDeleteQuestion(q)" 
                    class="btn btn-sm btn-outline-danger px-2 py-1" 
                    title="Xóa câu hỏi khỏi ngân hàng"
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
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 p-3 border-top bg-light">
        <div class="text-secondary small">
          Hiển thị 
          <strong class="text-dark">
            {{ (pagination.page - 1) * pagination.limit + (questions.length > 0 ? 1 : 0) }}
          </strong> 
          - 
          <strong class="text-dark">
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
          </strong> 
          trên tổng số 
          <strong class="text-dark">{{ pagination.total }}</strong> câu hỏi
        </div>

        <nav v-if="pagination.totalPages > 1" aria-label="Page navigation">
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: pagination.page === 1 }">
              <button class="page-link" @click="changePage(pagination.page - 1)" aria-label="Previous">
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
              <button class="page-link" @click="changePage(pagination.page + 1)" aria-label="Next">
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- 3. MODAL THÊM / SỬA CÂU HỎI -->
    <div 
      v-if="showModal" 
      class="modal fade show d-block modal-backdrop-blur" 
      tabindex="-1" 
      role="dialog"
    >
      <div class="modal-dialog modal-lg modal-dialog-scrollable" role="document">
        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <!-- Modal Header -->
          <div class="modal-header bg-light border-bottom px-4 py-3">
            <h5 class="modal-title fw-bold text-dark">
              <i class="bi me-2" :class="isEditing ? 'bi-pencil-square text-primary' : 'bi-plus-circle-fill text-success'"></i>
              {{ isEditing ? `Chỉnh Sửa Câu Hỏi #${form.id}` : 'Thêm Câu Hỏi Mới Vào Ngân Hàng' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>

          <!-- Modal Body Form -->
          <div class="modal-body p-4">
            <!-- Modal Error Alert -->
            <div v-if="modalErrorMessage" class="alert alert-danger d-flex align-items-center gap-2 small py-2 px-3 rounded-3 mb-3">
              <i class="bi bi-exclamation-circle-fill fs-5 flex-shrink-0"></i>
              <div>{{ modalErrorMessage }}</div>
            </div>

            <form @submit.prevent="handleSaveQuestion">
              <div class="row g-3 mb-3">
                <!-- Chọn Chương -->
                <div class="col-12 col-md-8">
                  <label class="form-label small fw-bold text-dark">
                    Chương lý thuyết <span class="text-danger">*</span>
                  </label>
                  <select v-model="form.chapterId" @change="rememberSelectedChapter" class="form-select" required>
                    <option value="" disabled>-- Chọn chương thuộc 600 câu --</option>
                    <option v-for="ch in chapters" :key="ch.id" :value="ch.id">
                      {{ getChapterOptionLabel(ch) }}
                    </option>
                  </select>
                </div>

                <!-- Cờ Điểm liệt -->
                <div class="col-12 col-md-4 d-flex align-items-end">
                  <div class="form-check form-switch p-2 rounded-3 bg-light border w-100 ps-5">
                    <input 
                      v-model="form.isParalysis" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="isParalysisSwitch"
                    />
                    <label class="form-check-label fw-bold small text-danger" for="isParalysisSwitch">
                      <i class="bi bi-exclamation-octagon-fill me-1"></i> Câu điểm liệt
                    </label>
                  </div>
                </div>
              </div>

              <!-- Nội dung câu hỏi -->
              <div class="mb-3">
                <label class="form-label small fw-bold text-dark">
                  Nội dung câu hỏi <span class="text-danger">*</span>
                </label>
                <textarea 
                  v-model="form.content" 
                  class="form-control" 
                  rows="3" 
                  placeholder="Nhập nội dung đầy đủ của câu hỏi thi sát hạch..."
                  required
                ></textarea>
              </div>

              <!-- Tải ảnh minh họa / sa hình -->
              <div class="mb-3">
                <label class="form-label small fw-bold text-dark">
                  Hình ảnh minh họa / Sa hình (nếu có):
                </label>
                
                <div class="row g-2 align-items-center">
                  <div class="col-12 col-sm-8">
                    <input 
                      type="file" 
                      @change="handleImageFileChange" 
                      class="form-control form-control-sm" 
                      accept="image/jpeg,image/png,image/webp,image/gif"
                    />
                    <div class="form-text fs-xxs">Chấp nhận JPG, PNG, WEBP, GIF tối đa 5MB.</div>
                  </div>

                  <div class="col-12 col-sm-4 text-sm-end" v-if="imagePreviewUrl">
                    <button 
                      type="button" 
                      @click="removeImage" 
                      class="btn btn-sm btn-outline-danger"
                    >
                      <i class="bi bi-trash me-1"></i> Xóa ảnh
                    </button>
                  </div>
                </div>

                <!-- Preview ảnh -->
                <div v-if="imagePreviewUrl" class="mt-2 text-center p-2 bg-light rounded-3 border">
                  <img 
                    :src="imagePreviewUrl" 
                    alt="Xem trước ảnh minh họa" 
                    class="img-fluid rounded border shadow-sm"
                    style="max-height: 200px; object-fit: contain;"
                  />
                </div>
              </div>

              <!-- Danh sách các phương án trả lời -->
              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <label class="form-label small fw-bold text-dark mb-0">
                    Các phương án trả lời <span class="text-danger">*</span>
                    <span class="text-secondary fw-normal fs-xxs ms-1">
                      (Tích chọn nút tròn để chỉ định DUY NHẤT 1 đáp án đúng)
                    </span>
                  </label>
                  <button 
                    type="button" 
                    @click="addAnswerOption" 
                    class="btn btn-sm btn-outline-primary py-1 px-2 fs-xs fw-semibold"
                  >
                    <i class="bi bi-plus-lg me-1"></i> Thêm đáp án
                  </button>
                </div>

                <div class="d-flex flex-column gap-2">
                  <div 
                    v-for="(ans, idx) in form.answers" 
                    :key="idx" 
                    class="input-group p-1 rounded-3 border"
                    :class="ans.isCorrect ? 'border-success bg-success-subtle' : 'bg-white'"
                  >
                    <!-- Radio chọn đáp án đúng -->
                    <span class="input-group-text bg-transparent border-0 pe-2">
                      <input 
                        type="radio" 
                        name="correctAnswerGroup" 
                        :checked="ans.isCorrect"
                        @change="setCorrectAnswer(idx)"
                        class="form-check-input mt-0"
                        title="Đánh dấu đây là đáp án đúng"
                        required
                      />
                    </span>

                    <span class="input-group-text bg-transparent border-0 px-1 fw-bold text-secondary">
                      {{ idx + 1 }}.
                    </span>

                    <!-- Input nội dung đáp án -->
                    <input 
                      v-model="ans.answerText" 
                      type="text" 
                      class="form-control border-0 bg-transparent"
                      :placeholder="`Nhập nội dung phương án ${idx + 1}...`"
                      required
                    />

                    <!-- Badge đúng / Nút xóa -->
                    <span class="input-group-text bg-transparent border-0 ps-1">
                      <span v-if="ans.isCorrect" class="badge bg-success me-2 fs-xxs">Đúng</span>
                      <button 
                        v-if="form.answers.length > 2"
                        type="button" 
                        @click="removeAnswerOption(idx)" 
                        class="btn btn-sm btn-link text-danger p-0 border-0" 
                        title="Xóa phương án này"
                      >
                        <i class="bi bi-x-circle-fill"></i>
                      </button>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Lời giải thích & mẹo nhớ luật -->
              <div class="mb-3">
                <label class="form-label small fw-bold text-dark">
                  Lời giải thích đáp án & Mẹo ghi nhớ:
                </label>
                <textarea 
                  v-model="form.explanation" 
                  class="form-control" 
                  rows="2" 
                  placeholder="Nhập giải thích quy chuẩn, điều luật hoặc mẹo giúp học viên nhớ nhanh..."
                ></textarea>
              </div>

              <!-- Trạng thái kích hoạt -->
              <div class="form-check mb-4">
                <input 
                  v-model="form.isActive" 
                  class="form-check-input" 
                  type="checkbox" 
                  id="isActiveCheck"
                />
                <label class="form-check-label small fw-semibold text-dark" for="isActiveCheck">
                  Kích hoạt câu hỏi này ngay (Được đưa vào ngân hàng sinh đề thi sát hạch)
                </label>
              </div>

              <!-- Modal Action Buttons -->
              <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                <button type="button" class="btn btn-secondary px-4 py-2" @click="closeModal">
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  class="btn btn-primary px-4 py-2 fw-semibold" 
                  :disabled="isSubmitting"
                >
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
                  <i v-else class="bi bi-save2 me-1"></i>
                  {{ isEditing ? 'Lưu Cập Nhật' : 'Tạo Câu Hỏi' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
