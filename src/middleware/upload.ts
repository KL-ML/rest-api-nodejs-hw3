import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve("uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, filename);
  }
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {

  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    const error: any = new Error('Only image files are allowed!');
    error.status = 400;
    return cb(error, false);
  }
};

export const upload = multer({storage, fileFilter, limits: {fileSize: 5 * 1024 * 1024}});