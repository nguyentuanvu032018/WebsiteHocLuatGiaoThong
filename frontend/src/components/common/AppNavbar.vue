<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { resolveAssetUrl } from '../../services/api';
import Swal from 'sweetalert2';
import { LICENSE_GROUPS } from '../../utils/licenseGroups';
import {
  ADMIN_PREVIEW_HASH,
  getAdminPortalUrl,
} from '../../utils/portals';
import ProfileModal from './ProfileModal.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const userName = computed(() => authStore.userName);
const userRoleBadge = computed(() => authStore.userRoleBadge);
const isAdmin = computed(() => authStore.isAdmin);
const studyMenu = ref(null);
const openMenu = ref(null);
const showProfileModal = ref(false);
const avatarLoadFailed = ref(false);
const cameFromAdmin = computed(() => window.location.hash === ADMIN_PREVIEW_HASH);

const returnToAdmin = () => {
  window.location.assign(getAdminPortalUrl('/admin/dashboard'));
};

watch(() => authStore.userAvatar, () => {
  avatarLoadFailed.value = false;
});

const openProfileModal = () => {
  closeMenus();
  showProfileModal.value = true;
};

const toggleMenu = (menu) => {
  openMenu.value = openMenu.value === menu ? null : menu;
};

const closeMenus = () => {
  openMenu.value = null;
};

const handleOutsideClick = (event) => {
  if (!studyMenu.value?.contains(event.target)) {
    closeMenus();
  }
};

const handleMenuKeydown = (event) => {
  if (event.key === 'Escape') closeMenus();
};

watch(() => route.fullPath, closeMenus);

onMounted(() => {
  document.addEventListener('pointerdown', handleOutsideClick);
  document.addEventListener('keydown', handleMenuKeydown);
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleOutsideClick);
  document.removeEventListener('keydown', handleMenuKeydown);
});

const userInitial = computed(() => {
  if (!userName.value) return 'H';
  const parts = userName.value.trim().split(' ');
  return parts[parts.length - 1].charAt(0).toUpperCase();
});

