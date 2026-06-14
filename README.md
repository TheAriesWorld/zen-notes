<div align="center">

```
 ████████╗ ███████╗ ███╗   ██╗
 ╚══███╔══╝ ██╔════╝ ████╗  ██║
    ███║    █████╗   ██╔██╗ ██║
    ███║    ██╔══╝   ██║╚██╗██║
    ███║    ███████╗ ██║ ╚████║
    ╚══╝    ╚══════╝ ╚═╝  ╚═══╝
```

# zen-notes

**A hyper-polished, minimalist-cyberpunk CLI notes manager**

[![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

*Your thoughts, organized. Beautifully.*

</div>

---

## ✨ Features

| Feature | Description |
| --- | --- |
| 🎨 **Cyberpunk UI** | Neon-gradient banners, color-coded tags, and styled containers |
| 📝 **Full CRUD** | Create, read, update, and delete notes with rich prompts |
| 🔍 **Fuzzy Search** | Intelligent keyword matching across titles, tags, and content |
| 💾 **Atomic Persistence** | Write-then-rename pattern with automatic backup rotation |
| 🛡️ **Corruption Recovery** | Auto-recovers from corrupted data files using backups |
| ⚡ **Zero Config** | Data stored safely in `~/.config/zen-notes/` — no setup needed |
| 🏷️ **Tag System** | Color-coded tags for organizing and filtering notes |
| ⏱️ **Timestamps** | Automatic `createdAt`/`updatedAt` tracking with relative time display |

---

## 📦 Installation

### Prerequisites

- [Node.js](https://nodejs.org) **v18.0.0** or higher
- npm (bundled with Node.js)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/TheAriesWorld/zen-notes.git
cd zen-notes

# Install dependencies
npm install

# Launch
npm start
```

### Global Install (Optional)

```bash
# Install globally for system-wide access
npm link

# Now run from anywhere
zen-notes
```

---

## 🚀 Usage

```bash
# Start the interactive dashboard
npm start

# Or if installed globally
zen-notes
```

### Main Menu

Navigate using **arrow keys** and **Enter**:

```
 ◈  View Notes      — Browse and inspect your notes
 ◈  Create Note     — Add a new note with title, tags, and content
 ◈  Search Notes    — Fuzzy search through all notes
 ◈  Delete Note     — Remove a note with confirmation
 ◈  Exit            — Close the application
```

### Creating a Note

1. Select **Create Note** from the menu
2. Enter a **title** for your note
3. Add **tags** (comma-separated, e.g., `work, ideas, urgent`)
4. Write your **content** in the editor that opens
5. Save and close the editor — your note is persisted instantly

### Searching Notes

The built-in fuzzy search engine scores results by relevance:

- **Title matches** are weighted highest
- **Tag matches** score highly for exact matches
- **Content matches** include frequency bonuses
- **Typo tolerance** via character-level fuzzy matching

---

## 🏗️ Architecture

```
zen-notes/
├── bin/
│   └── cli.js           # Executable entry point
├── src/
│   ├── index.js         # Main application loop & menu dispatch
│   ├── storage.js       # Atomic JSON file I/O with backup rotation
│   ├── ui.js            # Terminal rendering, themes & styled components
│   └── utils.js         # Date formatting, fuzzy search, text helpers
├── package.json         # ES Module project configuration
├── .gitignore           # Git exclusions
├── .prettierrc          # Code style rules
└── README.md            # You are here
```

### Data Storage

Notes are stored as a JSON array in:

```
~/.config/zen-notes/notes.json
```

Each note object:

```json
{
  "id": "a1b2c3d4e5f6",
  "title": "My First Note",
  "tags": ["ideas", "personal"],
  "content": "The content of the note...",
  "createdAt": "2026-06-14T12:00:00.000Z",
  "updatedAt": "2026-06-14T12:00:00.000Z"
}
```

### Data Integrity

- **Atomic writes**: Temp file → rename pattern prevents partial writes
- **Backup rotation**: Previous version saved as `notes.backup.json`
- **Auto-recovery**: Falls back to backup if primary file is corrupted
- **Safe initialization**: Creates data directory and file on first run

---

## 🎨 Tech Stack

| Package | Purpose |
| --- | --- |
| [`chalk`](https://github.com/chalk/chalk) | Terminal string styling with hex/RGB colors |
| [`boxen`](https://github.com/sindresorhus/boxen) | Bordered boxes for styled containers |
| [`inquirer`](https://github.com/SBoudrias/Inquirer.js) | Interactive CLI prompts with arrow-key navigation |
| [`ora`](https://github.com/sindresorhus/ora) | Elegant terminal spinners |
| [`cli-table3`](https://github.com/cli-table/cli-table3) | Unicode table rendering |
| [`nanoid`](https://github.com/ai/nanoid) | Compact, secure unique ID generation |

---

## 🧩 Development

```bash
# Run with file watching (auto-restart on changes)
npm run dev
```

### Code Style

Formatting is managed via Prettier with the project's `.prettierrc`:

```bash
npx prettier --write .
```

---

## 📄 License

MIT © zen-notes contributors

---

<div align="center">

*Built with ⚡ and a love for clean terminals.*

</div>
