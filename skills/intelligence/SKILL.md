---
name: intelligence
description: Manages intelligence projects, tasks, and documentation via the intel CLI. Use when the user mentions intel commands, intelligence projects or tasks, or requests you to write any form of documentation -- such as documenting implemented features, research findings, or drawing diagrams. Also use when the user asks to clone a repo as intelligence context.
---

# Intelligence

## Intel CLI commands

The `intel` CLI manages projects and tasks. Available commands:

- `intel init` -- Initialize a project (clone from git, create from scratch, or use existing).
- `intel new` -- Create a new task under the active project.
- `intel active` -- Show the current active project and task.
- `intel active project` -- Select a different active project.
- `intel active task` -- Select a different active task.

Configuration lives at `.intelligence/config.yaml` in the current working directory with two fields:

```yaml
active-project: <project-name>
active-task: <task-name>
```

Projects are stored globally at `~/.intelligence/projects/`. Each project contains task folders, and each task folder has `docs/` and `context/` subdirectories.

## Docs folder convention

When the user asks to document something -- implemented features, research findings, search results, architecture decisions, diagrams, or any other form of documentation -- follow these steps:

1. Read `.intelligence/config.yaml` to get `active-project` and `active-task`.
2. Navigate to `~/.intelligence/projects/<active-project>/<active-task>/docs/`.
3. Create a new markdown file using this naming convention:
   - **Prefix:** two-digit incrementing number based on existing files in the folder (`01`, `02`, `03`, ...).
   - **Separator:** a single dash.
   - **Name:** descriptive kebab-case summary of the content.
   - **Extension:** `.md`.
   - Examples: `01-initial-research.md`, `02-feature-implementation.md`, `03-architecture-diagram.md`.
4. Write the content the user requested, in the format they requested.

Each file is a standalone document covering one topic. The docs folder serves as a running report and journal for the task.

## Context folder convention

The context folder at `~/.intelligence/projects/<active-project>/<active-task>/context/` holds reference material for the task: sample data, configuration snippets, external repositories, and anything else useful as a reference during implementation.

### Cloning repos as intelligence context

When the user asks to "clone a repo as intelligence" or to add a repository to the intelligence context, do **NOT** run a regular `git clone`. Instead:

1. Navigate to the task's `context/` folder.
2. Run `git submodule add <repo-url>` to add the repository as a git submodule.
3. Run `git submodule update --init` to initialize and fetch it.

This keeps the context folder lightweight and version-controlled via submodule references rather than full repository copies.
