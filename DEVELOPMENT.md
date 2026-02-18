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

After that, `ctx` is available globally. Edits to `bin/cli.js` take effect immediately.

### Uninstall

```bash
npm unlink -g @anatoliikmt/ctxlayer
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
