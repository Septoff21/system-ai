const { safeStorage, app } = require('electron');
const fs = require('fs');
const path = require('path');

function keysFilePath() {
  return path.join(app.getPath('userData'), 'keys.enc.json');
}

function readRaw() {
  try {
    return JSON.parse(fs.readFileSync(keysFilePath(), 'utf-8'));
  } catch {
    return {};
  }
}

function writeRaw(data) {
  fs.writeFileSync(keysFilePath(), JSON.stringify(data), 'utf-8');
}

function setKey(provider, key) {
  const raw = readRaw();
  if (key && key.trim()) {
    raw[provider] = safeStorage.encryptString(key.trim()).toString('base64');
  } else {
    delete raw[provider];
  }
  writeRaw(raw);
}

function getKey(provider) {
  const raw = readRaw();
  if (!raw[provider]) return '';
  try {
    return safeStorage.decryptString(Buffer.from(raw[provider], 'base64'));
  } catch {
    return '';
  }
}

function getAllKeys() {
  const raw = readRaw();
  const result = {};
  for (const provider of Object.keys(raw)) {
    try {
      result[provider] = safeStorage.decryptString(Buffer.from(raw[provider], 'base64'));
    } catch {
      result[provider] = '';
    }
  }
  return result;
}

module.exports = { setKey, getKey, getAllKeys };
