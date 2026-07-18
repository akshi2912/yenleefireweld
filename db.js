// db.js — Minimal file-based JSON data store.
// Good enough for a single-admin project catalogue; swap for MongoDB/Postgres
// later by re-implementing the same function signatures.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PROJECTS_FILE)) fs.writeFileSync(PROJECTS_FILE, '[]', 'utf-8');
}

// A tiny in-process lock so concurrent writes (rare, single-admin) don't clobber each other.
let writeQueue = Promise.resolve();

function readAll() {
  ensureFile();
  const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
  try {
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('projects.json is corrupted, backing up and resetting:', e.message);
    fs.copyFileSync(PROJECTS_FILE, PROJECTS_FILE + '.bak-' + Date.now());
    fs.writeFileSync(PROJECTS_FILE, '[]', 'utf-8');
    return [];
  }
}

function writeAll(projects) {
  writeQueue = writeQueue.then(() => {
    const tmp = PROJECTS_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(projects, null, 2), 'utf-8');
    fs.renameSync(tmp, PROJECTS_FILE);
  });
  return writeQueue;
}

module.exports = { readAll, writeAll, ensureFile };
