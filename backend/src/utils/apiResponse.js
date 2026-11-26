/**
 * Chuẩn hóa cấu trúc phản hồi API (Standardized API Response)
 */

const successResponse = (res, data = {}, message = 'Thành công', statusCode = 200, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  });
};

const errorResponse = (res, message = 'Đã có lỗi xảy ra', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
    meta: {
      timestamp: new Date().toISOString()
    }
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
};
