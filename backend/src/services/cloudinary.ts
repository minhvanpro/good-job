import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { AppError } from "../middleware/errorHandler";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  resourceType: "image" | "video";
  bytes: number;
  duration?: number;
}

export async function uploadToCloudinary(
  file: Express.Multer.File
): Promise<CloudinaryUploadResult> {
  const isVideo = file.mimetype.startsWith("video/");

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new AppError(500, "Cloudinary upload timed out"));
    }, isVideo ? 120000 : 30000);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: isVideo ? "video" : "image",
        folder: "good-job",
        timeout: isVideo ? 120000 : 30000,
        ...(isVideo
          ? {
              quality: "auto",
              duration: 180,
            }
          : {
              quality: "auto",
              fetch_format: "auto",
            }),
      },
      (error, result) => {
        clearTimeout(timeout);
        if (error) {
          console.error("[Cloudinary] Upload error:", error);
          reject(new AppError(500, "Failed to upload file to Cloudinary"));
          return;
        }
        if (!result) {
          reject(new AppError(500, "Cloudinary returned empty result"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          resourceType: result.resource_type as "image" | "video",
          bytes: result.bytes,
          duration: result.duration,
        });
      }
    );

    const readable = new Readable();
    readable.push(file.buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("[Cloudinary] Delete error:", error);
  }
}

export default cloudinary;
