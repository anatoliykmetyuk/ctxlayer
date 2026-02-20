# Development

## Prerequisites

- **Node.js** — for the ctx CLI
- **Ruby** and **Bundler** — for the website (Jekyll)

## CLI and agent skill

The project is composed of a CLI (`ctx`) and an agent skill for Cursor (and other AI coding assistants). To install both from local source:

```bash
./install-locally.sh
```

The script uninstalls any existing `ctx` and skill, then installs both from the local repo. After that, `ctx` is available globally. Edits to `bin/cli.js` and `skills/` take effect after re-running the script.

For the CLI, it uses Node/npm: `npm install` fetches dependencies, and `npm link` creates a global symlink so the local package is used when you run `ctx`. For the skill, it uses the [skills CLI](https://skills.sh/docs/cli) (`npx skills add`), which copies the skill into `~/.cursor/skills/ctxlayer` (and `~/.agents/skills/` for other agents). The script first removes any existing installs from those locations, then reinstalls from local source.

## Tests

```bash
npm test
```

## Release

Publishing to npm and creating a GitHub Release happen when you push a version tag, **after** the CLI workflow tests pass. The package is `@anatoliikmt/ctxlayer` (CLI command: `ctx`).

### Flow

1. **CLI** (`.github/workflows/cli.yml`) runs on push to `main`, tag pushes `v*`, and pull requests. It runs tests on Node 22 and 24.
2. On a **tag push** with tests passing, the **Release** workflow (`.github/workflows/release.yml`) runs:
   - publishes to npm
   - creates a GitHub Release with auto-generated notes (PRs and commits since last tag)

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

The CLI workflow runs tests on the tag. If they pass, the Release workflow publishes to npm and creates a GitHub Release. Check the [Actions tab](https://github.com/anatoliykmetyuk/ctxlayer/actions) to confirm.

### Verify

```bash
npx @anatoliikmt/ctxlayer
```

Or after global install: `npm install -g @anatoliikmt/ctxlayer`, then `ctx`.

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
