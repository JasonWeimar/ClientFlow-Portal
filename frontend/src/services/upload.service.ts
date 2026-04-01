// Orchestrates 2-step S3 upload pattern.
// Called by SubmitRequestPage when the user attaches a file.
// Returns the S3 objectKey — store this in the request form as attachmentKey.
import { getUploadUrl } from "../api/requests";

export async function uploadFile(file: File): Promise<string> {
  // —— Step 1: Get pre-signed URL from Lambda —————
  // getUploadUrl calls GET /upload-url?contentType=image/png (for example).
  // Lambda calls s3.getSignedUrlPromise('putObject', { ... }) and returns:
  //   { uploadUrl: "https://s3.amazonaws.com/...?X-Amz-Signature=...", objectKey: "uploads/uuid.png" }
  const { uploadUrl, objectKey } = await getUploadUrl(file.type);

  // ── Step 2: PUT file directly to S3 —————
  // IMPORTANT: Use fetch(), NOT apiClient.
  // apiClient adds "Authorization: Bearer <JWT>" — S3 will reject this
  // because the pre-signed URL has its own embedded credentials.
  // fetch() with no extra headers sends only what S3 expects.
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      // Content-Type MUST match what Lambda specified when generating the URL.
      // S3 validates this header against the signed policy.
      "Content-Type": file.type,
    },
  });

  if (!response.ok) {
    throw new Error(
      `S3 upload failed: ${response.status} ${response.statusText}`,
    );
  }

  // Return the objectKey so the caller can include it in the request form.
  // The backend stores this key in DynamoDB as attachmentKey.
  // To retrieve the file later, use this key with a separate GET /download-url endpoint
  // (not built yet).
  return objectKey;
}
