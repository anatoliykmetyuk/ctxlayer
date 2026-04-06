---
layout: docs
title: Commands
---

The `ctx` CLI manages domains and tasks in your context layer. Run `ctx` with no arguments to see help.

## Quick reference

| Command | Description |
|---------|-------------|
| `ctx new [name]` | Create a new task. Supports non-interactive flags such as `--task`, `--domain`, `--use-current-domain`, and `--create-domain` |
| `ctx import` | Clone a domain and/or link a task into `.ctxlayer/`. Supports `--domain`, `--task`, `--clone-from` (clone-only if no `--task`) |
| `ctx status` | Show the active domain and task, plus git tracking info |
| `ctx set` | Set active domain and task. Supports `--domain`, `--task`, and `--clone-from` |
| `ctx git [args...]` | Run git in the active task directory |
| `ctx drop task [name]` | Remove a task symlink from `.ctxlayer/`. Supports `--domain` and `--task` |
| `ctx drop domain [name]` | Remove a domain directory from `.ctxlayer/`. Supports `--domain` and `--yes` |
| `ctx delete task` | Permanently delete a task from the context layer. Supports `--domain`, `--task`, and `--yes` |
| `ctx delete domain [name]` | Permanently delete a domain. Domain as first arg or `--domain`; use `--yes` to skip confirmation |

## ctx new [name]

Creates a new task. This is the main entry point for getting started and will initialize the context layer for the project.

**What it does:**

1. Ensures the workspace is initialized: creates `.ctxlayer/` and `config.yaml`, adds `/.ctxlayer/` to `.gitignore` if missing
2. If no valid active domain exists, prompts you to:
   - **Fetch from git** — clone an existing context-layer domain repo into `~/.agents/ctxlayer/domains/<domain>/`
   - **Create from scratch** — create a new domain directory and run `git init` in it
   - **Select existing domain** — pick from domains already in the user-wide context layer (in the `~/.agents/ctxlayer/domains/` directory)
3. Prompts for task name (or use `ctx new my-task` / `ctx new --task my-task` to pass it)
4. Creates the task directory under `~/.agents/ctxlayer/domains/<domain>/<task>/` with an `INDEX.md` file (title, summary placeholder, and an empty index table — see [Directory Format Reference](/docs/format-reference.html))
5. Creates a symlink at `.ctxlayer/<domain>/<task>` pointing to the task, so the task becomes accessible to the agent from the project's root directory.
6. Writes `active-domain` and `active-task` to `.ctxlayer/config.yaml`, so the agent and commands know which task to access by default.

**Example:**

```bash
ctx new
ctx new my-feature-branch
ctx new --use-current-domain --task my-feature-branch
ctx new --domain existing-domain --task my-feature-branch
ctx new --domain new-domain --create-domain --task my-feature-branch
```

## ctx import

Imports an existing task from any domain into your project as a symlink. This is useful when you need your agent to access domain knowledge from other projects.

**What it does:**

1. Ensures the workspace is initialized
2. Chooses the domain: `--clone-from` clones first into `~/.agents/ctxlayer/domains/<name>/` (`<name>` is `--domain` when given, otherwise the repo name from the URL); else `--domain` if given; else if you pass only `--task`, uses `active-domain` from `config.yaml` (non-interactive); otherwise prompts
3. **Clone-only:** With `--clone-from` but no `--task`, stops after the clone — nothing is added under `.ctxlayer/` and config is unchanged
4. **Import task:** Otherwise picks a task (prompt or `--task`), creates `.ctxlayer/<domain>/<task>`, and sets active when `config.yaml` has no active domain/task

**Examples:**

```bash
ctx import
ctx import --domain my-domain --task my-task
ctx import --task other-task   # same domain as in config; errors if no active domain
ctx import --clone-from https://github.com/acme/payments-context.git --domain payments-context
ctx import --clone-from https://github.com/acme/payments-context.git --task investigate-checkout-failure
ctx import --clone-from https://github.com/acme/payments-context.git --domain payments-context --task audit-tax-calculation
```

### Import a context-layer domain from git

