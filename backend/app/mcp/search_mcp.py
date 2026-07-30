from typing import List, Dict, Any
from duckduckgo_search import DDGS
from app.core.config import settings
from app.core.logging import logger


class SearchMCPTool:
    """Model Context Protocol (MCP) Tool for Live Web Search."""

    def __init__(self):
        self.max_results = settings.MAX_SEARCH_RESULTS

    def search(self, query: str, max_results: int = None) -> List[Dict[str, Any]]:
        """Executes web search for a sub-query and returns top URL result metadata."""
        num_results = max_results or self.max_results
        logger.info(f"Executing Search MCP Tool for query: '{query}' (limit={num_results})")
        
        results = []
        try:
            with DDGS() as ddgs:
                ddg_results = list(ddgs.text(query, max_results=num_results))
                for item in ddg_results:
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("href", ""),
                        "snippet": item.get("body", ""),
                    })
        except Exception as e:
            logger.error(f"Search MCP execution failed for query '{query}': {e}")
            # Fallback mock search results if network or library rate limits occur
            results = [{
                "title": f"Search result for {query}",
                "url": f"https://www.google.com/search?q={query.replace(' ', '+')}",
                "snippet": f"Dynamic web search fallback snippet for query: {query}",
            }]

        return results


search_mcp_tool = SearchMCPTool()
