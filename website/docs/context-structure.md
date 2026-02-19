---
layout: docs
title: Context Structure
---

The context layer is the corpus of knowledge and context you curate for AI-assisted development. It lives on your operating system as a directory structure and is linked into your software projects via symlinks.

## Location

The context layer is stored in a centralized location on your machine. By default, it is located at `~/.agents/ctxlayer/`. You can change this location by setting the `CONTEXT_LAYER_HOME` environment variable. Each software project links to the tasks on the context layer through a local `.ctxlayer/` folder.

**Global store (system-wide):**

```bash
~/.agents/ctxlayer/
└── domains/
    └── my-domain/
        ├── .git/
        ├── task-1/
        │   ├── docs/
        │   │   ├── 01-initial-research.md
        │   │   └── 02-implementation-notes.md
        │   └── data/
        │       └── sample-data.json
        └── task-2/
            ├── docs/
            └── data/
```

**Local link (in your project):**

```bash
my-project/
├── README.md
├── ...                    # your project files
└── .ctxlayer/             # gitignored
    ├── config.yaml        # active-domain, active-task
    └── my-domain/
        ├── task-1/        # symlink → ~/.agents/ctxlayer/domains/my-domain/task-1/
        └── task-2/        # symlink → ~/.agents/ctxlayer/domains/my-domain/task-2/
```

The global store lives in your home directory (`~/.agents/ctxlayer/domains/`) and is independent of any single repo. Each project's `.ctxlayer/` contains `config.yaml` and symlinks to tasks in that store. The `.ctxlayer/` folder is added to `.gitignore` so it is not committed to your project.

## Conceptual structure

The context layer is organized into **domains** and **tasks**.

### Domains

A **domain** is a context organization unit. It holds knowledge that may apply to one or more software projects.

- **Location:** `~/.agents/ctxlayer/domains/<domain-name>/`
- **Git:** Each domain is initialized as a separate git repository. Use it to version-control domain knowledge and push to a dedicated GitHub repo if needed.
- **Scope:** For a simple project, use one domain per project (e.g. `my-project` or `my-project-ctx`). For multiple projects sharing purpose or context, use a single domain for all of them.

### Tasks

A **task** is one unit of work within a domain (similar to a branch).

- **Location:** `~/.agents/ctxlayer/domains/<domain>/<task>/`
- **Structure:** Each task has:
  - **`docs/`** — Markdown documentation (research, plans, decisions, procedures)
  - **`data/`** — Reference material (logs, sample data, external repos, config snippets)

Tasks are created with `ctx new` and linked into projects via symlinks under `.ctxlayer/<domain>/<task>/`.

## Config file

This file lives in the `.ctxlayer/` folder in your project root: `.ctxlayer/config.yaml`. It contains the active domain and task that will be used by default by the agent skill and commands like `ctx git`.

**Format:**

```yaml
active-domain: my-domain
active-task: my-task
```

| Field | Description |
|-------|-------------|
| `active-domain` | The domain used by the agent skill and by commands like `ctx git` |
| `active-task` | The task directory used when running `ctx git`; may be omitted if no task is active |

The agent skill reads this file to know where to write documentation and which task's `docs/` and `data/` to access when you say "in the context layer". Commands like `ctx git` run in the active task directory.

## Docs folder convention

Markdown files in `docs/` are **numbered** for sorting and to support "document number N" references in prompts.

**Naming:** `NN-descriptive-name.md`

- **Prefix:** Two-digit incrementing number (`01`, `02`, `03`, …) based on existing files
- **Separator:** Single dash
- **Name:** Descriptive kebab-case summary
- **Extension:** `.md`

**Examples:** `01-initial-research.md`, `02-feature-implementation.md`, `03-architecture-diagram.md`

Each file is a standalone document. The docs folder acts as a running report and journal for the task. When you ask the agent to "read document number 1", it refers to the first file when sorted by name (e.g. `01-...`).

## Data folder convention

The `data/` folder holds reference material: sample data, config snippets, logs, external repositories, and anything the agent needs during implementation.

**Adding external repos:** Use `git submodule add <repo-url>` inside the task's `data/` folder (not a plain `git clone`), so the domain repo stays lightweight and version-controlled via submodule references.

Use these to override paths for testing or custom setups.
