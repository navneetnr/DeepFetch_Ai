import re
from typing import Dict, Any, Optional
from bs4 import BeautifulSoup
import html2text
from app.core.logging import logger


class DOMScraper:
    """Cleans HTML content and converts DOM into structured Markdown."""

    def __init__(self):
        self.h2t = html2text.HTML2Text()
        self.h2t.ignore_links = False
        self.h2t.ignore_images = True
        self.h2t.ignore_tables = False
        self.h2t.body_width = 0

    def clean_html(self, raw_html: str) -> str:
        """Removes script, style, nav, footer, iframe, and ad elements from HTML."""
        if not raw_html:
            return ""

        soup = BeautifulSoup(raw_html, "html.parser")

        # Remove clutter tags
        unwanted_tags = [
            "script", "style", "nav", "footer", "header", "aside",
            "iframe", "noscript", "svg", "button", "form", "input"
        ]
        for tag in soup(unwanted_tags):
            tag.decompose()

        # Remove common ad and cookie banner classes/ids
        ad_keywords = re.compile(r"(ad|banner|cookie|popup|modal|social|share|comment)", re.I)
        for element in soup.find_all(attrs={"class": ad_keywords}):
            element.decompose()
        for element in soup.find_all(attrs={"id": ad_keywords}):
            element.decompose()

        return str(soup)

    def extract_structured_markdown(self, raw_html: str, url: Optional[str] = None) -> Dict[str, Any]:
        """Parses HTML, cleans DOM, and converts to structured Markdown content."""
        try:
            soup = BeautifulSoup(raw_html, "html.parser")
            
            # Extract page title
            title_tag = soup.find("title")
            title = title_tag.get_text(strip=True) if title_tag else "Untitled Page"

            # Clean DOM
            cleaned_html = self.clean_html(raw_html)

            # Convert to Markdown
            markdown_content = self.h2t.handle(cleaned_html)

            # Collapse extra blank lines
            cleaned_markdown = re.sub(r"\n{3,}", "\n\n", markdown_content).strip()

            return {
                "title": title,
                "url": url,
                "content": cleaned_markdown,
                "content_length": len(cleaned_markdown),
            }
        except Exception as e:
            logger.error(f"Error scraping DOM for {url}: {e}")
            return {
                "title": "Error",
                "url": url,
                "content": f"Failed to parse content: {str(e)}",
                "content_length": 0,
            }


scraper_service = DOMScraper()
