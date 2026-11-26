<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import apiClient, { resolveAssetUrl } from '../../services/api';
import Swal from 'sweetalert2';

const signs = ref([]);
const categories = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);

const pagination = reactive({
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 1
});

const filterCategory = ref('all');
const searchKeyword = ref('');

const imageFile = ref(null);
const imagePreviewUrl = ref('');
const failedImages = ref(new Set());
const previewError = ref(false);

const handleImageError = (id) => {
  failedImages.value.add(id);
};

const form = reactive({
  id: null,
  categoryId: '',
  signCode: '',
  name: '',
  description: '',
  imageUrl: ''
});

const fetchCategories = async () => {
  try {
    const res = await apiClient.get('/admin/signs/categories');
    if (res.success && Array.isArray(res.data?.categories)) {
      categories.value = res.data.categories;
      if (!form.categoryId && categories.value.length > 0) {
        form.categoryId = categories.value[0].id;
      }
    }
  } catch (err) {
    console.error('Không thể tải nhóm biển báo:', err);
  }
};

const fetchSigns = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      categoryId: filterCategory.value === 'all' ? '' : filterCategory.value,
      keyword: searchKeyword.value.trim()
    };

    const res = await apiClient.get('/admin/signs', { params });
    if (res.success && res.data) {
      signs.value = res.data.signs || [];
      pagination.total = res.data.total || 0;
      pagination.totalPages = res.data.totalPages || 1;
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải danh sách biển báo';
  } finally {
    isLoading.value = false;
  }
};

const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.page) {
    pagination.page = newPage;
    fetchSigns();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

watch([filterCategory], () => {
  pagination.page = 1;
  fetchSigns();
});

let searchTimeout = null;
const handleSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.page = 1;
    fetchSigns();
  }, 350);
};

const resetForm = () => {
  previewError.value = false;
  form.id = null;
  form.categoryId = categories.value[0]?.id || '';
  form.signCode = '';
  form.name = '';
  form.description = '';
  form.imageUrl = '';
  imageFile.value = null;
  imagePreviewUrl.value = '';
};

const openCreateModal = () => {
  isEditing.value = false;
  resetForm();
  showModal.value = true;
};

const openEditModal = (sign) => {
  previewError.value = false;
  isEditing.value = true;
  form.id = sign.id;
  form.categoryId = sign.categoryId;
  form.signCode = sign.signCode;
  form.name = sign.name;
  form.description = sign.description || '';
  form.imageUrl = sign.imageUrl || '';
  imageFile.value = null;
  imagePreviewUrl.value = sign.imageUrl || '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
};

const handleImageFileChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({
      icon: 'warning',
      title: 'Tệp quá lớn',
      text: 'Kích thước tệp ảnh không được vượt quá 5MB'
    });
    event.target.value = '';
    return;
  }

  imageFile.value = file;

  const reader = new FileReader();
  reader.onload = () => {
    imagePreviewUrl.value = reader.result;
  };
  reader.readAsDataURL(file);
};

const removeImage = () => {
  previewError.value = false;
  imageFile.value = null;
  imagePreviewUrl.value = '';
  form.imageUrl = '';
};

const handleSaveSign = async () => {
  if (!form.categoryId) {
    Swal.fire({ icon: 'warning', title: 'Thiếu dữ liệu', text: 'Vui lòng chọn nhóm biển báo' });
    return;
  }
  if (!form.signCode.trim()) {
    Swal.fire({ icon: 'warning', title: 'Thiếu dữ liệu', text: 'Vui lòng nhập mã biển báo' });
    return;
  }
  if (!form.name.trim()) {
    Swal.fire({ icon: 'warning', title: 'Thiếu dữ liệu', text: 'Vui lòng nhập tên biển báo' });
    return;
  }

  isSubmitting.value = true;
  try {
    let finalImageUrl = form.imageUrl || null;
    if (imageFile.value) {
      const formData = new FormData();
      formData.append('image', imageFile.value);

      const uploadRes = await apiClient.post('/admin/signs/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadRes.success && uploadRes.data?.imageUrl) {
        finalImageUrl = uploadRes.data.imageUrl;
      }
    }

    const payload = {
      categoryId: Number(form.categoryId),
      signCode: form.signCode.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      imageUrl: finalImageUrl || null
    };

    if (isEditing.value) {
      await apiClient.put(`/admin/signs/${form.id}`, payload);
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Đã cập nhật biển báo',
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      await apiClient.post('/admin/signs', payload);
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Đã thêm biển báo mới',
        timer: 1500,
        showConfirmButton: false
      });
    }

    showModal.value = false;
    pagination.page = 1;
    fetchSigns();
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi khi lưu',
      text: err.message || 'Không thể lưu biển báo'
    });
  } finally {
    isSubmitting.value = false;
  }
};

