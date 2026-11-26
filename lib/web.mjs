/**
 * Same-origin HTTP API for the manager page.
 *
 * The page is rendered by the host (not an iframe), so it talks to this route
 * with `fetch`. Every request is fenced to loopback / the host's trusted
 * authorities, the same policy the MCP connector uses, because these methods
 * rewrite a configuration file.
 *
 * @module dsh-hindsight-manager/lib/web
 */

const MAX_BODY = 1024 * 1024;

const METHODS = new Map([
  ['overview', (api, p) => api.overview(p)],
  ['banks', (api, p) => api.banks(p)],
  ['workspaces', (api, p) => api.workspaces(p)],
  ['projects', (api, p) => api.projects(p)],
  ['chats', (api, p) => api.chats(p)],
  ['createBank', (api, p) => api.createBank(p ?? {})],
  ['setBankMission', (api, p) => api.setBankMission(p ?? {})],
  ['deleteBank', (api, p) => api.deleteBank(p ?? {})],
  ['bindWorkspace', (api, p) => api.bindWorkspace(p ?? {})],
  ['unbindWorkspace', (api, p) => api.unbindWorkspace(p ?? {})],
  ['bindAllWorkspaces', (api) => api.bindAllWorkspaces()],
  ['bindProject', (api, p) => api.bindProject(p ?? {})],
  ['unbindProject', (api, p) => api.unbindProject(p ?? {})],
  ['bindChat', (api, p) => api.bindChat(p ?? {})],
  ['unbindChat', (api, p) => api.unbindChat(p ?? {})],
]);

function header(headers, name) {
  const value = headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

function parseAuthority(host) {
  try {
    return new URL(`http://${host}`);
  } catch {
    return undefined;
  }
}

function isLoopbackHostname(name) {
  const host = String(name || '').toLowerCase().replace(/^\[|\]$/g, '');
  return host === 'localhost' || host === '::1' || /^127(?:\.\d{1,3}){3}$/.test(host);
}

function isTrustedAuthority(url, trustedHosts) {
  if (!Array.isArray(trustedHosts)) return false;
  return trustedHosts.some((entry) => {
    try {
      const trusted = new URL(String(entry).includes('://') ? String(entry) : `http://${entry}`);
      return trusted.host === url.host;
    } catch {
      return false;
    }
  });
}

export function isTrustedRequest(request, trustedHosts = []) {
  const host = header(request.headers, 'host');
  if (!host) return false;
  const url = parseAuthority(host);
  if (!url) return false;
  if (!isLoopbackHostname(url.hostname) && !isTrustedAuthority(url, trustedHosts)) return false;
  if (header(request.headers, 'sec-fetch-site') === 'cross-site') return false;
  const origin = header(request.headers, 'origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === url.host;
  } catch {
    return false;
  }
}

function writeJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function readJsonBody(req) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > MAX_BODY) throw new Error('请求体不能超过 1 MiB');
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text.trim()) return {};
  return JSON.parse(text);
}

export function mountApi(wctx, api, { logger, trustedHosts = [] } = {}) {
  return wctx.webServer.register({
    kind: 'prefix',
    path: '/hindsight-manager/api',
    handler: async (req, res) => {
      if (!isTrustedRequest(req, trustedHosts)) {
        writeJson(res, 403, { ok: false, message: 'forbidden' });
        return;
      }
      if (req.method === 'GET') {
        // A read-only convenience endpoint: ?method=overview
        const method = new URL(req.url ?? '/', 'http://localhost').searchParams.get('method') || 'overview';
        const dispatch = METHODS.get(method);
        if (!dispatch) {
          writeJson(res, 400, { ok: false, message: `未知方法 "${method}"` });
          return;
        }
        try {
          const result = await dispatch(api, {});
          writeJson(res, 200, { ok: true, ...result });
        } catch (error) {
          writeJson(res, 400, { ok: false, message: error instanceof Error ? error.message : String(error) });
        }
        return;
      }
      if (req.method !== 'POST') {
        res.writeHead(405, { allow: 'GET, POST' });
        res.end();
        return;
      }
      try {
        const body = await readJsonBody(req);
        const dispatch = METHODS.get(body?.method);
        if (!dispatch) {
          writeJson(res, 400, { ok: false, message: `未知方法 "${body?.method ?? ''}"（可用：${[...METHODS.keys()].join('、')}）` });
          return;
        }
        const result = await dispatch(api, body?.params ?? {});
        writeJson(res, 200, { ok: true, ...result });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger?.warn?.(`api error: ${message}`);
        writeJson(res, 400, { ok: false, message });
      }
    },
  });
}

/**
 * Prefer `webStartup`; older hosts expose `webRuntime` instead. Both may be
 * present in one profile, so exactly one of them owns the route: `webStartup`
 * wins, and the mount follows whichever is available at the time.
 */
export function injectWebApi(ctx, api, options = {}) {
  const candidates = new Map();
  let active = null;
  let dispose = null;
  const reconcile = () => {
    const next = candidates.get('webStartup') ?? candidates.get('webRuntime') ?? null;
    if (next === active) return;
    if (dispose) {
      try {
        dispose();
      } catch {
        /* a route that is already gone must not block the swap */
      }
    }
    dispose = null;
    active = next;
    if (!next) return;
    dispose = mountApi(next.ctx, api, { ...options, trustedHosts: next.trustedHosts });
    options.logger?.info?.(`mounted at /hindsight-manager/api (${next.name})`);
  };
  for (const name of ['webStartup', 'webRuntime']) {
    ctx.inject(['webServer', name], (wctx) => {
      wctx.effect(() => {
        const candidate = { name, ctx: wctx, trustedHosts: wctx[name]?.trustedHosts ?? [] };
        candidates.set(name, candidate);
        reconcile();
        return () => {
          if (candidates.get(name) === candidate) candidates.delete(name);
          reconcile();
        };
      });
    });
  }
}
