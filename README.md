<div align="center">

# ClientFlow Portal

### A full-stack serverless web application for service business client management

[![AWS](https://img.shields.io/badge/AWS-Certified_Developer_Associate-FF9900?style=flat&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/certification/certified-developer-associate/)
[![React](https://img.shields.io/badge/React_18-TypeScript-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

<!-- **[🚀 Live Demo](https://YOUR_CLOUDFRONT_URL.cloudfront.net)** · **[📐 Architecture Diagram](#architecture)** · **[🛠 Local Setup](#local-development)** -->

[![Figma Screens](https://img.shields.io/badge/Figma-Screens_&_Wireframes-F24E1E?style=flat&logo=figma&logoColor=white)](https://www.figma.com/proto/oJFmuI4LtDbxAclJpWCB4D/02-Screens-Desktop?page-id=0%3A1&node-id=10-2&p=f&viewport=-201%2C410%2C0.08&t=7LZr5Vkwwvbm912B-1&scaling=min-zoom&content-scaling=fixed&starting-point-node-id=10%3A2)
[![Figma Design System](https://img.shields.io/badge/Figma-Design_System-F24E1E?style=flat&logo=figma&logoColor=white)](https://www.figma.com/design/aPbyMgNMgebBi6W58bnjY3/01-Design-System?node-id=48-8&t=DVKvouhTxbgukO8o-1)

</div>

---

## What Is This?

ClientFlow Portal is a production-grade, full-stack web application that solves a real problem: **service businesses managing client requests through fragmented email chains and spreadsheets.**

It provides:

- A **public marketing site** for the service provider
- A **client portal** — authenticated, personal dashboard where clients submit and track service requests
- An **admin dashboard** — for the provider to triage requests, update statuses, and send notifications

> **Hire-Me Context:** This is the flagship project in my AWS + React portfolio — designed to demonstrate production cloud architecture patterns, front-end engineering depth, and end-to-end product thinking to engineers, hiring managers, and recruiters evaluating my work.

---

## The Problem → Solution Story

**The problem:** A freelancer or small agency receives service inquiries through email. There is no structured intake, no status visibility for the client, no audit trail for the provider, and no automated communication — just an inbox that becomes unmanageable.

**The solution:** A purpose-built client portal with structured request intake, real-time status tracking, file attachments, and automated email notifications — all hosted on AWS with zero server management overhead.

**Why I built it this way:** The architecture maps directly to how modern cloud-native SaaS products are built. Every service choice reflects a real-world tradeoff that comes up in engineering interviews and daily production work.

---

## Live Demo

| Role       | Login                                 | What to Try                                                               |
| ---------- | ------------------------------------- | ------------------------------------------------------------------------- |
| **Client** | Sign up with your email               | Submit a request with a file attachment, watch status update in dashboard |
| **Admin**  | Request admin access via contact form | Approve/reject requests, see how EventBridge triggers email notifications |

> Demo environment uses AWS SES sandbox — email notifications deliver to verified addresses only.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                             │
│              React 18 · TypeScript · TailwindCSS · Vite             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS EDGE LAYER                              │
│   CloudFront CDN  ──────────────────────────  API Gateway HTTP API  │
│   (SPA hosting)                                (JWT Authorizer)     │
└──────────┬──────────────────────────────────────────┬──────────────┘
           │                                          │ Cognito JWT
           ▼                                          ▼ validation
┌──────────────────┐                    ┌─────────────────────────────┐
│   S3 Bucket      │                    │       AWS LAMBDA            │
│   (React build)  │                    │                             │
│   Private +      │                    │  createRequest              │
│   OAC policy     │                    │  getRequests                │
└──────────────────┘                    │  updateStatus ──────────────┼──┐
                                        │  getPresignedUrl            │  │ PutEvents
                                        │  sendNotification ◄─────────┼──┤
                                        └──────────┬──────────────────┘  │
                                                   │                      │
                              ┌────────────────────┤         ┌────────────▼──────────┐
                              │                    │         │    EventBridge         │
                              ▼                    ▼         │    Default Bus         │
                   ┌──────────────────┐  ┌─────────────┐    │  Rule: StatusChanged   │
                   │   DynamoDB       │  │   S3 Bucket │    └────────────────────────┘
                   │                  │  │ (Attachments│
                   │  cf-requests     │  │  Private +  │
                   │  cf-status-events│  │  Pre-signed │
                   │  cf-users        │  │  URLs)      │
                   │  cf-admin-notes  │  └─────────────┘
                   └──────────────────┘
                                        ┌─────────────────────────────┐
                                        │   AWS Cognito User Pool      │
                                        │   · Email/password auth      │
                                        │   · JWT token issuance       │
                                        │   · admin group membership   │
                                        └─────────────────────────────┘
                                        ┌─────────────────────────────┐
                                        │   Amazon SES                 │
                                        │   · Request confirmation     │
                                        │   · Status change alerts     │
                                        └─────────────────────────────┘
                                        ┌─────────────────────────────┐
                                        │   CloudWatch                 │
                                        │   · Lambda error alarms      │
                                        │   · Logs Insights queries    │
                                        │   · Metrics dashboard        │
                                        └─────────────────────────────┘
```

---

## AWS Services — What Each One Does and Why

This project intentionally uses 9 AWS services to cover the full DVA-C02 certification knowledge domain. Each service was chosen for a specific architectural reason — not to inflate the service count.

| Service                       | Role in ClientFlow                              | Why This Service (Not an Alternative)                                                                                                                                                                                |
| ----------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cognito**                   | User auth, JWT token issuance, group-based RBAC | Handles the entire auth lifecycle — registration, email verification, login, token refresh, password reset — without custom auth code. Eliminates a class of security vulnerabilities.                               |
| **API Gateway (HTTP API v2)** | REST endpoint layer, JWT authorization          | HTTP API v2 costs 70% less than REST API v1 and adds ~1ms latency vs direct Lambda URLs. The native JWT Authorizer validates Cognito tokens on every request without invoking Lambda — keeping hot paths fast.       |
| **Lambda**                    | All business logic                              | Zero servers to manage, scales to zero (no idle cost), per-invocation billing. Each function has a single responsibility — easy to test, deploy, and reason about independently.                                     |
| **DynamoDB**                  | Primary datastore                               | Serverless, single-digit millisecond latency, scales automatically, native integration with Lambda. On-demand billing means the project costs ~$0/month at demo traffic.                                             |
| **S3**                        | File attachments + React SPA hosting            | Pre-signed URLs let browsers upload directly to S3 — the file never passes through Lambda, staying within Lambda's 6MB payload limit and keeping function duration minimal.                                          |
| **CloudFront**                | Global CDN, HTTPS, SPA routing                  | Origin Access Control (OAC) policy means the frontend S3 bucket is fully private — CloudFront is the only authorized reader. Custom 404→200 error response enables React Router client-side routing.                 |
| **SES**                       | Transactional email                             | Managed email delivery with bounce/complaint handling built in. Starting in sandbox mode (legitimate for a demo) with a clear path to production access.                                                             |
| **EventBridge**               | Async event-driven notification pipeline        | Decouples `updateStatus` Lambda from email delivery. Core logic succeeds regardless of SES availability. New notification channels (Slack, SMS) are added as EventBridge targets with zero changes to existing code. |
| **IAM**                       | Least-privilege execution roles                 | Each Lambda has a scoped role: only the exact DynamoDB tables it reads/writes, only the S3 bucket it accesses, only the SES `SendEmail` action. No wildcard resource policies.                                       |
| **CloudWatch**                | Observability                                   | Lambda error alarms, duration metrics, Logs Insights queries for debugging, billing alarm to prevent cost surprises.                                                                                                 |

---

## Frontend Architecture

### Tech Stack Rationale

| Tool                        | Why It Was Chosen                                                                                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React 18**                | Industry standard for component-based UIs. Demonstrates hooks, custom hooks, context, concurrent features, and component composition — all visible in this codebase.                                           |
| **TypeScript**              | Static typing eliminates runtime errors from mismatched API response shapes. Every API response, form value, and component prop is typed. The same Zod schemas validate both frontend forms and Lambda inputs. |
| **TailwindCSS**             | Utility-first styling eliminates CSS specificity conflicts. Custom design tokens in `tailwind.config.ts` enforce a consistent design system. All styling decisions are visible inline — no hidden global CSS.  |
| **TanStack Query**          | Server state management with caching, background refetch, optimistic updates, and loading/error states. Replaces ad-hoc `useEffect` data fetching with a purpose-built, production-proven pattern.             |
| **React Hook Form + Zod**   | Schema-driven form validation. The Zod schema is the single source of truth for validation rules — shared between the frontend form and the Lambda handler.                                                    |
| **AWS Amplify (Auth only)** | Handles Cognito SRP auth flow, token storage, and silent refresh. Using only the `Auth` category keeps the bundle lean.                                                                                        |
| **Vite**                    | ESM-native build tool with HMR. Content-hashed output filenames enable long-term CloudFront caching with instant cache invalidation on deploy.                                                                 |

### Folder Structure (Feature-First)

```
frontend/src/
├── components/
│   ├── ui/           # Base primitives: Button, Input, Badge, Modal
│   └── layout/       # Navbar, Sidebar, Footer, PageWrapper
├── features/
│   ├── auth/         # Login, SignUp, ConfirmEmail pages + auth flow
│   ├── marketing/    # Public homepage, services, how-it-works
│   ├── client/       # Client dashboard, request list, request detail
│   ├── admin/        # Admin dashboard, request management, notes
│   └── requests/     # Submit form, status badge, shared request types
├── hooks/            # useAuth, useRequests, useToast (global custom hooks)
├── lib/              # apiClient (Axios + JWT interceptor), queryClient
├── services/         # API call functions — one file per resource domain
├── types/            # Shared TypeScript interfaces + Zod schemas
├── utils/            # Pure functions: formatDate, cn(), statusColor()
└── router/           # Route config, ProtectedRoute, AdminRoute guards
```

---

## Core User Flows

### Client: Submit a Service Request

```
Client fills form → Zod validates inputs → [optional] GET /upload-url
→ Browser PUTs file directly to S3 via pre-signed URL
→ POST /requests with form data + S3 object key
→ API Gateway validates Cognito JWT
→ createRequest Lambda writes to DynamoDB
→ Lambda triggers SES confirmation email to client
→ Lambda triggers SES alert email to admin
→ TanStack Query cache invalidated → dashboard refreshes
```

### Admin: Approve a Request (Event-Driven)

```
Admin clicks "Approve" → PATCH /requests/{id}/status
→ API Gateway verifies admin Cognito group membership
→ updateStatus Lambda updates DynamoDB item
→ Lambda appends immutable StatusEvent (audit trail)
→ Lambda publishes StatusChanged event to EventBridge
→ EventBridge rule matches → invokes sendNotification Lambda
→ sendNotification sends SES email to client
→ updateStatus returns 200 immediately (email is async/decoupled)
```

---

## Data Model

### DynamoDB Tables

```
cf-requests
  PK: requestId (UUID)       SK: clientId (Cognito sub)
  Attributes: serviceType, description, preferredDate, status,
              attachmentKey, clientEmail, createdAt, updatedAt

cf-status-events  (immutable audit trail — append only)
  PK: requestId (UUID)       SK: createdAt (ISO timestamp)
  Attributes: previousStatus, newStatus, changedBy, note

cf-users
  PK: userId (Cognito sub)
  Attributes: email, displayName, role, createdAt

cf-admin-notes
  PK: requestId (UUID)       SK: noteId (UUID)
  Attributes: content, authorId, visibleToClient, createdAt
```

### Request Status State Machine

```
PENDING → IN_REVIEW → APPROVED → COMPLETED
              ↓
           REJECTED
```

Every transition is recorded as an immutable `StatusEvent` — providing a complete, queryable audit trail.

---

## Key Engineering Decisions (Interview-Ready)

**Why HTTP API v2 instead of REST API v1?**
HTTP API v2 is 71% cheaper ($1.00/M vs $3.50/M requests), has lower latency, and natively supports JWT authorizers. REST API v1 is only preferable when you need request/response transformations, usage plans, or API keys — none of which this application requires.

**Why pre-signed URLs for file uploads instead of base64-encoding in the request body?**
Lambda has a 6MB synchronous payload limit and bills for execution duration. Passing files through Lambda would hit the payload limit for any file over 4MB and inflate Lambda duration (= cost). Pre-signed URLs let the browser PUT directly to S3 — Lambda only generates a temporary credential, taking ~10ms.

**Why EventBridge for notifications instead of calling SES directly from `updateStatus`?**
Direct coupling means `updateStatus` fails if SES is degraded. With EventBridge, `updateStatus` succeeds regardless of downstream availability. The event is durably stored and retried. Adding a Slack notification later requires zero changes to `updateStatus` — just add a new EventBridge target.

**Why DynamoDB instead of RDS/PostgreSQL?**
This application has simple, well-defined access patterns (get by requestId, get by clientId) that map cleanly to DynamoDB key-value lookups. DynamoDB on-demand costs ~$0/month at demo scale vs RDS minimum ~$15/month for a db.t4g.micro. For a demo project that needs to stay live indefinitely for recruiters, this is the correct cost/capability trade-off.

**Why block all public S3 access and use CloudFront OAC?**
Direct S3 public URLs expose your bucket to hotlinking, bypass CloudFront's HTTPS enforcement, and create an inconsistent experience (S3 URLs vs custom domain). OAC means CloudFront is the only authorized reader — the bucket is fully private, all traffic goes through the CDN, and HTTPS is enforced globally.

---

## DVA-C02 Knowledge Domain Coverage

| Domain                        | How It's Demonstrated in This Project                                                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Security**                  | IAM least-privilege roles scoped per function, Cognito SRP auth, JWT authorizer, S3 block public access, pre-signed URL access control                           |
| **Development**               | AWS SDK v3 modular imports (tree-shaking for cold start optimization), DynamoDB DocumentClient marshalling, S3 pre-signed URL generation, SES `SendEmailCommand` |
| **Deployment**                | S3 + CloudFront SPA deployment, GitHub Actions CI/CD, Lambda versioning, API Gateway stages, CloudFront cache invalidation strategy                              |
| **Troubleshooting**           | CloudWatch Logs Insights queries, Lambda error rate alarms, duration metrics, cold start analysis via `@initDuration` metric                                     |
| **Refactoring to Serverless** | Entire backend is serverless — no EC2, no always-on servers, auto-scaling compute, pay-per-request DynamoDB, event-driven side effects                           |
| **Event-Driven Architecture** | EventBridge rule/target pattern, PutEvents from Lambda, decoupled notification delivery, at-least-once delivery semantics                                        |

---

## Local Development

### Prerequisites

```bash
node --version    # v20 LTS required
aws --version     # AWS CLI v2 required
aws sts get-caller-identity   # Must return your account info
```

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/clientflow-portal.git
cd clientflow-portal

cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure environment variables

```bash
# frontend/.env.local
VITE_API_BASE_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_AWS_REGION=us-east-1
```

### 3. Run the development server

```bash
cd frontend
npm run dev
# App running at http://localhost:5173
```

### 4. Build and deploy (after AWS infrastructure is provisioned)

```bash
cd frontend
npm run build
aws s3 sync dist/assets/ s3://YOUR_FRONTEND_BUCKET/assets/ \
  --cache-control 'public, max-age=31536000, immutable'
aws s3 cp dist/index.html s3://YOUR_FRONTEND_BUCKET/index.html \
  --cache-control 'no-cache, no-store, must-revalidate'
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID --paths '/*'
```

Full infrastructure setup is documented in the [Walkthrough Guide](docs/ClientFlow-Portal-Walkthrough.docx).

---

## Project Cost

This application is designed to run live indefinitely at near-zero cost — a deliberate architectural choice for portfolio projects.

| Service              | Free Tier                           | Cost at Demo Traffic |
| -------------------- | ----------------------------------- | -------------------- |
| Lambda               | 1M req/mo free forever              | ~$0.00               |
| API Gateway HTTP API | 1M calls/mo (12 mo)                 | ~$1.00/mo after      |
| DynamoDB             | 25GB + WCU/RCU free forever         | $0.00                |
| S3                   | 5GB + requests (12 mo)              | <$0.10/mo            |
| CloudFront           | 1TB + 10M requests (12 mo)          | $0.00                |
| Cognito              | 50,000 MAUs free forever            | $0.00                |
| SES                  | 62,000 emails/mo free (from Lambda) | $0.00                |
| **Total**            |                                     | **$0–$2/month**      |

Serverless + on-demand pricing means you pay for actual usage. A demo project with typical recruiter traffic costs less than a cup of coffee per month.

---

## What This Project Proves

**To a recruiter (30-second scan):**
Full-stack AWS + React developer. Shipped a real product — not a tutorial clone. Has both cloud certifications and working code to back them up.

**To a hiring manager (2-minute review):**
Understands the full product lifecycle: design → infrastructure → backend → frontend → deployment → observability. Makes deliberate architectural choices and can explain the trade-offs.

**To an engineer (5-minute code review):**

- TypeScript throughout — no `any` shortcuts
- Shared Zod schemas between frontend and Lambda (schema-driven design)
- IAM least-privilege — every policy scoped to exact resources
- Pre-signed URL pattern — files never pass through Lambda
- EventBridge decoupling — core logic is isolated from side effects
- Content-hashed assets — correct CloudFront caching strategy
- TanStack Query — proper server state management, not `useEffect` soup
- Feature-first folder structure — scalable, professional code organization

---

## Roadmap (Phase 3)

- [ ] AWS CDK — all infrastructure as TypeScript code (`cdk deploy` from scratch)
- [ ] DynamoDB single-table design with GSI access patterns
- [ ] API idempotency keys on `createRequest`
- [ ] AWS Secrets Manager for all sensitive config
- [ ] Custom domain + ACM certificate via Route 53
- [ ] AWS X-Ray distributed tracing

---

## About

Built as the flagship project in a hire-me package demonstrating AWS cloud development and modern React engineering.

**Certifications:** AWS Certified Developer – Associate (DVA-C02) · AWS Cloud Practitioner (CLF-C02)

**Stack:** React 18 · TypeScript · TailwindCSS · Vite · TanStack Query · React Hook Form · Zod · AWS SDK v3

**Infrastructure:** Lambda · API Gateway · DynamoDB · S3 · CloudFront · Cognito · SES · EventBridge · IAM · CloudWatch

---

<div align="center">

**[🚀 Live Demo](https://YOUR_CLOUDFRONT_URL.cloudfront.net)** · **[💼 Portfolio](https://YOUR_PORTFOLIO_SITE.com)** · **[🔗 LinkedIn](https://linkedin.com/in/YOUR_PROFILE)**

</div>
