# BCS Static Site Generator

A lightweight static site generator that converts Markdown content into HTML pages for GitHub Pages deployment.

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Build Locally

```bash
# Install dependencies
npm install

# Build static site
npm run build

# View generated files
ls dist/
```

### Development

Add or edit Markdown files in the `content/` directory:

```markdown
---
title: Page Title
slug: /page-slug
excerpt: Short description
published: true
---

# Your content here

Write in **Markdown** format.
```

## Content Structure

```
bcs/
├── content/           # Markdown source files
│   ├── home.md       # Becomes dist/index.html
│   ├── about.md      # Becomes dist/about/index.html
│   └── contact.md    # Becomes dist/contact/index.html
├── dist/             # Generated HTML (deploy this)
├── src/static/
│   └── build.js      # Static site generator
└── package.json
```

## Frontmatter Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Page title (shown in header and browser tab) |
| `slug` | string | URL path (e.g., `/about`) |
| `excerpt` | string | Short description |
| `published` | boolean | Set to `true` to include in build |

## Deployment

### GitHub Pages

The site automatically deploys to GitHub Pages when you push to `main`:

1. Go to your repository Settings > Pages
2. Set Source to "GitHub Actions"
3. Push to main branch

The workflow in `.github/workflows/deploy.yml` handles the rest.

### Manual Deploy

```bash
# Build
npm run build

# Deploy dist/ folder to your hosting
```

## CI/CD Pipeline

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `ci.yml` | Push, PRs | Test and build static site |
| `deploy.yml` | Push to main | Deploy to GitHub Pages |

## Supported Markdown

- Headers (`#`, `##`, `###`)
- Bold (`**text**`) and italic (`*text*`)
- Links (`[text](url)`)
- Lists (`* item`)
- Horizontal rules (`---`)

## Configuration

### Environment Variables

None required. The build is fully static.

### Customization

Edit `src/static/build.js` to customize:
- HTML layout and styling
- Navigation menu
- Markdown parsing rules

## Testing

```bash
# Run tests
npm test
```

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
npm run clean
npm run build
```

### Page Not Generated

- Check `published: true` in frontmatter
- Verify Markdown syntax
- Check console output for errors

## License

Copyright (c) 2026 ClawTeam Engineering
