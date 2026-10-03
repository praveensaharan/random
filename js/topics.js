/*
 * FutureSpin topic library.
 * Row format: [slug, depth, heat 1-5, mainstream ETA, title, why it will boom, [3 things to learn]]
 * depth: quick = 5-min primer, deep = deep dive, expert = under-the-hood.
 */
(function (root) {
  const AREAS = {
    ai: { label: 'AI & Agents', short: 'AI', emoji: '🤖', color: '#a78bfa' },
    cloud: { label: 'Cloud & DevOps', short: 'Cloud', emoji: '☁️', color: '#38bdf8' },
    data: { label: 'Data & Analytics', short: 'Data', emoji: '📊', color: '#34d399' },
    security: { label: 'Security', short: 'Security', emoji: '🛡️', color: '#fb7185' },
    emerging: { label: 'Quantum & Emerging', short: 'Emerging', emoji: '⚛️', color: '#fbbf24' }
  };

  const DEPTHS = {
    quick: { label: '5-min primer', emoji: '⚡' },
    deep: { label: 'Deep dive', emoji: '📘' },
    expert: { label: 'Expert', emoji: '🧠' }
  };

  const ROWS = {
    ai: [
      ['mcp', 'quick', 5, 'Now', 'Model Context Protocol (MCP)', 'The open standard that lets any AI app plug into tools and data — the "USB-C of AI". Major AI platforms and IDEs support it, so the skill transfers everywhere.', ['Hosts, clients & servers', 'Tools, resources & prompts', 'Auth for remote servers']],
      ['agentic-ai', 'quick', 5, 'Now', 'Agentic AI vs. chatbots', 'Software that plans, calls tools and finishes multi-step tasks by itself. Enterprise budgets are shifting from chat assistants to agents that own whole workflows.', ['Plan → act → observe loop', 'Tool calling', 'Human-in-the-loop checkpoints']],
      ['a2a', 'quick', 4, '2026–27', 'Agent-to-Agent (A2A) protocol', 'An open protocol for agents from different vendors to discover each other and hand off work — the glue for multi-vendor agent ecosystems.', ['Agent cards & discovery', 'Tasks and messages', 'A2A vs. MCP']],
      ['slm', 'quick', 5, 'Now', 'Small language models (SLMs)', 'Compact models that run cheaply on laptops, phones and edge boxes. For focused tasks they are often good enough at a fraction of the cost and latency.', ['Distillation', 'Quantization basics', 'When small beats big']],
      ['reasoning-models', 'quick', 5, 'Now', 'Reasoning models & thinking time', 'Models that think before answering trade extra compute for much better maths, code and planning. Knowing when to pay for thinking is a new core skill.', ['Test-time compute', 'Thinking budgets', 'Latency vs. accuracy']],
      ['context-engineering', 'quick', 5, 'Now', 'Context engineering', 'The successor to prompt engineering: deciding exactly what goes into the context window — instructions, documents, memory, tools. It is what makes agents reliable.', ['Context budgets', 'Retrieval vs. stuffing', 'Compaction & summarisation']],
      ['coding-agents', 'quick', 5, 'Now', 'AI coding agents', 'Agents that read a codebase, edit files, run tests and open pull requests. Engineering workflows are being rebuilt around them; steering them well is a career multiplier.', ['Agent loops in IDE & CLI', 'Specs and guardrails', 'Reviewing AI-written code']],
      ['multimodal', 'quick', 4, 'Now', 'Multimodal AI', 'Models that natively see, hear and speak unlock document understanding, visual inspection and live voice assistants in one system.', ['Vision-language models', 'Audio in and out', 'Multimodal RAG']],
      ['voice-agents', 'quick', 4, '2026–27', 'Real-time voice agents', 'Low-latency speech-to-speech models make phone and kiosk agents sound natural. Contact centres are among the first big adopters.', ['Speech-to-speech vs. pipelines', 'Turn-taking & interruptions', 'Latency budgets']],
      ['eu-ai-act', 'quick', 4, 'Now', 'The EU AI Act in practice', 'The first broad AI law is phasing in duties for general-purpose and high-risk AI. Anyone selling into Europe needs people who understand it.', ['Risk tiers', 'General-purpose AI obligations', 'Documentation & conformity']],
      ['ai-governance', 'quick', 4, '2026–27', 'AI governance & ISO/IEC 42001', 'Boards now ask "who approved this model?". ISO/IEC 42001 is a certifiable AI management system, and governance roles are growing fast.', ['AI management system', 'Model inventory', 'Impact assessments']],
      ['open-weight', 'quick', 4, 'Now', 'Open-weight models', 'Downloadable models you host yourself keep closing the gap with closed ones, giving privacy, customisation and cost control.', ['Open-weight vs. open-source', 'Model licences', 'Self-hosting trade-offs']],
      ['ai-pc', 'quick', 3, '2026–27', 'AI PCs & on-device AI', 'Laptops and phones ship with NPUs that run models locally. Expect apps that work offline and keep data on the device.', ['NPU vs. GPU', 'On-device runtimes', 'Hybrid local + cloud']],
      ['sovereign-ai', 'quick', 3, '2026–28', 'Sovereign AI', 'Countries and regulated industries want AI under their own jurisdiction, driving national models, local data centres and new consulting demand.', ['Data residency', 'National model programmes', 'Sovereign cloud links']],
      ['agentic-commerce', 'quick', 4, '2026–28', 'Agentic commerce', 'AI agents that compare, buy and pay for users. Payment networks are building agent-ready checkout and tokenised credentials.', ['Agent payments', 'Delegated authority', 'Fraud & liability']],
      ['geo', 'quick', 4, 'Now', 'AI search & answer engines (GEO)', 'People increasingly ask AI instead of searching. Generative engine optimisation is how brands stay visible inside AI answers.', ['Citations in AI answers', 'GEO vs. SEO', 'Structured content']],
      ['world-models', 'quick', 4, '2028–30', 'World models', 'Models that learn how the physical world behaves so they can simulate and plan — seen as a key step toward capable robots and agents.', ['Video prediction', 'Simulation for training', 'Physical reasoning']],
      ['enterprise-copilots', 'quick', 4, 'Now', 'Enterprise copilots & agent builders', 'Office suites, CRMs and ERPs now bundle agent builders. Extending and governing them is fast-growing consulting work.', ['Low-code agent builders', 'Connectors & grounding', 'Adoption & change management']],

      ['rag', 'deep', 4, 'Now', 'Retrieval-augmented generation (RAG)', 'Grounding answers in your own documents is still the top enterprise GenAI pattern. Chunking, ranking and evaluation separate demos from production.', ['Chunking & embeddings', 'Hybrid search + reranking', 'Measuring RAG quality']],
      ['agentic-rag', 'deep', 4, 'Now', 'Agentic RAG', 'Instead of one lookup, an agent decides what to search, checks the results and searches again — a big quality jump on messy enterprise data.', ['Query planning', 'Iterative retrieval', 'Self-checking answers']],
      ['graphrag', 'deep', 4, '2026–27', 'GraphRAG & knowledge graphs', 'LLMs plus knowledge graphs answer "connect the dots" questions that plain vector search misses.', ['Entity extraction', 'Community summaries', 'Graph + vector hybrid']],
      ['multi-agent', 'deep', 4, '2026–27', 'Multi-agent orchestration', 'Teams of specialised agents — planner, researcher, reviewer — tackle bigger jobs than one agent. Orchestration is becoming an architecture discipline.', ['Supervisor vs. swarm', 'Handoffs', 'Shared state']],
      ['agent-memory', 'deep', 4, '2026–27', 'Agent memory', 'Agents that remember users and past work across sessions feel far more useful. Designing memory well is a hot open problem.', ['Short- vs. long-term memory', 'Memory stores', 'Forgetting & privacy']],
      ['evals', 'deep', 5, 'Now', 'LLM evals', 'You cannot ship what you cannot measure. Eval suites are the unit tests of AI products and a top hiring signal.', ['Golden datasets', 'LLM-as-judge', 'Regression testing']],
      ['llmops', 'deep', 4, 'Now', 'LLMOps & AI observability', 'Tracing prompts, tool calls, cost and quality in production — the DevOps of AI, needed by every team running models.', ['Traces for LLM calls', 'Cost & latency dashboards', 'User feedback loops']],
      ['guardrails', 'deep', 4, 'Now', 'AI guardrails', 'Input and output checks, policy engines and scoped tool permissions keep agents on track — usually required before going live.', ['Content filters', 'Policy engines', 'Tool permission scopes']],
      ['lora', 'deep', 3, 'Now', 'Fine-tuning with LoRA', 'Small adapter layers specialise a model on your data cheaply — useful for tone, format and jargon that RAG cannot fix.', ['LoRA & QLoRA', 'Fine-tune vs. RAG', 'Dataset preparation']],
      ['synthetic-data', 'deep', 4, '2026–27', 'Synthetic data for AI', 'Model-generated training and test data fills gaps where real data is scarce, private or expensive to label.', ['Generation pipelines', 'Quality filtering', 'Model collapse risk']],
      ['structured-outputs', 'deep', 4, 'Now', 'Structured outputs & function calling', 'Reliable JSON and tool calls turn chat into software. Schema-constrained decoding made them dependable.', ['JSON Schema', 'Constrained decoding', 'Error recovery']],
      ['computer-use', 'deep', 4, '2026–27', 'Computer-use agents', 'Agents that operate real apps by looking at the screen and clicking — automation for legacy systems with no API.', ['Screenshot → action loops', 'Browser agents', 'Safety sandboxes']],
      ['spec-driven', 'deep', 4, '2026–27', 'Spec-driven development with AI', 'Write a clear spec, let agents generate and verify the code. The developer role shifts toward design and review.', ['Specs as source of truth', 'Test-first with agents', 'Review checklists']],
      ['ai-gateway', 'deep', 4, 'Now', 'AI gateways & model routing', 'A gateway in front of many models picks the cheapest one that is good enough and adds caching, quotas and failover.', ['Model routing', 'Semantic caching', 'Rate limits & fallback']],
      ['inference-cost', 'deep', 4, 'Now', 'Inference cost optimisation', 'AI spend is a board-level line item. Caching, batching, smaller models and routing can cut bills dramatically.', ['Prompt caching', 'Batch APIs', 'Cost per task']],
      ['red-teaming', 'deep', 4, 'Now', 'AI red teaming', 'Attacking your own models to find jailbreaks, data leaks and unsafe behaviour before others do — increasingly expected by regulators.', ['Jailbreak techniques', 'Automated red teaming', 'Reporting & fixes']],
      ['ai-science', 'deep', 4, '2027–30', 'AI for science', 'AI is speeding up drug, materials and climate research — protein-structure prediction even earned a Nobel Prize.', ['Protein structure models', 'AI-run experiments', 'Scientific foundation models']],
      ['durable-agents', 'deep', 3, '2026–27', 'Durable execution for agents', 'Long-running agents crash, wait for humans and retry. Durable workflow engines make them resumable and auditable.', ['Workflow engines', 'Checkpoints & retries', 'Human approval steps']],
      ['embeddings', 'deep', 4, 'Now', 'Embedding models & semantic search', 'Embeddings turn text, images and code into vectors that capture meaning — the base of RAG, recommendations and dedup.', ['Vector similarity', 'Matryoshka embeddings', 'Domain-tuned embeddings']],
      ['webgpu-ai', 'deep', 3, '2026–27', 'In-browser AI with WebGPU', 'Models running directly in the browser give zero server cost and full privacy.', ['WebGPU', 'WASM runtimes', 'Model size limits']],
      ['generative-ui', 'deep', 3, '2026–27', 'Generative UI', 'Interfaces generated on the fly by models — dashboards, forms and widgets built for each request.', ['Component streaming', 'Design-system guardrails', 'When not to generate UI']],

      ['moe', 'expert', 4, 'Now', 'Mixture of Experts (MoE)', 'Many frontier models activate only a slice of their weights per token. MoE explains how models got bigger yet cheaper to run.', ['Routers & experts', 'Sparse activation', 'Load balancing']],
      ['ssm', 'expert', 3, '2027–28', 'State-space models (Mamba)', 'A transformer alternative with linear-time sequence processing; hybrids are appearing in production models for long context.', ['Selective state spaces', 'Linear vs. quadratic attention', 'Hybrid architectures']],
      ['diffusion-llm', 'expert', 3, '2027–28', 'Diffusion language models', 'Generate whole blocks of text in parallel instead of token by token — promising big speed-ups.', ['Denoising for text', 'Parallel decoding', 'Quality trade-offs']],
      ['speculative-decoding', 'expert', 3, 'Now', 'Speculative decoding', 'A small draft model guesses tokens and the big model verifies them in one pass — much faster generation with the same output quality.', ['Draft & verify', 'Acceptance rate', 'Multi-token heads']],
      ['quantization', 'expert', 4, 'Now', 'Model quantization', 'Shrinking weights to 8, 4 or fewer bits lets big models run on smaller GPUs and devices.', ['INT8 / INT4 / FP8', 'Post-training vs. QAT', 'Measuring accuracy loss']],
      ['llm-serving', 'expert', 4, 'Now', 'KV cache & LLM serving', 'Serving engines squeeze huge throughput from GPUs by managing attention memory cleverly — core knowledge for anyone hosting models.', ['PagedAttention', 'Continuous batching', 'Prefix caching']],
      ['interpretability', 'expert', 4, '2027–30', 'Mechanistic interpretability', 'Researchers can now find features inside models and trace how they reason — key for trust, safety and debugging.', ['Sparse autoencoders', 'Features & circuits', 'Attribution graphs']],
      ['rl-finetuning', 'expert', 4, 'Now', 'RLHF & reinforcement fine-tuning', 'Reinforcement learning teaches models to follow instructions and reason; RL on verifiable rewards drove the reasoning-model leap.', ['Reward models', 'DPO & GRPO', 'Verifiable rewards']],
      ['distillation', 'expert', 4, 'Now', 'Knowledge distillation', 'Teaching a small student model from a big teacher is the main way capable small models get made.', ['Teacher → student', 'Logit vs. output distillation', 'Licence limits']],
      ['long-context', 'expert', 3, 'Now', 'Long-context models', 'Million-token windows let models read whole codebases and contracts — but cost and "lost in the middle" still matter.', ['Position encodings', 'Needle-in-a-haystack tests', 'Long context vs. RAG']],
      ['ai-accelerators', 'expert', 4, '2026–28', 'AI accelerators beyond GPUs', 'TPUs, custom cloud chips and inference ASICs are competing with GPUs on cost per token.', ['Training vs. inference silicon', 'HBM memory', 'Compiler stacks']],
      ['federated-learning', 'expert', 3, '2027–28', 'Federated learning', 'Train models across hospitals, banks or phones without moving the raw data — increasingly relevant under privacy rules.', ['Federated averaging', 'Secure aggregation', 'Non-IID data']],
      ['vla', 'expert', 4, '2027–30', 'Vision-language-action (VLA) models', 'The foundation-model recipe now trains robots: one model that sees, understands instructions and moves.', ['Action tokens', 'Sim-to-real transfer', 'Teleoperation data']],
      ['alignment', 'expert', 3, '2027+', 'AI alignment techniques', 'Methods like constitutional AI and scalable oversight shape how models behave. Alignment literacy is becoming a must for AI leaders.', ['Constitutional AI', 'Scalable oversight', 'Specification gaming']],
      ['agent-sandboxing', 'expert', 4, '2026–27', 'Agent sandboxing & permissions', 'Agents that run code and touch real systems need isolation: containers, microVMs and least-privilege tokens.', ['MicroVM isolation', 'Capability scoping', 'Audit trails']],
      ['self-improving', 'expert', 3, '2028–30', 'Self-improving agents', 'Agents that write their own tools, learn reusable skills and refine their own prompts from experience.', ['Skill libraries', 'Reflection loops', 'Safe self-modification']]
    ],

    cloud: [
      ['platform-eng', 'quick', 5, 'Now', 'Platform engineering & IDPs', 'Internal developer platforms give teams self-service "golden paths" to ship faster. One of the fastest-growing DevOps specialities.', ['Golden paths', 'Developer portals (Backstage)', 'Platform as a product']],
      ['finops', 'quick', 5, 'Now', 'FinOps & the FOCUS spec', 'Cloud and AI bills keep climbing. FinOps unites engineering and finance on cost, and FOCUS standardises billing data across clouds.', ['Unit economics', 'Showback & chargeback', 'FOCUS billing format']],
      ['greenops', 'quick', 3, '2026–28', 'GreenOps & sustainable cloud', 'Carbon-aware scheduling and efficiency reporting are entering ESG requirements, especially given AI’s energy appetite.', ['Carbon intensity', 'Carbon-aware scheduling', 'Cloud Scope 3 emissions']],
      ['sovereign-cloud', 'quick', 4, '2026–27', 'Sovereign cloud', 'Regulated customers want clouds operated under local law and control. Hyperscalers and local providers are racing to offer it.', ['Residency vs. sovereignty', 'Operational sovereignty', 'EU frameworks']],
      ['gitops', 'quick', 4, 'Now', 'GitOps', 'Git becomes the source of truth for infrastructure and apps, and controllers keep reality in sync with it.', ['Declarative desired state', 'Argo CD & Flux', 'Drift detection']],
      ['aiops', 'quick', 4, '2026–27', 'AIOps & AI SRE agents', 'AI agents that triage alerts, find root causes and propose fixes are moving from hype into on-call rotations.', ['Alert correlation', 'Root-cause analysis', 'Auto-remediation guardrails']],
      ['dora', 'quick', 3, 'Now', 'DORA metrics & developer experience', 'Measuring delivery speed, stability and developer experience is how leaders prove platform and AI investments pay off.', ['The four key metrics', 'SPACE & DevEx', 'Measuring AI impact']],
      ['cloud-dev-env', 'quick', 3, '2026–27', 'Cloud development environments', 'Ready-to-code environments in the cloud end "works on my machine" and pair naturally with coding agents.', ['Dev containers', 'Ephemeral environments', 'Secure remote dev']],

      ['k8s-ai', 'deep', 5, 'Now', 'Kubernetes for AI workloads', 'Kubernetes is becoming the operating system for GPUs, scheduling training jobs and serving models at scale.', ['GPU scheduling', 'Dynamic Resource Allocation', 'Model serving on K8s']],
      ['opentelemetry', 'deep', 4, 'Now', 'OpenTelemetry', 'The vendor-neutral standard for traces, metrics and logs — now extending to LLM and agent telemetry.', ['Traces, metrics & logs', 'Collector pipelines', 'Semantic conventions']],
      ['iac-next', 'deep', 3, 'Now', 'Infrastructure as Code: OpenTofu & beyond', 'IaC keeps evolving: open-source forks, policy checks and AI-generated templates are changing how infrastructure is written.', ['Terraform vs. OpenTofu', 'State management', 'Testing modules']],
      ['policy-as-code', 'deep', 4, 'Now', 'Policy as code', 'Security and compliance rules written as code that runs in pipelines and clusters — essential for governing AI-generated infra.', ['OPA & Rego', 'Kyverno', 'Admission control']],
      ['serverless-gpu', 'deep', 4, '2026–27', 'Serverless GPUs', 'Pay-per-second GPUs for inference make AI apps viable without owning hardware.', ['Cold starts', 'Scale to zero', 'Cost vs. reserved capacity']],
      ['progressive-delivery', 'deep', 3, 'Now', 'Progressive delivery & feature flags', 'Ship to 1% of users, watch, then roll out — critical when AI features behave unpredictably.', ['Canary releases', 'Feature flags', 'Automated rollback']],
      ['chaos', 'deep', 3, 'Now', 'Chaos engineering', 'Break things on purpose to learn how systems fail — now applied to AI agents and multi-cloud setups too.', ['Steady-state hypothesis', 'Fault injection', 'Game days']],
      ['crossplane', 'deep', 3, '2026–27', 'Cloud control planes with Crossplane', 'Manage any cloud resource through Kubernetes-style APIs — the backbone of many internal platforms.', ['Compositions', 'Providers', 'Platform APIs']],
      ['dapr', 'deep', 3, '2026–27', 'Dapr & portable microservices', 'Sidecar building blocks for state, pub/sub and workflows make microservices portable across clouds.', ['Building blocks', 'Sidecar model', 'Dapr Workflows']],
      ['gateway-api', 'deep', 3, 'Now', 'Kubernetes Gateway API', 'The successor to Ingress for routing traffic in Kubernetes, now also learning to route AI inference.', ['Gateways & routes', 'Role separation', 'Inference extension']],
      ['agentic-devops', 'deep', 4, '2026–27', 'Agentic CI/CD pipelines', 'Pipelines where agents fix failing builds, bump dependencies and draft release notes.', ['Self-healing CI', 'Agent permissions in CI', 'Human approvals']],

      ['ebpf', 'expert', 5, 'Now', 'eBPF', 'Run safe programs inside the Linux kernel for networking, security and observability with almost no overhead.', ['Kernel hooks', 'Cilium', 'The verifier']],
      ['wasm-server', 'expert', 4, '2026–28', 'Server-side WebAssembly (WASI)', 'Tiny, secure, instant-start sandboxes that run anywhere. WASI and the component model make Wasm a real container alternative for some workloads.', ['WASI 0.2 & components', 'Wasm vs. containers', 'Edge runtimes']],
      ['ambient-mesh', 'expert', 3, '2026–27', 'Sidecar-less service mesh', 'Ambient-mode meshes drop per-pod sidecars, cutting cost and complexity while keeping mTLS and traffic control.', ['Node proxies & waypoints', 'mTLS', 'Sidecar vs. ambient']],
      ['cell-architecture', 'expert', 3, '2026–27', 'Cell-based architecture', 'Splitting a system into isolated cells limits the blast radius of failures — a pattern behind the largest cloud services.', ['Cells & cell routers', 'Blast radius', 'Shuffle sharding']],
      ['karpenter', 'expert', 3, 'Now', 'Just-in-time autoscaling (Karpenter)', 'Provisioning right-sized nodes on demand, including spot capacity, is one of the biggest cost levers in Kubernetes.', ['Node provisioning', 'Spot instances', 'Consolidation']],
      ['durable-execution', 'expert', 4, '2026–27', 'Durable execution (Temporal)', 'Write workflows as normal code that survives crashes and runs for months — the backbone of reliable payments and agents.', ['Workflows & activities', 'Event-history replay', 'Determinism rules']],
      ['microvms', 'expert', 3, '2026–28', 'MicroVMs (Firecracker)', 'Lightweight VMs that boot in milliseconds power serverless platforms and safe sandboxes for AI agents.', ['MicroVM vs. container', 'Snapshot & restore', 'Multi-tenant isolation']]
    ],

    data: [
      ['lakehouse', 'quick', 4, 'Now', 'The data lakehouse', 'One copy of data serving BI, data science and AI, on cheap object storage with warehouse-grade reliability.', ['Lake vs. warehouse vs. lakehouse', 'Open table formats', 'Medallion architecture']],
      ['data-mesh', 'quick', 3, 'Now', 'Data mesh', 'Domain teams own their data as products instead of queueing for one central data team.', ['Domain ownership', 'Data as a product', 'Federated governance']],
      ['data-contracts', 'quick', 4, '2026–27', 'Data contracts', 'Agreements between data producers and consumers on schema and quality stop pipelines from silently breaking.', ['Schema + SLAs', 'Enforcement in CI', 'Clear ownership']],
      ['semantic-layer', 'quick', 4, '2026–27', 'The semantic layer', 'One shared definition of metrics like "revenue" for every BI tool and AI agent — critical for trustworthy AI analytics.', ['Metric definitions', 'Headless BI', 'Semantic layer for LLMs']],
      ['ai-ready-data', 'quick', 5, 'Now', 'AI-ready data', 'Most AI projects stall on data, not models. Clean, governed, discoverable data is the real bottleneck.', ['Data quality dimensions', 'Metadata & lineage', 'Unstructured data prep']],
      ['zero-etl', 'quick', 3, '2026–27', 'Zero-ETL & live data sharing', 'Query data where it lives instead of copying it through pipelines, and share live tables across platforms.', ['Federated queries', 'Live data sharing', 'Trade-offs']],
      ['clean-rooms', 'quick', 3, '2026–27', 'Data clean rooms', 'Combine datasets with partners without exposing raw records — big in advertising, retail and healthcare.', ['Privacy-safe joins', 'Query restrictions', 'Use cases']],
      ['text-to-sql', 'quick', 5, 'Now', 'Text-to-SQL & AI data analysts', 'Ask questions in plain language and get correct SQL — if your metadata and semantic layer are good.', ['Schema grounding', 'Semantic layers', 'Accuracy evaluation']],
      ['data-products', 'quick', 3, '2026–27', 'Data products & marketplaces', 'Packaging data with owners, SLAs and docs so people — and AI agents — can safely self-serve.', ['Product thinking for data', 'Discoverability', 'Internal marketplaces']],

      ['iceberg', 'deep', 5, 'Now', 'Apache Iceberg', 'The open table format the industry is converging on: one dataset, many engines, no lock-in.', ['Snapshots & time travel', 'REST catalogs', 'Partition evolution']],
      ['vector-db', 'deep', 4, 'Now', 'Vector databases', 'Storage and search for embeddings — the memory layer behind RAG and semantic search.', ['ANN indexes (HNSW)', 'Metadata filtering', 'Dedicated DB vs. pgvector']],
      ['hybrid-search', 'deep', 4, 'Now', 'Hybrid search & reranking', 'Keyword plus vector search, followed by a reranker, is the proven recipe for retrieval quality.', ['BM25 + vectors', 'Reciprocal rank fusion', 'Cross-encoder rerankers']],
      ['streaming', 'deep', 4, 'Now', 'Real-time streaming (Kafka + Flink)', 'Fraud detection, personalisation and AI agents need data in seconds, not overnight.', ['Event streams', 'Stream processing', 'Exactly-once semantics']],
      ['duckdb', 'deep', 4, 'Now', 'DuckDB & in-process analytics', 'A laptop can now crunch analytics that once needed a cluster. DuckDB is changing how data work starts.', ['Columnar engines', 'In-process OLAP', 'Querying Parquet directly']],
      ['data-observability', 'deep', 3, 'Now', 'Data observability', 'Monitoring freshness, volume and schema catches bad data before dashboards and models consume it.', ['The five pillars', 'Anomaly detection', 'Lineage-based impact']],
      ['catalogs', 'deep', 4, '2026–27', 'Unified catalogs & data governance', 'Open catalogs govern tables, files, models and AI assets in one place with fine-grained access.', ['Open catalogs', 'Lineage', 'Attribute-based access']],
      ['knowledge-graphs', 'deep', 4, '2026–27', 'Enterprise knowledge graphs', 'Graphs model relationships between customers, products and processes — fuel for GraphRAG and AI reasoning.', ['Ontologies', 'Graph queries', 'Entity resolution']],
      ['postgres', 'deep', 4, 'Now', 'Postgres as the everything database', 'Extensions turn Postgres into a vector store, queue, time-series and search engine — fewer systems to run.', ['pgvector', 'The extension ecosystem', 'When to specialise']],
      ['unstructured', 'deep', 4, 'Now', 'Unstructured data pipelines', 'PDFs, emails and images hold most enterprise knowledge. Parsing them well is a top AI enabler.', ['Document parsing & OCR', 'Layout-aware chunking', 'Metadata extraction']],

      ['arrow', 'expert', 3, '2026–27', 'Apache Arrow & ADBC', 'A shared in-memory columnar format lets tools exchange data without copying — the plumbing of the modern data stack.', ['Columnar memory layout', 'Arrow Flight', 'ADBC drivers']],
      ['differential-privacy', 'expert', 3, '2027–28', 'Differential privacy', 'Mathematically bounded privacy for analytics and AI training, already used by governments and big tech.', ['Privacy budgets (epsilon)', 'Noise mechanisms', 'Utility trade-offs']],
      ['streaming-lakehouse', 'expert', 3, '2026–28', 'The streaming lakehouse', 'Merging streams and tables so the same data serves real-time and historical queries.', ['Incremental processing', 'Table formats for streams', 'Late-arriving data']],
      ['feature-stores', 'expert', 3, 'Now', 'Feature stores & real-time ML', 'Consistent features for training and serving, at millisecond latency.', ['Online vs. offline store', 'Point-in-time correctness', 'Training–serving skew']],
      ['cdc', 'expert', 3, 'Now', 'Change data capture (CDC)', 'Streaming every database change downstream keeps analytics and AI in sync without heavy batch jobs.', ['Log-based CDC', 'Debezium', 'Ordering & schema changes']],
      ['composable-data', 'expert', 3, '2027–28', 'Composable data systems', 'Mix-and-match storage, query engines and execution libraries instead of one monolithic platform.', ['Storage/compute separation', 'Substrait query plans', 'Modular engines']]
    ],

    security: [
      ['zero-trust', 'quick', 4, 'Now', 'Zero trust', '"Never trust, always verify" replaces the castle-and-moat network and is now the default model for enterprises and governments.', ['Identity as the perimeter', 'Least privilege', 'Continuous verification']],
      ['passkeys', 'quick', 5, 'Now', 'Passkeys & passwordless', 'Phishing-resistant sign-in built into phones and browsers is replacing passwords across major platforms.', ['FIDO2 & WebAuthn', 'Synced vs. device-bound', 'Rollout strategy']],
      ['prompt-injection', 'quick', 5, 'Now', 'Prompt injection & LLM security', 'Top of the OWASP Top 10 for LLM apps. Any agent that reads untrusted content can be hijacked.', ['Direct vs. indirect injection', 'OWASP LLM Top 10', 'Mitigation patterns']],
      ['deepfake-fraud', 'quick', 4, 'Now', 'Deepfake social engineering', 'Cloned voices and live video deepfakes are already being used to trick staff into large payments.', ['Voice & video cloning', 'Verification procedures', 'Detection limits']],
      ['supply-chain', 'quick', 5, 'Now', 'Software supply chain security', 'Attackers target dependencies and build systems. SBOMs and signed builds are becoming mandatory for software sold to governments.', ['SBOMs', 'SLSA levels', 'Dependency hijacking']],
      ['nhi', 'quick', 5, '2026–27', 'Non-human identities & secrets', 'Service accounts, API keys and AI agents vastly outnumber people. Securing machine identities is a fast-growing market.', ['Workload identity', 'Secrets rotation', 'Agent identity']],
      ['c2pa', 'quick', 3, '2026–27', 'Content credentials (C2PA)', 'Tamper-evident provenance labels show where media came from — increasingly important in the deepfake era.', ['Provenance manifests', 'Watermarking', 'Platform adoption']],
      ['ransomware', 'quick', 4, 'Now', 'Ransomware resilience', 'Assume breach: immutable backups, fast recovery and rehearsed playbooks matter as much as prevention.', ['Immutable backups', 'Recovery time objectives', 'Tabletop exercises']],

      ['pqc', 'deep', 5, '2026–30', 'Post-quantum cryptography', 'NIST published quantum-safe standards in 2024. Organisations must inventory and migrate their crypto before quantum computers can break today’s keys.', ['ML-KEM & ML-DSA', 'Harvest now, decrypt later', 'Crypto inventory']],
      ['crypto-agility', 'deep', 4, '2026–28', 'Crypto agility', 'Systems built to swap algorithms without rewrites — the key enabler of the post-quantum migration.', ['Crypto abstraction layers', 'Certificate lifecycle', 'Hybrid key exchange']],
      ['ai-soc', 'deep', 4, 'Now', 'The AI-powered SOC', 'AI agents triage alerts, investigate incidents and draft reports, easing analyst burnout.', ['Alert-triage agents', 'SOAR', 'Human oversight']],
      ['ctem', 'deep', 4, '2026–27', 'Continuous threat exposure management', 'Continuously find and prioritise what attackers can actually reach, instead of drowning in vulnerability lists.', ['Attack surface management', 'Exploitability ranking', 'Validation']],
      ['sase', 'deep', 3, 'Now', 'SASE & SSE', 'Networking and security delivered from the cloud for a work-from-anywhere world.', ['SWG, CASB & ZTNA', 'SD-WAN', 'Single- vs. multi-vendor']],
      ['dspm', 'deep', 4, '2026–27', 'Data security posture management', 'Find where sensitive data lives across clouds and AI pipelines, and who can reach it.', ['Data discovery', 'Classification', 'Access risk']],
      ['itdr', 'deep', 4, 'Now', 'Identity threat detection & response', 'Most breaches involve stolen identities; ITDR watches for compromised accounts and hijacked sessions.', ['Session hijacking', 'MFA fatigue attacks', 'Identity telemetry']],
      ['cnapp', 'deep', 3, 'Now', 'Cloud-native app protection (CNAPP)', 'One platform for cloud posture, workloads, containers and code-to-cloud risk.', ['CSPM & CWPP', 'Attack paths', 'Shift-left scanning']],
      ['agent-security', 'deep', 5, '2026–27', 'Securing AI agents', 'Agents with tool access are a new attack surface: over-permissioned tokens, poisoned tools and data exfiltration.', ['Least-privilege tools', 'Tool poisoning', 'Agent audit logs']],
      ['id-wallets', 'deep', 4, '2026–28', 'Digital identity wallets', 'Government IDs and verifiable credentials in your phone wallet — the EU is rolling out its digital identity wallet.', ['Verifiable credentials', 'Selective disclosure', 'The EU digital identity wallet']],

      ['confidential-computing', 'expert', 4, '2026–28', 'Confidential computing', 'Hardware enclaves keep data encrypted even while in use, enabling private AI on sensitive data.', ['Trusted execution environments', 'Remote attestation', 'Confidential GPUs']],
      ['memory-safety', 'expert', 4, 'Now', 'Memory-safe languages (Rust)', 'About 70% of serious bugs in some large codebases are memory-safety issues; governments now urge memory-safe languages.', ['Ownership & borrowing', 'Rust in the Linux kernel', 'Migration strategies']],
      ['fhe', 'expert', 3, '2028–30', 'Fully homomorphic encryption', 'Compute on encrypted data without ever decrypting it. Hardware acceleration is making it practical.', ['FHE schemes', 'Performance costs', 'Use cases']],
      ['zk-proofs', 'expert', 3, '2027–28', 'Zero-knowledge proofs', 'Prove something is true — age, solvency, a correct computation — without revealing the data.', ['zk-SNARKs', 'Proving vs. verifying', 'Real-world uses']],
      ['sigstore', 'expert', 3, 'Now', 'Signed builds with Sigstore', 'Keyless signing makes it easy to prove who built an artifact and how.', ['Keyless signing', 'Transparency logs', 'Admission policies']],
      ['adversarial-ml', 'expert', 4, '2026–27', 'Adversarial ML & data poisoning', 'Poisoned training data and adversarial inputs can quietly corrupt models.', ['Data poisoning', 'Evasion attacks', 'Model supply chain']],
      ['deception', 'expert', 3, '2026–27', 'Deception technology', 'Decoy credentials and fake assets catch attackers early with almost no false positives.', ['Honeytokens', 'Decoy networks', 'Alert workflows']],
      ['detection-as-code', 'expert', 3, 'Now', 'Detection engineering as code', 'Detection rules treated like software — versioned, tested and shipped through CI.', ['Sigma rules', 'Testing detections', 'MITRE ATT&CK mapping']]
    ],

    emerging: [
      ['quantum-101', 'quick', 4, '2028–30', 'Quantum computing 101', 'Knowing what quantum can and cannot do keeps you credible as hardware roadmaps accelerate.', ['Superposition & entanglement', 'Qubit types', 'Realistic use cases']],
      ['humanoids', 'quick', 5, '2027–30', 'Humanoid robots', 'Several companies are piloting humanoids in factories and warehouses, powered by robot foundation models.', ['Actuators & hands', 'Robot learning', 'Business cases']],
      ['spatial', 'quick', 4, '2026–28', 'Spatial computing & smart glasses', 'AI-powered glasses and headsets put assistants in your field of view — a candidate for the next computing interface.', ['AR vs. VR vs. MR', 'Spatial UX', 'Glasses + AI assistants']],
      ['digital-twins', 'quick', 4, 'Now', 'Industrial digital twins', 'Live virtual copies of factories, grids and cities let teams simulate changes before making them.', ['Twin vs. simulation', 'IoT data feeds', 'Physics + AI']],
      ['direct-to-cell', 'quick', 3, '2026–28', 'Satellite direct-to-cell', 'Ordinary phones connecting straight to satellites will shrink mobile dead zones.', ['LEO constellations', 'Direct-to-device', 'Use cases']],
      ['ai-energy', 'quick', 5, 'Now', 'Energy for AI data centres', 'AI is driving a surge in power demand; nuclear deals, small modular reactors and cooling are now tech strategy.', ['Power density', 'SMRs & power deals', 'Liquid cooling']],
      ['robotaxis', 'quick', 4, '2026–28', 'Robotaxis & autonomy', 'Driverless ride services already run commercially in several cities and keep expanding.', ['Sensor stacks', 'End-to-end driving models', 'Regulation']],
      ['tokenisation', 'quick', 4, '2026–28', 'Stablecoins & tokenised assets', 'Tokenised money and real-world assets are entering mainstream finance as regulation lands.', ['Stablecoin regulation', 'Asset tokenisation', 'Settlement rails']],
      ['6g', 'quick', 3, '2030+', '6G & AI-native networks', '6G research puts AI inside the network itself, adds sensing and targets massive IoT.', ['AI-native RAN', 'Integrated sensing', 'Timeline']],
      ['matter', 'quick', 3, 'Now', 'Matter & the smart home', 'One interoperability standard for smart devices across the big ecosystems.', ['Matter & Thread', 'Interoperability', 'Local control']],

      ['qec', 'deep', 5, '2028–30', 'Quantum error correction', 'Logical qubits built from many physical ones are the path to useful quantum computers, and recent experiments crossed key thresholds.', ['Physical vs. logical qubits', 'Surface codes', 'Error thresholds']],
      ['quantum-sensing', 'deep', 4, '2027–30', 'Quantum sensing', 'Quantum sensors measure time, gravity and magnetism with extreme precision — likely the first quantum tech to hit wide markets.', ['Atomic clocks', 'Navigation without GPS', 'Medical imaging']],
      ['quantum-networking', 'deep', 3, '2028–30', 'Quantum networking & QKD', 'Entanglement-based networks promise provably secure links and, later, connected quantum computers.', ['Quantum key distribution', 'Quantum repeaters', 'The quantum internet']],
      ['riscv', 'deep', 4, '2026–28', 'RISC-V', 'The open instruction set is spreading from microcontrollers into data centres and cars.', ['Open ISA', 'Extensions', 'Ecosystem']],
      ['chiplets', 'deep', 4, 'Now', 'Chiplets & advanced packaging', 'Building processors from smaller dies stitched together is how chips keep getting faster.', ['UCIe', '2.5D & 3D packaging', 'HBM']],
      ['edge-ai', 'deep', 4, '2026–27', 'Edge AI & TinyML', 'Models running on sensors and machines make instant, private decisions without the cloud.', ['TinyML', 'Edge accelerators', 'Fleet updates']],
      ['bci', 'deep', 3, '2028–30', 'Brain-computer interfaces', 'Implants let paralysed patients control computers by thought, and non-invasive versions are emerging.', ['Invasive vs. non-invasive', 'Neural decoding', 'Ethics']],
      ['ambient-iot', 'deep', 3, '2027–30', 'Ambient IoT', 'Battery-free tags powered by radio waves could connect billions of everyday items.', ['Energy harvesting', 'Backscatter', 'Supply-chain uses']],
      ['depin', 'deep', 2, '2027–30', 'DePIN', 'Decentralised physical infrastructure networks crowdsource wireless, mapping and compute with token incentives.', ['Token incentives', 'Hardware networks', 'Viability']],
      ['ai-drug-discovery', 'deep', 4, '2027–30', 'AI drug discovery & synthetic biology', 'AI-designed molecules are reaching clinical trials, and programmable biology is becoming a platform.', ['Generative chemistry', 'Protein design', 'Lab automation']],
      ['space-compute', 'deep', 2, '2030+', 'Space-based computing', 'Orbital data centres and on-satellite processing are being explored for AI and Earth observation.', ['Orbital edge computing', 'Power & cooling in orbit', 'Downlink limits']],

      ['quantum-algorithms', 'expert', 3, '2028–30', 'Quantum algorithms (Shor, Grover, VQE)', 'Knowing the algorithms tells you which quantum claims are real — and when RSA is actually at risk.', ['Shor & RSA', 'Grover speed-ups', 'Variational algorithms']],
      ['neuromorphic', 'expert', 3, '2028–30', 'Neuromorphic computing', 'Brain-inspired chips process spikes, promising ultra-low-power AI at the edge.', ['Spiking neural networks', 'Event cameras', 'On-chip learning']],
      ['photonics', 'expert', 4, '2026–28', 'Photonics & co-packaged optics', 'Moving data with light instead of electrons is key to scaling AI clusters.', ['Co-packaged optics', 'Silicon photonics', 'Optical interconnects']],
      ['hybrid-quantum', 'expert', 3, '2027–30', 'Hybrid quantum-classical computing', 'Near-term value comes from quantum processors working alongside HPC and GPUs.', ['QPU + GPU workflows', 'Quantum SDKs', 'Error mitigation']],
      ['in-memory-compute', 'expert', 3, '2028–30', 'In-memory & analog computing', 'Computing inside memory arrays attacks the energy cost of moving data — vital for AI.', ['The memory wall', 'Analog matrix multiply', 'Resistive memory']]
    ]
  };

  const TOPICS = [];
  Object.keys(ROWS).forEach(area => {
    ROWS[area].forEach(([slug, depth, heat, eta, title, why, learn]) => {
      TOPICS.push({ id: area + '-' + slug, area, depth, heat, eta, title, why, learn });
    });
  });

  root.FS_AREAS = AREAS;
  root.FS_DEPTHS = DEPTHS;
  root.FS_TOPICS = TOPICS;
})(this);
