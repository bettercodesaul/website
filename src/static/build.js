const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(process.cwd(), 'content');
const DIST_DIR = path.join(process.cwd(), 'dist');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  match[1].split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim();
      meta[key.trim()] = value === 'true' ? true : value === 'false' ? false : value;
    }
  });

  return { meta, body: match[2] };
}

function markdownToHtml(md) {
  let html = md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\*\* (.*)\*\*$/gim, '<strong>$1</strong>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^---$/gim, '<hr>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');

  return html;
}

function generateLayout({ title, excerpt, content, slug }) {
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' }
  ];

  const navHtml = navItems.map(item =>
    `<a href="${item.href}" class="nav-link">${item.label}</a>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    header { border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
    nav { display: flex; gap: 20px; margin-top: 15px; }
    .nav-link { color: #0066cc; text-decoration: none; }
    .nav-link:hover { text-decoration: underline; }
    h1 { color: #222; margin-bottom: 10px; }
    h2 { color: #444; margin: 25px 0 15px; }
    h3 { color: #555; margin: 20px 0 10px; }
    p { margin: 15px 0; }
    hr { border: none; border-top: 1px solid #eee; margin: 30px 0; }
    footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 0.9em; text-align: center; }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <nav>${navHtml}</nav>
  </header>
  <main>
    ${content}
  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} BCS - Building Content Systems</p>
  </footer>
</body>
</html>`;
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${destPath}`);
    }
  }
}

function build() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Copy static assets from public/ to dist/
  const PUBLIC_DIR = path.join(process.cwd(), 'public');
  if (fs.existsSync(PUBLIC_DIR)) {
    copyDirectory(PUBLIC_DIR, DIST_DIR);
    console.log('Static assets copied to dist/');
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  let generated = 0;

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { meta, body } = parseFrontmatter(content);

    if (meta.published !== true) {
      console.log(`Skipping ${file} (not published)`);
      continue;
    }

    const htmlContent = markdownToHtml(body);
    const html = generateLayout({
      title: meta.title,
      excerpt: meta.excerpt,
      content: htmlContent,
      slug: meta.slug
    });

    let outputPath;
    if (meta.slug === '/' || file === 'home.md') {
      outputPath = 'index.html';
    } else {
      const dirName = meta.slug.replace(/^\//, '');
      const dirPath = path.join(DIST_DIR, dirName);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      outputPath = path.join(dirName, 'index.html');
    }

    fs.writeFileSync(path.join(DIST_DIR, outputPath), html);
    console.log(`Generated: ${outputPath}`);
    generated++;
  }

  console.log(`\nBuild complete: ${generated} page(s) generated in ${DIST_DIR}`);
}

build();
