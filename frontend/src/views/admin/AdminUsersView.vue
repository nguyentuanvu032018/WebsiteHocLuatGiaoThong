<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '../../stores/auth';
import apiClient, { resolveAssetUrl } from '../../services/api';
import Swal from 'sweetalert2';

const authStore = useAuthStore();

// Trạng thái dữ liệu
const users = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');

// Phân trang
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
});

// Bộ lọc
const filterRole = ref('all'); // 'all', 'student', 'admin'
const filterActive = ref('all'); // 'all', '1', '0'
const searchKeyword = ref('');

// Modal phân quyền vai trò
const showRoleModal = ref(false);
const selectedUser = ref(null);
const newRole = ref('student');
const isSubmittingRole = ref(false);

// Thống kê nhanh từ danh sách hiện tại
const totalUsers = computed(() => pagination.total);

// Lấy danh sách người dùng từ API
const fetchUsers = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      role: filterRole.value,
      isActive: filterActive.value,
      keyword: searchKeyword.value.trim()
    };

    const res = await apiClient.get('/users', { params });
    if (res.success && res.data) {
      users.value = res.data.users || [];
      pagination.total = res.data.total || 0;
      pagination.totalPages = res.data.totalPages || 1;
    }
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải danh sách tài khoản người dùng';
  } finally {
    isLoading.value = false;
  }
};

// Chuyển trang
const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.page) {
    pagination.page = newPage;
    fetchUsers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Theo dõi bộ lọc thay đổi
watch([filterRole, filterActive], () => {
  pagination.page = 1;
  fetchUsers();
});

// Tìm kiếm có debounce nhẹ
let searchTimeout = null;
const handleSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.page = 1;
    fetchUsers();
  }, 400);
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

// 1. KHÓA / MỞ KHÓA TÀI KHOẢN
const handleToggleLock = (u) => {
  if (u.id === authStore.user?.id) {
    Swal.fire({
      icon: 'warning',
      title: 'Không thể thực hiện',
      text: 'Bạn không thể tự khóa tài khoản của chính mình!'
    });
    return;
  }

  const isLocking = u.isActive;
  const actionText = isLocking ? 'khóa tài khoản' : 'mở khóa tài khoản';

  Swal.fire({
    title: `Xác nhận ${actionText}?`,
    html: `
      <div class="text-start">
        <p class="mb-1"><strong>Họ tên:</strong> ${u.fullName}</p>
        <p class="mb-2"><strong>Email:</strong> ${u.email}</p>
        <p class="small text-secondary mb-0">
          ${isLocking 
            ? 'Người dùng này sẽ bị từ chối đăng nhập vào hệ thống ngay lập tức.' 
            : 'Người dùng sẽ có thể đăng nhập và tiếp tục học tập, thi thử bình thường.'}
        </p>
      </div>
    `,
    icon: isLocking ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonColor: isLocking ? '#dc3545' : '#198754',
    cancelButtonColor: '#6c757d',
    confirmButtonText: isLocking ? 'Khóa tài khoản' : 'Mở khóa',
    cancelButtonText: 'Hủy bỏ'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await apiClient.patch(`/users/${u.id}/toggle-lock`);
        u.isActive = res.data?.isActive;

        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        Toast.fire({
          icon: 'success',
          title: res.message || (u.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản')
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: err.message || 'Không thể thay đổi trạng thái tài khoản'
        });
      }
    }
  });
};

// 2. MỞ MODAL ĐỔI VAI TRÒ
const openRoleModal = (u) => {
  if (u.id === authStore.user?.id) {
    Swal.fire({
      icon: 'warning',
      title: 'Không thể thực hiện',
      text: 'Bạn không thể tự thay đổi vai trò của chính mình!'
    });
    return;
  }
  selectedUser.value = u;
  newRole.value = u.role;
  showRoleModal.value = true;
};

