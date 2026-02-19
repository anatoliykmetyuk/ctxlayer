---
layout: docs
title: Overview
---

Context Layer is a **context layer** used as **context for AI agents** during iterative development. It gives agents a
structured place for documentation and reference material so they can focus and operate more precisely across iterations.

It comes in a form of a CLI and an agent skill, operating over a plain old directory structure.

## Motivation

AI coding tools, such as Cursor and Claude Code, treat sessions as stateless. When you open a new chat, you need to explain the architecture, intent, and conventions every time. Context Layer stores project context in the format of plain folders and files, curated by the developer, so it can be reused across tools and sessions.

## What it does

- **Stores structured context** at `~/.agents/ctxlayer/domains/` (outside the codebase).
- **Provides a CLI** to manage the context: link it to existing projects via symlinks, create new tasks, and more.
- **Provides an Agent Skill** so Cursor/Claude Code can read and write context.

## Conceptual Model

The Context Layer is organized into _domains_ and _tasks_.

- **Domain** — Context organization unit. Contains some domain knowledge that may be applicable to multiple repos. Is represented by a folder in `~/.agents/ctxlayer/domains/`.
- **Task** — One unit of work within a domain (like a branch). Is represented by a folder in `~/.agents/ctxlayer/domains/

Each task has `docs/` and `data/` for documentation and reference material.
The active domain and task are tracked in `.ctxlayer/config.yaml` in your repo. When prompted to interact with the context layer, the agent skill will default to the active domain and task.

<domain>/<task>/`. Each task has `docs/` and `data/` for documentation and reference material.
- **Context store** — `~/.agents/ctxlayer/domains/`; holds domains and tasks.
- **Human-in-the-loop** — Context is curated by the developer, not auto-generated.
- **Agent skill** — Teaches Cursor/Claude Code how to use `ctx` and the docs convention. Is installed as a skill in `~/.agents/skills/ctxlayer/`.

## When to use

- Repetitive AI-assisted workflows across sessions
- Projects where architectural context matters
- Multi-session work where you need to persist decisions and research across sessions

[Next: Getting Started](getting-started.html)


## Core concepts


## Usage

This page provides a quick overview of the usage. For a full documentation, see the [Docs](https://ctxlayer.dev/docs).

```bash
ctx new
```

The above command will prompt you to create a new domain folder and a task folder within it. It will do several things:

- Create the new task folder in the `~/.agents/ctxlayer/domains/<domain>/<task>/` directory.
- Create the `docs/` and `data/` folders within the task folder.
- Link the task folder to the current working directory as a symlink under `.ctxlayer/`, so it is accessible to the agent skill.
- Update `.gitignore` to ignore `.ctxlayer/`.
- Initialize a separate domain repo under `~/.agents/ctxlayer/domains/<domain>/`, so the domain is version-controlled.

### Reference Material Curation

You can put any reference material needed for the task execution in the `data/` folder. These may be, for example:

- Log files from a failed CI - in case if you want an agent to debug an issue.
- Examples of well-designed websites - in case if you want an agent to design a new UI.
- A CSV file - in case you're making a dashboard for a data analysis and need an agent to design the data access layer against a specific example dataset.
- A Git repository - in case you want an agent to refer to an existing library code or another project. It is recommended to use a `git submodule` when cloning the repository, as every domain is also initialized as a git repository.

The agent may later access the reference material from an agent session using e.g. the following prompt:

> "in the context layer, the reference material folder contains an example dataset. Please read it and ...".

### Documentation Curation

The `docs/` folder is intended to be an ongoing journal of the task execution. It is intended to be written by the agent itself, but the write is not automatic and must be triggered by the developer. It is expected that the developer will review the documentation and work with the agent to get it to a high quality standard.

The documentation is written in Markdown and is numbered for easy sorting, for example:

```bash
# In the docs/ folder
01-initial-research.md
02-feature-implementation.md
03-architecture-diagram.md
```

With the installed skill, use the prompt as follows to write documentation:

> "in the context layer, write a document about what you just did. The documentation must include information on X, Y and Z."

You will later be able to access the documentation from an agent session using e.g. the following prompt:

> "in the context layer, the document number 1 specifies initial research findings. Please read it and ...".

### Other Capabilities

Please refer to the [Docs](https://ctxlayer.dev/docs) for the full documentation. The following are some other capabilities that are not covered here:

- Importing (linking) context from other domains.
- Git operations on the context layer.
- Deleting domains and tasks.
- Switching the active domain and task.
- Importing tasks from other domains.

## Contributing

This project is open for contributions. Suggested areas: CLI improvements, agent skill enhancements, context import/export utilities, documentation conventions. See [DEVELOPMENT.md](DEVELOPMENT.md) for local setup.

## License

Apache-2.0. See [LICENSE](LICENSE) for the full text.
