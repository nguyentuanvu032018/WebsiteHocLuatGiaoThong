<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import apiClient, { resolveAssetUrl } from '../../services/api';
import Swal from 'sweetalert2';

const router = useRouter();

// ─── Trạng thái chế độ: 'upload' (chọn ảnh) hoặc 'camera' (quét qua webcam) ───
const activeMode = ref('upload'); // 'upload' | 'camera'

// ─── State cho chế độ Upload ──────────────────────────────────────────────────
const selectedFile = ref(null);
const previewUrl = ref(null);
const isDragging = ref(false);

// ─── State cho chế độ Camera ──────────────────────────────────────────────────
const videoRef = ref(null);
const canvasRef = ref(null);
const isCameraActive = ref(false);
const facingMode = ref('environment'); // 'environment' (cam sau) | 'user' (cam trước)
const cameraError = ref('');
let mediaStream = null;

// ─── State chung cho xử lý AI & Kết quả ───────────────────────────────────────
const isAnalyzing = ref(false);
const recognitionResult = ref(null);
const errorMessage = ref('');

// ─── Xử lý Upload ảnh ─────────────────────────────────────────────────────────
function onFileChange(event) {
  const file = event.target.files?.[0];
  if (file) {
    handleSelectedFile(file);
  }
}

function onDrop(event) {
  isDragging.value = false;
  const file = event.dataTransfer.files?.[0];
  if (file) {
    handleSelectedFile(file);
  }
}

function handleSelectedFile(file) {
  if (!file.type.startsWith('image/')) {
    Swal.fire({
      icon: 'warning',
      title: 'Định dạng không hỗ trợ',
      text: 'Vui lòng chọn tệp tin hình ảnh (JPG, PNG, WEBP, GIF)'
    });
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    Swal.fire({
      icon: 'warning',
      title: 'Kích thước quá lớn',
      text: 'Vui lòng chọn ảnh dung lượng dưới 10MB'
    });
    return;
  }

  selectedFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
  recognitionResult.value = null;
  errorMessage.value = '';
}

function clearUpload() {
  selectedFile.value = null;
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
  recognitionResult.value = null;
  errorMessage.value = '';
}

// ─── Xử lý Camera / Webcam ────────────────────────────────────────────────────
async function startCamera() {
  cameraError.value = '';
  errorMessage.value = '';
  try {
    if (mediaStream) {
      stopCamera();
    }

    const constraints = {
      video: {
        facingMode: facingMode.value,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream;
      await videoRef.value.play();
      isCameraActive.value = true;
    }
  } catch (err) {
    console.error('[SignRecognition] Lỗi truy cập Camera:', err);
    isCameraActive.value = false;
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      cameraError.value = 'Bạn chưa cấp quyền truy cập Camera cho trình duyệt. Vui lòng cho phép Camera trong cài đặt trình duyệt để sử dụng tính năng này.';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      cameraError.value = 'Không tìm thấy thiết bị Camera / Webcam trên máy tính hoặc điện thoại của bạn.';
    } else {
      cameraError.value = `Không thể kích hoạt Camera (${err.message || 'Lỗi không xác định'}). Bạn có thể chuyển sang chế độ "Chọn ảnh từ thiết bị" để tiếp tục.`;
    }
  }
}

function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
  isCameraActive.value = false;
}

async function switchCamera() {
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment';
  await startCamera();
}

function captureFrame() {
  if (!videoRef.value || !isCameraActive.value) return null;

  const video = videoRef.value;
  const canvas = canvasRef.value || document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.9);
}

// Chuyển tab giữa Upload và Camera
function setMode(mode) {
  activeMode.value = mode;
  errorMessage.value = '';
  if (mode === 'camera') {
    startCamera();
  } else {
    stopCamera();
  }
}

// ─── Gửi yêu cầu nhận diện tới Backend ─────────────────────────────────────────
async function analyzeUploadImage() {
  if (!selectedFile.value) return;

  isAnalyzing.value = true;
  errorMessage.value = '';

  const formData = new FormData();
  formData.append('image', selectedFile.value);

  try {
    const res = await apiClient.post('/lookup/signs/recognize-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (res.success && res.data) {
      recognitionResult.value = res.data;
    } else {
      throw new Error(res.message || 'Không thể nhận diện biển báo');
    }
  } catch (err) {
    errorMessage.value = err.message || 'Có lỗi xảy ra khi phân tích ảnh. Vui lòng thử lại với góc chụp rõ nét hơn.';
  } finally {
    isAnalyzing.value = false;
  }
}

