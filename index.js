/**
 * Host half of dsh-hindsight-manager.
 *
 * What it does
 *  - Reads the DSH workspace registry and the Bots cache (projects, chat
 *    threads) to know what *could* be remembered.
 *  - Reads and rewrites `~/.hindsight/coding-agent.json`, the single file the
 *    Hindsight coding-agent plugin routes banks with, so a workspace, a Bots
 *    project folder or a chat's work folder points at its own bank.
 *  - Creates and describes banks through the Hindsight REST API.
 *  - Serves one same-origin API used by the page, and one agent tool so bots
 *    can create and inspect banks themselves.
 *
 * It never touches the DSH profile, the Bots store, or the Hindsight daemon's
 * data other than through that API.
 *
 * @module dsh-hindsight-manager
 */

import { createApi } from './lib/api.mjs';
import { injectWebApi } from './lib/web.mjs';

export const name = 'hindsight-manager';

const ACTIONS = [
  'status',
  'connection',
  'banks',
  'workspaces',
  'projects',
  'chats',
  'bind_workspace',
  'bind_all_workspaces',
  'bind_project',
  'bind_chat',
  'create_bank',
  'set_mission',
  'set_connection',
  'unbind_workspace',
  'unbind_project',
  'unbind_chat',
  'delete_bank',
];

const CATEGORY_LABEL = { workspace: '工作区', project: '项目', chat: '群聊', other: '其他' };

function line(...parts) {
  return parts.filter((part) => part !== undefined && part !== null && part !== '').join(' ');
}

