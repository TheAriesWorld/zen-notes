/**
 * zen-notes · Core Application Runtime
 * Interactive main loop powering the CLI notes manager.
 */

import inquirer from 'inquirer';
import { nanoid } from 'nanoid';
import { loadNotes, addNote, updateNote, deleteNote, findNoteById } from './storage.js';
import { fuzzySearch, truncate, shortId } from './utils.js';
import {
  showBanner,
  showNotesList,
  showNoteDetail,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showSectionHeader,
  showNoteCount,
  createSpinner,
  renderTags,
  theme,
} from './ui.js';

// ─── Menu Choices ─────────────────────────────────────────────────
const MENU_CHOICES = [
  { name: `${theme.primary('◈')}  View Notes`, value: 'view' },
  { name: `${theme.success('◈')}  Create Note`, value: 'create' },
  { name: `${theme.secondary('◈')}  Search Notes`, value: 'search' },
  { name: `${theme.warning('◈')}  Delete Note`, value: 'delete' },
  new inquirer.Separator(theme.dimmed('─────────────────────────')),
  { name: `${theme.muted('◈')}  Exit`, value: 'exit' },
];

/**
 * Displays the main dashboard menu and returns the user's choice.
 * @returns {Promise<string>} Selected action
 */
async function mainMenu() {
  showBanner();

  const notes = await loadNotes();
  showNoteCount(notes.length);

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: theme.text('What would you like to do?'),
      choices: MENU_CHOICES,
      pageSize: 8,
      loop: false,
      prefix: theme.dimmed('›'),
    },
  ]);

  return action;
}

/**
 * Handles the note creation workflow.
 * Prompts for title, tags, and content, then persists the note.
 */
async function handleCreate() {
  showSectionHeader('Create New Note');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: theme.text('Title:'),
      prefix: theme.primary('  ✎'),
      validate: (input) => {
        if (!input.trim()) return theme.accent('Title cannot be empty');
        if (input.trim().length > 120) return theme.accent('Title must be under 120 characters');
        return true;
      },
    },
    {
      type: 'input',
      name: 'tags',
      message: theme.text('Tags (comma-separated):'),
      prefix: theme.secondary('  ⊡'),
      filter: (input) =>
        input
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0),
    },
    {
      type: 'editor',
      name: 'content',
      message: theme.text('Content (opens editor):'),
      prefix: theme.primary('  ❯'),
      waitForUseInput: false,
    },
  ]);

  const spinner = createSpinner('Saving note...');
  spinner.start();

  try {
    const note = {
      id: nanoid(12),
      title: answers.title.trim(),
      tags: answers.tags,
      content: answers.content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addNote(note);
    spinner.stop();
    showSuccess(`Note "${truncate(note.title, 40)}" created  ${theme.dimmed(shortId(note.id))}`);
  } catch (err) {
    spinner.stop();
    showError(`Failed to create note: ${err.message}`);
  }
}

/**
 * Handles the notes viewing workflow.
 * Lists all notes and allows selecting one for detail view.
 */
async function handleView() {
  const spinner = createSpinner('Loading notes...');
  spinner.start();

  const notes = await loadNotes();
  spinner.stop();

  if (notes.length === 0) {
    showInfo('No notes found. Create one first!');
    return;
  }

  showSectionHeader('Your Notes');
  showNotesList(notes);

  const { selectedId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedId',
      message: theme.text('Select a note to view:'),
      prefix: theme.dimmed('›'),
      choices: [
        ...notes.map((note) => ({
          name: `${theme.primary(shortId(note.id))}  ${theme.text(truncate(note.title, 45))}  ${theme.dimmed('·')}  ${renderTags(note.tags)}`,
          value: note.id,
        })),
        new inquirer.Separator(theme.dimmed('─────────────────────────')),
        { name: theme.muted('← Back to menu'), value: 'back' },
      ],
      pageSize: 12,
      loop: false,
    },
  ]);

  if (selectedId === 'back') return;

  const note = await findNoteById(selectedId);
  if (!note) {
    showError('Note not found');
    return;
  }

  showNoteDetail(note);

  // Post-view actions
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: theme.text('What next?'),
      prefix: theme.dimmed('›'),
      choices: [
        { name: `${theme.primary('✎')}  Edit this note`, value: 'edit' },
        { name: `${theme.accent('✖')}  Delete this note`, value: 'delete' },
        { name: theme.muted('← Back to menu'), value: 'back' },
      ],
      loop: false,
    },
  ]);

  if (action === 'edit') {
    await handleEdit(note);
  } else if (action === 'delete') {
    await confirmAndDelete(note);
  }
}

/**
 * Handles editing an existing note.
 * @param {Object} note - The note to edit
 */
