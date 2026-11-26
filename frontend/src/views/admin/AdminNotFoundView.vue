<script setup>
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const quickNavItems = [
  { name: 'Admin Dashboard', path: '/admin/dashboard' },
  { name: 'Ngân hàng 600 câu hỏi', path: '/admin/questions' },
  { name: 'Quản lý người dùng', path: '/admin/users' },
  { name: 'Quản lý biển báo', path: '/admin/signs' },
  { name: 'Quản lý phòng thi', path: '/admin/exam-rooms' },
  { name: 'Quản lý chương lý thuyết', path: '/admin/chapters' },
  { name: 'Quản lý mức xử phạt', path: '/admin/fines' },
];
</script>

<template>
  <div class="admin-not-found-container py-5">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-10 col-xl-8">
        <!-- Main 404 Card -->
        <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white text-center">
          <!-- Icon & 404 Badge -->
          <div class="mb-4">
            <div class="error-badge-icon mx-auto mb-3 d-inline-flex align-items-center justify-content-center rounded-circle bg-danger-subtle text-danger">
              <i class="bi bi-shield-exclamation fs-1"></i>
            </div>
            <div class="display-1 fw-black text-danger lh-1 mb-2 font-monospace">404</div>
            <span class="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill fs-6 fw-bold">
              ADMIN PORTAL ERROR
            </span>
          </div>

          <!-- Error Details -->
          <h2 class="fw-bold text-dark mb-2">Không tìm thấy trang quản trị</h2>
          <p class="text-secondary fs-6 mb-3">
            Đường dẫn quản trị bạn vừa truy cập không tồn tại hoặc đã được di chuyển trong hệ thống.
          </p>

          <!-- Path display -->
          <div class="path-display-box mx-auto mb-4 px-3 py-2 rounded-3 bg-light border text-truncate" style="max-width: 500px;">
            <small class="text-muted me-2">Đường dẫn yêu cầu:</small>
            <code class="text-danger fw-bold">{{ route.fullPath }}</code>
          </div>

          <!-- Action Buttons -->
          <div class="d-flex flex-wrap gap-2 justify-content-center mb-5">
            <router-link to="/admin/dashboard" class="btn btn-danger px-4 py-2 rounded-3 shadow-sm d-inline-flex align-items-center gap-2">
              <i class="bi bi-speedometer2"></i>
              <span>Về Admin Dashboard</span>
            </router-link>
            <button @click="router.back()" class="btn btn-outline-secondary px-4 py-2 rounded-3 d-inline-flex align-items-center gap-2">
              <i class="bi bi-arrow-left"></i>
              <span>Quay lại trang trước</span>
            </button>
          </div>

          <!-- Quick Navigation Links to Admin Modules -->
          <div class="border-top pt-4">
            <p class="text-muted small fw-semibold text-uppercase tracking-wider mb-3">
              Truy cập nhanh các phân hệ quản lý:
            </p>
            <div class="d-flex flex-wrap gap-2 justify-content-center">
              <router-link 
                v-for="item in quickNavItems" 
                :key="item.path" 
                :to="item.path"
                class="btn btn-sm btn-light border rounded-pill px-3 py-2 text-secondary text-decoration-none quick-nav-btn"
              >
                <span class="small fw-medium">{{ item.name }}</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-badge-icon {
  width: 80px;
  height: 80px;
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.2);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 12px rgba(220, 38, 38, 0);
  }
}

.fw-black {
  font-weight: 900;
  letter-spacing: -2px;
}

.text-purple {
  color: #8b5cf6;
}

.quick-nav-btn {
  transition: all 0.2s ease;
}

.quick-nav-btn:hover {
  background-color: #ffffff;
  border-color: #dc2626 !important;
  color: #dc2626 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
