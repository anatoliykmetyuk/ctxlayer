---
layout: docs
title: Commands
---

The `ctx` CLI manages domains and tasks in your context layer. Run `ctx` with no arguments to see help.

## Quick reference

| Command | Description |
|---------|-------------|
| `ctx new [name]` | Create a new task (prompts for domain if needed; prompts for task name if `name` is not specified) |
| `ctx import` | Import a task from any domain as a symlink into `.ctxlayer/` |
| `ctx status` | Show the active domain and task, plus git tracking info |
| `ctx set` | Set active domain and task (interactive) |
| `ctx git [args...]` | Run git in the active task directory |
| `ctx drop task [name]` | Remove a task symlink from `.ctxlayer/`. Prompts for task if `name` is not specified|
| `ctx drop domain [name]` | Remove a domain directory from `.ctxlayer/`. Prompts for domain if `name` is not specified |
| `ctx delete task` | Permanently delete a task from the context layer. Prompts for task |
| `ctx delete domain` | Permanently delete a domain from the context layer. Prompts for domain |

## ctx new [name]

Creates a new task. This is the main entry point for getting started and will initialize the context layer for the project.

**What it does:**

1. Ensures the workspace is initialized: creates `.ctxlayer/` and `config.yaml`, adds `/.ctxlayer/` to `.gitignore` if missing
2. If no valid active domain exists, prompts you to:
   - **Fetch from git** — clone an existing domain repo into `~/.agents/ctxlayer/domains/<domain>/`
   - **Create from scratch** — create a new domain directory and run `git init` in it
   - **Select existing domain** — pick from domains already in the user-wide context layer (in the `~/.agents/ctxlayer/domains/` directory)
3. Prompts for task name (or use `ctx new my-task` to pass it)
4. Creates the task directory under `~/.agents/ctxlayer/domains/<domain>/<task>/` with `docs/` and `data/` subfolders
5. Creates a symlink at `.ctxlayer/<domain>/<task>` pointing to the task, so the task becomes accessible to the agent from the project's root directory.
6. Writes `active-domain` and `active-task` to `.ctxlayer/config.yaml`, so the agent and commands know which task to access by default.

**Example:**

```bash
ctx new
ctx new my-feature-branch
```

## ctx import

Imports an existing task from any domain into your project as a symlink. This is useful when you need your agent to access domain knowledge from other projects.

**What it does:**

1. Ensures the workspace is initialized
2. Prompts you to select a domain
3. Prompts you to select a task from that domain
4. Creates a symlink at `.ctxlayer/<domain>/<task>` pointing to the task in the context layer
5. If `config.yaml` has no active domain/task, sets the imported domain and task as active; otherwise only creates the symlink

## ctx status

Shows the current active domain and task, plus git tracking information when the domain is version-controlled.

**Output:**

- Active domain and task from `config.yaml`
- If the domain directory has a `.git` folder: current branch, repo name, and remote URL
- If not synced to git: a short note drawing the user's attention to the fact that the domain is not synced to git

## ctx set

Interactively select and set the active domain and task. Use this to switch context when working on multiple tasks.

**What it does:**

1. Ensures workspace is initialized
2. Lists domains in `~/.agents/ctxlayer/domains/` and prompts you to pick one
3. Lists tasks in the selected domain and prompts you to pick the one you'd like to become active
4. Writes `active-domain` and `active-task` to `config.yaml`
5. Ensures the symlink exists at `.ctxlayer/<domain>/<task>`. If it does not, creates the symlink.

## ctx git [args...]

Runs `git` in the directory of the **current active task**. Pass any arguments as you would to `git`. This command is intended to provide a convenient way to version-control your context.

`ctx git [args...]` is equivalent to `cd ./.ctxlayer/<active-domain>/<active-task> && git [args...]`.

**Requirements:** An active task must be set. Run `ctx new` or `ctx set` first. If no active task is set, the command will exit with an error.

**Examples:**

```bash
ctx git status
ctx git add .
ctx git commit -m "Update docs"
ctx git push
```

## ctx drop task [name]

Removes the symlink to a task from `.ctxlayer/`. The task folder in the context layer (`~/.agents/ctxlayer/domains/<domain>/<task>/`) is **not** deleted - only the symlink to the task is deleted.

Use it when you've finished working on a task and no longer need it linked to the project, but wish to preserve the collected knowledge and context.

Dropped tasks may be re-imported via `ctx import`.

**What it does:**

- With `ctx drop task my-task`: removes the symlink for `my-task` in the active domain
- Without a name: prompts you to select a domain, then a task, and removes the symlink for the selected task

## ctx drop domain [name]

Removes a domain directory from the project's local `.ctxlayer/`. The domain and its tasks in the context layer (`~/.agents/ctxlayer/domains/<domain>/`) are **not** deleted - only the local `.ctxlayer/<domain>/` directory is removed.

**What it does:**

- With `ctx drop domain my-domain`: removes `.ctxlayer/my-domain/` (after confirmation)
- Without a name: prompts you to select a domain from the list of domains currently imported into the project

## ctx delete task

**Permanently** deletes a task from the context layer and removes its symlink.

> **This will delete the task folder and all its contents from the user-wide context layer folder!**

**What it does:**

1. Prompts you to select a domain
2. Prompts you to select a task
3. Asks for confirmation
4. Deletes the task directory from `~/.agents/ctxlayer/domains/<domain>/<task>/`
5. Removes the symlink at `.ctxlayer/<domain>/<task>` if it exists
6. Removes the local domain directory if it becomes empty

This cannot be undone.

## ctx delete domain

**Permanently** deletes a domain from the context layer and removes its local directory.

> **This will delete the domain folder and all its contents from the user-wide context layer folder!**

**What it does:**

1. Prompts you to select a domain
2. Asks for confirmation
3. Deletes the domain from `~/.agents/ctxlayer/domains/<domain>/`
4. Removes `.ctxlayer/<domain>/` from your project

This cannot be undone. All tasks in the domain are deleted.