// Lưu thay đổi vai trò
const handleSaveRole = async () => {
  if (!selectedUser.value) return;

  isSubmittingRole.value = true;
  try {
    const res = await apiClient.patch(`/users/${selectedUser.value.id}/role`, {
      role: newRole.value
    });

    selectedUser.value.role = newRole.value;
    showRoleModal.value = false;

    Swal.fire({
      icon: 'success',
      title: 'Thành công',
      text: res.message || 'Đã cập nhật vai trò người dùng thành công!',
      timer: 1800,
      showConfirmButton: false
    });
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: err.message || 'Không thể cập nhật vai trò'
    });
  } finally {
    isSubmittingRole.value = false;
  }
};

// 3. XÓA TÀI KHOẢN - KIỂM SOÁT NGHIÊM NGẶT RÀNG BUỘC KHÓA NGOẠI
const handleDeleteUser = (u) => {
  if (u.id === authStore.user?.id) {
    Swal.fire({
      icon: 'warning',
      title: 'Không thể xóa',
      text: 'Bạn không thể tự xóa tài khoản của chính mình!'
    });
    return;
  }

  Swal.fire({
    title: `Xác nhận xóa tài khoản #${u.id}?`,
    html: `
      <div class="text-start">
        <p class="mb-1"><strong>Họ tên:</strong> ${u.fullName}</p>
        <p class="mb-2"><strong>Email:</strong> ${u.email}</p>
        <p class="small text-danger mb-0">
          <i class="bi bi-exclamation-triangle-fill me-1"></i>
          Hành động này sẽ xóa hoàn toàn tài khoản khỏi cơ sở dữ liệu nếu người dùng chưa có dữ liệu bài thi.
        </p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Đồng ý xóa',
    cancelButtonText: 'Hủy thao tác'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await apiClient.delete(`/users/${u.id}`);
        Swal.fire({
          icon: 'success',
          title: 'Đã xóa!',
          text: res.message || 'Xóa tài khoản thành công!',
          timer: 1800,
          showConfirmButton: false
        });
        fetchUsers();
      } catch (err) {
        // KIỂM TRA RÀNG BUỘC KHÓA NGOẠI: Bắt lỗi 409
        const isFkError = err.statusCode === 409 || err.isForeignKeyConstraint || (err.message && err.message.includes('khóa ngoại'));

        if (isFkError) {
          Swal.fire({
            icon: 'error',
            title: 'VI PHẠM RÀNG BUỘC KHÓA NGOẠI!',
            html: `
              <div class="text-start">
                <div class="alert alert-danger py-2 px-3 mb-3 small">
                  <strong>Không thể xóa tài khoản của ${u.fullName}!</strong><br>
                  ${err.message || 'Tài khoản này đã có lịch sử làm bài thi trong hệ thống (bảng exam_sessions).'}
                </div>
                <p class="small text-secondary mb-3">
                  Để đảm bảo tính toàn vẹn dữ liệu và bảo lưu lịch sử thi sát hạch, cơ sở dữ liệu không cho phép xóa tài khoản này.
                </p>
                <div class="p-3 bg-light rounded-3 border small">
                  <div class="fw-bold text-primary mb-1">
                    <i class="bi bi-shield-lock-fill me-1"></i> Giải pháp đề xuất:
                  </div>
                  Bạn hãy sử dụng tính năng <strong>"Khóa tài khoản"</strong>. Tài khoản sẽ bị ngừng quyền đăng nhập ngay lập tức nhưng toàn bộ dữ liệu lịch sử bài thi vẫn được lưu giữ an toàn.
                </div>
              </div>
            `,
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<span class="text-white fw-bold"><i class="bi bi-lock-fill me-1"></i> Khóa tài khoản ngay</span>',
            cancelButtonText: 'Đóng'
          }).then(async (actionRes) => {
            if (actionRes.isConfirmed) {
              await handleToggleLock(u);
            }
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Lỗi Khi Xóa',
            text: err.message || 'Không thể xóa tài khoản người dùng'
          });
        }
      }
    }
  });
};

onMounted(() => {
  fetchUsers();
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
              Quản lý tài khoản người dùng
            </li>
          </ol>
        </nav> -->
        <h2 class="fw-bolder text-dark mb-1">
          Quản Lý Người Dùng
        </h2>
        <p class="text-secondary small mb-0">
          Theo dõi danh sách tài khoản, số lượt thi thử, cấp quyền quản trị và thực hiện khóa/mở khóa tài khoản.
        </p>
      </div>

      <!-- <div>
        <router-link to="/admin/questions" class="btn btn-outline-primary px-3 py-2 fw-semibold me-2">
          <i class="bi bi-question-diamond me-1"></i> Quản lý 600 câu hỏi
        </router-link>
      </div> -->
    </div>

    <!-- 1. BỘ LỌC VÀ TÌM KIẾM -->
    <div class="card border border-light-subtle shadow-sm rounded-4 p-3 mb-4 bg-white">
      <div class="row g-3 align-items-center">
        <!-- Tìm kiếm từ khóa -->
        <div class="col-12 col-md-5">
          <label class="form-label small fw-semibold text-secondary mb-1">Tìm kiếm người dùng:</label>
          <div class="input-group">
            <span class="input-group-text bg-light text-secondary border-end-0">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="searchKeyword"
              @input="handleSearchInput"
              type="text"
              class="form-control border-start-0 ps-0"
              placeholder="Nhập họ tên, email hoặc số điện thoại..."
            />
            <button 
              v-if="searchKeyword" 
              @click="searchKeyword = ''; fetchUsers();" 
              class="btn btn-outline-secondary border-start-0" 
              type="button"
            >
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>

        <!-- Lọc Vai trò -->
        <div class="col-12 col-sm-6 col-md-3">
          <label class="form-label small fw-semibold text-secondary mb-1">Vai trò tài khoản:</label>
          <select v-model="filterRole" class="form-select">
            <option value="all">Tất cả vai trò</option>
            <option value="student">Học viên</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>

        <!-- Lọc Trạng thái hoạt động -->
        <div class="col-12 col-sm-6 col-md-3">
          <label class="form-label small fw-semibold text-secondary mb-1">Trạng thái khóa:</label>
          <select v-model="filterActive" class="form-select">
            <option value="all">Tất cả trạng thái</option>
            <option value="1">Đang hoạt động</option>
            <option value="0">Đang bị khóa</option>
          </select>
        </div>

        <!-- Nút Tải lại -->
        <div class="col-12 col-md-1 d-flex align-items-end">
          <button 
            type="button" 
            class="btn btn-outline-secondary w-100" 
            @click="fetchUsers" 
            title="Tải lại danh sách"
          >
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 2. BẢNG DỮ LIỆU NGƯỜI DÙNG -->
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <h6 class="fw-bold text-dark">Đang tải danh sách tài khoản...</h6>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="alert alert-danger rounded-4 p-4 text-center" role="alert">
      <i class="bi bi-exclamation-triangle-fill fs-3 mb-2 d-block"></i>
      <h5 class="fw-bold">Lỗi Khi Tải Người Dùng</h5>
      <p class="small mb-3">{{ errorMessage }}</p>
      <button @click="fetchUsers" class="btn btn-sm btn-outline-danger px-3">Thử lại</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="users.length === 0" class="card border border-light-subtle shadow-sm rounded-4 p-5 text-center bg-white">
      <i class="bi bi-people display-3 text-secondary mb-3"></i>
      <h4 class="fw-bolder text-dark mb-2">Không Tìm Thấy Người Dùng Nào</h4>
      <p class="text-secondary small mb-3">
        Không có tài khoản nào phù hợp với các tiêu chí tìm kiếm và bộ lọc hiện tại.
      </p>
    </div>

    <!-- Data Table -->
    <div v-else class="card border border-light-subtle shadow-sm rounded-4 bg-white overflow-hidden mb-4">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col" class="ps-4 text-secondary small fw-bold text-center">#ID</th>
              <th scope="col" class="text-secondary small fw-bold">NGƯỜI DÙNG</th>
              <th scope="col" class="text-secondary small fw-bold">THÔNG TIN LIÊN HỆ</th>
              <th scope="col" class="text-center text-secondary small fw-bold">VAI TRÒ</th>
              <th scope="col" class="text-center text-secondary small fw-bold">TIẾN ĐỘ THI</th>
              <th scope="col" class="text-secondary small fw-bold">NGÀY ĐĂNG KÝ</th>
              <th scope="col" class="text-center text-secondary small fw-bold">TRẠNG THÁI</th>
              <th scope="col" class="text-end pe-4 text-secondary small fw-bold">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" :class="{ 'bg-light': !u.isActive }">
              <!-- ID -->
              <td class="ps-4 text-center fw-bold text-secondary">
                #{{ u.id }}
              </td>

              <!-- Họ và tên kèm Avatar -->
              <td>
                <div class="d-flex align-items-center gap-2">
                  <template v-if="u.avatar">
                    <img 
                      :src="resolveAssetUrl(u.avatar)" 
                      alt="Avatar" 
                      class="rounded-circle object-fit-cover shadow-sm flex-shrink-0"
                      style="width: 32px; height: 32px;"
                    />
                  </template>
                  <template v-else>
                    <div class="user-avatar-circle flex-shrink-0">
                      {{ (u.fullName || 'U').charAt(0).toUpperCase() }}
                    </div>
                  </template>
                  <div>
                    <div class="fw-bold text-dark">
                      {{ u.fullName }}
                      <span v-if="u.id === authStore.user?.id" class="badge bg-secondary ms-1 fs-xxs">Bạn</span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Thông tin liên hệ -->
              <td>
                <div class="small fw-semibold text-dark text-truncate">
                  <i class="bi bi-envelope me-1 text-secondary"></i>{{ u.email }}
                </div>
                <div v-if="u.phone" class="text-secondary fs-xxs mt-1">
                  <i class="bi bi-telephone me-1"></i>{{ u.phone }}
                </div>
              </td>

              <!-- Vai trò -->
              <td class="text-center">
                <span 
                  class="badge px-3 py-1 rounded-pill fw-bold"
                  :class="u.role === 'admin' ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'"
                >
                  <i class="bi me-1" :class="u.role === 'admin' ? 'bi-shield-shaded' : 'bi-person'"></i>
                  {{ u.role === 'admin' ? 'Quản trị viên' : 'Học viên' }}
                </span>
              </td>

              <!-- Tiến độ thi -->
              <td class="text-center">
                <div class="fw-bold small text-dark">
                  {{ u.examCount }} lượt thi
                </div>
                <div v-if="u.examCount > 0" class="text-success fs-xxs">
                  (Đậu: {{ u.passedCount }}/{{ u.examCount }})
                </div>
                <div v-else class="text-muted fs-xxs">
                  Chưa thi bài nào
                </div>
              </td>

              <!-- Ngày đăng ký -->
              <td>
                <div class="small text-secondary">
                  {{ formatDateTime(u.createdAt) }}
                </div>
              </td>

              <!-- Trạng thái Hoạt động / Bị khóa -->
              <td class="text-center">
                <span 
                  class="badge rounded-pill px-3 py-1 fw-bold"
                  :class="u.isActive ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                >
                  <i class="bi me-1" :class="u.isActive ? 'bi-check-circle-fill' : 'bi-lock-fill'"></i>
                  {{ u.isActive ? 'Hoạt động' : 'Đã khóa' }}
                </span>
              </td>

              <!-- Thao tác -->
              <td class="text-end pe-4">
                <div class="d-flex justify-content-end gap-2">
                  <!-- Nút Khóa / Mở khóa -->
                  <button 
                    @click="handleToggleLock(u)" 
                    class="btn btn-sm px-2 py-1"
                    :class="u.isActive ? 'btn-outline-danger' : 'btn-outline-success'"
                    :title="u.isActive ? 'Khóa tài khoản này' : 'Mở khóa tài khoản'"
                    :disabled="u.id === authStore.user?.id"
                  >
                    <i class="bi" :class="u.isActive ? 'bi-lock-fill' : 'bi-unlock-fill'"></i>
                  </button>

                  <!-- Nút Đổi vai trò -->
                  <button 
                    @click="openRoleModal(u)" 
                    class="btn btn-sm btn-outline-primary px-2 py-1" 
                    title="Thay đổi vai trò (Admin / Học viên)"
                    :disabled="u.id === authStore.user?.id"
                  >
                    <i class="bi bi-shield-check"></i>
                  </button>

                  <!-- Nút Xóa tài khoản -->
                  <button 
                    @click="handleDeleteUser(u)" 
                    class="btn btn-sm btn-outline-danger px-2 py-1" 
                    title="Xóa tài khoản"
                    :disabled="u.id === authStore.user?.id"
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
            {{ (pagination.page - 1) * pagination.limit + (users.length > 0 ? 1 : 0) }}
          </strong> 
          - 
          <strong class="text-dark">
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
          </strong> 
          trên tổng số 
          <strong class="text-dark">{{ pagination.total }}</strong> người dùng
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

    <!-- 3. MODAL PHÂN QUYỀN VAI TRÒ -->
    <div 
      v-if="showRoleModal" 
      class="modal fade show d-block modal-backdrop-blur" 
      tabindex="-1" 
      role="dialog"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div class="modal-header bg-light border-bottom px-4 py-3">
            <h5 class="modal-title fw-bold text-dark">
              <i class="bi bi-shield-check text-primary me-2"></i>Thay Đổi Vai Trò Người Dùng
            </h5>
            <button type="button" class="btn-close" @click="showRoleModal = false" aria-label="Close"></button>
          </div>

          <div class="modal-body p-4">
            <div class="mb-3" v-if="selectedUser">
              <label class="form-label small text-secondary mb-1">Tài khoản người dùng:</label>
              <div class="p-3 bg-light rounded-3 border">
                <div class="fw-bold text-dark">{{ selectedUser.fullName }}</div>
                <div class="small text-secondary">{{ selectedUser.email }}</div>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label small fw-bold text-dark">Chọn vai trò mới:</label>
              <div class="d-flex flex-column gap-2">
                <label 
                  class="p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer"
                  :class="newRole === 'student' ? 'border-primary bg-primary-subtle' : 'bg-white'"
                >
                  <div class="d-flex align-items-center gap-2">
                    <input type="radio" v-model="newRole" value="student" class="form-check-input mt-0" />
                    <div>
                      <div class="fw-bold text-dark">Học viên (Student)</div>
                      <div class="fs-xxs text-secondary">Học lý thuyết, làm bài thi thử sát hạch, xem lịch sử cá nhân.</div>
                    </div>
                  </div>
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">Mặc định</span>
                </label>

                <label 
                  class="p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer"
                  :class="newRole === 'admin' ? 'border-danger bg-danger-subtle' : 'bg-white'"
                >
                  <div class="d-flex align-items-center gap-2">
                    <input type="radio" v-model="newRole" value="admin" class="form-check-input mt-0" />
                    <div>
                      <div class="fw-bold text-danger">Quản trị viên (Admin)</div>
                      <div class="fs-xxs text-secondary">Toàn quyền thêm/sửa/xóa câu hỏi 600 câu, quản lý người dùng, xem dashboard.</div>
                    </div>
                  </div>
                  <span class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill">Toàn quyền</span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-footer bg-light border-top px-4 py-3">
            <button type="button" class="btn btn-secondary px-4" @click="showRoleModal = false">
              Hủy
            </button>
            <button 
              type="button" 
              class="btn btn-primary px-4 fw-semibold" 
              @click="handleSaveRole"
              :disabled="isSubmittingRole"
            >
              <span v-if="isSubmittingRole" class="spinner-border spinner-border-sm me-1" role="status"></span>
              Xác nhận thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
