import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client = null;

function getClient() {
  if (!client) {
    const required = ["S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_ENDPOINT"];
    for (const key of required) {
      if (!process.env[key]) throw new Error(`${key} is not set.`);
    }
    client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export async function uploadBuffer(key, buffer, contentType) {
  const s3 = getClient();
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return key;
}

// Short-lived signed URL for playback — regenerated on every read rather than
// stored, since buckets are private-only and a stored URL would eventually expire.
export async function presignedPlaybackUrl(key, expiresInSeconds = 3600) {
  const s3 = getClient();
  const command = new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

// Adds a `playUrl` to each submission: the pasted link as-is for LINK
// submissions, or a freshly signed, time-limited URL for UPLOAD ones (since
// the bucket is private and a stored URL would eventually expire).
export async function attachPlayUrls(submissions) {
  return Promise.all(
    submissions.map(async (s) => {
      if (s.sourceType === "UPLOAD") {
        try {
          return { ...s, playUrl: await presignedPlaybackUrl(s.link) };
        } catch {
          return { ...s, playUrl: null };
        }
      }
      return { ...s, playUrl: s.link };
    })
  );
}

// Generic version of the above for a single { sourceType, link } shaped
// object — used for AMA responses, which aren't Submission rows.
export async function presignIfUpload(sourceType, link) {
  if (sourceType !== "UPLOAD" || !link) return link;
  try {
    return await presignedPlaybackUrl(link);
  } catch {
    return null;
  }
}
