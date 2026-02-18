---
layout: docs
title: Installing
---

# Installing

## One-liner

Installs the CLI (from npm) and the agent skill (from GitHub):

```bash
curl -fsSL https://raw.githubusercontent.com/anatoliykmetyuk/ctxlayer/main/install.sh | bash
```

Requires Node.js/npm. The script will prompt you to select your IDE when installing the skill.

## CLI only

From npm:

```bash
npm install -g @anatoliikmt/ctxlayer
```

Or run without installing: `npx @anatoliikmt/ctxlayer`

## Local development

Run `./install-cli-locally.sh` from the repo root — it uninstalls any existing `ctx`, then installs and links from local source.

Or manually:

```bash
cd /path/to/ctxlayer
npm install
npm link
```

After that, `ctx` is available globally. Edits to `bin/cli.js` take effect immediately.

### Uninstalling

```bash
npm unlink -g @anatoliikmt/ctxlayer
```

(If you linked when the package had a different name, use that name: `npm unlink -g ctx`.)

## Agent skill

The one-liner above installs both the CLI and the skill. To install the skill only:

```bash
npx skills add anatoliykmetyuk/ctxlayer -g --skill ctxlayer
```

From local path:

```bash
npx skills add /path/to/ctxlayer -g -a cursor --skill ctxlayer -y
```
