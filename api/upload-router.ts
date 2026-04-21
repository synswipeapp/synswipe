import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    // Already exists
  }
}

export const uploadRouter = createRouter({
  uploadImage: authedQuery
    .input(z.object({
      imageData: z.string(), // base64 data URL
    }))
    .mutation(async ({ input }) => {
      await ensureUploadDir();

      // Parse base64 data URL
      const match = input.imageData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) {
        throw new Error("Invalid image data");
      }

      const ext = match[1] === "jpeg" ? "jpg" : match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, "base64");

      // Validate file size (max 10MB)
      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error("Image too large (max 10MB)");
      }

      // Save file
      const filename = `${randomUUID()}.${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      await writeFile(filepath, buffer);

      // Return public URL
      const url = `/uploads/${filename}`;

      return { url };
    }),
});
