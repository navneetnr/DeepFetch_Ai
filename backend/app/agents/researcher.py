import asyncio
from typing import Dict, Any, List
from app.core.logging import logger
from app.mcp.search_mcp import search_mcp_tool
from app.mcp.browser_mcp import browser_mcp_tool
from app.agents.state import ResearchState


class ResearcherNode:
    """Researcher Node: Executes search and Playwright browser scraping for sub-queries."""

    async def execute(self, state: ResearchState) -> Dict[str, Any]:
        sub_queries = state.get("sub_queries", [])
        scraped_data = list(state.get("scraped_data", []))
        logs = list(state.get("execution_logs", []))
        critic_feedback = state.get("critic_feedback", "")
        
        log_start = f"[Researcher] Starting live web search & Playwright scraping for {len(sub_queries)} sub-queries..."
        if critic_feedback:
            log_start += f" (Addressing feedback: {critic_feedback})"
        logger.info(log_start)
        logs.append(log_start)

        discovered_urls: List[Dict[str, str]] = []

        # 1. Search phase via Search MCP
        for sq in sub_queries:
            search_results = search_mcp_tool.search(sq, max_results=2)
            for res in search_results:
                if res.get("url") and not any(u["url"] == res["url"] for u in discovered_urls):
                    discovered_urls.append({
                        "sub_query": sq,
                        "title": res.get("title", ""),
                        "url": res.get("url", ""),
                        "snippet": res.get("snippet", ""),
                    })

        log_search = f"[Researcher] Discovered {len(discovered_urls)} target URLs across sub-queries."
        logger.info(log_search)
        logs.append(log_search)

        # 2. Live Page Scraping phase via Playwright Browser MCP
        scrape_tasks = []
        for item in discovered_urls[:4]:  # Top candidate URLs
            url = item["url"]
            scrape_tasks.append(browser_mcp_tool.scrape_url(url))

        if scrape_tasks:
            scrape_results = await asyncio.gather(*scrape_tasks, return_exceptions=True)
            for item, result in zip(discovered_urls[:4], scrape_results):
                if isinstance(result, dict) and result.get("content"):
                    scraped_entry = {
                        "sub_query": item["sub_query"],
                        "title": result.get("title", item["title"]),
                        "url": item["url"],
                        "snippet": item["snippet"],
                        "content": result.get("content", "")[:3000],  # Truncate to reasonable context window
                        "status_code": result.get("status_code", 200),
                    }
                    scraped_data.append(scraped_entry)
                    log_scraped = f"[Researcher] Successfully scraped live JS content from {item['url']} ({len(scraped_entry['content'])} chars)"
                    logger.info(log_scraped)
                    logs.append(log_scraped)
                else:
                    log_err = f"[Researcher] Failed to scrape {item['url']}: {result}"
                    logger.warning(log_err)
                    logs.append(log_err)

        return {
            "scraped_data": scraped_data,
            "execution_logs": logs,
        }


researcher_node = ResearcherNode()
