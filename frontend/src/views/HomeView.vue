<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const studyGroups = [
  { code: 'A', label: 'A / A1', vehicle: 'Xe mô tô', icon: 'bi-bicycle', color: 'primary' },
  { code: 'B', label: 'B / B1', vehicle: 'Ô tô con', icon: 'bi-car-front-fill', color: 'success' },
  { code: 'C', label: 'C / C1', vehicle: 'Xe tải', icon: 'bi-truck', color: 'warning' }
];
const selectedStudyGroupCode = ref('B');
const selectedStudyGroup = computed(() => studyGroups.find(group => group.code === selectedStudyGroupCode.value));

const startStudy = () => {
  router.push(`/study?group=${selectedStudyGroupCode.value}`);
};
</script>

<template>
  <div class="home-view">
    <section class="hero-shell py-5 position-relative overflow-hidden">
      <div class="container py-lg-4">
        <div class="row align-items-center g-5">
          <div class="col-lg-7">
            <div class="hero-badge">
              <i class="bi bi-shield-check-fill"></i>
              Chuẩn Quy Chế Sát Hạch Bộ GTVT 2026
            </div>

            <h1 class="hero-title">
              Học &amp; Thi Thử Lý Thuyết
              <span>Giấy Phép Lái Xe Trực Tuyến</span>
            </h1>

            <p class="hero-subtitle">
              Hệ thống luyện thi sát hạch lý thuyết lái xe ô tô, xe máy toàn diện với ngân hàng
              <strong>600 câu hỏi chính thức</strong>, nhận diện và cảnh báo <strong>60 câu điểm liệt</strong>,
              mô phỏng phòng thi chuẩn ma trận và tra cứu mức phạt theo <strong>Nghị định 100/123</strong>.
            </p>

            <div class="hero-actions">
              <router-link to="/exam" class="btn btn-primary btn-cta-primary">
                <i class="bi bi-play-circle-fill"></i> Thi thử sát hạch
              </router-link>
              <router-link to="/study/paralysis" class="btn btn-soft-danger btn-cta-danger">
                <i class="bi bi-exclamation-octagon-fill"></i> 60 Câu điểm liệt
              </router-link>
            </div>

            <div class="hero-trust-row">
              <div><i class="bi bi-check-circle-fill"></i> 100% Câu hỏi có giải thích</div>
              <div><i class="bi bi-lightning-charge-fill"></i> Chấm điểm tức thì</div>
              <div><i class="bi bi-phone-fill"></i> Đa thiết bị</div>
            </div>
          </div>

          <div class="col-lg-5">
            <div class="hero-card journey-card">
              <div class="journey-topline">
                <span class="hero-card-badge">
                  <i class="bi bi-stars"></i> LỘ TRÌNH GỢI Ý
                </span>
                <span class="journey-duration"><i class="bi bi-signpost-2"></i> 3 bước chinh phục</span>
              </div>

              <h3>Vững lý thuyết,<br /><span>sẵn sàng cầm lái</span></h3>
              <p class="journey-intro">Chọn nhóm bằng phù hợp để bắt đầu ôn đúng trọng tâm.</p>

              <div class="study-group-picker" role="group" aria-label="Chọn nhóm hạng để ôn tập">
                <button
                  v-for="group in studyGroups"
                  :key="group.code"
                  type="button"
                  class="study-group-option"
                  :class="{ active: selectedStudyGroupCode === group.code }"
                  :aria-pressed="selectedStudyGroupCode === group.code"
                  @click="selectedStudyGroupCode = group.code"
                >
                  <i :class="['bi', group.icon]"></i>
                  <span>{{ group.label }}</span>
                  <small>{{ group.vehicle }}</small>
                </button>
              </div>

              <div class="journey-steps">
                <div class="journey-step">
                  <span class="journey-step-number">01</span>
                  <span><strong>Ôn theo hạng</strong><small>{{ selectedStudyGroup.label }} · đúng phạm vi</small></span>
                  <i class="bi bi-check2-circle"></i>
                </div>
                <div class="journey-step">
                  <span class="journey-step-number">02</span>
                  <span><strong>Ghi nhớ câu điểm liệt</strong><small>Nắm chắc tình huống quan trọng</small></span>
                  <i class="bi bi-shield-check"></i>
                </div>
                <div class="journey-step">
                  <span class="journey-step-number">03</span>
                  <span><strong>Thi thử sát hạch</strong><small>Làm quen đề thi và thời gian</small></span>
                  <i class="bi bi-flag"></i>
                </div>
              </div>

              <div class="journey-actions">
                <button type="button" class="journey-primary-action" @click="startStudy">
                  Bắt đầu ôn {{ selectedStudyGroup.label }} <i class="bi bi-arrow-up-right"></i>
                </button>
                <router-link to="/exam" class="journey-secondary-action">
                  Thi thử ngay <i class="bi bi-arrow-right"></i>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Key Modules Highlights -->
    <section class="py-5 bg-white border-top border-bottom">
      <div class="container">
        <div class="row justify-content-center mb-5">
          <div class="col-12 col-md-10 col-lg-8 text-center">
            <span class="badge bg-primary-subtle text-primary px-3 py-1 rounded-pill fw-bold mb-2">
              Tính Năng Nổi Bật
            </span>
            <h2 class="display-6 fw-bold text-dark">Giải Pháp Luyện Thi Toàn Diện & Chuẩn Xác</h2>
            <p class="text-muted">Được thiết kế bám sát 100% phần mềm thi sát hạch lý thuyết của Tổng cục Đường bộ Việt Nam</p>
          </div>
        </div>

        <div class="row g-4">
          <!-- Card 1: 60 Câu điểm liệt -->
          <div class="col-md-6 col-lg-4">
            <div class="card-custom h-100 p-4 d-flex flex-column border-danger-subtle">
              <div class="feature-icon-box bg-danger-subtle text-danger mb-3">
                <i class="bi bi-exclamation-triangle-fill fs-3"></i>
              </div>
              <h5 class="fw-bold mb-2 text-danger">60 Câu Điểm Liệt</h5>
              <p class="text-muted small flex-grow-1">
                Các câu hỏi về tình huống mất an toàn nghiêm trọng. Chỉ cần sai 1 câu là bạn bị đánh rớt trực tiếp bài thi!
              </p>
              <router-link to="/study/paralysis" class="fw-semibold text-danger small d-inline-flex align-items-center gap-1 mt-2">
                Luyện câu điểm liệt <i class="bi bi-chevron-right"></i>
              </router-link>
            </div>
          </div>

          <!-- Card 2: Thi thử chuẩn ma trận -->
          <div class="col-md-6 col-lg-4">
            <div class="card-custom h-100 p-4 d-flex flex-column">
              <div class="feature-icon-box bg-success-subtle text-success mb-3">
                <i class="bi bi-laptop fs-3"></i>
              </div>
              <h5 class="fw-bold mb-2">Thi Thử Sát Hạch</h5>
              <p class="text-muted small flex-grow-1">
                Mô phỏng đề thi ngẫu nhiên theo đúng ma trận Bộ GTVT, có đồng hồ đếm ngược, tự động chấm điểm và đánh rớt điểm liệt.
              </p>
              <router-link to="/exam" class="fw-semibold text-success small d-inline-flex align-items-center gap-1 mt-2">
                Vào phòng thi <i class="bi bi-chevron-right"></i>
              </router-link>
            </div>
          </div>

          <!-- Card 3: Tra cứu biển báo & mức phạt -->
          <div class="col-md-6 col-lg-4">
            <div class="card-custom h-100 p-4 d-flex flex-column">
              <div class="feature-icon-box bg-warning-subtle text-warning mb-3">
                <i class="bi bi-signpost-split fs-3"></i>
              </div>
              <h5 class="fw-bold mb-2">Biển Báo & Mức Phạt</h5>
              <p class="text-muted small flex-grow-1">
                Tra cứu tức thì 5 nhóm biển báo đường bộ chuẩn QCVN 41:2019 và danh mục xử phạt giao thông theo Nghị định 100/123.
              </p>
              <router-link to="/lookup/signs" class="fw-semibold text-warning small d-inline-flex align-items-center gap-1 mt-2">
                Tra cứu ngay <i class="bi bi-chevron-right"></i>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ==========================================================================
   CHỈ ÁP DỤNG TRONG PHẠM VI HOMEVIEW.VUE
   ========================================================================== */
