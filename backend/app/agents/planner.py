import json
import re
from typing import Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings
from app.core.logging import logger
from app.agents.state import ResearchState


class PlannerNode:
    """Planner Node: Decomposes complex research queries into focused sub-queries."""

    BOILERPLATE_PATTERN = re.compile(
        r"\b("
        r"overview|summary|summaries|facts|fact sheet|citations?|"
        r"key concepts?|breakdown|explain(?:ed|er)?|introduction|guide|"
        r"what is|developments?"
        r")\b",
        re.IGNORECASE,
    )

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY or settings.GROQ_API_KEY

    async def execute(self, state: ResearchState) -> Dict[str, Any]:
        user_query = state.get("user_query", "")
        logs = list(state.get("execution_logs", []))

        log_msg = f"[Planner] Decomposing complex user query: '{user_query}'"
        logger.info(log_msg)
        logs.append(log_msg)

        sub_queries: List[str] = []

        if self.api_key:
            try:
                if not settings.OPENAI_API_KEY and settings.GROQ_API_KEY:
                    llm = ChatOpenAI(
                        model=settings.GROQ_MODEL,
                        api_key=settings.GROQ_API_KEY,
                        base_url="https://api.groq.com/openai/v1",
                        temperature=0.2,
                    )
                else:
                    llm = ChatOpenAI(
                        model=settings.OPENAI_MODEL,
                        api_key=self.api_key,
                        temperature=0.2,
                    )
                system_prompt = (
                    "You are an expert Autonomous Research Planner. Given a user's research query, "
                    "extract 2 to 3 concise, highly relevant keyword search terms targeting different angles. "
                    "Each query must be search-ready technical keywords, not a sentence. "
                    "Do not append generic boilerplate strings such as 'key concepts breakdown', "
                    "'overview', 'summary facts', 'latest developments', or 'citations'. "
                    "Preserve specific product names, metrics, dates, standards, competitors, and domain terms from the user query. "
                    "Return ONLY a JSON array of strings, e.g. [\"NVIDIA Blackwell B200 vs AMD Instinct MI300X specs memory bandwidth FP8\", \"NVIDIA vs AMD AI GPU data center market share 2026\", \"AMD MI300X ROCm vs CUDA B200 price per token\"]."
                )
                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=user_query),
                ]
                response = await llm.ainvoke(messages)
                content = response.content.strip()

                # Parse JSON array from response
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()

                parsed = json.loads(content)
                if isinstance(parsed, list):
                    sub_queries = self._sanitize_sub_queries([str(q) for q in parsed[:3]], user_query)
            except Exception as e:
                logger.error(f"[Planner] LLM decomposition failed: {e}. Falling back to NLP decomposer.")

        if not sub_queries:
            # Fallback deterministic sub-query strategy: produce topic-aware, keyword-focused searches.
            sub_queries = self._fallback_sub_queries(user_query)

        log_result = f"[Planner] Generated {len(sub_queries)} sub-queries: {sub_queries}"
        logger.info(log_result)
        logs.append(log_result)

        return {
            "sub_queries": sub_queries,
            "execution_logs": logs,
            "revision_count": state.get("revision_count", 0),
        }

    def _fallback_sub_queries(self, user_query: str) -> List[str]:
        """Generates topic-aware fallback sub-queries derived from the query itself.

        Replaces the old generic GPU-style suffixes (e.g. 'specs memory bandwidth',
        'data center market share 2026', 'price per token') which caused severe topic
        drift for non-GPU queries like competitive programming language comparisons.
        """
        base = re.sub(r"\s+", " ", user_query).strip()
        if not base:
            return [user_query]

        lowered = base.lower()

        # Competitive programming query -> focus on CP-specific facets.
        if any(kw in lowered for kw in ("competitive programming", "codeforces", "leetcode",
                                        "time limit", "memory limit", "contest")):
            return self._sanitize_sub_queries([
                f"{base} time complexity memory usage fast input output",
                f"{base} syntax speed compiler interpreter overhead data structures",
                f"{base} built-in libraries boilerplate code",
            ], user_query)

        # Comparison / evaluation query -> keep the comparison focus.
        if any(kw in lowered for kw in ("vs", "versus", "compare", "comparison", "better", "difference")):
            return self._sanitize_sub_queries([
                f"{base} performance benchmark comparison",
                f"{base} key differences pros cons",
                f"{base} strengths weaknesses use cases",
            ], user_query)

        # Default: derive generic but still topic-relevant search angles.
        return self._sanitize_sub_queries([
            f"{base} technical details specifications",
            f"{base} analysis findings",
            f"{base} documentation examples",
        ], user_query)

    def _sanitize_sub_queries(self, queries: List[str], user_query: str) -> List[str]:
        """Keep generated searches terse and strip generic suffixes that dilute search relevance."""
        cleaned: List[str] = []
        for query in queries:
            normalized = re.sub(r"\s+", " ", query).strip(" -:;,.\"'")
            normalized = self.BOILERPLATE_PATTERN.sub("", normalized)
            normalized = re.sub(r"\s+", " ", normalized).strip(" -:;,.\"'")
            if normalized and normalized.lower() not in {q.lower() for q in cleaned}:
                cleaned.append(normalized)

        if len(cleaned) < 2 and user_query.strip():
            cleaned.append(user_query.strip())

        return cleaned[:3]


planner_node = PlannerNode()

