const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const PYTHON = require('./python');
const TTS_SERVER = path.join(__dirname, 'tts_server.py');

let pythonProcess = null;
let serverPort = null;
let ready = false;
let readyCallbacks = [];
let restarting = false;

/**
 * Start the Python TTS server. Returns a promise that resolves when the port is known.
 */
function startServer() {
  if (pythonProcess && ready) return Promise.resolve(serverPort);

  return new Promise((resolve, reject) => {
    ready = false;
    serverPort = null;

    pythonProcess = spawn(PYTHON, [TTS_SERVER], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdoutBuf = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutBuf += data.toString();
      // Look for PORT:NNNNN
      const match = stdoutBuf.match(/PORT:(\d+)/);
      if (match && !ready) {
        serverPort = parseInt(match[1], 10);
        ready = true;
        // Resolve all waiting callbacks
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
      console.error(`[TTS Server] Process exited with code ${code}`);
      if (stderrBuf) console.error('[TTS Server] stderr:', stderrBuf);
      ready = false;
      pythonProcess = null;
      serverPort = null;
    });

    pythonProcess.on('error', (err) => {
      console.error('[TTS Server] Failed to start:', err.message);
      reject(err);
    });

    // Timeout
    setTimeout(() => {
      if (!ready) {
        reject(new Error('TTS server startup timeout'));
      }
    }, 15000);
  });
}

/**
 * Wait for the server to be ready.
 */
function waitForReady() {
  if (ready && serverPort) return Promise.resolve(serverPort);
  return new Promise((resolve) => {
    readyCallbacks.push(resolve);
  });
}

/**
 * Restart the server if it died.
 */
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

/**
 * Make an HTTP POST to the TTS server.
 */
function httpPost(port, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`TTS server returned ${res.statusCode}`));
          } else {
            resolve(Buffer.concat(chunks));
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('TTS request timeout'));
    });
    req.write(data);
    req.end();
  });
}

/**
 * Generate speech audio from text using the Python TTS server.
 * Returns a Promise<Buffer> containing MP3 audio.
 */
async function generateSpeech(text, voice = 'jarvis') {
  const port = await ensureRunning();
  try {
    return await httpPost(port, '/speak', { text, voice });
  } catch (err) {
    // If failed, try restarting once
    console.error('[TTS] Request failed, attempting restart:', err.message);
    ready = false;
    await startServer();
    return httpPost(serverPort, '/speak', { text, voice });
  }
}

/**
 * Cleanup: kill the Python process.
 */
function shutdown() {
  if (pythonProcess) {
    try {
      pythonProcess.kill();
    } catch {}
    pythonProcess = null;
    ready = false;
    serverPort = null;
  }
}

module.exports = { generateSpeech, startServer, shutdown };
