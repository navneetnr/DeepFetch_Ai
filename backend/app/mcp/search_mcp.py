from typing import List, Dict, Any
import httpx
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
        
        try:
            if settings.TAVILY_API_KEY:
                return self._search_tavily(query, num_results)
            return self._search_duckduckgo(query, num_results)
        except Exception as e:
            logger.error(f"Search MCP execution failed for query '{query}': {e}")
            # Fallback mock search results if network or library rate limits occur
            fallback_snippet = f"Dynamic web search fallback snippet for query: {query}"
            return [{
                "title": f"Search result for {query}",
                "url": f"https://www.google.com/search?q={query.replace(' ', '+')}",
                "snippet": fallback_snippet,
                "raw_snippet": fallback_snippet,
            }]

    def _search_tavily(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        payload = {
            "api_key": settings.TAVILY_API_KEY,
            "query": query,
            "max_results": max_results,
            "search_depth": "advanced",
            "include_answer": False,
            "include_raw_content": False,
        }
        with httpx.Client(timeout=20.0) as client:
            response = client.post("https://api.tavily.com/search", json=payload)
            response.raise_for_status()
            data = response.json()

        results = []
        for item in data.get("results", []):
            raw_snip = item.get("snippet") or item.get("content") or item.get("raw_content") or ""
            results.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "snippet": raw_snip,
                "raw_snippet": raw_snip,
            })
        return results

    def _search_duckduckgo(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        results = []
        with DDGS() as ddgs:
            ddg_results = list(ddgs.text(query, max_results=max_results))
            for item in ddg_results:
                raw_snip = item.get("body", "")
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("href", ""),
                    "snippet": raw_snip,
                    "raw_snippet": raw_snip,
                })
        return results


search_mcp_tool = SearchMCPTool()
