// Triggered by EventBridge — NOT by API Gateway directly.
// Receives StatusChanged events published by updateStatus Lambda
// and sends a transactional email to the client via SES.
// Decoupled from the request update: SES failure never affects
// the client's status update or the admin's workflow.
import type { EventBridgeEvent } from "aws-lambda";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { serverError } from "../../lib/response";

const sesClient = new SESClient({
  region: process.env.AWS_REGION ?? "us-west-1",
});

// Verified sender identity — set in Lambda env vars after Part F Step 18.
// Must match an SES-verified email address in us-west-1.
const FROM_EMAIL = process.env.SES_FROM_EMAIL ?? "";

// Shape of the EventBridge detail payload published by updateStatus.
interface StatusChangedDetail {
  requestId: string;
  clientEmail: string;
  previousStatus: string;
  newStatus: string;
  note: string;
  changedBy: string;
}

// Human-readable labels for each status value shown in the email body.
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending Review",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

export const handler = async (
  event: EventBridgeEvent<"StatusChanged", StatusChangedDetail>,
): Promise<void> => {
  const { requestId, clientEmail, newStatus, note } = event.detail;

  // Guard: if SES_FROM_EMAIL is not configured, log and exit cleanly.
  // Avoids a hard Lambda error during local dev or before Part F is complete.
  if (!FROM_EMAIL) {
    console.warn("SES_FROM_EMAIL not set — skipping notification", {
      requestId,
    });
    return;
  }

  const statusLabel = STATUS_LABELS[newStatus] ?? newStatus;

  try {
    await sesClient.send(
      new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [clientEmail] },
        Message: {
          Subject: {
            Data: `Your request status has been updated — ${statusLabel}`,
          },
          Body: {
            Text: {
              // Plain-text fallback for email clients that don't render HTML.
              Data: [
                `Hello,`,
                ``,
                `Your service request (ID: ${requestId}) has been updated.`,
                ``,
                `New status: ${statusLabel}`,
                note ? `Note from your service provider: ${note}` : "",
                ``,
                `Log in to ClientFlow Portal to view the full details.`,
              ]
                .filter((line) => line !== undefined)
                .join("\n"),
            },
          },
        },
      }),
    );
    console.log("Notification sent", { requestId, clientEmail, newStatus });
  } catch (error) {
    // Log the error but do not rethrow — a failed notification should not
    // cause EventBridge to retry and spam the client with duplicate emails.
    console.error("sendNotification error:", error);
    serverError(); // returns a LambdaResponse object but result is intentionally unused here
  }
};
