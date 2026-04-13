const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Auto-detect the Python executable path.
 *
 * Priority:
 *   1. Environment variable PYTHON_PATH
 *   2. Environment variable PYTHON (common convention)
 *   3. System `python` on PATH (via `where python` on Windows, `which python` elsewhere)
 *   4. System `python3` on PATH
 *   5. Common install locations on Windows
 *   6. Common install locations on macOS / Linux
 */

// Paths that some users have hardcoded in older versions
const LEGACY_FALLBACK = 'C:\\Users\\PC\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';

function fileExists(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

function tryWhich(cmd) {
  try {
    const whichCmd = process.platform === 'win32' ? 'where' : 'which';
    const result = execSync(`${whichCmd} ${cmd}`, { encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'ignore'] });
    // On Windows, `where` may return multiple lines; take the first
    const found = result.trim().split('\n')[0].trim();
    if (found && fileExists(found)) return found;
  } catch {}
  return null;
}

function findWindowsPython() {
  // Check common Windows install locations
  const userProfile = process.env.USERPROFILE || 'C:\\Users\\PC';
  const candidates = [
    path.join(userProfile, 'AppData', 'Local', 'Programs', 'Python', 'Python312', 'python.exe'),
    path.join(userProfile, 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'python.exe'),
    path.join(userProfile, 'AppData', 'Local', 'Programs', 'Python', 'Python310', 'python.exe'),
    'C:\\Python312\\python.exe',
    'C:\\Python311\\python.exe',
    'C:\\Python310\\python.exe',
  ];
  for (const c of candidates) {
    if (fileExists(c)) return c;
  }
  return null;
}

function findUnixPython() {
  const candidates = ['/usr/bin/python3', '/usr/local/bin/python3', '/opt/homebrew/bin/python3'];
  for (const c of candidates) {
    if (fileExists(c)) return c;
  }
  return null;
}

function detectPython() {
  // 1. Explicit env var
  if (process.env.PYTHON_PATH && fileExists(process.env.PYTHON_PATH)) {
    return process.env.PYTHON_PATH;
  }
  if (process.env.PYTHON && fileExists(process.env.PYTHON)) {
    return process.env.PYTHON;
  }

  // 2. Try `python` on PATH
  let found = tryWhich('python');
  if (found) return found;

  // 3. Try `python3` on PATH
  found = tryWhich('python3');
  if (found) return found;

  // 4. Platform-specific common locations
  if (process.platform === 'win32') {
    found = findWindowsPython();
    if (found) return found;
  } else {
    found = findUnixPython();
    if (found) return found;
  }

  // 5. Legacy fallback (original hardcoded path)
  if (fileExists(LEGACY_FALLBACK)) return LEGACY_FALLBACK;

  // Give up — return 'python' and hope it's on PATH at runtime
  return process.platform === 'win32' ? 'python' : 'python3';
}

const pythonPath = detectPython();

if (!process.env.PYTHON_PATH && !process.env.PYTHON) {
  console.log(`[Python] Auto-detected: ${pythonPath}`);
}

module.exports = pythonPath;