async function handleEdit(note) {
  showSectionHeader(`Editing: ${truncate(note.title, 40)}`);

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: theme.text('Title:'),
      prefix: theme.primary('  ✎'),
      default: note.title,
      validate: (input) => {
        if (!input.trim()) return theme.accent('Title cannot be empty');
        return true;
      },
    },
    {
      type: 'input',
      name: 'tags',
      message: theme.text('Tags (comma-separated):'),
      prefix: theme.secondary('  ⊡'),
      default: note.tags.join(', '),
      filter: (input) =>
        input
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0),
    },
    {
      type: 'editor',
      name: 'content',
      message: theme.text('Content (opens editor):'),
      prefix: theme.primary('  ❯'),
      default: note.content,
      waitForUseInput: false,
    },
  ]);

  const spinner = createSpinner('Saving changes...');
  spinner.start();

  try {
    await updateNote(note.id, {
      title: answers.title.trim(),
      tags: answers.tags,
      content: answers.content.trim(),
    });
    spinner.stop();
    showSuccess('Note updated successfully');
  } catch (err) {
    spinner.stop();
    showError(`Failed to update note: ${err.message}`);
  }
}

/**
 * Handles the search workflow.
 * Prompts for a query and displays matching notes.
 */
async function handleSearch() {
  showSectionHeader('Search Notes');

  const { query } = await inquirer.prompt([
    {
      type: 'input',
      name: 'query',
      message: theme.text('Search query:'),
      prefix: theme.primary('  ⌕'),
      validate: (input) => {
        if (!input.trim()) return theme.accent('Enter a search term');
        return true;
      },
    },
  ]);

  const spinner = createSpinner('Searching...');
  spinner.start();

  const notes = await loadNotes();
  const results = fuzzySearch(notes, query.trim());
  spinner.stop();

  if (results.length === 0) {
    showWarning(`No notes matched "${query.trim()}"`);
    return;
  }

  showInfo(`Found ${results.length} result${results.length === 1 ? '' : 's'}`);
  showNotesList(results);

  const { selectedId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedId',
      message: theme.text('Select a note to view:'),
      prefix: theme.dimmed('›'),
      choices: [
        ...results.map((note) => ({
          name: `${theme.primary(shortId(note.id))}  ${theme.text(truncate(note.title, 45))}`,
          value: note.id,
        })),
        new inquirer.Separator(theme.dimmed('─────────────────────────')),
        { name: theme.muted('← Back to menu'), value: 'back' },
      ],
      pageSize: 12,
      loop: false,
    },
  ]);

  if (selectedId === 'back') return;

  const note = await findNoteById(selectedId);
  if (note) {
    showNoteDetail(note);

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: theme.text('What next?'),
        prefix: theme.dimmed('›'),
        choices: [
          { name: `${theme.primary('✎')}  Edit this note`, value: 'edit' },
          { name: `${theme.accent('✖')}  Delete this note`, value: 'delete' },
          { name: theme.muted('← Back to menu'), value: 'back' },
        ],
        loop: false,
      },
    ]);

    if (action === 'edit') await handleEdit(note);
    else if (action === 'delete') await confirmAndDelete(note);
  }
}

/**
 * Handles the delete workflow from the main menu.
 * Shows a list of notes and allows selecting one to delete.
 */
async function handleDelete() {
  const notes = await loadNotes();

  if (notes.length === 0) {
    showInfo('No notes to delete.');
    return;
  }

  showSectionHeader('Delete Note');

  const { selectedId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedId',
      message: theme.text('Select a note to delete:'),
      prefix: theme.accent('  ✖'),
      choices: [
        ...notes.map((note) => ({
          name: `${theme.primary(shortId(note.id))}  ${theme.text(truncate(note.title, 45))}  ${theme.dimmed('·')}  ${renderTags(note.tags)}`,
          value: note.id,
        })),
        new inquirer.Separator(theme.dimmed('─────────────────────────')),
        { name: theme.muted('← Back to menu'), value: 'back' },
      ],
      pageSize: 12,
      loop: false,
    },
  ]);

  if (selectedId === 'back') return;

  const note = await findNoteById(selectedId);
  if (note) {
    await confirmAndDelete(note);
  }
}

/**
 * Confirms and executes note deletion with a safety prompt.
 * @param {Object} note - The note to delete
 */
async function confirmAndDelete(note) {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: theme.accent(`Delete "${truncate(note.title, 40)}"? This cannot be undone.`),
      default: false,
      prefix: theme.accent('  ⚠'),
    },
  ]);

  if (!confirm) {
    showInfo('Deletion cancelled');
    return;
  }

  const spinner = createSpinner('Deleting note...');
  spinner.start();

  try {
    await deleteNote(note.id);
    spinner.stop();
    showSuccess(`Note "${truncate(note.title, 40)}" deleted`);
  } catch (err) {
    spinner.stop();
    showError(`Failed to delete note: ${err.message}`);
  }
}

/**
 * Main application loop.
 * Runs the dashboard and dispatches to action handlers.
 */
export async function run() {
  while (true) {
    const action = await mainMenu();

    switch (action) {
      case 'view':
        await handleView();
        break;
      case 'create':
        await handleCreate();
        break;
      case 'search':
        await handleSearch();
        break;
      case 'delete':
        await handleDelete();
        break;
      case 'exit':
        console.log(`\n  ${theme.muted('Goodbye.')} ${theme.dimmed('Your notes are safe.')}\n`);
        process.exit(0);
    }

    // Pause briefly before returning to menu
    await new Promise((r) => setTimeout(r, 800));
  }
}
