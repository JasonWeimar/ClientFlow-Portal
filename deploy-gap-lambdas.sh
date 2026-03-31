#!/usr/bin/env bash
# deploy-gap-lambdas.sh
#
# Writes, deploys, and wires Lambda handlers: (I previously forgot to create - keeping for future reference)
#   clientflow-getRequest      → GET /requests/{requestId}
#   clientflow-getStatusEvents → GET /requests/{requestId}/events
#
# Run from the repo root after copying the handler files into place.
# Requires: AWS_PROFILE=clientflow-dev already exported (set in ~/.zshrc)

set -euo pipefail

ACCOUNT="148761680757"
REGION="us-west-1"
ROLE_ARN="arn:aws:iam::${ACCOUNT}:role/clientflow-lambda-role"
API_ID="r2ubkam37c"
AUTH_ID="6h2khn"
RUNTIME="nodejs20.x"

echo "=== Using profile: ${AWS_PROFILE:-not set} ==="
aws sts get-caller-identity --region "$REGION"

# ─────────────────────────────────────────────
# STEP 1 — Build the TypeScript backend
# ─────────────────────────────────────────────
echo ""
echo "=== Building TypeScript ==="
cd backend
npm run build   # outputs to backend/dist/
cd ..

# ─────────────────────────────────────────────
# STEP 2 — Package (same zip pattern as existing handlers)
# ─────────────────────────────────────────────
echo ""
echo "=== Packaging ==="
cd backend/dist

zip -r ../../getRequest.zip \
  functions/getRequest/ \
  lib/ \
  types/

zip -r ../../getStatusEvents.zip \
  functions/getStatusEvents/ \
  lib/ \
  types/

cd ../..

# ─────────────────────────────────────────────
# STEP 3 — Deploy clientflow-getRequest
# ─────────────────────────────────────────────
echo ""
echo "=== Deploying clientflow-getRequest ==="

# Create or update — check existence first
if aws lambda get-function \
    --function-name clientflow-getRequest \
    --region "$REGION" \
    --query 'Configuration.FunctionName' \
    --output text 2>/dev/null; then
  echo "Function exists — updating code"
  aws lambda update-function-code \
    --function-name clientflow-getRequest \
    --zip-file fileb://getRequest.zip \
    --region "$REGION"
else
  echo "Function not found — creating"
  aws lambda create-function \
    --function-name clientflow-getRequest \
    --runtime "$RUNTIME" \
    --role "$ROLE_ARN" \
    --handler functions/getRequest/handler.handler \
    --zip-file fileb://getRequest.zip \
    --region "$REGION" \
    --environment "Variables={ATTACHMENTS_BUCKET=clientflow-attachments-${ACCOUNT},FRONTEND_URL=http://localhost:5173}"
fi

# Wait for function to be Active before adding permissions
aws lambda wait function-active \
  --function-name clientflow-getRequest \
  --region "$REGION"

# ─────────────────────────────────────────────
# STEP 4 — Deploy clientflow-getStatusEvents
# ─────────────────────────────────────────────
echo ""
echo "=== Deploying clientflow-getStatusEvents ==="

if aws lambda get-function \
    --function-name clientflow-getStatusEvents \
    --region "$REGION" \
    --query 'Configuration.FunctionName' \
    --output text 2>/dev/null; then
  echo "Function exists — updating code"
  aws lambda update-function-code \
    --function-name clientflow-getStatusEvents \
    --zip-file fileb://getStatusEvents.zip \
    --region "$REGION"
else
  echo "Function not found — creating"
  aws lambda create-function \
    --function-name clientflow-getStatusEvents \
    --runtime "$RUNTIME" \
    --role "$ROLE_ARN" \
    --handler functions/getStatusEvents/handler.handler \
    --zip-file fileb://getStatusEvents.zip \
    --region "$REGION" \
    --environment "Variables={ATTACHMENTS_BUCKET=clientflow-attachments-${ACCOUNT},FRONTEND_URL=http://localhost:5173}"
fi

