from typing import TypedDict, List, Dict, Any, Optional


class ResearchState(TypedDict):
    """TypedDict representing the global state of the autonomous research workflow."""

    user_query: str
    sub_queries: List[str]
    scraped_data: List[Dict[str, Any]]
    critic_verdict: str  # "APPROVED" or "REJECTED"
    critic_feedback: str
    final_report: str
    execution_logs: List[str]
    revision_count: int
    max_revisions_exhausted: Optional[bool]
    # Optional combined text extracted from uploaded files
    file_context: Optional[str]
    # Search mode: 'live' | 'document' | 'hybrid'
    search_mode: Optional[str]
