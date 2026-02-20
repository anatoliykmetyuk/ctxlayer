---
layout: docs
title: Directory Format Reference
---

The context layer is the corpus of knowledge you curate for an AI agent to use during AI-assisted development. It lives on your operating system as a directory structure and is linked into your software projects via symlinks.

## Location

The context layer is stored in a centralized location on your machine at `~/.agents/ctxlayer/`. Software projects link to the tasks on the context layer through symlinks to the task directories. These symlinks are stored in a local `.ctxlayer/` folder in the project root.

The `.ctxlayer/` folder is added to `.gitignore` when you initialize the context layer for a project via `ctx new`, so it is not committed to your project's repository. You should use a separate git repository to version-control the context layer.

**Global store (system-wide):**

```bash
~/.agents/ctxlayer/
└── domains/
    └── my-domain-1/
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
    └── my-domain-2/
        ├── .git/
        ├── task-1/
        └── task-2/
```

**Local link (in your project):**

```bash
my-project/
├── README.md
├── ...                    # your project files
└── .ctxlayer/             # gitignored
    ├── config.yaml        # active-domain, active-task
    └── my-domain-1/
        ├── task-1/        # symlink → ~/.agents/ctxlayer/domains/my-domain-1/task-1/
        └── task-2/        # symlink → ~/.agents/ctxlayer/domains/my-domain-1/task-2/
```

## Conceptual structure

The context layer is organized into **domains** and **tasks**.

### Domains

A **domain** is a context organization unit. It holds knowledge that may apply to one or more software projects.

- **Location:** `~/.agents/ctxlayer/domains/<domain-name>/`
- **Git:** Each domain is initialized as a separate git repository. Use it to version-control domain knowledge and push to a dedicated GitHub repo if needed.
- **Scope:** For a simple project, use one domain per project (e.g. `my-project` or `my-project-ctx`). For multiple projects sharing purpose or context, you can use a single domain for all of them if it makes sense.

### Tasks

A **task** is one unit of work within a domain (similar to a git branch in a git repository).

- **Location:** `~/.agents/ctxlayer/domains/<domain>/<task>/`
- **Structure:** Each task has:
  - **`docs/`** — Markdown documentation (research, plans, decisions, procedures)
  - **`data/`** — Reference material (logs, sample data, external repos, config snippets)

Tasks are created with `ctx new` and linked into projects via symlinks under `.ctxlayer/<domain>/<task>/`.

The precise structure of the task directory is still evolving and will likely change in the future, as the Context Layer engineering pattern defined by this documentation evolves.

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

Markdown files in `docs/` are **numbered** for sorting and to support *"document number N"* references in prompts.

**Naming:** `NN-descriptive-name.md`

- **Prefix:** Two-digit incrementing number (`01`, `02`, `03`, …) based on existing files
- **Separator:** Single dash
- **Name:** Descriptive kebab-case summary
- **Extension:** `.md`

**Examples:** `01-initial-research.md`, `02-feature-implementation.md`, `03-architecture-diagram.md`

Each file is a standalone document. The docs folder acts as a **running report** and **journal** for the task. For example, if you ask the agent to *"read document number 1"*, it refers to the file starting with that number, such as `01-initial-research.md`.

## Data folder convention

The `data/` folder holds reference material: sample data, config snippets, logs, external repositories, and anything the agent needs during implementation.

**Adding external repos:** Use `git submodule add <repo-url>` inside the task's `data/` folder (not a plain `git clone`), so the domain repo stays lightweight and version-controlled via submodule references. You can also ask the agent to *add a git repo into the context layer's data*, and it should use `git submodule add` by default.
