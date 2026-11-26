/**
 * DSH workspaces, read from the host's own workspace registry store.
 *
 * The registry keeps `{ tables: { workspaces: { [id]: { path, title,
 * sessionIds, createdAt, updatedAt } } } }` in `$DSH_HOME/storages/workspace.json`.
 * Reading it (instead of the live service) keeps this plugin usable in a
 * profile where the workspace service is not exported, and it is read-only.
 *
 * @module dsh-hindsight-manager/lib/workspaces
 */

import { join } from 'node:path';
import { cleanPath, dshHome, isoTime, readJsonFile } from './util.mjs';

export function workspaceStorePath() {
  return join(dshHome(), 'storages', 'workspace.json');
}

function normalizeEntry(id, value) {
  if (!value || typeof value !== 'object') return null;
  const dir = typeof value.path === 'string' ? cleanPath(value.path) : '';
  if (!dir) return null;
  return {
    id: String(id),
    path: dir,
    title: typeof value.title === 'string' && value.title.trim() ? value.title.trim() : dir.split(/[\\/]/).filter(Boolean).pop() || dir,
    sessions: Array.isArray(value.sessionIds) ? value.sessionIds.length : 0,
    createdAt: isoTime(value.createdAt),
    updatedAt: isoTime(value.updatedAt),
  };
}

/** Every workspace the host knows, newest activity first. */
export function listWorkspaces() {
  const file = workspaceStorePath();
  const store = readJsonFile(file, null);
  if (!store || typeof store !== 'object') return { path: file, exists: false, items: [] };
  const table = store?.tables?.workspaces;
  let entries = [];
  if (table && typeof table === 'object') {
    entries = Object.entries(table).map(([id, value]) => normalizeEntry(id, value));
  } else if (Array.isArray(store.workspaces)) {
    entries = store.workspaces.map((value, index) => normalizeEntry(value?.id ?? index, value));
  }
  const items = entries
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0));
  return { path: file, exists: true, items };
}