const handleDeleteSign = (sign) => {
  Swal.fire({
    title: `Xóa biển báo ${sign.signCode}?`,
    html: `<div class="text-start"><p class="mb-2"><strong>Tên:</strong> ${sign.name}</p><p class="text-secondary small mb-0">Hành động này sẽ xóa dữ liệu biển báo khỏi hệ thống.</p></div>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/admin/signs/${sign.id}`);
        Swal.fire({
          icon: 'success',
          title: 'Đã xóa',
          text: 'Biển báo đã được xóa khỏi hệ thống',
          timer: 1500,
          showConfirmButton: false
        });
        fetchSigns();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: err.message || 'Không thể xóa biển báo'
        });
      }
    }
  });
};

onMounted(async () => {
  await fetchCategories();
  await fetchSigns();
});
</script>

<template>
  <div class="container-fluid py-4 px-md-4">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <h2 class="fw-bolder text-dark mb-1">Quản Lý Biển Báo Giao Thông</h2>
        <p class="text-secondary small mb-0">
          Thêm, sửa, xóa và quản lý các biển báo theo các nhóm chuẩn QCVN 41:2019.
        </p>
      </div>

      <button @click="openCreateModal" class="btn btn-primary px-4 py-2 shadow-sm fw-semibold">
        <i class="bi bi-plus-circle-fill me-2"></i> Thêm biển báo mới
      </button>
    </div>

    <div class="card border border-light-subtle shadow-sm rounded-4 p-3 mb-4 bg-white">
      <div class="row g-3 align-items-end">
        <div class="col-12 col-md-7">
          <label class="form-label small fw-semibold text-secondary mb-1">Tìm kiếm:</label>
          <div class="input-group">
            <span class="input-group-text bg-light text-secondary border-end-0">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="searchKeyword"
              @input="handleSearchInput"
              type="text"
              class="form-control border-start-0 ps-0"
              placeholder="Nhập mã biển hoặc tên biển báo..."
            />
          </div>
        </div>

        <div class="col-12 col-md-5">
          <label class="form-label small fw-semibold text-secondary mb-1">Nhóm biển báo:</label>
          <select v-model="filterCategory" class="form-select">
            <option value="all">Tất cả nhóm</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <h6 class="fw-bold text-dark">Đang tải danh sách biển báo...</h6>
    </div>

    <div v-else-if="errorMessage" class="alert alert-danger rounded-4 p-4 text-center" role="alert">
      <i class="bi bi-exclamation-triangle-fill fs-3 mb-2 d-block"></i>
      <h5 class="fw-bold">Lỗi khi tải dữ liệu</h5>
      <p class="small mb-3">{{ errorMessage }}</p>
      <button @click="fetchSigns" class="btn btn-sm btn-outline-danger px-3">Thử lại</button>
    </div>

    <div v-else-if="signs.length === 0" class="card border border-light-subtle shadow-sm rounded-4 p-5 text-center bg-white">
      <i class="bi bi-signpost-split display-3 text-secondary mb-3"></i>
      <h4 class="fw-bolder text-dark mb-2">Không tìm thấy biển báo nào</h4>
      <p class="text-secondary small mb-0">Hãy thử đổi từ khóa hoặc thêm biển báo mới.</p>
    </div>

    <div v-else class="card border border-light-subtle shadow-sm rounded-4 bg-white overflow-hidden mb-4">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th class="ps-4 text-secondary small fw-bold">#ID</th>
              <th class="text-secondary small fw-bold">NHÓM</th>
              <th class="text-secondary small fw-bold">MÃ BIỂN</th>
              <th class="text-secondary small fw-bold">TÊN BIỂN BÁO</th>
              <th class="text-secondary small fw-bold">HÌNH ẢNH</th>
              <th class="text-end pe-4 text-secondary small fw-bold">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sign in signs" :key="sign.id">
              <td class="ps-4 fw-bold text-secondary">{{ sign.id }}</td>
              <td>
                <span class="badge bg-light text-secondary border rounded-pill px-3 py-1">
                  {{ sign.categoryName || 'Không xác định' }}
                </span>
              </td>
              <td>
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-2 fw-bold">
                  {{ sign.signCode }}
                </span>
              </td>
              <td>
                <div class="fw-semibold text-dark">{{ sign.name }}</div>
                <div class="small text-secondary text-truncate" style="max-width: 400px;">
                  {{ sign.description || 'Chưa có mô tả' }}
                </div>
              </td>
              <td>
                <div v-if="sign.imageUrl" class="d-flex align-items-center">
                  <img :src="resolveAssetUrl(sign.imageUrl)" alt="Biển báo" class="rounded border" style="width: 52px; height: 52px; object-fit: cover;" />
                </div>
                <span v-else class="text-secondary small">Không có ảnh</span>
              </td>
              <td class="text-end pe-4">
                <div class="d-flex justify-content-end gap-2">
                  <button @click="openEditModal(sign)" class="btn btn-sm btn-outline-primary px-3">
                    <i class="bi bi-pencil-square me-1"></i> Sửa
                  </button>
                  <button @click="handleDeleteSign(sign)" class="btn btn-sm btn-outline-danger px-3">
                    <i class="bi bi-trash3 me-1"></i> Xóa
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="d-flex justify-content-between align-items-center p-3 border-top bg-light-subtle">
        <div class="small text-secondary">
          Hiển thị {{ signs.length }} / {{ pagination.total }} biển báo
        </div>
        <nav v-if="pagination.totalPages > 1" aria-label="Phân trang biển báo">
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: pagination.page === 1 }">
              <button class="page-link" @click="changePage(pagination.page - 1)">Trước</button>
            </li>
            <li v-for="page in pagination.totalPages" :key="page" class="page-item" :class="{ active: page === pagination.page }">
              <button class="page-link" @click="changePage(page)">{{ page }}</button>
            </li>
            <li class="page-item" :class="{ disabled: pagination.page === pagination.totalPages }">
              <button class="page-link" @click="changePage(pagination.page + 1)">Sau</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>

  <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(15, 23, 42, 0.45);">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg rounded-4">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold text-dark">
            {{ isEditing ? 'Cập nhật biển báo' : 'Thêm biển báo mới' }}
          </h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <div class="modal-body p-4">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label small fw-semibold text-secondary">Nhóm biển báo</label>
              <select v-model="form.categoryId" class="form-select">
                <option value="">-- Chọn nhóm biển báo --</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label small fw-semibold text-secondary">Mã biển báo</label>
              <input v-model="form.signCode" type="text" class="form-control" placeholder="VD: P.101" />
            </div>

            <div class="col-12">
              <label class="form-label small fw-semibold text-secondary">Tên biển báo</label>
              <input v-model="form.name" type="text" class="form-control" placeholder="Nhập tên biển báo..." />
            </div>

            <div class="col-12">
              <label class="form-label small fw-semibold text-secondary">Mô tả / ý nghĩa</label>
              <textarea v-model="form.description" rows="4" class="form-control" placeholder="Nhập mô tả, ý nghĩa hoặc quy cách áp dụng của biển báo..."></textarea>
            </div>

            <div class="col-12">
              <label class="form-label small fw-semibold text-secondary">Hình ảnh biển báo</label>
              <input type="file" accept="image/*" class="form-control" @change="handleImageFileChange" />

              <div v-if="imagePreviewUrl || form.imageUrl" class="mt-3 position-relative d-inline-block">
                <img
                  :src="resolveAssetUrl(imagePreviewUrl || form.imageUrl)"
                  alt="Preview biển báo"
                  class="rounded border border-light-subtle"
                  style="max-width: 200px; max-height: 160px; object-fit: cover;"
                />
                <button
                  type="button"
                  class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                  @click="removeImage"
                  title="Xóa ảnh"
                >
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>

              <p class="small text-secondary mt-2 mb-0">Chấp nhận ảnh JPG, PNG, WEBP, GIF. Tối đa 5MB.</p>
            </div>
          </div>
        </div>

        <div class="modal-footer border-0 pt-0">
          <button type="button" class="btn btn-outline-secondary" @click="closeModal">Hủy</button>
          <button type="button" class="btn btn-primary px-4" :disabled="isSubmitting" @click="handleSaveSign">
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ isSubmitting ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Thêm mới') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
