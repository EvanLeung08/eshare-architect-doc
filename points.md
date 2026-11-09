# Associate Director Interview — One-Screen Cue Card

**Answer arc:** Headline → 1-line context → **my decisions/actions** → quantified result → lesson.  
Use **“I”** for personal contribution and **“we”** for team outcomes.

### 1｜Challenge / Legacy Modernization
**AIP:** Tier-1 service; **700+ feeds; 60+ GB/day** → rebuilt Mule capabilities using open-source, event-driven microservices.  
**My role:** led 0→1 architecture, core components, roadmap and global delivery.  
**Migration:** feature toggles; blue/green; canary; phased cutover; rollback; business continuity.  
**Result:** **37+ legacy components decommissioned; maintenance and development costs down >50%; zero downtime for all minor releases.**  
**Lesson:** business continuity and measurable value matter more than adopting new technology.

### 2｜Delivery / Business Value
Repeated integration effort → configuration-driven **adapters, routing and transformation**.  
**Result:** delivery **months → days; code-development effort down 90%**.  
Keywords: **standard patterns, reuse, faster time-to-market—not adding headcount.**

### 3｜Stakeholders / Conflict
**Align outcomes → identify decision owners/users/Ops/Security/Architecture → present options with cost/risk trade-offs → RACI + regular cadence + written decisions.**  
Priority conflict: **business value, regulatory/operational risk, urgency, capacity → MVP or phased scope → escalate with options, not just problems.**  
Evidence: **global AIP stakeholders + ITID + business owners + architecture groups.**

### 4｜System Design — Integration Platform
**Clarify:** protocols; volume/peak; SLA; data classification; RTO/RPO; compliance.  
**Flow:** channel adapters → event-driven services → routing → transformation → consumers.  
**Reliability:** at-least-once delivery + idempotent consumers; retry/DLQ; ordering; backpressure; reconciliation.  
**NFRs:** HA/autoscaling/capacity; IAM/encryption/keys/audit; logs/metrics/tracing/alerts; canary/rollback.  
**Trade-off:** DDD boundaries; independent scaling/deployment; avoid distributed monoliths, chatty services and hidden consistency costs.

### 5｜Production Incident / Problem Solving
**Restore service first → assess impact/severity → mitigate/rollback → one communication channel + timeline → blameless RCA → owners/deadlines → verify prevention.**  
**AIOps evidence:** correlate **error logs ↔ code ↔ change requests** → alerts + recommendations; diagnosis **hours → minutes**.  
Principle: **AI supports triage; humans validate and remain accountable.**

### 6｜People Leadership / Underperformance
**20+ global cross-functional members; direct + indirect reporting.**  
Clear outcomes/RACI → delegate ownership → sprint breakdown + quality gates → coaching/mentoring.  
Underperformance: **private, fact-based discussion → clear expectations → support → checkpoints → objective documentation and fair process.**

### 7｜GenAI / RAG
**AIOps:** introduced into **UAT/production operations**. **Due Diligence RAG:** **PoC only**.  
RAG: retrieve from **authoritative documents** to ground answers and reduce manual search/repetition.  
Production gate: **access control, data-leakage prevention, traceable citations, evaluation set, human approval, audit, fallback.**  
**MCP enables tool/context integration; it does not guarantee security or accuracy.**

### 8｜Failure / Mistake
Use a **real, non-catastrophic** example: **own the impact → no blame → root cause → immediate correction → systemic prevention → verify improvement.**

### 9｜Why Hang Seng / This Role
Transferable value: **Tier-1 service ownership + global stakeholders + architecture/budget/delivery + team leadership + GenAI adoption.**  
Motivation: **apply platform engineering, modernization and engineering governance closer to business outcomes; build reliable platforms and high-performing teams.**  
Do not criticize the current team or invent department-specific knowledge.

**Backup scale story — PPmoney:** peak **200k+ applications/day**; manual approval **100% → 2%**; time-to-lend **1 day → 3 minutes**; consolidated **6+ silos**, duplicated development effort **down 80%**.

**Accuracy guardrails:** zero downtime = **minor releases**; 90% = **code-development effort**, not total cost; RAG = **PoC**, not production; **hours → minutes** belongs to AIOps.
