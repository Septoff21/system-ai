const fs = require('fs');
const path = require('path');
const { dialog } = require('electron');

/**
 * File operations service for the AI assistant.
 * Allows the AI to read, write, and edit local files.
 */

function readFile(filePath) {
  try {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
      return { success: false, error: 'File not found' };
    }
    const content = fs.readFileSync(resolved, 'utf-8');
    const ext = path.extname(resolved).slice(1);
    return { success: true, content, path: resolved, extension: ext };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function writeFile(filePath, content) {
  try {
    const resolved = path.resolve(filePath);
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resolved, content, 'utf-8');
    return { success: true, path: resolved };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function listFiles(dirPath, maxDepth = 2) {
  try {
    const resolved = path.resolve(dirPath);
    if (!fs.existsSync(resolved)) {
      return { success: false, error: 'Directory not found' };
    }

    const entries = [];

    function walk(dir, depth) {
      if (depth > maxDepth) return;
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === '__pycache__') continue;
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          entries.push({ name: item.name, type: 'directory', path: fullPath });
          walk(fullPath, depth + 1);
        } else {
          const stat = fs.statSync(fullPath);
          entries.push({
            name: item.name,
            type: 'file',
            path: fullPath,
            size: stat.size,
            ext: path.extname(item.name).slice(1),
          });
        }
      }
    }

    walk(resolved, 0);
    return { success: true, entries };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function openFileDialog(browserWindow) {
  const result = await dialog.showOpenDialog(browserWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Code', extensions: ['js', 'ts', 'tsx', 'jsx', 'py', 'json', 'html', 'css', 'md'] },
    ],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'Cancelled' };
  }
  return readFile(result.filePaths[0]);
}

async function saveFileDialog(browserWindow, content, defaultName) {
  const result = await dialog.showSaveDialog(browserWindow, {
    defaultPath: defaultName || 'untitled.txt',
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Code', extensions: ['js', 'ts', 'tsx', 'jsx', 'py', 'json', 'html', 'css', 'md'] },
    ],
  });
  if (result.canceled || !result.filePath) {
    return { success: false, error: 'Cancelled' };
  }
  return writeFile(result.filePath, content);
}

module.exports = { readFile, writeFile, listFiles, openFileDialog, saveFileDialog };
