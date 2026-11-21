/*
 * FutureSpin Interview Prep: topic library for AI Engineer and Forward Deployed Engineer (FDE) roles.
 *
 * Each topic:
 *   id, track, roles ('both' | 'ai' | 'fde'), priority (1-5, how much it is worth preparing),
 *   title, gist (the idea in plain words), asks (real interview questions),
 *   cover (what a strong answer includes), practice, flag (common mistake),
 *   res: learning links as [kind, title, source, url]; kind = article | video | docs | guide | course | book | podcast | case-study
 */
(function (root) {
  const TRACKS = {
    llm: { label: 'LLM foundations', short: 'Foundations', color: 'var(--track-llm)', framework: 'concept' },
    build: { label: 'Building AI apps', short: 'Build', color: 'var(--track-build)', framework: 'concept' },
    design: { label: 'AI system design', short: 'Design', color: 'var(--track-design)', framework: 'design' },
    fde: { label: 'FDE: customer & delivery', short: 'FDE', color: 'var(--track-fde)', framework: 'bluf' },
    coding: { label: 'Coding & practical rounds', short: 'Coding', color: 'var(--track-coding)', framework: 'thinkaloud' },
    behavioral: { label: 'Behavioural stories', short: 'Stories', color: 'var(--track-behavioral)', framework: 'star' }
  };

  const ROLES = {
    ai: { label: 'AI Engineer', short: 'AI Engineer' },
    fde: { label: 'Forward Deployed Engineer', short: 'FDE' }
  };

  const TOPICS = [
    // ---------- LLM foundations ----------
    {
      id: 'llm-transformers', track: 'llm', roles: 'both', priority: 4,
      title: 'How transformers and attention work',
      gist: 'A transformer reads every token of the input at once instead of word by word. Attention lets each token look at all the others and decide which ones matter to it: in “the animal didn’t cross the street because it was tired”, “it” links to “animal”. Dozens of these layers are stacked, and the model ends by predicting the next token, then repeats.',
      asks: ['Explain attention to a non-technical person.', 'Why did transformers replace RNNs?', 'Why is reading the prompt fast but writing the answer slow?'],
      cover: ['Reading in parallel made training on GPUs at huge scale possible', 'Query, key, value: what a token looks for, what it offers, what it passes on', 'Many attention heads learn different links; layers stack on top', 'The prompt is processed in one pass; the answer comes one token at a time'],
      practice: 'Explain the “it → animal” example out loud in 60 seconds, then add one sentence on why this made models scalable.',
      flag: 'Saying the model “looks facts up in a database” or “understands like a human”.',
      res: [
        ['article', 'The Illustrated Transformer', 'Jay Alammar', 'https://jalammar.github.io/illustrated-transformer/'],
        ['video', 'Attention in transformers, step-by-step | Deep Learning Chapter 6', 'YouTube, 3Blue1Brown', 'https://www.youtube.com/watch?v=eMlx5fFNoYc'],
        ['article', 'Some Intuition on Attention and the Transformer', 'Eugene Yan', 'https://eugeneyan.com/writing/attention/'],
        ['article', 'Transformers Explained Visually (Part 1): Overview of Functionality', 'Medium, Ketan Doshi (TDS Archive)', 'https://medium.com/data-science/transformers-explained-visually-part-1-overview-of-functionality-95a6dd460452']
      ]
    },
    {
      id: 'llm-tokens', track: 'llm', roles: 'both', priority: 4,
      title: 'Tokens, tokenization and context windows',
      gist: 'Models see tokens, not words or letters: chunks of text from a fixed vocabulary. Roughly 1 token ≈ 4 characters ≈ ¾ of an English word, and code or non-English text uses more. The context window is the most tokens one request can hold, counting the system prompt, history, documents, tool definitions and the answer.',
      asks: ['Why can’t an LLM reliably count the r’s in “strawberry”?', 'Your data does not fit in the context window. What do you do?', 'Estimate the monthly cost of this use case.'],
      cover: ['You pay per token, and output tokens cost more than input tokens', 'Too big? Retrieve only what matters, summarise history, or split and combine', 'A bigger window is not automatically more accurate: facts in the middle get missed', 'Every part of the request counts toward the limit'],
      practice: 'Paste a paragraph into an online tokenizer. Then estimate the cost of 10,000 support tickets a day at about 2,000 tokens each.',
      flag: '“Just use the model with the biggest context window.”',
      res: [
        ['docs', 'Understanding and counting tokens', 'OpenAI Help Center', 'https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them'],
        ['video', 'Let’s build the GPT Tokenizer', 'YouTube, Andrej Karpathy', 'https://www.youtube.com/watch?v=zduSFxRajkE'],
        ['course', 'Byte-Pair Encoding tokenization', 'Hugging Face LLM Course', 'https://huggingface.co/learn/llm-course/chapter6/5'],
        ['article', 'Lost in the Middle: How Language Models Use Long Contexts', 'Liu et al. (Stanford), arXiv', 'https://arxiv.org/abs/2307.03172']
      ]
    },
    {
      id: 'llm-sampling', track: 'llm', roles: 'both', priority: 3,
      title: 'Sampling: temperature, top-p and non-determinism',
      gist: 'At each step the model gives a probability to every possible next token, and sampling picks one. Low temperature makes output focused and repeatable; high temperature makes it more varied, with more mistakes. Top-p only samples from the most likely tokens until their probabilities add up to p. Even at temperature 0 outputs can differ, because GPU maths varies with batching and providers update models.',
      asks: ['What temperature would you use for data extraction vs marketing copy?', 'A customer gets different answers to the same question. Why, and how do you fix it?'],
      cover: ['Low temperature for extraction, classification and code; higher for ideas', 'Tune temperature or top-p, not both', 'For consistency: structured outputs, few-shot examples, a pinned model version, caching', 'Run evals several times to measure how much results vary'],
      practice: 'Run the same prompt 5 times at temperature 0 and 5 times at 1. Compare the answers and describe the difference out loud.',
      flag: '“Temperature 0 guarantees identical output”, or using temperature to fix wrong facts.',
      res: [
        ['article', 'How do temperature, top-k, and top-p sampling differ?', 'Sebastian Raschka', 'https://sebastianraschka.com/faq/docs/temperature-topk-topp-sampling.html'],
        ['article', 'How to generate text: using different decoding methods for language generation with Transformers', 'Hugging Face Blog', 'https://huggingface.co/blog/how-to-generate'],
        ['article', 'Defeating Nondeterminism in LLM Inference', 'Thinking Machines Lab', 'https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/'],
        ['article', 'The Science of Control: How Temperature, Top_p, and Top_k Shape Large Language Models', 'Medium, Daniel Puente Viejo', 'https://medium.com/@daniel.puenteviejo/the-science-of-control-how-temperature-top-p-and-top-k-shape-large-language-models-853cb0480dae']
      ]
    },
    {
      id: 'llm-hallucination', track: 'llm', roles: 'both', priority: 5,
      title: 'Why models hallucinate, and how to reduce it',
      gist: 'Models are trained to produce plausible text, not to check facts, and training and benchmarks tend to reward a confident guess over “I don’t know”. The main defences: ground answers in source documents, require citations and allow the model to say it could not find the answer, verify claims with a second check or a tool, and narrow the task while measuring the hallucination rate with evals.',
      asks: ['The customer’s bot invented a refund policy. Walk me through fixing it.', 'Can hallucinations be eliminated?', 'How would you measure how often your system hallucinates?'],
      cover: ['They can be reduced and detected, not eliminated', 'Layered defences: grounding, citations, verification, narrow scope', 'Use tools (a database, a calculator) for facts instead of model memory', 'Design the UX for it: show sources and offer an easy handoff to a human'],
      practice: 'Read about the 2024 Air Canada chatbot case, where the airline was held liable for a policy its bot made up. Explain in 60 seconds how you would have prevented it.',
      flag: '“Fine-tune it so it stops hallucinating.” Fine-tuning teaches behaviour, not reliable facts.',
      res: [
        ['article', 'Why language models hallucinate', 'OpenAI', 'https://openai.com/index/why-language-models-hallucinate/'],
        ['docs', 'Reduce hallucinations', 'Anthropic, Claude Docs', 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations'],
        ['article', 'Extrinsic Hallucinations in LLMs', 'Lilian Weng', 'https://lilianweng.github.io/posts/2024-07-07-hallucination/']
      ]
    },
    {
      id: 'llm-rag-vs-ft', track: 'llm', roles: 'both', priority: 5,
      title: 'Prompting vs RAG vs fine-tuning: how to choose',
      gist: 'Three levers. Prompting changes the instructions and is always the first thing to try. RAG gives the model the right knowledge at answer time, for private, changing or large data. Fine-tuning changes the model’s weights with examples, for consistent behaviour, format or tone, or to make a small, cheap model good at one narrow task. Rule of thumb: RAG for knowledge, fine-tuning for behaviour.',
      asks: ['The client wants to fine-tune on 5,000 policy PDFs so the bot “knows” their policies. What do you advise?', 'When is fine-tuning actually the right call?'],
      cover: ['Start with prompting and an eval baseline; escalate only when evals show a gap', 'RAG wins for facts that change, citations and per-user permissions', 'Fine-tuning needs labelled data and ongoing maintenance', 'They combine: a fine-tuned model can still use RAG'],
      practice: 'Pick a lever for each: (a) contract clauses into fixed JSON, (b) HR policy Q&A, (c) emails in the brand voice. Give one sentence of reasoning for each.',
      flag: 'Jumping straight to fine-tuning, or saying it “teaches the model our documents”.',
      res: [
        ['guide', 'Optimizing LLM Accuracy', 'OpenAI Docs', 'https://developers.openai.com/api/docs/guides/optimizing-llm-accuracy'],
        ['video', 'A Survey of Techniques for Maximizing LLM Performance', 'YouTube, OpenAI', 'https://www.youtube.com/watch?v=ahnGLM-RC1Y'],
        ['article', 'LLM Fine-tuning — FAQs', 'Medium, Shaw Talebi (TDS Archive)', 'https://medium.com/data-science/llm-fine-tuning-faqs-200442827c99']
      ]
    },
    {
      id: 'llm-training', track: 'llm', roles: 'ai', priority: 3,
      title: 'The training pipeline: pretraining → SFT → RLHF',
      gist: 'Pretraining: the model learns to predict the next token over trillions of tokens of web, book and code text, giving a base model that knows a lot but only continues text. SFT (supervised fine-tuning) trains it on example prompts and ideal answers so it behaves like an assistant. RLHF pushes it toward answers people prefer, using a reward model learned from human comparisons. DPO and AI feedback are newer variants, and reasoning models add reinforcement learning on problems with checkable answers.',
      asks: ['What is the difference between a base model and a chat model?', 'What does RLHF actually change?', 'How are reasoning models trained differently?'],
      cover: ['Pretraining gives knowledge (and the knowledge cutoff); SFT gives format; RLHF gives preferences and safety', 'RLHF side effects: sycophancy and refusing too often', 'Reasoning models: RL rewarded on maths and code answers that can be checked', 'Customer fine-tuning is a small SFT-style step on top'],
      practice: 'Say the analogy out loud: pretraining = reading the whole library, SFT = an apprenticeship with worked examples, RLHF = a manager picking the better of two drafts.',
      flag: 'Mixing up RLHF and RAG, or thinking the model learns from your chats in real time.',
      res: [
        ['video', 'Deep Dive into LLMs like ChatGPT', 'YouTube, Andrej Karpathy', 'https://www.youtube.com/watch?v=7xTGNNLPyMI'],
        ['article', 'RLHF: Reinforcement Learning from Human Feedback', 'Chip Huyen', 'https://huyenchip.com/2023/05/02/rlhf.html'],
        ['article', 'Understanding Reasoning LLMs', 'Sebastian Raschka, Ahead of AI', 'https://magazine.sebastianraschka.com/p/understanding-reasoning-llms']
      ]
    },
    {
      id: 'llm-ml-basics', track: 'llm', roles: 'ai', priority: 3,
      title: 'Classic ML basics: overfitting, precision and recall',
      gist: 'Train on the training set, tune on the validation set, and use the test set once for an honest score; if test data leaks into training, results look fake-good. Overfitting is memorising the training data and failing on new data. Precision asks “of what I flagged, how much was right?”, recall asks “of what was really there, how much did I catch?”, and F1 balances the two.',
      asks: ['Your model is 98% accurate. Is that good?', 'For fraud detection, do you favour precision or recall?', 'Training accuracy is 99%, test accuracy is 70%. What is happening?'],
      cover: ['Accuracy misleads on imbalanced data: with 1% fraud, “never fraud” is 99% accurate', 'Tie the metric to what each kind of mistake costs', 'Spam filter → precision; fraud or cancer screening → recall', 'Same rules for LLM evals: do not tune prompts on your final test set'],
      practice: 'There are 100 real frauds; the model flags 80 transactions and 60 are fraud. Work out precision (75%), recall (60%) and F1 (about 67%) out loud.',
      flag: 'Reporting accuracy alone.',
      res: [
        ['article', 'Beyond Accuracy: Precision and Recall', 'Medium, Will Koehrsen (TDS Archive)', 'https://medium.com/data-science/beyond-accuracy-precision-and-recall-3da06bea9f6c'],
        ['course', 'Datasets: Dividing the original dataset', 'Google Machine Learning Crash Course', 'https://developers.google.com/machine-learning/crash-course/overfitting/dividing-datasets'],
        ['docs', 'Common pitfalls and recommended practices', 'scikit-learn Docs', 'https://scikit-learn.org/stable/common_pitfalls.html'],
        ['video', 'Machine Learning Fundamentals: Bias and Variance', 'YouTube, StatQuest with Josh Starmer', 'https://www.youtube.com/watch?v=EuBBz3bI-aA']
      ]
    },
    {
      id: 'llm-embeddings', track: 'llm', roles: 'both', priority: 4,
      title: 'Embeddings and semantic search',
      gist: 'An embedding model turns text (or images, or code) into a list of numbers where similar meanings land close together. Semantic search embeds the question and finds the nearest stored vectors, usually by cosine similarity. Keyword search (BM25) still wins on exact terms like product codes, so production systems often combine both: hybrid search.',
      asks: ['What is an embedding, in plain words?', 'When does keyword search beat vector search?', 'How would you choose an embedding model?'],
      cover: ['Similar meaning → nearby vectors; cosine similarity measures closeness', 'Hybrid search: vectors for meaning, keywords for exact terms, then rerank', 'Choose models by testing on your own queries, not leaderboards alone', 'Changing the embedding model means re-embedding everything'],
      practice: 'Explain why “reset my password” and “I can’t log in” match in vector search but not in keyword search, then name one query where keyword search wins.',
      flag: 'Treating the vector database as the whole solution and never measuring retrieval.',
      res: [
        ['article', 'Embeddings: What they are and why they matter', 'Simon Willison', 'https://simonwillison.net/2023/Oct/23/embeddings/'],
        ['guide', 'What is a Vector Database & How Does it Work?', 'Pinecone', 'https://www.pinecone.io/learn/vector-database/'],
        ['article', 'Hybrid Search Explained', 'Weaviate Blog', 'https://weaviate.io/blog/hybrid-search-explained']
      ]
    },

    // ---------- Building AI apps ----------
    {
      id: 'build-llm-apis', track: 'build', roles: 'ai', priority: 3,
      title: 'Calling LLM APIs in production',
      gist: 'A demo calls the API once; production has to survive rate limits, timeouts, overloaded servers and slow, long answers. That means streaming tokens to the user, retrying temporary errors with exponential backoff, setting timeouts, staying inside request and token quotas, and caching repeated prompt prefixes to cut cost and latency.',
      asks: ['Your app hits 429 rate-limit errors at peak. What do you do?', 'Why stream responses, and what changes in your code when you do?', 'How do you keep working when a model provider has an outage?'],
      cover: ['Retry 429 and 5xx errors with exponential backoff and jitter; never retry bad requests', 'Stream for perceived speed; handle partial output and cancellation', 'Timeouts, queues and fallback models or providers', 'Prompt caching for long, repeated system prompts and documents'],
      practice: 'Write a small Python function that calls an LLM API with a timeout, 3 retries with backoff and streaming output. Explain each choice out loud.',
      flag: 'Retrying everything immediately in a tight loop.',
      res: [
        ['article', 'Timeouts, retries, and backoff with jitter', 'Amazon Builders’ Library, Marc Brooker', 'https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter'],
        ['docs', 'Rate limits', 'Claude Docs (Anthropic)', 'https://platform.claude.com/docs/en/api/rate-limits'],
        ['docs', 'Prompt caching', 'Claude Docs (Anthropic)', 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching']
      ]
    },
    {
      id: 'build-prompting', track: 'build', roles: 'both', priority: 4,
      title: 'Prompt design patterns',
      gist: 'A good prompt reads like a brief for a smart new colleague: the goal, the context, clear rules, the output format and a few examples. Structure helps: separate instructions from data with tags or headings, show two or three examples of the exact output you want, and split big tasks into a chain of smaller prompts. Treat prompts like code: version them and test them against evals.',
      asks: ['Walk me through how you would write a prompt to classify support tickets.', 'Your prompt works 80% of the time. How do you improve it?', 'When do you split one prompt into several?'],
      cover: ['Clear task, context, constraints, output format and examples', 'Separate instructions from data with tags (this also helps against injection)', 'Improve from real failure cases and measure with an eval set', 'Chain prompts when one step is doing too many jobs'],
      practice: 'Write a prompt that turns a messy customer email into JSON {intent, urgency, summary}. Test it on 5 tricky emails and fix the failures.',
      flag: 'Adding “IMPORTANT!!!” and magic phrases instead of clear instructions and examples.',
      res: [
        ['docs', 'Prompting best practices', 'Claude Docs (Anthropic)', 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices'],
        ['video', 'AI prompt engineering: A deep dive', 'YouTube, Anthropic', 'https://www.youtube.com/watch?v=T9aRN5JkmL8'],
        ['article', 'How I Won Singapore’s GPT-4 Prompt Engineering Competition', 'Medium, Sheila Teo (Towards Data Science)', 'https://medium.com/data-science/how-i-won-singapores-gpt-4-prompt-engineering-competition-34c195a93d41'],
        ['course', 'Anthropic’s Interactive Prompt Engineering Tutorial', 'GitHub, Anthropic', 'https://github.com/anthropics/prompt-eng-interactive-tutorial']
      ]
    },
    {
      id: 'build-tools', track: 'build', roles: 'both', priority: 5,
      title: 'Tool use, function calling and MCP',
      gist: 'Function calling lets a model ask your code to do something. You describe each tool with a name, a description and a JSON schema; the model replies with a tool call and arguments; your code runs it and sends the result back. MCP (Model Context Protocol) is an open standard for packaging tools and data as servers, so any MCP-compatible app can use them without custom glue code.',
      asks: ['Explain how function calling works, step by step.', 'What is MCP, and why does it matter for enterprise integrations?', 'How do you stop a model from calling a dangerous tool with bad arguments?'],
      cover: ['The model never runs code: your app executes the call and returns the result', 'Good tool names, descriptions and schemas matter as much as the prompt', 'MCP: hosts, clients and servers that expose tools, resources and prompts', 'Validate arguments, limit permissions, ask a human before risky actions'],
      practice: 'Sketch the JSON schema for a “refund_order” tool, then explain where you would add validation and human approval.',
      flag: 'Thinking the model executes the tool itself.',
      res: [
        ['docs', 'Tool use with Claude', 'Claude Docs (Anthropic)', 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview'],
        ['docs', 'What is the Model Context Protocol (MCP)?', 'modelcontextprotocol.io', 'https://modelcontextprotocol.io/docs/getting-started/intro'],
        ['article', 'Writing effective tools for agents — with agents', 'Anthropic Engineering', 'https://www.anthropic.com/engineering/writing-tools-for-agents'],
        ['video', 'Building Agents with Model Context Protocol - Full Workshop with Mahesh Murag of Anthropic', 'YouTube, AI Engineer', 'https://www.youtube.com/watch?v=kQmXtrmQ5Zg']
      ]
    },
    {
      id: 'build-rag', track: 'build', roles: 'both', priority: 5,
      title: 'Building a RAG pipeline end to end',
      gist: 'RAG has two halves. Indexing: load documents, split them into chunks, embed them and store them with metadata. Answering: embed the question, retrieve the best chunks (often hybrid search plus a reranker), put them in the prompt and ask the model to answer only from them, with citations. Most quality problems are retrieval problems, so measure retrieval separately from the final answer.',
      asks: ['Walk me through building a RAG system over a company wiki.', 'Answers are wrong. How do you tell whether retrieval or generation is the problem?', 'How do you choose a chunk size?'],
      cover: ['Chunking strategy and metadata (source, date, permissions)', 'Hybrid search plus reranking usually beats either one alone', 'Evaluate retrieval (did we fetch the right chunk?) separately from answer faithfulness', 'Keep the index fresh and respect user permissions'],
      practice: 'Draw the indexing and answering pipelines as two rows of boxes, then name one failure mode for each box.',
      flag: 'Tuning the prompt when the right document was never retrieved.',
      res: [
        ['article', 'Contextual Retrieval in AI Systems', 'Anthropic', 'https://www.anthropic.com/news/contextual-retrieval'],
        ['guide', 'Chunking Strategies for LLM Applications', 'Pinecone', 'https://www.pinecone.io/learn/chunking-strategies/'],
        ['article', 'Systematically Improving Your RAG', 'Jason Liu', 'https://jxnl.co/writing/2024/05/22/systematically-improving-your-rag/'],
        ['article', 'Advanced RAG Techniques: an Illustrated Overview', 'Medium, Ivan Ilin (Towards AI)', 'https://pub.towardsai.net/advanced-rag-techniques-an-illustrated-overview-04d193d8fec6']
      ]
    },
    {
      id: 'build-agents', track: 'build', roles: 'both', priority: 5,
      title: 'Building an agent loop from scratch',
      gist: 'An agent is a model in a loop: it decides the next step, calls a tool, reads the result and repeats until the task is done or a limit is hit. A workflow is a fixed sequence of LLM steps that your code controls. Use the simplest thing that works: a single call, then a workflow, and only then an agent for open-ended tasks where the steps cannot be known in advance.',
      asks: ['What is the difference between an agent and a workflow?', 'Write the core loop of an agent without a framework.', 'How do you stop an agent from looping forever or doing something harmful?'],
      cover: ['The loop: model → tool call → result → model … → final answer', 'Stop conditions: maximum steps, budget, timeouts', 'Guardrails: limited tools, approval for risky actions, a log of every step', 'Agents trade predictability and cost for flexibility'],
      practice: 'Write a 30-line agent loop in Python with two tools (search and calculator) and a maximum-steps limit. Explain each line.',
      flag: 'Reaching for a multi-agent framework when one prompt or a fixed workflow would do.',
      res: [
        ['article', 'Building effective agents', 'Anthropic Engineering', 'https://www.anthropic.com/engineering/building-effective-agents'],
        ['video', 'How We Build Effective Agents: Barry Zhang, Anthropic', 'YouTube, AI Engineer', 'https://www.youtube.com/watch?v=D7_ipDqhtwk'],
        ['article', 'How to Build an Agent', 'Amp, Thorsten Ball', 'https://ampcode.com/how-to-build-an-agent'],
        ['article', 'Building ReAct Agents from Scratch: A Hands-On Guide using Gemini', 'Medium, Google Cloud Community', 'https://medium.com/google-cloud/building-react-agents-from-scratch-a-hands-on-guide-using-gemini-ffe4621d90ae']
      ]
    },
    {
      id: 'build-evals', track: 'build', roles: 'both', priority: 5,
      title: 'Designing evals for an LLM app',
      gist: 'Evals are the tests of an AI product. Start by reading real outputs and writing down how they fail (error analysis), then turn those failures into a test set with the expected behaviour. Check what you can with code (format, required fields, exact answers) and use an LLM-as-judge with a clear rubric for fuzzier qualities, after checking that the judge agrees with humans.',
      asks: ['How would you evaluate a customer-support bot before launch?', 'What is LLM-as-judge, and when can you trust it?', 'How do you know a prompt change did not make things worse?'],
      cover: ['Error analysis first: read real traces and name the failure types', 'A test set built from real and edge cases that grows over time', 'Code checks where possible; judge models with rubrics, checked against humans', 'Run evals on every change, like regression tests'],
      practice: 'For a bot that answers HR policy questions, list 5 failure types and write one test case for each.',
      flag: '“We tried a few prompts and it looked good.”',
      res: [
        ['article', 'Your AI Product Needs Evals', 'Hamel Husain', 'https://hamel.dev/blog/posts/evals/'],
        ['guide', 'Using LLM-as-a-Judge For Evaluation: A Complete Guide', 'Hamel Husain', 'https://hamel.dev/blog/posts/llm-judge/'],
        ['article', 'Eval-driven development: Lessons from evaluating GenAI at scale', 'Medium, The Airbnb Tech Blog', 'https://medium.com/airbnb-engineering/eval-driven-development-lessons-from-evaluating-genai-at-scale-e817e5ae5788']
      ]
    },
    {
      id: 'build-cost-latency', track: 'build', roles: 'both', priority: 4,
      title: 'Latency, cost and quality trade-offs',
      gist: 'Every AI feature balances three things: how good the answer is, how fast it arrives and what it costs. The main levers are model choice (send easy requests to a small model), prompt length, caching repeated content, streaming, batching jobs that are not urgent and running steps in parallel. Measure cost per completed task, not cost per token.',
      asks: ['This feature costs $40k a month. How would you cut that in half?', 'Users say the bot feels slow. What do you look at first?', 'When is a smaller model good enough?'],
      cover: ['Measure first: where do the tokens and the seconds actually go?', 'Route by difficulty; cache prompts and frequent answers', 'Stream to feel faster; batch offline work at lower prices', 'Re-run evals to prove quality held after each saving'],
      practice: 'Estimate the monthly cost of a bot handling 5,000 chats a day, then propose three changes and the saving from each.',
      flag: 'Switching to a cheaper model without re-running evals.',
      res: [
        ['article', 'Building A Generative AI Platform', 'Chip Huyen', 'https://huyenchip.com/2024/07/25/genai-platform.html'],
        ['docs', 'Latency optimization', 'OpenAI Docs', 'https://developers.openai.com/api/docs/guides/latency-optimization'],
        ['article', 'RouteLLM: An Open-Source Framework for Cost-Effective LLM Routing', 'LMSYS', 'https://lmsys.org/blog/2024-07-01-routellm/'],
        ['docs', 'Batch processing', 'Claude Docs (Anthropic)', 'https://platform.claude.com/docs/en/build-with-claude/batch-processing']
      ]
    },
    {
      id: 'build-security', track: 'build', roles: 'both', priority: 4,
      title: 'Prompt injection, data leaks and AI security',
      gist: 'Prompt injection is when text the model reads (an email, a web page, a document) contains instructions that hijack it. It becomes dangerous when an agent has access to private data, reads untrusted content and has a way to send data out. The defences are mostly about design: least-privilege tools, keeping trusted and untrusted input apart, human approval for risky actions, and keeping personal data out of prompts and logs where possible.',
      asks: ['What is prompt injection, and why is it hard to fix?', 'An agent reads customer emails and can send emails. What could go wrong?', 'How do you handle personal data (PII) in an LLM application?'],
      cover: ['Direct vs indirect injection; no prompt fully prevents it', 'Limit what a hijacked agent could do: least privilege and no way to send data out', 'Human approval for actions that cannot be undone; log everything', 'PII: redact or mask, retention settings, regional processing, access control'],
      practice: 'Explain the “lethal trifecta” (private data + untrusted content + a way to send data out), then redesign an email agent to break it.',
      flag: '“We added a line to the system prompt telling it to ignore malicious instructions.”',
      res: [
        ['guide', 'OWASP Top 10 for LLM Applications (2025)', 'OWASP Gen AI Security Project', 'https://genai.owasp.org/llm-top-10/'],
        ['article', 'The lethal trifecta for AI agents: private data, untrusted content, and external communication', 'Simon Willison', 'https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/'],
        ['article', 'Design Patterns for Securing LLM Agents against Prompt Injections', 'Simon Willison', 'https://simonwillison.net/2025/Jun/13/prompt-injection-design-patterns/'],
        ['article', 'Securing Generative AI: Defending Against Prompt Injection', 'Medium, Google Cloud Community', 'https://medium.com/google-cloud/securing-generative-ai-defending-against-prompt-injection-94e3bfdb43ab']
      ]
    },

    // ---------- AI system design ----------
    {
      id: 'design-framework', track: 'design', roles: 'both', priority: 5,
      title: 'A framework for AI system design interviews',
      gist: 'AI design rounds reward structure more than buzzwords. Clarify the users, the task, scale, latency and risk; sketch the data flow; choose models and retrieval or tools; explain how you will evaluate it; cover safety and failure handling; and finish with cost, rollout and monitoring. Say the trade-off out loud at every step.',
      asks: ['Design an AI assistant for [any domain]. Where do you start?', 'How do you decide between an API model and hosting your own?', 'What would you build for version 1, and what would you leave out?'],
      cover: ['Clarify: users, success metric, scale, latency, data, risk', 'Design: data flow, model choice, retrieval or tools, human in the loop', 'Evaluate: offline evals, guardrails, failure modes', 'Ship: cost, phased rollout, monitoring and feedback'],
      practice: 'Run the framework on “an AI assistant for hotel front-desk staff” in 5 minutes, out loud, with a timer.',
      flag: 'Jumping to “we use GPT plus a vector database” before asking a single question.',
      res: [
        ['guide', 'System Design Delivery Framework (ML System Design in a Hurry)', 'Hello Interview', 'https://www.hellointerview.com/learn/ml-system-design/in-a-hurry/delivery'],
        ['guide', 'What We’ve Learned From A Year of Building with LLMs', 'applied-llms.org, Eugene Yan, Bryan Bischof, Charles Frye, Hamel Husain, Jason Liu, Shreya Shankar', 'https://applied-llms.org/'],
        ['article', 'AI System Design Interview Questions: Explain the Decisions Behind the Diagram', 'Medium, Rany ElHousieny', 'https://ranyel.medium.com/ai-system-design-interview-questions-with-examples-1da61fa425e8'],
        ['case-study', 'ML and LLM system design: 800 case studies to learn from', 'Evidently AI', 'https://www.evidentlyai.com/ml-system-design']
      ]
    },
    {
      id: 'design-support-agent', track: 'design', roles: 'both', priority: 5,
      title: 'Design a customer-support AI agent',
      gist: 'A good support agent answers from the knowledge base with citations, takes safe actions through tools (order status, refunds within limits) and hands off to a human, with the full context, when it is unsure, the customer is upset or the action is risky. Success is measured by resolution rate, customer satisfaction and the quality of escalations, not just by how many tickets it deflects.',
      asks: ['Design an AI agent for an airline’s customer support.', 'When should the agent hand off to a human?', 'How do you measure whether it is working?'],
      cover: ['Knowledge (RAG over help centre and policies) plus actions (limited tools)', 'Clear escalation rules and a handoff that carries the conversation', 'Guardrails: policy limits, approval for refunds, no invented policies', 'Metrics: resolution rate, CSAT, escalation rate, cost per ticket; review transcripts weekly'],
      practice: 'Draw it on paper: channels → agent → knowledge and tools → human handoff → analytics. Explain it in 2 minutes.',
      flag: 'Optimising only for deflection, which hides frustrated customers.',
      res: [
        ['case-study', 'Automation Platform v2: Improving conversational AI at Airbnb', 'Medium, The Airbnb Tech Blog', 'https://medium.com/airbnb-engineering/automation-platform-v2-improving-conversational-ai-at-airbnb-d86c9386e0cb'],
        ['case-study', 'To escalate, or not to escalate, that is the question', 'Intercom, Fin AI Research', 'https://fin.ai/research/to-escalate-or-not-to-escalate-that-is-the-question/'],
        ['case-study', 'Turbocharging Customer Support Chatbot Development with LLM-Based Automated Evaluation', 'Instacart Tech Blog', 'https://company.instacart.com/tech-innovation/turbocharging-customer-support-chatbot-development-with-llm-based-automated-evaluation']
      ]
    },
    {
      id: 'design-doc-qa', track: 'design', roles: 'both', priority: 4,
      title: 'Design document Q&A over millions of documents',
      gist: 'At enterprise scale the hard parts are not the model. They are ingesting many sources, keeping the index fresh and making sure people only get answers from documents they are allowed to read. A typical design has connectors and an ingestion pipeline, chunking with metadata, hybrid search with reranking and permission filters, then answers with citations and an eval loop.',
      asks: ['Design Q&A over 10 million internal documents for 50,000 employees.', 'How do you enforce document permissions in RAG?', 'How do you keep answers fresh when documents change daily?'],
      cover: ['Ingestion: connectors, parsing (PDFs, tables), chunking, metadata', 'Permissions: filter retrieval by the user’s access rights, never after the answer is written', 'Incremental re-indexing for freshness; remove duplicate versions', 'Citations, honest “I could not find it” answers and retrieval evals'],
      practice: 'Explain what goes wrong if you check permissions only after the model has written the answer.',
      flag: 'Ignoring permissions until a security review finds the gap.',
      res: [
        ['article', 'Propagating SharePoint Document Permissions to AI Search and RAG Pipelines', 'Microsoft Dev Blogs, Frontier Engineering', 'https://devblogs.microsoft.com/frontier-engineering/sharepoint-doc-level-access/'],
        ['case-study', 'Building Dash: How RAG and AI agents help us meet the needs of businesses', 'Dropbox Tech Blog', 'https://dropbox.tech/machine-learning/building-dash-rag-multi-step-ai-agents-business-users'],
        ['article', 'Your RAG system works on 10,000 documents. Here’s why it dies at 30 million.', 'Medium, Daniel Manzke', 'https://medium.com/@danielmanzke/your-rag-system-works-on-10-000-documents-heres-why-it-dies-at-30-million-529171cd30c0']
      ]
    },
    {
      id: 'design-extraction', track: 'design', roles: 'both', priority: 4,
      title: 'Design a document extraction pipeline',
      gist: 'Many enterprise AI wins are unglamorous: turning invoices, contracts or claim forms into structured data. A typical pipeline classifies the document, reads the text and layout (OCR, or a vision-language model reading the page image), fills a fixed schema using structured outputs, checks the result against business rules and sends low-confidence cases to a human reviewer.',
      asks: ['Design a system that extracts fields from 100,000 invoices a month.', 'How do you know an extracted value is wrong?', 'OCR plus an LLM, or a vision model on the image? How do you decide?'],
      cover: ['Classify → extract → structure (JSON schema) → validate → review', 'Validation rules: totals add up, dates are valid, the vendor exists', 'Confidence-based routing to human review; corrections feed the eval set', 'Track field-level accuracy, the share of documents needing no human, and cost per document'],
      practice: 'List the validation rules you would run on an invoice, then describe the review screen a human would use.',
      flag: 'Trusting extracted numbers without any validation.',
      res: [
        ['case-study', 'Advancing Invoice Document Processing at Uber using GenAI', 'Uber Engineering', 'https://www.uber.com/blog/advancing-invoice-document-processing-using-genai/'],
        ['case-study', 'Null over wrong: Hyper-accurate invoice extraction for Supplier Payments Plus', 'BILL Engineering', 'https://www.bill.com/engineering/hyper-accurate-invoice-extraction-for-supplier-payments-plus'],
        ['case-study', 'Lessons from Running an LLM Document Processing Pipeline in Production', 'Medium, Alan (Othman Moumni Abdou)', 'https://medium.com/alan/lessons-from-running-an-llm-document-processing-pipeline-in-production-33d87f99cdb1']
      ]
    },
    {
      id: 'design-monitoring', track: 'design', roles: 'both', priority: 4,
      title: 'Design evals and monitoring for a live AI product',
      gist: 'Once an AI product is live you need to see what it is doing. Trace every request (prompt, retrieved context, tool calls, output, latency, cost), sample traffic for automatic and human review, collect user feedback, and alert when quality drops, cost rises or failures spike. Bad production cases become new eval cases, which closes the loop.',
      asks: ['How would you know if your AI feature got worse last week?', 'What would you log for every LLM request?', 'How do you turn user feedback into improvements?'],
      cover: ['Tracing: inputs, context, tool calls, outputs, tokens, latency, cost', 'Online evals on sampled traffic plus human review queues', 'Dashboards and alerts for quality, cost, latency and errors', 'Production failures feed the offline eval set'],
      practice: 'Sketch a one-page dashboard for a support bot: which 6 numbers would you show, and why?',
      flag: 'Monitoring only uptime and latency, never answer quality.',
      res: [
        ['article', 'Eval-driven development: Lessons from evaluating GenAI at scale', 'Medium, The Airbnb Tech Blog', 'https://medium.com/airbnb-engineering/eval-driven-development-lessons-from-evaluating-genai-at-scale-e817e5ae5788'],
        ['case-study', 'How Lyft Built a Self-Serve AI Agent Platform for Customer Support with LangGraph and LangSmith', 'LangChain Blog, Lyft (guest post)', 'https://www.langchain.com/blog/lyft-built-a-self-serve-ai-agent-platform-for-customer-support-with-langgraph-and-langsmith'],
        ['guide', 'Demystifying evals for AI agents', 'Anthropic Engineering', 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents'],
        ['article', 'OpenTelemetry for Generative AI', 'OpenTelemetry Blog', 'https://opentelemetry.io/blog/2024/otel-generative-ai/']
      ]
    },
    {
      id: 'design-platform', track: 'design', roles: 'ai', priority: 3,
      title: 'Design a shared LLM platform (AI gateway)',
      gist: 'When many teams build with LLMs, companies put a gateway in front of the model providers. It offers one API for many models, keeps the provider keys, enforces quotas and rate limits per team, routes requests and fails over between providers, caches responses, logs usage for cost tracking and applies shared guardrails such as redacting personal data.',
      asks: ['Design an internal platform that lets 30 teams use LLMs safely.', 'How do you track cost and enforce quotas per team?', 'How do you handle a provider outage?'],
      cover: ['One API, central provider keys, per-team auth and quotas', 'Routing and fallback across models and providers', 'Caching, usage logs and cost per team', 'Shared guardrails and audit logs; each team still owns its evals'],
      practice: 'Draw the request path through the gateway and mark where auth, quotas, caching, routing, guardrails and logging happen.',
      flag: 'Letting every team hard-code its own API keys and providers.',
      res: [
        ['article', 'Building A Generative AI Platform', 'Chip Huyen', 'https://huyenchip.com/2024/07/25/genai-platform.html'],
        ['case-study', 'Grab AI Gateway: Connecting Grabbers to multiple GenAI providers', 'Grab Engineering', 'https://engineering.grab.com/grab-ai-gateway'],
        ['docs', 'AI gateway capabilities in Azure API Management', 'Microsoft Learn', 'https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities']
      ]
    },
    {
      id: 'design-workflow-agent', track: 'design', roles: 'both', priority: 4,
      title: 'Design an agent that automates a back-office workflow',
      gist: 'Think of claims processing, KYC checks or invoice approval. The agent gathers documents, extracts data, checks the rules and drafts a decision, while a human approves anything risky. These workflows run for hours or days, so they need saved state, retries, a full audit trail and clear rules for what the agent may decide on its own.',
      asks: ['Design an agent that processes insurance claims.', 'Which decisions should the agent make alone, and which need a human?', 'How do you make a multi-day workflow survive crashes and restarts?'],
      cover: ['Map the current human process first, then automate it step by step', 'Levels of autonomy: auto-approve low risk, human review for the rest', 'Durable execution: saved state, retries, steps that can resume', 'An audit trail of every input, decision and approval for compliance'],
      practice: 'Pick a process you know (expense claims, onboarding) and mark which steps an agent could do, which need approval and which should stay human.',
      flag: 'Promising full automation on day one in a regulated process.',
      res: [
        ['case-study', 'How we bootstrapped an AI agent platform for operations at Alan', 'Medium, Alan (David Mercklé)', 'https://medium.com/alan/how-we-bootstrapped-an-ai-agents-platform-for-operations-at-alan-fefd87ed6314'],
        ['case-study', 'Trusting AI agents: A reinsurance case study', 'Temporal Blog', 'https://temporal.io/blog/trusting-ai-agents-a-reinsurance-case-study'],
        ['docs', 'Interrupts', 'LangGraph Docs', 'https://docs.langchain.com/oss/python/langgraph/interrupts'],
        ['guide', '12-Factor Agents - Principles for building reliable LLM applications', 'GitHub, HumanLayer (Dex Horthy)', 'https://github.com/humanlayer/12-factor-agents']
      ]
    },

    // ---------- FDE: customer & delivery ----------
    {
      id: 'fde-role', track: 'fde', roles: 'fde', priority: 5,
      title: 'What a Forward Deployed Engineer actually does',
      gist: 'An FDE is a software engineer who works directly with customers. They sit with users, find the real problem, build and deploy the solution on the customer’s own data and systems, and feed what they learn back to the product team. The role started at Palantir and is now common at AI companies, because getting AI into production at a large enterprise takes hands-on engineering, not just a sales demo.',
      asks: ['What do you think an FDE does day to day?', 'How is an FDE different from a solutions engineer or a consultant?', 'Why do AI companies need FDEs now?'],
      cover: ['Engineer first: writes production code, not slides', 'Customer-facing: discovery, scoping, deployment and adoption', 'Unlike consulting, the learnings flow back into a product', 'Why now: enterprise AI value is blocked by integration, data and trust'],
      practice: 'Explain the FDE role to a friend in 60 seconds, using one example of a problem an FDE would solve.',
      flag: 'Describing it as pre-sales demos or as pure consulting.',
      res: [
        ['article', 'A Day in the Life of a Palantir Forward Deployed Software Engineer', 'Palantir Blog (Medium)', 'https://blog.palantir.com/a-day-in-the-life-of-a-palantir-forward-deployed-software-engineer-45ef2de257b1'],
        ['article', 'What are Forward Deployed Engineers, and why are they so in demand?', 'Pragmatic Engineer', 'https://newsletter.pragmaticengineer.com/p/forward-deployed-engineers'],
        ['article', 'Trading Margin for Moat: Why the Forward Deployed Engineer Is the Hottest Job in Startups', 'a16z, Joe Schmidt', 'https://a16z.com/services-led-growth/'],
        ['video', 'Forward Deployed Engineering 101 — Kevin Bai, Anthropic, ex Palantir & Rippling Founding FDE', 'YouTube, AI Engineer', 'https://www.youtube.com/watch?v=KwhgfwOSToQ']
      ]
    },
    {
      id: 'fde-discovery', track: 'fde', roles: 'fde', priority: 5,
      title: 'Discovery: turning “we want AI” into a real problem',
      gist: 'Customers often arrive with a solution (“we want a chatbot”) instead of a problem. Discovery means asking about their actual workflow, where time and money are lost, what they do today and what they have already tried, then finding a narrow, valuable problem with a clear owner and available data. Ask about past behaviour and real numbers, not opinions about the future.',
      asks: ['A VP says “we want to use AI”. What do you ask in the first meeting?', 'How do you find the problem worth solving?', 'How can you tell when a customer is just being polite?'],
      cover: ['Ask about the workflow, the pain and what the pain costs', 'Past behaviour beats hypotheticals: “When did this last happen?”', 'Check data, owners and constraints early', 'Write the problem statement back and get agreement'],
      practice: 'Write 8 discovery questions for a bank that “wants AI for customer onboarding”. Make sure none of them can be answered with yes or no.',
      flag: 'Pitching your solution in the first 10 minutes.',
      res: [
        ['article', 'Review: The Mom Test by Rob Fitzpatrick', 'Yevgeniy Brikman', 'https://www.ybrikman.com/blog/2023/03/29/the-mom-test/'],
        ['video', 'What is Jobs to Be Done Theory?', 'Christensen Institute', 'https://www.christenseninstitute.org/video/what-is-jobs-to-be-done-theory/'],
        ['video', 'How Forward Deployed Engineering is done at Kepler — Vinoo Ganesh', 'YouTube, AI Engineer', 'https://www.youtube.com/watch?v=1OMHGsUZiqA'],
        ['article', 'A Script to Kickstart Interviews About Someone’s Jobs to be Done', 'Medium (JTBD.info), Alan Klement', 'https://jtbd.info/a-script-to-kickstart-your-jobs-to-be-done-interviews-2768164761d7']
      ]
    },
    {
      id: 'fde-pilot', track: 'fde', roles: 'fde', priority: 5,
      title: 'Scoping an AI pilot with success criteria',
      gist: 'Many enterprise AI pilots never reach production because they were scoped as demos, with no clear owner, metric or path to production. A good pilot picks one workflow, defines success up front in business terms (time saved, accuracy, cost per case), agrees on the baseline and the data, sets a fixed time box and decides in advance what “go to production” means.',
      asks: ['How would you scope a 6-week pilot?', 'What success criteria would you agree with the customer?', 'Why do so many AI pilots fail?'],
      cover: ['One workflow, one owner, one main metric with a baseline', 'Data access and security approvals arranged before day one', 'A time box with checkpoints and an agreed go/no-go decision', 'Plan the path to production from the start'],
      practice: 'Write a one-page pilot plan for “AI that drafts replies to customer complaints”: goal, metric, baseline, data, timeline, go/no-go.',
      flag: '“Let’s just build something and see if they like it.”',
      res: [
        ['article', 'MIT report: 95% of generative AI pilots at companies are failing', 'Fortune, Sheryl Estrada', 'https://fortune.com/2025/08/18/mit-report-95-percent-generative-ai-pilots-at-companies-failing-cfo/'],
        ['video', 'Forward Deployed Engineering at Cursor — Pauline Brunet', 'YouTube, AI Engineer', 'https://www.youtube.com/watch?v=APqXGyCoGW4'],
        ['docs', 'Define success criteria and build evaluations', 'Anthropic (Claude Docs)', 'https://platform.claude.com/docs/en/test-and-evaluate/develop-tests']
      ]
    },
    {
      id: 'fde-demo', track: 'fde', roles: 'fde', priority: 4,
      title: 'Building a convincing demo fast',
      gist: 'A strong FDE demo shows the customer’s own problem solved on their own (or realistic) data, in their language, within days. Build the thinnest end-to-end slice that proves the value, tell the story around one user and one before-and-after moment, and be honest about what is real and what is mocked.',
      asks: ['You have 48 hours before a customer demo. How do you spend them?', 'How do you make a demo convincing without overpromising?', 'Tell me about a prototype you built quickly.'],
      cover: ['A thin end-to-end slice beats polished parts', 'Their data and their workflow beat a generic showcase', 'One user story with a clear before and after', 'Say clearly what is mocked and what production would need'],
      practice: 'Plan a 5-minute demo for “AI that summarises maintenance logs for a factory”: the story, the data and the moment that impresses.',
      flag: 'A flashy demo that cannot work with the customer’s real data.',
      res: [
        ['article', 'Deploying Full Spectrum AI in Days: How AIP Bootcamps Work', 'Palantir Blog (Medium)', 'https://blog.palantir.com/deploying-full-spectrum-ai-in-days-how-aip-bootcamps-work-21829ec8d560'],
        ['guide', 'Running reverse demo calls', 'PostHog Handbook', 'https://posthog.com/handbook/growth/sales/reverse-demo-calls']
      ]
    },
    {
      id: 'fde-customer-env', track: 'fde', roles: 'fde', priority: 4,
      title: 'Working inside customer environments',
      gist: 'Enterprise deployments hit security reviews, network rules and data policies long before model quality becomes the problem. FDEs need to explain clearly where data goes, how it is stored and who can access it, and to deploy into the customer’s own cloud account (VPC) or on-premises when required, with single sign-on, logging and least-privilege access.',
      asks: ['The customer’s security team blocks the project. What do you do?', 'Their data cannot leave their cloud account. How do you deploy?', 'What will a security review ask about an AI system?'],
      cover: ['Data flow: where data goes, how long it is kept, who sees it, whether it trains models', 'Deployment options: SaaS, customer VPC, on-premises, and their trade-offs', 'Identity and access: SSO, roles, least privilege, audit logs', 'Bring security in early, with documents ready (SOC 2 report, data-flow diagram)'],
      practice: 'Draw a data-flow diagram for an AI assistant and mark where data is stored, encrypted and logged.',
      flag: 'Treating the security review as paperwork to rush through.',
      res: [
        ['video', 'Deploying AI Inside a Bank Is Not an Engineering Problem — Paden Gayle, Applied AI Engineers', 'YouTube, AI Engineer', 'https://www.youtube.com/watch?v=3ZlQk4-knWM'],
        ['guide', 'EnterpriseReady', 'EnterpriseReady (Replicated)', 'https://www.enterpriseready.io/'],
        ['article', 'The SOC2 starting seven', 'Latacora', 'https://www.latacora.com/blog/2020/03/12/soc2-starting-seven/'],
        ['docs', 'Enterprise privacy at OpenAI', 'OpenAI', 'https://openai.com/enterprise-privacy/']
      ]
    },
    {
      id: 'fde-integrations', track: 'fde', roles: 'fde', priority: 4,
      title: 'Integrating AI with enterprise systems',
      gist: 'The value of enterprise AI usually sits inside existing systems: CRM, ticketing, ERP, document stores and old databases. Integration work means learning their APIs and limits, mapping data between systems, handling auth, rate limits and failures, and deciding whether the AI only reads or also writes back. MCP and ready-made connectors make this faster, but you still have to understand the data.',
      asks: ['How would you connect an AI agent to Salesforce and ServiceNow?', 'The customer’s key system has no API. What are your options?', 'What breaks most often in integrations?'],
      cover: ['Learn the system’s data model and API limits first', 'Read-only first; write back later, with approvals', 'Auth (service accounts, OAuth), retries, safe re-runs, monitoring', 'No API: a database replica, exports, or UI automation as a last resort'],
      practice: 'Describe how you would sync open support tickets into a RAG index every 15 minutes, including what happens when the sync fails.',
      flag: 'Underestimating integration time in the project plan.',
      res: [
        ['article', 'Introducing the Model Context Protocol', 'Anthropic', 'https://www.anthropic.com/news/model-context-protocol'],
        ['article', 'Writing effective tools for agents — with agents', 'Anthropic Engineering', 'https://www.anthropic.com/engineering/writing-tools-for-agents'],
        ['video', 'How Forward Deployed Engineering is done at Decagon — Sunny Rekhi', 'YouTube, AI Engineer', 'https://www.youtube.com/watch?v=7wu2hsRfvV0'],
        ['article', 'Connecting AI to Decisions with the Palantir Ontology', 'Palantir Blog (Medium)', 'https://blog.palantir.com/connecting-ai-to-decisions-with-the-palantir-ontology-c73f7b0a1a72']
      ]
    },
    {
      id: 'fde-communication', track: 'fde', roles: 'both', priority: 5,
      title: 'Explaining AI to executives and to engineers',
      gist: 'Executives want the bottom line first: what it does for the business, what it costs, the risk and the decision you need from them. Engineers want how it works, the interfaces and the trade-offs. FDEs switch between both in the same day, so practise leading with the answer and changing the depth for the audience.',
      asks: ['Explain RAG to a CFO in one minute.', 'Now explain it to their lead engineer.', 'How do you present bad news about a project?'],
      cover: ['Bottom line up front: the answer, then the reasons, then the detail', 'Executives: outcome, cost, risk, decision needed', 'Engineers: architecture, interfaces, limits, trade-offs', 'Bad news early, with options and a recommendation'],
      practice: 'Record yourself explaining the same project twice: 60 seconds for an executive, 2 minutes for an engineer. Compare the two.',
      flag: 'Giving executives a tour of the architecture.',
      res: [
        ['guide', 'Present to executives', 'StaffEng, Will Larson', 'https://staffeng.com/guides/present-to-executives/'],
        ['guide', 'Minto Pyramid', 'Untools', 'https://untools.co/minto-pyramid/'],
        ['video', 'Storytelling with Data | Cole Nussbaumer Knaflic | Talks at Google', 'YouTube, Talks at Google', 'https://www.youtube.com/watch?v=8EMW7io4rSI']
      ]
    },
    {
      id: 'fde-expectations', track: 'fde', roles: 'both', priority: 4,
      title: 'When the AI gets it wrong: managing expectations',
      gist: 'AI systems are probabilistic, so some answers will be wrong, and customers who expect software to be 100% right lose trust fast. Set expectations early with real accuracy numbers on their data, design the workflow so errors get caught (review steps, confidence thresholds), and respond to visible mistakes with a clear plan: what happened, the fix, and how you will measure that it worked.',
      asks: ['The customer’s CEO saw a wrong answer in a demo. What do you do?', 'How do you explain that 90% accuracy is a success?', 'How do you set expectations at the start of a project?'],
      cover: ['Compare with today’s human baseline, not with perfection', 'Agree on acceptable error rates and which errors are critical', 'Design for errors: human review, confidence routing, easy feedback', 'Respond with the cause, the fix and the measurement'],
      practice: 'Write a short email to a customer explaining a visible AI mistake, its root cause and the fix.',
      flag: 'Promising the model will “never make mistakes” once it is tuned.',
      res: [
        ['guide', 'Explainability + Trust (People + AI Guidebook)', 'Google PAIR', 'https://pair.withgoogle.com/chapter/explainability-trust/'],
        ['video', 'Why 99% Accurate Browser Agents Still Fail — Derek Meegan, Browserbase', 'YouTube, AI Engineer', 'https://www.youtube.com/watch?v=5xi_S1f9sDU'],
        ['video', 'The Agent Works. Does Anyone Trust It? — Michele Grant, Leading at Scale', 'YouTube, AI Engineer', 'https://www.youtube.com/watch?v=-a2oTS9J67U'],
        ['article', 'Your AI Product Needs Evals', 'Hamel Husain', 'https://hamel.dev/blog/posts/evals/']
      ]
    },
    {
      id: 'fde-production', track: 'fde', roles: 'fde', priority: 4,
      title: 'From pilot to production, and proving ROI',
      gist: 'A successful pilot is not a successful deployment. Production needs reliability, monitoring, security sign-off, a support owner and, most often forgotten, people actually changing how they work. Prove the return on investment with the metric agreed at the start, measured against the baseline, and translate it into the money or time the customer cares about.',
      asks: ['The pilot went well. What has to happen before production?', 'How do you prove the ROI of an AI deployment?', 'Usage dropped after launch. What do you do?'],
      cover: ['Production checklist: reliability, monitoring, security, ownership, support', 'Adoption: training, internal champions, fitting into existing tools', 'ROI = improvement vs baseline × volume × value of each unit', 'Report results regularly, in the customer’s terms'],
      practice: 'Work out the ROI of a tool that saves 6 minutes on each of 20,000 support tickets a month, then present it in three sentences.',
      flag: 'Declaring success from a demo or from usage numbers alone.',
      res: [
        ['guide', 'AI in the Enterprise: Lessons from seven frontier companies', 'OpenAI', 'https://cdn.openai.com/business-guides-and-resources/ai-in-the-enterprise.pdf'],
        ['article', 'Where’s the Value in AI?', 'BCG', 'https://www.bcg.com/publications/2024/wheres-value-in-ai'],
        ['video', 'Real ROI: Lessons from Enterprises that have already succeeded with LLMs at Scale: Raza Habib', 'YouTube, AI Engineer', 'https://www.youtube.com/watch?v=khcMErjUB8k'],
        ['video', 'How do you diffuse AI into the real world? — Varun Shenoy, Long Lake', 'YouTube, AI Engineer', 'https://www.youtube.com/watch?v=B0fjR3yaZFU']
      ]
    },
    {
      id: 'fde-feedback', track: 'fde', roles: 'fde', priority: 3,
      title: 'Feeding field learnings back to the product',
      gist: 'FDEs see what customers actually need before anyone else does. Part of the job is spotting when a one-off fix for one customer is really a pattern across many, and turning it into a clear product request with evidence. The balance: solve the customer’s problem now without piling up custom code nobody can maintain.',
      asks: ['You built the same workaround for three customers. What do you do?', 'How do you decide between a custom fix and a product change?', 'Tell me about feedback you gave to a product team.'],
      cover: ['Look for patterns across customers, not one loud request', 'Back requests with evidence: who, how often, what it costs them', 'Keep custom code small and documented, with a plan to replace it', 'Tell the customer when the product catches up'],
      practice: 'Write a one-paragraph product request from a pattern you have seen at work: the problem, the evidence, the change and its impact.',
      flag: 'Building a different custom solution for every customer forever.',
      res: [
        ['article', 'Dev versus Delta: Demystifying engineering roles at Palantir', 'Palantir Blog (Medium)', 'https://blog.palantir.com/dev-versus-delta-demystifying-engineering-roles-at-palantir-ad44c2a6e87'],
        ['article', 'Forward Deployed Engineers', 'SVPG, Marty Cagan', 'https://www.svpg.com/forward-deployed-engineers/'],
        ['article', 'The Rise of the Forward Deployed Engineer — and How To Do the Job Right', 'Latent Space, Vinoo Ganesh', 'https://latent.space/p/forward-deployed-engineer-best-practices'],
        ['video', 'How Forward Deployed Engineering is done at Cognition — Jia Wu', 'YouTube, AI Engineer', 'https://www.youtube.com/watch?v=RVxym6mmIns']
      ]
    },

    // ---------- Coding & practical rounds ----------
    {
      id: 'code-decomposition', track: 'coding', roles: 'fde', priority: 4,
      title: 'The decomposition interview',
      gist: 'Common in FDE hiring: you get an open, messy problem (“help a hospital reduce waiting times”) and must break it into parts out loud. Interviewers look for clarifying questions, a sensible structure, priorities, attention to data and users, and a concrete first step, not a perfect answer.',
      asks: ['How would you help a city reduce traffic accidents with software?', 'A retailer is losing money on returns. Where do you start?', 'What would you build first, and why?'],
      cover: ['Clarify the goal, the users and the constraints before solving', 'Break the problem into parts and pick the most valuable one', 'Ask what data exists and how you would measure success', 'End with a concrete first step and how you would test it'],
      practice: 'Set a 10-minute timer and break down “help a food delivery company cut late deliveries” out loud. Record it and listen back.',
      flag: 'Jumping to a technical solution before understanding the problem.',
      res: [
        ['guide', 'How to Answer Decomposition Interview Questions: The Definitive Guide (2026)', 'Aced (formerly Exponent)', 'https://www.aced.io/blog/how-to-answer-decomposition-interview-questions-the-definitive-guide-2026'],
        ['guide', 'Palantir Forward Deployed Engineer (FDE) Interview Guide', 'Aced (formerly Exponent)', 'https://www.aced.io/guides/palantir-forward-deployed-engineer-interview'],
        ['article', 'Interviewing at Palantir: Our advice', 'Medium, Palantir Blog', 'https://blog.palantir.com/interviewing-at-palantir-advice-from-palantirians-88444a90e7c4']
      ]
    },
    {
      id: 'code-practical', track: 'coding', roles: 'both', priority: 4,
      title: 'Practical coding rounds',
      gist: 'AI and FDE coding interviews often skip algorithm puzzles in favour of realistic tasks: parse a messy file, call an API, build a small service, transform data. They check whether you write clear, working code, handle edge cases and explain your choices as you go.',
      asks: ['Parse this log file and report the top errors per hour.', 'Build a small API endpoint that calls an LLM and returns JSON.', 'Clean this CSV with missing and inconsistent values.'],
      cover: ['Restate the task and ask about inputs and edge cases', 'Get a simple version working first, then improve it', 'Clear names, small functions, basic error handling', 'Test with an example as you go, and say what you would add with more time'],
      practice: 'Take any public CSV dataset and, in 45 minutes, write a script that cleans it and prints a summary. Time yourself.',
      flag: 'Coding in silence for 20 minutes, then revealing something that does not run.',
      res: [
        ['guide', 'Stripe Software Engineer Interview Guide', 'Aced (formerly Exponent)', 'https://www.aced.io/guides/stripe-software-engineer-interview'],
        ['docs', 'Tutorial - User Guide (FastAPI)', 'FastAPI Docs', 'https://fastapi.tiangolo.com/tutorial/'],
        ['course', 'Learn Data Cleaning', 'Kaggle Learn', 'https://www.kaggle.com/learn/data-cleaning']
      ]
    },
    {
      id: 'code-debugging', track: 'coding', roles: 'both', priority: 3,
      title: 'Debugging and reading unfamiliar code fast',
      gist: 'FDEs land in new codebases all the time, their own company’s and their customers’. Reading code quickly means finding the entry points, following one request from start to end and running things early. Debugging is a method: reproduce the bug, form a guess, test it with logs or a debugger, fix it and add a test so it stays fixed.',
      asks: ['Here is a repo you have never seen. How do you get oriented?', 'How do you debug a failure you cannot reproduce on your machine?', 'Tell me about the hardest bug you have fixed.'],
      cover: ['Start from the README, the entry points and the tests; trace one path', 'Reproduce first; change one thing at a time', 'Use logs, a debugger and git history (log, blame, bisect)', 'Fix the cause, then add a test'],
      practice: 'Clone an open-source project you have never used, and in 30 minutes write down how one request flows through it.',
      flag: 'Changing random things until the error goes away.',
      res: [
        ['article', 'A debugging manifesto', 'Julia Evans', 'https://jvns.ca/blog/2022/12/08/a-debugging-manifesto/'],
        ['article', 'How to interrogate unfamiliar code', 'Stack Overflow Blog', 'https://stackoverflow.blog/2022/08/15/how-to-interrogate-unfamiliar-code/'],
        ['article', 'How GitHub engineers learn new codebases', 'The GitHub Blog', 'https://github.blog/developer-skills/application-development/how-github-engineers-learn-new-codebases/']
      ]
    },
    {
      id: 'code-sql', track: 'coding', roles: 'both', priority: 3,
      title: 'SQL for analysis questions',
      gist: 'Many AI and FDE roles touch customer data, so SQL shows up in interviews: joins, grouping, filtering and window functions to answer business questions. Clarity matters as much as correctness: say what each part of the query does and check that the result makes sense.',
      asks: ['Find the top 3 products by revenue in each region.', 'Which customers ordered last month but not this month?', 'What is the difference between WHERE and HAVING?'],
      cover: ['Join types and what happens to rows with no match', 'GROUP BY with aggregates; HAVING filters the groups', 'Window functions: ROW_NUMBER, RANK, running totals', 'CTEs to break a complex query into readable steps'],
      practice: 'Solve 10 medium SQL problems on a free practice site, saying each query out loud before you run it.',
      flag: 'Not checking for duplicated rows after a join.',
      res: [
        ['course', 'SQL Tutorial for Data Scientists & Data Analysts', 'DataLemur', 'https://datalemur.com/sql-tutorial'],
        ['guide', 'SQL Window Functions', 'ThoughtSpot (formerly Mode SQL Tutorial)', 'https://www.thoughtspot.com/sql-tutorial/sql-window-functions'],
        ['video', 'SQL Window Function | How to write SQL Query using RANK, DENSE RANK, LEAD/LAG', 'YouTube, techTFQ', 'https://www.youtube.com/watch?v=Ww71knvhQ-s']
      ]
    },
    {
      id: 'code-take-home', track: 'coding', roles: 'both', priority: 3,
      title: 'Doing well on a take-home project',
      gist: 'A take-home is judged on judgement as much as on code. Reviewers look for a working core feature, a sensible scope, a clear README (how to run it, the decisions, the trade-offs, what you would do next), a few tests and, for AI projects, some evidence that you checked the quality of the output.',
      asks: ['Build a small app that answers questions over these documents (4 hours).', 'Walk us through the decisions in your submission.', 'What would you change with another week?'],
      cover: ['Clarify the scope; cut features rather than quality', 'A README with setup, design decisions and trade-offs', 'A few tests and a small eval set for the AI behaviour', 'Be ready to defend every choice in the follow-up call'],
      practice: 'Give yourself 4 hours to build a Q&A app over 10 PDFs, including a README and 10 eval questions.',
      flag: 'Polishing the UI while the core feature is shaky.',
      res: [
        ['guide', 'The Essential Guide to Take-home Coding Challenges', 'freeCodeCamp, Jane Philipps', 'https://www.freecodecamp.org/news/the-essential-guide-to-take-home-coding-challenges-a0e746220dd7/'],
        ['article', '9 Tips to Ace Your Takehome Project for Frontend, Fullstack and Mobile Interviews', 'DEV, Gergely Orosz (The Pragmatic Engineer)', 'https://dev.to/gergelyorosz/9-insider-tips-to-ace-your-next-takehome-project-for-frontend-fullstack-and-mobile-interviews-41nn'],
        ['article', 'How GitHub does take home technical interviews', 'The GitHub Blog', 'https://github.blog/developer-skills/career-growth/how-github-does-take-home-technical-interviews/']
      ]
    },
    {
      id: 'code-python', track: 'coding', roles: 'ai', priority: 3,
      title: 'Python essentials for AI engineers',
      gist: 'Most AI engineering is Python glue: calling APIs concurrently, validating data and moving it between formats. Know async and await for running many API calls at once, type hints and Pydantic for validating the structured output of a model, and the basics of JSON, files and dataframes.',
      asks: ['How would you make 1,000 LLM calls faster?', 'How do you validate the JSON a model returns?', 'Explain async and await in simple terms.'],
      cover: ['asyncio for waiting on many network calls at once; cap it with a semaphore', 'Pydantic models to parse and validate outputs', 'Type hints, small functions and clear errors', 'Comfort with JSON, CSV and pandas basics'],
      practice: 'Write a script that sends 50 prompts concurrently, 5 at a time, and validates each response with a Pydantic model.',
      flag: 'Using threads or a slow sequential loop without being able to say why.',
      res: [
        ['article', 'Mastering Python asyncio.gather and asyncio.as_completed for LLM Processing', 'Instructor, Jason Liu', 'https://python.useinstructor.com/blog/2023/11/13/learn-async/'],
        ['docs', 'Why use Pydantic Validation?', 'Pydantic Docs', 'https://pydantic.dev/docs/validation/latest/get-started/why/'],
        ['docs', 'Coroutines and Tasks', 'Python Docs', 'https://docs.python.org/3/library/asyncio-task.html']
      ]
    },

    // ---------- Behavioural stories ----------
    {
      id: 'beh-star', track: 'behavioral', roles: 'both', priority: 5,
      title: 'STAR stories and your story bank',
      gist: 'Behavioural questions (“tell me about a time…”) are best answered with STAR: Situation, Task, Action, Result. Prepare 6 to 8 real stories in advance and reuse each one for several questions. Spend most of the time on what you personally did, and end with a result, ideally with a number and what you learned.',
      asks: ['Tell me about a project you are proud of.', 'Tell me about a time you had to learn something fast.', 'Tell me about a time you disagreed with your manager.'],
      cover: ['Keep Situation and Task short (about 20%); Action is the core (about 60%)', 'Say “I”, not “we”, for your own part', 'Results with numbers, plus what you learned', '6 to 8 stories covering conflict, failure, ambiguity, leadership and impact'],
      practice: 'Write your story bank: 6 stories, each with a one-line STAR summary, and match each one to 3 possible questions.',
      flag: 'Rambling through the background and running out of time before the result.',
      res: [
        ['guide', 'What Is the STAR Method? How to Use It in Interviews', 'Aced (formerly Exponent)', 'https://www.aced.io/blog/what-is-the-star-method-and-how-to-use-it-during-interviews'],
        ['article', 'Stop memorizing STAR for behavioral interviews. Start selecting better stories.', 'interviewing.io, Gilad Naor', 'https://interviewing.io/blog/stop-memorizing-star-for-behavioral-interviews-start-selecting-better-stories'],
        ['article', 'How Behavioral Interviews Really Work', 'Hello Interview, Stefan Mai', 'https://www.hellointerview.com/blog/how-behavioral-interviews-really-work'],
        ['article', 'How to Master Behavioral Questions in Tech Job Interviews with Amazon Leadership Principles and STAR Method', 'Medium, Neal Davis', 'https://neal-davis.medium.com/how-to-master-behavioral-questions-in-tech-job-interviews-with-amazon-leadership-principles-and-5f809e7e1a44']
      ]
    },
    {
      id: 'beh-ambiguity', track: 'behavioral', roles: 'fde', priority: 4,
      title: 'Handling ambiguity',
      gist: 'FDE and AI roles are full of unclear problems, so interviewers want proof you can move forward without a perfect brief. A good story shows how you found the real goal, made sensible assumptions, took a small step to learn more and changed course when new information came in.',
      asks: ['Tell me about a time you worked on something with unclear requirements.', 'How do you decide what to do when nobody gives you direction?'],
      cover: ['How you found the real goal, and who you asked', 'The assumptions you made and wrote down', 'A small first step to learn quickly', 'How you adjusted, and the outcome'],
      practice: 'Pick a story where the brief was vague. Write it in STAR form and highlight the moment you made a call without full information.',
      flag: 'A story where you simply waited for someone else to clarify.',
      res: [
        ['guide', 'Tell me about a time you had to navigate ambiguity or uncertainty in a project or role', 'Hello Interview', 'https://www.hellointerview.com/community/questions/ambiguity-uncertainty-project/cmn3i33gy00un07adhjva67sw'],
        ['article', 'Navigating ambiguity', 'Will Larson (lethain.com)', 'https://lethain.com/navigating-ambiguity/']
      ]
    },
    {
      id: 'beh-conflict', track: 'behavioral', roles: 'fde', priority: 4,
      title: 'Difficult customers and disagreement',
      gist: 'Customer-facing roles mean pushback: unrealistic deadlines, angry stakeholders, people who disagree with your approach. Interviewers want to see that you listen, understand the other side’s real concern, use data rather than authority, and keep the relationship intact even when you say no.',
      asks: ['Tell me about a time a customer or stakeholder pushed back hard.', 'Tell me about a time you said no to a customer.', 'Tell me about a disagreement with a teammate.'],
      cover: ['The other person’s real concern, described fairly', 'How you listened and what you asked', 'Data or a small test to settle it, not seniority', 'The outcome, and the relationship afterwards'],
      practice: 'Write a STAR story about a disagreement, then check that the other person does not come across as the villain.',
      flag: 'Blaming the customer, or saying you “won” the argument.',
      res: [
        ['guide', 'Tell me about a time you had a conflict with a coworker. How did you resolve it?', 'Hello Interview', 'https://www.hellointerview.com/community/questions/coworker-conflict-resolution/cm5ehcf6e0599838oop9wivfq'],
        ['guide', 'Describe a difficult interaction you had with a customer.', 'Hello Interview', 'https://www.hellointerview.com/community/questions/difficult-customer-interaction/cm5ya868n0013rfqrcouj567z']
      ]
    },
    {
      id: 'beh-failure', track: 'behavioral', roles: 'both', priority: 4,
      title: 'Talking about a failure',
      gist: '“Tell me about a failure” tests self-awareness and learning. Pick a real failure with real impact (not a strength in disguise), clearly own your part, explain what you changed afterwards, and show evidence that the change worked later on.',
      asks: ['Tell me about a time you failed.', 'Tell me about a mistake that affected a customer.', 'What feedback changed how you work?'],
      cover: ['A real failure with real consequences', 'Clear ownership of your part, without excuses', 'What you changed afterwards', 'Proof it worked: a later situation you handled better'],
      practice: 'Write your failure story and read it aloud. If it sounds like a humble-brag, pick a different one.',
      flag: '“My biggest weakness is that I work too hard.”',
      res: [
        ['guide', 'Tell me about a project where you failed', 'Hello Interview', 'https://www.hellointerview.com/community/questions/project-failure-retrospective/cm730xpyt00023b6r54v44ctj'],
        ['article', 'The Best Way to Answer ’Tell Me About a Time You Failed’', 'Built In', 'https://builtin.com/articles/tell-me-about-time-you-failed'],
        ['article', 'The Day My Mistake Brought Down Amazon.com', 'Medium, Carlos Arguelles (Geek Culture)', 'https://medium.com/geekculture/the-multimillion-dollar-failure-that-changed-my-professional-life-for-the-better-2011-f96ad1afd9db']
      ]
    },
    {
      id: 'beh-why', track: 'behavioral', roles: 'fde', priority: 5,
      title: '“Why this role? Why this company?”',
      gist: 'This is often the first question, and a vague answer hurts. A strong answer connects three things: what you have already done, why this specific role (for FDE: building software and working with customers together) and why this company (its product, customers or mission), with one concrete example for each.',
      asks: ['Why do you want to be a Forward Deployed Engineer?', 'Why this company and not a competitor?', 'Why are you leaving your current role?'],
      cover: ['Your past: work that already looks like this role', 'The role: what about it fits how you like to work', 'The company: something specific you researched', 'Stay positive about your current employer'],
      practice: 'Write a 60-second answer for one company you would like to join. Include one fact about them most candidates would not mention.',
      flag: '“I am passionate about AI” with nothing specific behind it.',
      res: [
        ['article', 'WTF is a forward deployed engineer? (and why everyone is hiring them)', 'PostHog Blog', 'https://posthog.com/blog/forward-deployed-engineer'],
        ['article', 'Trading Margin for Moat: Why the Forward Deployed Engineer Is the Hottest Job in Startups', 'a16z, Joe Schmidt', 'https://a16z.com/services-led-growth/'],
        ['guide', 'Why do you want to work at OpenAI?', 'Hello Interview', 'https://www.hellointerview.com/community/questions/openai-work-motivation/cmhf5kjws00vx08ad4b1e37z2'],
        ['article', 'A Day in the Life of a Palantir Forward Deployed Software Engineer', 'Medium, Palantir Blog', 'https://blog.palantir.com/a-day-in-the-life-of-a-palantir-forward-deployed-software-engineer-45ef2de257b1']
      ]
    },
    {
      id: 'beh-ownership', track: 'behavioral', roles: 'both', priority: 4,
      title: 'Ownership and delivering under pressure',
      gist: 'FDEs are trusted to get things done at customer sites with little supervision. Ownership stories show that you took responsibility beyond your job description, made trade-offs under time pressure, kept people informed and delivered, or told people early when you could not.',
      asks: ['Tell me about a time you went beyond your role to get something done.', 'Tell me about a tight deadline. What did you cut?', 'Tell me about a time you had to deliver bad news.'],
      cover: ['The stakes, and why it mattered', 'Your decisions and trade-offs under pressure', 'How you kept stakeholders informed', 'The result, and what you would do differently'],
      practice: 'Find a story with a tight deadline. Write down the three trade-offs you made and why.',
      flag: 'Hero stories about working all night, with no thought for the trade-offs or the team.',
      res: [
        ['docs', 'Leadership Principles', 'Amazon', 'https://atoz.amazon/en-us/discover/leadership-principles'],
        ['guide', 'Tell me about a time when you took on something significant outside your area of responsibility.', 'Hello Interview', 'https://www.hellointerview.com/community/questions/cross-team-initiative/cm5ya8daj004irfqr4mygiseu'],
        ['guide', 'Give me an example of a time when you were able to deliver an important project under a tight deadline.', 'Hello Interview', 'https://www.hellointerview.com/community/questions/project-tight-deadline/cm5ya87lh001rrfqr8yfx3ns7'],
        ['article', 'Career Growth explained as an Amazon Leadership Principle Flywheel', 'Medium, Carlos Arguelles', 'https://carloarg02.medium.com/career-growth-explained-as-an-amazon-leadership-principle-flywheel-e9cc85fa5b66']
      ]
    }
  ];

  root.PREP_TRACKS = TRACKS;
  root.PREP_ROLES = ROLES;
  root.PREP_TOPICS = TOPICS;
})(this);
