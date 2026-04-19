const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(process.cwd(), 'dist');
const CONTENT_DIR = path.join(process.cwd(), 'content');

describe('Static Site Build', () => {
  test('build script runs without errors', () => {
    const result = execSync('npm run build', { encoding: 'utf8' });
    assert.ok(result.includes('Build complete'));
  });

  test('dist directory is created', () => {
    assert.ok(fs.existsSync(DIST_DIR));
  });

  test('index.html is generated', () => {
    const indexPath = path.join(DIST_DIR, 'index.html');
    assert.ok(fs.existsSync(indexPath));

    const content = fs.readFileSync(indexPath, 'utf8');
    assert.ok(content.includes('<!DOCTYPE html>'));
    assert.ok(content.includes('<title>Welcome to BCS</title>'));
  });

  test('about page is generated', () => {
    const aboutPath = path.join(DIST_DIR, 'about', 'index.html');
    assert.ok(fs.existsSync(aboutPath));

    const content = fs.readFileSync(aboutPath, 'utf8');
    assert.ok(content.includes('<title>About Us</title>'));
  });

  test('contact page is generated', () => {
    const contactPath = path.join(DIST_DIR, 'contact', 'index.html');
    assert.ok(fs.existsSync(contactPath));

    const content = fs.readFileSync(contactPath, 'utf8');
    assert.ok(content.includes('<title>Contact</title>'));
  });

  test('generated HTML contains navigation', () => {
    const indexPath = path.join(DIST_DIR, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf8');

    assert.ok(content.includes('href="/about"'));
    assert.ok(content.includes('href="/contact"'));
  });

  test('generated HTML contains footer', () => {
    const indexPath = path.join(DIST_DIR, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf8');

    assert.ok(content.includes('BCS - Building Content Systems'));
  });

  test('unpublished pages are not generated', () => {
    // Create an unpublished test file
    const testFile = path.join(CONTENT_DIR, 'draft.md');
    fs.writeFileSync(testFile, `---
title: Draft Page
slug: /draft
published: false
---

# Draft
`);

    execSync('npm run build', { encoding: 'utf8' });

    const draftPath = path.join(DIST_DIR, 'draft', 'index.html');
    assert.ok(!fs.existsSync(draftPath));

    // Cleanup
    fs.unlinkSync(testFile);
  });
});
