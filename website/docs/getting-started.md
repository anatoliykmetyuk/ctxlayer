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

## Usage

From the repo of your project, run the following command:

```bash
ctx new
```

You will be prompted to select or create a domain and a task.

- __Domain__ represents a corpus of knowledge about the project you are working on. For a simple project, you can name it something like `<project-name>` or `<project-name>-ctx`.
- __Task__ represents a unit of work within the project.



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
