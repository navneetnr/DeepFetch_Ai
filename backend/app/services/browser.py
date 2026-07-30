import asyncio
from typing import Dict, Any, Optional
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeoutError
from app.core.config import settings
from app.core.logging import logger
from app.services.scraper import scraper_service


class PlaywrightService:
    """Headless browser controller using Playwright Async API."""

    def __init__(self):
        self.headless = settings.HEADLESS_BROWSER
        self.timeout = settings.BROWSER_TIMEOUT

    async def fetch_page_content(self, url: str) -> Dict[str, Any]:
        """Launches headless browser, navigates to URL, waits for JS render, and returns clean markdown content."""
        logger.info(f"Navigating to URL via Playwright: {url}")
        
        async with async_playwright() as p:
            browser: Optional[Browser] = None
            try:
                browser = await p.chromium.launch(
                    headless=self.headless,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-accelerated-2d-canvas",
                        "--disable-gpu",
                    ]
                )
                
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    viewport={"width": 1280, "height": 800},
                )
                
                page: Page = await context.new_page()
                
                # Navigate to page with timeout and network idle waiting
                try:
                    response = await page.goto(url, wait_until="networkidle", timeout=self.timeout)
                except PlaywrightTimeoutError:
                    logger.warning(f"Timeout waiting for networkidle on {url}, falling back to domcontentloaded")
                    response = await page.goto(url, wait_until="domcontentloaded", timeout=self.timeout)

                status_code = response.status if response else 0
                
                # Allow minor dynamic JS render delay
                await asyncio.sleep(1.0)
                
                raw_html = await page.content()
                
                # Clean and convert to structured Markdown via DOMScraper
                scraped_result = scraper_service.extract_structured_markdown(raw_html, url=url)
                scraped_result["status_code"] = status_code
                
                return scraped_result

            except Exception as e:
                logger.error(f"Playwright browser error fetching {url}: {e}", exc_info=True)
                return {
                    "title": "Error Fetching Page",
                    "url": url,
                    "content": f"Failed to render page with Playwright: {str(e)}",
                    "content_length": 0,
                    "status_code": 500,
                }
            finally:
                if browser:
                    await browser.close()


playwright_service = PlaywrightService()
