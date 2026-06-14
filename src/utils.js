/**
 * zen-notes · Utility Functions
 * Date formatting, fuzzy search, and text processing helpers.
 */

/**
 * Formats an ISO timestamp into a human-readable relative time string.
 * @param {string} isoString - ISO 8601 timestamp
 * @returns {string} Relative time (e.g., '2 hours ago', 'just now')
 */
export function timeAgo(isoString) {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  return `${months}mo ago`;
}

/**
 * Formats an ISO timestamp into a clean date string.
 * @param {string} isoString - ISO 8601 timestamp
 * @returns {string} Formatted date (e.g., 'Jun 14, 2026 · 12:30 PM')
 */
export function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Truncates text to a maximum length with ellipsis.
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum character count
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + '…';
}

/**
 * Generates an abbreviated display ID from a nanoid.
 * @param {string} id - Full note ID
 * @returns {string} Short display ID (e.g., '#a1b2c3')
 */
export function shortId(id) {
  return `#${id.slice(0, 6)}`;
}

/**
 * Performs fuzzy keyword matching against note fields.
 * Matches against title, content, and tags.
 * @param {Array} notes - Array of note objects
 * @param {string} query - Search query string
 * @returns {Array} Filtered and scored notes, sorted by relevance
 */
export function fuzzySearch(notes, query) {
  if (!query || !query.trim()) return notes;

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  const scored = notes
    .map((note) => {
      let score = 0;
      const titleLower = (note.title || '').toLowerCase();
      const contentLower = (note.content || '').toLowerCase();
      const tagsLower = (note.tags || []).map((t) => t.toLowerCase());

      for (const term of terms) {
        // Title matches (highest weight)
        if (titleLower === term) {
          score += 100;
        } else if (titleLower.startsWith(term)) {
          score += 75;
        } else if (titleLower.includes(term)) {
          score += 50;
        }

        // Tag exact matches (high weight)
        if (tagsLower.some((tag) => tag === term)) {
          score += 80;
        } else if (tagsLower.some((tag) => tag.includes(term))) {
          score += 40;
        }

        // Content matches (standard weight)
        if (contentLower.includes(term)) {
          score += 25;

          // Bonus for multiple occurrences
          const occurrences = contentLower.split(term).length - 1;
          score += Math.min(occurrences * 5, 25);
        }

        // Fuzzy character-level matching for typo tolerance
        score += fuzzyCharMatch(titleLower, term) * 15;
      }

      return { note, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ note }) => note);
}

/**
 * Simple character-level fuzzy matching.
 * Returns a similarity ratio between 0 and 1.
 * @param {string} str - String to match against
 * @param {string} pattern - Pattern to find
 * @returns {number} Similarity score (0-1)
 */
function fuzzyCharMatch(str, pattern) {
  if (pattern.length === 0) return 0;
  if (str.includes(pattern)) return 1;

  let patternIdx = 0;
  let matched = 0;

  for (let i = 0; i < str.length && patternIdx < pattern.length; i++) {
    if (str[i] === pattern[patternIdx]) {
      matched++;
      patternIdx++;
    }
  }

  return matched / pattern.length;
}

/**
 * Wraps an async operation with a timeout.
 * @param {Promise} promise - The promise to wrap
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise} Resolves with the promise result or rejects on timeout
 */
export function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms)),
  ]);
}
