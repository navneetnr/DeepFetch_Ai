import asyncio
from typing import Dict, Any, Optional
import asyncio
import httpx
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeoutError
from app.core.config import settings
from app.core.logging import logger
from app.services.scraper import scraper_service


class PlaywrightService:
    """Headless browser controller using Playwright Async API."""

    def __init__(self):
        self.headless = settings.HEADLESS_BROWSER
        # Use a conservative 15s timeout for page navigation and rendering
        self.timeout = 15000

        # Standard desktop Chrome UA to reduce headless-detection blocks
        self.user_agent = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        )

    async def fetch_page_content(self, url: str, snippet: Optional[str] = None) -> Dict[str, Any]:
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
                    ],
                )

                context = await browser.new_context(
                    user_agent=self.user_agent,
                    viewport={"width": 1280, "height": 800},
                )

                page: Page = await context.new_page()

                # Abort images, fonts and css to speed up scraping and reduce bandwidth
                async def route_handler(route):
                    url_path = route.request.url
                    if url_path.endswith((".png", ".jpg", ".jpeg", ".svg", ".css", ".webp", ".woff", ".woff2")):
                        await route.abort()
                    else:
                        await route.continue_()

                await page.route("**/*", route_handler)

                # Try to load DOMContent and give JS a short time to run
                try:
                    response = await page.goto(url, wait_until="domcontentloaded", timeout=self.timeout)
                except PlaywrightTimeoutError:
                    logger.warning(f"Timeout waiting for domcontentloaded on {url}, retrying with a short wait")
                    try:
                        response = await page.goto(url, wait_until="domcontentloaded", timeout=self.timeout)
                    except Exception:
                        response = None

                status_code = response.status if response else 0

                # Allow minor dynamic JS render delay
                await asyncio.sleep(0.5)

                raw_html = await page.content()

                # Clean and convert to structured Markdown via DOMScraper
                scraped_result = scraper_service.extract_structured_markdown(raw_html, url=url)
                scraped_result["status_code"] = status_code

                # If playwright returned empty content, fallthrough to HTTP fallback below
                if not scraped_result.get("content") or scraped_result.get("content_length", 0) == 0:
                    raise RuntimeError("Playwright returned empty content")

                return scraped_result

            except Exception as e:
                logger.warning(f"Playwright failed for {url}: {e}", exc_info=True)
                # Fallback: try HTTP GET + BeautifulSoup text extraction
                try:
                    headers = {"User-Agent": self.user_agent}
                    async with httpx.AsyncClient(timeout=15.0, headers=headers, follow_redirects=True) as client:
                        resp = await client.get(url)
                        if resp.status_code == 200 and resp.text:
                            soup = BeautifulSoup(resp.text, "html.parser")
                            # Extract main article-ish text heuristically
                            for selector in ("article", "main", "#content", ".content", "body"):
                                el = soup.select_one(selector)
                                if el and el.get_text(strip=True):
                                    text = el.get_text(separator="\n", strip=True)
                                    scraped_result = scraper_service.extract_structured_markdown(text, url=url)
                                    scraped_result["status_code"] = resp.status_code
                                    if scraped_result.get("content"):
                                        return scraped_result
                            # As last resort, take full body text
                            body_text = soup.get_text(separator="\n", strip=True)
                            if body_text:
                                scraped_result = scraper_service.extract_structured_markdown(body_text, url=url)
                                scraped_result["status_code"] = resp.status_code
                                if scraped_result.get("content"):
                                    return scraped_result
                except Exception:
                    logger.warning(f"HTTP/BS4 fallback also failed for {url}", exc_info=True)

                # Final fallback: use provided snippet if available
                if snippet:
                    logger.info(f"Falling back to Tavily snippet for {url}")
                    return {
                        "title": snippet[:120],
                        "url": url,
                        "content": snippet,
                        "content_length": len(snippet),
                        "status_code": 200,
                    }

                logger.error(f"All scrapers failed for {url}")
                return {
                    "title": "Error Fetching Page",
                    "url": url,
                    "content": "",
                    "content_length": 0,
                    "status_code": 500,
                }
            finally:
                if browser:
                    await browser.close()


playwright_service = PlaywrightService()
