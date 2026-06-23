import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const uploadDir = path.join(projectRoot, 'public', 'products');
const port = Number(process.env.UPLOAD_SERVER_PORT || 3001);

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(payload));
}

function sanitizeName(filename) {
  const extension = path.extname(filename).toLowerCase();
  const base = path.basename(filename, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'product';
  return `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
}

function parseMultipart(buffer, boundary) {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = buffer.indexOf(boundaryBuffer);

  while (start !== -1) {
    const next = buffer.indexOf(boundaryBuffer, start + boundaryBuffer.length);
    if (next === -1) break;

    let part = buffer.subarray(start + boundaryBuffer.length, next);
    if (part.subarray(0, 2).toString() === '\r\n') part = part.subarray(2);
    if (part.subarray(part.length - 2).toString() === '\r\n') part = part.subarray(0, part.length - 2);

    const separator = Buffer.from('\r\n\r\n');
    const headerEnd = part.indexOf(separator);
    if (headerEnd !== -1) {
      const headersText = part.subarray(0, headerEnd).toString('utf8');
      const content = part.subarray(headerEnd + separator.length);
      const filenameMatch = headersText.match(/filename="([^"]+)"/);
      const typeMatch = headersText.match(/Content-Type:\s*([^\r\n]+)/i);
      if (filenameMatch) {
        parts.push({
          filename: filenameMatch[1],
          contentType: typeMatch ? typeMatch[1].trim() : 'application/octet-stream',
          content,
        });
      }
    }

    start = next;
  }

  return parts;
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== 'POST' || request.url !== '/api/upload') {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }

  const contentType = request.headers['content-type'] || '';
  const boundary = contentType.match(/boundary=(.+)$/)?.[1];
  if (!boundary) {
    sendJson(response, 400, { error: 'Missing multipart boundary' });
    return;
  }

  const chunks = [];
  request.on('data', (chunk) => chunks.push(chunk));
  request.on('end', async () => {
    try {
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.concat(chunks);
      const files = parseMultipart(buffer, boundary);

      if (!files.length) {
        sendJson(response, 400, { error: 'No files uploaded' });
        return;
      }

      const paths = [];
      for (const file of files) {
        if (!imageTypes.has(file.contentType)) {
          sendJson(response, 400, { error: `${file.filename} is not a supported image type` });
          return;
        }

        const safeName = sanitizeName(file.filename);
        await writeFile(path.join(uploadDir, safeName), file.content);
        paths.push(`/products/${safeName}`);
      }

      sendJson(response, 200, { paths });
    } catch (error) {
      sendJson(response, 500, { error: error.message });
    }
  });
});

server.listen(port, () => {
  console.log(`Upload server running on http://localhost:${port}`);
});
