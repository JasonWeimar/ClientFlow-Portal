import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { docClient } from "../../lib/dynamo";
import {
  created,
  badRequest,
  unauthorized,
  serverError,
} from "../../lib/response";
import type { ServiceRequest } from "../../types";

// Zod schema validates the request body before any DB write.
// Same field shapes as the frontend requestSchema.ts — defense in depth.
// serviceType and description have length bounds to prevent oversized items.
const Schema = z.object({
  // Min 1 prevents empty strings that pass truthy checks.
  serviceType: z.string().min(1).max(100),
  // Min 10 ensures the client provided a meaningful description.
  description: z.string().min(10).max(2000),
  // Regex enforces ISO date format — DynamoDB stores as string, not Date.
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  // The S3 object key is passed in after getPresignedUrl completes the upload.
  attachmentKey: z.string().nullable().optional(),
});

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    // JWT authorizer injects verified claims into requestContext before
    // the Lambda is invoked — no manual token verification needed here.
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    // sub is the Cognito user ID — stable, unique, never changes.
    const clientId = claims?.sub as string | undefined;
    // email claim is present because the Cognito app client includes it
    // in the ID token scope. Used by sendNotification for SES delivery.
    const clientEmail = claims?.email as string | undefined;

    // If sub is missing the JWT authorizer failed silently — reject early.
    if (!clientId) return unauthorized();

    // safeParse returns { success, data } or { success, error } —
    // never throws, so the catch block stays reserved for genuine exceptions.
    const parse = Schema.safeParse(JSON.parse(event.body ?? "{}"));
    if (!parse.success) return badRequest(parse.error.message);

    const now = new Date().toISOString();

    // Build the full ServiceRequest item — all fields set at creation time.
    // updatedAt starts equal to createdAt and is mutated by updateStatus.
    const request: ServiceRequest = {
      requestId: uuidv4(),
      clientId,
      // Fall back to empty string if email claim is absent — SES will
      // log a delivery failure rather than crashing the Lambda.
      clientEmail: clientEmail ?? "",
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
      ...parse.data,
      // Coerce undefined to null — DynamoDB item attributes must be
      // explicitly null rather than absent for optional nullable fields.
      attachmentKey: parse.data.attachmentKey ?? null,
    };

    // Write the primary request record to cf-requests.
    await docClient.send(
      new PutCommand({ TableName: "cf-requests", Item: request }),
    );

    // Write the initial status event to cf-status-events.
    // This seeds the StatusTimeline on the client portal with the
    // "Request created" entry — every request has at least one event.
    await docClient.send(
      new PutCommand({
        TableName: "cf-status-events",
        Item: {
          requestId: request.requestId,
          createdAt: now,
          // null because there was no prior status before PENDING.
          previousStatus: null,
          newStatus: "PENDING",
          // "system" distinguishes automated events from admin actions
          // in the timeline UI.
          changedBy: "system",
          note: "Request created",
        },
      }),
    );

    // 201 Created — returns the full request object so the frontend
    // can optimistically update the UI without a follow-up GET.
    return created(request);
  } catch (error) {
    console.error("createRequest error:", error);
    return serverError();
  }
};
