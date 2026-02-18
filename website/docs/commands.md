---
layout: docs
title: Commands
---

# Commands

## Reference

| Command | Description |
|---------|-------------|
| `ctx` | Show help and available commands |
| `ctx new [name]` | Create a new task (initializes workspace, prompts for domain if needed) |
| `ctx import` | Import a task from any domain as a local symlink |
| `ctx git [args...]` | Run git in the current task directory |
| `ctx drop task [name]` | Remove a task symlink (with optional task name) |
| `ctx drop domain [name]` | Remove a domain directory from local `.ctxlayer/` |
| `ctx delete task` | Delete a task from the context store and remove its symlink |
| `ctx delete domain` | Delete a domain from the context store |
| `ctx status` | Show the current active domain and task |
| `ctx set` | Set active domain and task (prompts to select) |

## ctx new

Creates a new task. Single entry point for getting started:

1. Ensures workspace is initialized (`.ctxlayer/`, `config.yaml`, `.gitignore`)
2. If no active domain: prompts to create (fetch from git, create from scratch) or select existing
3. If active domain set: asks "Use current active domain [X] for new task?" (yes/no)
4. Prompts for task name (or use `ctx new [name]`), then creates task dir, symlink, and updates config

## ctx import

Imports a task from any domain into the local `.ctxlayer/` directory as a symlink. Works on uninitialized workspaces.

1. Ensures workspace is initialized
2. Prompts to select a domain
3. Prompts to select a task from that domain
4. Creates a symlink at `.ctxlayer/<domain>/<task>`
5. Sets the imported domain and task as active when config was empty

## Config file

Located at `.ctxlayer/config.yaml`:

```yaml
active-domain: my-domain
active-task: my-task
```
