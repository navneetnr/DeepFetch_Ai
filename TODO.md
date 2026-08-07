# Backend Synthesis Pipeline Refactor

## Goal
Refactor the backend synthesis pipeline to strip raw scraped noise, produce true synthesized reports with a structured comparison table, and enforce strict topic relevance.

## Plan
1. **scraper.py** — Strengthen content filtering: strip BibTeX blocks, expand ad/clutter class/id regex, add boilerplate removal.
2. **synthesizer.py** — Improve deterministic fallback: true synthesis across sources, Executive Summary, Structured Comparison Table, inline citations.
3. **planner.py** — Fix topic-relevant fallback sub-queries (remove generic appended suffixes).
4. Test — Run a test search query through the research pipeline and verify report quality.
5. Commit — Commit the fixes.

## Status
- [x] scraper.py
- [x] synthesizer.py
- [x] planner.py
- [x] Test (unit checks for scraper, planner fallback, synthesizer comparison table passed; backend & frontend both up)
- [ ] Commit
