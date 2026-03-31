// backend/src/functions/getRequest/handler.ts
//
// GET /requests/{requestId}
//
// Returns a single ServiceRequest item from cf-requests.
// Auth: JWT required (all authenticated users).
// Authorization: clients may only fetch their own request;
//               admins (Cognito group "admin") may fetch any request.
// Returns 404 when the item does not exist so the frontend
// can distinguish "not found" from a server error.

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../lib/dynamo";
import { ok, unauthorized, serverError } from "../../lib/response";
import type { ServiceRequest } from "../../types";

// HTTP API v2 JWT authorizer puts Cognito groups as a
// space-separated string, NOT an array — split before checking.
function isAdmin(claims: Record<string, unknown>): boolean {
  const groups = (claims["cognito:groups"] as string | undefined) ?? "";
  return groups.split(" ").includes("admin");
}

// Inline 404 helper — not in the shared response lib yet.
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

    // requestId comes from the path parameter: /requests/{requestId}
    const requestId = event.pathParameters?.requestId;

    if (!requestId) {
      return notFound("requestId path parameter is required");
    }

    // cf-requests has a composite key (requestId HASH + clientId RANGE).
    // Only have requestId here, so QueryCommand on the hash key is used
    // to retrieve the item — GetCommand would require both keys.
    const result = await docClient.send(
      new QueryCommand({
        TableName: "cf-requests",
        KeyConditionExpression: "requestId = :rid",
        ExpressionAttributeValues: { ":rid": requestId },
        Limit: 1,
      }),
    );

    const item = result.Items?.[0] as ServiceRequest | undefined;

    if (!item) return notFound("Request not found");

    // Clients can only see their own requests.
    // Admins can see any request.
    if (
      !isAdmin(claims as Record<string, unknown>) &&
      item.clientId !== callerId
    ) {
      return notFound("Request not found"); // 404, not 403 — don't leak existence
    }

    return ok(item);
  } catch (error) {
    console.error("getRequest error:", error);
    return serverError();
  }
};
