// controllers/file.controller.js

const {
  PrismaClient,
} = require('@prisma/client');

const multer =
  require('multer');

const {
  CloudinaryStorage,
} = require(
  'multer-storage-cloudinary'
);

const cloudinary =
  require('cloudinary').v2;

const {
  isDateLocked,
} = require(
  '../utils/dateUtils'
);

const prisma =
  new PrismaClient();

/**
 * CLOUDINARY CONFIG
 */

cloudinary.config({
  cloud_name:
    process.env
      .CLOUDINARY_CLOUD_NAME,

  api_key:
    process.env
      .CLOUDINARY_API_KEY,

  api_secret:
    process.env
      .CLOUDINARY_API_SECRET,
});

/**
 * STORAGE
 */
const storage =
  new CloudinaryStorage({
    cloudinary,

    params: {
      folder:
        'entry-files',

      resource_type:
        'image',

      format: 'pdf',

      public_id: (
        req,
        file
      ) =>
        `entry-${Date.now()}`,
    },
  });

/**
 * MULTER
 */

const upload = multer({
  storage,

  limits: {
    fileSize:
      10 * 1024 * 1024,
  },
});

/**
 * UPLOAD FILE
 */

const uploadFile =
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error:
            'No file uploaded',
        });
      }

      const {
        date,
        memoId,
      } = req.body;

      if (!date) {
        return res.status(400).json({
          error:
            'Date required',
        });
      }

      const entryDate =
        new Date(
          `${date}T12:00:00`
        );

      if (
        isDateLocked(
          entryDate
        )
      ) {
        return res.status(403).json({
          error:
            'Date locked',
        });
      }

      const fileRecord =
        await prisma.file.create({
          data: {
            originalName:
              req.file
                .originalname,

            // SAVE CLOUDINARY PUBLIC ID

            storedName:
              req.file
                .filename ||
              req.file
                .public_id ||
              `file-${Date.now()}`,

            mimeType:
              req.file
                .mimetype,

            size:
              req.file.size,

            // CLOUDINARY URL

            path:
              req.file.path,

            linkedDate:
              entryDate,

            memoId:
              memoId ||
              null,
          },
        });

      res.status(201).json({
        success: true,

        file: {
          id: fileRecord.id,

          url:
            fileRecord.path,

          originalName:
            fileRecord.originalName,
        },
      });
    } catch (err) {
      console.log(err);

      next(err);
    }
  };

/**
 * VIEW FILE
 */

const getFile = async (
  req,
  res,
  next
) => {
  try {
    const file =
      await prisma.file.findUnique({
        where: {
          id: req.params.id,
        },
      });

    if (!file) {
      return res.status(404).json({
        error:
          'Not found',
      });
    }

    // FORCE INLINE PDF VIEW

    const viewUrl =
      file.path.replace(
        '/upload/',
        '/upload/fl_attachment:false/'
      );

    return res.redirect(
      viewUrl
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET FILES BY DATE
 */

const getFilesByDate =
  async (req, res, next) => {
    try {
      const { date } =
        req.query;

      if (!date) {
        return res.status(400).json({
          error:
            'Date required',
        });
      }

      const start =
        new Date(
          `${date}T00:00:00`
        );

      const end =
        new Date(
          `${date}T23:59:59`
        );

      const files =
        await prisma.file.findMany({
          where: {
            linkedDate: {
              gte: start,
              lte: end,
            },
          },

          orderBy: {
            uploadedAt:
              'desc',
          },
        });

      res.json({
        files,
      });
    } catch (err) {
      next(err);
    }
  };

/**
 * DELETE FILE
 */

const deleteFile =
  async (req, res, next) => {
    try {
      const file =
        await prisma.file.findUnique({
          where: {
            id: req.params.id,
          },
        });

      if (!file) {
        return res.status(404).json({
          error:
            'Not found',
        });
      }

      /**
       * DELETE FROM CLOUDINARY
       */

      if (
        file.storedName
      ) {
        await cloudinary.uploader.destroy(
          `secure-caldoc/${file.storedName}`,
          {
            resource_type:
              'raw',
          }
        );
      }

      /**
       * DELETE FROM DB
       */

      await prisma.file.delete({
        where: {
          id: file.id,
        },
      });

      res.json({
        success: true,

        message:
          'Deleted successfully',
      });
    } catch (err) {
      console.log(err);

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