async function captureAndAnalyze() {
  const base64Data = captureFrame();
  if (!base64Data) {
    Swal.fire({
      icon: 'warning',
      title: 'Camera chưa sẵn sàng',
      text: 'Vui lòng chờ camera bật lên rồi thử lại'
    });
    return;
  }

  // Tạm dừng video để người dùng thấy ảnh chụp
  previewUrl.value = base64Data;
  isAnalyzing.value = true;
  errorMessage.value = '';

  try {
    const res = await apiClient.post('/lookup/signs/recognize-camera', { image: base64Data });
    if (res.success && res.data) {
      recognitionResult.value = res.data;
    } else {
      throw new Error(res.message || 'Không thể nhận diện biển báo từ camera');
    }
  } catch (err) {
    errorMessage.value = err.message || 'Có lỗi xảy ra khi phân tích ảnh camera. Vui lòng chụp rõ biển báo hơn.';
  } finally {
    isAnalyzing.value = false;
  }
}

function resetRecognition() {
  recognitionResult.value = null;
  errorMessage.value = '';
  if (activeMode.value === 'camera' && !isCameraActive.value) {
    startCamera();
  }
}

// Đóng camera khi rời khỏi component
onBeforeUnmount(() => {
  stopCamera();
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<template>
  <div class="sign-recognition-page bg-light min-vh-100 py-4 py-lg-5">
    <div class="container">

      <!-- ── Breadcrumb Điều Hướng ── -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb small">
          <li class="breadcrumb-item"><router-link to="/" class="text-decoration-none">Trang chủ</router-link></li>
          <li class="breadcrumb-item"><router-link to="/lookup/signs" class="text-decoration-none">Tra cứu luật</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">Nhận diện biển báo AI</li>
        </ol>
      </nav>

      <!-- ── Header Banner ── -->
      <div class="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden hero-card">
        <div class="card-body p-4 p-lg-5 text-white position-relative">
          <div class="row align-items-center">
            <div class="col-lg-8">
              <span class="badge bg-white text-primary px-3 py-1 rounded-pill fw-bold mb-2 shadow-sm">
                <i class="bi bi-cpu me-1"></i> AI Computer Vision • ResNet-50
              </span>
              <h2 class="fw-bolder mb-2">Nhận Diện Biển Báo Giao Thông Bằng AI</h2>
              <p class="text-white-50 mb-0">
                Sử dụng mô hình mạng nơ-ron tích chập ResNet-50 sâu 50 tầng được huấn luyện trên tập dữ liệu biển báo đường bộ Việt Nam. 
                Hệ thống tự động phân loại biển báo, tra cứu quy chuẩn, giải thích ý nghĩa và cung cấp hướng dẫn lái xe an toàn.
              </p>
            </div>
            <div class="col-lg-4 text-center text-lg-end mt-3 mt-lg-0">
              <router-link to="/lookup/signs" class="btn btn-outline-light rounded-pill px-3 py-2 btn-sm">
                <i class="bi bi-signpost-2 me-1"></i> Xem danh mục 53 biển báo
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Main Grid ── -->
      <div class="row g-4">
        
        <!-- Cột bên trái: Khung điều khiển & Tải ảnh / Camera -->
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-body p-4">

              <!-- Toggle Chọn Chế Độ -->
              <div class="d-flex p-1 bg-light rounded-3 mb-4 border">
                <button 
                  type="button" 
                  class="btn flex-fill rounded-3 py-2 fw-semibold transition-all small"
                  :class="activeMode === 'upload' ? 'btn-white bg-white shadow-sm text-primary' : 'text-secondary'"
                  @click="setMode('upload')"
                >
                  <i class="bi bi-image me-1"></i> Tải ảnh từ thiết bị
                </button>
                <button 
                  type="button" 
                  class="btn flex-fill rounded-3 py-2 fw-semibold transition-all small"
                  :class="activeMode === 'camera' ? 'btn-white bg-white shadow-sm text-primary' : 'text-secondary'"
                  @click="setMode('camera')"
                >
                  <i class="bi bi-camera-fill me-1"></i> Quét trực tiếp qua Camera
                </button>
              </div>

              <!-- ══════════════════════════════════════════
                   CHẾ ĐỘ 1: TẢI ẢNH TỪ THIẾT BỊ
              ══════════════════════════════════════════ -->
              <div v-if="activeMode === 'upload'">
                <!-- Khung Drag & Drop khi chưa chọn ảnh -->
                <div 
                  v-if="!previewUrl"
                  class="upload-dropzone p-5 text-center rounded-4 border-2 border-dashed position-relative cursor-pointer"
                  :class="{ 'dragging border-primary bg-primary-subtle': isDragging }"
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @drop.prevent="onDrop"
                >
                  <input 
                    type="file" 
                    class="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
                    accept="image/*"
                    @change="onFileChange"
                  />
                  <div class="upload-icon-circle mx-auto mb-3 bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center">
                    <i class="bi bi-cloud-arrow-up-fill fs-2"></i>
                  </div>
                  <h5 class="fw-bold mb-1 text-dark">Kéo thả ảnh biển báo vào đây</h5>
                  <p class="text-secondary small mb-3">hoặc nhấn để duyệt tệp tin từ máy tính / điện thoại của bạn</p>
                  <span class="badge bg-light text-secondary border px-3 py-2 rounded-pill small">
                    Hỗ trợ JPG, PNG, WEBP (Tối đa 10MB)
                  </span>
                </div>

                <!-- Khung Xem Trước Ảnh Đã Chọn -->
                <div v-else class="text-center">
                  <div class="preview-box position-relative rounded-4 overflow-hidden mb-3 bg-dark d-flex align-items-center justify-content-center border" style="min-height: 280px; max-height: 380px;">
                    <img :src="previewUrl" alt="Ảnh biển báo" class="img-fluid rounded-3" style="max-height: 360px; object-fit: contain;" />
                    
                    <!-- Hiệu ứng Scanning Animation khi AI đang phân tích -->
                    <div v-if="isAnalyzing" class="scanner-overlay">
                      <div class="scanner-laser"></div>
                      <div class="scanner-grid"></div>
                      <div class="scanner-text text-white fw-bold">
                        <span class="spinner-border spinner-border-sm me-2"></span>Đang trích xuất đặc trưng mạng ResNet-50...
                      </div>
                    </div>
                  </div>

                  <div class="d-flex gap-2 justify-content-center">
                    <button 
                      type="button" 
                      class="btn btn-outline-secondary rounded-pill px-3 py-2 btn-sm"
                      @click="clearUpload"
                      :disabled="isAnalyzing"
                    >
                      <i class="bi bi-arrow-repeat me-1"></i> Chọn ảnh khác
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-primary rounded-pill px-4 py-2 shadow-sm"
                      @click="analyzeUploadImage"
                      :disabled="isAnalyzing"
                    >
                      <span v-if="isAnalyzing" class="spinner-border spinner-border-sm me-1"></span>
                      <i v-else class="bi bi-stars me-1"></i>
                      {{ isAnalyzing ? 'Đang nhận diện...' : 'Nhận diện ngay' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- ══════════════════════════════════════════
                   CHẾ ĐỘ 2: QUÉT QUA CAMERA TRỰC TIẾP
              ══════════════════════════════════════════ -->
              <div v-if="activeMode === 'camera'">
                <!-- Cảnh báo lỗi Camera nếu có -->
                <div v-if="cameraError" class="alert alert-warning rounded-3 small p-3 mb-3">
                  <i class="bi bi-exclamation-triangle-fill fs-5 me-2 text-warning"></i>
                  <div>{{ cameraError }}</div>
                  <div class="mt-2">
                    <button class="btn btn-sm btn-outline-primary rounded-pill" @click="startCamera">
                      <i class="bi bi-arrow-clockwise me-1"></i> Thử lại
                    </button>
                    <button class="btn btn-sm btn-link text-decoration-none ms-2" @click="setMode('upload')">
                      Chuyển sang tải ảnh
                    </button>
                  </div>
                </div>

                <!-- Khung Video Camera -->
                <div class="camera-viewport position-relative rounded-4 overflow-hidden mb-3 bg-black d-flex align-items-center justify-content-center border" style="min-height: 280px; max-height: 380px;">
                  <video 
                    ref="videoRef" 
                    class="w-100 h-100 rounded-3" 
                    autoplay 
                    playsinline 
                    muted
                    style="object-fit: cover; max-height: 360px;"
                  ></video>

                  <!-- Khung ngắm nhắm mục tiêu (Target Reticle) -->
                  <div v-if="isCameraActive && !isAnalyzing" class="camera-reticle">
                    <div class="reticle-corner top-left"></div>
                    <div class="reticle-corner top-right"></div>
                    <div class="reticle-corner bottom-left"></div>
                    <div class="reticle-corner bottom-right"></div>
                    <span class="reticle-hint badge bg-dark bg-opacity-75 text-white px-3 py-1 rounded-pill small">
                      <i class="bi bi-arrows-angle-expand me-1"></i> Căn biển báo vào giữa khung hình
                    </span>
                  </div>

                  <!-- Hiệu ứng Scanning Animation -->
                  <div v-if="isAnalyzing" class="scanner-overlay">
                    <div class="scanner-laser"></div>
                    <div class="scanner-grid"></div>
                    <div class="scanner-text text-white fw-bold">
                      <span class="spinner-border spinner-border-sm me-2"></span>Đang phân tích khung hình camera...
                    </div>
                  </div>

                  <!-- Trạng thái camera tắt -->
                  <div v-if="!isCameraActive && !cameraError" class="text-center p-4 text-white-50">
                    <i class="bi bi-camera-video-off fs-1 d-block mb-2"></i>
                    <span>Camera đang tắt</span>
                  </div>
                </div>

                <!-- Canvas ẩn phục vụ chụp frame -->
                <canvas ref="canvasRef" class="d-none"></canvas>

                <!-- Các nút điều khiển Camera -->
                <div class="d-flex flex-wrap gap-2 justify-content-center">
                  <button 
                    v-if="!isCameraActive" 
                    type="button" 
                    class="btn btn-success rounded-pill px-4 py-2 shadow-sm"
                    @click="startCamera"
                  >
                    <i class="bi bi-camera-video me-1"></i> Bật Camera
                  </button>

                  <template v-else>
                    <button 
                      type="button" 
                      class="btn btn-outline-secondary rounded-pill px-3 py-2 btn-sm"
                      @click="switchCamera"
                      :disabled="isAnalyzing"
                      title="Chuyển Camera trước/sau"
                    >
                      <i class="bi bi-arrow-repeat me-1"></i> Đổi Camera
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-primary rounded-pill px-4 py-2 shadow-sm fw-bold"
                      @click="captureAndAnalyze"
                      :disabled="isAnalyzing"
                    >
                      <span v-if="isAnalyzing" class="spinner-border spinner-border-sm me-1"></span>
                      <i v-else class="bi bi-camera me-1"></i>
                      {{ isAnalyzing ? 'Đang phân tích...' : 'Chụp & Nhận diện' }}
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-outline-danger rounded-pill px-3 py-2 btn-sm"
                      @click="stopCamera"
                      :disabled="isAnalyzing"
                    >
                      <i class="bi bi-stop-circle me-1"></i> Tắt
                    </button>
                  </template>
                </div>
              </div>

              <!-- Alert Lỗi nếu nhận diện thất bại -->
              <div v-if="errorMessage" class="alert alert-danger rounded-3 p-3 mt-3 small d-flex align-items-center">
                <i class="bi bi-exclamation-circle-fill fs-5 me-2 text-danger flex-shrink-0"></i>
                <div>{{ errorMessage }}</div>
              </div>

            </div>
          </div>
        </div>

        <!-- Cột bên phải: Khung hiển thị Kết quả Phân tích AI -->
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 class="fw-bolder mb-0 text-dark d-flex align-items-center gap-2">
                <i class="bi bi-check2-circle text-primary"></i> Kết Quả Nhận Diện AI
              </h5>
              <span v-if="recognitionResult" class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill">
                Đã xử lý xong
              </span>
            </div>

            <div class="card-body p-4">
              
              <!-- Khi chưa có kết quả nhận diện -->
              <div v-if="!recognitionResult && !isAnalyzing" class="text-center py-5 text-secondary">
                <div class="empty-icon-circle mx-auto mb-3 bg-light text-muted rounded-circle d-flex align-items-center justify-content-center">
                  <i class="bi bi-search fs-1"></i>
                </div>
                <h6 class="fw-bold text-dark mb-1">Chưa có kết quả nhận diện</h6>
                <p class="small text-muted mb-0" style="max-width: 340px; margin: 0 auto;">
                  Vui lòng tải lên ảnh biển báo hoặc sử dụng camera quét trực tiếp để xem kết quả phân tích thời gian thực.
                </p>
              </div>

              <!-- Khi đang phân tích -->
              <div v-else-if="isAnalyzing" class="text-center py-5">
                <div class="spinner-grow text-primary mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
                <h6 class="fw-bold text-dark mb-1">Mạng nơ-ron ResNet-50 đang phân tích...</h6>
                <p class="small text-muted mb-0">Trích xuất đặc trưng hình học, viền màu sắc và đối chiếu với 51 lớp biển báo chuẩn.</p>
              </div>

              <!-- Khi đã có kết quả nhận diện -->
              <div v-else-if="recognitionResult" class="result-container">

                <!-- Thẻ Tên Biển Báo & Độ Chính Xác -->
                <div class="card border-0 bg-primary-subtle rounded-3 p-3 mb-3">
                  <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                      <small class="text-uppercase text-primary fw-bold letter-spacing-wide fs-xs">
                        Biển báo phát hiện:
                      </small>
                      <h4 class="fw-bolder text-primary mb-0 mt-1">
                        {{ recognitionResult.className }}
                      </h4>
                    </div>
                    <div class="text-end">
                      <small class="text-secondary d-block fs-xs">Độ tin cậy</small>
                      <span 
                        class="badge fs-6 px-3 py-2 rounded-pill fw-bolder shadow-sm"
                        :class="recognitionResult.confidence >= 80 ? 'bg-success text-white' : (recognitionResult.confidence >= 50 ? 'bg-warning text-dark' : 'bg-secondary text-white')"
                      >
                        <i class="bi bi-shield-check me-1"></i>{{ recognitionResult.confidence }}%
                      </span>
                    </div>
                  </div>
                </div>

                <!-- So khớp với Biển báo chuẩn Bộ GTVT trong hệ thống -->
                <div v-if="recognitionResult.matchedSign" class="card border border-light-subtle rounded-3 p-3 mb-3 bg-white">
                  <div class="d-flex align-items-center gap-3">
                    <div class="matched-sign-img-box rounded-3 border p-1 bg-light flex-shrink-0" style="width: 72px; height: 72px;">
                      <img 
                        :src="resolveAssetUrl(recognitionResult.matchedSign.image_url)" 
                        :alt="recognitionResult.matchedSign.name"
                        class="w-100 h-100 object-fit-contain"
                        @error="$event.target.src = '/logo.png'"
                      />
                    </div>
                    <div class="flex-grow-1">
                      <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge bg-danger text-white rounded-pill px-2 py-1 fs-xs fw-bold">
                          {{ recognitionResult.matchedSign.sign_code }}
                        </span>
                        <span class="badge bg-secondary-subtle text-secondary rounded-pill px-2 py-1 fs-xs">
                          {{ recognitionResult.matchedSign.category_name || 'Biển báo giao thông' }}
                        </span>
                      </div>
                      <h6 class="fw-bold mb-1 text-dark">{{ recognitionResult.matchedSign.name }}</h6>
                      <small class="text-muted d-block text-truncate-2">{{ recognitionResult.matchedSign.description }}</small>
                    </div>
                  </div>
                </div>

                <!-- Thông tin Quy định & Ý nghĩa -->
                <div class="mb-3">
                  <label class="form-label small fw-bold text-dark mb-1">
                    <i class="bi bi-info-circle text-primary me-1"></i> Ý nghĩa biển báo:
                  </label>
                  <div class="p-3 bg-light rounded-3 small text-dark border-start border-primary border-3">
                    {{ recognitionResult.meaning }}
                  </div>
                </div>

                <!-- Lời khuyên an toàn giao thông -->
                <div class="mb-3">
                  <label class="form-label small fw-bold text-dark mb-1">
                    <i class="bi bi-shield-exclamation text-warning me-1"></i> Hướng dẫn lái xe an toàn:
                  </label>
                  <div class="p-3 bg-warning-subtle text-dark rounded-3 small border-start border-warning border-3">
                    {{ recognitionResult.advice }}
                  </div>
                </div>

                <!-- Top 3 dự đoán liên quan -->
                <div v-if="recognitionResult.topPredictions && recognitionResult.topPredictions.length > 1" class="mb-3">
                  <label class="form-label small fw-bold text-secondary mb-2">
                    <i class="bi bi-bar-chart me-1"></i> Các phán đoán khác có xác suất cao:
                  </label>
                  <div class="d-flex flex-column gap-2">
                    <div 
                      v-for="(pred, idx) in recognitionResult.topPredictions.slice(1)" 
                      :key="idx" 
                      class="d-flex align-items-center justify-content-between p-2 bg-light rounded-2 small"
                    >
                      <span class="text-truncate me-2 text-secondary">{{ idx + 2 }}. {{ pred.className }}</span>
                      <span class="badge bg-light text-secondary border px-2 py-1">{{ pred.confidence }}%</span>
                    </div>
                  </div>
                </div>

                <!-- Nút thao tác tiếp theo -->
                <div class="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                  <router-link to="/lookup/signs" class="btn btn-outline-secondary rounded-pill btn-sm px-3">
                    <i class="bi bi-list-ul me-1"></i> Tra cứu danh mục
                  </router-link>
                  <button type="button" class="btn btn-primary rounded-pill btn-sm px-3" @click="resetRecognition">
                    <i class="bi bi-arrow-repeat me-1"></i> Quét biển báo khác
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.hero-card {
  background: linear-gradient(135deg, #1a56db 0%, #1e40af 50%, #0e7490 100%);
}

.upload-dropzone {
  border-color: #cbd5e1;
  background-color: #f8fafc;
  transition: all 0.2s ease;
}

.upload-dropzone:hover {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.upload-icon-circle,
.empty-icon-circle {
  width: 64px;
  height: 64px;
}

.cursor-pointer {
  cursor: pointer;
}

.transition-all {
  transition: all 0.2s ease;
}

/* Reticle căn khung Camera */
.camera-reticle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 220px;
  height: 220px;
  pointer-events: none;
}

.reticle-corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: #38bdf8;
  border-style: solid;
}

.reticle-corner.top-left {
  top: 0;
  left: 0;
  border-width: 3px 0 0 3px;
}

.reticle-corner.top-right {
  top: 0;
  right: 0;
  border-width: 3px 3px 0 0;
}

.reticle-corner.bottom-left {
  bottom: 0;
  left: 0;
  border-width: 0 0 3px 3px;
}

.reticle-corner.bottom-right {
  bottom: 0;
  right: 0;
  border-width: 0 3px 3px 0;
}

.reticle-hint {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 11px;
}

/* Scanner Laser & Grid Effect */
.scanner-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  backdrop-filter: blur(2px);
}

.scanner-laser {
  position: absolute;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, transparent, #38bdf8, #60a5fa, transparent);
  box-shadow: 0 0 15px #38bdf8;
  animation: scanLaser 2s ease-in-out infinite alternate;
}

.scanner-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
}

.scanner-text {
  position: relative;
  z-index: 2;
  font-size: 14px;
  letter-spacing: 0.3px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
}

@keyframes scanLaser {
  0% {
    top: 10%;
  }
  100% {
    top: 90%;
  }
}

.fs-xs {
  font-size: 12px;
}

.fs-xxs {
  font-size: 10px;
}

.letter-spacing-wide {
  letter-spacing: 0.8px;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