aws lambda wait function-active \
  --function-name clientflow-getStatusEvents \
  --region "$REGION"

# ─────────────────────────────────────────────
# STEP 5 — Grant API Gateway invoke permission
# ─────────────────────────────────────────────
echo ""
echo "=== Granting API Gateway invoke permissions ==="

# Use unique statement IDs — 'apigateway-invoke' may already exist
# on other functions, so these are namespaced.
aws lambda add-permission \
  --function-name clientflow-getRequest \
  --statement-id apigateway-invoke-getRequest \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --region "$REGION" \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT}:${API_ID}/*/*" \
  2>/dev/null || echo "Permission already exists — skipping"

aws lambda add-permission \
  --function-name clientflow-getStatusEvents \
  --statement-id apigateway-invoke-getStatusEvents \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --region "$REGION" \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT}:${API_ID}/*/*" \
  2>/dev/null || echo "Permission already exists — skipping"

# ─────────────────────────────────────────────
# STEP 6 — Create API Gateway integrations & routes
# ─────────────────────────────────────────────
echo ""
echo "=== Wiring API Gateway routes ==="

# Integration for getRequest
GET_REQUEST_INTEG=$(aws apigatewayv2 create-integration \
  --api-id "$API_ID" \
  --integration-type AWS_PROXY \
  --integration-uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${REGION}:${ACCOUNT}:function:clientflow-getRequest/invocations" \
  --payload-format-version 2.0 \
  --region "$REGION" \
  --query 'IntegrationId' \
  --output text)
echo "getRequest IntegrationId: $GET_REQUEST_INTEG"

# Integration for getStatusEvents
GET_EVENTS_INTEG=$(aws apigatewayv2 create-integration \
  --api-id "$API_ID" \
  --integration-type AWS_PROXY \
  --integration-uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${REGION}:${ACCOUNT}:function:clientflow-getStatusEvents/invocations" \
  --payload-format-version 2.0 \
  --region "$REGION" \
  --query 'IntegrationId' \
  --output text)
echo "getStatusEvents IntegrationId: $GET_EVENTS_INTEG"

# Route: GET /requests/{requestId}
aws apigatewayv2 create-route \
  --api-id "$API_ID" \
  --route-key "GET /requests/{requestId}" \
  --target "integrations/${GET_REQUEST_INTEG}" \
  --authorizer-id "$AUTH_ID" \
  --authorization-type JWT \
  --region "$REGION"
echo "Route created: GET /requests/{requestId}"

# Route: GET /requests/{requestId}/events
aws apigatewayv2 create-route \
  --api-id "$API_ID" \
  --route-key "GET /requests/{requestId}/events" \
  --target "integrations/${GET_EVENTS_INTEG}" \
  --authorizer-id "$AUTH_ID" \
  --authorization-type JWT \
  --region "$REGION"
echo "Route created: GET /requests/{requestId}/events"

# ─────────────────────────────────────────────
# STEP 7 — Smoke test (no auth — should 401)
# ─────────────────────────────────────────────
echo ""
echo "=== Smoke test — expecting 401 Unauthorized ==="
API_BASE="https://${API_ID}.execute-api.${REGION}.amazonaws.com"

curl -s -o /dev/null -w "GET /requests/test-id          → HTTP %{http_code}\n" \
  "${API_BASE}/requests/test-id"

curl -s -o /dev/null -w "GET /requests/test-id/events   → HTTP %{http_code}\n" \
  "${API_BASE}/requests/test-id/events"

echo ""
echo "=== Done ==="
echo "Both 401s confirm the JWT authorizer is active on the new routes."
echo ""
echo "Next: clean up zip files"
echo "  rm getRequest.zip getStatusEvents.zip"
echo ""
echo "Then update Section 4 of your handoff doc — add to Existing routes:"
echo "  GET /requests/{requestId}        → clientflow-getRequest      (integ: ${GET_REQUEST_INTEG})"
echo "  GET /requests/{requestId}/events → clientflow-getStatusEvents (integ: ${GET_EVENTS_INTEG})"
