# The Context Layer for AI agents

[![CI](https://github.com/anatoliykmetyuk/ctxlayer/actions/workflows/ci.yml/badge.svg)](https://github.com/anatoliykmetyuk/ctxlayer/actions/workflows/ci.yml) [![npm](https://img.shields.io/npm/v/@anatoliikmt/ctxlayer.svg)](https://www.npmjs.com/package/@anatoliikmt/ctxlayer) [![website](https://img.shields.io/website?url=https%3A%2F%2Fctxlayer.dev&label=website)](https://ctxlayer.dev)

The human-in-the-loop context engineering and curation tool for AI-assisted development.

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
curl -fsSL https://raw.githubusercontent.com/anatoliykmetyuk/ctxlayer/main/install.sh -o /tmp/ctxlayer-install.sh && bash /tmp/ctxlayer-install.sh
```

Downloads the script first, then runs it — stdin stays connected to your terminal so the skill installer can prompt you to select your IDE. Requires Node.js/npm.

### Local development

```bash
cd /path/to/ctxlayer
./install-locally.sh
```

Or manually: `npm install` then `npm link`. After that, `ctx` is available globally. Edits to `bin/cli.js` take effect immediately.

### Uninstalling

```bash
npm unlink -g @anatoliikmt/ctxlayer
```

(If you linked when the package had a different name, use that name: `npm unlink -g ctx`.)

## License

Apache-2.0. See [LICENSE](LICENSE) for the full text.
