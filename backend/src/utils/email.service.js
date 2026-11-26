const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

/**
 * Dịch vụ gửi Email (Email Service)
 * Sử dụng Nodemailer với cấu hình SMTP từ biến môi trường .env
 */

// Định vị file logo trang web để nhúng vào email qua Content-ID (CID)
const LOGO_PATHS = [
  path.resolve(__dirname, '../assets/logo.png'),
  path.resolve(__dirname, '../../../frontend/public/logo.png'),
  'D:\\Download\\CT466_NLN\\frontend\\public\\logo.png'
];
const logoPath = LOGO_PATHS.find(p => fs.existsSync(p));

function getLogoAttachments() {
  if (logoPath) {
    return [
      {
        filename: 'logo.png',
        path: logoPath,
        cid: 'taplai24h_logo'
      }
    ];
  }
  return [];
}

/**
 * Tạo đối tượng transporter Nodemailer
 * Hỗ trợ: Gmail (SMTP), Outlook, hoặc bất kỳ SMTP server nào
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' ? true : false, // true cho port 465, false cho 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Gửi mã OTP xác nhận đặt lại mật khẩu tới email người dùng
 * @param {string} toEmail - Email người nhận
 * @param {string} otp - Mã OTP 6 chữ số
 * @param {string} fullName - Tên người dùng (để cá nhân hóa email)
 */
async function sendOtpEmail(toEmail, otp, fullName = 'Học viên') {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Tập Lái 24h" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `[Tập Lái 24h] Mã xác nhận đặt lại mật khẩu: ${otp}`,
    attachments: getLogoAttachments(),
    html: `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mã xác nhận đặt lại mật khẩu</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f4f6fb; font-family:'Segoe UI', Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb; padding:40px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#1a56db 0%,#1e40af 100%); padding:32px 40px; text-align:center;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 12px auto;">
                      <tr>
                        <td align="center">
                          <img src="cid:taplai24h_logo" alt="Logo Tập Lái 24h" width="56" height="56" style="display:block; width:56px; height:56px; border-radius:12px; background-color:#ffffff; padding:4px; box-shadow:0 4px 12px rgba(0,0,0,0.15); border:1px solid rgba(255,255,255,0.2); object-fit:contain;" />
                        </td>
                      </tr>
                    </table>
                    <h1 style="color:#ffffff; margin:0 0 6px 0; font-size:22px; font-weight:700; letter-spacing:0.5px; line-height:1.2;">Tập Lái 24h</h1>
                    <p style="color:#bfdbfe; margin:0; font-size:13px;">Hệ thống học & thi thử sát hạch GPLX</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="color:#374151; font-size:15px; margin:0 0 12px;">Xin chào, <strong>${fullName}</strong>!</p>
                    <p style="color:#6b7280; font-size:14px; margin:0 0 28px; line-height:1.6;">
                      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>Tập Lái 24h</strong>. 
                      Vui lòng sử dụng mã xác nhận bên dưới để tiếp tục:
                    </p>

                    <!-- OTP Box -->
                    <div style="background:#eff6ff; border:2px dashed #3b82f6; border-radius:10px; padding:24px; text-align:center; margin:0 0 28px;">
                      <p style="color:#6b7280; font-size:12px; margin:0 0 10px; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Mã xác nhận của bạn</p>
                      <span style="display:inline-block; font-size:42px; font-weight:800; letter-spacing:12px; color:#1a56db; font-family:'Courier New', monospace;">${otp}</span>
                      <p style="color:#ef4444; font-size:12px; margin:12px 0 0; font-weight:500;">
                        ⏱ Mã có hiệu lực trong <strong>3 phút</strong>
                      </p>
                    </div>

                    <p style="color:#6b7280; font-size:13px; margin:0 0 8px; line-height:1.6;">
                      Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn hoàn toàn an toàn.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb; border-top:1px solid #e5e7eb; padding:20px 40px; text-align:center;">
                    <p style="color:#9ca3af; font-size:12px; margin:0;">
                      Email này được gửi tự động từ hệ thống <strong>Tập Lái 24h</strong>. Vui lòng không trả lời email này.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Gửi mã OTP xác nhận đăng ký tài khoản mới tới email người dùng
 * @param {string} toEmail - Email người nhận
 * @param {string} otp - Mã OTP 6 chữ số
 * @param {string} fullName - Tên người dùng
 */
async function sendRegisterOtpEmail(toEmail, otp, fullName = 'Học viên') {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Tập Lái 24h" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `[Tập Lái 24h] Mã xác nhận đăng ký tài khoản: ${otp}`,
    attachments: getLogoAttachments(),
    html: `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mã xác nhận đăng ký tài khoản</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f4f6fb; font-family:'Segoe UI', Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb; padding:40px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#1a56db 0%,#1e40af 100%); padding:32px 40px; text-align:center;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 12px auto;">
                      <tr>
                        <td align="center">
                          <img src="cid:taplai24h_logo" alt="Logo Tập Lái 24h" width="56" height="56" style="display:block; width:56px; height:56px; border-radius:12px; background-color:#ffffff; padding:4px; box-shadow:0 4px 12px rgba(0,0,0,0.15); border:1px solid rgba(255,255,255,0.2); object-fit:contain;" />
                        </td>
                      </tr>
                    </table>
                    <h1 style="color:#ffffff; margin:0 0 6px 0; font-size:22px; font-weight:700; letter-spacing:0.5px; line-height:1.2;">Tập Lái 24h</h1>
                    <p style="color:#bfdbfe; margin:0; font-size:13px;">Hệ thống học & thi thử sát hạch GPLX trực tuyến</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="color:#374151; font-size:16px; margin:0 0 12px;">Chào mừng bạn, <strong>${fullName}</strong>!</p>
                    <p style="color:#6b7280; font-size:14px; margin:0 0 24px; line-height:1.6;">
                      Cảm ơn bạn đã lựa chọn đăng ký tài khoản học viên tại <strong>Tập Lái 24h</strong>. 
                      Để hoàn tất quá trình đăng ký và bảo vệ tài khoản của bạn, vui lòng nhập mã xác nhận 6 chữ số dưới đây:
                    </p>

                    <!-- OTP Box -->
                    <div style="background:#eff6ff; border:2px dashed #2563eb; border-radius:12px; padding:24px; text-align:center; margin:0 0 28px;">
                      <p style="color:#4b5563; font-size:12px; margin:0 0 10px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700;">MÃ XÁC NHẬN ĐĂNG KÝ</p>
                      <span style="display:inline-block; font-size:44px; font-weight:800; letter-spacing:14px; color:#1a56db; font-family:'Courier New', monospace;">${otp}</span>
                      <p style="color:#dc2626; font-size:13px; margin:14px 0 0; font-weight:600;">
                        ⏱ Mã có hiệu lực trong <strong>3 phút</strong>
                      </p>
                    </div>

                    <p style="color:#6b7280; font-size:13px; margin:0 0 8px; line-height:1.6;">
                      Nếu bạn không thực hiện yêu cầu đăng ký này, vui lòng bỏ qua email hoặc thông báo cho chúng tôi để được hỗ trợ.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb; border-top:1px solid #e5e7eb; padding:20px 40px; text-align:center;">
                    <p style="color:#9ca3af; font-size:12px; margin:0;">
                      Email này được gửi tự động từ hệ thống <strong>Tập Lái 24h</strong>. Vui lòng không trả lời email này.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail, sendRegisterOtpEmail };

