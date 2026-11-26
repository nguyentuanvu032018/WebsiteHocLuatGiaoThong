const multer = require('multer');
const path = require('path');
const fs = require('fs');

const questionUploadDir = path.join(__dirname, '../../uploads/questions');
const signUploadDir = path.join(__dirname, '../../uploads/signs');
const avatarUploadDir = path.join(__dirname, '../../uploads/avatars');

const allowedImageTypes = {
  'image/jpeg': {
    extension: '.jpg',
    matches: (buffer) => buffer.length >= 3
      && buffer[0] === 0xff
      && buffer[1] === 0xd8
      && buffer[2] === 0xff
  },
  'image/png': {
    extension: '.png',
    matches: (buffer) => buffer.length >= 8
      && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  },
  'image/webp': {
    extension: '.webp',
    matches: (buffer) => buffer.length >= 12
      && buffer.toString('ascii', 0, 4) === 'RIFF'
      && buffer.toString('ascii', 8, 12) === 'WEBP'
  },
  'image/gif': {
    extension: '.gif',
    matches: (buffer) => buffer.length >= 6
      && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))
  }
};

if (!fs.existsSync(questionUploadDir)) {
  fs.mkdirSync(questionUploadDir, { recursive: true });
}
if (!fs.existsSync(signUploadDir)) {
  fs.mkdirSync(signUploadDir, { recursive: true });
}
if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

const createImageUploader = (uploadDir, prefix) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const imageType = allowedImageTypes[file.mimetype];
      const ext = imageType.extension;
      const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
      cb(null, `${prefix}_${uniqueSuffix}${ext}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    if (Object.prototype.hasOwnProperty.call(allowedImageTypes, file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Định dạng tệp không hợp lệ. Chỉ chấp nhận tệp ảnh JPG, PNG, WEBP hoặc GIF');
      error.statusCode = 400;
      cb(error, false);
    }
  };

  const uploader = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024
    }
  });

  return {
    single: (fieldName) => {
      const receiveFile = uploader.single(fieldName);
      return (req, res, next) => {
        receiveFile(req, res, (uploadError) => {
          if (uploadError) return next(uploadError);
          if (!req.file) return next();

          fs.readFile(req.file.path, (readError, fileContents) => {
            if (readError) {
              return fs.unlink(req.file.path, (cleanupError) => next(cleanupError || readError));
            }

            const imageType = allowedImageTypes[req.file.mimetype];
            if (imageType.matches(fileContents)) return next();

            const error = new Error('Nội dung tệp không khớp với định dạng ảnh được khai báo');
            error.statusCode = 400;
            return fs.unlink(req.file.path, (cleanupError) => next(cleanupError || error));
          });
        });
      };
    }
  };
};

const uploadQuestionImage = createImageUploader(questionUploadDir, 'question');
const uploadSignImage = createImageUploader(signUploadDir, 'sign');
const uploadAvatarImage = createImageUploader(avatarUploadDir, 'avatar');

module.exports = {
  uploadQuestionImage,
  uploadSignImage,
  uploadAvatarImage
};
