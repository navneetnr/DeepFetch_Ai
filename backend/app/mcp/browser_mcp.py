from typing import Dict, Any
from app.services.browser import playwright_service
from app.core.logging import logger


class BrowserMCPTool:
    """Model Context Protocol (MCP) Tool for Playwright Web Scraping."""

    async def scrape_url(self, url: str) -> Dict[str, Any]:
        """Scrapes live JavaScript-rendered page content from a target URL."""
        logger.info(f"Executing Browser MCP Tool for URL: {url}")
        return await playwright_service.fetch_page_content(url)


browser_mcp_tool = BrowserMCPTool()
