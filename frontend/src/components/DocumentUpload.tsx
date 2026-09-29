import React, { useState } from 'react';
import { UploadCloud, FileText, Sparkles, Shield, Loader2, AlertCircle } from 'lucide-react';

interface DocumentUploadProps {
  onSuccess: (document: any) => void;
  selectedProvider: string;
  selectedPromptVersion: string;
}

const SAMPLE_DOCUMENTS = [
  {
    name: 'Cloud Architecture RFC',
    category: 'Technical',
    title: 'RFC-409: Distributed Event-Driven Architecture Migration',
    content: `REQUEST FOR COMMENTS: RFC-409
Title: Migration of Legacy Monolithic Payment Gateway to AWS Event-Driven Architecture
Author: Cloud Engineering Taskforce
Date: September 2026
Confidentiality: Internal Engineering

1. EXECUTIVE OVERVIEW
Our legacy payment gateway currently handles 12,000 transactions per minute during peak hours with an average p99 latency of 1,450ms. To support global expansion into EMEA and APAC, we propose decommissioning the monolithic application in favor of an event-driven architecture hosted on AWS ECS Fargate, orchestrated by Amazon EventBridge, and backed by DynamoDB with Global Tables.

2. ARCHITECTURAL DECISIONS & SERVICE BOUNDARIES
- Event Ingestion: Cloudflare Edge Workers routing to AWS API Gateway with mTLS authentication.
- Queue Buffering: Amazon SQS FIFO queues handling up to 30,000 TPS with dead-letter queue (DLQ) automated replay.
- Persistence Layer: DynamoDB multi-region replication with sub-10ms single-digit read latencies.
- Security & Compliance: Full PCI-DSS Level 1 compliance. All customer cardholder data must be tokenized before persistence. Zero raw PAN or CVV storage.
- Rate Limiting: 50 requests/sec per client IP enforced by AWS WAF.

3. RISK MITIGATION & KNOWN LIMITATIONS
- Network partition risk across multi-region replication. Mitigation: DynamoDB conflict resolution via last-writer-wins.
- Cold start latencies on ECS Fargate containers during flash sales. Mitigation: Pre-warming containers via scheduled auto-scaling policies.

4. ACTION ITEMS & TIMELINES
- Action Item: Security Team to audit IAM task roles and Secrets Manager encryption keys by October 15, 2026. Assignee: Marcus Vance.
- Action Item: Platform Team to deploy Terraform ECS Fargate templates to staging by November 1, 2026. Assignee: Elena Rostova.
- Action Item: Conduct Chaos Engineering failover simulation on November 15, 2026. Assignee: DevOps Lead.`,
  },
  {
    name: 'SaaS Master Agreement',
    category: 'Legal',
    title: 'Enterprise Master Services Agreement (MSA) - CloudCore Inc.',
    content: `MASTER SERVICES AGREEMENT (MSA)
Contract Reference: MSA-2026-CC-882
Effective Date: October 1, 2026
Parties: CloudCore Technologies Inc. ("Provider") and Apex Global Logistics Corp. ("Client")

1. SUBSCRIPTION SERVICES & SERVICE LEVEL AGREEMENT (SLA)
Provider shall deliver 99.95% monthly service availability for the DocIntel Enterprise Suite.
If Monthly Uptime falls below 99.95%, Client shall receive a 10% service credit.
If Monthly Uptime falls below 99.0%, Client shall receive a 30% service credit and reserves the unilateral right to terminate for breach within thirty (30) days written notice.

2. FEES, INVOICING & PAYMENT TERMS
The annual subscription fee is $240,000 USD, payable net-30 days from invoice date.
Late payments will accrue interest at the lesser of 1.5% per month or the maximum rate permissible by law.

3. DATA PRIVACY, PII & CONFIDENTIALITY
Provider shall comply with GDPR, CCPA, and SOC 2 Type II controls.
Provider shall not process or store Unencrypted Personally Identifiable Information (PII) including Social Security Numbers, banking details, or biometric credentials.
In the event of a confirmed Data Security Incident, Provider must notify Client in writing within twenty-four (24) hours of discovery.

4. LIABILITY & INDEMNIFICATION
Neither party's aggregate liability arising out of or related to this Agreement shall exceed the total amount paid by Client hereunder in the twelve (12) months preceding the incident.

5. TERMINATION & ACTION ITEMS
- Action Item: Legal Counsel to execute bilateral signature by September 30, 2026. Assignee: David Kim.
- Action Item: Compliance Officer to provide verified SOC 2 Type II audit report before onboarding. Assignee: Sarah Jenkins.`,
  },
  {
    name: 'Q3 Financial Report',
    category: 'Financial',
    title: 'Q3 2026 Financial & Operational Performance Briefing',
    content: `FINANCIAL BRIEFING: Q3 2026
Prepared by: Office of the Chief Financial Officer (CFO)
Distribution: Board of Directors & Executive Committee

1. REVENUE & FINANCIAL HIGHLIGHTS
- Total Annual Recurring Revenue (ARR): Reached $42.5M, representing 38% year-over-year growth.
- Gross Margin: Expanded by 320 basis points to 78.4%, driven by cloud infrastructure optimizations and serverless consolidation.
- Net Retention Rate (NRR): 124% across enterprise tier accounts.
- Free Cash Flow (FCF): Positive $6.2M for the quarter, marking the second consecutive profitable quarter.

2. OPERATING EXPENSES & RESEARCH & DEVELOPMENT
Operating expenses totaled $26.8M, allocated as:
- Research & Development (AI Systems & Infrastructure): $12.4M (46%)
- Sales & Customer Success: $8.9M (33%)
- General & Administrative: $5.5M (21%)
Average Customer Acquisition Cost (CAC) decreased from $14,200 to $11,800.

3. STRATEGIC PRIORITIES & NEXT STEPS
- Action Item: Finance Team to conclude Q4 budget allocation and cash runway modeling by October 12, 2026. Assignee: Rachel Adams.
- Action Item: Head of People to fill 8 senior distributed systems and AI engineering positions by December 2026. Assignee: Talent Acquisition.
- Action Item: Complete SOC 2 Type II renewal audit by November 20, 2026. Assignee: VP Engineering.`,
  },
];

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onSuccess,
  selectedProvider,
  selectedPromptVersion,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadSample = (sample: (typeof SAMPLE_DOCUMENTS)[0]) => {
    setTitle(sample.title);
    setContent(sample.content);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMessage('Please enter or paste document text.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('docintel_token')}`,
        },
        body: JSON.stringify({
          title: title.trim() || 'Untitled Document',
          content,
          promptVersion: selectedPromptVersion,
          provider: selectedProvider,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to ingest document');
      }

      onSuccess(data.document);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedTokens = Math.ceil(content.length / 4);

  return (
    <div className="rounded-2xl bg-slate-800/40 border border-slate-700/60 p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-700/60">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-sky-400" />
            <span>Submit Document for AI Processing</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ingest text to automatically trigger RAG chunking, vector indexing, and structured metadata extraction.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
            Load Template:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_DOCUMENTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadSample(sample)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-700/60 hover:bg-sky-600 text-slate-200 hover:text-white transition border border-slate-600/40 flex items-center space-x-1"
              >
                <FileText className="w-3 h-3" />
                <span>{sample.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Document Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q3 Financial Report, API Architecture RFC, Service Contract"
            disabled={isSubmitting}
            className="w-full bg-slate-900/80 text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500 placeholder-slate-500 transition disabled:opacity-50"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Document Content (Raw Text)
            </label>
            <div className="text-[11px] text-slate-400 flex items-center space-x-3">
              <span>{content.length.toLocaleString()} chars</span>
              <span>~{estimatedTokens.toLocaleString()} tokens</span>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="Paste your document, report, or contract text here..."
            disabled={isSubmitting}
            className="w-full bg-slate-900/80 text-white text-xs sm:text-sm p-4 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500 placeholder-slate-500 transition font-mono leading-relaxed disabled:opacity-50"
          />
        </div>

        {/* Security & Ingestion Footnote */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-2 gap-3">
          <div className="flex items-center space-x-1.5 text-emerald-400/90">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px]">
              Active Guardrail: Automated PII Masking & Injection Shield
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-sky-500/20 disabled:opacity-50 transition"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Chunking, Vectorizing & Extracting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Ingest & Extract with AI</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
