/*
 * Live Radar — trending tech stories from the public Hacker News Search API (no key needed).
 * Stories from the last 3 days are tagged with a FutureSpin area by keyword; untagged ones are dropped.
 * Results are cached in localStorage for 3 hours. Any failure resolves to [] (the strip stays hidden).
 */
(function (root) {
  const CACHE_KEY = 'futurespin:radar:v1';
  const TTL_MS = 3 * 3600e3;
  const WINDOW_DAYS = 3;
  const MAX_ITEMS = 18;

  // Most specific areas first; AI keywords are broad, so AI is checked last.
  const RULES = [
    ['security', /\b(security|vulnerab\w*|exploit\w*|cve-\d+|malware|ransomware|phishing|breach\w*|hack(ed|ers?)|encrypt\w*|cryptograph\w*|passkeys?|passwords?|zero[- ]day|backdoor\w*|spyware|privacy|surveillance|authenticat\w*|oauth|jailbreak\w*|prompt injection|supply[- ]chain attack)\b/i],
    ['emerging', /\b(quantum|qubits?|robot\w*|humanoids?|drones?|satellites?|starlink|rockets?|fusion|nuclear|batter(y|ies)|chips?|semiconductors?|risc-?v|tsmc|lidar|self-driving|autonomous|waymo|robotaxis?|smart glasses|headsets?|brain-computer|neuralink|6g|iot|photonic\w*|neuromorphic)\b/i],
    ['data', /\b(databases?|sql|postgres(ql)?|sqlite|mysql|duckdb|clickhouse|kafka|flink|spark|iceberg|parquet|data (lakes?|warehouses?|pipelines?|engineering)|analytics|etl|vector (db|database|search)|bigquery|snowflake|databricks|pandas|polars|datasets?)\b/i],
    ['cloud', /\b(kubernetes|k8s|docker|containers?|aws|azure|gcp|google cloud|cloud|cloudflare|serverless|devops|terraform|opentofu|ci\/cd|github actions|linux|kernel|wasm|webassembly|ebpf|observability|opentelemetry|microservices?|outages?|deploy\w*|infrastructure|sre)\b/i],
    ['ai', /\b(ai|llms?|gpt[-\s]?\d*(\.\d+)?|agi|openai|anthropic|claude|gemini|llama|mistral|deepseek|qwen|chatgpt|copilot|agents?|agentic|mcp|rag|transformers?|neural|machine learning|deep learning|inference|fine-?tun\w*|embeddings?|diffusion|reasoning|language models?|prompts?|nvidia|gpus?|opus|sonnet|haiku)\b/i]
  ];

  function classify(title) {
    for (const [area, re] of RULES) if (re.test(title)) return area;
    return null;
  }

  function safeUrl(u) {
    return typeof u === 'string' && /^https?:\/\//i.test(u) ? u : null;
  }

  function toItems(hits) {
    return hits
      .filter(h => h && h.title && h.objectID)
      .map(h => {
        const discuss = 'https://news.ycombinator.com/item?id=' + encodeURIComponent(h.objectID);
        return {
          id: 'hn-' + h.objectID,
          title: String(h.title),
          url: safeUrl(h.url) || discuss,
          discuss,
          points: h.points | 0,
          comments: h.num_comments | 0,
          area: classify(h.title),
          source: 'radar'
        };
      })
      .filter(it => it.area)
      .sort((a, b) => b.points - a.points)
      .slice(0, MAX_ITEMS);
  }

  function readCache() {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY));
      return c && Array.isArray(c.items) ? c : null;
    } catch (e) { return null; }
  }

  async function fetchItems() {
    const since = Math.floor(Date.now() / 1000) - WINDOW_DAYS * 86400;
    const url = 'https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=200'
      + '&numericFilters=' + encodeURIComponent('created_at_i>' + since + ',points>60');
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctrl && setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return toItems(data.hits || []);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function load() {
    const cached = readCache();
    if (cached && Date.now() - cached.at < TTL_MS) return cached.items;
    try {
      const items = await fetchItems();
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items })); } catch (e) { /* storage full */ }
      return items;
    } catch (e) {
      return cached ? cached.items : [];
    }
  }

  root.FSRadar = { classify, toItems, load };
})(this);
