#!/usr/bin/env node

/**
 * zen-notes · CLI Entry Point
 * Bootstrap the application and handle top-level errors gracefully.
 */

import { run } from '../src/index.js';

run().catch((err) => {
  console.error('\n\x1b[31m✖ Fatal error:\x1b[0m', err.message);
  process.exit(1);
});
