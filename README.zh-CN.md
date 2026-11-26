# dsh-hindsight-manager

在 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）里管理 [Hindsight](https://github.com/vectorize-io/hindsight) 记忆库。

装了 Hindsight 的 DSH 插件之后，DSH 本身就会记住项目——但「一个会话写进哪个 bank」只由一件事决定：它的工作目录。本插件把这件事变成看得见、点得动的：一页列出每个 DSH 工作区、每个 Bots 项目、每个 Bots 群聊当前落在哪个 bank，并支持一键给它们各建一个 bank。

- **工作区**：列出 DSH 工作区（独立映射 / 继承 / 未接入），单个接入、改绑、解除，或一次「全部接入」。
- **项目**：Bots 项目对应 `bots::project::<KEY>`，绑到项目文件夹，项目的任务和项目会话共享一个记忆。
- **群聊**：Bots 群聊对应 `bots::chat::<通道>::<会话>`，绑到为该群准备的独立目录。
- **全部 bank**：分类、事实数、绑定目录、使命；可新建、改使命、删除。
- **诊断**：服务地址、配置路径、令牌来源、命名模板、已写入的全部映射。
- **`hindsight_manager` 工具**：同样的操作以工具形式给机器人用，项目里或群里的机器人可以自己建 bank、看 bank。

## 原理

Hindsight 的 DSH 插件按会话的工作目录解析 bank，规则写在 `~/.hindsight/coding-agent.json` 的 `mapPathToBank` 里（最长前缀优先）。所以「把一个工作区加入记忆」就是两件事：

1. 确保 bank 存在（`PUT /v1/default/banks/{id}`）；
2. 往这个文件写一条 `<目录> → <bank>`。

本插件只做这两件事，外加读取 DSH 自己的存储（`storages/workspace.json`、`cache/bots/*.json`）来列出可接入的对象。它不改 DSH 的 profile，也不改 Bots 的数据。

## 前置条件

- DSH 已安装 Hindsight 的 coding-agent 插件，`~/.hindsight/coding-agent.json` 存在。
- 有一个 Hindsight 服务可达：本地守护进程（`http://127.0.0.1:8888`）、自建服务器或 Hindsight Cloud。
- Bots 可选；没装时「项目」「群聊」两页是空的。

## 安装

把这个目录作为 DSH 插件 bundle 装进 profile：**插件 → 添加插件** 选这个目录，或用 plugin-manager 的 `install_bundle`。页面注册为侧边栏的「Hindsight 记忆」；装完没出现就重启一次 DSH（客户端 bundle 在启动时注册）。

服务地址与令牌默认沿用 `~/.hindsight/coding-agent.json`，也可以在插件配置里覆盖（`apiUrl`、`apiToken`、`agentConfigPath`）。

## 页面

| 标签 | 内容 | 操作 |
| --- | --- | --- |
| 工作区 | 工作区、会话数、当前 bank（独立/继承/未接入） | 接入、改绑、解除、全部接入 |
| 项目 | 项目 key、文件夹、成员 | 接入 `bots::project::<KEY>`、改绑、解除 |
| 群聊 | 通道、会话 id、所属机器人、任务数 | 接入 `bots::chat::…`、选工作目录、解除 |
| 全部 bank | 按分类的全部 bank、事实数、目录、使命 | 新建、改使命、删除 |
| 诊断 | 连接、配置、模板、数据来源、映射 | — |

## 命名

| 对象 | 默认 bank |
| --- | --- |
| DSH 工作区 | `workspace::<名字>` |
| Bots 项目 | `bots::project::<KEY>` |
| 群聊 | `bots::chat::<通道>::<会话>` |

每一步都可以手填 id，或选一个已有的 bank，让几个对象汇入同一个记忆。中文、空格、标点组成、在 bank id 里活不下来的标题会自动补一段短哈希，不会都塌成同一个名字。

## 生效时机

记忆插件按工作目录缓存 bank，进程内只解析一次：

- **新工作区**立刻生效，下一次会话就写新 bank；
- **本次运行中已经用过的工作区**要重启 DSH 之后才切换。有等待重启的改动时页面顶部会提示。

## 群聊与目录

Bots 的会话按目录跑，bank 也按目录分。所以每个群默认拿到一个独立目录（`~/.dsh/cache/hindsight-manager/chats/…`）和对应的映射。要让这个 bank 真收到对话，把该群所属机器人的 workdir 指到这个目录（Bots 设置里的 `workdirs[handle]`），或者把页面上的目录改成机器人已经在用的工作目录。同一个机器人服务多个群时会共用一个目录，这时给每个群单独配。

## 工具

```
hindsight_manager { action: "status" }
hindsight_manager { action: "bind_workspace" }                          // 当前工作区
hindsight_manager { action: "bind_project", project: "OPC" }
hindsight_manager { action: "bind_chat", chat: "feishu:bot-1/app-1:oc_xxx" }
hindsight_manager { action: "create_bank", bank: "team::research" }
```

动作：`status`、`banks`、`workspaces`、`projects`、`chats`、`bind_workspace`、`bind_all_workspaces`、`bind_project`、`bind_chat`、`create_bank`、`set_mission`、`unbind_workspace`、`unbind_project`、`unbind_chat`、`delete_bank`。

## 说明

- 删除 bank 会连记忆一起删；bank 里有事实时会再确认一次。
- 第一次写入会在配置旁留一份备份 `coding-agent.json.bak`。
- 没有构建步骤：Host 是普通 ESM，客户端是浏览器模块表里的一个 bundle。
- 更细的说明见 [docs/DETAIL.md](docs/DETAIL.md)。

## 许可

MIT
