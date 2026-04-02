// ——— frontend/src/features/requests/requestSchema.ts — Shared validation ———
// This schema defines the validation rules for the submit request form.
// Because the Lambda function uses the SAME rules in its Zod schema,
// the application has consistent validation at both the UI layer and the API layer.
// Any change to validation rules must be updated in BOTH places.

import { z } from "zod";

export const RequestFormSchema = z.object({
  serviceType: z.string().min(1, "Please select a service type"),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description cannot exceed 2000 characters"),

  // attachment is optional — it holds the S3 object key AFTER upload,
  // not the File object itself. The actual upload happens as a side effect
  // triggered by the file input onChange handler.
  attachmentKey: z.string().nullable().optional(),
});

// TypeScript type inferred from the Zod schema.
// Use this type for all form state — it is always in sync with the schema.
export type RequestFormValues = z.infer<typeof RequestFormSchema>;
