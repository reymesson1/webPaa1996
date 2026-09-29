# REST & SSE API Reference Specification

Base URL: `http://localhost:5000/api` (or `/api` via Vite/Nginx proxy)

All protected endpoints require an HTTP header:
`Authorization: Bearer <JWT_TOKEN>`

Optional AI Control Headers:
- `x-llm-provider`: `mock` | `gemini` | `openai`
- `x-prompt-version`: `v1` | `v2`

---

## 1. Authentication Endpoints

### `POST /auth/register`
Creates a new user account.
```json
// Request Body
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "Alex Mercer"
}

// Response (201 Created)
{
  "user": {
    "id": "usr_771829",
    "email": "user@example.com",
    "name": "Alex Mercer",
    "createdAt": "2026-09-29T15:20:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### `POST /auth/login`
Authenticates existing credentials.
```json
// Request Body
{
  "email": "user@example.com",
  "password": "Password123!"
}

// Response (200 OK)
{
  "user": { "id": "usr_771829", "email": "user@example.com", "name": "Alex Mercer" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### `POST /auth/demo`
Provisions an instant 1-click demo reviewer session without requiring signup.
```json
// Response (200 OK)
{
  "user": {
    "id": "demo_4a88f",
    "email": "reviewer@demo.docintel.ai",
    "name": "AI Engineering Reviewer"
  },
  "token": "eyJhbGciOiJIUzI1Ni..."
}
```

### `GET /auth/me`
Returns currently authenticated user profile.

---

## 2. Document Endpoints

### `POST /documents`
Ingests a document, performs PII inspection & redaction, chunks text, generates vector embeddings, and automatically triggers structured intelligence extraction.
```json
// Request Body
{
  "title": "Cloud Migration RFC",
  "content": "Raw document text with potential PII...",
  "promptVersion": "v2",
  "provider": "mock"
}

// Response (201 Created)
{
  "document": {
    "id": "doc_38291a",
    "userId": "usr_771829",
    "title": "Cloud Migration RFC",
    "rawContent": "...",
    "sanitizedContent": "Sanitized text with [REDACTED_EMAIL]...",
    "characterCount": 4200,
    "estimatedTokens": 1050,
    "chunksCount": 4,
    "structuredInsights": {
      "summary": "...",
      "classification": {
        "category": "Technical",
        "primaryTopic": "AWS ECS Migration",
        "confidentialityLevel": "Internal",
        "sentiment": "Positive"
      },
      "keyEntities": [
        { "name": "AWS Fargate", "type": "Organization", "context": "Target runtime" }
      ],
      "actionItems": [
        { "task": "Finalize VPC Peering", "priority": "High", "assignee": "Cloud Lead" }
      ],
      "confidenceScore": 0.94,
      "language": "English"
    },
    "createdAt": "2026-09-29T15:20:00.000Z"
  },
  "guardrailSummary": {
    "piiDetected": true,
    "piiMatchesCount": 2,
    "injectionDetected": false
  }
}
```

### `GET /documents`
Lists all documents belonging to the authenticated user.

### `GET /documents/:id`
Retrieves a specific document by ID.

### `DELETE /documents/:id`
Deletes a document and its associated vector chunks.

### `POST /documents/:id/reextract`
Re-runs AI structured extraction with active model or prompt version.

---

## 3. AI & Chat Endpoints

### `POST /ai/chat/stream` *(Server-Sent Events)*
Initiates real-time token streaming Q&A grounded in document vector chunks.
```json
// Request Body
{
  "documentId": "doc_38291a",
  "question": "What is the targeted p99 latency SLA?",
  "promptVersion": "v2",
  "provider": "mock",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "How can I help with this document?" }
  ]
}
```

**SSE Event Stream:**
```http
event: status
data: {"status":"retrieving_chunks","message":"Retrieving grounded context..."}

event: token
data: {"token":"Based "}

event: token
data: {"token":"on "}

event: token
data: {"token":"[Source Chunk 1], "}

event: done
data: {
  "message": {
    "id": "msg_90118",
    "role": "assistant",
    "content": "Based on [Source Chunk 1], the targeted p99 latency is sub-10ms...",
    "citations": [
      {
        "chunkId": "chk_229",
        "chunkIndex": 1,
        "snippet": "average p99 latency of 1,450ms...",
        "similarityScore": 0.89
      }
    ],
    "confidenceScore": 0.94,
    "tokensUsed": { "promptTokens": 820, "completionTokens": 95, "totalTokens": 915 },
    "latencyMs": 680
  },
  "confidenceScore": 0.94,
  "isUncertain": false
}
```

### `POST /ai/chat/sync`
Synchronous alternative to streaming returning full response object.

### `POST /ai/feedback`
Records human-in-the-loop evaluation data.
```json
// Request Body
{
  "messageId": "msg_90118",
  "feedback": "thumbs_up", // or "thumbs_down"
  "comment": "Accurate grounding"
}
```

### `GET /ai/providers`
Returns active and configured LLM providers (`mock`, `gemini`, `openai`).

### `GET /ai/prompts`
Returns registered prompt versions (`v1`, `v2`) with metadata.

### `GET /health`
Liveness and readiness healthcheck probe (returns HTTP 200).
