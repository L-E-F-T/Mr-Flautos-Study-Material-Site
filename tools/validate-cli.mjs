#!/usr/bin/env node
/**
 * Command-line content check (same rules as tools/validate.html).
 *   node tools/validate-cli.mjs                 check everything, including lab-only packs
 *   node tools/validate-cli.mjs --public-only   check only what GitHub Pages will publish
 * Exits with code 1 when there are errors, so GitHub Actions refuses to deploy broken content.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateAll, formatReport } from '../assets/js/lib/validate-core.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const includePrivate = !process.argv.includes('--public-only');

async function readJSON(relativePath, { optional = false } = {}) {
  const fullPath = path.join(root, ...relativePath.split('/'));
  let text;
  try {
    text = await readFile(fullPath, 'utf8');
  } catch (error) {
    if (optional && error.code === 'ENOENT') return null;
    throw new Error(`Could not read ${relativePath}: ${error.message}`);
  }
  try {
    return JSON.parse(text.replace(/^﻿/, ''));
  } catch (error) {
    throw new Error(`${relativePath} is not valid JSON: ${error.message}`);
  }
}

const report = await validateAll(readJSON, { includePrivate });
console.log(formatReport(report));
process.exitCode = report.errors.length > 0 ? 1 : 0;
