# Hindsight 记忆管理

在 DSH 里管理这台机器上的 [Hindsight](https://github.com/vectorize-io/hindsight) 记忆库：
把 DSH 工作区接进记忆、按 bank 分类查看，并给 Bots 的项目和群聊各建一个 bank。

## 它怎么工作

DSH 的 Hindsight 记忆插件（`~/.hindsight/coding-agents`）只用一个文件决定「这个会话写进哪个 bank」：
`~/.hindsight/coding-agent.json` 里的 `mapPathToBank`。bank 按**会话的工作目录**解析，
最长前缀优先。所以本插件的每个「接入」动作都等于两件事：

1. 在 Hindsight 里确保 bank 存在（`PUT /v1/default/banks/{id}`）；
2. 往 `mapPathToBank` 写一条「目录 → bank」。

本插件不改 DSH 的 profile、不改 Bots 的数据，只读写这一个配置文件，并调用 Hindsight 的 REST API。

## 页面

侧边栏 **Hindsight 记忆** 打开一页管理界面，分五个标签：

- **工作区**：列出 DSH 的工作区（来自 `~/.dsh/storages/workspace.json`），显示每个工作区当前进哪个
  bank（独立映射 / 继承上层目录 / 未接入）。单个「接入」用默认名字 `workspace::<工作区名>`，
  「全部接入」一次把所有未接入的工作区各接一个 bank。
- **项目**：列出 Bots 的项目（`~/.dsh/cache/bots/projects.json`）。项目自带文件夹，
  接入后该项目的任务与项目会话都会写进 `bots::project::<KEY>`。
- **群聊**：列出 Bots 记录过的群聊（`tickets.json` 里的非 panel 线程，一个群一行）。
  Bots 的会话按目录跑，而记忆 bank 也只认目录，所以每个群默认拿到一个独立目录
  `~/.dsh/cache/hindsight-manager/chats/<通道-会话>`；接入时会把「这个目录 → 群 bank」写进映射。
  要让这个 bank 真正收到对话，把该群所属机器人的 workdir 指到这个目录
  （Bots 设置里的 `workdirs[handle]`）；如果那个机器人只服务这一个群，也可以直接把编辑框里的目录
  换成机器人自己的工作目录。同一目录只能对应一个 bank，改绑会提示覆盖。
- **全部 bank**：所有 bank 及分类（工作区 / 项目 / 群聊 / 其他）、事实数、绑定目录、使命；
  可新建 bank、改使命、删除（有数据时需二次确认）。
- **设置**：改 Hindsight 连接（服务地址、服务模式、令牌），保存前可测试连通性；下面列出
  配置路径、服务模式、令牌来源、命名模板、数据来源与已写入的全部映射。

## 更换 Hindsight 服务

记忆系统可以部署在别的机器上。设置页改的是 `coding-agent.json` 里的 `apiUrl`、`serverMode`、
`apiToken` 三个字段——也就是记忆插件真正读的那份配置：

- 地址支持 http/https，末尾斜杠会被规范掉；留空等于删掉这个键，回落到 `HINDSIGHT_API_URL`
  或官方云地址。
- 模式：`cloud`（官方云）、`self-hosted`（自建服务）、`daemon`（本机 9077 端口的守护进程）。
- 令牌只写不读：填了写入，点「清除令牌」删除，留空保持不变；页面不回显，也不写日志。

「测试连接」只对候选地址做 `/health` 与 `/version` 探测，不落盘；「保存」写文件后再探一次。
本页立刻使用新地址，记忆插件在重启 DSH 后切换。若插件配置 `cordis.patch.yml` 里写死了
`apiUrl`，页面会明确提示该地址优先，保存的地址要清掉覆盖后才生效。

## 命名约定

| 对象 | 默认 bank |
| --- | --- |
| DSH 工作区 | `workspace::<工作区名>` |
| Bots 项目 | `bots::project::<KEY>` |
| 群聊 | `bots::chat::<通道>::<会话 id 尾部>` |

任何一步都可以手填 bank id（也可以选列表里已有的 bank，让几个对象汇入同一个记忆）。

## 生效时机

记忆插件按工作目录缓存 bank，进程内只解析一次，所以：

- **新的工作区**：保存后立即生效（下一次会话就进新 bank）。
- **本次运行中已经用过的工作区**：需要重启 DSH，之后才切换 bank。页面顶部会出现相关提示。

## 给机器人的工具

`hindsight_manager` 工具与页面共用同一套操作，Bots 里的机器人可以直接调用：

```
hindsight_manager { action: "status" }
hindsight_manager { action: "bind_workspace" }                 // 当前工作区
hindsight_manager { action: "bind_project", project: "OPC" }
hindsight_manager { action: "bind_chat", chat: "feishu:bot-1/app-1:oc_xxx" }
hindsight_manager { action: "create_bank", bank: "team::research" }
```

动作：`status` / `banks` / `workspaces` / `projects` / `chats` /
`bind_workspace` / `bind_all_workspaces` / `bind_project` / `bind_chat` /
`create_bank` / `set_mission` / `unbind_workspace` / `unbind_project` /
`unbind_chat` / `delete_bank`。

## 限制与注意

- 只管理**目录映射**能表达的东西。Hindsight 记忆插件没有按会话切换 bank 的接口，
  所以「一个群一个 bank」在 Bots 里受工作目录粒度约束（见上）。
- 删除 bank 会连它的记忆一起删除，不可恢复；有事实时必须二次确认。
- 写入前会在配置文件旁留一份一次性备份 `coding-agent.json.bak`。
- 服务地址与令牌默认沿用 `coding-agent.json`；也可以在插件配置里覆盖。
