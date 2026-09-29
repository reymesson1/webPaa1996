# DocIntel AI — Enterprise Document Intelligence & RAG Studio
### Full Stack AI Engineer Production Assessment

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker)](https://www.docker.com/)
[![Terraform](https://img.shields.io/badge/AWS%20Terraform-ECS%20Fargate-7b42bc?logo=terraform)](https://www.terraform.io/)
[![License](https://img.shields.io/badge/License-MIT-gray)](#)

---

## Executive Overview

**DocIntel AI** is a production-grade, AI-powered full-stack application designed to ingest unstructured enterprise documents (RFCs, legal contracts, financial briefings), extract structured JSON metadata (summaries, classifications, named entities, action items), and provide interactive conversational Q&A grounded in primary source text via **Retrieval-Augmented Generation (RAG)**.

This repository demonstrates senior full-stack AI systems engineering:
- **Clean Architectural Decoupling**: Strict separation between Prompt Construction, Model Invocation, and Response Post-Processing.
- **Provider Agnostic Engine**: Pluggable support for **Google Gemini (1.5 Flash/Pro)**, **OpenAI (GPT-4o/4o-mini)**, and a built-in **Deterministic Mock Engine** that enables instant local evaluation with zero API keys required.
- **Token-by-Token Streaming UX**: Real-time Server-Sent Events (SSE) streaming with active model lifecycle status badges and grounded citation chips.
- **AI Safety & Defense-in-Depth**: Automated PII masking (SSNs, emails, credit cards, phones), delimiter jailbreak encapsulation, and sliding-window token cost rate limiting.
- **Enterprise Infrastructure**: Complete AWS **Terraform** topology (VPC, ECS Fargate, ALB, Secrets Manager, KMS, RDS PostgreSQL with `pgvector`) and multi-stage Dockerfiles.

---

## System Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │           React Frontend (Vite)              │
                       │  • Document Ingestion & Sample Templates     │
                       │  • Structured Insights View & Entity Chips   │
                       │  • Real-Time SSE Token Streaming Q&A         │
                       │  • Grounded Citations & Uncertainty Alerts   │
                       └──────────────────────┬───────────────────────┘
                                              │ HTTP / SSE Stream
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │            Express API Gateway               │
                       │  • JWT Auth & Request Logging (X-Request-Id) │
                       │  • Pre-Ingestion PII Redaction Middleware    │
                       │  • Heuristic Prompt Injection Defense        │
                       │  • Sliding-Window Rate & Cost Limiter        │
                       └──────────────────────┬───────────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │                                               │
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │     RAG Vector Core     │                     │     AI Orchestrator     │
         │ • Recursive Text Chunk  │                     │ • Prompt Registry v1/v2 │
         │ • 128-dim Dense Vectors │                     │ • Provider Factory      │
         │ • Cosine Top-k Search   │                     │ • Zod Schema Validator  │
         │ • Citation Attribution  │                     │ • Confidence Calibrator │
         └────────────┬────────────┘                     └────────────┬────────────┘
                      │                                               │
                      │                                               ▼
                      │                                  ┌─────────────────────────┐
                      │                                  │     LLM Providers       │
                      │                                  │ • Google Gemini Flash   │
                      │                                  │ • OpenAI GPT-4o-mini    │
                      │                                  │ • Deterministic Mock    │
                      └───────────────────────┬──────────┴─────────────────────────┘
                                              │
                                              ▼
                                 ┌─────────────────────────┐
                                 │    Persistence Layer    │
                                 │ • Zero-Config File DB   │
                                 │ • PostgreSQL + pgvector │
                                 │ • AWS Secrets Manager   │
                                 └─────────────────────────┘
```

---

## Quick Start: Local Running Instructions

You can run the entire platform locally in **under 2 minutes** using either standard Node.js or Docker Compose. The platform includes a **1-Click Quick Demo Login** button so reviewers can test immediately without creating an account.

### Option 1: Direct Node.js (Recommended for Review)

#### Prerequisites
- Node.js $\ge 18.0.0$ (`node -v`)
- npm $\ge 8.0.0$ (`npm -v`)

#### 1. Clone & Setup Workspace
```bash
git clone https://github.com/reymesson1/webPaa1996.git
cd webPaa1996
```

#### 2. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
*The backend starts at `http://localhost:5000` with the deterministic `mock` provider pre-configured. No API keys are required to test.*

#### 3. Start Frontend Client (in a separate terminal)
```bash
cd frontend
npm install
npm run dev
```
*The frontend starts at `http://localhost:3000`.*

#### 4. Open Application & Click "Launch 1-Click Demo Session"
1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Click the **"Launch 1-Click Demo Session"** button on the sign-in card.
3. In the Ingestion form, click any template pill (e.g. **"Cloud Architecture RFC"** or **"SaaS Master Agreement"**).
4. Click **"Ingest & Extract with AI"** — view automated structured entities, executive summary, and action items.
5. In the right panel, ask a question (e.g., *"What are the targeted p99 latencies?"*) or click a suggested prompt pill. Watch tokens stream in real time with grounded source chunk citations!

---

### Option 2: Docker Compose (Full Stack + PostgreSQL + pgvector)

```bash
# Build and run backend, frontend, and PostgreSQL with pgvector
docker-compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- PostgreSQL + pgvector: `localhost:5432`

---

## Testing & Quality Verification

Run the automated test suite covering unit tests, RAG chunking, vector cosine similarity, PII redaction, prompt versioning, and JWT auth:

```bash
cd backend
npm test
```
```
 ✓ src/tests/rag.test.ts (4 tests)
 ✓ src/tests/guardrails.test.ts (3 tests)
 ✓ src/tests/aiOrchestrator.test.ts (3 tests)
 ✓ src/tests/auth.test.ts (4 tests)

 Test Files  4 passed (4)
      Tests  14 passed (14)
```

---

## AI Design Choices & Reasoning

### 1. Separation of Concerns (Prompt $\rightarrow$ Model $\rightarrow$ Post-Processing)
- **Prompt Construction** (`backend/src/services/ai/prompts/`): Isolated into versioned templates (`qa.prompts.ts`, `extraction.prompts.ts`). Includes strict delimiter boundaries (`<<<START_DOCUMENT_CONTEXT>>>`) and few-shot formatting.
- **Model Invocation** (`backend/src/services/ai/providers/`): Normalized behind an `LLMProvider` contract. Enables switching between Google Gemini, OpenAI, and Mock providers seamlessly without touching business logic.
- **Response Post-Processing** (`backend/src/services/ai/postProcessing.service.ts`): Strips potential Markdown code blocks, validates against strict **Zod** schemas, calibrates confidence scores, and extracts grounded citations.

### 2. Prompt Versioning (`v1` vs. `v2`)
- **`v1` (Direct Grounding)**: Direct answering targeting low-latency and concise answers.
- **`v2` (Chain-of-Thought RAG)**: Enforces explicit citation requirements (`[Source Chunk X]`), negative constraints (*"If the document does not mention X, explicitly refuse to answer"*), and strict delimiter isolation.
- Users and administrators can switch prompt versions dynamically via the UI selector or request headers.

### 3. Prompt Injection Defense & PII Redaction
- **PII Scrubbing**: Before text touches external LLMs or vector storage, `GuardrailService` automatically masks Social Security Numbers, Credit Cards, Email Addresses, and Phone Numbers with typed tokens (`[REDACTED_SSN]`).
- **Prompt Injection Neutralization**: Incoming questions pass through regex screening for override signatures (`ignore previous instructions`, `DAN mode`, `reveal hidden system prompts`). Raw inputs are sanitized and encapsulated inside non-escapable tags.

### 4. Cost Control & Rate Limiting in Production
- **Sliding-Window Limiter**: Enforces a maximum of 60 requests per minute and 50,000 tokens per window per client.
- **Exact Query Hash Caching**: Caches identical `(docId, queryHash)` pairs for 10 minutes to eliminate redundant LLM spend.
- **Offline Dense Vectors**: Generates 128-dimensional normalized dense vectors offline, saving 100% of embedding API costs during development.

---

## Architectural Trade-offs & Known Limitations

1. **In-Memory / File-Backed Persistence vs. Distributed Cluster**:
   - *Choice*: Used an atomic file-backed JSON store with a clean Repository pattern, paired with a production-ready PostgreSQL DDL (`schema.sql`).
   - *Trade-off*: File-backed storage enables instant, zero-friction local review without forcing the reviewer to install local databases, while PostgreSQL with `pgvector` is ready for Docker Compose and AWS RDS.
2. **Dense Subword Hashing vs. External Embedding Model APIs**:
   - *Choice*: Built-in 128-dim dense hashing vectorizer with cosine similarity.
   - *Trade-off*: Works 100% offline with zero latency and zero cost, though transformer-based embeddings (e.g. OpenAI `text-embedding-3-small` or Gemini `text-embedding-004`) capture richer semantic nuances in cross-lingual queries.
3. **Synchronous Chunk Extraction vs. Asynchronous Queue Workers**:
   - *Choice*: For documents under 50,000 characters, chunking and vector indexing occur synchronously during upload for instant user feedback.
   - *Trade-off*: For enterprise documents exceeding 100 pages, this should transition to an async SQS + Celery/BullMQ worker architecture.

---

## Infrastructure & AWS Deployment

Detailed Terraform templates are provided in [`terraform/`](./terraform/):
- **Networking**: Multi-AZ VPC with public, private, and isolated database subnets (`vpc.tf`).
- **Routing**: Application Load Balancer with health checks to `/api/health` (`alb.tf`).
- **Compute**: AWS ECS Fargate cluster with Auto Scaling policies scaling from 2 to 10 replicas based on request count (`ecs.tf`).
- **Secrets Management**: AWS Secrets Manager and KMS Customer Master Key with automatic rotation (`secrets.tf`).
- **Database**: AWS RDS PostgreSQL 16 instance with `pgvector` support (`database.tf`).

### Key Management & Secrets Rotation
- API keys live strictly in **AWS Secrets Manager** encrypted at rest via KMS CMK.
- Keys are injected as secure environment variables at container task startup—never stored in git or plaintext Dockerfiles.
- Key rotation is performed using a **Dual-Secret Grace Period Pattern**: the Lambda rotation function provisions the new secondary key, validates backend connectivity, updates the active ARN, and revokes the stale key after 24 hours.

---

## Comprehensive Technical Documentation

Explore the deep-dive architectural documents in [`docs/`](./docs/):

- 📐 [**System Architecture & Data Flow**](./docs/ARCHITECTURE.md): Component diagrams, RAG pipeline, sequence flows.
- 🔬 [**AI Evaluation & Reliability Playbook**](./docs/AI_EVALUATION.md): RAG Triad, golden dataset benchmarking, incident response for AI wrong answers.
- 🛡️ [**Security, PII & Auditability**](./docs/SECURITY_AND_PII.md): Data retention, PII masking regex, prompt injection defense matrix.
- 💰 [**Cost Estimation Model**](./docs/COST_ESTIMATION.md): Detailed cost models for 1k, 10k, and 100k requests across Gemini Flash, GPT-4o-mini, and Claude Haiku.
- 📖 [**API Reference Specification**](./docs/API_REFERENCE.md): Full OpenAPI/REST and SSE streaming endpoint documentation.

---

## Monorepo Directory Map

```
webPaa1996/
├── backend/
│   ├── src/
│   │   ├── config/env.ts                      # Environment and model parameters
│   │   ├── controllers/                       # Auth, Document, and AI controllers
│   │   ├── database/                          # File DB engine and PostgreSQL schema.sql
│   │   ├── middleware/                        # Auth, PII Guardrails, Rate Limiter
│   │   ├── models/types.ts                    # TypeScript types and Zod schemas
│   │   ├── routes/                            # REST & SSE Express routes
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── providers/                 # Gemini, OpenAI, and Mock providers
│   │   │   │   ├── prompts/                   # Versioned v1/v2 prompt templates
│   │   │   │   ├── postProcessing.service.ts  # Zod parsing, citations, confidence
│   │   │   │   └── aiOrchestrator.service.ts  # End-to-end AI pipeline coordinator
│   │   │   ├── rag/                           # Recursive chunker and vector store
│   │   │   ├── document.service.ts            # Document lifecycle management
│   │   │   └── auth.service.ts                # JWT authentication & demo account
│   │   ├── tests/                             # 14 automated unit & integration tests
│   │   ├── app.ts                             # Express application factory
│   │   └── server.ts                          # HTTP listener
│   ├── Dockerfile                             # Multi-stage production container
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/                        # Chat, Upload, Insights, Badges, Citations
│   │   ├── context/AuthContext.tsx            # React authentication context
│   │   ├── pages/                             # AuthPage, DocumentsPage, DocumentDetailPage
│   │   ├── services/                          # API client and SSE stream reader
│   │   ├── types/index.ts                     # UI domain models
│   │   ├── App.tsx                            # Root routing orchestrator
│   │   └── main.tsx
│   ├── Dockerfile                             # Multi-stage Vite + Nginx container
│   ├── nginx.conf                             # Production Nginx reverse proxy
│   └── package.json
├── terraform/                                 # AWS Infrastructure as Code (ECS, RDS, VPC, ALB, Secrets)
├── docs/                                      # Architecture, Evaluation, Security, Cost docs
├── docker-compose.yml                         # Full-stack local orchestration
└── README.md
```
