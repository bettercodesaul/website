const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Media = require('../models/Media');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// GET /api/media - List all media
router.get('/', authenticate, async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const media = await Media.list({ limit: parseInt(limit), offset: parseInt(offset) });
    res.json({ media });
  } catch (err) {
    console.error('List media error:', err);
    res.status(500).json({ error: 'Failed to list media' });
  }
});

// GET /api/media/:id - Get media by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.json({ media });
  } catch (err) {
    console.error('Get media error:', err);
    res.status(500).json({ error: 'Failed to get media' });
  }
});

// POST /api/media/upload - Upload media (authenticated)
router.post('/upload', authenticate, requireRole('admin', 'editor'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const media = await Media.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user.id
    });

    res.status(201).json({ media });
  } catch (err) {
    console.error('Upload media error:', err);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

// DELETE /api/media/:id - Delete media (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete file from disk
    const filePath = path.join(uploadDir, media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Media.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error('Delete media error:', err);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

module.exports = router;
