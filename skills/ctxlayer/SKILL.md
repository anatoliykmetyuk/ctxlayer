---
name: ctxlayer
description: Manages context layer domains, tasks, and documentation. Use when the user mentions "context layer" (e.g. "using context layer", "in the context layer", "to the context layer", "into the context layer"), mentions ctx commands, context layer projects or tasks, or requests documentation work -- such as documenting implemented features, research findings, or drawing diagrams. Also use when the user asks to add a repository to the context layer, or clone a repo as context layer context.
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

Configuration lives at `.ctxlayer/config.yaml` in the current working directory with two fields:

```yaml
active-domain: <domain-name>
active-task: <task-name>   # may be omitted if no task is active
```

Domains are stored globally at `~/.agents/ctxlayer/domains/`. Each domain contains task folders. Each task folder contains the context for that task. A task folder may have an `INDEX.md` file, and its subdirectories may also have `INDEX.md` files. Check for those files and use them to understand the structure of the context of the task.

**Which task to access:** By default, use the **active** domain and task from `config.yaml` (run `ctx status` to obtain them). When the user explicitly specifies a domain and task in the prompt (e.g. "in the context layer, domain A, task B, use documents 1 and 2"), use that instead. Access the active task's folder via the filesystem path `~/.agents/ctxlayer/domains/<domain>/<task>/`. All operations below apply to this resolved task. This folder is referred to as the **resolved task folder** or **task root**.

## Indexing

Index of the context layer refers to the `INDEX.md` files present in the task folder and its subdirectories. Expect the task folder to have an `INDEX.md` file that contains a summary of what is contained in the folder. An `INDEX.md` file will start with a short description of the task and the context so the task purpose and how to use this context are clear. It will also contain a table with the following columns:

- **ID** - The ordinal ID of the item in the index.
- **Filename** - The name of the file or folder being described.
- **Description** - A short description of the item. Use it to understand what is inside and when it is useful to access it.

Expect this structure to be recursive, so that a subdirectory may also have an `INDEX.md` file that contains a summary of what is contained in the subdirectory. Also expect that in some cases, recursive `INDEX.md` files may not be needed and the top-level `INDEX.md` file will describe the contents of the subdirectories as well.

Use context layer index for progressive discovery of context when working on tasks, and to resolve information referenced by the user by the context layer ID.

### Indexing Conventions

All files of the context layer are numbered and may be referred by a unique numeric ID. This is the same ID that is used in the `INDEX.md` file. As a rule, the ID is also written in the filename as a prefix, e.g. `01-initial-research.md`, `02-feature-implementation.md`, `03-architecture-diagram.md`. It is also written in folders as a prefix, e.g. `01-initial-research/`, `02-feature-implementation/`, `03-architecture-diagram/`. As a convention, the names of the files and folders follow kebab-case, prefixed with the ID. You MUST follow these conventions when creating new files or folders.

The user may refer to the files and folders by their ID, e.g. "folder 01-02-03" would mean, resolve folder with id `01`, its subfolder with id `02`, and use the folder `03` for the operation.

When creating a new file or folder, use the next available ID to prefix the filename or folder name. You can find the next available ID by listing all the files and folders in the context layer, determining the greatest ID, and incrementing it by 1. Also always update the corresponding `INDEX.md` file to include the new item.

### Updating the Index

Index should always stay up-to-date. When making any changes - updates, deletions or additions of new files or information - to the context layer, update corresponding `INDEX.md` files to reflect the changes.

The user may also explicitly ask to update the index, e.g. "update the index of the context layer". In that case: scan the entire context layer file tree, read every `INDEX.md` found, compare against the actual file tree, identify mismatches (e.g. files missing from the index or present in the index but not on disk, or renames or ID changes), and update the index to match.

If asked to build the index from scratch, scan the filesystem tree and write `INDEX.md` files anew from disk contents; do not reconcile against existing index entries as the source of truth.

If asked to rebuild the IDs of a directory, subdirectory, or entire context layer task, reassign IDs to files and folders to remove gaps in numbering. Preserve the ordering of file IDs during this operation.

## Common Operations

### Documentation operations

Documentation operations are read and write operations requested by the user with the intent of documenting something or accessing previously documented information. By default, documentation operations are performed on the resolved task's `docs/` folder. However the user may explicitly specify a different folder to perform the operation on, e.g. "in the context layer, log your findings to the folder 02" or "in the context layer, document the architecture diagram in folder 03 in the data folder".

Documentation follows the same indexing and naming conventions as the other context layer files and folders, described above.

### Git Repository Operations

When the user asks to "add a repository to the context layer" or "clone a repo as context layer context", do **NOT** run a regular `git clone`. Instead, from the task root, run `git submodule add <repo-url> <subdir>/<ID>-<repo-name>`, where `<subdir>` is the subdirectory where to clone the repo (use Context Layer Index to discover where repositories are cloned, or use a subdirectory explicitly specified by the user) and `<ID>` is the ID assigned to the repository in the Context Layer Index according to the indexing conventions described above.

This keeps the domain repo lightweight and version-controlled via submodule references.

### Git Operations

When the user requests any git operations (e.g., status, add, commit, push, pull) on the context layer or task context itself, perform them from the task root. For example:

> "Commit all the changes to the context layer"

Is understood as a request to summarize the changes in the resolved task, compose a descriptive commit message, and commit the changes via `git add -A . && git commit -a -m "<descriptive commit message>"` from the task root.
