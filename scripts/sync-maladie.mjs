#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function main() {
  const root = process.cwd();
  const srcDir = path.join(root, 'maladie');
  const dstDir = path.join(root, 'public', 'maladie');
  if (!(await exists(srcDir))) {
    // nothing to sync
    return;
  }
  await fs.mkdir(dstDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  const csvs = entries.filter(e => e.isFile() && e.name.toLowerCase().endsWith('.csv'));
  for (const e of csvs) {
    const src = path.join(srcDir, e.name);
    const dst = path.join(dstDir, e.name);
    try {
      await fs.copyFile(src, dst);
      // eslint-disable-next-line no-console
      console.info(`[sync-maladie] Copied ${e.name} -> public/maladie/${e.name}`);
    } catch (err) {
      console.warn(`[sync-maladie] Failed to copy ${e.name}:`, err?.message || err);
    }
  }
}

main().catch(err => {
  console.warn('[sync-maladie] Unexpected error:', err?.message || err);
});
