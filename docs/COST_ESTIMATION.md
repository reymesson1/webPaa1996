# Production Cost Estimation & Token Economics

## 1. Request Anatomy & Token Budgeting

To estimate operational costs accurately across scale, we define the standard payload profiles for DocIntel AI operations:

### 1.1 Operation Profiles
1. **Document Ingestion & Structured Extraction**:
   - Average document size: ~6,000 characters $\approx$ 1,500 input tokens
   - Vector chunking: 3 chunks $\times$ 500 tokens = 1,500 embedding tokens
   - Structured JSON output: ~450 output tokens (summary, entities, actions)
2. **Interactive RAG Q&A Turn**:
   - System instructions & delimiters: 200 tokens
   - Retrieved context (top-3 chunks): 600 tokens
   - Conversation history & user question: 150 tokens
   - Total Input: **950 tokens**
   - Streamed Answer Completion: **250 tokens**

---

## 2. Model Pricing Comparison (Per 1 Million Tokens)

| Model Tier | Input Price / 1M | Output Price / 1M | Embedding Price / 1M | Cache Read Price / 1M |
| :--- | :--- | :--- | :--- | :--- |
| **Google Gemini 1.5 Flash** *(Recommended)* | **$0.075** | **$0.300** | $0.025 (text-embedding-004) | $0.01875 |
| **OpenAI GPT-4o-mini** | **$0.150** | **$0.600** | $0.020 (text-embedding-3-small) | $0.07500 |
| **Anthropic Claude 3.5 Haiku** | **$0.250** | **$1.250** | N/A (Requires Voyage / Cohere) | $0.02500 |
| **OpenAI GPT-4o (Frontier)** | **$2.500** | **$10.000** | $0.020 | $1.25000 |

---

## 3. Financial Forecast Across Scales (1k, 10k, 100k Requests)

Assumed Workload Mix: **20% Document Ingestion & Extraction** + **80% Interactive RAG Q&A Queries**.

### 3.1 Scenario 1: 1,000 Requests
- Ingestion tasks (200 docs): 300,000 input tokens, 90,000 output tokens, 300,000 embedding tokens
- Q&A queries (800 questions): 760,000 input tokens, 200,000 output tokens
- **Total Consumption**: ~1.06M input tokens, ~290k output tokens, ~300k embedding tokens

| Model | LLM Token Spend | Embedding Spend | AWS Infrastructure (Fargate + RDS) | Total Cost | Cost / Request |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Gemini 1.5 Flash** | **$0.17** | **$0.01** | $45.00 / mo | **$45.18** | $0.045 |
| **GPT-4o-mini** | **$0.33** | **$0.01** | $45.00 / mo | **$45.34** | $0.045 |
| **Claude 3.5 Haiku** | **$0.63** | **$0.01** | $45.00 / mo | **$45.64** | $0.046 |
| *GPT-4o (Frontier)* | *$5.55* | *$0.01* | $45.00 / mo | *$50.56* | $0.051 |

---

### 3.2 Scenario 2: 10,000 Requests
- Ingestion tasks (2,000 docs): 3.0M input tokens, 900k output tokens, 3.0M embedding tokens
- Q&A queries (8,000 questions): 7.6M input tokens, 2.0M output tokens
- **Total Consumption**: ~10.6M input tokens, ~2.9M output tokens, ~3.0M embedding tokens

| Model | LLM Token Spend | Embedding Spend | AWS Infrastructure | Total Cost | Cost / Request |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Gemini 1.5 Flash** | **$1.67** | **$0.08** | $55.00 / mo | **$56.75** | $0.0057 |
| **GPT-4o-mini** | **$3.33** | **$0.06** | $55.00 / mo | **$58.39** | $0.0058 |
| **Claude 3.5 Haiku** | **$6.28** | **$0.08** | $55.00 / mo | **$61.36** | $0.0061 |
| *GPT-4o (Frontier)* | *$55.50* | *$0.06* | $55.00 / mo | *$110.56* | $0.0110 |

---

### 3.3 Scenario 3: 100,000 Requests (Enterprise Scale)
- Ingestion tasks (20,000 docs): 30.0M input tokens, 9.0M output tokens, 30.0M embedding tokens
- Q&A queries (80,000 questions): 76.0M input tokens, 20.0M output tokens
- **Total Consumption**: ~106.0M input tokens, ~29.0M output tokens, ~30.0M embedding tokens

| Model | LLM Token Spend | Embedding Spend | AWS Infrastructure (Multi-AZ) | Total Cost | Cost / Request |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Gemini 1.5 Flash** | **$16.65** | **$0.75** | $180.00 / mo | **$197.40** | $0.0019 |
| **GPT-4o-mini** | **$33.30** | **$0.60** | $180.00 / mo | **$213.90** | $0.0021 |
| **Claude 3.5 Haiku** | **$62.75** | **$0.75** | $180.00 / mo | **$243.50** | $0.0024 |
| *GPT-4o (Frontier)* | *$555.00* | *$0.60* | $180.00 / mo | *$735.60* | $0.0074 |

---

## 4. Cost Optimization Strategies Implemented

1. **Model Distillation & Routing**:
   - Use high-speed, cost-effective models (**Gemini 1.5 Flash** or **GPT-4o-mini**) for 95% of standard Q&A and extraction tasks.
   - Reserve larger frontier models (Gemini Pro / GPT-4o) exclusively for multi-hop complex reasoning queries flagged by the user or uncertain queries.
2. **Context Window Caching**:
   - For recurring queries over the same uploaded document, prompt caching reduces input token costs by up to **75%**.
3. **Exact Query Deduplication**:
   - Express middleware checks in-memory cache for matching `(documentId, questionHash)` tuples. Identical queries within 10 minutes are served from cache with 0 LLM token cost.
4. **Offline Dense Vector Embeddings**:
   - By utilizing our built-in offline subword normalized hashing vectorizer for initial chunk retrieval, we reduce third-party embedding API costs to $0.00 during local development and testing.
