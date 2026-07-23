import { Router, Response } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";
import { AppError } from "../middleware/errorHandler";
import { uploadToCloudinary } from "../services/cloudinary";
import { addVideoJob } from "../workers/videoWorker";

export const uploadController = Router();

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];

  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else if (allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, "Only image (JPEG, PNG, GIF, WebP) and video (MP4, WebM, MOV) files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 5,
  },
});

uploadController.post("/", authenticate, upload.array("files", 5), async (req: AuthRequest, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    throw new AppError(400, "No files uploaded");
  }

  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const cloudinaryResult = await uploadToCloudinary(file);
        const isVideo = file.mimetype.startsWith("video/");

        if (isVideo) {
          await addVideoJob({
            kudoId: "pending",
            filePath: cloudinaryResult.url,
            originalName: file.originalname,
          });
        }

        const mediaType = isVideo ? "video" : "image";
        return {
          url: cloudinaryResult.url,
          publicId: cloudinaryResult.publicId,
          type: mediaType,
          duration: cloudinaryResult.duration,
          originalName: file.originalname,
          size: cloudinaryResult.bytes,
        };
      } catch (err) {
        console.error(`[Upload] Failed to process ${file.originalname}:`, err);
        return null;
      }
    })
  );

  const successful = results.filter((r): r is NonNullable<typeof r> => r !== null);

  res.status(201).json({
    success: true,
    data: successful,
  });
});
