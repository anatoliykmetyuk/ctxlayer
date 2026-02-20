---
layout: docs
title: Getting Started
---

Let's use the Context Layer tool to do an ordinary task in a new way. Think of a project you're currently working on, and some task that you need to do on it. Prepare your favorite development environment and start your agent.

Now let's install the Context Layer tool on your machine.

## Installation

Currently supports only Mac OS and Linux. Requires Node.js/npm.

{% include copyable-command.html command=site.data.commands.install %}

<details markdown="1">
<summary>What does this command do?</summary>

This command (see [source](https://github.com/anatoliykmetyuk/ctxlayer/blob/main/install.sh)) does several things:

- Installs the `ctx` CLI, so that `ctx` command becomes available. This is done via `npm install` under the hood. This command provides conveniences to manage context across projects.
- Installs the [agent skill](https://github.com/anatoliykmetyuk/ctxlayer/blob/main/skills/ctxlayer/SKILL.md) (see [skills standard reference](https://skills.sh/)), so that the agent can access the context layer. This is done via `npx skills add` under the hood. The command will prompt you to specify the type of agent you are using (e.g. Cursor, Claude Code, etc.) so that the skill becomes available to the agent whenever _context layer_ is mentioned in your prompts.

Uninstall command is also available to revert the changes:

{% include copyable-command.html command=site.data.commands.uninstall %}

</details>

## Initialization

From the repo of your project, run the following command:

```bash
ctx new
```

You will be prompted to select or create a domain and a task.

- __Domain__ represents a corpus of knowledge about the project you are working on. For a simple project, you can name it something like `<project-name>` or `<project-name>-ctx`.
- __Task__ represents a unit of work within the project.

After you've named your domain and task, you will notice the following directory structure created within your project directory:

```bash
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

Also, `.ctxlayer` will be added to your `.gitignore` file, so that the context layer is not committed to your project repository.

## Usage

### 1. Add Reference Material

Think of the task you want to do on your project. Do you have any reference data that the agent would benefit from while doing your task? This could be:

- **Log files** from a failed CI - in case you want an agent to debug an issue.
- **Examples** of well-designed websites - in case you want an agent to design a new UI.
- **A CSV file** - in case you're making a data analytics dashboard and need an agent to design the data access layer against a specific example dataset.
- **A Git repository** - in case you want an agent to refer to existing library code or another project. It is recommended to use the `git submodule add` command when cloning the repository, as every domain is also initialized as a git repository.

All of those examples belong in the `data/` folder of your task. Now is a good time to bring them into that directory.

### 2. Perform Task Research and Documentation

After you've assembled the corpus of reference material, it is a good idea to ask your agent to do some **research** on the task you are about to do, and possibly compose an **implementation plan**. Prompt it with the following:

> I would like to do A. You will find reference materials X, Y, Z in the context layer's data folder. Please use them to inform your research and planning. Do the research and compose a plan of how to do the task. Write the plan as a new document in the context layer's docs folder.

As you've installed the agent skill during the installation step above, the agent will know which folders to look at and will produce a markdown file with the implementation plan. Markdown files in the docs folder are numbered for easy sorting, as they intend to represent a sequential log of task execution. A file with a name something like `01-task-plan.md` will be produced.

Review the plan and iterate on it with your agent until it looks good to you.

### 3. Execute the Task

Now ask the agent to execute the task, using the plan as a guide:

> In the context layer, the document number 1 specifies the task plan. Please read it and execute the task according to the plan.

If you are using an agent that natively supports **planning mode**, such as Cursor, it is a good idea to execute the prompt in planning mode. An extra planning step never hurts when preparing an agent for work.

### 4. Log the Domain Intelligence

As your agent progresses with the task, keep an eye on the **domain intelligence** generated in the process:

- **Friction points** when an agent gets stuck or confused.
- **Decision points** where one path needs to be preferred over another.
- **Procedural knowledge** such as how to run tests or a general workflow to debug issues.

When you encounter those and get your agent to successfully resolve them, ask it to document them in the context layer:

> We have just resolved an issue X / made a decision Y / followed a workflow Z. Please document it in the context layer as a new document. Include a brief description of the issue, what decisions were made, what approaches worked and what did not and why.

This will produce a new document in the docs folder, numbered for easy sorting, readily accessible in case you need to return to the gathered domain intelligence in the future.

### 5. Reuse the Domain Intelligence

In the future, when you encounter a similar issue or need the information otherwise, you can refer to the documentation you generated in the previous step to guide the agent:

> Please resolve the issue X / do the job Y. In the context layer, please use the documentation of previous similar cases, docs numbers XX, YY, and ZZ, to guide your work.

### 6. Reuse Domain Intelligence across projects

The context layer is stored in a centralized location at your home directory (see [Context Directory Structure](/docs/context-structure.html) for details) and is linked to projects via **symlinks**. If you are working on a different project or task in the future, you may **import the tasks** from other domains into your project:

```bash
ctx import
```

You will be prompted to select the domain and task to import.

After you've imported the task, you may end up with more than one task in your project. You can specify which task you are currently working on - **the active task** - so that the agent knows which task to access by default:

```bash
ctx set
ctx status
```


You can always ask the agent to **access a task other than the active task** by specifying it explicitly in the prompt:

> "in the context layer, domain A, task B, the document number 1 specifies initial research findings. Please read it and ...".

### 7. Version Manage your Context Layer

**Every domain is initialized as a git repository**. You can `cd` into it and use git operations just like you would do with any other git repository. You can save your context layer per domain in separate GitHub repositories.

**Convenience commands** are available from the project's root directory to work with the context layer so that you do not have to `cd` into it every time:

```bash
ctx git <git-args...>
```

The above command is equivalent to:

```bash
cd ./.ctxlayer/<domain>/<task>
git <git-args...>
```

## Further Reading

To learn more about the project capabilities, refer to the specifications:

- [Command Reference](/docs/commands.html)
- [Directory Format Reference](/docs/format-reference.html)
- [Prompting Guide](/docs/prompting-guide.html)