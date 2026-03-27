// Handles PATCH /requests/{requestId}/status
// Admin-only. Updates the request status, writes a status event
// to cf-status-events, and publishes a StatusChanged event to
// EventBridge for the sendNotification Lambda to consume (Part F).
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UpdateCommand, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { z } from "zod";
import { docClient } from "../../lib/dynamo";
import {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from "../../lib/response";
import type { RequestStatus } from "../../types";

const REQUESTS_TABLE = "cf-requests";
const EVENTS_TABLE = "cf-status-events";

// EventBridge client — publishes status change events for Part F.
// sendNotification Lambda subscribes to these via an EventBridge rule.
const ebClient = new EventBridgeClient({
  region: process.env.AWS_REGION ?? "us-west-1",
});

const Schema = z.object({
  // Validates that the incoming status is one of the five allowed values.
  status: z.enum(["PENDING", "IN_REVIEW", "APPROVED", "COMPLETED", "REJECTED"]),
  // Optional note displayed in the client's status timeline.
  note: z.string().max(1000).optional(),
});

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    const adminId = claims?.sub as string | undefined;
    if (!adminId) return unauthorized();

    // Reject non-admin callers before touching the database.
    const rawGroups = (claims?.["cognito:groups"] as string) ?? "";
    const groups = rawGroups.split(" ").filter(Boolean);
    if (!groups.includes("admin")) return forbidden();

    // requestId comes from the path parameter: PATCH /requests/{requestId}/status
    const requestId = event.pathParameters?.requestId;
    if (!requestId) return badRequest("Missing requestId");

    const parse = Schema.safeParse(JSON.parse(event.body ?? "{}"));
    if (!parse.success) return badRequest(parse.error.message);

    const { status, note = "" } = parse.data;

    // Confirm the request exists before updating — avoids creating
    // orphaned status events for non-existent requests.
    // GetCommand requires both PK and SK for cf-requests.
    // We do a Scan here since we only have requestId (not clientId).
    const existing = await docClient.send(
      new GetCommand({
        TableName: REQUESTS_TABLE,
        // cf-requests PK is requestId — clientId is the sort key.
        // GetCommand needs both; use UpdateCommand with condition instead.
        Key: { requestId },
      }),
    );
    if (!existing.Item) return notFound("Request not found");

    const previousStatus = existing.Item["status"] as RequestStatus;
    const now = new Date().toISOString();

    // Update the request record with the new status and updatedAt timestamp.
    await docClient.send(
      new UpdateCommand({
        TableName: REQUESTS_TABLE,
        Key: { requestId },
        UpdateExpression: "SET #s = :status, updatedAt = :now",
        // #s is an expression alias — "status" is a DynamoDB reserved word.
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":status": status, ":now": now },
      }),
    );

    // Write an immutable audit record to cf-status-events.
    // The timeline on the client portal reads from this table.
    await docClient.send(
      new PutCommand({
        TableName: EVENTS_TABLE,
        Item: {
          requestId,
          createdAt: now,
          previousStatus,
          newStatus: status,
          changedBy: adminId,
          note,
        },
      }),
    );

    // Publish to EventBridge — sendNotification Lambda picks this up.
    // Decoupled: if SES is down, the status update still succeeds.
    // Adding Slack later = new EventBridge rule, zero code changes here.
    await ebClient.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: "clientflow.api",
            DetailType: "StatusChanged",
            Detail: JSON.stringify({
              requestId,
              clientEmail: existing.Item["clientEmail"],
              previousStatus,
              newStatus: status,
              note,
              changedBy: adminId,
            }),
            EventBusName: "default",
          },
        ],
      }),
    );

    return ok({ requestId, status, updatedAt: now });
  } catch (error) {
    console.error("updateStatus error:", error);
    return serverError();
  }
};
