/**
 * Bots data: projects, the roster, and the chat threads Bots has worked in.
 *
 * Everything Bots owns lives under `$DSH_HOME/cache/bots/` as plain JSON, so
 * this module only reads those files. It never writes them: a project's folder
 * and a chat's thread belong to the Bots plugin.
 *
 * @module dsh-hindsight-manager/lib/bots
 */

import { join } from 'node:path';
import { cleanPath, countOf, dshHome, isoTime, readJsonFile, slug } from './util.mjs';

export function botsDir() {
  return join(dshHome(), 'cache', 'bots');
}

/** Catalog templates that are chat channels rather than MCP servers. */
const CHANNEL_TEMPLATES = new Set(['telegram', 'discord', 'feishu-chat', 'slack-chat', 'github-issues', 'wecom-chat', 'qq-chat']);

export function readProjects() {
  const file = join(botsDir(), 'projects.json');
  const store = readJsonFile(file, null);
  const list = Array.isArray(store?.projects) ? store.projects : [];
  const items = list
    .filter((project) => project && typeof project === 'object')
    .map((project) => ({
      id: String(project.id || ''),
      key: typeof project.key === 'string' ? project.key : '',
      name: typeof project.name === 'string' ? project.name : '',
      dir: typeof project.dir === 'string' ? cleanPath(project.dir) : '',
      brief: typeof project.brief === 'string' ? project.brief : '',
      repo: typeof project.repo === 'string' ? project.repo : '',
      members: Array.isArray(project.members) ? project.members.filter((m) => typeof m === 'string') : [],
      createdAt: isoTime(project.createdAt),
      updatedAt: isoTime(project.updatedAt),
    }))
    .filter((project) => project.id || project.key)
    .sort((a, b) => Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0));
  return { path: file, exists: store !== null, items };
}

export function readRoster() {
  const file = join(botsDir(), 'bots.json');
  const store = readJsonFile(file, null);
  const list = Array.isArray(store?.bots) ? store.bots : [];
  const bots = list
    .filter((bot) => bot && typeof bot === 'object')
    .map((bot) => ({
      id: String(bot.id || ''),
      handle: typeof bot.handle === 'string' ? bot.handle : '',
      name: typeof bot.name === 'string' ? bot.name : '',
      role: typeof bot.role === 'string' ? bot.role : '',
      team: typeof bot.team === 'string' ? bot.team : '',
      sessionId: typeof bot.sessionId === 'string' ? bot.sessionId : '',
      apps: Array.isArray(bot.apps)
        ? bot.apps
            .filter((app) => app && typeof app === 'object' && app.enabled !== false)
            .map((app) => ({
              id: String(app.id || ''),
              template: typeof app.template === 'string' ? app.template : '',
              name: typeof app.name === 'string' ? app.name : '',
              channel: CHANNEL_TEMPLATES.has(String(app.template || '')),
            }))
        : [],
    }));
  return { path: file, exists: store !== null, bots };
}

/**
 * Group chat threads, one row per chat (topics of the same chat are folded).
 * A thread key is `kind:appKey:chatId[:rootId]`; panels are not chats.
 */
export function readChats() {
  const file = join(botsDir(), 'tickets.json');
  const store = readJsonFile(file, null);
  const threads = Array.isArray(store?.threads) ? store.threads : [];
  const roster = readRoster();
  const byId = new Map(roster.bots.map((bot) => [bot.id, bot]));
  const chats = new Map();

  for (const thread of threads) {
    if (!thread || typeof thread !== 'object') continue;
    const kind = typeof thread.kind === 'string' ? thread.kind : '';
    const appKey = typeof thread.appKey === 'string' ? thread.appKey : '';
    const chatId = thread.chatId === undefined || thread.chatId === null ? '' : String(thread.chatId);
    if (!kind || kind === 'panel' || !chatId) continue;
    const id = `${kind}:${appKey}:${chatId}`;
    const tickets = Array.isArray(thread.tickets) ? thread.tickets : [];
    const lastAt = countOf(thread.lastAt) || Date.parse(thread.lastAt || 0) || 0;
    const current = chats.get(id) || {
      id,
      kind,
      appKey,
      chatId,
      label: '',
      threadKeys: [],
      tickets: 0,
      lastAt: 0,
      bot: null,
    };
    current.threadKeys.push(String(thread.key || id));
    current.tickets += tickets.length;
    current.lastAt = Math.max(current.lastAt, Number.isFinite(lastAt) ? lastAt : 0);
    if (typeof thread.label === 'string' && thread.label.trim()) current.label = thread.label.trim();
    // `appKey` is `<botId>/<appId>`; the channel app belongs to that bot.
    const owner = appKey.split('/')[0];
    if (!current.bot && byId.has(owner)) current.bot = { id: owner, handle: byId.get(owner).handle, name: byId.get(owner).name };
    chats.set(id, current);
  }

  const items = [...chats.values()]
    .map((chat) => ({
      ...chat,
      label: chat.label || `${chat.kind} ${String(chat.chatId).slice(-8)}`,
      lastAt: chat.lastAt ? new Date(chat.lastAt).toISOString() : null,
      suggestedBank: `bots::chat::${slug(chat.kind, 'chat')}::${slug(String(chat.chatId).slice(-24), 'chat')}`,
    }))
    .sort((a, b) => Date.parse(b.lastAt || 0) - Date.parse(a.lastAt || 0));

  return { path: file, exists: store !== null, items, bots: roster.bots };
}

/** Channel apps the roster holds, whether or not a chat has been recorded yet. */
export function listChannelApps() {
  const roster = readRoster();
  const apps = [];
  for (const bot of roster.bots) {
    for (const app of bot.apps) {
      if (!app.channel) continue;
      apps.push({ botId: bot.id, handle: bot.handle, botName: bot.name, appId: app.id, template: app.template, name: app.name || app.template });
    }
  }
  return apps;
}
