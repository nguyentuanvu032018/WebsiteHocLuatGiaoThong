const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware phân quyền dựa trên vai trò (Role-Based Access Control)
 * @param {Array<string>} allowedRoles Danh sách các role được phép (VD: ['admin'])
 */
function rbacMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Chưa xác thực người dùng', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        'Bạn không có quyền thực hiện chức năng này (Yêu cầu quyền: ' + allowedRoles.join(', ') + ')',
        403
      );
    }

    next();
  };
}

module.exports = rbacMiddleware;
