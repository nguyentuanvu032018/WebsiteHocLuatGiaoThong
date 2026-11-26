const aiSignService = require('../services/aiSign.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Controller Nhận diện Biển báo Giao thông bằng AI
 */
class AISignController {
  /**
   * POST /api/v1/lookup/signs/recognize-file
   * Nhận diện biển báo từ tệp ảnh người dùng tải lên
   */
  recognizeFromFile = async (req, res, next) => {
    try {
      if (!req.file) {
        return errorResponse(res, 'Vui lòng tải lên tệp tin hình ảnh cần nhận diện', 400);
      }

      const result = await aiSignService.recognizeFromFile(req.file);
      return successResponse(res, result, 'Nhận diện biển báo thành công!');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return errorResponse(res, error.message || 'Lỗi khi nhận diện biển báo bằng AI', 500);
    }
  };

  /**
   * POST /api/v1/lookup/signs/recognize-camera
   * Nhận diện biển báo từ ảnh chụp trực tiếp qua Camera
   */
  recognizeFromCamera = async (req, res, next) => {
    try {
      const { image } = req.body;
      if (!image) {
        return errorResponse(res, 'Không tìm thấy dữ liệu hình ảnh từ Camera', 400);
      }

      const result = await aiSignService.recognizeFromCamera(image);
      return successResponse(res, result, 'Nhận diện biển báo từ Camera thành công!');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return errorResponse(res, error.message || 'Lỗi khi nhận diện biển báo từ Camera', 500);
    }
  };
}

module.exports = new AISignController();

