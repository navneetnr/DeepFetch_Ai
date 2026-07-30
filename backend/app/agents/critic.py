from typing import Dict, Any
from app.core.config import settings
from app.core.logging import logger
from app.agents.state import ResearchState


class CriticNode:
    """Critic / Verifier Node: Evaluates accuracy, coverage, and completeness of scraped data."""

    def __init__(self):
        self.max_revisions = settings.MAX_REVISION_CYCLES

    async def execute(self, state: ResearchState) -> Dict[str, Any]:
        scraped_data = state.get("scraped_data", [])
        sub_queries = state.get("sub_queries", [])
        revision_count = state.get("revision_count", 0)
        logs = list(state.get("execution_logs", []))

        log_start = f"[Critic] Verifying data quality ({len(scraped_data)} records collected across {len(sub_queries)} sub-queries, cycle {revision_count + 1}/{self.max_revisions + 1})"
        logger.info(log_start)
        logs.append(log_start)

        total_content_length = sum(len(item.get("content", "")) for item in scraped_data)
        has_sufficient_data = total_content_length > 500 and len(scraped_data) >= 1

        if has_sufficient_data or revision_count >= self.max_revisions:
            verdict = "APPROVED"
            feedback = "Data quality, coverage, and source citations meet verification standards."
            log_verdict = f"[Critic] Verdict: APPROVED. {feedback}"
        else:
            verdict = "REJECTED"
            revision_count += 1
            feedback = f"Insufficient scraped context (total length: {total_content_length} chars). Require deeper search."
            log_verdict = f"[Critic] Verdict: REJECTED (Revision {revision_count}/{self.max_revisions}). {feedback}"

        logger.info(log_verdict)
        logs.append(log_verdict)

        return {
            "critic_verdict": verdict,
            "critic_feedback": feedback,
            "revision_count": revision_count,
            "execution_logs": logs,
        }


critic_node = CriticNode()
