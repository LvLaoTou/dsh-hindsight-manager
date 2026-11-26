/**
 * The manager's operations: one facade shared by the web routes and the agent
 * tool, so a button in the page and a tool call do exactly the same thing.
 *
 * @module dsh-hindsight-manager/lib/api
 */

import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import {
  cleanPath,
  countOf,
  dshHome,
  fileBase,
  findMappingKey,
  isValidBankId,
  longestMapping,
  lowerPath,
  managerStatePath,
  mtimeOf,
  pathExists,
  projectBankId,
  chatBankId,
  readJsonFile,
  slug,
  writeJsonAtomic,
} from './util.mjs';
import { createHindsightClient, loadAgentConfig, saveAgentConfig, withMapping, withoutMapping } from './hindsight.mjs';
import { listWorkspaces, workspaceStorePath } from './workspaces.mjs';
import { botsDir, readChats, readProjects, readRoster } from './bots.mjs';

const STATE_VERSION = 1;

function emptyState() {
  return { version: STATE_VERSION, chats: {} };
}

function readState() {
  const store = readJsonFile(managerStatePath(), null);
  if (!store || typeof store !== 'object') return emptyState();
  return {
    version: STATE_VERSION,
    chats: store.chats && typeof store.chats === 'object' && !Array.isArray(store.chats) ? { ...store.chats } : {},
  };
}

function writeState(state) {
  writeJsonAtomic(managerStatePath(), { version: STATE_VERSION, chats: state.chats ?? {} });
}

