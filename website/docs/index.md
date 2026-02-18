---
layout: docs
title: Overview
---

# Overview

Context Layer is a **context layer** used as **context for AI agents** during iterative development. It gives agents a structured place for documentation and reference material so they can focus and operate more precisely across iterations.

## What it does

- Manages a global store at `~/.agents/ctxlayer/domains/` where domains and tasks live
- Each task has `docs/` and `data/` for documentation and reference material
- A local `.ctxlayer/config.yaml` in your repo tracks the active domain and task
- An agent skill teaches AI coding assistants (Cursor, Claude Code, etc.) how to write documentation and manage context using these conventions

## Intention

- **Domain** — Context organization unit. A domain can span one or more Git repositories.
- **Task** — One task within that domain. Think of a task like a Git branch: create a new task whenever you start a feature, refactor, or research spike.
- Inside each task you get:
  - **`data/`** — All data the agent can use (reference material, repos, sample data)
  - **`docs/`** — Documentation. Whenever something meaningful is done—research, an implementation plan, or the implementation itself—that knowledge is written into the task's `docs/` folder using the naming convention
- In later iterations, the relevant Markdown in `docs/` and the contents of `data/` are available so the agent can narrow its focus and work more precisely.

## Quick links

- **[How it works](how-it-works.html)** — Directory structure, principles, and mechanics
- **[Commands](commands.html)** — CLI command reference
- **[Installing](installing.html)** — How to install the CLI and agent skill
