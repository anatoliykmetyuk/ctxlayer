---
layout: docs
title: How it works
---

# How it works

This page explains the mechanics of Context Layer in detail.

## Directory structure

Your project directory looks like this with the context layer:

```
my-project/
├── README.md
├── ...  # your project files
└── .ctxlayer/  # symlink to ~/.agents/ctxlayer/
    └── my-domain/
        ├── config.yaml
        ├── task-1/
        │   ├── docs/
        │   │   ├── 01-initial-research.md
        │   │   └── 02-implementation-notes.md
        │   └── data/
        │       └── sample-data.json
        └── task-2/
            ├── docs/
            └── data/
```

## Principles

1. **Context** lives in a separate **folder** on your machine.

2. This folder is located at `~/.agents/ctxlayer` in your user's **home directory** and linked in your project as a **symbolic link** under the name `.ctxlayer`.

3. The **context layer** directory contains context that is logically divided into **domains**, and further divided into **tasks**.

4. Whenever you need to start working on a **new task**, you create a **new folder** for that task with `ctx new`. A **task folder** contains **documentation** and **data**.

5. The **data** can be anything—Git repositories, text files, logs, etc.

6. The **documentation** can be markdown files that document task execution, decision points, or other domain-specific knowledge. **Markdown files** are **numbered** for easy sorting.

7. You can easily **link** said **context** from other projects into the current one with `ctx import`.

8. You can refer to the **active task** from your agent by saying "in the context layer, …"—e.g. "in the context layer, read document number one". Change the active task via `ctx set`. This is powered by an [agent skill](https://agentskill.sh).

9. The **context layer** is not stored in the repo of the project, but if you wish so, you can persist it in a separate **GitHub repo** since it is just a **directory structure**.

## Example prompts

Here are some examples of how to refer to the context layer in your prompts:

- *As was previously discussed in document 5 **in the context layer**, please implement the discussed solution to the problem.*
- *Document the bug fix procedures that you have just followed **to the context layer**.*
- ***In the context layer**, please read the log files that are present there and prepare a report on the discovered failures and write it **into the context layer** as a new file.*
