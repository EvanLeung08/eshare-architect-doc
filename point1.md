

**答题骨架：结论先行 → 背景一句 → 我的行动／决策 → 量化结果 → 复盘。**  
个人贡献用 **I**，团队成果用 **we**；以下经历均来自简历，设计题框架不要冒充已落地事实。

### 1．Challenge／Legacy Modernization
**AIP：Tier-1、700+ feeds、60+GB／天 → Mule 重建为开源、事件驱动微服务。**  
我的作用：**lead 0→1 架构＋核心组件＋ roadmap＋跨区域交付**。  
迁移：**feature toggle、blue/green、canary、分批切换、可回退、业务连续**。  
结果：**37+ legacy components 退役；维护及开发成本降 50%+；minor releases zero downtime**。  
收尾：**重点不是追新技术，而是降本、复用、降低迁移风险。**

### 2．Delivery／Business Value
痛点：**重复集成、交付周期长** → 配置化 **adapter／routing／transformation**。  
结果：**months → days；代码开发工作量减少 90%**。  
关键词：**standard pattern、reuse、time-to-market，不靠堆人。**

### 3．Stakeholder Management／Conflict
**Align outcomes → map decision owner／users／ops／security／architects → options＋cost／risk trade-off → RACI＋固定 cadence → 书面记录决策。**  
优先级冲突：**business value、regulatory／risk、urgency、capacity → MVP／分阶段；带方案升级，不只带问题。**  
证据：**AIP 全球干系人＋ITID＋business owners＋architecture groups。**

### 4．System Design：Integration Platform
**先问清：**协议、数据量、SLA、数据分级、RTO／RPO、峰值、合规。  
**架构：**channel adapters → event-driven → routing → transformation → consumers。  
**可靠性：**at-least-once＋idempotency、retry／DLQ、ordering、backpressure、reconciliation。  
**非功能：**HA／autoscale／capacity；IAM、加密／密钥、audit；logs／metrics／tracing／alerts；canary／rollback。  
**微服务取舍：**DDD boundary、独立扩缩容／部署；警惕分布式单体、过多调用、数据一致性成本。

### 5．Production Incident／Problem Solving
**Restore service first → 影响面／severity → mitigate／rollback → 统一沟通与时间线 → blameless RCA → action owner＋deadline → 防复发。**  
AIOps 证据：**error logs ↔ code ↔ change requests → alert＋建议；诊断 hours → minutes。**  
原则：**AI 辅助判断，不替代 on-call 责任和验证。**

### 6．People Leadership／Underperformance
**20+ 全球跨职能团队，direct＋indirect；目标／RACI 清晰，授权 ownership，sprint 拆解＋质量门禁＋mentoring。**  
低绩效：**私下谈事实 → 明确期望 → 支持／辅导 → checkpoint → 客观记录、公平流程；不贴标签、不公开指责。**

### 7．GenAI／RAG
**AIOps：已用于 UAT／生产运维；Due Diligence：仅 PoC。**  
RAG：**authoritative documents 提供 grounding，减少人工查找与重复填写。**  
生产门槛：**权限隔离、数据泄露防护、引用可溯源、评测集、human approval、audit、fallback。**  
**MCP＝工具／上下文集成协议，不等于安全或准确性保障。**

### 8．Failure／Mistake／Difficult Person
选**真实且非灾难性**案例：**Own impact → 不甩锅 → root cause → immediate fix → 机制防复发 → 后续验证**。  
难相处同事：**先理解诉求和约束 → 回到共同目标／事实 → 明确责任 → 必要时透明升级。**

### 9．Why Hang Seng／Why This Role
**可迁移价值：Tier-1 service ownership＋全球干系人＋架构／预算／交付＋团队领导＋GenAI。**  
动机：**更贴近业务场景，复制平台化、现代化和工程治理能力；建设可靠平台与高绩效团队。**  
不贬低现团队；不臆测恒生部门情况，具体业务价值按 JD 连接。

**备用规模故事（PPmoney）：**日峰值 **20万+申请**；人工审批 **100%→2%**，放款 **1天→3分钟**；整合 **6+ silos**，重复开发减少 **80%**。

**口径红线：**zero downtime 仅指 **minor releases**；90% 是**代码开发工作量**，不是总成本；RAG **PoC 不称已上线**；AIOps 的 **hours→minutes** 不套到 RAG。
