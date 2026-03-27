import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// DynamoDBClient is the low-level client that speaks the raw DynamoDB
// wire protocol — all values must be wrapped in type descriptors
// like { S: "hello" } or { N: "42" }.
const dynamoClient = new DynamoDBClient({
  // Reads from Lambda environment variable at runtime.
  // Fallback to us-west-1 matches the project region — never us-east-1.
  region: process.env.AWS_REGION ?? "us-west-1",
});

// DynamoDBDocumentClient wraps the low-level client and handles
// marshalling automatically — plain JS objects in, plain JS objects out.
// No { S: "hello" } syntax needed anywhere in the handlers.
export const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    // Do not convert empty strings to null — preserve them as-is.
    // Avoids silent data corruption on fields the client left blank.
    convertEmptyValues: false,
    // Strip undefined fields before writing to DynamoDB.
    // Prevents "Member must not be null" errors on optional attributes.
    removeUndefinedValues: true,
  },
});
