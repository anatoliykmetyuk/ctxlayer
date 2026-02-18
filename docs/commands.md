---
layout: docs
title: Commands
---

# Commands

## Reference

| Command | Description |
|---------|-------------|
| `ctx` | Show help and available commands |
| `ctx new [name]` | Create a new task (initializes workspace, prompts for project if needed) |
| `ctx import` | Import a task from any project as a local symlink |
| `ctx git [args...]` | Run git in the current task directory |
| `ctx drop task [name]` | Remove a task symlink (with optional task name) |
| `ctx drop project [name]` | Remove a project directory from local `.ctxlayer/` |
| `ctx delete task` | Delete a task from the context store and remove its symlink |
| `ctx delete project` | Delete a project from the context store |
| `ctx status` | Show the current active project and task |
| `ctx set` | Set active project and task (prompts to select) |

## ctx new

Creates a new task. Single entry point for getting started:

1. Ensures workspace is initialized (`.ctxlayer/`, `config.yaml`, `.gitignore`)
2. If no active project: prompts to create (fetch from git, create from scratch) or select existing
3. If active project set: asks "Use current active project [X] for new task?" (yes/no)
4. Prompts for task name (or use `ctx new [name]`), then creates task dir, symlink, and updates config

## ctx import

Imports a task from any project into the local `.ctxlayer/` directory as a symlink. Works on uninitialized workspaces.

1. Ensures workspace is initialized
2. Prompts to select a project
3. Prompts to select a task from that project
4. Creates a symlink at `.ctxlayer/<project>/<task>`
5. Sets the imported project and task as active when config was empty

## Config file

Located at `.ctxlayer/config.yaml`:

```yaml
active-project: my-project
active-task: my-task
```
