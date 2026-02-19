---
layout: docs
title: Context Structure
---


directory, accessible from any workspace of your OS user. It exists in the form of a directory structure and logically divided into _domains_ and _tasks_.

**Domains** are context organization units. Contains some domain knowledge that may be applicable to multiple software projects. In the most general case, you will have one domain per software project. However, in more complex cases, you may have several projects united by the same purpose, in which case it is possible to use a single domain for all of them. A domain lives in a form of separate folder under `~/.agents/ctxlayer/domains/`.

Each domain also have a git repository initialized in its folder. Note that this repository is separate form the software project repository, and is used to version-control the domain knowledge and context only. If you feel the need to persist your domain knowledge, you can use the git repository to e.g. push the context to a dedicated github repo.

**Tasks** are one unit of work within a domain (like a branch). They exist in a form of separate folders, one per task, under a domain folder: `~/.agents/ctxlayer/domains/<domain>/<task>/`. Each task has `docs/` and `data/` folders for documentation and reference material.

