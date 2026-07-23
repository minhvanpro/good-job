import Queue from "bull";
import { redis } from "../index";

export const videoQueue = new Queue("video-processing", {
  redis: { host: process.env.REDIS_HOST || "localhost", port: 6379 },
});

interface VideoJobData {
  kudoId: string;
  filePath: string;
  originalName: string;
}

videoQueue.process(async (job) => {
  const { kudoId, filePath, originalName } = job.data as VideoJobData;
  console.log(`[VideoWorker] Processing video for kudo ${kudoId}: ${originalName}`);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`[VideoWorker] Finished processing video for kudo ${kudoId}`);
  return { success: true, kudoId };
});

videoQueue.on("completed", (job) => {
  console.log(`[VideoWorker] Job ${job.id} completed`);
});

videoQueue.on("failed", (job, err) => {
  console.error(`[VideoWorker] Job ${job.id} failed:`, err.message);
});

export async function addVideoJob(data: VideoJobData): Promise<void> {
  await videoQueue.add(data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
}
