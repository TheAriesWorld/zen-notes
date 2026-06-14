import { homedir } from 'os';
import { join } from 'path';
import { mkdir, readFile, writeFile, access, rename } from 'fs/promises';
import { constants } from 'fs';

// ─── Configuration ───────────────────────────────────────────
const APP_DIR = join(homedir(), '.config', 'zen-notes');
const DATA_FILE = join(APP_DIR, 'notes.json');
const BACKUP_FILE = join(APP_DIR, 'notes.backup.json');

/**
 * Ensures the application data directory exists.
 * Creates it recursively if missing.
 */
async function ensureDirectory() {
  try {
    await mkdir(APP_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw new Error(`Failed to create data directory: ${err.message}`);
    }
  }
}

/**
 * Checks if the data file is accessible.
 * @returns {Promise<boolean>}
 */
async function fileExists() {
  try {
    await access(DATA_FILE, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads and parses the notes JSON file with corruption recovery.
 * Falls back to backup if primary file is corrupted.
 * @returns {Promise<Array>} Array of note objects
 */
export async function loadNotes() {
  await ensureDirectory();

  if (!(await fileExists())) {
    await writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }

  try {
    const raw = await readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      throw new Error('Data file root is not an array');
    }

    return data;
  } catch (parseError) {
    // Attempt recovery from backup
    try {
      const backupRaw = await readFile(BACKUP_FILE, 'utf-8');
      const backupData = JSON.parse(backupRaw);

      if (Array.isArray(backupData)) {
        // Restore from backup
        await writeFile(DATA_FILE, JSON.stringify(backupData, null, 2), 'utf-8');
        return backupData;
      }
    } catch {
      // Backup also corrupted or missing — start fresh
    }

    // Last resort: initialize empty
    await writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
}

/**
 * Atomically saves notes to disk.
 * Uses write-then-rename pattern with backup rotation.
 * @param {Array} notes - The full notes array to persist
 */
export async function saveNotes(notes) {
  await ensureDirectory();

  const tempFile = join(APP_DIR, `notes.tmp.${Date.now()}.json`);
  const serialized = JSON.stringify(notes, null, 2);

  try {
    // Write to temporary file first
    await writeFile(tempFile, serialized, 'utf-8');

    // Rotate current file to backup
    if (await fileExists()) {
      try {
        await rename(DATA_FILE, BACKUP_FILE);
      } catch {
        // Non-critical: backup rotation failed
      }
    }

    // Atomically move temp to primary
    await rename(tempFile, DATA_FILE);
  } catch (err) {
    // Cleanup temp file on failure
    try {
      const { unlink } = await import('fs/promises');
      await unlink(tempFile);
    } catch {
      // Temp file cleanup failed — non-critical
    }
    throw new Error(`Failed to save notes: ${err.message}`);
  }
}

/**
 * Adds a new note to storage.
 * @param {Object} note - Note object with id, title, content, tags, timestamps
 * @returns {Promise<Object>} The saved note
 */
export async function addNote(note) {
  const notes = await loadNotes();
  notes.unshift(note);
  await saveNotes(notes);
  return note;
}

/**
 * Updates an existing note by ID.
 * @param {string} id - The note ID to update
 * @param {Object} updates - Fields to merge into the note
 * @returns {Promise<Object|null>} The updated note, or null if not found
 */
export async function updateNote(id, updates) {
  const notes = await loadNotes();
  const index = notes.findIndex((n) => n.id === id);

  if (index === -1) return null;

  notes[index] = {
    ...notes[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveNotes(notes);
  return notes[index];
}

/**
 * Deletes a note by ID.
 * @param {string} id - The note ID to remove
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export async function deleteNote(id) {
  const notes = await loadNotes();
  const filtered = notes.filter((n) => n.id !== id);

  if (filtered.length === notes.length) return false;

  await saveNotes(filtered);
  return true;
}

/**
 * Finds a note by ID.
 * @param {string} id - The note ID to find
 * @returns {Promise<Object|null>} The found note or null
 */
export async function findNoteById(id) {
  const notes = await loadNotes();
  return notes.find((n) => n.id === id) || null;
}

export { APP_DIR, DATA_FILE };
