const express = require('express');
const Page = require('../models/Page');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/pages - List all pages
router.get('/', async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    const pages = await Page.list({ status, limit: parseInt(limit), offset: parseInt(offset) });
    const total = await Page.count({ status });
    res.json({ pages, total });
  } catch (err) {
    console.error('List pages error:', err);
    res.status(500).json({ error: 'Failed to list pages' });
  }
});

// GET /api/pages/:id - Get page by ID
router.get('/:id', async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json({ page });
  } catch (err) {
    console.error('Get page error:', err);
    res.status(500).json({ error: 'Failed to get page' });
  }
});

// GET /api/pages/slug/:slug - Get page by slug (public)
router.get('/slug/:slug', async (req, res) => {
  try {
    const page = await Page.findBySlug(req.params.slug);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json({ page });
  } catch (err) {
    console.error('Get page by slug error:', err);
    res.status(500).json({ error: 'Failed to get page' });
  }
});

// POST /api/pages - Create new page (authenticated)
router.post('/', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { title, slug, content, excerpt, status } = req.body;

    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' });
    }

    const page = await Page.create({
      title,
      slug,
      content,
      excerpt,
      status,
      authorId: req.user.id
    });

    res.status(201).json({ page });
  } catch (err) {
    console.error('Create page error:', err);
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// PUT /api/pages/:id - Update page (authenticated)
router.put('/:id', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const { title, slug, content, excerpt, status } = req.body;
    const updated = await Page.update(req.params.id, { title, slug, content, excerpt, status });
    res.json({ page: updated });
  } catch (err) {
    console.error('Update page error:', err);
    res.status(500).json({ error: 'Failed to update page' });
  }
});

// DELETE /api/pages/:id - Delete page (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    await Page.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error('Delete page error:', err);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

module.exports = router;
