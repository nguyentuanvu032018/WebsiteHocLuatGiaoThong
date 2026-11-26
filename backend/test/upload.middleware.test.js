const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const express = require('express');
const { uploadAvatarImage } = require('../src/middlewares/upload.middleware');

const uploadDir = path.resolve(__dirname, '../uploads/avatars');
const app = express();
app.post('/avatar', uploadAvatarImage.single('avatar'), (req, res) => {
  res.json({ filename: req.file.filename });
});
app.use((err, req, res, next) => {
  res.status(err.status || err.statusCode || 500).json({ message: err.message });
});

const server = app.listen(0);

function uploadFile(contents, filename) {
  const boundary = `----upload-test-${Date.now()}-${Math.random()}`;
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="avatar"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`),
    contents,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  return new Promise((resolve, reject) => {
    const request = http.request({
      host: '127.0.0.1',
      port: server.address().port,
      path: '/avatar',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({
        status: response.statusCode,
        body: JSON.parse(Buffer.concat(chunks).toString())
      }));
    });

    request.on('error', reject);
    request.end(body);
  });
}

test('rejects HTML disguised as an image and removes the uploaded file', async () => {
  const filesBefore = new Set(fs.readdirSync(uploadDir));
  const response = await uploadFile(Buffer.from('<html><script>alert(1)</script></html>'), 'fake.html');

  assert.equal(response.status, 400);
  assert.deepEqual(
    fs.readdirSync(uploadDir).filter((filename) => !filesBefore.has(filename)),
    []
  );
});

test('uses a server-generated image extension instead of the original filename', async (t) => {
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const response = await uploadFile(pngSignature, 'avatar.html');

  assert.equal(response.status, 200);
  assert.match(response.body.filename, /^avatar_\d+_\d+\.png$/);

  const uploadedPath = path.join(uploadDir, response.body.filename);
  t.after(() => {
    if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
  });
});

test.after(() => new Promise((resolve, reject) => {
  server.close((error) => error ? reject(error) : resolve());
}));
