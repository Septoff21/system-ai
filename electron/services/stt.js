const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const PYTHON = require('./python');
const STT_SERVER = path.join(__dirname, 'stt_server.py');

let pythonProcess = null;
let serverPort = null;
let ready = false;
let readyCallbacks = [];
let restarting = false;

function startServer() {
  if (pythonProcess && ready) return Promise.resolve(serverPort);

  return new Promise((resolve, reject) => {
    ready = false;
    serverPort = null;

    pythonProcess = spawn(PYTHON, [STT_SERVER], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdoutBuf = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutBuf += data.toString();
      const match = stdoutBuf.match(/PORT:(\d+)/);
      if (match && !ready) {
        serverPort = parseInt(match[1], 10);
        ready = true;
        readyCallbacks.forEach((cb) => cb(serverPort));
        readyCallbacks = [];
        resolve(serverPort);
      }
    });

    let stderrBuf = '';
    pythonProcess.stderr.on('data', (data) => {
      stderrBuf += data.toString();
    });

    pythonProcess.on('close', (code) => {
      console.error(`[STT Server] Process exited with code ${code}`);
      if (stderrBuf) console.error('[STT Server] stderr:', stderrBuf);
      ready = false;
      pythonProcess = null;
      serverPort = null;
    });

    pythonProcess.on('error', (err) => {
      console.error('[STT Server] Failed to start:', err.message);
      reject(err);
    });

    setTimeout(() => {
      if (!ready) reject(new Error('STT server startup timeout'));
    }, 60000); // whisper model loading can take a while on first run
  });
}

function waitForReady() {
  if (ready && serverPort) return Promise.resolve(serverPort);
  return new Promise((resolve) => {
    readyCallbacks.push(resolve);
  });
}

async function ensureRunning() {
  if (ready && pythonProcess) return serverPort;
  if (restarting) return waitForReady();
  restarting = true;
  try {
    await startServer();
    return serverPort;
  } finally {
    restarting = false;
  }
}

function httpPost(port, path, body) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': data.length,
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`STT server returned ${res.statusCode}`));
          } else {
            resolve(Buffer.concat(chunks).toString());
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('STT request timeout'));
    });
    req.write(data);
    req.end();
  });
}

/**
 * Transcribe audio buffer to text.
 * @param {Buffer} audioBuffer - raw audio bytes (webm/wav)
 * @returns {Promise<{text: string, error?: string}>}
 */
async function transcribe(audioBuffer) {
  const port = await ensureRunning();
  try {
    const raw = await httpPost(port, '/transcribe', audioBuffer);
    return JSON.parse(raw);
  } catch (err) {
    console.error('[STT] Request failed, attempting restart:', err.message);
    ready = false;
    await startServer();
    const raw = await httpPost(serverPort, '/transcribe', audioBuffer);
    return JSON.parse(raw);
  }
}

function shutdown() {
  if (pythonProcess) {
    try { pythonProcess.kill(); } catch {}
    pythonProcess = null;
    ready = false;
    serverPort = null;
  }
}

module.exports = { transcribe, startServer, shutdown };
