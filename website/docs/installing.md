---
layout: docs
title: Installing
---

# Installing

## CLI

From this repo:

```bash
cd /path/to/ctxlayer
npm install
npm link
```

After that, `ctx` is available globally. Edits to `bin/cli.js` take effect immediately.

### Uninstalling

```bash
npm unlink -g ctx
```

## Agent skill

The repo includes an agent skill at `skills/context-layer/SKILL.md` that teaches AI coding assistants (Cursor, Claude Code, etc.) how to use the ctx CLI and manage context.

### Local install via npx skills

Use [npx skills](https://github.com/vercel-labs/skills) to install from the local repo:

```bash
npx skills add /path/to/ctxlayer -g -a cursor --skill context-layer -y
```

This installs the skill globally for Cursor. Re-run after changes to update.

### Other agents

```bash
# Claude Code
npx skills add /path/to/ctxlayer -g -a claude-code --skill context-layer -y

# All detected agents
npx skills add /path/to/ctxlayer -g --skill context-layer -y
```
