---
layout: docs
title: Overview
---

Context Layer is a tool for organizing and managing agents' context during iterative development.
It provides a structured place for documentation and reference material so agents can operate more precisely across iterations.

It comes in a form of a CLI and an agent skill, operating over a plain old directory structure. It is designed to be used with AI coding tools, such as Cursor and Claude Code.

## Motivation

AI coding tools, such as Cursor and Claude Code, treat sessions as stateless. When you open a new chat, you need to explain the architecture, intent, and conventions every time. This reduces the development speed and enjoyment of the process. Moreover, human memory is also limited, so one may need to use agent to repeat exploration of the codebase, to e.g. recall why a certain decision was made. This wastes token budget and time. All in all, statelessness wastes cognitive resources of the agent and the developer alike. See [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) by Anthropic for further reading on the topic.

A number of attempts have been made by the community to solve this. Automatic approaches, such as automatic logging of the context, usually lead to context clutter and [context rot](https://research.trychroma.com/context-rot). Manually logging documentation to markdown files is a common approach, but it is often developer- or task-specific. The context generated in such a way often does not belong to the codebase, and poses difficulies for version control.

Further, context comes in different shape, not always human-readable markdown files. Sometimes it is an external git repo, a sample dataset, a log of a failed CI, examples of well-designed websites, etc. All of those are critical for the agent to do its job well but have no place in the codebase, as they are more of a raw material than an end product.

## The Concept

The Context Layer tool is built around the principles of **simplicity** and **human-in-the-loop**. It does not make an attempt to automate your development cycle or context management. Rather than being an automation, it is a tool for a skilled developer to conveniently sculpt the context before doing the work with an agent.

Rather than trying to replace the developer with an agent or commoditize software engineering, the tool assumes **the developer to be an essential part of the development process** which brings **expertise, taste and the knowledge** of the big picture to the table, while the agent is a tool to automate mechanical work and translate intent into result. The agent is assumed to be a tool to automate mechanical work and to speed up the translation of the developer's intent into result. But it is the role of the developer to specify their intent precisely.

The tool is aimed at an **AI power-user developer** - a kind of developer who prefers to use AI to generate >80% of their code. Such a developer is expected to think at the level of concepts, architecture, intent and constraints rather than precise code statements that express that code.

Rather than expecting the developer to do less work due to AI automation, the tool assumes the developer to be doing a new kind of work, shifting their attention focus from the implementation details to the architecture and intent-shaping.

The developer is expected to exercise discipline in their context curation and management to get the most value of the tool.

## The Solution

The Context Layer exists on your machine in a form of a **directory structure that contains files and folders**. The structure is logically organized into **domains** and **tasks**. Domains are intended to track domain knowledge across one or more software projects, while tasks exist as part of a domain are are used to store the context for a specific unit of work, similarly to how you would use a branch in a git repository.

Context may be linked across projects with task-wise granularity. So, from any project you are working on, you may link a task from another domain to your project via a symlink. Link only what you need to get the job done, so you don't have to worry about cluttering your project with irrelevant context.

A CLI tool is provided to easily perform the operations above, such as creating new tasks, linking tasks from other domains, and more.

Your agent of choice (such as Cursor, Claude Code, etc.) is made aware of the context layer of your project via an [agent skill](https://github.com/anatoliykmetyuk/ctxlayer/blob/main/SKILL.md) (see the [Skills standard specification](https://github.com/anatoliykmetyuk/skills-spec)). So, whenever you mention "context layer" in your prompts, your agent will know where to look.

The intended outcome is an ever-growing corpus of domain knowledge, where every task you do is documented in a human-driven way, separately from the codebase, readily accessible during future work across projects. As a result, the developer saves time, token budget and cognitive resources, speeds up the development process, makes it more enjoyable and predictable.

If the above resonates with you, try it out on your own project:

[→ Get started](/docs/getting-started.html)