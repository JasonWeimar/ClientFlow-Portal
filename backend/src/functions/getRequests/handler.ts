// Handles GET /requests
// Clients see only their own requests (filtered by clientId).
// Admins see all requests (full table scan).
// Admin status is determined by the "cognito:groups" claim injected
// by the JWT authorizer — no separate DB lookup needed.
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../lib/dynamo";
import { ok, unauthorized, serverError } from "../../lib/response";

const TABLE = "cf-requests";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    // JWT authorizer injects claims — sub is the Cognito user ID,
    // cognito:groups is an array of group names the user belongs to.
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    const clientId = claims?.sub as string | undefined;
    if (!clientId) return unauthorized();

    // Cognito injects groups as a space-separated string in HTTP API JWT authorizer,
    // not an array — split it to check membership safely.
    const rawGroups = (claims?.["cognito:groups"] as string) ?? "";
    const groups = rawGroups.split(" ").filter(Boolean);
    const isAdmin = groups.includes("admin");

    if (isAdmin) {
      // Admins get all requests — full table scan.
      // Acceptable at portfolio scale; revisit with pagination for production.
      const result = await docClient.send(
        new ScanCommand({ TableName: TABLE }),
      );
      return ok(result.Items ?? []);
    }

    // Clients only see their own requests — query by clientId GSI or
    // filter expression. Since clientId is the RANGE key on cf-requests,
    // use a Query with a KeyConditionExpression on the GSI.
    // cf-requests schema: PK = requestId (HASH), clientId (RANGE)
    // To query by clientId we need a FilterExpression on the Scan,
    // or a GSI. Using FilterExpression here — sufficient for portfolio scale.
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: "clientId = :cid",
        ExpressionAttributeValues: { ":cid": clientId },
      }),
    );
    return ok(result.Items ?? []);
  } catch (error) {
    console.error("getRequests error:", error);
    return serverError();
  }
};
