<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '../../services/api';
import Swal from 'sweetalert2';

const router = useRouter();

const chapters = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');
const searchKeyword = ref('');

const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);

const form = reactive({
  id: null,
  orderNumber: 1,
  title: '',
  description: ''
});

// Thống kê tổng quan
const totalChapters = computed(() => chapters.value.length);
const totalQuestions = computed(() => {
  return chapters.value.reduce((sum, c) => sum + (Number(c.totalQuestions) || 0), 0);
});
const totalParalysis = computed(() => {
  return chapters.value.reduce((sum, c) => sum + (Number(c.paralysisQuestions) || 0), 0);
});
const duplicateOrderChapter = computed(() => chapters.value.find(chapter =>
  Number(chapter.orderNumber) === Number(form.orderNumber) && chapter.id !== form.id
));
const orderNumberError = computed(() => {
  const orderNumber = Number(form.orderNumber);
  if (!Number.isInteger(orderNumber) || orderNumber < 1) {
    return 'Thứ tự phải là số nguyên lớn hơn 0.';
  }
  if (duplicateOrderChapter.value) {
    return `Thứ tự này đã được dùng cho "${duplicateOrderChapter.value.title}". Vui lòng nhập thứ tự mới.`;
  }
  return '';
});

// Danh sách sau khi tìm kiếm
const filteredChapters = computed(() => {
  if (!searchKeyword.value.trim()) return chapters.value;
  const kw = searchKeyword.value.toLowerCase().trim();
  return chapters.value.filter(c => 
    (c.title && c.title.toLowerCase().includes(kw)) ||
    (c.description && c.description.toLowerCase().includes(kw)) ||
    String(c.orderNumber).includes(kw)
  );
});

// Tải danh sách chương từ Backend
const fetchChapters = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const res = await apiClient.get('/admin/chapters');
    if (res.success && res.data?.chapters) {
      chapters.value = res.data.chapters;
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải danh sách chương lý thuyết';
  } finally {
    isLoading.value = false;
  }
};

// Mở modal thêm mới
const openCreateModal = () => {
  isEditing.value = false;
  form.id = null;
  form.orderNumber = Math.max(0, ...chapters.value.map(chapter => Number(chapter.orderNumber) || 0)) + 1;
  form.title = '';
  form.description = '';
  showModal.value = true;
};

// Mở modal sửa
const openEditModal = (chapter) => {
  isEditing.value = true;
  form.id = chapter.id;
  form.orderNumber = chapter.orderNumber || 1;
  form.title = chapter.title || '';
  form.description = chapter.description || '';
  showModal.value = true;
};

// Đóng modal
const closeModal = () => {
  showModal.value = false;
};

// Lưu thông tin chương (Thêm mới hoặc Sửa)
const handleSaveChapter = async () => {
  if (orderNumberError.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Thứ tự chương không hợp lệ',
      text: orderNumberError.value
    });
    return;
  }

  if (!form.title.trim()) {
    Swal.fire({
      icon: 'warning',
      title: 'Thiếu thông tin',
      text: 'Vui lòng nhập tên chương lý thuyết.'
    });
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = {
      orderNumber: Number(form.orderNumber) || 1,
      title: form.title.trim(),
      description: form.description.trim()
    };

    if (isEditing.value) {
      const res = await apiClient.put(`/admin/chapters/${form.id}`, payload);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Đã cập nhật thông tin chương lý thuyết!',
          timer: 1500,
          showConfirmButton: false
        });
        closeModal();
        await fetchChapters();
      }
    } else {
      const res = await apiClient.post('/admin/chapters', payload);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Đã thêm mới chương lý thuyết thành công!',
          timer: 1500,
          showConfirmButton: false
        });
        closeModal();
        await fetchChapters();
      }
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: err.message || 'Có lỗi xảy ra khi lưu chương lý thuyết'
    });
  } finally {
    isSubmitting.value = false;
  }
};

