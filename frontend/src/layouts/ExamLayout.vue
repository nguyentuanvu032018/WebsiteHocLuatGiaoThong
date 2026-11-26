<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Swal from 'sweetalert2';

const router = useRouter();
const authStore = useAuthStore();
const isFullscreen = ref(false);

const userName = computed(() => authStore.userName);

// Bật / tắt chế độ toàn màn hình
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      isFullscreen.value = true;
    }).catch(() => {});
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        isFullscreen.value = false;
      }).catch(() => {});
    }
  }
};

// Cảnh báo rời khỏi phòng thi
const confirmExitExam = async () => {
  const result = await Swal.fire({
    title: 'Rời khỏi phòng thi?',
    text: 'Bài làm chưa nộp sẽ không được ghi nhận kết quả. Bạn có chắc chắn muốn thoát?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Rời phòng thi',
    cancelButtonText: 'Tiếp tục làm bài'
  });

  if (result.isConfirmed) {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    router.push('/exam');
  }
};
</script>

<template>
  <div class="exam-layout-root vh-100 d-flex flex-column overflow-hidden">
    <!-- Header Chuyên dụng cho Phòng thi (Distraction-free) -->
    <header class="exam-header-bar d-flex align-items-center justify-content-between px-3 px-md-4 py-2 text-white">
      <!-- Left: Logo & Exam Badge -->
      <div class="d-flex align-items-center gap-2">
        <img src="/logo.png" alt="Logo" class="rounded-2 bg-white p-1 shadow-sm" style="width: 38px; height: 38px; object-fit: contain;" />
        <div>
          <div class="fw-bold lh-1 text-white">PHÒNG THI SÁT HẠCH LÝ THUYẾT</div>
          <span class="badge bg-danger rounded-pill px-2 py-0 mt-1 fs-xxs">
            <i class="bi bi-record-fill text-white animate-blink me-1"></i> Đang diễn ra
          </span>
        </div>
      </div>

      <!-- Center: Slot cho Header Info (Đồng hồ đếm ngược, Hạng bằng từ ExamRoomView) -->
      <div id="exam-header-portal" class="d-flex align-items-center">
        <!-- Teleport target nếu view con muốn truyền đồng hồ vào đây -->
      </div>

      <!-- Right: Thí sinh & Điều khiển toàn màn hình / Thoát -->
      <div class="d-flex align-items-center gap-3">
        <!-- Candidate badge -->
        <div class="d-none d-md-flex align-items-center gap-2 bg-dark-subtle px-3 py-1 rounded-pill border border-secondary border-opacity-25">
          <i class="bi bi-person-badge-fill text-primary"></i>
          <span class="small fw-semibold text-light text-truncate">
            {{ userName }}
          </span>
        </div>

        <!-- Fullscreen toggle -->
        <button 
          @click="toggleFullscreen" 
          class="btn btn-sm btn-outline-light border-opacity-25 d-none d-sm-inline-flex"
          :title="isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'"
        >
          <i :class="isFullscreen ? 'bi bi-fullscreen-exit' : 'bi bi-fullscreen'"></i>
        </button>

        <!-- Exit Button -->
        <button 
          @click="confirmExitExam" 
          class="btn btn-sm btn-danger-gradient"
          title="Rời khỏi phòng thi"
        >
          <i class="bi bi-door-open"></i>
          <span class="d-none d-sm-inline">Rời phòng thi</span>
        </button>
      </div>
    </header>

    <!-- Nội dung chính phòng thi (Chiếm toàn bộ không gian còn lại) -->
    <main class="exam-body-container flex-grow-1 overflow-hidden position-relative">
      <slot />
    </main>
  </div>
</template>
