// backend/src/functions/getStatusEvents/handler.ts
//
// GET /requests/{requestId}/events
//
// Returns all StatusEvent items for a given requestId from
// cf-status-events, sorted oldest → newest (chronological order
// matches how StatusTimeline renders the audit trail).
//
// Auth: JWT required.
// Authorization: clients may only fetch events for their own requests;
//               admins may fetch events for any request.
// This handler calls getRequest's ownership logic by re-querying
// cf-requests rather than duplicating the check inline — keeps the
// authorization rule in one place.

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../lib/dynamo";
import { ok, unauthorized, serverError } from "../../lib/response";
import type { ServiceRequest, StatusEvent } from "../../types";

function isAdmin(claims: Record<string, unknown>): boolean {
  const groups = (claims["cognito:groups"] as string | undefined) ?? "";
  return groups
    .replace(/^\[|\]$/g, "")
    .split(" ")
    .includes("admin");
}

const notFound = (msg = "Not found"): APIGatewayProxyResult => ({
  statusCode: 404,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin":
      process.env.FRONTEND_URL ?? "http://localhost:5173",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  },
  body: JSON.stringify({ error: msg }),
});

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    const callerId = claims?.sub as string | undefined;

    if (!callerId) return unauthorized();

    const requestId = event.pathParameters?.requestId;

    if (!requestId) {
      return notFound("requestId path parameter is required");
    }

    // --- Authorization check ---
    // Non-admins must own the request. Fetch the request first so we
    // can verify clientId. This also naturally returns 404 if the
    // requestId doesn't exist, which is the correct behaviour.
    if (!isAdmin(claims as Record<string, unknown>)) {
      const ownerCheck = await docClient.send(
        new QueryCommand({
          TableName: "cf-requests",
          KeyConditionExpression: "requestId = :rid",
          ExpressionAttributeValues: { ":rid": requestId },
          Limit: 1,
          // Fetch only the fields needed for the auth check.
          ProjectionExpression: "requestId, clientId",
        }),
      );

      const requestItem = ownerCheck.Items?.[0] as
        | Pick<ServiceRequest, "requestId" | "clientId">
        | undefined;

      if (!requestItem) return notFound("Request not found");

      if (requestItem.clientId !== callerId) {
        return notFound("Request not found"); // 404, not 403
      }
    }

    // --- Fetch all status events for this requestId ---
    // cf-status-events: PK = requestId (HASH), createdAt (RANGE).
    // Querying by hash key returns all events; DynamoDB returns them
    // in ascending createdAt order by default (oldest first), which
    // is exactly what StatusTimeline expects.
    const eventsResult = await docClient.send(
      new QueryCommand({
        TableName: "cf-status-events",
        KeyConditionExpression: "requestId = :rid",
        ExpressionAttributeValues: { ":rid": requestId },
        // ScanIndexForward: true is the default (ascending by sort key).
        // Explicit here for clarity and resilience against future changes.
        ScanIndexForward: true,
      }),
    );

    const events = (eventsResult.Items ?? []) as StatusEvent[];

    return ok(events);
  } catch (error) {
    console.error("getStatusEvents error:", error);
    return serverError();
  }
};
