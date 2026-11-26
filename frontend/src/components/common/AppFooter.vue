<script setup>
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="app-footer mt-auto">
    <div class="container py-5">
      <div class="row g-4">
        <!-- Cột 1: Thông tin hệ thống -->
        <div class="col-lg-4 col-md-6">
          <div class="d-flex align-items-center gap-2 mb-3">
            <img src="/logo.png" alt="Logo Luật Giao Thông" class="footer-logo-img" />
            <div>
              <div class="fw-bold fs-5 text-white">Tập Lái 24h</div>
              <div class="text-white-50 small fw-semibold">SÁT HẠCH LÝ THUYẾT 600 CÂU</div>
            </div>
          </div>
          <p class="text-secondary small mb-3 lh-base">
            Phần mềm học và thi thử lý thuyết giấy phép lái xe ô tô, mô tô trực tuyến. 
            Dữ liệu chuẩn 600 câu hỏi sát hạch của Tổng cục Đường bộ Việt Nam.
          </p>
          <div class="d-flex gap-2">
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle">
              <i class="bi bi-patch-check-fill me-1"></i> Chuẩn 2026
            </span>
            <span class="badge bg-danger-subtle text-danger border border-danger-subtle">
              <i class="bi bi-exclamation-triangle-fill me-1"></i> 60 Điểm liệt
            </span>
          </div>
        </div>

        <!-- Cột 2: Danh mục ôn tập -->
        <div class="col-lg-2 col-md-6 col-6">
          <h6 class="text-white fw-bold mb-3">Ôn tập lý thuyết</h6>
          <ul class="list-unstyled small">
            <li class="mb-2">
              <router-link to="/study/paralysis" class="footer-link text-danger fw-semibold">
                <i class="bi bi-star-fill text-danger me-1"></i> 60 Câu điểm liệt
              </router-link>
            </li>
            <li class="mb-2">
              <router-link to="/lookup/signs" class="footer-link">Biển báo đường bộ</router-link>
            </li>
            <li class="mb-2">
              <router-link to="/lookup/fines" class="footer-link">Mức phạt Nghị định 100</router-link>
            </li>
          </ul>
        </div>

        <!-- Cột 3: Hạng bằng sát hạch -->
        <div class="col-lg-3 col-md-6 col-6">
          <h6 class="text-white fw-bold mb-3">Hạng giấy phép lái xe</h6>
          <ul class="list-unstyled small">
            <li class="mb-2">
              <router-link to="/exam" class="footer-link">Hạng A, A1 (Xe máy)</router-link>
            </li>
            <li class="mb-2">
              <router-link to="/exam" class="footer-link">Hạng B, B1 (Ô tô)</router-link>
            </li>
            <li class="mb-2">
              <router-link to="/exam" class="footer-link">Hạng C, C1 (Xe tải)</router-link>
            </li>
            <li class="mb-2">
              <router-link to="/exam" class="footer-link">Hạng D, D1, D2 (Xe khách & chuyên dùng)</router-link>
            </li>
          </ul>
        </div>

        <!-- Cột 4: Thông tin đồ án CT466 -->
        <div class="col-lg-3 col-md-6">
          <h6 class="text-white fw-bold mb-3">Đồ án môn học</h6>
          <div class="bg-secondary bg-opacity-10 border border-secondary border-opacity-25 rounded-3 p-3 mb-2">
            <div class="fw-semibold text-white small mb-1">
              <i class="bi bi-mortarboard-fill text-primary me-1"></i> Niên Luận Ngành CT466
            </div>
            <div class="text-white-50 fs-xs">
              Hệ thống Học và Thi thử Luật Giao thông Đường bộ Trực tuyến
            </div>
            <div class="text-white-50 mt-2 border-top border-secondary border-opacity-25 pt-2 fs-xs">
              Công nghệ: Vue.js 3, Bootstrap 5, node.js, MySQL 8
            </div>
          </div>
        </div>
      </div>

      <hr class="border-secondary my-4 opacity-25" />

      <!-- Bottom Bar (Bootstrap flex layout) -->
      <div class="d-flex flex-column flex-md-row align-items-center justify-content-between text-white-50 small gap-2">
        <div>
          &copy; {{ currentYear }} <strong>Đồ án Niên luận Ngành CT466</strong>. Thiết kế chuẩn theo giáo trình Tổng cục Đường bộ Việt Nam.
        </div>
        <div class="d-flex gap-3">
          <span>Quy chế sát hạch Bộ GTVT</span>
          <span>&bull;</span>
          <span>Nghị định 100/123/NĐ-CP</span>
        </div>
      </div>
    </div>
  </footer>
</template>
