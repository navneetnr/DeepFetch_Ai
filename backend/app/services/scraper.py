import re
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup
import html2text
from app.core.logging import logger


class DOMScraper:
    """Cleans HTML content and converts DOM into structured Markdown."""

    # Expanded set of HTML tags that carry boilerplate / non-main content.
    UNWANTED_TAGS = [
        "script", "style", "nav", "footer", "header", "aside",
        "iframe", "noscript", "svg", "button", "form", "input",
        "select", "option", "textarea", "canvas", "figure", "figcaption",
        "dialog", "template", "object", "embed", "menu",
    ]

    # Class/id keywords indicating ads, cookies, sidebars, promos, related content,
    # sharing widgets, comments, newsletters, and other non-main content.
    CLUTTER_KEYWORDS = re.compile(
        r"(^|[_-])(ad|ads|advert|advertis|banner|cookie|popup|modal|overlay|"
        r"social|share|comment|sidebar|menu|nav|widget|promo|promotion|"
        r"newsletter|subscribe|footer|header|related|recommend|skip-link|"
        r"breadcrumb|pagination|author-bio|table-of-contents|floating)([_-]|$)",
        re.IGNORECASE,
    )

# Matches BibTeX entry headers (the @type{citekey part) used to locate entries.
    BIBTEX_START = re.compile(
        r"@(?:article|misc|book|inproceedings|conference|techreport|phdthesis|unpublished|"
        r"proceedings|incollection|mastersthesis)\s*\{",
        re.IGNORECASE,
    )

    # Common boilerplate sentence fragments found in footers and navigation areas.
    BOILERPLATE_FRAGMENTS = [
        "All rights reserved",
        "Terms of Service",
        "Terms & Conditions",
        "Privacy Policy",
        "Cookie Policy",
        "Contact us",
        "Subscribe to our newsletter",
        "Sign up for our newsletter",
        "Follow us on",
        "Share this article",
        "Click here to",
        "©",
    ]

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

        # Remove structural clutter tags
        for tag in soup(self.UNWANTED_TAGS):
            tag.decompose()

        # Remove elements whose class OR id indicates ads, cookies, sidebars, promos, etc.
        for attr in ("class", "id"):
            for element in soup.find_all(attrs={attr: self.CLUTTER_KEYWORDS}):
                element.decompose()

        return str(soup)

    @staticmethod
    def _balanced_bibtex_ranges(text: str) -> List[tuple]:
        """Yields (start, end) char ranges for complete BibTeX entries, handling nested braces."""
        ranges: List[tuple] = []
        pos = 0
        while True:
            m = DOMScraper.BIBTEX_START.search(text, pos)
            if not m:
                break
            start = m.start()
            depth = 0
            i = m.end() - 1  # position of the opening '{'
            n = len(text)
            while i < n:
                ch = text[i]
                if ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        ranges.append((start, i + 1))
                        pos = i + 1
                        break
                i += 1
            else:
                # Unbalanced: consume to end to avoid infinite loop.
                ranges.append((start, n))
                break
        return ranges

    def strip_bibtex(self, text: str) -> str:
        """Removes BibTeX blocks and residual @citation references from text."""
        ranges = self._balanced_bibtex_ranges(text)
        if ranges:
            parts: List[str] = []
            cursor = 0
            for start, end in ranges:
                parts.append(text[cursor:start])
                cursor = end
            parts.append(text[cursor:])
            text = "".join(parts)

        # Remove dangling "@" citation lines (e.g. "@article," remains after brace removal)
        text = re.sub(r"(?m)^@\w+\s*,?\s*$", "", text)
        # Remove standalone author/year citation lines within square brackets (bibtex leftovers)
        text = re.sub(r"(?m)^\[(?:\d+\s*,\s*)?[a-zA-Z][^\]]*\]\s*$", "", text)
        return text

    def strip_boilerplate(self, text: str) -> str:
        """Removes known boilerplate / footer / nav sentences."""
        lines = text.split("\n")
        cleaned_lines: List[str] = []
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            if any(fragment.lower() in stripped.lower() for fragment in self.BOILERPLATE_FRAGMENTS):
                continue
            # Drop very short junk lines (pure symbols, lone nav links).
            if len(stripped) <= 1 and not stripped.isalnum():
                continue
            cleaned_lines.append(stripped)
        return "\n".join(cleaned_lines)

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

            # Post-process: strip BibTeX blocks and residual citation noise
            markdown_content = self.strip_bibtex(markdown_content)

            # Post-process: strip known boilerplate / footer / nav sentences
            markdown_content = self.strip_boilerplate(markdown_content)

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