// Xóa chương lý thuyết
const handleDeleteChapter = async (chapter) => {
  const result = await Swal.fire({
    title: `Xác nhận xóa?`,
    html: `Bạn có chắc chắn muốn xóa <strong>${chapter.title}</strong>?<br><span class="text-muted small">Lưu ý: Chỉ có thể xóa chương không có câu hỏi nào trực thuộc.</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Xóa ngay',
    cancelButtonText: 'Hủy'
  });

  if (result.isConfirmed) {
    try {
      const res = await apiClient.delete(`/admin/chapters/${chapter.id}`);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Đã xóa',
          text: 'Chương lý thuyết đã được xóa thành công.',
          timer: 1500,
          showConfirmButton: false
        });
        await fetchChapters();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Không thể xóa',
        text: err.message || 'Chương đang chứa câu hỏi hoặc gặp lỗi khi xóa.'
      });
    }
  }
};

// Chuyển nhanh sang xem danh sách câu hỏi của chương
const viewChapterQuestions = (chapterId) => {
  router.push({
    path: '/admin/questions',
    query: { chapterId: chapterId }
  });
};

onMounted(() => {
  fetchChapters();
});
</script>

<template>
  <div class="admin-chapters-page p-3 p-lg-4">
    <!-- Top Header Banner -->
    <div class="card border-0 shadow-sm rounded-4 mb-4 bg-white p-4">
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <!-- <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-pill fw-semibold fs-xxs">
              <i class="bi bi-journal-bookmark-fill me-1"></i>HỆ THỐNG LÝ THUYẾT BỘ GTVT
            </span>
          </div> -->
          <h3 class="fw-bolder text-dark mb-1">Quản Lý Chương Lý Thuyết</h3>
          <p class="text-secondary small mb-0">
            Quản trị các chương học trong ngân hàng 600 câu hỏi, cấu trúc nội dung và ma trận sát hạch.
          </p>
        </div>

        <button 
          type="button" 
          class="btn btn-primary px-3 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2 flex-shrink-0"
          @click="openCreateModal"
        >
          <i class="bi bi-plus-circle-fill"></i>
          <span class="fw-bold">Thêm chương mới</span>
        </button>
      </div>
    </div>

    <!-- KPI Statistics Cards -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-sm-6 col-lg-4">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
          <div class="d-flex align-items-center gap-3">
            <div class="rounded-3 bg-primary bg-opacity-10 text-primary p-3 d-flex align-items-center justify-content-center" style="width:52px;height:52px;">
              <i class="bi bi-book-half fs-4"></i>
            </div>
            <div>
              <div class="text-secondary fs-xs fw-semibold">Tổng số chương</div>
              <h4 class="fw-bolder text-dark mb-0">{{ totalChapters }} chương</h4>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-4">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
          <div class="d-flex align-items-center gap-3">
            <div class="rounded-3 bg-success bg-opacity-10 text-success p-3 d-flex align-items-center justify-content-center" style="width:52px;height:52px;">
              <i class="bi bi-question-diamond-fill fs-4"></i>
            </div>
            <div>
              <div class="text-secondary fs-xs fw-semibold">Tổng câu hỏi trực thuộc</div>
              <h4 class="fw-bolder text-dark mb-0">{{ totalQuestions }} câu</h4>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-4">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
          <div class="d-flex align-items-center gap-3">
            <div class="rounded-3 bg-danger bg-opacity-10 text-danger p-3 d-flex align-items-center justify-content-center" style="width:52px;height:52px;">
              <i class="bi bi-lightning-fill fs-4"></i>
            </div>
            <div>
              <div class="text-secondary fs-xs fw-semibold">Câu hỏi điểm liệt</div>
              <h4 class="fw-bolder text-dark mb-0">{{ totalParalysis }} câu</h4>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="card border-0 shadow-sm rounded-4 mb-4 bg-white p-3">
      <div class="row g-2 align-items-center">
        <div class="col-12 col-md-6 col-lg-5">
          <div class="input-group">
            <span class="input-group-text bg-light border-end-0 text-muted">
              <i class="bi bi-search"></i>
            </span>
            <input 
              v-model="searchKeyword" 
              type="text" 
              class="form-control bg-light border-start-0" 
              placeholder="Tìm kiếm chương theo tên hoặc mô tả..."
            />
            <button 
              v-if="searchKeyword" 
              class="btn btn-light border border-start-0 text-muted" 
              type="button" 
              @click="searchKeyword = ''"
            >
              <i class="bi bi-x-circle"></i>
            </button>
          </div>
        </div>
        <div class="col-12 col-md-6 col-lg-7 text-md-end text-muted small">
          Hiển thị <strong>{{ filteredChapters.length }}</strong> / {{ totalChapters }} chương lý thuyết
        </div>
      </div>
    </div>

    <!-- Table Content Area -->
    <div class="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoading" class="p-5 text-center">
        <div class="spinner-border text-primary mb-3" role="status"></div>
        <div class="text-muted small">Đang tải danh sách chương lý thuyết...</div>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="p-5 text-center">
        <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
        <h5 class="fw-bold text-dark mb-2">Không thể tải dữ liệu</h5>
        <p class="text-secondary small mb-3">{{ errorMessage }}</p>
        <button class="btn btn-outline-primary btn-sm px-3" @click="fetchChapters">
          <i class="bi bi-arrow-clockwise me-1"></i>Thử lại
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredChapters.length === 0" class="p-5 text-center">
        <div class="rounded-circle bg-light d-inline-flex p-3 mb-3 text-muted">
          <i class="bi bi-inbox fs-2"></i>
        </div>
        <h5 class="fw-bold text-dark mb-1">Không tìm thấy chương nào</h5>
        <p class="text-secondary small mb-3">Không có chương lý thuyết nào phù hợp với từ khóa tìm kiếm.</p>
        <button class="btn btn-outline-secondary btn-sm" @click="searchKeyword = ''">
          Xóa bộ lọc tìm kiếm
        </button>
      </div>

      <!-- Data Table -->
      <div v-else class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light border-bottom">
            <tr>
              <th scope="col" class="py-3 px-3 text-center" style="width: 70px;">STT</th>
              <th scope="col" class="py-3 px-3" style="min-width: 260px;">Tên chương</th>
              <th scope="col" class="py-3 px-3 d-none d-md-table-cell" style="min-width: 300px;">Mô tả nội dung</th>
              <th scope="col" class="py-3 px-3 text-center" style="width: 120px;">Số câu hỏi</th>
              <th scope="col" class="py-3 px-3 text-center" style="width: 120px;">Điểm liệt</th>
              <th scope="col" class="py-3 px-3 text-end" style="width: 150px;">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filteredChapters" :key="c.id">
              <!-- STT / Order -->
              <td class="text-center fw-bold text-secondary">
                <span class="badge bg-light text-dark border rounded-pill px-2.5 py-1.5 fs-xxs">
                  #{{ c.orderNumber }}
                </span>
              </td>

              <!-- Tên chương -->
              <td>
                <div class="fw-bold text-dark mb-0.5">
                  {{ c.title }}
                </div>
                <div class="text-muted d-md-none fs-xs mt-1">
                  {{ c.description }}
                </div>
              </td>

              <!-- Mô tả -->
              <td class="d-none d-md-table-cell text-secondary small">
                {{ c.description || 'Chưa có mô tả chi tiết' }}
              </td>

              <!-- Số câu hỏi -->
              <td class="text-center">
                <button 
                  type="button" 
                  class="btn btn-sm btn-outline-primary px-2.5 py-1 rounded-pill fw-bold fs-xxs"
                  title="Nhấn để xem các câu hỏi thuộc chương này"
                  @click="viewChapterQuestions(c.id)"
                >
                  <i class="bi bi-question-circle me-1"></i>{{ c.totalQuestions }} câu
                </button>
              </td>

              <!-- Câu điểm liệt -->
              <td class="text-center">
                <span 
                  v-if="c.paralysisQuestions > 0" 
                  class="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1.5 rounded-pill fw-bold fs-xxs"
                >
                  <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ c.paralysisQuestions }} câu
                </span>
                <span v-else class="badge bg-light text-muted border px-2 py-1 rounded-pill fs-xxs">
                  0
                </span>
              </td>

              <!-- Thao tác Sửa / Xóa -->
              <td class="text-end px-3">
                <div class="d-inline-flex gap-1">
                  <button 
                    type="button" 
                    class="btn btn-sm btn-light border text-primary rounded-2 px-2 py-1"
                    title="Chỉnh sửa chương"
                    @click="openEditModal(c)"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-sm btn-light border text-danger rounded-2 px-2 py-1"
                    title="Xóa chương này"
                    @click="handleDeleteChapter(c)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Thêm / Chỉnh Sửa Chương -->
    <div 
      v-if="showModal" 
      class="modal fade show d-block" 
      tabindex="-1" 
      style="background-color: rgba(15, 23, 42, 0.55); backdrop-filter: blur(2px);"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div class="modal-header bg-light px-4 py-3 border-bottom">
            <h5 class="modal-title fw-bold text-dark">
              <i class="bi me-2 text-primary" :class="isEditing ? 'bi-pencil-square' : 'bi-plus-circle-fill'"></i>
              {{ isEditing ? 'Chỉnh Sửa Chương Lý Thuyết' : 'Thêm Mới Chương Lý Thuyết' }}
            </h5>
            <button type="button" class="btn-close" aria-label="Close" @click="closeModal"></button>
          </div>

          <form @submit.prevent="handleSaveChapter">
            <div class="modal-body p-4">
              <div class="row g-3">
                <!-- Số thứ tự -->
                <div class="col-12 col-sm-4">
                  <label class="form-label fw-semibold text-dark small">
                    Thứ tự hiển thị <span class="text-danger">*</span>
                  </label>
                  <input 
                    v-model.number="form.orderNumber" 
                    type="number" 
                    class="form-control rounded-3" 
                    :class="{ 'is-invalid': orderNumberError }"
                    min="1" 
                    required 
                    placeholder="VD: 1, 2, 3..."
                  />
                  <div v-if="orderNumberError" class="invalid-feedback">{{ orderNumberError }}</div>
                  <div v-else class="form-text fs-xxs">Thứ tự sắp xếp chương trong toàn hệ thống.</div>
                </div>

                <!-- Tên chương -->
                <div class="col-12 col-sm-8">
                  <label class="form-label fw-semibold text-dark small">
                    Tên chương lý thuyết <span class="text-danger">*</span>
                  </label>
                  <input 
                    v-model="form.title" 
                    type="text" 
                    class="form-control rounded-3" 
                    required 
                    placeholder="VD: Chương I: Khái niệm và quy tắc giao thông đường bộ"
                  />
                </div>

                <!-- Mô tả chi tiết -->
                <div class="col-12">
                  <label class="form-label fw-semibold text-dark small">
                    Mô tả tóm tắt nội dung chương
                  </label>
                  <textarea 
                    v-model="form.description" 
                    class="form-control rounded-3" 
                    rows="4" 
                    placeholder="Nhập phạm vi kiến thức, mục tiêu học tập hoặc quy chuẩn của chương này..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div class="modal-footer bg-light px-4 py-3 border-top">
              <button type="button" class="btn btn-outline-secondary px-4 rounded-3" @click="closeModal">
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                class="btn btn-primary px-4 rounded-3 fw-bold d-flex align-items-center gap-2"
                :disabled="isSubmitting || Boolean(orderNumberError)"
              >
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status"></span>
                <i v-else class="bi bi-check-circle-fill"></i>
                <span>{{ isEditing ? 'Lưu Thay Đổi' : 'Tạo Chương Mới' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-chapters-page {
  background-color: #f8fafc;
  min-height: calc(100vh - 60px);
}
</style>
