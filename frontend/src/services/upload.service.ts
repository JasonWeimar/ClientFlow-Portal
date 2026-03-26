// upload.service — implemented in Walkthrough Part D Step 14.3
// Handles 2-step S3 upload: request pre-signed URL from API, then PUT file directly to S3.
export async function uploadFile(file: File): Promise<string> {
  void file;
  throw new Error("uploadFile not yet implemented");
}