Use `--clone-from` when the domain lives in git. **Without `--task`**, only the global domain folder is created (custom name via `--domain`, otherwise derived from the repo URL). **With `--task`**, `ctx` also links that task into the project.

```bash
ctx import --clone-from https://github.com/acme/payments-context.git --domain payments-context
ctx import --clone-from https://github.com/acme/payments-context.git --task investigate-checkout-failure
ctx import --clone-from https://github.com/acme/payments-context.git --domain payments-context --task audit-tax-calculation
```

With `--task`, if the task is missing in the cloned domain, `ctx import` exits with an error instead of creating it.

## ctx status

Shows the current active domain and task, plus git tracking information when the domain is version-controlled.

**Output:**

- Active domain and task from `config.yaml`
- If the domain directory has a `.git` folder: current branch, repo name, and remote URL
- If not synced to git: a short note drawing the user's attention to the fact that the domain is not synced to git

## ctx set

Select and set the active domain and task. Use this to switch context when working on multiple tasks, either interactively or from a script.

**What it does:**

1. Ensures workspace is initialized
2. Chooses the domain: `--clone-from` clones the repo into `~/.agents/ctxlayer/domains/<name>/` first (`<name>` is `--domain` if given, otherwise derived from the repo URL); else uses `--domain` if given; else if you pass only `--task`, uses `active-domain` from `config.yaml` (non-interactive); otherwise prompts
3. Lists tasks in that domain and prompts you to pick one unless you passed `--task` (required with `--clone-from`)
4. Writes `active-domain` and `active-task` to `config.yaml`
5. Ensures the symlink exists at `.ctxlayer/<domain>/<task>`. If it does not, creates the symlink.

**Example:**

```bash
ctx set --domain my-domain --task my-task
ctx set --task other-task   # same domain as in config; errors if no active domain
ctx set --clone-from https://github.com/acme/context-repo.git --task my-task
ctx set --clone-from https://github.com/acme/context-repo.git --domain short-name --task my-task
```

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
- With `ctx drop task --domain my-domain --task my-task`: removes the symlink without prompting
- Without a name: prompts you to select a domain, then a task, and removes the symlink for the selected task

## ctx drop domain [name]

Removes a domain directory from the project's local `.ctxlayer/`. The domain and its tasks in the context layer (`~/.agents/ctxlayer/domains/<domain>/`) are **not** deleted - only the local `.ctxlayer/<domain>/` directory is removed.

**What it does:**

- With `ctx drop domain my-domain`: removes `.ctxlayer/my-domain/` (after confirmation)
- With `ctx drop domain --domain my-domain --yes`: removes `.ctxlayer/my-domain/` without prompting
- Without a name: prompts you to select a domain from the list of domains currently imported into the project

## ctx delete task

**Permanently** deletes a task from the context layer and removes its symlink.

> **This will delete the task folder and all its contents from the user-wide context layer folder!**

**What it does:**

1. Prompts you to select a domain, or accepts `--domain`
2. Prompts you to select a task, or accepts `--task`
3. Asks for confirmation, or accepts `--yes`
4. Deletes the task directory from `~/.agents/ctxlayer/domains/<domain>/<task>/`
5. Removes the symlink at `.ctxlayer/<domain>/<task>` if it exists
6. Removes the local domain directory if it becomes empty

This cannot be undone.

**Example:**

```bash
ctx delete task --domain my-domain --task my-task --yes
```

## ctx delete domain

**Permanently** deletes a domain from the context layer and removes its local directory.

> **This will delete the domain folder and all its contents from the user-wide context layer folder!**

**What it does:**

1. Chooses the domain from the first argument (`ctx delete domain <name>`), or `--domain`, or prompts
2. Asks for confirmation, or accepts `--yes`
3. Deletes the domain from `~/.agents/ctxlayer/domains/<domain>/`
4. Removes `.ctxlayer/<domain>/` from your project

This cannot be undone. All tasks in the domain are deleted.

**Example:**

```bash
ctx delete domain my-domain --yes
ctx delete domain --domain my-domain --yes
```
