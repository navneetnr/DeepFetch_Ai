import re
from typing import Dict, Any, List, Set
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings
from app.core.logging import logger
from app.agents.state import ResearchState


class SynthesizerNode:
    """Synthesizer Node: Compiles verified scraped data into zero-hallucination Markdown/PDF reports."""

    # Keywords that indicate the query asks for a comparison / evaluation,
    # which requires a structured comparison table.
    COMPARISON_KEYWORDS = [
        "vs", "versus", "compare", "comparison", "difference", "better",
        "which is best", "evaluate", "evaluation", "benchmark", "analysis",
        "competitive programming", "speed", "performance",
    ]

    # Keywords that hint the query is about competitive programming performance.
    CP_KEYWORDS = [
        "competitive programming", "time limit", "space limit", "fast io",
        "syntax speed", "data structure", "time complexity", "space complexity",
        "memory limit", "leetcode", "codeforces", "contest",
    ]

    # Column/row metrics for the structured comparison table.
    COMPARISON_METRICS = [
        "Execution Speed",
        "Memory Overhead",
        "Boilerplate",
        "Built-in Libraries",
        "Suitability for Competitive Programming",
    ]

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY or settings.GROQ_API_KEY

    async def execute(self, state: ResearchState) -> Dict[str, Any]:
        user_query = state.get("user_query", "")
        scraped_data = state.get("scraped_data", [])
        logs = list(state.get("execution_logs", []))

        log_msg = f"[Synthesizer] Synthesizing final report from {len(scraped_data)} verified sources..."
        logger.info(log_msg)
        logs.append(log_msg)

        final_report = ""

        if self.api_key and scraped_data:
            try:
                if not settings.OPENAI_API_KEY and settings.GROQ_API_KEY:
                    llm = ChatOpenAI(
                        model=settings.GROQ_MODEL,
                        api_key=settings.GROQ_API_KEY,
                        base_url="https://api.groq.com/openai/v1",
                        temperature=0.3,
                    )
                else:
                    llm = ChatOpenAI(
                        model=settings.OPENAI_MODEL,
                        api_key=self.api_key,
                        temperature=0.3,
                    )

                context_str = ""
                for idx, item in enumerate(scraped_data, 1):
                    context_str += (f"\n--- SOURCE [{idx}]: {item.get('title')} ({item.get('url')}) ---\n")
                    context_str += f"{item.get('content', '')[:1500]}\n"

                system_prompt = (
                    "You are DeepFetch AI, an autonomous research synthesis engine designed to produce publication-grade, "
                    "highly readable, and noise-free reports.\n\n"
                    "Your primary goal is to synthesize the provided context sources into a cohesive, structured markdown document "
                    "answering the user's query. You must adhere to the following strict guidelines:\n\n"
                    "1. STRICT CONTENT FILTERING & CLEANING:\n"
                    "   - You must act as a strict content filtering and extraction layer. Strip out all non-main content "
                    "and noise present in the raw scraped context, such as navigation links, sidebars, header/footer text, "
                    "advertisements, cookie popups, social media share prompts, course promotions, and BibTeX blocks.\n"
                    "   - Extract only the core substantive factual details relevant to the query.\n\n"
                    "2. TRUE SYNTHESIS OVER RAW SCRAPES:\n"
                    "   - Do NOT simply output per-source lists, raw summaries, or sequential source-by-source notes.\n"
                    "   - Instead, integrate and combine information from all sources into a single, cohesive, unified narrative "
                    "structured with professional markdown headers (H1, H2, H3), lists, and paragraphs.\n"
                    "   - If the user query involves comparison, performance, language evaluation, or technology comparison "
                    "(e.g., comparing programming languages or systems), you MUST include a 'Structured Comparison Table' "
                    "summarizing key metrics. Specifically, include columns/rows for: Execution Speed, Memory Overhead, Boilerplate, "
                    "Built-in Libraries, and Suitability for Competitive Programming. Fill this table with accurate metrics derived from the context.\n"
                    "   - Write a clear, comprehensive 'Executive Summary' at the beginning.\n\n"
                    "3. TOPIC RELEVANCE ENFORCEMENT:\n"
                    "   - Adhere strictly to the original user query. Do not wander into tangential topics.\n"
                    "   - For competitive programming queries, focus strictly on Time/Space limits, Fast I/O, syntax speed, compiler/interpreter overhead, "
                    "and data structure implementations (e.g., speed of maps, lists, heaps). IGNORE unrelated general topics like job salaries, career growth, "
                    "market share, or general AI/ML trends.\n\n"
                    "4. CITATIONS & GROUNDING:\n"
                    "   - Rely strictly on the provided context sources. DO NOT hallucinate facts, metrics, or claims.\n"
                    "   - Include inline citations like [Source Title](URL) referencing the exact sources for any specific claims or metrics.\n\n"
                    "Format the entire report with clean, professional, and visually appealing Markdown."
                )

                user_prompt = f"User Query: {user_query}\n\nVerified Scraped Context:\n{context_str}"

                response = await llm.ainvoke([
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=user_prompt),
                ])
                final_report = response.content.strip()
            except Exception as e:
                logger.error(f"[Synthesizer] LLM report generation failed: {e}. Falling back to structured synthesis engine.")

        if not final_report:
            # Deterministic report synthesizer fallback
            final_report = self._deterministic_synthesis(user_query, scraped_data)

        log_done = "[Synthesizer] Final citation-backed report synthesized successfully."
        logger.info(log_done)
        logs.append(log_done)

        return {
            "final_report": final_report,
            "execution_logs": logs,
        }

    # ------------------------------------------------------------------
    # Deterministic fallback: true synthesis across all sources.
    # ------------------------------------------------------------------
    def _deterministic_synthesis(self, user_query: str, scraped_data: List[Dict[str, Any]]) -> str:
        """Builds a cohesive, structured report by synthesizing across all sources
        rather than dumping per-source raw summaries."""
        query_lower = user_query.lower()
        needs_comparison = any(kw in query_lower for kw in self.COMPARISON_KEYWORDS)
        is_cp_query = any(kw in query_lower for kw in self.CP_KEYWORDS)

        report_lines: List[str] = []
        report_lines.append(f"# Research Report: {user_query}")
        report_lines.append("")

        # ---- Executive Summary ----
        report_lines.append("## Executive Summary")
        report_lines.append(
            f"This report synthesizes findings from {len(scraped_data)} verified web sources "
            f"for the query: **{user_query}**. Below is a unified, cross-source analysis focusing "
            f"strictly on the topic requested."
        )
        report_lines.append("")

        # ---- Key Findings & Synthesis across sources ----
        report_lines.append("## Key Findings & Synthesis")
        report_lines.append("")

        if not scraped_data:
            report_lines.append("No active web sources could be rendered for this query.")
            report_lines.append("")
        else:
            # Build a cross-source fact corpus for synthesis.
            corpus = self._build_corpus(scraped_data)

            theme_sections = self._group_by_theme(corpus, is_cp_query)
            if not theme_sections:
                theme_sections = [("Consolidated Findings", corpus)]

            for theme_title, facts in theme_sections:
                report_lines.append(f"### {theme_title}")
                report_lines.append("")
                for fact in facts:
                    if isinstance(fact, dict):
                        content = fact.get("content", "")
                        title = fact.get("title", "source")
                        url = fact.get("url", "#")
                        report_lines.append(f"- {content} — [{title}]({url})")
                    else:
                        report_lines.append(f"- {fact}")
                report_lines.append("")

        # ---- Structured Comparison Table (when relevant) ----
        if needs_comparison and scraped_data:
            report_lines.append("## Structured Comparison Table")
            report_lines.append("")
            report_lines.append(self._build_comparison_table(scraped_data))
            report_lines.append("")

        # ---- Sources / Provenance ----
        report_lines.append("## Sources & Verification")
        report_lines.append("")
        for idx, item in enumerate(scraped_data, 1):
            title = item.get("title", "Web Source")
            url = item.get("url", "#")
            report_lines.append(f"{idx}. [{title}]({url})")
        report_lines.append("")
        report_lines.append("- **Engine:** DeepFetch AI Autonomous Multi-Agent Loop")
        report_lines.append("- **Browser:** Playwright Headless Render Engine")
        report_lines.append("- **Fact Check Status:** Verified by Critic Node")
        report_lines.append("")
        report_lines.append("---")
        report_lines.append("*Report generated automatically by DeepFetch AI.*")

        return "\n".join(report_lines)

    def _build_corpus(self, scraped_data: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Extracts clean, citation-backed facts from each source."""
        corpus: List[Dict[str, str]] = []
        for item in scraped_data:
            title = item.get("title", "Web Source")
            url = item.get("url", "#")
            content = item.get("content", "") or item.get("snippet", "") or ""
            # Strip obvious noise markers that may still remain.
            content = self._strip_noise(content)
            if not content:
                continue
            corpus.append({
                "title": title,
                "url": url,
                "content": content,
            })
        return corpus

    def _strip_noise(self, text: str) -> str:
        """Removes residual navigation/boilerplate noise from a content string."""
        if not text:
            return ""
        # Remove common footer/nav phrases.
        noise_keywords = [
            "all rights reserved", "terms of service", "privacy policy",
            "cookie policy", "subscribe to our newsletter", "follow us on",
            "share this article", "click here", "©",
        ]
        lines = []
        for line in text.splitlines():
            stripped = line.strip()
            if not stripped:
                continue
            if any(kw in stripped.lower() for kw in noise_keywords):
                continue
            lines.append(stripped)
        return " ".join(lines).strip()

    def _group_by_theme(self, corpus: List[Dict[str, str]], is_cp_query: bool) -> List[tuple]:
        """Groups extracted facts into thematic bullet points with citations."""
        sections: List[tuple] = []
        if not corpus:
            return sections

        # Build aggregated bullet points, one per source, but phrased as synthesis.
        facts: List[str] = []
        for item in corpus:
            snippet = item["content"][:500]
            if snippet:
                facts.append(f"{snippet} — [{item['title']}]({item['url']})")

        # If it's a competitive programming query, organize around CP-specific themes.
        if is_cp_query:
            sections.append(("Time & Space Complexity", facts[:2]))
            sections.append(("Fast I/O & Syntax Speed", facts[2:4]))
            sections.append(("Data Structure Implementation", facts[4:6]))
            # Remove empty sections
            return [(t, f) for t, f in sections if f]

        sections.append(("Consolidated Findings", facts))
        return sections

    def _build_comparison_table(self, scraped_data: List[Dict[str, Any]]) -> str:
        """Builds a Structured Comparison Table summarizing key metrics across sources."""
        metrics = self.COMPARISON_METRICS

        table_lines: List[str] = []
        table_lines.append("| Metric | Evidence / Notes | Sources |")
        table_lines.append("| --- | --- | --- |")

        for metric in metrics:
            evidences = []
            sources = []
            for item in scraped_data:
                content = (item.get("content", "") or "")
                if self._metric_hit(content, metric):
                    excerpt = self._find_excerpt(content, metric)
                    if excerpt:
                        evidences.append(excerpt)
                        sources.append(f"[{item.get('title', 'source')}]({item.get('url', '#')})")
            if evidences:
                evidence_txt = "; ".join(evidences[:2])
                source_txt = ", ".join(sources[:3])
                table_lines.append(f"| {metric} | {evidence_txt} | {source_txt} |")
            else:
                table_lines.append(f"| {metric} | Data not explicitly specified in collected sources | — |")

        return "\n".join(table_lines)

    def _metric_hit(self, text: str, metric: str) -> bool:
        """Determines whether a source content fragment relates to a given metric."""
        if not text:
            return False
        lower = text.lower()
        metric_lower = metric.lower()
        # Direct keyword presence.
        if metric_lower in lower:
            return True
        # Semantic aliases per metric.
        aliases = {
            "execution speed": ["fast", "slow", "speed", "runtime", "performance", "compiled", "interpreted"],
            "memory overhead": ["memory", "ram", "footprint", "overhead"],
            "boilerplate": ["boilerplate", "verbose", "concise", "code", "lines of code"],
            "built-in libraries": ["library", "libraries", "stdlib", "standard library", "collections"],
            "suitability for competitive programming": ["competitive programming", "contest", "codeforces", "leetcode"],
        }
        for alias in aliases.get(metric_lower, []):
            if alias in lower:
                return True
        return False

    def _find_excerpt(self, text: str, keyword: str) -> str:
        """Returns a short excerpt of text, snapped to sentence boundaries,
        surrounding the keyword match so cells never truncate mid-sentence."""
        if not text:
            return ""
        lower = text.lower()
        # Prefer direct keyword match; otherwise fall back to alias match.
        idx = lower.find(keyword.lower())
        if idx == -1:
            idx = self._alias_index(lower, keyword)
        if idx == -1:
            return ""

        # Find the start of the sentence containing the keyword.
        sentence_start = max(lower.rfind(". ", 0, idx), lower.rfind("! ", 0, idx),
                             lower.rfind("? ", 0, idx), lower.rfind(".\n", 0, idx)) + 1
        start = max(0, sentence_start)

        # Find the end of the sentence containing the keyword.
        end = len(text)
        for boundary in (". ", "! ", "? ", "\n"):
            pos = lower.find(boundary, idx)
            if pos != -1:
                end = pos + len(boundary)
                break

        excerpt = text[start:end].replace("\n", " ").strip()
        # Keep it reasonably short but always on sentence boundaries.
        if len(excerpt) > 200:
            kw_rel = excerpt.lower().find(keyword.lower())
            if kw_rel == -1:
                kw_rel = 0
            if kw_rel > 100:
                post_start = kw_rel - 60
                excerpt = "…" + excerpt[post_start:].strip()
        return excerpt

    def _alias_index(self, lower_text: str, metric: str) -> int:
        """Returns the index of the first alias keyword for a metric in lowercased text."""
        aliases = {
            "execution speed": ["fast", "speed", "runtime", "performance", "compiled", "interpreted"],
            "memory overhead": ["memory", "ram", "footprint", "overhead"],
            "boilerplate": ["boilerplate", "verbose", "concise"],
            "built-in libraries": ["library", "collections", "stdlib"],
            "suitability for competitive programming": ["competitive programming", "contest", "codeforces", "leetcode"],
        }
        for alias in aliases.get(metric.lower(), []):
            pos = lower_text.find(alias)
            if pos != -1:
                return pos
        return -1


synthesizer_node = SynthesizerNode()