export function createApi({ config = {}, logger = null } = {}) {
  const startedAt = Date.now();

  function load() {
    const file = loadAgentConfig(config.agentConfigPath || '');
    const pluginUrl = typeof config.apiUrl === 'string' ? config.apiUrl.trim() : '';
    const pluginToken = typeof config.apiToken === 'string' ? config.apiToken.trim() : '';
    return {
      ...file,
      apiUrl: pluginUrl || file.apiUrl,
      apiToken: pluginToken || file.apiToken,
      apiTokenSource: pluginToken ? 'plugin config' : file.apiTokenSource,
    };
  }

  const clientOf = (cfg) => createHindsightClient({ apiUrl: cfg.apiUrl, apiToken: cfg.apiToken });

  async function ensureBank(cfg, bankId, mission, create) {
    if (!isValidBankId(bankId)) {
      throw new Error(`bank id 不合法：${bankId}（只允许字母、数字、. _ : -，最长 128）`);
    }
    const client = clientOf(cfg);
    const existing = await client.getBank(bankId);
    if (existing) return { created: false, bank: existing };
    if (!create) throw new Error(`bank “${bankId}” 不存在，且未允许创建`);
    const fields = {};
    const text = typeof mission === 'string' ? mission.trim() : '';
    if (text) {
      fields.reflect_mission = text;
      fields.name = bankId;
    }
    const bank = await client.createBank(bankId, fields);
    return { created: true, bank };
  }

  function categorize(bankId, paths, cfg, state, projects, workspaces) {
    if (state.chats) {
      for (const chat of Object.values(state.chats)) {
        if (chat && chat.bankId === bankId) return 'chat';
      }
    }
    if (bankId.startsWith('bots::chat::')) return 'chat';
    if (bankId.startsWith('bots::project::')) return 'project';
    if (bankId.startsWith('workspace::')) return 'workspace';
    for (const project of projects) {
      if (project.dir && lowerPath(project.dir) === lowerPath(paths[0] || '')) return 'project';
    }
    if (paths.some((p) => workspaces.some((w) => lowerPath(w.path) === lowerPath(p)))) return 'workspace';
    return 'other';
  }

  function mappingList(cfg) {
    return Object.entries(cfg.mapPathToBank)
      .filter(([, bankId]) => typeof bankId === 'string')
      .map(([path, bankId]) => ({ path, bankId }));
  }

  function pathsByBank(cfg) {
    const map = new Map();
    for (const entry of mappingList(cfg)) {
      const list = map.get(entry.bankId) || [];
      list.push(entry.path);
      map.set(entry.bankId, list);
    }
    return map;
  }

  function workspacesOf(cfg) {
    const registry = listWorkspaces();
    const items = registry.items.map((workspace) => {
      const ownKey = findMappingKey(cfg.mapPathToBank, workspace.path);
      const inherited = ownKey ? null : longestMapping(cfg.mapPathToBank, workspace.path);
      return {
        ...workspace,
        bankId: ownKey ? cfg.mapPathToBank[ownKey] : inherited ? inherited.bankId : '',
        mappingKind: ownKey ? 'own' : inherited ? 'inherited' : 'none',
        inheritedFrom: inherited ? inherited.path : null,
        suggestedBank: `workspace::${slug(workspace.title || fileBase(workspace.path), 'workspace')}`,
      };
    });
    return { ...registry, items };
  }

  function projectsOf(cfg) {
    const registry = readProjects();
    const items = registry.items.map((project) => {
      const ownKey = project.dir ? findMappingKey(cfg.mapPathToBank, project.dir) : null;
      const inherited = !ownKey && project.dir ? longestMapping(cfg.mapPathToBank, project.dir) : null;
      return {
        ...project,
        folderExists: project.dir ? pathExists(project.dir) : false,
        bankId: ownKey ? cfg.mapPathToBank[ownKey] : inherited ? inherited.bankId : '',
        mappingKind: ownKey ? 'own' : inherited ? 'inherited' : 'none',
        suggestedBank: project.key ? projectBankId(project.key) : `bots::project::${slug(project.id)}`,
      };
    });
    return { ...registry, items };
  }

  function botsWorkdir() {
    return join(homedir(), 'bots', 'workspace');
  }

  /**
   * A chat's own folder under the manager's cache. Bots sessions run per
   * folder, so a bank needs a folder of its own rather than the shared Bots
   * workdir (binding that would reroute every bot home at once).
   */
  function chatFolderFor(chat) {
    return join(dshHome(), 'cache', 'hindsight-manager', 'chats', slug(`${chat.kind}-${chat.chatId}`, 'chat').slice(0, 64));
  }

  function chatsOf(cfg, state) {
    const registry = readChats();
    const items = registry.items.map((chat) => {
      const binding = state.chats[chat.id] && typeof state.chats[chat.id] === 'object' ? state.chats[chat.id] : null;
      const folder = (binding && typeof binding.folder === 'string' && binding.folder) || '';
      const ownKey = folder ? findMappingKey(cfg.mapPathToBank, folder) : null;
      return {
        ...chat,
        label: (binding && binding.label) || chat.label,
        bankId: (ownKey ? cfg.mapPathToBank[ownKey] : '') || (binding && binding.bankId) || '',
        boundBankId: (binding && binding.bankId) || '',
        folder,
        defaultFolder: chatFolderFor(chat),
        botsFolder: botsWorkdir(),
        folderMappedTo: ownKey ? cfg.mapPathToBank[ownKey] : '',
        suggestedBank: chat.suggestedBank || chatBankId(chat.kind, chat.chatId),
      };
    });
    return { ...registry, items, bots: registry.bots, botsFolder: botsWorkdir() };
  }

  const api = {
    configPath() {
      return load().path;
    },

    async overview() {
      const cfg = load();
      const state = readState();
      const registry = listWorkspaces();
      const projects = readProjects();
      const chats = readChats();
      let health = { ok: false };
      let version = null;
      const started = Date.now();
      try {
        const client = clientOf(cfg);
        const result = await client.health();
        health = { ok: true, status: result?.status ?? 'ok', database: result?.database ?? null, latencyMs: Date.now() - started };
        try {
          const v = await client.version();
          version = typeof v === 'string' ? v : v?.version ?? null;
        } catch {
          version = null;
        }
      } catch (error) {
        health = { ok: false, error: error instanceof Error ? error.message : String(error), latencyMs: Date.now() - started };
      }
      const mappings = mappingList(cfg);
      const projectItems = projects.items;
      const workspaceItems = registry.items;
      const pathsFor = pathsByBank(cfg);
      let banks = [];
      let banksError = null;
      try {
        const client = clientOf(cfg);
        const list = await client.listBanks();
        banks = list.banks;
      } catch (error) {
        banksError = error instanceof Error ? error.message : String(error);
      }
      const categories = { workspace: 0, project: 0, chat: 0, other: 0 };
      for (const bank of banks) {
        categories[categorize(bank.bank_id, pathsFor.get(bank.bank_id) || [], cfg, state, projectItems, workspaceItems)] += 1;
      }
      const mappedWorkspaces = workspaceItems.filter((w) => w.mappingKind !== 'none').length;
      const mappedProjects = projectItems.filter((p) => p.mappingKind !== 'none').length;
      const boundChats = Object.values(state.chats).filter((chat) => chat && chat.bankId).length;
      const configMtime = mtimeOf(cfg.path);
      return {
        config: {
          path: cfg.path,
          exists: cfg.exists,
          apiUrl: cfg.apiUrl,
          apiTokenSource: cfg.apiTokenSource,
          tokenSet: Boolean(cfg.apiToken),
          serverMode: cfg.serverMode,
          template: cfg.bankIdTemplate,
          disabled: cfg.disabled,
          mappings,
        },
        health,
        version,
        banks: { total: banks.length, error: banksError, categories },
        counts: {
          workspaces: workspaceItems.length,
          mappedWorkspaces,
          projects: projectItems.length,
          mappedProjects,
          chats: chats.items.length,
          boundChats,
          mappings: mappings.length,
        },
        restart: {
          configMtime,
          savedAfterStart: configMtime > startedAt,
          startedAt,
          hint: '已在本次运行中使用过的工作区，其 bank 在重启 DSH 后切换；新工作区立即生效。',
        },
        sources: {
          workspaces: workspaceStorePath(),
          bots: botsDir(),
          state: managerStatePath(),
        },
      };
    },

    async banks() {
      const cfg = load();
      const state = readState();
      const registry = listWorkspaces();
      const projects = readProjects().items;
      const client = clientOf(cfg);
      const list = await client.listBanks();
      const pathsFor = pathsByBank(cfg);
      const items = list.banks
        .map((bank) => {
          const paths = pathsFor.get(bank.bank_id) || [];
          const category = categorize(bank.bank_id, paths, cfg, state, projects, registry.items);
          const project = projects.find((p) => p.dir && paths.some((path) => lowerPath(path) === lowerPath(p.dir))) || null;
          const chat = Object.entries(state.chats).find(([, value]) => value && value.bankId === bank.bank_id);
          return {
            bankId: bank.bank_id,
            category,
            mission: typeof bank.mission === 'string' ? bank.mission : '',
            factCount: countOf(bank.fact_count),
            createdAt: bank.created_at ?? null,
            updatedAt: bank.updated_at ?? null,
            lastDocumentAt: bank.last_document_at ?? null,
            lastWriteAt: bank.last_write_at ?? null,
            paths,
            project: project ? { id: project.id, key: project.key, name: project.name } : null,
            chat: chat ? { id: chat[0], label: chat[1].label || '' } : null,
          };
        })
        .sort((a, b) => (b.factCount || 0) - (a.factCount || 0));
      return { items, total: list.total };
    },

    async workspaces() {
      const cfg = load();
      return workspacesOf(cfg);
    },

    async projects() {
      const cfg = load();
      return projectsOf(cfg);
    },

    async chats() {
      const cfg = load();
      const state = readState();
      const result = chatsOf(cfg, state);
      return { ...result, defaultFolder: botsWorkdir() };
    },

    async createBank({ bankId, mission } = {}) {
      const cfg = load();
      const id = typeof bankId === 'string' ? bankId.trim() : '';
      if (!id) throw new Error('需要 bank id');
      if (!isValidBankId(id)) throw new Error(`bank id 不合法：${id}`);
      const client = clientOf(cfg);
      const existing = await client.getBank(id);
      if (existing) throw new Error(`bank “${id}” 已存在`);
      const fields = {};
      const text = typeof mission === 'string' ? mission.trim() : '';
      if (text) {
        fields.reflect_mission = text;
        fields.name = id;
      }
      const created = await client.createBank(id, fields);
      return { ok: true, bankId: id, created: true, bank: created };
    },

    async setBankMission({ bankId, mission } = {}) {
      const cfg = load();
      const id = typeof bankId === 'string' ? bankId.trim() : '';
      if (!isValidBankId(id)) throw new Error(`bank id 不合法：${id}`);
      const client = clientOf(cfg);
      const text = typeof mission === 'string' ? mission.trim() : '';
      await client.patchBank(id, { reflect_mission: text, name: id });
      return { ok: true, bankId: id, mission: text };
    },

    async deleteBank({ bankId, force = false, removeMappings = true } = {}) {
      const cfg = load();
      const id = typeof bankId === 'string' ? bankId.trim() : '';
      if (!isValidBankId(id)) throw new Error(`bank id 不合法：${id}`);
      const client = clientOf(cfg);
      const existing = await client.getBank(id);
      if (!existing) throw new Error(`bank “${id}” 不存在`);
      const facts = countOf(existing?.fact_count);
      if (facts > 0 && !force) throw new Error(`bank “${id}” 里还有 ${facts} 条事实；确认删除请传 force`);
      // Delete first: a failed server call must not leave the config pointing
      // at a bank that still exists.
      const result = await client.deleteBank(id);
      let raw = cfg.raw;
      let mappingsChanged = false;
      if (removeMappings) {
        for (const [path, bankId] of Object.entries(cfg.mapPathToBank)) {
          if (bankId === id) {
            raw = withoutMapping(raw, path);
            mappingsChanged = true;
          }
        }
        if (mappingsChanged) saveAgentConfig(cfg.path, raw);
      }
      const state = readState();
      let stateChanged = false;
      for (const [key, chat] of Object.entries(state.chats)) {
        if (chat && chat.bankId === id) {
          delete state.chats[key];
          stateChanged = true;
        }
      }
      if (stateChanged) writeState(state);
      return { ok: true, bankId: id, facts, result };
    },

    async bindWorkspace({ path, bankId, mission, create = true } = {}) {
      const cfg = load();
      const dir = cleanPath(path);
      if (!dir) throw new Error('需要工作区路径');
      if (!pathExists(dir)) throw new Error(`工作区目录不存在：${dir}`);
      const registry = listWorkspaces();
      const known = registry.items.find((item) => lowerPath(item.path) === lowerPath(dir));
      const id = String(bankId || '').trim() || `workspace::${slug(known?.title || fileBase(dir), 'workspace')}`;
      const { created } = await ensureBank(cfg, id, mission, create !== false);
      const raw = withMapping(cfg.raw, dir, id);
      saveAgentConfig(cfg.path, raw);
      return { ok: true, path: dir, bankId: id, created, restartRequired: true };
    },

    async unbindWorkspace({ path } = {}) {
      const cfg = load();
      const dir = cleanPath(path);
      if (!dir) throw new Error('需要工作区路径');
      const key = findMappingKey(cfg.mapPathToBank, dir);
      if (!key) throw new Error(`没有指向 ${dir} 的映射`);
      const raw = withoutMapping(cfg.raw, key);
      saveAgentConfig(cfg.path, raw);
      return { ok: true, path: key, bankId: cfg.mapPathToBank[key] };
    },

    async bindAllWorkspaces() {
      const cfg = load();
      const registry = listWorkspaces();
      const results = [];
      let raw = cfg.raw;
      for (const workspace of registry.items) {
        if (findMappingKey(raw.mapPathToBank, workspace.path)) continue;
        const id = `workspace::${slug(workspace.title || fileBase(workspace.path), 'workspace')}`;
        try {
          const { created } = await ensureBank(cfg, id, '', true);
          raw = withMapping(raw, workspace.path, id);
          results.push({ path: workspace.path, bankId: id, ok: true, created });
        } catch (error) {
          results.push({ path: workspace.path, ok: false, error: error instanceof Error ? error.message : String(error) });
        }
      }
      if (results.some((item) => item.ok)) saveAgentConfig(cfg.path, raw);
      return { ok: true, results, applied: results.filter((item) => item.ok).length };
    },

    async bindProject({ projectId, projectKey, bankId, mission, create = true } = {}) {
      const cfg = load();
      const registry = readProjects();
      const project = registry.items.find(
        (item) => (projectId && item.id === projectId) || (projectKey && item.key.toUpperCase() === String(projectKey).toUpperCase()),
      );
      if (!project) throw new Error(`找不到项目：${projectId || projectKey || '(空)'}`);
      if (!project.dir) throw new Error(`项目 ${project.key || project.id} 没有文件夹；先在 Bots 看板上为它设置文件夹`);
      if (!pathExists(project.dir)) throw new Error(`项目文件夹不存在：${project.dir}`);
      const id = String(bankId || '').trim() || (project.key ? projectBankId(project.key) : `bots::project::${slug(project.id)}`);
      const { created } = await ensureBank(cfg, id, mission, create !== false);
      const raw = withMapping(cfg.raw, project.dir, id);
      saveAgentConfig(cfg.path, raw);
      return { ok: true, project: { id: project.id, key: project.key, name: project.name }, path: project.dir, bankId: id, created, restartRequired: true };
    },

    async unbindProject({ projectId, projectKey } = {}) {
      const cfg = load();
      const registry = readProjects();
      const project = registry.items.find(
        (item) => (projectId && item.id === projectId) || (projectKey && item.key.toUpperCase() === String(projectKey).toUpperCase()),
      );
      if (!project) throw new Error(`找不到项目：${projectId || projectKey || '(空)'}`);
      if (!project.dir) throw new Error('该项目没有文件夹');
      const key = findMappingKey(cfg.mapPathToBank, project.dir);
      if (!key) throw new Error(`项目 ${project.key} 的文件夹没有映射`);
      saveAgentConfig(cfg.path, withoutMapping(cfg.raw, key));
      return { ok: true, project: project.key, path: key };
    },

    async bindChat({ id, bankId, folder, label, mission, create = true } = {}) {
      const cfg = load();
      const state = readState();
      const registry = readChats();
      const chat = registry.items.find((item) => item.id === id);
      if (!chat) throw new Error(`找不到群聊：${id || '(空)'}`);
      const provided = String(folder || '').trim();
      const target = provided ? cleanPath(provided) : state.chats[id]?.folder || chatFolderFor(chat);
      if (!pathExists(target)) {
        if (provided) throw new Error(`目录不存在：${target}（请先创建，或留空使用插件为该群准备的目录）`);
        mkdirSync(target, { recursive: true });
      }
      const bank = String(bankId || '').trim() || chat.suggestedBank;
      const { created } = await ensureBank(cfg, bank, mission, create !== false);
      const existingKey = findMappingKey(cfg.mapPathToBank, target);
      let warning = '';
      if (existingKey && cfg.mapPathToBank[existingKey] !== bank) {
        warning = `目录 ${target} 原本映射到 ${cfg.mapPathToBank[existingKey]}，现已改绑到 ${bank}：同一目录下的其他会话也会进入这个 bank。`;
      }
      saveAgentConfig(cfg.path, withMapping(cfg.raw, target, bank));
      state.chats[id] = {
        bankId: bank,
        label: label || chat.label,
        folder: target,
        kind: chat.kind,
        appKey: chat.appKey,
        chatId: chat.chatId,
        at: new Date().toISOString(),
      };
      writeState(state);
      return { ok: true, chat: id, bankId: bank, folder: target, created, warning, restartRequired: true };
    },

    async unbindChat({ id } = {}) {
      const cfg = load();
      const state = readState();
      const registry = readChats();
      const chat = registry.items.find((item) => item.id === id);
      const binding = state.chats[id];
      const folder = (binding && binding.folder) || (chat ? chatFolderFor(chat) : '');
      const folderKey = folder ? findMappingKey(cfg.mapPathToBank, folder) : null;
      if (!binding && !folderKey) throw new Error(`群聊 ${id} 没有绑定`);
      const stillUsed = Object.entries(state.chats).some(
        ([key, value]) => key !== id && value && lowerPath(value.folder || '') === lowerPath(folder || ''),
      );
      let unmapped = false;
      if (folderKey && !stillUsed) {
        saveAgentConfig(cfg.path, withoutMapping(cfg.raw, folderKey));
        unmapped = true;
      }
      if (binding) {
        delete state.chats[id];
        writeState(state);
      }
      return { ok: true, id, folderUnmapped: unmapped };
    },
  };

  return api;
}
