/**
 * Small filesystem / path helpers shared by the Host half.
 *
 * Nothing here touches a DSH profile: the plugin only reads DSH's own stores
 * (workspace registry, Bots cache) and rewrites the coding-agent configuration
 * file that the Hindsight DSH plugin already owns.
 *
 * @module dsh-hindsight-manager/lib/util
 */

import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, normalize, resolve, sep } from 'node:path';

/** DSH home directory: `$DSH_HOME` or `~/.dsh`. */
export function dshHome() {
  const configured = process.env.DSH_HOME;
  return configured && configured.trim() ? resolve(configured.trim()) : join(homedir(), '.dsh');
}

/** The coding-agent plugin's configuration file. */
export function defaultAgentConfigPath() {
  return join(homedir(), '.hindsight', 'coding-agent.json');
}

/** Our own state file (chat bindings, labels). */
export function managerStatePath() {
  return join(dshHome(), 'cache', 'hindsight-manager', 'state.json');
}

export function readJsonFile(file, fallback) {
  try {
    const text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(text);
  } catch (error) {
    if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) return fallback;
    throw new Error(`cannot read ${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function readTextFile(file, fallback = null) {
  try {
    return readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  } catch {
    return fallback;
  }
}

/**
 * Write JSON atomically: a temp file next to the target, then a rename.
 * `backup` copies the previous file once (to `<name>.bak` when it does not
 * exist yet) so a bad write never strands the user's configuration.
 */
export function writeJsonAtomic(file, value, { backup = false, indent = 2 } = {}) {
  mkdirSync(dirname(file), { recursive: true });
  const text = `${JSON.stringify(value, null, indent)}\n`;
  if (backup && existsSync(file)) {
    const bak = `${file}.bak`;
    if (!existsSync(bak)) {
      try {
        copyFileSync(file, bak);
      } catch {
        /* a backup that cannot be written must not block the change */
      }
    }
  }
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmp, text, 'utf8');
  renameSync(tmp, file);
}

export function mtimeOf(file) {
  try {
    return statSync(file).mtimeMs;
  } catch {
    return 0;
  }
}

export function pathExists(p) {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
}

/** A directory path as an absolute path without a trailing separator. */
export function cleanPath(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return '';
  let next = isAbsolute(text) ? normalize(text) : resolve(text);
  while (next.length > 3 && next.endsWith(sep)) next = next.slice(0, -1);
  return next;
}

export const lowerPath = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);

/** Whether `child` is `parent` or lives inside it. */
export function isWithin(parent, child) {
  if (!parent || !child) return false;
  const a = lowerPath(cleanPath(parent));
  const b = lowerPath(cleanPath(child));
  if (a === b) return true;
  return b.startsWith(a.endsWith(sep) ? a : `${a}${sep}`);
}

/**
 * Longest-prefix lookup, matching the coding-agent plugin's own rule
 * (`mapLookup`): the deepest configured directory wins.
 */
export function longestMapping(map, directory) {
  if (!map || typeof map !== 'object' || !directory) return null;
  let best = null;
  for (const [key, value] of Object.entries(map)) {
    if (typeof value !== 'string' || !key) continue;
    if (!isWithin(key, directory)) continue;
    const depth = cleanPath(key).split(/[\\/]/).filter(Boolean).length;
    if (!best || depth > best.depth) best = { path: cleanPath(key), bankId: value, depth };
  }
  return best;
}

/** Map keys are stored exactly, but Windows paths differ only by case. */
export function findMappingKey(map, directory) {
  if (!map || typeof map !== 'object' || !directory) return null;
  const target = lowerPath(cleanPath(directory));
  for (const key of Object.keys(map)) {
    if (lowerPath(cleanPath(key)) === target) return key;
  }
  return null;
}

const BANK_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export function isValidBankId(value) {
  return typeof value === 'string' && BANK_ID_RE.test(value);
}

/** A readable suffix for a generated bank id. */
export function slug(text, fallback = 'untitled') {
  const raw = typeof text === 'string' ? text.trim() : '';
  const base = raw
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48)
    .replace(/^-+|-+$/g, '');
  const lossless = base.length > 0 && base === raw;
  const head = base || fallback;
  // `我的项目` loses every character in a bank id, and `OPC 项目` / `OPC 前端`
  // both collapse to `OPC`. A short stable hash keeps generated ids distinct.
  if (lossless) return head;
  return `${head}-${hash4(raw)}`;
}

function hash4(text) {
  let hash = 5381;
  for (const ch of String(text)) {
    hash = ((hash * 33) ^ (ch.codePointAt(0) ?? 0)) >>> 0;
  }
  return hash.toString(36).slice(0, 4).padStart(4, '0');
}

export function displayName(value, fallback = '') {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
}

export function isoTime(value) {
  if (!value) return null;
  const ms = typeof value === 'number' ? value : Date.parse(value);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

export function countOf(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

/** `OPC` -> `bots::project::OPC` */
export function projectBankId(key) {
  return `bots::project::${slug(key, 'project')}`;
}

/** `feishu|oc_xxx` -> `bots::chat::feishu::oc-xxx` */
export function chatBankId(kind, chatId) {
  return `bots::chat::${slug(kind, 'chat')}::${slug(String(chatId || '').slice(-24), 'chat')}`;
}

export function fileBase(p) {
  return basename(cleanPath(p)) || 'workspace';
}
