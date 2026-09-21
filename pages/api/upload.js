import formidable from "formidable";
import fs from "fs/promises";
import crypto from "crypto";
import { uploadBuffer } from "../../lib/s3";
import { rateLimited } from "../../lib/rateLimit";

export const config = {
  api: { bodyParser: false },
};

const ALLOWED = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "video/mp4": "mp4",
};

const MAX_BYTES = 50 * 1024 * 1024; // 50MB

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }
  if (rateLimited(req, res, "upload", { windowMs: 60 * 60 * 1000, max: 20 })) return;

  const form = formidable({
    maxFiles: 1,
    maxFileSize: MAX_BYTES,
    filter: ({ mimetype }) => Boolean(ALLOWED[mimetype]),
  });

  let fields, files;
  try {
    [fields, files] = await form.parse(req);
  } catch (err) {
    return res.status(400).json({
      error: "Upload failed — check the file is an MP3, WAV, or MP4 under 50MB.",
    });
  }

  const file = files.file?.[0];
  if (!file) {
    return res
      .status(400)
      .json({ error: "No valid file found. Allowed types: MP3, WAV, MP4 (max 50MB)." });
  }

  const ext = ALLOWED[file.mimetype];
  const key = `uploads/${crypto.randomUUID()}.${ext}`;

  try {
    const buffer = await fs.readFile(file.filepath);
    await uploadBuffer(key, buffer, file.mimetype);
  } catch (err) {
    return res.status(500).json({ error: "Couldn't store that file. Try again." });
  } finally {
    fs.unlink(file.filepath).catch(() => {});
  }

  return res.status(201).json({ key, sourceType: "UPLOAD" });
}
