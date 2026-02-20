---
name: ctxlayer
description: Manages context layer domains, tasks, and documentation. Use when the user mentions "context layer" (e.g. "using context layer", "in the context layer", "in the context", "to the context layer", "into the context layer") ctx commands, context layer projects or tasks, or requests you to write any form of documentation -- such as documenting implemented features, research findings, or drawing diagrams. Also use when the user asks to add a repository to the context layer, clone a repo as context layer context, or access context layer's "data" folder.
---

# Context Layer

## ctx CLI commands

The `ctx` CLI manages domains and tasks. Available commands:

- `ctx` -- Show help and available commands
- `ctx new [name]` -- Create a new task (prompts for domain if needed; prompts for task name if `name` is not specified)
- `ctx import` -- Import a task from any domain as a symlink into `.ctxlayer/` (sets active when config is empty)
- `ctx status` -- Show the active domain and task, plus git tracking info
- `ctx set` -- Set active domain and task (interactive)
- `ctx git [args...]` -- Run git in the active task directory
- `ctx drop task [name]` -- Remove a task symlink from `.ctxlayer/`. Prompts for task if `name` is not specified
- `ctx drop domain [name]` -- Remove a domain directory from `.ctxlayer/`. Prompts for domain if `name` is not specified
- `ctx delete task` -- Permanently delete a task from the context layer. Prompts for task
- `ctx delete domain` -- Permanently delete a domain from the context layer. Prompts for domain

**Git operations on the context layer:** When the user requests any git operations (e.g., status, add, commit, push, pull) on the context layer or task context, perform them via `ctx git <args>` rather than running `git` directly.

Configuration lives at `.ctxlayer/config.yaml` in the current working directory with two fields:

```yaml
active-domain: <domain-name>
active-task: <task-name>
```

Domains are stored globally at `~/.agents/ctxlayer/domains/`. Each domain contains task folders, and each task folder has `docs/` and `data/` subdirectories.

**Specifying domain and task in prompts:** When the user does not explicitly specify the task of the context layer they want to access (e.g. "in the context layer, use documents 1 and 2"), run `ctx status` to obtain the names of the active domain and task from `config.yaml`, and assume that is the task they want to access. When the user explicitly specifies a different domain or task in the prompt (e.g. "in the context layer, domain A, task B, use documents 1 and 2"), resolve to that domain and task instead of the active one and access them via `.ctxlayer/<domain>/<task>/` symlink. If they symlink is missing, stop and advise the user to run `ctx import` to import the requested task from the context layer.

## Docs folder convention

**Reading documents:** When the user references "document number N", resolve it to the file with prefix `0N-` (e.g. document 1 → `01-initial-research.md`, document 3 → `03-*.md`).

**Writing documents:** When the user asks to document something -- implemented features, research findings, search results, architecture decisions, diagrams, or any other form of documentation -- you must follow the numbering convention and create a new numbered markdown file in the appropriate task's `docs/` folder and write the content as a markdown file. The following are the naming rules for writing the documents:

- **Prefix:** two-digit incrementing number (`01`, `02`, `03`, …) based on existing files
- **Separator:** Single dash
- **Name:** Descriptive kebab-case summary
- **Extension:** `.md`

**Examples:** `01-initial-research.md`, `02-feature-implementation.md`, `03-architecture-diagram.md`

Write the content the user requested, in the format they requested.

Each file is a standalone document covering one topic. The docs folder serves as a running report and journal for the task.

## Data folder convention

The data folder at `~/.agents/ctxlayer/domains/<active-domain>/<active-task>/data/` holds reference material for the task: sample data, configuration snippets, external repositories, and anything else useful as a reference during implementation.

### Adding repositories to data

When the user asks to "add a repository to the context layer" or "clone a repo as context layer context", do **NOT** run a regular `git clone`. Instead, use `git submodule add` in the appropriate task's `data/` folder.

This keeps the domain repo lightweight and version-controlled via submodule references rather than full repository copies.
