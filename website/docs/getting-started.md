---
layout: docs
title: Getting Started
---

Let's use the Context Layer tool to do an ordinary task in a new way. Think of a project you're currently working on, and some task that you need to do on it. Prepare your favorite development envirinment and start your agent.

Now let's install the Context Layer tool globally on your machine.

## Installation

Currently supports only Mac OS and Linux. Requires Node.js/npm.

{% include copyable-command.html command=site.data.commands.install %}

This command (see [source](https://github.com/anatoliykmetyuk/ctxlayer/blob/main/install.sh)) does several things:

- Installs the `ctx` CLI, so that `ctx` command becomes available. This is done via `npm install` under the hood. This command provides conveniences to manage context across projects.
- Installs the [agent skill](https://github.com/anatoliykmetyuk/ctxlayer/blob/main/SKILL.md) (see [skills standard reference](https://skills.sh/)), so that the agent can access the context layer. This is done via `npx skills add` under the hood. The command will prompt you to specify the type of agent you are using (e.g. Cursor, Claude Code, etc.) so that the skill becomes available to the agent whenever _context layer_ is mentioned in your prompts.

Uninstall command is also available to revert the changes:

{% include copyable-command.html command=site.data.commands.uninstall %}

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

Think of the task you want to do on your project. Do you have any reference data that the agent would benefit from while doing your task? Think of:

- Log files from a failed CI - in case if you want an agent to debug an issue.
- Examples of well-designed websites - in case if you want an agent to design a new UI.
- A CSV file - in case you're making a data analytics dashboard and need an agent to design the data access layer against a specific example dataset.
- A Git repository - in case you want an agent to refer to an existing library code or another project. It is recommended to use a `git submodule` when cloning the repository, as every domain is also initialized as a git repository.

All of those examples belong in the `data/` folder of your task. Now is the good time to bring them into that directory.

### 2. Perform Task Research and Documentation

After you've assembled the corpus of reference material, it is a good idea to ask your agent to do some research on the task you are about to do, and possibly plan an implementation plan. Prompt it with the following:

> I would like to do the task X in the project. You will find reference materials X, Y, Z in the context layer's data folder. Please use them to inform your research and planning. Now, please do the research and compose a plan of how to do the task. Please write the plan as a new document in the context layer's documentation section.

As you've installed the agent skill during the installation step above, the agent will know which folders to look at and will produce you the markdown file with the planning results. Markdown files in the docs folder are numbered for easy sorting, as they intend to represent a sequential log of task execution. A file with a name something like `01-task-plan.md` will be produced.

Review the plan and iterate it with your agent until it looks good for you.

### 3. Execute the Task

Now ask the agent to execute the task, using the plan as a guide:

> In the context layer, the document number 1 specifies the task plan. Please read it and execute the task according to the plan.

If you are using an agent that natively supports planning mode, such as Cursor, it is a good idea to execute the prompt in planning mode. An extra planning step never hurts when preparing an agent for work.

### 4. Log the Domain Intelligence

As your agent progresses with the task, keep your eye on the domain intelligence generated in the process:

- Friction points when an agent gets stuck or confused.
- Decision points where one path needs to be preferred over another.
- Procedural knowledge such as how to run tests or a general workflow to debug issues.

When you encounter those and successfully resolve them, ask your agent to document them in the context layer:

> We have just resolved an issue X / made a decision Y / followed a workflow Z. Please document it in the context layer as a new document.

This will produce a new document in the docs folder, numbered for easy sorting.

### 5. Reuse the Domain Intelligence

In the future, when you encounter a similar issue, you can refer to the documentation you generated in step 4 to guide the agent:

> Please resolve the issue X / do the job Y. In context layer, plesae use documents number XX, YY, and ZZ to guide your work.

### 6. Reuse Domain Intelligence across projects

The context layer is stored in a centralized location at your home directory and is linked to projects via symlinks. If you are working on a different project in the future, or a different task, you may import the tasks from other domains into your project:

```bash
ctx import
```

You will be prompted to select the domain and task to import.

You can specify which task you are currently working on so that the agent knows which task to access by default:

```bash
ctx set
```

The following command will show you the current active domain and task:

```bash
ctx status
```

You can always ask the agent to access a task other than default by specifying it explicitly in the prompt:

> "in the context layer, domain A, task B, the document number 1 specifies initial research findings. Please read it and ...".

### 7. Version Manage your Context Layer

Every domain is initialized as a git repository. You can `cd` into it and use git operations just like you would do with any other git repository. You can save your context layer per domain in separate github repositories.

Convenience commands are available from the project to work with the context layer so that you do not have to `cd` into it every time:

```bash
ctx git <git-args...>
```

The above command is equivalent to:

```bash
cd ./ctxlayer/<domain>/<task>
git <git-args...>
```

## Further Reading

To learn more about the project capabilities, refer to the specifications:

- [Command Reference](/docs/commands.html)
- [Prompting Guide](/docs/prompting-guide.html)
- [Context Directory Structure](/docs/context-structure.html)