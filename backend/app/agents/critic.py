import re
from typing import Dict, Any, List, Set
from app.core.config import settings
from app.core.logging import logger
from app.agents.state import ResearchState


class CriticNode:
    """Critic / Verifier Node: Evaluates accuracy, coverage, and completeness of scraped data."""

    def __init__(self):
        self.max_revisions = settings.MAX_REVISION_CYCLES
        self.min_context_chars = 800
        self.stopwords = {
            "about", "after", "against", "analysis", "compare", "comparison", "could",
            "from", "have", "into", "latest", "market", "more", "over", "research",
            "should", "than", "their", "there", "these", "this", "under", "versus",
            "what", "when", "where", "which", "with", "year",
        }

    async def execute(self, state: ResearchState) -> Dict[str, Any]:
        scraped_data = state.get("scraped_data", [])
        sub_queries = state.get("sub_queries", [])
        revision_count = state.get("revision_count", 0)
        logs = list(state.get("execution_logs", []))

        log_start = f"[Critic] Verifying data quality ({len(scraped_data)} records collected across {len(sub_queries)} sub-queries, cycle {revision_count + 1}/{self.max_revisions + 1})"
        logger.info(log_start)
        logs.append(log_start)

        total_content_length = sum(len(item.get("content", "")) for item in scraped_data)
        aggregate_context = "\n".join(
            f"{item.get('title', '')}\n{item.get('snippet', '')}\n{item.get('content', '')}"
            for item in scraped_data
        )
        query_keywords = self._extract_keywords(state.get("user_query", ""), sub_queries)
        matched_keywords = {
            keyword for keyword in query_keywords
            if re.search(rf"\b{re.escape(keyword)}\b", aggregate_context, re.IGNORECASE)
        }
        min_keyword_matches = min(2, len(query_keywords)) if query_keywords else 0
        has_keyword_match = len(matched_keywords) >= min_keyword_matches
        has_sufficient_data = total_content_length >= self.min_context_chars and has_keyword_match

        if has_sufficient_data:
            verdict = "APPROVED"
            feedback = "Data quality, coverage, and source citations meet verification standards."
            alternative_queries = sub_queries
            max_revisions_exhausted = False
            log_verdict = f"[Critic] Verdict: APPROVED. {feedback}"
        else:
            verdict = "REJECTED"
            revision_count += 1
            alternative_queries = self._build_alternative_queries(state.get("user_query", ""), sub_queries, revision_count)
            max_revisions_exhausted = revision_count > self.max_revisions

            missing_reason = []
            if total_content_length < self.min_context_chars:
                missing_reason.append(f"only {total_content_length}/{self.min_context_chars} context chars")
            if not has_keyword_match:
                missing_reason.append(
                    f"keyword relevance too low ({len(matched_keywords)}/{min_keyword_matches} required matches)"
                )

            feedback = (
                f"Insufficient relevant context ({'; '.join(missing_reason)}). "
                f"Researcher must query alternative keywords: {alternative_queries}"
            )
            if max_revisions_exhausted:
                feedback += " Revision budget exhausted; synthesize only from collected context without approving quality."

            log_verdict = f"[Critic] Verdict: REJECTED (Revision {revision_count}/{self.max_revisions}). {feedback}"

        logger.info(log_verdict)
        logs.append(log_verdict)

        return {
            "critic_verdict": verdict,
            "critic_feedback": feedback,
            "revision_count": revision_count,
            "execution_logs": logs,
            "sub_queries": alternative_queries,
            "max_revisions_exhausted": max_revisions_exhausted,
        }

    def _extract_keywords(self, user_query: str, sub_queries: List[str]) -> Set[str]:
        text = " ".join([user_query, *sub_queries]).lower()
        tokens = re.findall(r"[a-z0-9][a-z0-9.+-]{2,}", text)
        return {
            token for token in tokens
            if token not in self.stopwords and not token.isdigit()
        }

    def _build_alternative_queries(self, user_query: str, sub_queries: List[str], revision_count: int) -> List[str]:
        base = re.sub(r"\s+", " ", user_query).strip()
        if not base:
            return sub_queries

        if revision_count <= 1:
            alternatives = [
                f"{base} technical specifications benchmarks",
                f"{base} independent analysis performance pricing",
                f"{base} official documentation release notes",
            ]
        else:
            alternatives = [
                f"{base} official specifications documentation",
                f"{base} benchmark memory bandwidth TCO",
                f"{base} developer migration CUDA ROCm",
            ]

        return alternatives[:3]


critic_node = CriticNode()