// Xử lý đăng xuất
const handleLogout = async () => {
  const result = await Swal.fire({
    title: 'Xác nhận đăng xuất?',
    text: 'Bạn có chắc chắn muốn kết thúc phiên đăng nhập?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Đăng xuất',
    cancelButtonText: 'Hủy'
  });

  if (result.isConfirmed) {
    authStore.logout();
    Swal.fire({
      icon: 'success',
      title: 'Đã đăng xuất',
      text: 'Hẹn gặp lại bạn!',
      timer: 1500,
      showConfirmButton: false
    });
    router.push('/login');
  }
};
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-custom sticky-top">
    <div class="container">
      <!-- Brand Logo -->
      <router-link to="/" class="navbar-brand d-flex align-items-center gap-2">
        <img src="/logo.png" alt="Logo Luật Giao Thông" class="app-logo-img" />
        <div class="d-flex flex-column lh-1">
          <span class="fw-bolder fs-5 text-gradient-primary">Tập Lái 24h</span>
          <!-- <span class="text-secondary fw-bold fs-xxs letter-spacing-wide">600 CÂU BỘ GTVT</span> -->
        </div>
      </router-link>

      <!-- Mobile Toggler (Bootstrap 5) -->
      <button 
        class="navbar-toggler border-0 shadow-none" 
        type="button" 
        data-bs-toggle="collapse" 
        data-bs-target="#navbarMainContent"
        aria-controls="navbarMainContent" 
        aria-expanded="false" 
        aria-label="Toggle navigation"
      >
        <i class="bi bi-list fs-2 text-dark"></i>
      </button>

      <!-- Nav Items & Auth Menu -->
      <div class="collapse navbar-collapse" id="navbarMainContent">
        <!-- Main Navigation Links -->
        <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3 gap-lg-1">
          <!-- Trang chủ -->
          <li class="nav-item">
            <router-link to="/" class="nav-link" :class="{ active: route.path === '/' }">
              <!-- <i class="bi bi-house-door me-1"></i> -->Trang chủ 
            </router-link>
          </li>

          <!-- Dropdown Ôn tập lý thuyết -->
          <li ref="studyMenu" class="nav-item dropdown" :class="{ show: openMenu === 'study' }">
            <a 
              class="nav-link dropdown-toggle" 
              href="#" 
              role="button" 
              :aria-expanded="openMenu === 'study'"
              aria-haspopup="true"
              @click.prevent="toggleMenu('study')"
              :class="{ active: route.path.startsWith('/study') }"
            >
              <!-- <i class="bi bi-journal-bookmark me-1"></i> -->Ôn tập lý thuyết
            </a>
            <ul class="dropdown-menu border-0 shadow-lg p-2 dropdown-menu-wide" :class="{ show: openMenu === 'study' }">
              <li class="dropdown-header small text-uppercase fw-bold text-secondary">Ôn thi theo hạng</li>
              <li v-for="(group, code) in LICENSE_GROUPS" :key="code">
                <router-link :to="`/study?group=${code}`" class="dropdown-item py-2 rounded-2" @click="closeMenus">
                  <div class="d-flex align-items-center">
                    <div class="dropdown-icon-box bg-success-subtle text-success me-2">
                      <i class="bi bi-car-front-fill"></i>
                    </div>
                    <div>
                      <div class="fw-semibold">Ôn thi hạng {{ group.label }}</div>
                      <small class="text-muted">{{ group.vehicle }} · {{ group.studyScope }}</small>
                    </div>
                  </div>
                </router-link>
              </li>
              <li><hr class="dropdown-divider my-1"></li>
              <li>
                <router-link to="/study/paralysis" class="dropdown-item py-2 rounded-2" @click="closeMenus">
                  <div class="d-flex align-items-center">
                    <div class="dropdown-icon-box bg-danger-subtle text-danger me-2">
                      <i class="bi bi-exclamation-octagon-fill"></i>
                    </div>
                    <div>
                      <div class="fw-semibold text-danger d-flex align-items-center gap-1">
                        60 Câu điểm liệt
                        <!-- <span class="badge bg-danger rounded-pill fs-xxs">Bắt buộc</span> -->
                      </div>
                      <small class="text-muted">Sai 1 câu là trượt trực tiếp</small>
                    </div>
                  </div>
                </router-link>
              </li>
            </ul>
          </li>

          <!-- Thi thử sát hạch -->
          <li class="nav-item">
            <router-link to="/exam" class="nav-link" :class="{ active: route.path.startsWith('/exam') }">
              Thi thử
            </router-link>
          </li>

          <!-- Dropdown Tra cứu -->
          <li class="nav-item dropdown">
            <a 
              class="nav-link dropdown-toggle" 
              href="#" 
              role="button" 
              data-bs-toggle="dropdown" 
              aria-expanded="false"
              :class="{ active: route.path.startsWith('/lookup') }"
            >
              <!-- <i class="bi bi-search me-1"></i> -->Tra cứu luật 
            </a>
            <ul class="dropdown-menu border-0 shadow-lg p-2 dropdown-menu-wide">
              <li>
                <router-link to="/lookup/signs" class="dropdown-item py-2 rounded-2">
                  <div class="d-flex align-items-center">
                    <div class="dropdown-icon-box bg-info-subtle text-info me-2">
                      <i class="bi bi-signpost-2"></i>
                    </div>
                    <div>
                      <div class="fw-semibold">Biển báo đường bộ</div>
                      <small class="text-muted">5 nhóm biển báo</small>
                    </div>
                  </div>
                </router-link>
              </li>
              <li><hr class="dropdown-divider my-1"></li>
              <li>
                <router-link to="/lookup/fines" class="dropdown-item py-2 rounded-2">
                  <div class="d-flex align-items-center">
                    <div class="dropdown-icon-box bg-warning-subtle text-warning me-2">
                      <i class="bi bi-cash-stack"></i>
                    </div>
                    <div>
                      <div class="fw-semibold">Mức xử phạt vi phạm</div>
                      <small class="text-muted">Nghị định 100/2019 & 123/2021</small>
                    </div>
                  </div>
                </router-link>
              </li>
              <li><hr class="dropdown-divider my-1"></li>
              <li>
                <router-link to="/lookup/recognize" class="dropdown-item py-2 rounded-2">
                  <div class="d-flex align-items-center">
                    <div class="dropdown-icon-box bg-primary-subtle text-primary me-2">
                      <i class="bi bi-camera-fill"></i>
                    </div>
                    <div>
                      <div class="fw-semibold d-flex align-items-center gap-1">
                        Nhận diện biển báo
                      </div>
                      <small class="text-muted">Tải ảnh hoặc quét trực tiếp qua Camera</small>
                    </div>
                  </div>
                </router-link>
              </li>
              <li><hr class="dropdown-divider my-1"></li>
              <li>
                <router-link to="/lookup/chatbot" class="dropdown-item py-2 rounded-2">
                  <div class="d-flex align-items-center">
                    <div class="dropdown-icon-box bg-success-subtle text-success me-2">
                      <i class="bi bi-robot"></i>
                    </div>
                    <div>
                      <div class="fw-semibold d-flex align-items-center gap-1">
                        Hỏi đáp với Chatbot
                      </div>
                      <small class="text-muted">Chatbot trợ lý luật giao thông</small>
                    </div>
                  </div>
                </router-link>
              </li>
            </ul>
          </li>
        </ul>

        <!-- Right Side: User Profile & Auth Buttons -->
        <div class="d-flex align-items-center gap-2 mt-3 mt-lg-0">
          <button
            v-if="cameFromAdmin"
            type="button"
            class="btn btn-outline-danger px-3 py-2 fw-bold d-flex align-items-center gap-2"
            title="Quay lại giao diện quản trị"
            @click="returnToAdmin"
          >
            <i class="bi bi-shield-lock-fill"></i>
            <span>Quay về quản trị</span>
          </button>

          <!-- Khi CHƯA ĐĂNG NHẬP -->
          <template v-if="!isAuthenticated">
            <router-link to="/login" class="btn btn-soft-primary px-3 py-2">
              <i class="bi bi-box-arrow-in-right"></i> Đăng nhập
            </router-link>
            <router-link to="/register" class="btn btn-primary px-3 py-2">
              <i class="bi bi-person-plus"></i> Đăng ký
            </router-link>
          </template>

          <!-- Khi ĐÃ ĐĂNG NHẬP -->
          <template v-else>
            <!-- Nút chuyển sang Cổng Quản Trị cho Admin -->
            <router-link 
              v-if="isAdmin" 
              to="/admin/dashboard" 
              class="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1 shadow-xs"
              title="Chuyển sang giao diện Quản trị viên"
            >
              <i class="bi bi-shield-lock-fill"></i>
              <span>Trang Quản Trị</span>
            </router-link>

            <div class="dropdown">
              <button 
                class="btn btn-light d-flex align-items-center gap-2 border px-3 py-1 dropdown-toggle shadow-sm rounded-pill" 
                type="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <!-- Avatar image or fallback circle -->
                <template v-if="authStore.userAvatar && !avatarLoadFailed">
                  <img 
                    :src="resolveAssetUrl(authStore.userAvatar)" 
                    alt="Avatar" 
                    class="rounded-circle object-fit-cover shadow-sm"
                    style="width: 32px; height: 32px;"
                    @error="avatarLoadFailed = true"
                  />
                </template>
                <template v-else>
                  <div class="user-avatar-circle">
                    {{ userInitial }}
                  </div>
                </template>

                <!-- User name and role -->
                <div class="text-start d-none d-sm-block lh-sm pe-1">
                  <div class="fw-bold small text-dark text-truncate">
                    {{ userName }}
                  </div>
                  <span class="badge fs-xxs" :class="isAdmin ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'">
                    {{ userRoleBadge }}
                  </span>
                </div>
              </button>

              <ul class="dropdown-menu dropdown-menu-end border-0 shadow-lg p-2 dropdown-menu-wide mt-2">
                <li class="px-3 py-2 border-bottom">
                  <div class="fw-bold text-dark">{{ userName }}</div>
                  <div class="small text-muted text-truncate">{{ authStore.userEmail }}</div>
                </li>
                <li>
                  <button type="button" @click="openProfileModal" class="dropdown-item py-2 rounded-2 text-dark fw-medium d-flex align-items-center">
                    <i class="bi bi-person-gear me-2 text-primary"></i> <span>Thông tin cá nhân</span>
                  </button>
                </li>
                <li>
                  <router-link to="/exam/history" class="dropdown-item py-2 rounded-2">
                    <i class="bi bi-clock-history me-2 text-primary"></i> Lịch sử thi thử cá nhân
                  </router-link>
                </li>
                <template v-if="isAdmin">
                  <li><hr class="dropdown-divider my-1"></li>
                  <li>
                    <div class="px-3 py-1 text-uppercase text-secondary fs-xxs fw-bold">Phân hệ Quản trị</div>
                  </li>
                  <li>
                    <router-link to="/admin/dashboard" class="dropdown-item py-2 rounded-2 text-danger fw-semibold">
                      <i class="bi bi-speedometer2 me-2 text-danger"></i> Admin Dashboard
                    </router-link>
                  </li>
                  <li>
                    <router-link to="/admin/questions" class="dropdown-item py-2 rounded-2">
                      <i class="bi bi-question-diamond me-2 text-primary"></i> Quản lý ngân hàng câu hỏi
                    </router-link>
                  </li>
                  <li>
                    <router-link to="/admin/users" class="dropdown-item py-2 rounded-2">
                      <i class="bi bi-people me-2 text-primary"></i> Quản lý người dùng
                    </router-link>
                  </li>
                </template>
                <li><hr class="dropdown-divider my-1"></li>
                <li>
                  <button @click="handleLogout" class="dropdown-item text-danger py-2 rounded-2">
                    <i class="bi bi-box-arrow-right me-2"></i> Đăng xuất
                  </button>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Modal Thông tin cá nhân -->
    <ProfileModal v-model:show="showProfileModal" />
  </nav>
</template>
