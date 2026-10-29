"use strict";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destination = path.resolve(process.cwd(), "uploads");
    mkdir(destination, { recursive: true }).then(() => cb(null, destination)).catch(cb);
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, "-") + "-" + randomUUID() + ".mp4");
  },
});
const filefilter = (req, file, cb) => {
  if (file.mimetype === "video/mp4" && path.extname(file.originalname).toLowerCase() === ".mp4") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({ storage: storage, fileFilter: filefilter, limits: { fileSize: 100 * 1024 * 1024 } });
export default upload;
