/**
 * The Hindsight side: read/write the coding-agent configuration file, and talk
 * to the Hindsight REST API.
 *
 * Bank routing lives entirely in that one file — `mapPathToBank` maps an
 * absolute directory to a bank id, and the coding-agent plugin resolves a
 * session's bank from its working directory before it reads anything else. So
 * "adding a workspace to memory" is: create the bank (if needed) and write one
 * mapping entry.
 *
 * @module dsh-hindsight-manager/lib/hindsight
 */

import { readJsonFile, writeJsonAtomic, defaultAgentConfigPath, pathExists } from './util.mjs';

export const DEFAULT_API_URL = 'https://api.hindsight.vectorize.io';
const LIST_LIMIT = 500;

/** The three server modes the coding-agent plugin understands. */
export const SERVER_MODES = ['cloud', 'self-hosted', 'daemon'];

export class HttpError extends Error {
  constructor(status, message, body) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

/** Read the coding-agent config (or an empty shell when it does not exist). */
export function loadAgentConfig(overridePath = '', env = process.env) {
  const path = overridePath && overridePath.trim() ? overridePath.trim() : defaultAgentConfigPath();
  const exists = pathExists(path);
  const raw = exists ? readJsonFile(path, {}) : {};
  const config = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const envUrl = env.HINDSIGHT_API_URL && env.HINDSIGHT_API_URL.trim();
  const fileUrl = typeof config.apiUrl === 'string' && config.apiUrl.trim() ? config.apiUrl.trim() : '';
  const apiUrl = fileUrl || envUrl || DEFAULT_API_URL;
  const envToken = env.HINDSIGHT_API_TOKEN && env.HINDSIGHT_API_TOKEN.trim();
  const fileToken = typeof config.apiToken === 'string' && config.apiToken.trim() ? config.apiToken.trim() : '';
  const mode = typeof config.serverMode === 'string' && SERVER_MODES.includes(config.serverMode.trim())
    ? config.serverMode.trim()
    : 'cloud';
  const mapPathToBank =
    config.mapPathToBank && typeof config.mapPathToBank === 'object' && !Array.isArray(config.mapPathToBank)
      ? { ...config.mapPathToBank }
      : {};
  return {
    path,
    exists,
    raw: config,
    apiUrl,
    apiUrlSource: fileUrl ? 'file' : envUrl ? 'env' : 'default',
    fileApiUrl: fileUrl,
    apiToken: fileToken || envToken || '',
    apiTokenSource: fileToken ? 'file' : envToken ? 'env' : 'none',
    serverMode: mode,
    mapPathToBank,
    bankIdTemplate:
      typeof config.bankIdTemplate === 'string' && config.bankIdTemplate.trim()
        ? config.bankIdTemplate.trim()
        : 'coding-agent::{gitProject}',
    disabled: config.disabled === true,
  };
}

/**
 * A server address as the memory plugin will use it: http(s), no trailing
 * slash and no query, so `mapPathToBank` keys never depend on a stray `/`.
 */
export function normalizeApiUrl(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`服务地址不是合法的 URL：${text}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('服务地址只支持 http:// 或 https://');
  }
  url.hash = '';
  url.search = '';
  return url.toString().replace(/\/+$/, '');
}

/**
 * Apply a connection change to the config object. `undefined` leaves a field
 * alone; an empty `apiUrl` removes it (env / cloud default takes over).
 */
export function withConnection(raw, { apiUrl, serverMode, apiToken, clearToken } = {}) {
  const config = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
  if (apiUrl !== undefined) {
    if (apiUrl === '') delete config.apiUrl;
    else config.apiUrl = apiUrl;
  }
  if (serverMode !== undefined) {
    if (SERVER_MODES.includes(serverMode)) config.serverMode = serverMode;
    else delete config.serverMode;
  }
  if (typeof apiToken === 'string' && apiToken.trim()) config.apiToken = apiToken.trim();
  else if (clearToken) delete config.apiToken;
  return config;
}

/**
 * Persist the config back, preserving every field this plugin does not own.
 * A one-time `.bak` is written next to it on the first change.
 */
export function saveAgentConfig(path, nextConfig) {
  writeJsonAtomic(path, nextConfig, { backup: true });
}

/** The set of API fields a manager-generated mapping touches. */
export function withMapping(raw, directory, bankId) {
  const config = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
  const map =
    config.mapPathToBank && typeof config.mapPathToBank === 'object' && !Array.isArray(config.mapPathToBank)
      ? { ...config.mapPathToBank }
      : {};
  map[directory] = bankId;
  config.mapPathToBank = map;
  return config;
}

export function withoutMapping(raw, key) {
  const config = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
  const map =
    config.mapPathToBank && typeof config.mapPathToBank === 'object' && !Array.isArray(config.mapPathToBank)
      ? { ...config.mapPathToBank }
      : {};
  delete map[key];
  config.mapPathToBank = map;
  return config;
}

function joinUrl(base, suffix) {
  return `${base.replace(/\/+$/, '')}${suffix}`;
}

/** A thin REST client for the Hindsight server this machine already runs. */
export function createHindsightClient({ apiUrl, apiToken, timeoutMs = 20000 }) {
  const base = String(apiUrl || DEFAULT_API_URL).replace(/\/+$/, '');

  async function request(method, suffix, body) {
    const headers = { accept: 'application/json' };
    if (apiToken) headers.authorization = `Bearer ${apiToken}`;
    if (body !== undefined) headers['content-type'] = 'application/json';
    let response;
    try {
      response = await fetch(joinUrl(base, suffix), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new HttpError(0, `Hindsight 服务不可达（${base}）：${reason}`);
    }
    const text = await response.text();
    let parsed = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    if (!response.ok) {
      const detail =
        parsed && typeof parsed === 'object'
          ? parsed.detail || parsed.message || parsed.error || JSON.stringify(parsed).slice(0, 300)
          : String(parsed || response.statusText).slice(0, 300);
      throw new HttpError(response.status, `Hindsight ${response.status}: ${detail}`, parsed);
    }
    return parsed;
  }

  const bankPath = (bankId) => `/v1/default/banks/${encodeURIComponent(bankId)}`;

  return {
    apiUrl: base,
    async health() {
      return request('GET', '/health');
    },
    async version() {
      return request('GET', '/version');
    },
    async listBanks() {
      const result = await request('GET', `/v1/default/banks?limit=${LIST_LIMIT}`);
      const banks = Array.isArray(result?.banks) ? result.banks : Array.isArray(result) ? result : [];
      return { banks, total: Number(result?.total ?? banks.length) };
    },
    /**
     * The server has no GET for one bank (only PUT/PATCH/DELETE, and
     * `/profile` is retired with 410), so existence comes from the list.
     */
    async getBank(bankId) {
      const { banks } = await this.listBanks();
      return banks.find((bank) => bank.bank_id === bankId) ?? null;
    },
    async createBank(bankId, fields = {}) {
      return request('PUT', bankPath(bankId), fields);
    },
    async patchBank(bankId, fields = {}) {
      return request('PATCH', bankPath(bankId), fields);
    },
    async deleteBank(bankId) {
      try {
        return await request('DELETE', bankPath(bankId));
      } catch (error) {
        if (error instanceof HttpError && error.status === 404) return { success: true, missing: true };
        throw error;
      }
    },
  };
}