.home-view {
  position: relative;
  background-color: #f8fafc;
}

/* Áp dụng ảnh nền banner.webp cho khu vực Hero chính của trang chủ */
.hero-shell {
  position: relative;
  background: 
    linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(248, 250, 252, 0.6) 45%, rgba(241, 245, 249, 0.74) 100%),
    url('/banner.webp') center / cover no-repeat !important;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

/* Nâng cấp độ tương phản và hiệu ứng kính mờ cho Quick Start Card */
.hero-card {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 20px 45px -15px rgba(15, 23, 42, 0.12) !important;
}

.journey-card {
  padding: clamp(1.25rem, 2.5vw, 2rem);
  overflow: hidden;
  position: relative;
}

.journey-card::after {
  content: '';
  position: absolute;
  width: 190px;
  height: 190px;
  top: -105px;
  right: -72px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.17), transparent 70%);
  pointer-events: none;
}

.journey-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.journey-duration {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.journey-card h3 {
  position: relative;
  z-index: 1;
  margin: 0 0 0.4rem;
  color: #13223a;
  font-size: clamp(1.65rem, 2vw, 2.1rem);
  font-weight: 850;
  letter-spacing: -0.045em;
  line-height: 1.12;
}

.journey-card h3 span {
  color: #2879e9;
}

.journey-intro {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0 0 1.1rem;
}

.study-group-picker {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.study-group-option {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.05rem 0.45rem;
  min-width: 0;
  padding: 0.65rem 0.7rem;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  color: #334155;
  text-align: left;
  transition: 180ms ease;
}

.study-group-option:hover {
  border-color: rgba(37, 99, 235, 0.4);
  transform: translateY(-2px);
}

.study-group-option.active {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 5px 14px rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}

.study-group-option > i {
  grid-row: span 2;
  font-size: 1.1rem;
}

.study-group-option > span {
  overflow: hidden;
  font-size: 0.82rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.study-group-option small {
  overflow: hidden;
  color: #64748b;
  font-size: 0.67rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.journey-steps {
  display: grid;
  gap: 0.15rem;
  margin-bottom: 1.1rem;
  padding: 0.35rem 0;
}

.journey-step {
  display: grid;
  grid-template-columns: 2rem 1fr auto;
  align-items: center;
  gap: 0.7rem;
  min-height: 3.2rem;
}

.journey-step-number {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 50%;
  background: #eaf2ff;
  color: #2879e9;
  font-size: 0.7rem;
  font-weight: 800;
}

.journey-step > span:nth-child(2) {
  display: grid;
  gap: 0.1rem;
}

.journey-step strong {
  color: #26364d;
  font-size: 0.84rem;
}

.journey-step small {
  color: #75839a;
  font-size: 0.75rem;
}

.journey-step > i {
  color: #4b8ce8;
  font-size: 1rem;
}

.journey-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.75rem;
}

.journey-primary-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.85rem 1rem;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(110deg, #2879e9, #1d5fd0);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.2);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 800;
  transition: 180ms ease;
}

.journey-primary-action:hover {
  box-shadow: 0 11px 22px rgba(37, 99, 235, 0.28);
  transform: translateY(-1px);
}

.journey-secondary-action {
  color: #285d9f;
  font-size: 0.82rem;
  font-weight: 750;
  text-decoration: none;
  white-space: nowrap;
}

.journey-secondary-action:hover {
  color: #1d4ed8;
}

/* Đảm bảo chữ tiêu đề và mô tả luôn sắc nét, tương phản tối ưu trên nền ảnh */
.hero-title {
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.85);
}

.hero-subtitle {
  color: #334155 !important;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.7);
}

.hero-badge {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
}

.hero-trust-row {
  border-top-color: rgba(148, 163, 184, 0.35) !important;
}

@media (max-width: 575.98px) {
  .journey-topline {
    align-items: flex-start;
    flex-direction: column;
  }

  .study-group-picker {
    gap: 0.4rem;
  }

  .study-group-option {
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 0.15rem;
    padding: 0.6rem 0.3rem;
    text-align: center;
  }

  .study-group-option > i {
    grid-row: auto;
  }

  .study-group-option > span {
    font-size: 0.74rem;
  }

  .study-group-option small {
    font-size: 0.63rem;
  }

  .journey-actions {
    grid-template-columns: 1fr;
    justify-items: stretch;
  }

  .journey-secondary-action {
    justify-self: center;
  }
}
</style>
