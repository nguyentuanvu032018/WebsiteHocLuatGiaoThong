const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { errorResponse } = require('../utils/apiResponse');
const { getJwtSecret } = require('../config/jwt.config');

/**
 * Middleware xác thực JWT Token
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Vui lòng đăng nhập để thực hiện thao tác này', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return errorResponse(res, 'Token xác thực không hợp lệ', 401);
    }

    // 1. Xác thực chữ ký token
    const decoded = jwt.verify(token, getJwtSecret());

    // 2. Tìm kiếm người dùng thông qua UserModel
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return errorResponse(res, 'Tài khoản không tồn tại trên hệ thống', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Tài khoản của bạn đã bị vô hiệu hóa', 403);
    }

    if ((decoded.tokenVersion ?? 1) !== user.tokenVersion) {
      return errorResponse(res, 'Phiên đăng nhập đã bị thu hồi do thay đổi bảo mật. Vui lòng đăng nhập lại', 401);
    }

    // 3. Đính kèm thông tin user vào request object
    req.user = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Token xác thực không hợp lệ', 401);
    }
    return errorResponse(res, 'Xác thực thất bại: ' + error.message, 401);
  }
}

module.exports = authMiddleware;
