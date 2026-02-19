---
layout: docs
title: Prompting Guide
---

This guide explains how to phrase prompts so your agent uses the context layer correctly. The [agent skill](https://github.com/anatoliykmetyuk/ctxlayer/blob/main/skills/ctxlayer/SKILL.md) activates when you mention _"context layer"_, _"in the context layer"_, _"in the context"_.

## Triggering the skill

Mention the context layer in your prompt. Phrases that work:

- _"in the context layer"_
- _"using context layer"_
- _"in the context"_
- _"to the context layer"_
- _"into the context layer"_

When the agent sees these, it reads `.ctxlayer/config.yaml` for the active domain and task, will refer to the `~/.agents/ctxlayer/domains/<domain>/<task>/` directory to find the requested information.

## Reading documents

Documents in the `docs/` folder are numbered (`01-...`, `02-...`, etc.). Reference them by number:

- _"In the context layer, read document number 1"_
- _"As discussed in document 3 in the context layer, please implement..."_
- _"The context layer document 2 contains the implementation plan. Please follow it."_

The intention behind numbering is to allow for sorting by name and displaying the documents in a chronological order, as well as easily referencing the documents by number.

## Writing documents

Ask the agent to document something _"in the context layer"_ or _"to the context layer"_:

- _"Document the bug fix procedures you just followed to the context layer"_
- _"Please write the research findings into the context layer as a new document"_
- _"We resolved issue X. Please document it in the context layer"_

The agent creates a new numbered markdown file in the active task's `docs/` folder and writes the content.

## Using the data folder

Reference material lives in the task's `data/` folder. Point the agent at it:

- _"You will find reference materials X, Y, Z in the context layer's data folder. Please use them to inform your research"_
- _"In the context layer, read the log files in the data folder and prepare a report on the failures"_
- _"The context layer's data folder has sample-data.json. Use it to design the data access layer"_

## Specifying domain and task

By default, the agent uses the **active** domain and task from `config.yaml`. To use a different task, say so explicitly:

- _"In the context layer, domain my-other-domain, task my-other-task, document 1 specifies the research. Please read it and..."_
- _"In context layer, domain A, task B, use documents 1 and 2 to guide your work"_

Use `ctx set` to change the active task, or refer to domain and task by name in the prompt.

## Example prompts

**Research and planning:**

> I would like to do task X. You will find reference materials in the context layer's data folder. Please use them to research and compose a plan. Write the plan as a new document in the context layer's documentation section.

**Execute from a plan:**

> In the context layer, document number 1 specifies the task plan. Please read it and execute the task according to the plan.

**Log a decision or procedure:**

> We just resolved issue X / made decision Y / followed workflow Z. Please document it in the context layer as a new document.

**Reuse documentation:**

> Please resolve issue X. In the context layer, use documents 2, 3, and 5 to guide your work.

**Read data and write a report:**

> In the context layer, read the log files in the data folder, prepare a report on the failures, and write it into the context layer as a new file.

## Git operations

When you want to run git on the context layer (domain repo), ask the agent to use `ctx git`:

- _"Run `ctx git status`"_
- _"In the context layer, commit the changes and push"_

The agent should run `ctx git <args>` rather than `cd` into the folder and running `git` directly.

## Adding repositories to data

To add an external repo as reference material, ask to _"add a repository to the context layer"_ or _"clone a repo as context layer context"_. The agent will use `git submodule add` in the task's `data/` folder, not a plain `git clone`, so the domain repo stays version-controlled via submodule references.
