---
layout: docs
title: Commands
---

The `ctx` CLI manages domains and tasks in your context layer. Run `ctx` with no arguments to see help.

## Quick reference

| Command | Description |
|---------|-------------|
| `ctx new [name]` | Create a new task (prompts for domain if needed) |
| `ctx import` | Import a task from any domain as a symlink into `.ctxlayer/` |
| `ctx status` | Show the active domain and task, plus git tracking info |
| `ctx set` | Set active domain and task (interactive) |
| `ctx git [args...]` | Run git in the current task directory |
| `ctx drop task [name]` | Remove a task symlink from `.ctxlayer/` |
| `ctx drop domain [name]` | Remove a domain directory from `.ctxlayer/` |
| `ctx delete task` | Permanently delete a task from the context store |
| `ctx delete domain` | Permanently delete a domain from the context store |

---

## ctx new [name]

Creates a new task. This is the main entry point for getting started.

**What it does:**

1. Ensures the workspace is initialized: creates `.ctxlayer/` and `config.yaml`, adds `/.ctxlayer/` to `.gitignore` if missing
2. If no valid active domain exists, prompts you to:
   - **Fetch from git** — clone a repo into `~/.agents/ctxlayer/domains/<domain>/`
   - **Create from scratch** — create a new domain directory and run `git init`
   - **Select existing domain** — pick from domains already in the context store
3. If a domain is active, asks: "Use current active domain [X] for new task?" (yes/no)
4. Prompts for task name (or use `ctx new my-task` to pass it)
5. Creates the task directory under `~/.agents/ctxlayer/domains/<domain>/<task>/` with `docs/` and `data/` subfolders
6. Creates a symlink at `.ctxlayer/<domain>/<task>` pointing to the task
7. Writes `active-domain` and `active-task` to `.ctxlayer/config.yaml`

**Example:**

```bash
ctx new
ctx new my-feature-branch
```

---

## ctx import

Imports an existing task from any domain into your project as a symlink.

**What it does:**

1. Ensures the workspace is initialized
2. Prompts you to select a domain
3. Prompts you to select a task from that domain
4. Creates a symlink at `.ctxlayer/<domain>/<task>` pointing to the task in the context store
5. If `config.yaml` has no active domain/task, sets the imported domain and task as active; otherwise only creates the symlink

Use this when you want to work on a task that already exists in another domain or was created elsewhere.

---

## ctx status

Shows the current active domain and task, plus git tracking information when the domain is version-controlled.

**Output:**

- Active domain and task from `config.yaml`
- If the domain directory has a `.git` folder: current branch, repo name, and remote URL
- If not synced to git: a short note

---

## ctx set

Interactively select and set the active domain and task.

**What it does:**

1. Ensures workspace is initialized
2. Lists domains in `~/.agents/ctxlayer/domains/` and prompts you to pick one
3. Lists tasks in the selected domain and prompts you to pick one
4. Writes `active-domain` and `active-task` to `config.yaml`
5. Ensures the symlink exists at `.ctxlayer/<domain>/<task>`

Use this to switch context when working with multiple domains or tasks.

---

## ctx git [args...]

Runs `git` in the directory of the **current active task**. Pass any arguments as you would to `git`.

**Requirements:** An active task must be set. Run `ctx new` or `ctx set` first.

**Examples:**

```bash
ctx git status
ctx git add .
ctx git commit -m "Update docs"
ctx git push
```

---

## ctx drop task [name]

Removes the symlink to a task from `.ctxlayer/`. The task data in the context store is **not** deleted.

**What it does:**

- With `ctx drop task my-task`: removes the symlink for `my-task` in the active domain
- Without a name: prompts you to select a domain, then a task
- If the domain directory becomes empty, removes it

Use **drop** when you no longer need a task linked in this project but want to keep the task in the context store.

---

## ctx drop domain [name]

Removes a domain directory from `.ctxlayer/`. The domain and its tasks in the context store are **not** deleted.

**What it does:**

- With `ctx drop domain my-domain`: removes `.ctxlayer/my-domain/` (after confirmation)
- Without a name: prompts you to select a domain
- Asks for confirmation before removing

Use **drop** when you no longer need a domain linked in this project.

---

## ctx delete task

**Permanently** deletes a task from the context store and removes its symlink.

**What it does:**

1. Prompts you to select a domain
2. Prompts you to select a task
3. Asks for confirmation
4. Deletes the task directory from `~/.agents/ctxlayer/domains/<domain>/<task>/`
5. Removes the symlink at `.ctxlayer/<domain>/<task>` if it exists
6. Removes the local domain directory if it becomes empty

This cannot be undone.

---

## ctx delete domain

**Permanently** deletes a domain from the context store and removes its local directory.

**What it does:**

1. Prompts you to select a domain
2. Asks for confirmation
3. Deletes the domain from `~/.agents/ctxlayer/domains/<domain>/`
4. Removes `.ctxlayer/<domain>/` from your project

This cannot be undone. All tasks in the domain are deleted.

---

## Config file

The config is stored at `.ctxlayer/config.yaml`:

```yaml
active-domain: my-domain
active-task: my-task
```

- **active-domain** — The domain used by the agent skill and by commands like `ctx git`
- **active-task** — The task directory used when running `ctx git`; may be empty if no task is active

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `CONTEXT_LAYER_HOME` | Override the context store location (default: `~/.agents/ctxlayer`) |
| `CONTEXT_LAYER_CWD` | Override the working directory (default: current directory) |
