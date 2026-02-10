# Intelligence Layer

An **intelligence layer** used as **context for AI agents** during iterative development. It gives agents a structured place for project scope, initiatives, documentation, and reference material so they can focus and operate more precisely across iterations.

## Intention

- **Project** — One area you’re working on. It’s the planning unit and can span **one or more Git repositories**.
- **Task** — One initiative within that project. Think of a task like a **Git branch**: create a new task whenever you start a big initiative (a feature, a refactor, a research spike).
- Inside each task you get:
  - **`context/`** — All data the agent can use (reference material, repos, sample data).
  - **`docs/`** — Documentation. Whenever something meaningful is done—research, an implementation plan, or the implementation itself—that knowledge is written into the task’s `docs/` folder using the naming convention.
- In later iterations, the relevant Markdown in `docs/` and the contents of `context/` are available so the agent can narrow its focus and work more precisely.

## What it does

- Manages a global store at `~/.intelligence/projects/` where projects and tasks live.
- Each task has `docs/` and `context/` for documentation and reference material.
- A local `.intelligence/config.yaml` in your repo (or workspace) tracks the active project and task.
- An agent skill teaches AI coding assistants (Cursor, Claude Code, etc.) how to write documentation and manage context using these conventions.

## Directory layout

```
~/.intelligence/                          # global store (in home dir)
  projects/
    <project-name>/                       # one per project (can span one or more git repos)
      <task-name>/                        # one per initiative (think: branch)
        docs/                             # documentation (01-name.md, 02-name.md, ...)
        context/                          # reference material, git submodules, sample data

<your-repo>/
  .intelligence/                          # local config (gitignored)
    config.yaml                           # active-project and active-task
    <task-name> -> symlink                # symlink to the task folder in global store
```

## Installing the CLI

### From this repo (local development)

```bash
cd /path/to/intelligence-layer
npm install
npm link
```

After that, `intel` is available globally on your machine. Edits to `bin/cli.js` take effect immediately.

### Uninstalling

```bash
npm unlink -g intel
```

## CLI commands

| Command | Description |
|---|---|
| `intel` | Show help and available commands |
| `intel init` | Initialize a project (clone from git, create from scratch, or use existing) |
| `intel new` | Create a new task under the active project |
| `intel import` | Import a task from any project as a local symlink |
| `intel git [args...]` | Run git in the current task directory |
| `intel drop task [name]` | Remove a task symlink (with optional task name) |
| `intel drop project` | Remove a project directory from local `.intelligence/` |
| `intel delete task` | Delete a task from the intelligence store and remove its symlink |
| `intel delete project` | Delete a project from the intelligence store and remove its local directory |
| `intel active` | Show the current active project and task |
| `intel active project` | Select a different active project (arrow-key menu) |
| `intel active task` | Select a different active task (arrow-key menu) |

### `intel init`

Interactive menu with three choices:

1. **Fetch from git** -- paste a GitHub URL, name the project (defaults to repo name), clone it into `~/.intelligence/projects/`.
2. **Create from scratch** -- enter a project name, creates the directory and runs `git init`.
3. **Use existing project** -- pick from existing projects in `~/.intelligence/projects/`.

After any choice, local setup runs automatically:
- Creates `.intelligence/` in the current directory.
- Writes `.intelligence/config.yaml` with the active project.
- Adds `.intelligence` to `.gitignore`.

### `intel new`

Prompts for a task name, then:
- Creates `~/.intelligence/projects/<project>/<task>/` with `docs/` and `context/` subdirectories.
- Creates a symlink `.intelligence/<task>` in the local directory pointing to the task folder.
- Sets the new task as the active task in `config.yaml`.

### `intel import`

Imports a task from any project into the local `.intelligence/` directory as a symlink. Useful for referencing tasks from other projects without switching the active project.

1. Prompts to select a project (arrow-key menu listing all projects in `~/.intelligence/projects/`).
2. Prompts to select a task from that project.
3. Creates a symlink at `.intelligence/<project>/<task>` pointing to the task folder in the global store.

### `intel git [args...]`

Runs `git` with the given arguments in the current task directory. Requires an active task to be set. Example: `intel git status` runs `git status` in `~/.intelligence/projects/<project>/<task>/`.

### `intel drop task [name]`

Removes a task symlink from the local `.intelligence/` directory. Prompts to select a project, then a task (or use the optional task name with the active project). If the project directory is left empty, it is removed.

### `intel drop project`

Removes an entire project directory from the local `.intelligence/` directory. Prompts to select a project and asks for confirmation before removing.

### `intel delete task`

Permanently deletes a task from the intelligence store (`~/.intelligence/projects/`) and removes its symlink from the local directory. Prompts to select a project and task, then asks for confirmation.

### `intel delete project`

Permanently deletes a project from the intelligence store and removes its local directory from `.intelligence/`. Prompts to select a project and asks for confirmation.

### `intel active`

Prints the current active project and task, with hints on how to change them.

### `intel active project`

Arrow-key selector listing all projects. If switching to a different project that has tasks, immediately prompts for an active task. If the project has no tasks, tells you to run `intel new`.

### `intel active task`

Arrow-key selector listing all tasks in the active project.

## Config file

Located at `.intelligence/config.yaml` in your repo:

```yaml
active-project: my-project
active-task: my-task
```

## Installing the agent skill

The repo includes an agent skill at `skills/intelligence/SKILL.md` that teaches AI coding assistants (Cursor, Claude Code, Codex, etc.) how to use the intel CLI, write documentation in the correct format, and manage context.

### Local install via npx skills

Use [npx skills](https://github.com/vercel-labs/skills) to install from the local repo:

```bash
npx skills add /path/to/intelligence-layer -g -a cursor --skill intelligence -y
```

This installs the skill globally for Cursor. Re-run the same command after making changes to update.

### Install for other agents

```bash
# For Claude Code
npx skills add /path/to/intelligence-layer -g -a claude-code --skill intelligence -y

# For all detected agents
npx skills add /path/to/intelligence-layer -g --skill intelligence -y
```

### What the skill teaches the agent

1. **CLI commands** — how to use `intel init`, `intel new`, `intel active`, etc.
2. **Docs convention** — when something meaningful is done (research, plan, implementation), create numbered markdown files (`01-name.md`, `02-name.md`) in the active task’s `docs/` folder so later iterations can use that intelligence.
3. **Context convention** — reference material goes in the task’s `context/` folder (repos as git submodules). This is the data the agent uses to focus its work.

## Cursor setup tips

Optional: disable external and dot files protection for added convenience so you don't have to confirm edits each time.

1. Open Cursor Settings
2. Search for "External files protection" and "Dot files protection", disable both options

## Project structure

```
intelligence-layer/
  bin/
    cli.js                # CLI entry point (ES module)
  skills/
    intelligence/
      SKILL.md            # Agent skill definition
  package.json            # ESM package with @inquirer/prompts dependency
  .gitignore
  README.md
```

## License

Apache-2.0. See [LICENSE](LICENSE) for the full text.
