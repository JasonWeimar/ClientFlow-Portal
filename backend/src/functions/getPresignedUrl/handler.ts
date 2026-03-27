import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { ok, unauthorized, serverError } from "../../lib/response";

// S3Client is instantiated outside the handler so it is reused
// across warm Lambda invocations — avoids re-initialising the
// SDK client on every request.
const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? "us-west-1",
});

// Bucket name injected via Lambda environment variable.
// Set to clientflow-attachments-148761680757 in Step 10.
// The non-null assertion is safe — Lambda will fail to start
// if the env var is missing, making the misconfiguration obvious.
const BUCKET = process.env.ATTACHMENTS_BUCKET!;

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    const userId = claims?.sub as string | undefined;
    // Reject unauthenticated callers — presigned URLs are scoped
    // to the authenticated user's prefix in S3.
    if (!userId) return unauthorized();

    // contentType is passed as a query string parameter by the frontend
    // upload.service.ts before the file is selected.
    // Defaults to application/octet-stream if omitted — S3 accepts it
    // but the browser won't infer the file type on download.
    const contentType =
      event.queryStringParameters?.contentType ?? "application/octet-stream";

    // Extract extension from MIME type — "image/png" → "png".
    // Falls back to "bin" for unknown or malformed content types.
    const ext = contentType.split("/")[1] ?? "bin";

    // Object key structure: uploads/{userId}/{timestamp}-{uuid}.{ext}
    // userId prefix scopes uploads per user — enables per-user S3 policies later.
    // Timestamp + uuid combination guarantees uniqueness even under concurrent uploads.
    const objectKey = `uploads/${userId}/${Date.now()}-${uuidv4()}.${ext}`;

    // Generate a presigned PUT URL — valid for 10 minutes (600 seconds).
    // The browser uploads directly to S3 using this URL.
    // Lambda never handles the file bytes — avoids the 6MB Lambda payload limit.
    // ContentType must match what the browser sends in the PUT request header
    // or S3 will reject the upload with a 403.
    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: objectKey,
        ContentType: contentType,
      }),
      { expiresIn: 600 },
    );

    // Return both values — the frontend needs the URL to upload
    // and the objectKey to pass to createRequest as attachmentKey.
    return ok({ uploadUrl, objectKey });
  } catch (error) {
    console.error("getPresignedUrl error:", error);
    return serverError();
  }
};
