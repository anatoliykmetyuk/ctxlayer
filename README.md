# CtxLayer - the Context Layer for AI agents

A **context layer** used as **context for AI agents** during iterative development. It gives agents a structured place for documentation and reference material so they can focus and operate more precisely across iterations.

## Intention

- **Domain** - Context organization unit. A domain can span one or more Git repositories.
- **Task** - One task within that domain. Think of a task like a Git branch: create a new task whenever you start a feature, refactor, or research spike.
- Inside each task you get:
  - **`data/`** - All data the agent can use (reference material, repos, sample data).
  - **`docs/`** - Documentation. Whenever something meaningful is done - research, an implementation plan, or the implementation itself - that knowledge is written into the task's `docs/` folder using the naming convention.
- In later iterations, the relevant Markdown in `docs/` and the contents of `data/` are available so the agent can narrow its focus and work more precisely.

## What it does

- Manages a global store at `~/.agents/ctxlayer/domains/` where domains and tasks live.
- Each task has `docs/` and `data/` for documentation and reference material.
- A local `.ctxlayer/config.yaml` in your repo (or workspace) tracks the active domain and task.
- An agent skill teaches AI coding assistants (Cursor, Claude Code, etc.) how to write documentation and manage context using these conventions.

## Directory layout

```
~/.agents/ctxlayer/                              # global store (in home dir)
  domains/
    <domain-name>/                       # one per domain (can span one or more git repos)
      <task-name>/                        # one per task (think: branch)
        docs/                             # documentation (01-name.md, 02-name.md, ...)
        data/                             # reference material, git submodules, sample data

<your-repo>/
  .ctxlayer/                              # local config (gitignored)
    config.yaml                           # active-domain and active-task
    <task-name> -> symlink                # symlink to the task folder in global store
```

## Installing

One command installs the CLI (from npm) and the agent skill (from GitHub):

```bash
curl -fsSL https://raw.githubusercontent.com/anatoliykmetyuk/ctxlayer/main/install.sh | bash
```

Requires Node.js/npm. The script will prompt you to select your IDE when installing the skill.

### Local development

```bash
cd /path/to/ctxlayer
./install-cli-locally.sh
```

Or manually: `npm install` then `npm link`. After that, `ctx` is available globally. Edits to `bin/cli.js` take effect immediately.

### Uninstalling

```bash
npm unlink -g @anatoliikmt/ctxlayer
```

(If you linked when the package had a different name, use that name: `npm unlink -g ctx`.)

## CLI commands

| Command | Description |
|---|---|
| `ctx` | Show help and available commands |
| `ctx new [name]` | Create a new task (initializes workspace, prompts for domain if needed) |
| `ctx import` | Import a task from any domain as a local symlink |
| `ctx git [args...]` | Run git in the current task directory |
| `ctx drop task [name]` | Remove a task symlink (with optional task name) |
| `ctx drop domain [name]` | Remove a domain directory from local `.ctxlayer/` (optional domain name) |
| `ctx delete task` | Delete a task from the context store and remove its symlink |
| `ctx delete domain` | Delete a domain from the context store and remove its local directory |
| `ctx status` | Show the current active domain and task |
| `ctx set` | Set active domain and task (prompts to select) |

### `ctx new`

Creates a new task. Single entry point for getting started:

1. Ensures workspace is initialized (`.ctxlayer/`, `config.yaml`, `.gitignore`)
2. If no active domain: prompts to create (fetch from git, create from scratch) or select existing
3. If active domain set: asks "Use current active domain [X] for new task?" (yes/no); if no, goes to domain prompt
4. Prompts for task name (or use `ctx new [name]`), then creates task dir, symlink, and updates config.

### `ctx import`

Imports a task from any project into the local `.ctxlayer/` directory as a symlink. Works on uninitialized workspaces (no `.ctxlayer/` or no `config.yaml`): it initializes the workspace and sets the imported project and task as active. When config already has a valid active project and task, only creates the symlink without changing active.

1. Ensures workspace is initialized (creates `.ctxlayer/`, `config.yaml`, `.gitignore` if missing).
2. Prompts to select a domain (arrow-key menu listing all domains in `~/.agents/ctxlayer/domains/`).
3. Prompts to select a task from that domain.
4. Creates a symlink at `.ctxlayer/<domain>/<task>` pointing to the task folder in the global store.
5. Sets the imported domain and task as active in config when active was empty or missing.

### `ctx git [args...]`

Runs `git` with the given arguments in the current task directory. Requires an active task to be set. Example: `ctx git status` runs `git status` in `~/.agents/ctxlayer/domains/<domain>/<task>/`.

### `ctx drop task [name]`

Removes a task symlink from the local `.ctxlayer/` directory. Prompts to select a domain, then a task (or use the optional task name with the active domain). If the domain directory is left empty, it is removed.

### `ctx drop project [name]`

Removes an entire domain directory from the local `.ctxlayer/` directory. Pass an optional domain name to drop it directly; otherwise prompts to select a domain. Asks for confirmation before removing.

### `ctx delete task`

Permanently deletes a task from the context store (`~/.agents/ctxlayer/domains/`) and removes its symlink from the local directory. Prompts to select a domain and task, then asks for confirmation.

### `ctx delete project`

Permanently deletes a domain from the context store and removes its local directory from `.ctxlayer/`. Prompts to select a domain and asks for confirmation.

### `ctx status`

Prints the current active domain and task. Run `ctx set` to change the active domain and task.

### `ctx set`

Prompts to select a domain and a task from the global store, then sets them as active in `.ctxlayer/config.yaml`.

## Config file

Located at `.ctxlayer/config.yaml` in your repo:

```yaml
active-domain: my-domain
active-task: my-task
```

## Agent skill

The one-liner installer above installs both the CLI and the skill. The skill lives at `skills/ctxlayer/SKILL.md` and teaches AI coding assistants (Cursor, Claude Code, etc.) how to use the ctx CLI and manage context.

For local development, use `install-skill-locally.sh` or:

```bash
npx skills add /path/to/ctxlayer -g -a cursor --skill ctxlayer -y
```

### What the skill teaches the agent

1. **CLI commands** - how to use `ctx new`, `ctx status`, `ctx set`, etc.
2. **Docs convention** - when something meaningful is done (research, plan, implementation), create numbered markdown files (`01-name.md`, `02-name.md`) in the active task's `docs/` folder so later iterations can use that documentation.
3. **Data convention** - reference material goes in the task's `data/` folder (repos as git submodules). This is the data the agent uses to focus its work.

## Cursor setup tips

Optional: disable external and dot files protection for added convenience so you don't have to confirm edits each time.

1. Open Cursor Settings
2. Search for "External files protection" and "Dot files protection", disable both options

## Project structure

```
ctxlayer/
  bin/
    cli.js                # CLI entry point (ES module)
  skills/
    ctxlayer/
      SKILL.md            # Agent skill definition
  install.sh              # One-liner installer script
  package.json
  .gitignore
  README.md
```

## License

Apache-2.0. See [LICENSE](LICENSE) for the full text.
