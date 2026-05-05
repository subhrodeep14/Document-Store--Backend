// controllers/file.controller.js (CLOUDINARY VERSION)

const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { isDateLocked } = require('../utils/dateUtils');

const prisma = new PrismaClient();

// 🔥 Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔥 Storage (NO local disk)
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'secure-caldoc',
    resource_type: 'raw', // PDF support
    format: async () => 'pdf',
    public_id: (req, file) => `file-${Date.now()}`,
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// 🚀 Upload file
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { date, memoId } = req.body;

    if (!date) return res.status(400).json({ error: 'Date required' });

    const entryDate = new Date(date);
    if (isDateLocked(entryDate)) {
      return res.status(403).json({ error: 'Date locked' });
    }

    const fileRecord = await prisma.file.create({
      data: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path, // 🔥 Cloudinary URL
        linkedDate: entryDate,
        memoId: memoId || null,
      },
    });

    res.status(201).json({
      file: {
        id: fileRecord.id,
        url: fileRecord.path,
        originalName: fileRecord.originalName,
      },
    });
  } catch (err) {
    next(err);
  }
};

// 🚀 Get file (just redirect)
const getFile = async (req, res, next) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
    });

    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.redirect(file.path); // 🔥 direct Cloudinary
  } catch (err) {
    next(err);
  }
};

// 🚀 Get files by date
const getFilesByDate = async (req, res, next) => {
  try {
    const files = await prisma.file.findMany({
      where: { linkedDate: new Date(req.query.date) },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({ files });
  } catch (err) {
    next(err);
  }
};

// 🚀 Delete file (Cloudinary + DB)
const deleteFile = async (req, res, next) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
    });

    if (!file) return res.status(404).json({ error: 'Not found' });

    // delete from cloudinary
    const publicId = file.path.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`secure-caldoc/${publicId}`, {
      resource_type: 'raw',
    });

    await prisma.file.delete({ where: { id: file.id } });

    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  upload,
  uploadFile,
  getFile,
  getFilesByDate,
  deleteFile,
};