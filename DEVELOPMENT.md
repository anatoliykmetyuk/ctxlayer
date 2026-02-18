# Development

## Prerequisites

- **Node.js** — for the ctx CLI
- **Ruby** and **Bundler** — for the website (Jekyll)

## Website

The website is a Jekyll site in the `website/` directory. GitHub Pages builds it on deploy.

### First-time setup

```bash
cd website
bundle install
```

### Serve locally

```bash
cd website
bundle exec jekyll serve
```

Open http://localhost:4000 in your browser. The site will rebuild when you change files.

### Build for production

```bash
cd website
bundle exec jekyll build
```

Output goes to `website/_site/`.

### GitHub Pages

If the site is served from a subdirectory (e.g. `username.github.io/ctxlayer`), set `baseurl` in `website/_config.yml`:

```yaml
baseurl: "/ctxlayer"
url: "https://username.github.io"
```

Configure GitHub Pages in the repo settings: use the branch and folder that contain the Jekyll source (or the built `_site` output).

## CLI

### Local development

```bash
npm install
npm link
```

Or run `./install-locally.sh` — it uninstalls any existing `ctx` and skill, then installs both from local source.

After that, `ctx` is available globally. Edits to `bin/cli.js` take effect immediately.

### Uninstall

```bash
npm unlink -g @anatoliikmt/ctxlayer
```

(If you linked when the package had a different name, use that name: `npm unlink -g ctx` or whatever it was.)

### Switching between local and published version

**Use the published npm version:**

```bash
npm uninstall -g @anatoliikmt/ctxlayer   # remove local link if present
npm install -g @anatoliikmt/ctxlayer
```

**Switch back to local development:**

```bash
npm uninstall -g @anatoliikmt/ctxlayer
cd /path/to/ctxlayer
./install-locally.sh
```

## Agent skill

The project includes an agent skill at `skills/ctxlayer/SKILL.md` for Cursor (and other AI coding assistants).

### Install from local path

```bash
npx skills add /path/to/ctxlayer -g -a cursor --skill ctxlayer -y
```

Or use `./install-locally.sh` to install both CLI and skill from local source.

### Install from remote repository

```bash
npx skills add anatoliykmetyuk/ctxlayer -g -a cursor --skill ctxlayer -y
```

Or with full URL: `npx skills add https://github.com/anatoliykmetyuk/ctxlayer -g -a cursor --skill ctxlayer -y`

### Install from a specific tag

By default, remote install uses the latest commit. To install from a given tag:

```bash
npx skills add https://github.com/anatoliykmetyuk/ctxlayer/tree/v1.0.0 -g -a cursor --skill ctxlayer -y
```

Replace `v1.0.0` with the tag you want. The `/tree/<tag>` pattern works for tags and branches.

### Switching between local and remote skill

A new install overwrites the existing skill — no uninstall needed. To test remote install from a clean state:

```bash
rm -rf ~/.agents/skills/ctxlayer
rm -rf ~/.cursor/skills/ctxlayer
npx skills add anatoliykmetyuk/ctxlayer -g -a cursor --skill ctxlayer -y
```

## Tests

```bash
npm test
```

## Release

Publishing to npm is triggered by pushing a version tag. The package is `@anatoliikmt/ctxlayer` (CLI command: `ctx`).

### Steps

1. **Bump version** in `package.json` (e.g. `1.0.0` → `1.0.1`).
2. **Commit and push:**

   ```bash
   git add package.json
   git commit -m "chore: release v1.0.1"
   git push origin main
   ```

3. **Create and push the tag:**

   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

The GitHub Actions workflow (`.github/workflows/publish.yml`) runs on tag push: it runs tests and publishes to npm. Check the [Actions tab](https://github.com/anatoliykmetyuk/ctxlayer/actions) to confirm.

### Verify

```bash
npx @anatoliikmt/ctxlayer
```

Or after global install: `npm install -g @anatoliikmt/ctxlayer`, then `ctx`.
