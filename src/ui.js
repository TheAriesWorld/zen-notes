import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import ora from 'ora';
import { truncate, shortId, timeAgo, formatDate } from './utils.js';

// ─── Theme Palette ────────────────────────────────────────────────
const theme = {
  primary: chalk.hex('#00F0FF'),       // Cyan neon
  secondary: chalk.hex('#BF5AF2'),     // Purple accent
  accent: chalk.hex('#FF375F'),        // Red/pink hot accent
  success: chalk.hex('#30D158'),       // Green
  warning: chalk.hex('#FFD60A'),       // Yellow
  muted: chalk.hex('#636366'),         // Gray
  dimmed: chalk.hex('#48484A'),        // Dark gray
  text: chalk.hex('#E5E5EA'),          // Light text
  bright: chalk.hex('#FFFFFF'),        // White
  tagColors: [
    chalk.bgHex('#1C2541').hex('#00F0FF'),
    chalk.bgHex('#2D1B69').hex('#BF5AF2'),
    chalk.bgHex('#3A1C2F').hex('#FF375F'),
    chalk.bgHex('#1C3A2D').hex('#30D158'),
    chalk.bgHex('#3A351C').hex('#FFD60A'),
    chalk.bgHex('#1C2A3A').hex('#64D2FF'),
  ],
};

// ─── ASCII Banner ─────────────────────────────────────────────────
const BANNER = `
 ████████╗ ███████╗ ███╗   ██╗
 ╚══███╔══╝ ██╔════╝ ████╗  ██║
    ███║    █████╗   ██╔██╗ ██║
    ███║    ██╔══╝   ██║╚██╗██║
    ███║    ███████╗ ██║ ╚████║
    ╚══╝    ╚══════╝ ╚═╝  ╚═══╝`;

/**
 * Renders the application header banner.
 */
export function showBanner() {
  console.clear();
  const gradient = BANNER.split('\n')
    .map((line, i) => {
      const colors = ['#00F0FF', '#00D4FF', '#00B8FF', '#5E9CFF', '#8B7FFF', '#BF5AF2'];
      return chalk.hex(colors[i % colors.length]).bold(line);
    })
    .join('\n');

  console.log(gradient);

  console.log(
    boxen(theme.muted('  zen-notes  ') + theme.dimmed('v1.0.0') + theme.muted('  │  ') + theme.dimmed('your thoughts, organized'), {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 0, bottom: 1, left: 2, right: 0 },
      borderStyle: 'round',
      borderColor: '#48484A',
      dimBorder: true,
    })
  );
}

/**
 * Creates a styled spinner with the cyberpunk theme.
 * @param {string} text - Spinner label text
 * @returns {ora.Ora} Ora spinner instance
 */
export function createSpinner(text) {
  return ora({
    text: theme.muted(text),
    spinner: 'arc',
    color: 'cyan',
  });
}

/**
 * Displays a styled success message.
 * @param {string} message - The success text
 */
export function showSuccess(message) {
  console.log(`\n  ${theme.success('✔')}  ${theme.text(message)}\n`);
}

/**
 * Displays a styled error message.
 * @param {string} message - The error text
 */
export function showError(message) {
  console.log(`\n  ${theme.accent('✖')}  ${theme.text(message)}\n`);
}

/**
 * Displays a styled warning message.
 * @param {string} message - The warning text
 */
export function showWarning(message) {
  console.log(`\n  ${theme.warning('⚠')}  ${theme.text(message)}\n`);
}

/**
 * Displays a styled info message.
 * @param {string} message - The info text
 */
export function showInfo(message) {
  console.log(`\n  ${theme.primary('ℹ')}  ${theme.text(message)}\n`);
}

/**
 * Renders a color-coded tag pill.
 * @param {string} tag - Tag text
 * @param {number} index - Color index
 * @returns {string} Styled tag string
 */
function renderTag(tag, index) {
  const colorFn = theme.tagColors[index % theme.tagColors.length];
  return colorFn(` ${tag} `);
}

/**
 * Renders tags as a row of colored pills.
 * @param {Array<string>} tags - Array of tag strings
 * @returns {string} Styled tags string
 */
export function renderTags(tags) {
  if (!tags || tags.length === 0) return theme.dimmed('no tags');
  return tags.map((tag, i) => renderTag(tag, i)).join(' ');
}

/**
 * Renders the notes list in a structured table.
 * @param {Array} notes - Array of note objects
 */
export function showNotesList(notes) {
  if (notes.length === 0) {
    console.log(
      boxen(
        theme.muted('  No notes yet. Create your first note!  '),
        {
          padding: 1,
          margin: { top: 0, bottom: 1, left: 2, right: 0 },
          borderStyle: 'round',
          borderColor: '#48484A',
          dimBorder: true,
        }
      )
    );
    return;
  }

  const table = new Table({
    head: [
      theme.dimmed('ID'),
      theme.dimmed('TITLE'),
      theme.dimmed('TAGS'),
      theme.dimmed('MODIFIED'),
    ],
    colWidths: [10, 35, 30, 14],
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
    style: {
      head: [],
      border: ['gray'],
      compact: false,
    },
  });

  for (const note of notes) {
    table.push([
      theme.primary(shortId(note.id)),
      theme.text(truncate(note.title, 33)),
      renderTags(note.tags),
      theme.muted(timeAgo(note.updatedAt || note.createdAt)),
    ]);
  }

  console.log(`\n${table.toString()}\n`);
}

/**
 * Renders a single note in a detailed styled container.
 * @param {Object} note - The note object to display
 */
export function showNoteDetail(note) {
  const divider = theme.dimmed('─'.repeat(56));

  const header = [
    '',
    theme.primary.bold(note.title),
    theme.dimmed(`${shortId(note.id)}  ·  ${formatDate(note.createdAt)}`),
    '',
    divider,
    '',
  ].join('\n');

  const body = theme.text(note.content || theme.dimmed('(empty note)'));

  const tags = note.tags && note.tags.length > 0
    ? `\n${divider}\n\n  ${renderTags(note.tags)}`
    : '';

  const updated = note.updatedAt && note.updatedAt !== note.createdAt
    ? `\n\n${theme.dimmed(`  Last edited: ${formatDate(note.updatedAt)}`)}`
    : '';

  const content = header + body + tags + updated + '\n';

  console.log(
    boxen(content, {
      padding: { top: 1, bottom: 1, left: 2, right: 2 },
      margin: { top: 1, bottom: 1, left: 2, right: 0 },
      borderStyle: 'round',
      borderColor: '#00F0FF',
    })
  );
}

/**
 * Shows a section header with a subtle divider.
 * @param {string} title - Section title text
 */
export function showSectionHeader(title) {
  const line = theme.dimmed('─'.repeat(50));
  console.log(`\n  ${theme.secondary.bold(title)}\n  ${line}\n`);
}

/**
 * Displays the note count summary.
 * @param {number} count - Total number of notes
 */
export function showNoteCount(count) {
  const label = count === 1 ? 'note' : 'notes';
  console.log(theme.dimmed(`  ${count} ${label} stored\n`));
}

export { theme };
