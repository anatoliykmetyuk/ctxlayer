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
npm unlink -g ctx
```

## Tests

```bash
npm test
```
