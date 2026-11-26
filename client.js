window.__ModuleLoader__.load({
  id: 'dsh-hindsight-manager',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const API = '/hindsight-manager/api';
    const PANEL_ID = 'hindsight-manager';

    /* ─────────────────────────── i18n ─────────────────────────── */

    const STRINGS = {
      zh: {
        sidebar: 'Hindsight 记忆',
        title: 'Hindsight 记忆管理',
        subtitle: '把 DSH 工作区、Bots 项目与群聊接到各自的记忆 bank',
        refresh: '刷新',
        refreshing: '刷新中…',
        tabWorkspaces: '工作区',
        tabProjects: '项目',
        tabChats: '群聊',
        tabBanks: '全部 bank',
        tabDiagnostics: '设置',
        connected: '已连接',
        unreachable: '不可用',
        config: '配置文件',
        facts: '事实',
        lastWrite: '最后写入',
        never: '从未写入',
        mission: '使命',
        noMission: '未设置',
        mapped: '已接入',
        notMapped: '未接入',
        inherited: '继承',
        own: '独立',
        bind: '接入',
        rebind: '改绑',
        unbind: '解除',
        bindAll: '全部接入',
        binding: '接入中…',
        chooseBank: '选择 bank',
        newBank: '新建 bank…',
        customBank: 'bank id',
        confirm: '确定',
        cancel: '取消',
        path: '目录',
        sessions: '会话',
        suggestions: '建议',
        emptyWorkspaces: 'DSH 还没有工作区。打开一个新的工作区后回到这里刷新。',
        emptyProjects: 'Bots 还没有项目。在 Bots 看板上建一个项目，它就会出现在这里。',
        emptyChats: 'Bots 还没有群聊记录。给机器人配一个聊天通道并聊上几句后，这里会列出每个群。',
        emptyBanks: '还没有任何 bank。',
        createBank: '新建 bank',
        bankId: 'bank id',
        bankMission: '使命（可选）',
        create: '创建',
        remove: '删除',
        saveMission: '保存使命',
        editMission: '编辑使命',
        category: '分类',
        paths: '绑定目录',
        catWorkspace: '工作区',
        catProject: '项目',
        catChat: '群聊',
        catOther: '其他',
        folder: '工作目录',
        folderHint: 'Bots 的会话按目录运行，所以这里默认给该群一个独立目录。把该群所属机器人的 workdir 指到这个目录（Bots 设置里的 workdirs[handle]），这个 bank 才会收到对话；若该机器人只服务这一个群，也可直接填它的工作目录。',
        botsFolder: 'Bots 默认目录',
        botOwner: '机器人',
        tickets: '任务',
        apply: '保存',
        restartTitle: '需要重启',
        restartBody: '配置已保存。本次运行中已经用过的工作区，要重启 DSH 后才会切换 bank；新工作区立即生效。',
        diagSources: '数据来源',
        diagMappings: '已写入的目录映射',
        diagTemplate: '默认命名模板',
        diagServer: '服务',
        diagToken: '令牌',
        diagTokenNone: '未设置',
        diagModes: '模式',
        diagState: '群聊绑定记录',
        diagNoMappings: '还没有目录映射。',
        diagDeleted: '删除',
        confirmDelete: '删除这个 bank 及其记忆？',
        confirmDeleteFacts: '这个 bank 里有记忆。再次点击以连同记忆一起删除。',
        okBound: '已接入',
        okUnbound: '已解除',
        okCreated: '已创建',
        okDeleted: '已删除',
        okAll: '已接入全部工作区',
        failed: '失败',
        loadFailed: '读取失败',
        serverDown: 'Hindsight 服务不可用；页面仍可编辑映射，但无法列出或新建 bank。',
        restartNeeded: '有改动等待重启',
        emptyChatFolder: '保存时会使用插件为该群准备的目录',
        projectFolderMissing: '文件夹不存在',
        membersUnit: '位成员',
        missionSaved: '使命已保存',
        willBind: '将接入',
        createIfMissing: 'bank 不存在时会自动新建',
        banksFailed: '无法读取 bank 列表',
        retry: '重试',
        loadError: '加载失败',
        confirmDeleteNow: '确认删除',
        customBankHint: '输入新的 bank id（不存在会自动创建）',
        filterWorkspaces: '筛选工作区',
        serverMode: '服务模式',
        memoryDisabled: '记忆插件已停用',
        bindAllNone: '没有可接入的工作区',
        bindAllPartial: '部分失败',
        mapSummary: '把该目录接入这个 bank',
        connTitle: 'Hindsight 连接',
        connUrl: '服务地址',
        connMode: '服务模式',
        connToken: '令牌',
        connTokenHint: '已设置，留空保持不变',
        connClearToken: '清除令牌',
        connTest: '测试连接',
        connTesting: '测试中…',
        connSave: '保存',
        connSaving: '保存中…',
        connSaved: '连接已保存',
        connSavedRestart: '记忆插件会在重启 DSH 后使用新地址；本页立即生效。',
        connReachable: '可用',
        connUnreachable: '不可用',
        connHint: '部署在服务器上时填 http(s)://主机:端口（Hindsight 默认 8888），自签证书请先在系统里信任。',
        connLocked: '插件配置（cordis.patch.yml）里写死了 apiUrl，页面保存的地址不会成为生效地址。',
        connSource: '来源',
        connCloud: 'Hindsight Cloud',
        connSelfHosted: '自建服务器',
        connDaemon: '本机守护进程',
        connModeHint: 'cloud 走官方云；self-hosted 指向自建服务；daemon 用本机 9077 端口起的守护进程。',
        connNoChange: '没有改动',
        connResetUrl: '恢复默认地址',
      },
      en: {
        sidebar: 'Hindsight memory',
        title: 'Hindsight memory manager',
        subtitle: 'Route DSH workspaces, Bots projects and group chats to their own memory banks',
        refresh: 'Refresh',
        refreshing: 'Refreshing…',
        tabWorkspaces: 'Workspaces',
        tabProjects: 'Projects',
        tabChats: 'Group chats',
        tabBanks: 'All banks',
        tabDiagnostics: 'Settings',
        connected: 'Connected',
        unreachable: 'Unreachable',
        config: 'Config file',
        facts: 'facts',
        lastWrite: 'last write',
        never: 'never',
        mission: 'Mission',
        noMission: 'none',
        mapped: 'Mapped',
        notMapped: 'Not mapped',
        inherited: 'inherited',
        own: 'own',
        bind: 'Map',
        rebind: 'Change',
        unbind: 'Unmap',
        bindAll: 'Map all',
        binding: 'Mapping…',
        chooseBank: 'Choose bank',
        newBank: 'New bank…',
        customBank: 'bank id',
        confirm: 'Confirm',
        cancel: 'Cancel',
        path: 'Folder',
        sessions: 'sessions',
        suggestions: 'suggested',
        emptyWorkspaces: 'No DSH workspaces yet. Open one, then refresh.',
        emptyProjects: 'No Bots projects yet. Create one on the Bots board and it appears here.',
        emptyChats: 'No Bots chat threads yet. Connect a chat channel to a bot and talk to it once.',
        emptyBanks: 'No banks yet.',
        createBank: 'New bank',
        bankId: 'bank id',
        bankMission: 'Mission (optional)',
        create: 'Create',
        remove: 'Delete',
        saveMission: 'Save mission',
        editMission: 'Edit mission',
        category: 'Category',
        paths: 'Mapped folders',
        catWorkspace: 'Workspace',
        catProject: 'Project',
        catChat: 'Chat',
        catOther: 'Other',
        folder: 'Work folder',
        folderHint: 'Bots sessions run per folder, so each chat gets its own folder here. Point that chat bot’s workdir at this folder (workdirs[handle] in the Bots settings) so the bank receives the conversation; if the bot serves only this chat, its own work folder works too.',
        botsFolder: 'Bots default folder',
        botOwner: 'Bot',
        tickets: 'tasks',
        apply: 'Save',
        restartTitle: 'Restart needed',
        restartBody: 'Saved. A workspace already used in this run switches bank after DSH restarts; a new workspace applies immediately.',
        diagSources: 'Sources',
        diagMappings: 'Written folder mappings',
        diagTemplate: 'Default name template',
        diagServer: 'Server',
        diagToken: 'Token',
        diagTokenNone: 'none',
        diagModes: 'state',
        diagState: 'Chat bindings',
        diagNoMappings: 'No folder mappings yet.',
        diagDeleted: 'deleted',
        confirmDelete: 'Delete this bank and its memory?',
        confirmDeleteFacts: 'This bank holds memory. Click again to delete it with its facts.',
        okBound: 'Mapped',
        okUnbound: 'Unmapped',
        okCreated: 'Created',
        okDeleted: 'Deleted',
        okAll: 'All workspaces mapped',
        failed: 'Failed',
        loadFailed: 'Could not load',
        serverDown: 'Hindsight is unreachable; the page can still edit mappings, but cannot list or create banks.',
        restartNeeded: 'Changes awaiting restart',
        emptyChatFolder: 'Saves with the folder the plugin keeps for this chat',
        projectFolderMissing: 'folder missing',
        membersUnit: 'members',
        missionSaved: 'Mission saved',
        willBind: 'Map to',
        createIfMissing: 'created when it does not exist',
        banksFailed: 'Could not read the bank list',
        retry: 'Retry',
        loadError: 'Load failed',
        confirmDeleteNow: 'Delete',
        customBankHint: 'Type a new bank id (created automatically when missing)',
        filterWorkspaces: 'Filter workspaces',
        serverMode: 'Server mode',
        memoryDisabled: 'Memory plugin is disabled',
        bindAllNone: 'No workspace to map',
        bindAllPartial: 'partly failed',
        mapSummary: 'Map this folder to the bank',
        connTitle: 'Hindsight connection',
        connUrl: 'Server',
        connMode: 'Mode',
        connToken: 'Token',
        connTokenHint: 'A token is set; leave blank to keep it',
        connClearToken: 'Clear token',
        connTest: 'Test',
        connTesting: 'Testing…',
        connSave: 'Save',
        connSaving: 'Saving…',
        connSaved: 'Connection saved',
        connSavedRestart: 'The memory plugin uses the new address after DSH restarts; this page uses it now.',
        connReachable: 'reachable',
        connUnreachable: 'unreachable',
        connHint: 'For a server deployment use http(s)://host:port (Hindsight listens on 8888 by default); trust a self-signed certificate in the OS first.',
        connLocked: 'The plugin config (cordis.patch.yml) pins apiUrl, so a saved address here will not be the effective one.',
        connSource: 'source',
        connCloud: 'Hindsight Cloud',
        connSelfHosted: 'Self-hosted',
        connDaemon: 'Local daemon',
        connModeHint: 'cloud talks to the hosted service; self-hosted points at your own server; daemon uses the local daemon on port 9077.',
        connNoChange: 'No change',
        connResetUrl: 'Reset to default',
      },
    };

    const language = () => {
      const lang = (document.documentElement?.lang || window.navigator?.language || 'zh').toLowerCase();
      return lang.startsWith('zh') ? 'zh' : 'en';
    };
    const t = (key) => STRINGS[language()][key] ?? STRINGS.zh[key] ?? key;

    /* ─────────────────────────── styles ─────────────────────────── */

    const CSS = `
.hm-page{height:100%;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}
.hm-head{padding:18px 24px 10px;display:flex;flex-direction:column;gap:6px}
.hm-head-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.hm-title{font-size:18px;font-weight:600;letter-spacing:.01em}
.hm-sub{color:var(--dsw-alias-label-tertiary);font-size:12px}
.hm-spacer{flex:1}
.hm-chip{display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font-size:12px;white-space:nowrap}
.hm-chip[data-tone="ok"]{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}
.hm-chip[data-tone="bad"]{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}
.hm-chip[data-tone="warn"]{color:var(--dsw-alias-state-warn-label);border-color:var(--dsw-alias-state-warn-label)}
.hm-dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.hm-btn{appearance:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;transition:background .12s ease,border-color .12s ease}
.hm-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l3)}
.hm-btn:disabled{opacity:.5;cursor:default}
.hm-btn[data-variant="primary"]{background:var(--dsw-alias-button-primary-fill);border-color:transparent;color:var(--dsw-alias-label-on-brand)}
.hm-btn[data-variant="danger"]{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}
.hm-btn[data-variant="ghost"]{border-color:transparent;background:transparent;color:var(--dsw-alias-label-secondary)}
.hm-tabs{display:flex;gap:2px;padding:0 20px;border-bottom:1px solid var(--dsw-alias-border-l2)}
.hm-tab{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-tertiary);font-size:13px;padding:9px 12px;border-bottom:2px solid transparent;cursor:pointer;margin-bottom:-1px}
.hm-tab:hover{color:var(--dsw-alias-label-primary)}
.hm-tab[data-active="true"]{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:600}
.hm-tab-badge{display:inline-block;margin-left:6px;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.hm-body{flex:1;overflow:auto;padding:16px 24px 36px;display:flex;flex-direction:column;gap:14px}
.hm-toast{position:sticky;top:0;z-index:3;border-radius:8px;padding:8px 12px;font-size:12px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);display:flex;align-items:center;gap:8px}
.hm-toast[data-tone="ok"]{border-color:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-state-success-primary)}
.hm-toast[data-tone="bad"]{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.hm-notice{border-radius:8px;padding:10px 12px;border:1px dashed var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-label-secondary);font-size:12px;background:var(--dsw-alias-bg-layer-1)}
.hm-notice b{color:var(--dsw-alias-state-warn-label)}
.hm-card{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.hm-card-scroll{overflow-x:auto}
.hm-card-scroll .hm-table{min-width:640px}
.hm-card-head{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}
.hm-card-title{font-weight:600;font-size:13px}
.hm-card-body{padding:4px 0}
.hm-row{display:grid;grid-template-columns:minmax(220px,1.45fr) minmax(140px,1fr) auto;gap:12px;align-items:center;padding:10px 14px;border-top:1px solid var(--dsw-alias-border-l2)}
.hm-row:first-child{border-top:0}
.hm-row-main{min-width:0}
.hm-name{font-weight:600;font-size:13px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.hm-meta{color:var(--dsw-alias-label-tertiary);font-size:12px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--dsw-alias-font-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.hm-bank{display:flex;flex-direction:column;gap:2px;min-width:0}
.hm-bank-id{font-size:12px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--dsw-alias-font-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.hm-bank-meta{font-size:11px;color:var(--dsw-alias-label-tertiary)}
.hm-actions{display:flex;gap:6px;justify-content:flex-end}
.hm-editor{grid-column:1 / -1;display:flex;flex-direction:column;gap:8px;padding:10px 12px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2)}
.hm-editor-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.hm-input,.hm-select{min-width:160px;flex:1;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;color:var(--dsw-alias-label-primary);padding:5px 8px;font-size:12px;outline:none}
.hm-input:focus,.hm-select:focus{border-color:var(--dsw-alias-brand-primary)}
.hm-input[data-mono="true"]{font-family:var(--dsw-alias-font-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.hm-btn:focus-visible,.hm-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.hm-hint{font-size:11px;color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere}
.hm-empty{padding:22px 14px;color:var(--dsw-alias-label-tertiary);font-size:12px;text-align:center}
.hm-table{width:100%;border-collapse:collapse;font-size:12px}
.hm-table th{text-align:left;font-weight:600;color:var(--dsw-alias-label-tertiary);padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l2);white-space:nowrap}
.hm-table td{padding:8px 12px;border-top:1px solid var(--dsw-alias-border-l2);vertical-align:top}
.hm-mono{font-family:var(--dsw-alias-font-mono,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px}
.hm-kv dd .hm-mono,.hm-hint .hm-mono{white-space:normal;word-break:break-all;max-width:none}
.hm-kv{display:grid;grid-template-columns:150px 1fr;gap:6px 12px;padding:12px 14px;font-size:12px}
.hm-kv dt{color:var(--dsw-alias-label-tertiary)}
.hm-kv dd{margin:0;color:var(--dsw-alias-label-secondary);word-break:break-all}
.hm-form{display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;padding:12px 14px}
.hm-field{display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.hm-field-wide{flex:1 1 320px;min-width:0}
.hm-field-narrow{flex:0 0 220px}
.hm-cat[data-cat="workspace"]{color:var(--dsw-alias-state-business-primary)}
.hm-cat[data-cat="project"]{color:var(--dsw-alias-state-success-primary)}
.hm-cat[data-cat="chat"]{color:var(--dsw-alias-state-warn-label)}
.hm-cat[data-cat="other"]{color:var(--dsw-alias-label-tertiary)}
.hm-mission{max-width:520px;color:var(--dsw-alias-label-tertiary);font-size:11px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.hm-loading{padding:40px;text-align:center;color:var(--dsw-alias-label-tertiary)}
@media (max-width:720px){.hm-row{grid-template-columns:1fr}.hm-actions{justify-content:flex-start}.hm-head{padding:14px 16px 8px}.hm-body{padding:12px 16px 28px}.hm-kv{grid-template-columns:1fr}}
`;

    const STYLE_ID = 'dsh-hindsight-manager-styles';
    function installStyles() {
      if (typeof document === 'undefined') return () => {};
      let element = document.getElementById(STYLE_ID);
      if (!element) {
        element = document.createElement('style');
        element.id = STYLE_ID;
        element.textContent = CSS;
        document.head.appendChild(element);
      }
      return () => {
        const current = document.getElementById(STYLE_ID);
        if (current) current.remove();
      };
    }

    /* ─────────────────────────── api ─────────────────────────── */

    async function call(method, params) {
      let response;
      try {
        response = await window.fetch(API, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ method, params: params ?? {} }),
        });
      } catch (error) {
        throw new Error(`${t('loadFailed')}: ${error?.message || error}`);
      }
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      if (!response.ok || !data || data.ok === false) {
        throw new Error(data?.message || `HTTP ${response.status}`);
      }
      return data;
    }

    /* ─────────────────────────── controls ─────────────────────────── */

    function Chip(props) {
      return h('span', { className: 'hm-chip', 'data-tone': props.tone || 'default' }, props.dot ? h('span', { className: 'hm-dot' }) : null, props.children);
    }

    function Button(props) {
      return h(
        'button',
        {
          type: 'button',
          className: 'hm-btn',
          'data-variant': props.variant || 'default',
          disabled: Boolean(props.disabled),
          onClick: props.onClick,
        },
        props.children,
      );
    }

    function categoryLabel(category) {
      return (
        { workspace: t('catWorkspace'), project: t('catProject'), chat: t('catChat'), other: t('catOther') }[category] || category
      );
    }

    function BankPicker(props) {

      const banks = props.banks || [];
      const suggested = props.suggested || '';
      const [mode, setMode] = React.useState(props.current || '');
      const [custom, setCustom] = React.useState('');
      const pending = custom.trim() || mode;
      return h(
        'div',
        { className: 'hm-editor' },
        h(
          'div',
          { className: 'hm-editor-row' },
          h(
            'select',
            {
              className: 'hm-select',
              value: banks.some((bank) => bank.bankId === pending) ? pending : '',
              onChange: (event) => {
                setCustom('');
                setMode(event.target.value);
              },
            },
            h('option', { value: '' }, t('chooseBank')),
            suggested
              ? h('option', { value: suggested }, `${suggested} · ${t('createIfMissing')}`)
              : null,
            banks
              .filter((bank) => bank.bankId !== suggested)
              .map((bank) => h('option', { key: bank.bankId, value: bank.bankId }, `${bank.bankId} · ${bank.factCount}`)),
          ),
          h('input', {
            className: 'hm-input',
            'data-mono': 'true',
            placeholder: t('customBank'),
            value: custom,
            onChange: (event) => setCustom(event.target.value),
          }),
        ),
        h('div', { className: 'hm-hint' }, t('customBankHint')),
        props.children ? h('div', { className: 'hm-hint' }, props.children) : null,
        h(
          'div',
          { className: 'hm-editor-row' },
          h('span', { className: 'hm-hint' }, pending ? `${t('willBind')}: ${pending}` : `${t('suggestions')}: ${suggested}`),
          h('span', { className: 'hm-spacer' }),
          h(
            'button',
            {
              type: 'button',
              className: 'hm-btn',
              'data-variant': 'primary',
              disabled: props.busy || !pending,
              onClick: () => props.onConfirm(pending),
            },
            props.busy ? t('binding') : t('confirm'),
          ),
          h('button', { type: 'button', className: 'hm-btn', onClick: props.onCancel }, t('cancel')),
        ),
      );
    }
    /* ─────────────────────────── connection ─────────────────────────── */

    function serverLabel(url) {
      const text = String(url || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
      return text.length > 30 ? `${text.slice(0, 29)}…` : text;
    }

    /**
     * The Hindsight endpoint editor. It writes the same fields the memory
     * plugin reads (`apiUrl`, `serverMode`, `apiToken` in coding-agent.json),
     * so one edit moves both this page and DSH's own memory there.
     */
    function ConnectionCard(props) {
      const { conn, t: tr, onSaved } = props;
      const [url, setUrl] = React.useState(conn?.apiUrl || '');
      const [mode, setMode] = React.useState(conn?.serverMode || 'cloud');
      const [token, setToken] = React.useState('');
      const [probe, setProbe] = React.useState(null);
      const [working, setWorking] = React.useState('');
      const [error, setError] = React.useState('');

      React.useEffect(() => {
        setUrl(conn?.apiUrl || '');
        setMode(conn?.serverMode || 'cloud');
      }, [conn?.apiUrl, conn?.serverMode]);

      const run = async (kind, fn) => {
        setWorking(kind);
        setError('');
        try {
          return await fn();
        } catch (caught) {
          setError(caught.message || String(caught));
          return null;
        } finally {
          setWorking('');
        }
      };

      const test = () =>
        run('test', async () => {
          const result = await call('testConnection', { apiUrl: url, apiToken: token || undefined });
          setProbe(result);
        });

      const save = () =>
        run('save', async () => {
          const result = await call('setConnection', { apiUrl: url, serverMode: mode, apiToken: token || undefined });
          setProbe(result.probe);
          setToken('');
          onSaved?.(result);
        });

      const clear = () =>
        run('clear', async () => {
          const result = await call('setConnection', { clearToken: true });
          setProbe(result.probe);
          setToken('');
          onSaved?.(result);
        });

      const resetUrl = () => setUrl('');

      const modes = [
        ['cloud', tr('connCloud')],
        ['self-hosted', tr('connSelfHosted')],
        ['daemon', tr('connDaemon')],
      ];

      return h(
        'div',
        { className: 'hm-card' },
        h(
          'div',
          { className: 'hm-card-head' },
          h('span', { className: 'hm-card-title' }, tr('connTitle')),
          h('span', { className: 'hm-spacer' }),
          conn ? h(Chip, null, `${tr('connSource')}: ${conn.apiUrlSource}`) : null,
          conn ? h(Chip, { tone: conn.tokenSet ? 'ok' : 'default' }, conn.tokenSet ? `${tr('connToken')} ✓` : `${tr('connToken')} —`) : null,
        ),
        h(
          'div',
          { className: 'hm-form' },
          h(
            'label',
            { className: 'hm-field hm-field-wide' },
            tr('connUrl'),
            h('input', {
              className: 'hm-input',
              'data-mono': 'true',
              value: url,
              placeholder: conn?.defaultApiUrl || '',
              onChange: (event) => setUrl(event.target.value),
            }),
          ),
          h(
            'label',
            { className: 'hm-field hm-field-narrow' },
            tr('connMode'),
            h(
              'select',
              { className: 'hm-select', value: mode, onChange: (event) => setMode(event.target.value) },
              modes.map(([value, label]) => h('option', { key: value, value }, `${value} · ${label}`)),
            ),
          ),
          h(
            'label',
            { className: 'hm-field hm-field-wide' },
            tr('connToken'),
            h('input', {
              className: 'hm-input',
              'data-mono': 'true',
              type: 'password',
              autoComplete: 'off',
              value: token,
              placeholder: conn?.tokenSet ? tr('connTokenHint') : '',
              onChange: (event) => setToken(event.target.value),
            }),
          ),
        ),
        h(
          'div',
          { className: 'hm-hint', style: { padding: '0 14px 8px', display: 'flex', flexDirection: 'column', gap: '3px' } },
          h('div', null, tr('connHint')),
          h('div', null, tr('connModeHint')),
          conn?.tokenSet ? h('div', null, `${tr('connToken')}: ${tr('connTokenHint')} · ${conn.apiTokenSource}`) : null,
        ),
        conn?.pluginUrlsLocked ? h('div', { className: 'hm-notice', style: { margin: '0 14px 10px' } }, tr('connLocked')) : null,
        h(
          'div',
          { className: 'hm-editor-row', style: { padding: '0 14px 14px' } },
          h(Button, { variant: 'primary', disabled: Boolean(working), onClick: save }, working === 'save' ? tr('connSaving') : tr('connSave')),
          h(Button, { disabled: Boolean(working), onClick: test }, working === 'test' ? tr('connTesting') : tr('connTest')),
          h(Button, { disabled: Boolean(working), onClick: resetUrl }, tr('connResetUrl')),
          conn?.tokenSet ? h(Button, { variant: 'ghost', disabled: Boolean(working), onClick: clear }, tr('connClearToken')) : null,
          h('span', { className: 'hm-spacer' }),
          probe
            ? h(
                Chip,
                { tone: probe.reachable ? 'ok' : 'bad', dot: true },
                probe.reachable ? `${tr('connReachable')} · ${probe.latencyMs}ms · ${probe.status}` : `${tr('connUnreachable')} · ${probe.error || ''}`,
              )
            : null,
        ),
        error ? h('div', { className: 'hm-notice', style: { margin: '0 14px 12px' } }, error) : null,
      );
    }

    /* ─────────────────────────── page ─────────────────────────── */

    function HindsightPanel(props) {
      const [tab, setTab] = React.useState('workspaces');
      const [data, setData] = React.useState(null);
      const [banks, setBanks] = React.useState([]);
      const [loading, setLoading] = React.useState(true);
      const [busy, setBusy] = React.useState(false);
      const [toast, setToast] = React.useState(null);
      const [loadError, setLoadError] = React.useState('');
      const [banksError, setBanksError] = React.useState('');
      const [workspaceFilter, setWorkspaceFilter] = React.useState('');
      const [editing, setEditing] = React.useState('');
      const [confirming, setConfirming] = React.useState('');
      const [newBank, setNewBank] = React.useState({ id: '', mission: '' });
      const [bankFilter, setBankFilter] = React.useState('');
      const [mission, setMission] = React.useState({ id: '', text: '' });

      const note = (tone, text) => setToast({ tone, text, at: Date.now() });

      const load = React.useCallback(async () => {
        setLoading(true);
        setEditing('');
        setConfirming('');
        try {
          const [overview, workspaceData, projectData, chatData, connection] = await Promise.all([
            call('overview'),
            call('workspaces'),
            call('projects'),
            call('chats'),
            call('connection'),
          ]);
          setData({ overview, workspaces: workspaceData, projects: projectData, chats: chatData, connection });
          setLoadError('');
          try {
            const bankData = await call('banks');
            setBanks(bankData.items || []);
            setBanksError('');
          } catch (error) {
            setBanks([]);
            setBanksError(error.message || String(error));
          }
        } catch (error) {
          setLoadError(error.message || String(error));
          note('bad', error.message || String(error));
        } finally {
          setLoading(false);
        }
      }, []);

      React.useEffect(() => {
        load();
      }, [load]);

      React.useEffect(() => {
        if (!toast) return undefined;
        const timer = window.setTimeout(() => setToast(null), 6000);
        return () => window.clearTimeout(timer);
      }, [toast]);

      React.useEffect(() => {
        setEditing('');
        setConfirming('');
      }, [tab]);

      const run = async (method, params, successText) => {
        setBusy(true);
        try {
          const result = await call(method, params);
          setEditing('');
          await load();
          note('ok', result.warning ? `${successText} — ${result.warning}` : successText);
          return result;
        } catch (error) {
          note('bad', error.message || String(error));
          return null;
        } finally {
          setBusy(false);
        }
      };

      if (!data && loading) return h('div', { className: 'hm-page' }, h('div', { className: 'hm-loading' }, t('refreshing')));

      if (!data && loadError) {
        return h(
          'div',
          { className: 'hm-page' },
          h('div', { className: 'hm-head' }, h('div', { className: 'hm-head-row' }, h('div', { className: 'hm-title' }, t('title')))),
          h(
            'div',
            { className: 'hm-body' },
            h('div', { className: 'hm-notice' }, h('b', null, `${t('loadError')}：`), loadError),
            h('div', { className: 'hm-editor-row' }, h(Button, { variant: 'primary', onClick: load, disabled: loading }, loading ? t('refreshing') : t('retry'))),
          ),
        );
      }

      const overview = data?.overview;
      const workspaces = data?.workspaces?.items || [];
      const projects = data?.projects?.items || [];
      const chats = data?.chats?.items || [];
      const mappings = overview?.config?.mappings || [];
      const needle = bankFilter.trim().toLowerCase();
      const filteredBanks = needle
        ? banks.filter((bank) => `${bank.bankId} ${bank.mission || ''} ${(bank.paths || []).join(' ')}`.toLowerCase().includes(needle))
        : banks;

      const tabs = [
        ['workspaces', `${t('tabWorkspaces')}`, workspaces.length],
        ['projects', `${t('tabProjects')}`, projects.length],
        ['chats', `${t('tabChats')}`, chats.length],
        ['banks', `${t('tabBanks')}`, banks.length],
        ['diagnostics', `${t('tabDiagnostics')}`, null],
      ];

      return h(
        'div',
        { className: 'hm-page' },
        h(
          'div',
          { className: 'hm-head' },
          h(
            'div',
            { className: 'hm-head-row' },
            h('div', { className: 'hm-title' }, t('title')),
            h('span', { className: 'hm-spacer' }),
            overview
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'hm-chip',
                    style: { cursor: 'pointer' },
                    title: `${overview.config.apiUrl} — ${t('tabDiagnostics')}`,
                    onClick: () => setTab('diagnostics'),
                  },
                  `${t('connUrl')}: ${serverLabel(overview.config.apiUrl)}`,
                )
              : null,
            h(
              Chip,
              { tone: overview?.health?.ok ? 'ok' : 'bad', dot: true },
              overview?.health?.ok ? t('connected') : t('unreachable'),
            ),
            h(Button, { onClick: load, disabled: loading || busy }, loading ? t('refreshing') : t('refresh')),
            props?.closePanel
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'hm-btn',
                    'data-variant': 'ghost',
                    'aria-label': language() === 'zh' ? '关闭' : 'Close',
                    title: language() === 'zh' ? '关闭' : 'Close',
                    onClick: props.closePanel,
                  },
                  '✕',
                )
              : null,
          ),
          h('div', { className: 'hm-sub' }, t('subtitle')),
          overview
            ? h(
                'div',
                { className: 'hm-head-row' },
                h('span', { className: 'hm-hint' }, `${t('config')}: ${overview.config.path}`),
                h('span', { className: 'hm-spacer' }),
                h(Chip, null, `${t('catWorkspace')} ${overview.counts.mappedWorkspaces}/${overview.counts.workspaces}`),
                h(Chip, null, `${t('catProject')} ${overview.counts.mappedProjects}/${overview.counts.projects}`),
                h(Chip, null, `${t('catChat')} ${overview.counts.boundChats}/${overview.counts.chats}`),
              )
            : null,
        ),
        h(
          'div',
          { className: 'hm-tabs' },
          tabs.map(([id, label, count]) =>
            h(
              'button',
              { key: id, type: 'button', className: 'hm-tab', 'data-active': tab === id ? 'true' : 'false', onClick: () => setTab(id) },
              label,
              count !== null && count !== undefined ? h('span', { className: 'hm-tab-badge' }, String(count)) : null,
            ),
          ),
        ),
        h(
          'div',
          { className: 'hm-body' },
          toast
            ? h('div', { className: 'hm-toast', 'data-tone': toast.tone, role: 'status' }, toast.text)
            : null,
          overview && !overview.health.ok ? h('div', { className: 'hm-notice' }, t('serverDown')) : null,
          banksError || overview?.banks?.error
            ? h('div', { className: 'hm-notice' }, h('b', null, `${t('banksFailed')}：`), banksError || overview?.banks?.error)
            : null,
          overview && overview.restart.savedAfterStart
            ? h('div', { className: 'hm-notice' }, h('b', null, `${t('restartTitle')}：`), t('restartBody'))
            : null,

          tab === 'workspaces'
            ? h(
                'div',
                { className: 'hm-card' },
                h(
                  'div',
                  { className: 'hm-card-head' },
                  h('span', { className: 'hm-card-title' }, t('tabWorkspaces')),
                  h('span', { className: 'hm-spacer' }),
                  h('input', {
                    className: 'hm-input',
                    style: { maxWidth: '180px', flex: '0 1 180px' },
                    placeholder: t('filterWorkspaces'),
                    value: workspaceFilter,
                    onChange: (event) => setWorkspaceFilter(event.target.value),
                  }),
                  h(
                    Button,
                    {
                      variant: 'primary',
                      disabled: busy || workspaces.every((workspace) => workspace.mappingKind !== 'none'),
                      onClick: async () => {
                        const pending = workspaces.filter((workspace) => workspace.mappingKind === 'none').length;
                        const result = await run('bindAllWorkspaces', {}, t('okAll'));
                        if (!result) return;
                        const failed = (result.results || []).filter((item) => !item.ok);
                        if (!result.applied) {
                          note('bad', `${t('bindAllNone')}${failed[0] ? `：${failed[0].error}` : ''}`);
                          return;
                        }
                        note(
                          failed.length ? 'bad' : 'ok',
                          `${t('okAll')}：${result.applied}/${pending}${failed.length ? ` · ${t('bindAllPartial')} ${failed.length}（${failed[0].error}）` : ''}`,
                        );
                      },
                    },
                    busy ? t('binding') : `${t('bindAll')} (${workspaces.filter((workspace) => workspace.mappingKind === 'none').length})`,
                  ),
                ),
                workspaces.length === 0
                  ? h('div', { className: 'hm-empty' }, t('emptyWorkspaces'))
                  : h(
                      'div',
                      { className: 'hm-card-body' },
                      workspaces
                        .filter((workspace) => {
                          const query = workspaceFilter.trim().toLowerCase();
                          return !query || `${workspace.title} ${workspace.path} ${workspace.bankId}`.toLowerCase().includes(query);
                        })
                        .map((workspace) =>
                        h(
                          'div',
                          { className: 'hm-row', key: workspace.id },
                          h(
                            'div',
                            { className: 'hm-row-main' },
                            h('div', { className: 'hm-name' }, workspace.title, h('span', { className: 'hm-hint' }, `${workspace.sessions} ${t('sessions')}`)),
                            h('div', { className: 'hm-meta', title: workspace.path }, workspace.path),
                          ),
                          h(
                            'div',
                            { className: 'hm-bank' },
                            workspace.bankId
                              ? [
                                  h('div', { key: 'id', className: 'hm-bank-id' }, workspace.bankId),
                                  h(
                                    'div',
                                    { key: 'kind', className: 'hm-bank-meta' },
                                    workspace.mappingKind === 'inherited' ? `${t('inherited')} · ${workspace.inheritedFrom}` : t('own'),
                                  ),
                                ]
                              : h('div', { className: 'hm-bank-id' }, t('notMapped')),
                          ),
                          h(
                            'div',
                            { className: 'hm-actions' },
                            h(
                              Button,
                              {
                                variant: workspace.bankId ? 'default' : 'primary',
                                disabled: busy,
                                onClick: () => setEditing(editing === workspace.path ? '' : workspace.path),
                              },
                              workspace.bankId ? t('rebind') : t('bind'),
                            ),
                            workspace.mappingKind === 'own'
                              ? h(
                                  Button,
                                  { variant: 'ghost', disabled: busy, onClick: () => run('unbindWorkspace', { path: workspace.path }, `${t('okUnbound')} ${workspace.path}`) },
                                  t('unbind'),
                                )
                              : null,
                          ),
                          editing === workspace.path
                            ? h(
                                BankPicker,
                                {
                                  key: 'editor',
                                  banks,
                                  current: workspace.bankId,
                                  suggested: workspace.suggestedBank,
                                  busy,
                                  onCancel: () => setEditing(''),
                                  onConfirm: (bankId) =>
                                    run('bindWorkspace', { path: workspace.path, bankId }, `${t('okBound')} ${workspace.title} → ${bankId}`),
                                },
                              )
                            : null,
                        ),
                      ),
                    ),
              )
            : null,

          tab === 'projects'
            ? h(
                'div',
                { className: 'hm-card' },
                h('div', { className: 'hm-card-head' }, h('span', { className: 'hm-card-title' }, t('tabProjects'))),
                projects.length === 0
                  ? h('div', { className: 'hm-empty' }, t('emptyProjects'))
                  : h(
                      'div',
                      { className: 'hm-card-body' },
                      projects.map((project) => {
                        const pid = project.id || project.key;
                        return h(
                          'div',
                          { className: 'hm-row', key: pid },
                          h(
                            'div',
                            { className: 'hm-row-main' },
                            h(
                              'div',
                              { className: 'hm-name' },
                              project.key ? h(Chip, { tone: 'default' }, project.key) : null,
                              project.name || project.id,
                              project.folderExists
                                ? null
                                : h('span', { className: 'hm-hint' }, `⚠ ${t('projectFolderMissing')}`),
                            ),
                            h('div', { className: 'hm-meta', title: project.dir }, project.dir || '—'),
                            (project.members || []).length
                              ? h('div', { className: 'hm-hint' }, `${project.members.length} ${t('membersUnit')}`)
                              : null,
                          ),
                          h(
                            'div',
                            { className: 'hm-bank' },
                            project.bankId ? h('div', { className: 'hm-bank-id' }, project.bankId) : h('div', { className: 'hm-bank-id' }, t('notMapped')),
                            h('div', { className: 'hm-bank-meta' }, project.mappingKind === 'inherited' ? t('inherited') : project.mappingKind === 'own' ? t('own') : ''),
                          ),
                          h(
                            'div',
                            { className: 'hm-actions' },
                            h(
                              Button,
                              {
                                variant: project.bankId ? 'default' : 'primary',
                                disabled: busy || !project.dir,
                                onClick: () => setEditing(editing === pid ? '' : pid),
                              },
                              project.bankId ? t('rebind') : t('bind'),
                            ),
                            project.mappingKind === 'own'
                              ? h(
                                  Button,
                                  {
                                    variant: 'ghost',
                                    disabled: busy,
                                    onClick: () => run('unbindProject', { projectId: project.id, projectKey: project.key }, t('okUnbound')),
                                  },
                                  t('unbind'),
                                )
                              : null,
                          ),
                          editing === pid
                            ? h(BankPicker, {
                                key: 'editor',
                                banks,
                                current: project.bankId,
                                suggested: project.suggestedBank,
                                busy,
                                onCancel: () => setEditing(''),
                                onConfirm: (bankId) =>
                                  run('bindProject', { projectId: project.id, projectKey: project.key, bankId }, `${t('okBound')} ${project.key || project.id} → ${bankId}`),
                              })
                            : null,
                        );
                      }),
                    ),
              )
            : null,

          tab === 'chats'
            ? h(
                'div',
                { className: 'hm-card' },
                h(
                  'div',
                  { className: 'hm-card-head' },
                  h('span', { className: 'hm-card-title' }, t('tabChats')),
                  h('span', { className: 'hm-spacer' }),
                  h('span', { className: 'hm-hint' }, `${t('botsFolder')}: ${data?.chats?.botsFolder || ''}`),
                ),
                chats.length === 0
                  ? h('div', { className: 'hm-empty' }, t('emptyChats'))
                  : h(
                      'div',
                      { className: 'hm-card-body' },
                      chats.map((chat) =>
                        h(
                          'div',
                          { className: 'hm-row', key: chat.id },
                          h(
                            'div',
                            { className: 'hm-row-main' },
                            h(
                              'div',
                              { className: 'hm-name' },
                              chat.label,
                              h('span', { className: 'hm-hint' }, `${chat.kind}`),
                              chat.bot ? h(Chip, null, `@${chat.bot.handle}`) : null,
                            ),
                            h('div', { className: 'hm-meta' }, chat.folder || chat.defaultFolder),
                            h('div', { className: 'hm-hint' }, `${chat.tickets} ${t('tickets')}`),
                          ),
                          h(
                            'div',
                            { className: 'hm-bank' },
                            chat.bankId ? h('div', { className: 'hm-bank-id' }, chat.bankId) : h('div', { className: 'hm-bank-id' }, t('notMapped')),
                            chat.folderMappedTo && chat.folderMappedTo !== chat.bankId
                              ? h('div', { className: 'hm-bank-meta' }, chat.folderMappedTo)
                              : null,
                          ),
                          h(
                            'div',
                            { className: 'hm-actions' },
                            h(
                              Button,
                              {
                                variant: chat.bankId ? 'default' : 'primary',
                                disabled: busy,
                                onClick: () => setEditing(editing === chat.id ? '' : chat.id),
                              },
                              chat.bankId ? t('rebind') : t('bind'),
                            ),
                            chat.boundBankId || chat.bankId
                              ? h(Button, { variant: 'ghost', disabled: busy, onClick: () => run('unbindChat', { id: chat.id }, t('okUnbound')) }, t('unbind'))
                              : null,
                          ),
                          editing === chat.id
                            ? h(ChatEditor, {
                                key: 'editor',
                                chat,
                                banks,
                                busy,
                                t,
                                onCancel: () => setEditing(''),
                                onConfirm: (bankId, folder) => run('bindChat', { id: chat.id, bankId, folder }, `${t('okBound')} ${chat.label} → ${bankId}`),
                              })
                            : null,
                        ),
                      ),
                    ),
              )
            : null,

          tab === 'banks'
            ? h(
                'div',
                { className: 'hm-card hm-card-scroll' },
                h(
                  'div',
                  { className: 'hm-card-head' },
                  h('span', { className: 'hm-card-title' }, t('tabBanks')),
                  h('span', { className: 'hm-spacer' }),
                  h('input', {
                    className: 'hm-input',
                    style: { maxWidth: '220px', flex: '0 1 220px' },
                    placeholder: language() === 'zh' ? '筛选 bank' : 'Filter banks',
                    value: bankFilter,
                    onChange: (event) => setBankFilter(event.target.value),
                  }),
                  h('span', { className: 'hm-hint' }, `${overview?.banks?.total ?? banks.length}`),
                ),
                h(
                  'div',
                  { className: 'hm-form' },
                  h(
                    'label',
                    { className: 'hm-field' },
                    t('bankId'),
                    h('input', {
                      className: 'hm-input',
                      'data-mono': 'true',
                      value: newBank.id,
                      placeholder: 'workspace::my-project',
                      onChange: (event) => setNewBank({ ...newBank, id: event.target.value }),
                    }),
                  ),
                  h(
                    'label',
                    { className: 'hm-field' },
                    t('bankMission'),
                    h('input', {
                      className: 'hm-input',
                      value: newBank.mission,
                      onChange: (event) => setNewBank({ ...newBank, mission: event.target.value }),
                    }),
                  ),
                  h(
                    Button,
                    {
                      variant: 'primary',
                      disabled: busy || !newBank.id.trim(),
                      onClick: async () => {
                        const created = await run('createBank', { bankId: newBank.id.trim(), mission: newBank.mission }, `${t('okCreated')} ${newBank.id.trim()}`);
                        if (created) {
                          setBankFilter(newBank.id.trim());
                          setNewBank({ id: '', mission: '' });
                        }
                      },
                    },
                    t('create'),
                  ),
                ),
                filteredBanks.length === 0
                  ? h('div', { className: 'hm-empty' }, banks.length === 0 ? t('emptyBanks') : '—')
                  : h(
                      'table',
                      { className: 'hm-table' },
                      h(
                        'thead',
                        null,
                        h(
                          'tr',
                          null,
                          h('th', null, t('bankId')),
                          h('th', null, t('category')),
                          h('th', null, t('facts')),
                          h('th', null, t('paths')),
                          h('th', null, t('mission')),
                          h('th', null, ''),
                        ),
                      ),
                      h(
                        'tbody',
                        null,
                        filteredBanks.map((bank) =>
                          h(
                            'tr',
                            { key: bank.bankId },
                            h('td', null, h('div', { className: 'hm-mono' }, bank.bankId)),
                            h('td', null, h('span', { className: 'hm-cat', 'data-cat': bank.category }, categoryLabel(bank.category))),
                            h('td', null, String(bank.factCount)),
                            h(
                              'td',
                              null,
                              (bank.paths || []).length
                                ? (bank.paths || []).map((path) => h('div', { key: path, className: 'hm-mono', title: path }, path))
                                : h('span', { className: 'hm-hint' }, '—'),
                            ),
                            h(
                              'td',
                              null,
                              mission.id === bank.bankId
                                ? h(
                                    'div',
                                    { className: 'hm-editor' },
                                    h('textarea', {
                                      className: 'hm-input',
                                      rows: 3,
                                      value: mission.text,
                                      onChange: (event) => setMission({ id: bank.bankId, text: event.target.value }),
                                    }),
                                    h(
                                      'div',
                                      { className: 'hm-editor-row' },
                                      h(
                                        Button,
                                        {
                                          variant: 'primary',
                                          disabled: busy,
                                          onClick: async () => {
                                            const saved = await run('setBankMission', { bankId: bank.bankId, mission: mission.text }, `${bank.bankId} ${t('missionSaved')}`);
                                            if (saved) setMission({ id: '', text: '' });
                                          },
                                        },
                                        t('saveMission'),
                                      ),
                                      h(Button, { onClick: () => setMission({ id: '', text: '' }) }, t('cancel')),
                                    ),
                                  )
                                : h(
                                    'div',
                                    null,
                                    h('div', { className: 'hm-mission', title: bank.mission }, bank.mission || t('noMission')),
                                    h(
                                      Button,
                                      { variant: 'ghost', onClick: () => setMission({ id: bank.bankId, text: bank.mission || '' }) },
                                      t('editMission'),
                                    ),
                                  ),
                            ),
                            h(
                              'td',
                              null,
                              confirming === `bank:${bank.bankId}`
                                ? h(
                                    'div',
                                    { className: 'hm-editor-row', style: { justifyContent: 'flex-start' } },
                                    h(
                                      Button,
                                      {
                                        variant: 'danger',
                                        disabled: busy,
                                        onClick: async () => {
                                          await run('deleteBank', { bankId: bank.bankId, force: bank.factCount > 0 }, `${t('okDeleted')} ${bank.bankId}`);
                                          setConfirming('');
                                        },
                                      },
                                      t('confirmDeleteNow'),
                                    ),
                                    h(Button, { onClick: () => setConfirming('') }, t('cancel')),
                                  )
                                : h(
                                    Button,
                                    {
                                      variant: 'danger',
                                      disabled: busy,
                                      onClick: () => {
                                        setConfirming(`bank:${bank.bankId}`);
                                        note('bad', `${t('confirmDelete')}${bank.factCount > 0 ? ` ${t('confirmDeleteFacts')}` : ''}`);
                                      },
                                    },
                                    t('remove'),
                                  ),
                            ),
                          ),
                        ),
                      ),
                    ),
              )
            : null,

          tab === 'diagnostics'
            ? h(
                'div',
                { style: { display: 'flex', flexDirection: 'column', gap: '14px' } },
                h(ConnectionCard, {
                  conn: data?.connection,
                  t,
                  onSaved: (result) => {
                    note(
                      'ok',
                      result.saved === false
                        ? t('connNoChange')
                        : `${t('connSaved')} · ${t('connSavedRestart')}${result.warning ? ` — ${result.warning}` : ''}`,
                    );
                    load();
                  },
                }),
                h(
                  'div',
                  { className: 'hm-card' },
                  h('div', { className: 'hm-card-head' }, h('span', { className: 'hm-card-title' }, t('tabDiagnostics'))),
                overview
                  ? h(
                      'dl',
                      { className: 'hm-kv' },
                      h('dt', null, t('diagServer')),
                      h('dd', null, `${overview.config.apiUrl} · ${overview.health.ok ? t('connected') : t('unreachable')}${overview.version ? ` · v${overview.version}` : ''}`),
                      h('dt', null, t('serverMode')),
                      h('dd', null, `${overview.config.serverMode}${overview.config.disabled ? ` · ${t('memoryDisabled')}` : ''}`),
                      h('dt', null, t('config')),
                      h('dd', null, overview.config.path),
                      h('dt', null, t('diagToken')),
                      h('dd', null, overview.config.tokenSet ? overview.config.apiTokenSource : t('diagTokenNone')),
                      h('dt', null, t('diagTemplate')),
                      h('dd', null, h('span', { className: 'hm-mono' }, overview.config.template)),
                      h('dt', null, t('diagSources')),
                      h(
                        'dd',
                        null,
                        ['workspaces', 'bots', 'state'].map((key) =>
                          h('div', { key, className: 'hm-mono' }, `${key}: ${overview.sources[key]}`),
                        ),
                      ),
                      h('dt', null, t('diagMappings')),
                      h(
                        'dd',
                        null,
                        mappings.length
                          ? mappings.map((entry) => h('div', { key: entry.path, className: 'hm-mono' }, `${entry.path} → ${entry.bankId}`))
                          : t('diagNoMappings'),
                      ),
                    )
                  : h('div', { className: 'hm-empty' }, '—'),
                  ),
                )
            : null,
        ),
      );
    }

    function ChatEditor(props) {
      const { chat, banks, busy, t: tr, onCancel, onConfirm } = props;
      const [bankId, setBankId] = React.useState(chat.boundBankId || '');
      const [custom, setCustom] = React.useState('');
      const [folder, setFolder] = React.useState(chat.folder || chat.defaultFolder || '');
      const chosen = custom.trim() || bankId || chat.suggestedBank;
      return h(
        'div',
        { className: 'hm-editor' },
        h(
          'div',
          { className: 'hm-editor-row' },
          h(
            'select',
            {
              className: 'hm-select',
              value: banks.some((bank) => bank.bankId === bankId) ? bankId : '',
              onChange: (event) => {
                setCustom('');
                setBankId(event.target.value);
              },
            },
            h('option', { value: '' }, tr('chooseBank')),
            banks.map((bank) => h('option', { key: bank.bankId, value: bank.bankId }, `${bank.bankId} · ${bank.factCount}`)),
          ),
          h('input', {
            className: 'hm-input',
            'data-mono': 'true',
            placeholder: tr('customBank'),
            value: custom,
            onChange: (event) => setCustom(event.target.value),
          }),
        ),
        h(
          'div',
          { className: 'hm-editor-row' },
          h('span', { className: 'hm-hint' }, tr('folder')),
          h('input', {
            className: 'hm-input',
            'data-mono': 'true',
            value: folder,
            placeholder: chat.defaultFolder,
            onChange: (event) => setFolder(event.target.value),
          }),
        ),
        h('div', { className: 'hm-hint' }, tr('folderHint')),
        h(
          'div',
          { className: 'hm-editor-row' },
          h('span', { className: 'hm-hint' }, chosen),
          h('span', { className: 'hm-spacer' }),
          h(
            'button',
            { type: 'button', className: 'hm-btn', 'data-variant': 'primary', disabled: busy || !chosen, onClick: () => onConfirm(chosen, folder.trim()) },
            busy ? tr('binding') : tr('confirm'),
          ),
          h('button', { type: 'button', className: 'hm-btn', onClick: onCancel }, tr('cancel')),
        ),
      );
    }

    /* ─────────────────────────── sidebar entry ─────────────────────────── */

    function SidebarIcon(props) {
      const size = Number.isFinite(props?.size) ? props.size : 16;
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: size, height: size, fill: 'none', stroke: 'currentColor', 'aria-hidden': 'true', style: { display: 'block' } },
        h('ellipse', { cx: 8, cy: 3.6, rx: 5, ry: 1.9, strokeWidth: 1.2 }),
        h('path', { d: 'M3 3.6v3.1c0 1.05 2.24 1.9 5 1.9s5-.85 5-1.9V3.6', strokeWidth: 1.2 }),
        h('path', { d: 'M3 6.7v3.1c0 1.05 2.24 1.9 5 1.9s5-.85 5-1.9V6.7', strokeWidth: 1.2 }),
        h('path', { d: 'M3 9.8v2.6c0 1.05 2.24 1.9 5 1.9s5-.85 5-1.9V9.8', strokeWidth: 1.2 }),
      );
    }

    /* ─────────────────────────── apply ─────────────────────────── */

    /**
     * A minimal slot store. The page keeps its data in React state; the store
     * only satisfies the slot contract so the row and the page behave like
     * host-owned panels.
     */
    function createPageStore() {
      const spec = {
        init: () => ({ open: true }),
        actions: {
          open: (draft) => {
            draft.open = true;
          },
          close: (draft) => {
            draft.open = false;
          },
        },
      };
      return {
        spec,
        create() {
          let state = spec.init();
          const listeners = new Set();
          const actions = {};
          for (const [actionName, mutate] of Object.entries(spec.actions)) {
            actions[actionName] = (...params) => {
              const draft = { ...state };
              mutate(draft, ...params);
              state = draft;
              for (const listener of listeners) listener();
            };
          }
          return {
            actions,
            getSnapshot: () => state,
            subscribe(listener) {
              listeners.add(listener);
              return () => {
                listeners.delete(listener);
              };
            },
            clearPersisted() {
              listeners.clear();
            },
          };
        },
      };
    }

    function apply(ctx) {
      ctx.effect(() => installStyles(), 'hindsight-manager: styles');
      const pageStore = createPageStore();

      const layout = () => (typeof ctx.get === 'function' ? ctx.get('layout') ?? ctx.layout : ctx.layout);
      const closePanel = () => {
        try {
          layout()?.selectPanel?.(null);
        } catch {
          /* ignore */
        }
      };

      // `main` first: the host refuses to select a panellist row without a page.
      ctx.slots.inject('main', () =>
        ctx.slots.register(
          {
            name: 'main',
            key: PANEL_ID,
            store: pageStore,
            inject: () => ({ presentation: 'panel', closePanel }),
          },
          HindsightPanel,
        ),
      );

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register({ name: 'sidebar.panellist', id: PANEL_ID, order: 46, label: () => t('sidebar') }, SidebarIcon),
      );
    }

    return { inject: ['slots'], apply };
  },
});
