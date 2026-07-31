from typing import Dict, Any
from app.services.browser import playwright_service
from app.core.logging import logger


class BrowserMCPTool:
    """Model Context Protocol (MCP) Tool for Playwright Web Scraping."""

    async def scrape_url(self, url: str, snippet: str | None = None) -> Dict[str, Any]:
        """Scrapes live JavaScript-rendered page content from a target URL.

        Accepts an optional `snippet` (from the search result) to be used as a final
        fallback when all scraping attempts fail.
        """
        logger.info(f"Executing Browser MCP Tool for URL: {url}")
        return await playwright_service.fetch_page_content(url, snippet=snippet)


browser_mcp_tool = BrowserMCPTool()
