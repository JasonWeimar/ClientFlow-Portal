<div align="center">

# ClientFlow Portal

### A full-stack serverless client portal built on AWS — designed, engineered, and deployed end-to-end

[![AWS DVA-C02](https://img.shields.io/badge/AWS-Certified_Developer_Associate-FF9900?style=flat&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/certification/certified-developer-associate/)
[![AWS CLF-C02](https://img.shields.io/badge/AWS-Cloud_Practitioner-FF9900?style=flat&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/certification/certified-cloud-practitioner/)
[![React](https://img.shields.io/badge/React_18-TypeScript-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Live Demo - https://d2m1l4se2aia7z.cloudfront.net** · **[📐 Architecture](#architecture)** · **[🛠 Local Setup](#local-development)**

[![Figma Screens](https://img.shields.io/badge/Figma-Screens_&_Wireframes-F24E1E?style=flat&logo=figma&logoColor=white)](https://www.figma.com/proto/oJFmuI4LtDbxAclJpWCB4D/02-Screens-Desktop?page-id=0%3A1&node-id=10-2&p=f&viewport=-201%2C410%2C0.08&t=7LZr5Vkwwvbm912B-1&scaling=min-zoom&content-scaling=fixed&starting-point-node-id=10%3A2)
[![Figma Design System](https://img.shields.io/badge/Figma-Design_System-F24E1E?style=flat&logo=figma&logoColor=white)](https://www.figma.com/design/aPbyMgNMgebBi6W58bnjY3/01-Design-System?node-id=48-8&t=DVKvouhTxbgukO8o-1)

</div>

---

## What Is This?

ClientFlow Portal is a production-grade, full-stack web application that solves a real problem: **service businesses lose hours every week managing client requests through fragmented email chains and spreadsheets.**

Three surfaces — one coherent product:

- **Public marketing site** — landing page, feature overview, conversion CTAs
- **Client portal** — authenticated dashboard to submit requests, upload files, and track status history
- **Admin dashboard** — triage queue, status management, internal notes, and event-driven email notifications

> **Hire-Me Context:** This is the flagship project in my AWS + React portfolio — built to demonstrate production cloud architecture, full product lifecycle thinking (Figma → infrastructure → code → CI/CD), and engineering depth that goes beyond tutorial clones.

---

## The Problem → Solution

**The problem:** A freelancer or small agency receives service inquiries through email. No structured intake. No status visibility for the client. No audit trail for the provider. Just an inbox that becomes unmanageable at scale.

**The solution:** A purpose-built client portal — structured request intake, real-time status tracking, file attachments via S3 pre-signed URLs, and automated email notifications via EventBridge + SES — all hosted serverlessly on AWS with $0–$2/month operating cost.

**Why this architecture:** Every service choice reflects a real-world tradeoff. HTTP API v2 over REST API v1 (cost + latency). DynamoDB over RDS (access patterns + on-demand pricing). EventBridge over direct SES calls (decoupling + resilience). Pre-signed URLs over Lambda file proxying (payload limits + cost). See [Key Engineering Decisions](#key-engineering-decisions-interview-ready) for the full rationale.

---

## Live Demo

| Role       | Credentials                         | What to Try                                                                                                                                                                              |
| ---------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Client** | Sign up with your email             | Submit a request with a file attachment — watch the status update in your dashboard in real time                                                                                         |
| **Admin**  | Admin demo access coming in Phase 3 | Approve and reject requests, add internal notes, observe the EventBridge → SES notification pipeline — admin credentials will be available once the public demo environment is finalized |

> Demo runs on AWS SES sandbox — email notifications deliver to verified addresses only.

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
│   (SPA hosting · OAC)                          (JWT Authorizer)     │
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
                   │   DynamoDB       │  │   S3 Bucket │    └───────────┬────────────┘
                   │                  │  │ (Attachments│               │
                   │  cf-requests     │  │  Private +  │    ┌───────────▼────────────┐
                   │  cf-status-events│  │  Pre-signed │    │   Amazon SES            │
                   │  cf-users        │  │  URLs)      │    │   Transactional email   │
                   │  cf-admin-notes  │  └─────────────┘    └────────────────────────┘
                   └──────────────────┘
                                        ┌─────────────────────────────┐
                                        │   AWS Cognito User Pool      │
                                        │   · Email/password auth      │
                                        │   · JWT token issuance       │
                                        │   · admin group membership   │
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

9 AWS services — each chosen for a specific architectural reason, not to inflate the count. Every choice maps to a DVA-C02 knowledge domain.

| Service                     | Role in ClientFlow                         | Why This Service                                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cognito**                 | User auth, JWT issuance, group-based RBAC  | Manages the full auth lifecycle — registration, verification, login, token refresh, password reset — without custom auth code. Eliminates an entire class of security vulnerabilities.                                 |
| **API Gateway HTTP API v2** | REST endpoint layer, JWT authorization     | 71% cheaper than REST API v1 ($1.00 vs $3.50 per million requests). Native JWT Authorizer validates Cognito tokens on every request without invoking Lambda — hot paths stay fast.                                     |
| **Lambda**                  | All business logic                         | Zero servers to manage, scales to zero (no idle cost), per-invocation billing. Single-responsibility functions — each independently testable and deployable.                                                           |
| **DynamoDB**                | Primary datastore                          | Serverless, single-digit millisecond latency, on-demand billing. Simple key-value access patterns (by requestId, by clientId) map cleanly — no joins needed.                                                           |
| **S3**                      | File attachments + React SPA hosting       | Pre-signed URLs let browsers upload directly to S3 — files never pass through Lambda. Stays well within Lambda's 6MB payload limit. Minimizes function duration and cost.                                              |
| **CloudFront**              | Global CDN, HTTPS enforcement, SPA routing | OAC policy keeps the S3 frontend bucket fully private — CloudFront is the only authorized reader. Custom 404→200 error response enables React Router client-side routing.                                              |
| **SES**                     | Transactional email notifications          | Managed delivery with bounce/complaint handling. Decoupled from the request API via EventBridge — SES degradation does not affect core request flow.                                                                   |
| **EventBridge**             | Async event-driven notification pipeline   | Decouples `updateStatus` Lambda from email delivery. Core logic succeeds regardless of SES availability. New notification channels (Slack, SMS) require only a new target rule — zero changes to existing Lambda code. |
| **IAM**                     | Least-privilege execution roles            | Each Lambda has a scoped role: exact DynamoDB tables it reads/writes, exact S3 bucket it accesses, exact SES action it can call. No wildcard resource policies anywhere.                                               |
| **CloudWatch**              | Observability + cost protection            | Lambda error rate alarms, duration metrics, Logs Insights queries for debugging, billing alarm at $5/month threshold.                                                                                                  |

---

## Frontend Architecture

### Tech Stack

| Tool                        | Why It Was Chosen                                                                                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React 18**                | Industry standard for component-based UIs. Demonstrates hooks, custom hooks, context, and component composition patterns visible throughout this codebase.                                                     |
| **TypeScript**              | Static typing eliminates runtime errors from mismatched API shapes. Every response, prop, and form value is typed. Shared Zod schemas validate both frontend forms and Lambda inputs from a single definition. |
| **TailwindCSS**             | Utility-first styling with a custom design token system in `tailwind.config.ts`. All visual decisions — colors, spacing, shadows — trace back to named tokens that match the Figma design system.              |
| **TanStack Query**          | Server state management with caching, background refetch, optimistic updates, and loading/error states — replacing ad-hoc `useEffect` data fetching with a production-proven pattern.                          |
| **React Hook Form + Zod**   | Schema-driven validation. The Zod schema is the single source of truth — shared between the frontend form and the Lambda handler input validation.                                                             |
| **AWS Amplify (Auth only)** | Handles Cognito SRP auth flow, token storage, and silent token refresh. Using only the `Auth` category keeps the bundle lean.                                                                                  |
| **Vite**                    | ESM-native build with HMR. Content-hashed asset filenames enable long-term CloudFront caching with instant cache invalidation on every deploy.                                                                 |

### Folder Structure (Feature-First)

```
frontend/src/
├── components/
│   ├── ui/           # Atomic primitives: Button, Input, Badge, Card, Modal, Spinner
│   └── layout/       # Structural shells: Navbar, Sidebar, PageWrapper
├── features/
│   ├── auth/         # Login, SignUp, ConfirmEmail pages + auth flow
│   ├── client/       # Client dashboard, request list, RequestCard
│   ├── admin/        # Admin dashboard, RequestTable, StatCard, AdminNoteForm
│   └── requests/     # StatusBadge, StatusTimeline, FileUploadZone, MetadataGrid
├── hooks/            # useAuth, useDebounce (global custom hooks)
├── lib/              # apiClient (Axios + JWT interceptor), cn() utility
├── api/              # API call functions — one file per resource domain
├── types/            # Shared TypeScript interfaces + RequestStatus/ServiceType enums
└── pages/            # Route-level page components (client/, admin/, auth/)
```

### Design System

The frontend is backed by a complete Figma design system — 28 extracted components, a full color token library, and a typography scale — all mapped 1:1 to `tailwind.config.ts` tokens and React component prop interfaces.

| Design file                                                                                   | Contents                                                   |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [Screens & Wireframes](https://www.figma.com/proto/oJFmuI4LtDbxAclJpWCB4D/02-Screens-Desktop) | All 7 screens · 15+ state variants · component instances   |
| [Design System](https://www.figma.com/design/aPbyMgNMgebBi6W58bnjY3/01-Design-System)         | Color styles · text styles · effect styles · 28 components |

---

## Core User Flows

### Client: Submit a Service Request

```
Client fills form → Zod validates inputs
→ [optional] GET /upload-url → browser PUTs file directly to S3 via pre-signed URL
→ POST /requests with form data + S3 object key
→ API Gateway validates Cognito JWT
→ createRequest Lambda writes to DynamoDB
→ Lambda triggers SES confirmation email to client + admin alert
→ TanStack Query cache invalidated → dashboard refetches and shows new request
```

### Admin: Update Request Status (Event-Driven)

```
Admin clicks "Approve" → PATCH /requests/{id}/status
→ API Gateway verifies admin Cognito group membership
→ updateStatus Lambda updates DynamoDB item status
→ Lambda appends immutable StatusEvent (append-only audit trail)
→ Lambda publishes StatusChanged event to EventBridge
→ EventBridge rule matches → invokes sendNotification Lambda
→ sendNotification Lambda sends SES status update email to client
→ updateStatus returns 200 immediately — email delivery is fully async and decoupled
```

---

## Data Model

### DynamoDB Tables

```
cf-requests
  PK: requestId (UUID)         SK: clientId (Cognito sub)
  Attributes: serviceType · description · preferredDate · status
              attachmentKey · clientEmail · createdAt · updatedAt

cf-status-events  (immutable audit trail — append-only)
  PK: requestId (UUID)         SK: createdAt (ISO timestamp)
  Attributes: previousStatus · newStatus · changedBy · note · adminOnly

cf-users
  PK: userId (Cognito sub)
  Attributes: email · displayName · role · createdAt

cf-admin-notes
  PK: requestId (UUID)         SK: noteId (UUID)
  Attributes: content · authorId · visibleToClient · createdAt
```

### Request Status State Machine

```
              ┌─────────┐
   submit     │ PENDING │
  ──────────► │         │
              └────┬────┘
                   │ admin reviews
                   ▼
              ┌───────────┐
              │ IN_REVIEW │
              └─────┬─────┘
                    │
          ┌─────────┴──────────┐
          ▼                    ▼
     ┌──────────┐         ┌──────────┐
     │ APPROVED │         │ REJECTED │
     └────┬─────┘         └──────────┘
          │ work complete
          ▼
     ┌───────────┐
     │ COMPLETED │
     └───────────┘
```

Every transition is recorded as an immutable `StatusEvent` — providing a complete, queryable audit trail.

---

## Key Engineering Decisions

**HTTP API v2 over REST API v1**
HTTP API v2 is 71% cheaper ($1.00/M vs $3.50/M), has lower latency, and natively supports JWT authorizers. REST API v1 only makes sense when you need request/response transformations, usage plans, or API keys — none of which this application requires at current scope.

**Pre-signed URLs for file uploads over Lambda proxying**
Lambda has a 6MB synchronous payload limit and bills for every millisecond of execution. Routing files through Lambda would hit the limit on any file over ~4MB and inflate function duration (= cost). Pre-signed URLs let the browser PUT directly to S3 — Lambda only generates a temporary credential (~10ms) and the file transfer happens entirely outside Lambda's billing window.

**EventBridge for notifications over direct SES calls**
Direct coupling means `updateStatus` fails if SES is degraded or rate-limited. With EventBridge, `updateStatus` succeeds regardless of downstream availability — the event is durably stored and retried by EventBridge automatically. Adding a Slack or SMS notification channel later requires zero changes to any existing Lambda function — add a new EventBridge target and it is done.

**DynamoDB over RDS/PostgreSQL**
This application's access patterns — get requests by clientId, get a single request by requestId — are simple key-value lookups that DynamoDB handles with single-digit millisecond latency. On-demand billing means ~$0/month at demo traffic vs ~$15/month minimum for the smallest RDS instance. For a demo that needs to stay live indefinitely for recruiters, this is the correct trade-off.

**S3 + CloudFront OAC over public S3 hosting**
Direct public S3 URLs expose the bucket to hotlinking, bypass HTTPS enforcement, and cannot be cached by a CDN. OAC policy makes the S3 bucket fully private — CloudFront is the only authorized reader. All traffic is served over HTTPS from edge locations globally. The custom 404→200 error response configuration is what makes React Router's client-side routing work correctly after a hard refresh.

---

## DVA-C02 Knowledge Domain Coverage

| Domain                        | How It Is Demonstrated                                                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Security**                  | IAM least-privilege roles scoped per Lambda, Cognito SRP auth, JWT authorizer on every route, S3 block-all-public-access, pre-signed URL time-limited access control          |
| **Development**               | AWS SDK v3 modular imports (tree-shaking for cold start reduction), DynamoDB DocumentClient marshalling, S3 pre-signed URL generation, SES `SendEmailCommand` pattern         |
| **Deployment**                | S3 + CloudFront SPA deployment with content-hash caching strategy, GitHub Actions CI/CD, API Gateway stages, CloudFront cache invalidation on every deploy                    |
| **Troubleshooting**           | CloudWatch Logs Insights queries, Lambda error rate alarms, duration metric dashboards, cold start analysis via `@initDuration`                                               |
| **Refactoring to Serverless** | Zero EC2 instances, zero always-on servers, auto-scaling compute, pay-per-request DynamoDB, event-driven side effects throughout                                              |
| **Event-Driven Architecture** | EventBridge rule/target pattern, `PutEvents` from Lambda, decoupled notification delivery, at-least-once delivery semantics, async decoupling of core logic from side effects |

---

## Local Development

### Prerequisites

```bash
node --version              # v20 LTS required
aws --version               # AWS CLI v2 required
aws sts get-caller-identity # Must return your IAM identity
```

### 1. Clone and install

```bash
git clone https://github.com/JasonWeimar/clientflow-portal.git
cd clientflow-portal

cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure environment variables

```bash
# frontend/.env.local
VITE_API_BASE_URL=https://YOUR_API_ID.execute-api.us-west-1.amazonaws.com
VITE_COGNITO_USER_POOL_ID=us-west-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_AWS_REGION=us-west-1
```

### 3. Start the development server

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

### 4. Build and deploy

```bash
cd frontend && npm run build

# Sync hashed assets with long-term cache headers
aws s3 sync dist/assets/ s3://YOUR_FRONTEND_BUCKET/assets/ \
  --cache-control 'public, max-age=31536000, immutable'

# Sync index.html with no-cache (always fetch latest)
aws s3 cp dist/index.html s3://YOUR_FRONTEND_BUCKET/index.html \
  --cache-control 'no-cache, no-store, must-revalidate'

# Invalidate CloudFront so users get the new index.html immediately
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID --paths '/*'
```

Full infrastructure provisioning is documented in the [Walkthrough Guide](docs/ClientFlow-Portal-Walkthrough.docx).

---

## Project Cost

Designed to run live indefinitely at near-zero cost — a deliberate architectural choice for a portfolio project that needs to stay accessible to recruiters.

| Service              | Free Tier                           | Cost at Demo Traffic      |
| -------------------- | ----------------------------------- | ------------------------- |
| Lambda               | 1M req/mo free forever              | ~$0.00                    |
| API Gateway HTTP API | 1M calls/mo (12 mo)                 | ~$1.00/mo after free tier |
| DynamoDB             | 25GB + WCU/RCU free forever         | $0.00                     |
| S3                   | 5GB + requests (12 mo)              | <$0.10/mo                 |
| CloudFront           | 1TB + 10M requests (12 mo)          | $0.00                     |
| Cognito              | 50,000 MAUs free forever            | $0.00                     |
| SES                  | 62,000 emails/mo free (from Lambda) | $0.00                     |
| **Total**            |                                     | **$0–$2/month**           |

Serverless + on-demand pricing means you pay for actual usage. A demo project with typical recruiter traffic costs less than a cup of coffee per month — and the architecture is identical to production SaaS at 10x the scale.

---

## What This Project Proves

**To a recruiter** _(30-second scan)_
Full-stack AWS + React developer. Shipped a real product with a complete design system, cloud infrastructure, and CI/CD pipeline. Two AWS certifications backed by working code.

**To a hiring manager** _(2-minute review)_
Understands the full product lifecycle: Figma design → AWS infrastructure → backend Lambda functions → React frontend → automated deployment → observability. Makes deliberate architectural choices with documented rationale.

**To an engineer** _(5-minute code review)_

- TypeScript throughout — no `any` shortcuts, utility types used correctly
- Shared Zod schemas between frontend and Lambda — single validation source of truth
- IAM least-privilege — every policy scoped to exact resources, no wildcards
- Pre-signed URL pattern — files never pass through Lambda
- EventBridge decoupling — `updateStatus` is isolated from notification side effects
- Content-hashed assets — correct CloudFront caching strategy with targeted invalidation
- TanStack Query — proper server state management with cache invalidation on mutation
- Feature-first folder structure — scalable, recognizable to any React developer

---

## Roadmap (Phase 3)

- [ ] AWS CDK — all infrastructure as TypeScript code (`cdk deploy` from scratch)
- [ ] DynamoDB single-table design with GSI for cross-entity access patterns
- [ ] API idempotency keys on `createRequest` to prevent duplicate submissions
- [ ] AWS Secrets Manager for all sensitive configuration values
- [ ] Custom domain + ACM certificate via Route 53
- [ ] AWS X-Ray distributed tracing across Lambda functions

---

## About

Built as the flagship project in my portfolio demonstrating AWS cloud development and modern React engineering.

**Certifications:** AWS Certified Developer – Associate (DVA-C02) · AWS Cloud Practitioner (CLF-C02)

**Stack:** React 18 · TypeScript · TailwindCSS · Vite · TanStack Query · React Hook Form · Zod · AWS SDK v3

**Infrastructure:** Lambda · API Gateway · DynamoDB · S3 · CloudFront · Cognito · SES · EventBridge · IAM · CloudWatch

---

<div align="center">

**Live Demo - Coming Soon🚧** · **Portfolio - (https://jasonweimarstack1.com)** · **LinkedIn - (https://www.linkedin.com/in/jason-weimar-3b6592228/)**

_Designed in Figma · Built with React + TypeScript · Deployed on AWS_

</div>
