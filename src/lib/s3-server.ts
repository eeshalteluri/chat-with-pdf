import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import os from "os";
import path from "path";
import { Readable } from "stream";

// Helper function to convert ReadableStream to Buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export async function downloadFromS3(file_key: string) {
  try {
    const s3 = new S3Client({
      region: "ap-south-2",
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
      },
    });

    const command = new GetObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: file_key,
    });

    const response = await s3.send(command);

    const stream = response.Body as Readable;
    const buffer = await streamToBuffer(stream);

    const file_name = path.join(os.tmpdir(), `pdf-${Date.now()}.pdf`);
    fs.writeFileSync(file_name, buffer);

    return file_name; // useful if you want to return the local path
  } catch (error) {
    console.error("Error downloading from S3:", error);
    return null;
  }
}
