const multer = require("multer");

const {
  CloudinaryStorage,
} = require(
  "multer-storage-cloudinary"
);

const cloudinary =
  require("cloudinary").v2;

/*
──────────────────────────────────────
CLOUDINARY
──────────────────────────────────────
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

/*
──────────────────────────────────────
STORAGE
IMPORTANT:
resource_type:auto
──────────────────────────────────────
*/

const storage =
  new CloudinaryStorage({
    cloudinary,

    params: async (
      req,
      file
    ) => ({
      folder:
        "entry-files",

      resource_type:
        "auto",

      public_id: `entry-${Date.now()}`,
    }),
  });

/*
──────────────────────────────────────
UPLOAD
──────────────────────────────────────
*/

const upload = multer({
  storage,

  limits: {
    fileSize:
      25 *
      1024 *
      1024,
  },
});

module.exports = upload;