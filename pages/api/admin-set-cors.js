import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }
  if (req.headers["x-bootstrap-secret"] !== process.env.BOOTSTRAP_SECRET) {
    return res.status(401).json({ error: "Not authorized." });
  }

  const client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });

  try {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: process.env.S3_BUCKET,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: ["*"],
              AllowedMethods: ["GET", "HEAD"],
              AllowedHeaders: ["*"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );
  } catch (err) {
    return res.status(500).json({ error: `PutBucketCors failed: ${err.name} ${err.message}` });
  }

  try {
    const result = await client.send(new GetBucketCorsCommand({ Bucket: process.env.S3_BUCKET }));
    return res.status(200).json({ ok: true, corsRules: result.CORSRules });
  } catch (err) {
    return res.status(200).json({ ok: true, note: "Set, but couldn't read back to confirm." });
  }
}