function formatTime(value) {
  if (!value) return '';
  const ms = typeof value === 'number' ? value : Date.parse(value);
  if (!Number.isFinite(ms)) return '';
  const date = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function clipText(value, max) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${[...text].slice(0, max - 1).join('')}…`;
}

function formatOverview(data) {
  const out = [];
  out.push(`Hindsight：${data.config.apiUrl} ${data.health.ok ? `可用（${data.health.latencyMs}ms）` : `不可用 — ${data.health.error || '未知错误'}`}`);
  out.push(`配置文件：${data.config.path}${data.config.exists ? '' : '（尚不存在）'}`);
  out.push(`bank 分类：工作区 ${data.banks.categories.workspace} · 项目 ${data.banks.categories.project} · 群聊 ${data.banks.categories.chat} · 其他 ${data.banks.categories.other}（共 ${data.banks.total}）`);
  out.push(`工作区 ${data.counts.mappedWorkspaces}/${data.counts.workspaces} 已接入 · 项目 ${data.counts.mappedProjects}/${data.counts.projects} 已接入 · 群聊 ${data.counts.boundChats}/${data.counts.chats} 已绑定`);
  if (data.banks.error) out.push(`列出 bank 失败：${data.banks.error}`);
  if (data.restart.savedAfterStart) out.push('提示：配置在本次运行期间改过，已使用过的工作区重启 DSH 后才会切换 bank。');
  return out.join('\n');
}

function formatBanks(items) {
  if (!items.length) return '还没有 bank。';
  return items
    .map((bank) => {
      const paths = bank.paths.length ? ` ← ${bank.paths.join(', ')}` : '';
      const mission = bank.mission ? ` — ${clipText(bank.mission, 60)}` : '';
      const when = formatTime(bank.lastWriteAt);
      return line(`• ${bank.bankId}`, `[${CATEGORY_LABEL[bank.category] || bank.category}]`, `${bank.factCount} 条事实`, when ? `最后写入 ${when}` : '从未写入') + paths + mission;
    })
    .join('\n');
}

function formatWorkspaces(data) {
  if (!data.items.length) return 'DSH 里还没有工作区。';
  return data.items
    .map((workspace) => {
      const bank =
        workspace.mappingKind === 'own'
          ? workspace.bankId
          : workspace.mappingKind === 'inherited'
            ? `${workspace.bankId}（继承自 ${workspace.inheritedFrom}）`
            : `未接入（建议 ${workspace.suggestedBank}）`;
      return `• ${workspace.title} — ${workspace.path} — ${bank}`;
    })
    .join('\n');
}

function formatProjects(data) {
  if (!data.items.length) return 'Bots 里还没有项目。';
  return data.items
    .map((project) => {
      const bank = project.mappingKind === 'none' ? `未接入（建议 ${project.suggestedBank}）` : project.bankId;
      const dir = project.dir ? project.dir : '(没有文件夹，无法接入)';
      return `• ${project.key || project.id} ${project.name} — ${dir} — ${bank}`;
    })
    .join('\n');
}

function formatChats(data) {
  if (!data.items.length) return 'Bots 里还没有群聊记录（还没有群消息，或没有配置聊天通道）。';
  return data.items
    .map((chat) => {
      const bank = chat.bankId ? `${chat.bankId}` : `未接入（建议 ${chat.suggestedBank}）`;
      return `• ${chat.label}（${chat.kind}, chatId ${chat.chatId}）— ${chat.tickets} 个任务 — ${bank}`;
    })
    .join('\n');
}

function formatConnection(data) {
  return [
    `Hindsight 服务：${data.apiUrl}（来源：${data.apiUrlSource}${data.pluginUrlsLocked ? '，插件配置写死' : ''}）`,
    `服务模式：${data.serverMode} · 令牌：${data.tokenSet ? `已设置（来源：${data.apiTokenSource}）` : '未设置'}`,
    `配置文件：${data.path}${data.exists ? '' : '（尚不存在）'}`,
  ].join('\n');
}

function toolResult(text) {
  // The tool's output schema is a plain string: the host validates the value
  // against it, and `render` turns it into the visible text block.
  return String(text ?? '');
}

export function apply(ctx, config = {}) {
  const settings = config && typeof config === 'object' ? config : {};
  const logger = {
    info: (message) => {
      try {
        ctx.logger?.info?.(message);
      } catch {
        /* logging must never break the plugin */
      }
    },
    warn: (message) => {
      try {
        ctx.logger?.warn?.(message);
      } catch {
        /* ignore */
      }
    },
  };
  const api = createApi({ config: settings, logger });

  injectWebApi(ctx, api, { logger });

  ctx.inject(['tools'], (toolCtx) => {
    toolCtx.effect(() => {
      const dispose = toolCtx.tools.register({
        name: 'hindsight_manager',
        description: [
          '管理 Hindsight 记忆 bank（与 DSH 的 Hindsight 记忆插件共用一套配置）。',
          'action 取值：',
          'status（连接与统计）、connection（当前服务地址、来源与令牌状态）、banks（列出全部 bank 及分类）、workspaces（列出 DSH 工作区及接入状态）、projects（Bots 项目）、chats（Bots 群聊）、',
          'set_connection（改 Hindsight 服务地址：url 新地址，mode 为 cloud / self-hosted / daemon；令牌请在插件的设置页填写，不要写进工具参数）、',
          'bind_workspace（把工作区接入 bank；path 省略时为当前工作区）、bind_all_workspaces（全部工作区各接入一个 bank）、',
          'bind_project（Bots 项目文件夹接入 bank；project 传项目 key 或 id）、',
          'bind_chat（群聊接入 bank；chat 传群聊 id，folder 省略时用插件为该群准备的目录；把该群所属机器人的 workdir 指到这个目录，bank 才会收到对话）、',
          'create_bank、set_mission、unbind_workspace、unbind_project、unbind_chat、delete_bank（有数据时必须 force=1）。',
          'bank 省略时按对象生成：工作区 workspace::<名字>，项目 bots::project::<KEY>，群聊 bots::chat::<通道>::<会话>。',
          '写入后：新的工作区立即生效；本次运行中已用过的工作区要重启 DSH 才切换 bank。',
        ].join(''),
        parameters: {
          type: 'object',
          properties: {
            action: { type: 'string', description: `要执行的操作：${ACTIONS.join(' / ')}` },
            path: { type: 'string', description: '工作区绝对路径（bind_workspace / unbind_workspace）' },
            bank: { type: 'string', description: 'bank id；省略时按对象自动命名' },
            project: { type: 'string', description: 'Bots 项目 key（如 OPC）或项目 id' },
            chat: { type: 'string', description: '群聊 id，形如 feishu:<appKey>:<chatId>' },
            folder: { type: 'string', description: '群聊绑定用的工作目录；省略时用插件为该群准备的目录' },
            mission: { type: 'string', description: '新建 bank 时写入的 reflect mission' },
            url: { type: 'string', description: 'set_connection：新的 Hindsight 服务地址（http/https）' },
            mode: { type: 'string', description: 'set_connection：cloud / self-hosted / daemon' },
            force: { type: 'string', description: '删除有数据的 bank 时传 1' },
          },
          required: ['action'],
        },
        output: {
          schema: { type: 'string' },
          render: (_args, value) => [{ type: 'text', text: value }],
        },
        async execute(args = {}, exec) {
          const action = String(args.action || '').trim();
          const params = {
            path: args.path,
            bankId: args.bank,
            projectKey: args.project,
            id: args.chat,
            folder: args.folder,
            mission: args.mission,
            url: args.url,
            mode: args.mode,
            force: args.force === '1' || args.force === 'true',
          };
          switch (action) {
            case 'status':
              return toolResult(formatOverview(await api.overview()));
            case 'connection':
              return toolResult(formatConnection(await api.connection()));
            case 'set_connection': {
              const result = await api.setConnection({ apiUrl: params.url, serverMode: params.mode });
              const probe = result.probe;
              const reach = probe?.reachable ? `可用（${probe.latencyMs}ms）` : `不可用 — ${probe?.error || '未知错误'}`;
              return toolResult(
                [
                  result.saved === false
                    ? `地址没有变化：${result.apiUrl}（来源：${result.apiUrlSource}）· 模式 ${result.serverMode}`
                    : `已保存服务地址：${result.apiUrl}（来源：${result.apiUrlSource}）· 模式 ${result.serverMode}`,
                  `连通性：${reach}`,
                  result.saved === false ? '' : '记忆插件在重启 DSH 后使用新地址；本页面立即生效。',
                  result.saved !== false && probe && !probe.reachable ? '注意：地址已保存，但现在连不上；改回可用地址或先修好服务。' : '',
                  result.warning ? `注意：${result.warning}` : '',
                ]
                  .filter(Boolean)
                  .join('\n'),
              );
            }
            case 'banks':
              return toolResult(formatBanks((await api.banks()).items));
            case 'workspaces':
              return toolResult(formatWorkspaces(await api.workspaces()));
            case 'projects':
              return toolResult(formatProjects(await api.projects()));
            case 'chats':
              return toolResult(formatChats(await api.chats()));
            case 'bind_workspace': {
              const cwd = exec?.agent?.session?.header?.cwd;
              const result = await api.bindWorkspace({ path: params.path || cwd, bankId: params.bankId, mission: params.mission });
              return toolResult(`已接入：${result.path} → ${result.bankId}${result.created ? '（新建 bank）' : ''}。新工作区立即生效；已用过的工作区重启 DSH 后切换。`);
            }
            case 'bind_all_workspaces': {
              const result = await api.bindAllWorkspaces();
              const failed = result.results.filter((item) => !item.ok);
              return toolResult(
                [`已接入 ${result.applied} 个工作区。`, ...result.results.filter((i) => i.ok).map((i) => `• ${i.path} → ${i.bankId}`), ...failed.map((i) => `✗ ${i.path}：${i.error}`)].join('\n'),
              );
            }
            case 'bind_project': {
              const result = await api.bindProject({ projectKey: params.projectKey, bankId: params.bankId, mission: params.mission });
              return toolResult(`项目 ${result.project.key} ${result.project.name}：${result.path} → ${result.bankId}${result.created ? '（新建 bank）' : ''}。`);
            }
            case 'bind_chat': {
              const result = await api.bindChat({ id: params.id, bankId: params.bankId, folder: params.folder, mission: params.mission });
              return toolResult(
                `群聊 ${result.chat} → ${result.bankId}（目录 ${result.folder}）${result.created ? '，已新建 bank' : ''}。${result.warning ? `\n注意：${result.warning}` : ''}`,
              );
            }
            case 'create_bank': {
              const result = await api.createBank({ bankId: params.bankId, mission: params.mission });
              return toolResult(`已创建 bank ${result.bankId}。`);
            }
            case 'set_mission': {
              const result = await api.setBankMission({ bankId: params.bankId, mission: params.mission });
              return toolResult(`已更新 ${result.bankId} 的 mission。`);
            }
            case 'unbind_workspace': {
              const result = await api.unbindWorkspace({ path: params.path });
              return toolResult(`已解除 ${result.path}（原 ${result.bankId}）。`);
            }
            case 'unbind_project': {
              const result = await api.unbindProject({ projectKey: params.projectKey });
              return toolResult(`已解除项目 ${result.project} 的文件夹映射（${result.path}）。`);
            }
            case 'unbind_chat': {
              const result = await api.unbindChat({ id: params.id });
              return toolResult(`已解除群聊 ${result.id}。${result.folderUnmapped ? '目录映射也一并移除。' : ''}`);
            }
            case 'delete_bank': {
              const result = await api.deleteBank({ bankId: params.bankId, force: params.force });
              return toolResult(`已删除 bank ${result.bankId}（${result.facts} 条事实）。`);
            }
            default:
              return toolResult(`未知 action "${action}"。可用：${ACTIONS.join(' / ')}`);
          }
        },
      });
      return dispose;
    });
  });
}
