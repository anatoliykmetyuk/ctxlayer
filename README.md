# CtxLayer - the Context Layer for AI agents

A **context layer** used as **context for AI agents** during iterative development. It gives agents a structured place for documentation and reference material so they can focus and operate more precisely across iterations.

## Intention

- **Project** - Context organization unit. A project can span one or more Git repositories.
- **Task** - One task within that project. Think of a task like a Git branch: create a new task whenever you start a feature, refactor, or research spike.
- Inside each task you get:
  - **`context/`** - All data the agent can use (reference material, repos, sample data).
  - **`docs/`** - Documentation. Whenever something meaningful is done - research, an implementation plan, or the implementation itself - that knowledge is written into the task's `docs/` folder using the naming convention.
- In later iterations, the relevant Markdown in `docs/` and the contents of `context/` are available so the agent can narrow its focus and work more precisely.

## What it does

- Manages a global store at `~/.agents/ctxlayer/projects/` where projects and tasks live.
- Each task has `docs/` and `context/` for documentation and reference material.
- A local `.ctxlayer/config.yaml` in your repo (or workspace) tracks the active project and task.
- An agent skill teaches AI coding assistants (Cursor, Claude Code, etc.) how to write documentation and manage context using these conventions.

## Directory layout

```
~/.agents/ctxlayer/                              # global store (in home dir)
  projects/
    <project-name>/                       # one per project (can span one or more git repos)
      <task-name>/                        # one per task (think: branch)
        docs/                             # documentation (01-name.md, 02-name.md, ...)
        context/                          # reference material, git submodules, sample data

<your-repo>/
  .ctxlayer/                              # local config (gitignored)
    config.yaml                           # active-project and active-task
    <task-name> -> symlink                # symlink to the task folder in global store
```

## Installing the CLI

### From this repo (local development)

```bash
cd /path/to/context-layer
npm install
npm link
```

After that, `ctx` is available globally on your machine. Edits to `bin/cli.js` take effect immediately.

### Uninstalling

```bash
npm unlink -g ctx
```

## CLI commands

| Command | Description |
|---|---|
| `ctx` | Show help and available commands |
| `ctx set active` | Select or create project, then select or create task |
| `ctx new [name]` | Create a new task under the active project |
| `ctx import` | Import a task from any project as a local symlink |
| `ctx git [args...]` | Run git in the current task directory |
| `ctx drop task [name]` | Remove a task symlink (with optional task name) |
| `ctx drop project` | Remove a project directory from local `.ctxlayer/` |
| `ctx delete task` | Delete a task from the context store and remove its symlink |
| `ctx delete project` | Delete a project from the context store and remove its local directory |
| `ctx active` | Show the current active project and task |

### `ctx set active`

Prompts for project first (choose "+ Fetch from git", "+ Create from scratch", or an existing project), then for task. If the project has no tasks yet, prompts to create one inline.

- Creates `.ctxlayer/` in the current directory when needed.
- Writes `.ctxlayer/config.yaml` with the active project and task.
- Adds `.ctxlayer` to `.gitignore` when initializing.

### `ctx new`

Prompts for a task name (or use `ctx new [name]`), then:
- Creates `~/.agents/ctxlayer/projects/<project>/<task>/` with `docs/` and `context/` subdirectories.
- Creates a symlink `.ctxlayer/<project>/<task>` in the local directory pointing to the task folder.
- Sets the new task as the active task in `config.yaml`.

If no config exists or the active project is invalid, prompts to select or create a project first.

### `ctx import`

Imports a task from any project into the local `.ctxlayer/` directory as a symlink. Useful for referencing tasks from other projects without switching the active project.

1. Prompts to select a project (arrow-key menu listing all projects in `~/.agents/ctxlayer/projects/`).
2. Prompts to select a task from that project.
3. Creates a symlink at `.ctxlayer/<project>/<task>` pointing to the task folder in the global store.

### `ctx git [args...]`

Runs `git` with the given arguments in the current task directory. Requires an active task to be set. Example: `ctx git status` runs `git status` in `~/.agents/ctxlayer/projects/<project>/<task>/`.

### `ctx drop task [name]`

Removes a task symlink from the local `.ctxlayer/` directory. Prompts to select a project, then a task (or use the optional task name with the active project). If the project directory is left empty, it is removed.

### `ctx drop project`

Removes an entire project directory from the local `.ctxlayer/` directory. Prompts to select a project and asks for confirmation before removing.

### `ctx delete task`

Permanently deletes a task from the context store (`~/.agents/ctxlayer/projects/`) and removes its symlink from the local directory. Prompts to select a project and task, then asks for confirmation.

### `ctx delete project`

Permanently deletes a project from the context store and removes its local directory from `.ctxlayer/`. Prompts to select a project and asks for confirmation.

### `ctx active`

Prints the current active project and task. Run `ctx set active` to change them.

## Config file

Located at `.ctxlayer/config.yaml` in your repo:

```yaml
active-project: my-project
active-task: my-task
```

## Installing the agent skill

The repo includes an agent skill at `skills/context-layer/SKILL.md` that teaches AI coding assistants (Cursor, Claude Code, Codex, etc.) how to use the ctx CLI, write documentation in the correct format, and manage context.

### Local install via npx skills

Use [npx skills](https://github.com/vercel-labs/skills) to install from the local repo:

```bash
npx skills add /path/to/context-layer -g -a cursor --skill context-layer -y
```

This installs the skill globally for Cursor. Re-run the same command after making changes to update.

### Install for other agents

```bash
# For Claude Code
npx skills add /path/to/context-layer -g -a claude-code --skill context-layer -y

# For all detected agents
npx skills add /path/to/context-layer -g --skill context-layer -y
```

### What the skill teaches the agent

1. **CLI commands** - how to use `ctx set active`, `ctx new`, `ctx active`, etc.
2. **Docs convention** - when something meaningful is done (research, plan, implementation), create numbered markdown files (`01-name.md`, `02-name.md`) in the active task's `docs/` folder so later iterations can use that documentation.
3. **Context convention** - reference material goes in the task's `context/` folder (repos as git submodules). This is the data the agent uses to focus its work.

## Cursor setup tips

Optional: disable external and dot files protection for added convenience so you don't have to confirm edits each time.

1. Open Cursor Settings
2. Search for "External files protection" and "Dot files protection", disable both options

## Project structure

```
context-layer/
  bin/
    cli.js                # CLI entry point (ES module)
  skills/
    context-layer/
      SKILL.md            # Agent skill definition
  package.json            # ESM package with @inquirer/prompts dependency
  .gitignore
  README.md
```

## License

Apache-2.0. See [LICENSE](LICENSE) for the full text.
