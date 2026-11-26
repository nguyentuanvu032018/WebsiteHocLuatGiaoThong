const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const TrafficSignModel = require('../models/trafficSign.model');

/**
 * Lớp Dịch vụ Nhận diện Biển báo Giao thông bằng AI (AI Sign Recognition Service)
 * Tích hợp mô hình ResNet50 (best_resnet50_traffic_signs.pth)
 */
class AISignService {
  constructor() {
    this.scriptPath = path.join(__dirname, '../ai-models/predict.py');
    // Xác định đường dẫn thực thi Python
    this.pythonExecutable = process.env.PYTHON_PATH || 
      (process.platform === 'win32' 
        ? 'C:\\Users\\Admin\\AppData\\Local\\Programs\\Python\\Python312\\python.exe' 
        : 'python3');

    // Nếu đường dẫn cố định không tồn tại thì fallback về 'python'
    if (process.platform === 'win32' && !fs.existsSync(this.pythonExecutable)) {
      this.pythonExecutable = 'python';
    }
  }

  /**
   * Gọi script Python predict.py để thực hiện suy luận ảnh
   * @param {string} inputPathOrBase64 - Đường dẫn file hoặc chuỗi Base64 Data URI
   * @returns {Promise<Object>}
   */
  async runInference(inputPathOrBase64) {
    return new Promise((resolve, reject) => {
      const pyProcess = spawn(this.pythonExecutable, [this.scriptPath, inputPathOrBase64], {
        windowsHide: true,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });

      let stdoutData = '';
      let stderrData = '';

      pyProcess.stdout.on('data', (data) => {
        stdoutData += data.toString('utf-8');
      });

      pyProcess.stderr.on('data', (data) => {
        stderrData += data.toString('utf-8');
      });

      pyProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('[AISignService] Lỗi chạy Python:', stderrData || stdoutData);
          return reject(new Error(stderrData || stdoutData || `Tiến trình Python thoát với mã lỗi ${code}`));
        }

        try {
          const result = JSON.parse(stdoutData.trim());
          if (!result.success) {
            return reject(new Error(result.error || 'Nhận diện biển báo không thành công'));
          }
          resolve(result);
        } catch (parseError) {
          console.error('[AISignService] Lỗi parse JSON từ Python:', stdoutData);
          reject(new Error('Không thể phân tích dữ liệu trả về từ mô hình AI'));
        }
      });

      pyProcess.on('error', (err) => {
        console.error('[AISignService] Không thể khởi chạy Python:', err);
        reject(new Error(`Không thể khởi chạy môi trường Python AI: ${err.message}`));
      });
    });
  }

  /**
   * Khớp thông tin biển báo nhận diện được với cơ sở dữ liệu hệ thống
   * @param {string} className 
   */
  async matchWithDatabase(className) {
    return TrafficSignModel.findByRecognitionName(className);
  }

  /**
   * Nhận diện biển báo từ file ảnh đã tải lên
   * @param {Object} file - Đối tượng Multer file
   */
  async recognizeFromFile(file) {
    if (!file || !file.path) {
      const error = new Error('Vui lòng chọn hoặc tải lên một tệp tin hình ảnh biển báo hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    try {
      const rawResult = await this.runInference(file.path);
      const dbMatch = await this.matchWithDatabase(rawResult.className);

      return {
        className: rawResult.className,
        confidence: rawResult.confidence,
        meaning: rawResult.meaning,
        advice: rawResult.advice,
        topPredictions: rawResult.topPredictions || [],
        matchedSign: dbMatch
      };
    } finally {
      // Tùy chọn: Xóa file tạm sau khi nhận diện xong để tiết kiệm dung lượng
      if (fs.existsSync(file.path)) {
        fs.unlink(file.path, () => {});
      }
    }
  }

  /**
   * Nhận diện biển báo từ ảnh Base64 (từ Camera/Webcam thiết bị)
   * @param {string} base64Image - Chuỗi ảnh dạng data:image/...;base64,...
   */
  async recognizeFromCamera(base64Image) {
    if (!base64Image || typeof base64Image !== 'string') {
      const error = new Error('Dữ liệu hình ảnh từ Camera không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    // Tạo file ảnh tạm để an toàn và tránh giới hạn độ dài dòng lệnh Windows
    const tempDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `cam_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`);
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    await fs.promises.writeFile(tempFilePath, Buffer.from(base64Data, 'base64'));

    try {
      const rawResult = await this.runInference(tempFilePath);
      const dbMatch = await this.matchWithDatabase(rawResult.className);

      return {
        className: rawResult.className,
        confidence: rawResult.confidence,
        meaning: rawResult.meaning,
        advice: rawResult.advice,
        topPredictions: rawResult.topPredictions || [],
        matchedSign: dbMatch
      };
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlink(tempFilePath, () => {});
      }
    }
  }
}

module.exports = new AISignService();
