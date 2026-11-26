# dsh-hindsight-manager

Manage [Hindsight](https://github.com/vectorize-io/hindsight) memory banks from inside [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH).

DSH already remembers a project when its Hindsight coding-agent plugin is installed — but the bank a session writes to is decided by one thing: its working directory. This plugin makes that choice visible and editable. It adds a page that lists every DSH workspace, every Bots project and every Bots group chat next to the bank it currently reaches, and maps any of them to a bank of its own in one click.

- **Workspaces** — every workspace in the DSH registry, mapped / inherited / unmapped, with one-click onboarding and "map all".
- **Projects** — Bots projects get `bots::project::<KEY>`, bound to the project's folder, so the project's tasks and project conversations share one memory.
- **Group chats** — Bots chat threads get `bots::chat::<channel>::<chat>`, bound to a dedicated work folder.
- **All banks** — categories, fact counts, bound folders, missions; create, re-mission, delete.
- **Diagnostics** — server, config path, token source, name template, every written mapping.
- **`hindsight_manager`** — the same operations as an agent tool, so a bot working in a project or a chat can create and inspect banks itself.

## How routing works

Hindsight's DSH plugin resolves a session's bank from its working directory, using `mapPathToBank` in `~/.hindsight/coding-agent.json` (longest matching prefix wins). "Adding a workspace to memory" is therefore two things:

1. make sure the bank exists (`PUT /v1/default/banks/{id}`), and
2. write `<folder> → <bank>` into that file.

This plugin does exactly that. It reads DSH's own stores (`storages/workspace.json`, `cache/bots/*.json`), calls the Hindsight REST API, and rewrites that one config file — nothing else. It does not touch the DSH profile or the Bots store.

## Requirements

- DSH with the Hindsight coding-agent plugin installed, so `~/.hindsight/coding-agent.json` exists.
- A Hindsight server reachable from DSH: a local daemon (`http://127.0.0.1:8888`), a self-hosted server, or Hindsight Cloud.
- Bots is optional — the projects and group chats tabs only appear with data when it is installed.

## Install

Install this directory as a DSH plugin bundle in your profile: **Plugins → Add plugin** with the directory, or via the plugin-manager tool (`install_bundle`). The page is registered as a sidebar entry named **Hindsight memory**; restart DSH if it does not appear right after installing.

The server address and token default to `~/.hindsight/coding-agent.json`; override them in the plugin config (`apiUrl`, `apiToken`, `agentConfigPath`).

## The page

| Tab | What it shows | Actions |
| --- | --- | --- |
| Workspaces | DSH workspaces, their sessions, current bank (own / inherited / none) | map, change, unmap, map all |
| Projects | Bots projects (`KEY`, folder, members) | map to `bots::project::<KEY>`, change, unmap |
| Group chats | Bots chat threads (channel, chat id, bot, task count) | map to `bots::chat::…`, choose the work folder, unmap |
| All banks | every bank by category, facts, folders, mission | create, edit mission, delete |
| Diagnostics | connection, config, template, sources, mappings | — |

## Naming

| Object | Default bank |
| --- | --- |
| DSH workspace | `workspace::<name>` |
| Bots project | `bots::project::<KEY>` |
| Group chat | `bots::chat::<channel>::<chat-id>` |

Any step accepts a hand-typed id, or an existing bank so several objects converge on one memory. A title that cannot survive in a bank id (CJK, spaces, punctuation) gets a short stable hash suffix instead of collapsing to one shared name.

## When a change takes effect

The memory plugin caches a bank per working directory for the life of the process.

- A **new** workspace applies immediately: its next session writes to the new bank.
- A workspace **already used in this run** switches after DSH restarts. The page shows a notice while a saved change is waiting.

## Group chats and folders

Bots sessions run per folder, and so does bank routing. Each chat therefore gets a folder of its own (`~/.dsh/cache/hindsight-manager/chats/…`) and a mapping for it. For that bank to receive the conversation, point the chat bot's workdir at that folder (`workdirs[handle]` in the Bots settings) — or edit the folder field to a work folder the bot already uses. If one bot serves several groups they would share a folder, so give each its own.

## The tool

```
hindsight_manager { action: "status" }
hindsight_manager { action: "bind_workspace" }                          // current workspace
hindsight_manager { action: "bind_project", project: "OPC" }
hindsight_manager { action: "bind_chat", chat: "feishu:bot-1/app-1:oc_xxx" }
hindsight_manager { action: "create_bank", bank: "team::research" }
```

Actions: `status`, `banks`, `workspaces`, `projects`, `chats`, `bind_workspace`, `bind_all_workspaces`, `bind_project`, `bind_chat`, `create_bank`, `set_mission`, `unbind_workspace`, `unbind_project`, `unbind_chat`, `delete_bank`.

## Notes

- Deleting a bank deletes its memory with it and asks for confirmation when the bank holds facts.
- The first write leaves a one-time backup next to the config (`coding-agent.json.bak`).
- No build step: plain ESM on the host, a browser module loader bundle on the client.

## License

MIT
