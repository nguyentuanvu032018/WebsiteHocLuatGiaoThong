<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { resolveAssetUrl } from '../services/api';
import Swal from 'sweetalert2';
import ProfileModal from '../components/common/ProfileModal.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const isSidebarCollapsed = ref(false);
const showProfileModal = ref(false);
const avatarLoadFailed = ref(false);

watch(() => authStore.userAvatar, () => {
  avatarLoadFailed.value = false;
});

const userName = computed(() => authStore.userName || 'Admin');
const userEmail = computed(() => authStore.userEmail || '');
const userInitial = computed(() => {
  if (!userName.value) return 'A';
  const parts = userName.value.trim().split(' ');
  return parts[parts.length - 1].charAt(0).toUpperCase();
});

// Xử lý đăng xuất
const handleLogout = async () => {
  const result = await Swal.fire({
    title: 'Xác nhận đăng xuất?',
    text: 'Bạn có chắc chắn muốn kết thúc phiên làm việc Quản trị viên?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Đăng xuất',
    cancelButtonText: 'Hủy'
  });

  if (result.isConfirmed) {
    authStore.logout();
    Swal.fire({
      icon: 'success',
      title: 'Đã đăng xuất',
      text: 'Phiên làm việc Quản trị viên đã kết thúc.',
      timer: 1500,
      showConfirmButton: false
    });
    router.push('/login');
  }
};
</script>

