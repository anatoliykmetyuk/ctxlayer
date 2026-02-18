---
name: ctxlayer
description: Manages context layer domains, tasks, and documentation via the ctx CLI. Use when the user mentions context layer (e.g. "using context layer", "in the context layer", "in the context") ctx commands, context layer projects or tasks, or requests you to write any form of documentation -- such as documenting implemented features, research findings, or drawing diagrams. Also use when the user asks to clone a repo as context layer context or access context layer's "data" folder.
---

# Context Layer

## ctx CLI commands

The `ctx` CLI manages domains and tasks. Available commands:

- `ctx` -- Show help and available commands
- `ctx new [name]` -- Create a new task (single entry point; initializes workspace if needed, prompts to create/select domain if missing, and may prompt "use current domain?")
- `ctx import` -- Import a task from any domain as a local symlink (works on uninitialized workspaces; sets active when config is empty or missing)
- `ctx git [args...]` -- Run git in the current task directory
- `ctx drop task [name]` -- Remove a task symlink (with optional task name)
- `ctx drop domain [name]` -- Remove a domain directory from local `.ctxlayer/` (optional domain name)
- `ctx delete task` -- Delete a task from the context store and remove its symlink
- `ctx delete domain` -- Delete a domain from the context store and remove its local directory
- `ctx status` -- Show the current active domain and task
- `ctx set` -- Set active domain and task (prompts to select)

**Git operations on the context layer:** When the user requests any git operations (e.g., status, add, commit, push, pull) on the context layer or task context, perform them via `ctx git <args>` rather than running `git` directly.

Configuration lives at `.ctxlayer/config.yaml` in the current working directory with two fields:

```yaml
active-domain: <domain-name>
active-task: <task-name>
```

Domains are stored globally at `~/.agents/ctxlayer/domains/`. Each domain contains task folders, and each task folder has `docs/` and `data/` subdirectories.

## Docs folder convention

When the user asks to document something -- implemented features, research findings, search results, architecture decisions, diagrams, or any other form of documentation -- follow these steps:

1. Read `.ctxlayer/config.yaml` to get `active-domain` and `active-task`. `.ctxlayer` folder is likely to be gitignored, so read it using command line.
2. Navigate to `~/.agents/ctxlayer/domains/<active-domain>/<active-task>/docs/`.
3. Create a new markdown file using this naming convention:
   - **Prefix:** two-digit incrementing number based on existing files in the folder (`01`, `02`, `03`, ...).
   - **Separator:** a single dash.
   - **Name:** descriptive kebab-case summary of the content.
   - **Extension:** `.md`.
   - Examples: `01-initial-research.md`, `02-feature-implementation.md`, `03-architecture-diagram.md`.
4. Write the content the user requested, in the format they requested.

Each file is a standalone document covering one topic. The docs folder serves as a running report and journal for the task.

## Data folder convention

The data folder at `~/.agents/ctxlayer/domains/<active-domain>/<active-task>/data/` holds reference material for the task: sample data, configuration snippets, external repositories, and anything else useful as a reference during implementation.

### Cloning repos as context layer context

When the user asks to "clone a repo as context" or to add a repository to the context layer context, do **NOT** run a regular `git clone`. Instead:

1. Navigate to the task's `data/` folder.
2. Run `git submodule add <repo-url>` to add the repository as a git submodule.
3. Run `git submodule update --init` to initialize and fetch it.

This keeps the data folder lightweight and version-controlled via submodule references rather than full repository copies.