<template>
  <div class="admin-shell min-vh-100 d-flex flex-column flex-lg-row">
    <!-- ========================================================================= -->
    <!-- 1. ADMIN SIDEBAR (Responsive Offcanvas on mobile, fixed column on desktop)-->
    <!-- ========================================================================= -->
    <aside 
      class="admin-sidebar offcanvas-lg offcanvas-start d-flex flex-column" 
      :class="{ 'admin-sidebar-collapsed': isSidebarCollapsed }"
      tabindex="-1" 
      id="adminSidebar" 
      aria-labelledby="adminSidebarLabel"
      style="width: 270px; min-width: 270px;"
    >
      <!-- Sidebar Header / Brand Logo -->
      <div class="p-3 border-bottom border-secondary-subtle d-flex align-items-center justify-content-between">
        <router-link to="/admin/dashboard" class="d-flex align-items-center gap-2 text-white text-decoration-none">
          <img src="/logo.png" alt="Admin Logo" class="rounded-3 bg-white p-1 shadow-sm" style="width: 40px; height: 40px; object-fit: contain;" />
          <div class="d-flex flex-column lh-1">
            <span class="fw-bolder fs-6 tracking-wide text-white">Tập Lái 24h</span>
            <span class="text-primary small fs-xxs fw-semibold mt-1">HỆ THỐNG QUẢN TRỊ</span>
          </div>
        </router-link>
        <!-- Close button for mobile offcanvas -->
        <button 
          type="button" 
          class="btn-close btn-close-white d-lg-none" 
          data-bs-dismiss="offcanvas" 
          data-bs-target="#adminSidebar" 
          aria-label="Đóng menu"
        ></button>
        <button
          type="button"
          class="btn btn-link text-secondary p-0 border-0 shadow-none d-none d-lg-inline-flex align-items-center justify-content-center"
          @click="isSidebarCollapsed = true"
          aria-label="Ẩn thanh điều hướng"
          title="Ẩn thanh điều hướng"
        >
          <i class="bi bi-x-lg fs-4"></i>
        </button>
      </div>

      <!-- Navigation Menu Items -->
      <div class="p-3 flex-grow-1 overflow-y-auto">
        <ul class="nav nav-pills flex-column gap-1 mb-4">
          <li class="nav-item">
            <router-link 
              to="/admin/dashboard" 
              class="admin-nav-link nav-link d-flex align-items-center gap-2 py-2 px-3 rounded-3"
              :class="route.path === '/admin/dashboard' ? 'active admin-nav-active fw-bold shadow-sm' : 'text-light'"
            >
              <i class="bi bi-speedometer2 fs-6"></i>
              <span>Admin Dashboard</span>
            </router-link>
          </li>
        <!-- </ul>

        <ul class="nav nav-pills flex-column gap-1 mb-4"> -->
          <li class="nav-item">
            <router-link 
              to="/admin/questions" 
              class="admin-nav-link nav-link d-flex align-items-center gap-2 py-2 px-3 rounded-3"
              :class="route.path.startsWith('/admin/questions') ? 'active admin-nav-active fw-bold shadow-sm' : 'text-light'"
            >
              <i class="bi bi-question-diamond-fill fs-6"></i>
              <span>Quản Lý Câu Hỏi</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link 
              to="/admin/users" 
              class="admin-nav-link nav-link d-flex align-items-center gap-2 py-2 px-3 rounded-3"
              :class="route.path.startsWith('/admin/users') ? 'active admin-nav-active fw-bold shadow-sm' : 'text-light'"
            >
              <i class="bi bi-people-fill fs-6"></i>
              <span>Quản Lý người dùng</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link 
              to="/admin/signs" 
              class="admin-nav-link nav-link d-flex align-items-center gap-2 py-2 px-3 rounded-3"
              :class="route.path.startsWith('/admin/signs') ? 'active admin-nav-active fw-bold shadow-sm' : 'text-light'"
            >
              <i class="bi bi-signpost-split-fill fs-6"></i>
              <span>Quản lý biển báo</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link 
              to="/admin/chapters" 
              class="admin-nav-link nav-link d-flex align-items-center gap-2 py-2 px-3 rounded-3"
              :class="route.path.startsWith('/admin/chapters') ? 'active admin-nav-active fw-bold shadow-sm' : 'text-light'"
            >
              <i class="bi bi-journal-bookmark-fill fs-6"></i>
              <span>Quản lý chương</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link 
              to="/admin/exam-rooms" 
              class="admin-nav-link nav-link d-flex align-items-center gap-2 py-2 px-3 rounded-3"
              :class="route.path.startsWith('/admin/exam-rooms') || route.path.startsWith('/admin/license-types') ? 'active admin-nav-active fw-bold shadow-sm' : 'text-light'"
            >
              <i class="bi bi-laptop fs-6"></i>
              <span>Quản lý phòng thi</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link 
              to="/admin/fines" 
              class="admin-nav-link nav-link d-flex align-items-center gap-2 py-2 px-3 rounded-3"
              :class="route.path.startsWith('/admin/fines') ? 'active admin-nav-active fw-bold shadow-sm' : 'text-light'"
            >
              <i class="bi bi-shield-slash-fill fs-6"></i>
              <span>Quản lý mức phạt</span>
            </router-link>
          </li>
        </ul>

        <ul class="nav nav-pills flex-column gap-1">
          <li class="nav-item">
            <a 
              href="http://localhost:5173/" 
              class="nav-link d-flex align-items-center justify-content-between py-2 px-3 rounded-3 text-light bg-dark-subtle bg-opacity-25 border border-secondary border-opacity-25"
            >
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-mortarboard-fill text-primary fs-6"></i>
                <span>Cổng học viên</span>
              </div>
              <i class="bi bi-arrow-up-right fs-xxs text-secondary"></i>
            </a>
          </li>
          <!-- <li class="nav-item">
            <router-link 
              to="/exam" 
              class="nav-link d-flex align-items-center gap-2 py-2 px-3 rounded-3 text-secondary"
            >
              <i class="bi bi-journal-text fs-6"></i>
              <span>Thi thử học viên</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link 
              to="/exam" 
              class="nav-link d-flex align-items-center gap-2 py-2 px-3 rounded-3 text-secondary"
            >
              <i class="bi bi-stopwatch fs-6"></i>
              <span>Thi thử sát hạch</span>
            </router-link>
          </li> -->
        </ul>
      </div>

      <!-- Sidebar User Profile Footer -->
      <div class="p-3 border-top border-secondary-subtle bg-black bg-opacity-25">
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2 text-truncate me-2">
            <template v-if="authStore.userAvatar && !avatarLoadFailed">
              <img 
                :src="resolveAssetUrl(authStore.userAvatar)" 
                alt="Avatar" 
                class="rounded-circle object-fit-cover shadow-sm flex-shrink-0"
                style="width: 38px; height: 38px;"
                @error="avatarLoadFailed = true"
              />
            </template>
            <template v-else>
              <div 
                class="rounded-circle bg-primary text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                style="width: 38px; height: 38px; font-size: 14px;"
              >
                {{ userInitial }}
              </div>
            </template>
            <div class="d-flex flex-column text-truncate lh-sm">
              <span class="fw-bold text-white small text-truncate">{{ userName }}</span>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-xxs align-self-start mt-1">
                Quản trị viên
              </span>
            </div>
          </div>

          <button 
            @click="handleLogout" 
            class="btn btn-sm btn-outline-danger p-2 rounded-3" 
            title="Đăng xuất khỏi hệ thống quản trị"
          >
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>
    </aside>

    <!-- ========================================================================= -->
    <!-- 2. ADMIN MAIN WRAPPER (Topbar + Dynamic View Content + Admin Footer)       -->
    <!-- ========================================================================= -->
    <div class="flex-grow-1 d-flex flex-column min-vh-100 overflow-x-hidden">
      <!-- Admin Topbar Header -->
      <header class="admin-topbar navbar navbar-expand border-bottom shadow-xs px-3 px-lg-4 py-2 sticky-top">
        <div class="container-fluid p-0">
          <!-- Mobile Sidebar Toggle Button -->
          <button 
            class="btn btn-light d-lg-none border me-2" 
            type="button" 
            data-bs-toggle="offcanvas" 
            data-bs-target="#adminSidebar" 
            aria-controls="adminSidebar"
            aria-label="Mở menu quản trị"
          >
            <i class="bi bi-list fs-5"></i>
          </button>
          <button
            v-if="isSidebarCollapsed"
            class="btn btn-light d-none d-lg-inline-flex align-items-center justify-content-center border me-2"
            type="button"
            @click="isSidebarCollapsed = false"
            aria-controls="adminSidebar"
            aria-label="Mở menu quản trị"
            title="Mở menu quản trị"
          >
            <i class="bi bi-list fs-5"></i>
          </button>

          <!-- Current Portal Indicator -->
          <div class="d-flex align-items-center gap-2">
            <span class="admin-topbar-badge badge px-2 py-1 rounded-pill small fw-semibold">
              
            </span>
            <span class="admin-topbar-title d-none d-md-inline-block header-banner">
              <h3>Hệ Thống Sát Hạch Giấy Phép Lái Xe</h3>
            </span>
          </div>

          <!-- Topbar Actions & User Details -->
          <div class="ms-auto d-flex align-items-center gap-2">
            <!-- Switch to Student Portal Button -->
            <!-- <router-link 
              to="/" 
              class="admin-topbar-portal-btn btn btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1"
            >
              <i class="bi bi-box-arrow-up-right"></i>
              <span class="d-none d-sm-inline">Về cổng học viên</span>
            </router-link> -->

            <!-- Admin Dropdown Menu -->
            <div class="dropdown">
              <button 
                class="admin-topbar-user-btn btn btn-sm d-flex align-items-center gap-2 border rounded-pill px-3 py-1"
                type="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <template v-if="authStore.userAvatar && !avatarLoadFailed">
                  <img 
                    :src="resolveAssetUrl(authStore.userAvatar)" 
                    alt="Avatar" 
                    class="rounded-circle object-fit-cover shadow-sm"
                    style="width: 24px; height: 24px;"
                    @error="avatarLoadFailed = true"
                  />
                </template>
                <template v-else>
                  <div 
                    class="rounded-circle bg-white text-primary fw-bold d-flex align-items-center justify-content-center"
                    style="width: 24px; height: 24px; font-size: 11px;"
                  >
                    {{ userInitial }}
                  </div>
                </template>
                <span class="fw-semibold small d-none d-md-inline">{{ userName }}</span>
                <i class="bi bi-chevron-down fs-xxs"></i>
              </button>

              <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2 p-2" style="min-width: 200px;">
                <li class="px-3 py-2 border-bottom">
                  <div class="fw-bold small text-dark">{{ userName }}</div>
                  <div class="text-secondary fs-xxs text-truncate">{{ userEmail }}</div>
                </li>
                <li>
                  <button @click="showProfileModal = true" class="dropdown-item py-2 small rounded-2 text-dark fw-medium d-flex align-items-center">
                    <i class="bi bi-person-gear me-2 text-primary"></i> <span>Thông tin cá nhân</span>
                  </button>
                </li>
                <li><hr class="dropdown-divider my-1"></li>
                <li>
                  <button @click="handleLogout" class="dropdown-item text-danger py-2 small rounded-2">
                    <i class="bi bi-box-arrow-right me-2"></i> Đăng xuất
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Slot Content -->
      <main class="admin-main-panel flex-grow-1">
        <slot />
      </main>

      <!-- Admin Minimal Footer -->
      <footer class="bg-white border-top py-3 px-4 text-center text-md-start small text-secondary mt-auto">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <div>
            <strong>Tập Lái 24h Admin Portal</strong> &copy; Niên luận ngành Công Nghệ Thông Tin (CT466).
          </div>
          <div class="d-flex gap-3">
            <span>Phiên bản v1.0.0</span>
            <span class="text-muted">|</span>
            <span class="text-success"><i class="bi bi-circle-fill fs-xxs me-1"></i>Hệ thống hoạt động bình thường</span>
          </div>
        </div>
      </footer>
    </div>

    <!-- Modal Thông tin cá nhân -->
    <ProfileModal v-model:show="showProfileModal" />
  </div>
</template>
