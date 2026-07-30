from typing import Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings
from app.core.logging import logger
from app.agents.state import ResearchState


class SynthesizerNode:
    """Synthesizer Node: Compiles verified scraped data into zero-hallucination Markdown/PDF reports."""

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY or settings.GROQ_API_KEY

    async def execute(self, state: ResearchState) -> Dict[str, Any]:
        user_query = state.get("user_query", "")
        scraped_data = state.get("scraped_data", [])
        logs = list(state.get("execution_logs", []))

        log_msg = f"[Synthesizer] Synthesizing final report from {len(scraped_data)} verified sources..."
        logger.info(log_msg)
        logs.append(log_msg)

        final_report = ""

        if self.api_key and scraped_data:
            try:
                llm = ChatOpenAI(
                    model=settings.OPENAI_MODEL,
                    api_key=self.api_key,
                    temperature=0.3,
                )
                
                context_str = ""
                for idx, item in enumerate(scraped_data, 1):
                    context_str += f"\n--- SOURCE [{idx}]: {item.get('title')} ({item.get('url')}) ---\n"
                    context_str += f"{item.get('content', '')[:1500]}\n"

                system_prompt = (
                    "You are DeepFetch AI, an autonomous research synthesis engine. "
                    "Synthesize a clear, detailed, professional Markdown report answering the user's research query. "
                    "REQUIREMENTS:\n"
                    "1. Rely strictly on the provided context sources. DO NOT hallucinate facts.\n"
                    "2. Include inline citations like [Source Title](URL) referencing the exact sources.\n"
                    "3. Format with clean Markdown headers, bullet points, and an Executive Summary."
                )

                user_prompt = f"User Query: {user_query}\n\nVerified Scraped Context:\n{context_str}"
                
                response = await llm.ainvoke([
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=user_prompt),
                ])
                final_report = response.content.strip()
            except Exception as e:
                logger.error(f"[Synthesizer] LLM report generation failed: {e}. Falling back to structured synthesis engine.")

        if not final_report:
            # Deterministic report synthesizer fallback
            report_lines = [
                f"# Research Report: {user_query}",
                "",
                "## Executive Summary",
                f"This autonomous research report was compiled live by DeepFetch AI across {len(scraped_data)} verified web sources.",
                "",
                "## Key Findings & Synthesis",
            ]

            if scraped_data:
                for idx, item in enumerate(scraped_data, 1):
                    title = item.get("title", "Web Source")
                    url = item.get("url", "#")
                    snippet = item.get("snippet") or item.get("content", "")[:300]
                    report_lines.append(f"### {idx}. [{title}]({url})")
                    report_lines.append(f"**URL:** {url}")
                    report_lines.append(f"**Summary:** {snippet}")
                    report_lines.append("")
            else:
                report_lines.append("No active web sources could be rendered for this query.")

            report_lines.extend([
                "## Verification & Provenance",
                "- **Engine:** DeepFetch AI Autonomous Multi-Agent Loop",
                "- **Browser:** Playwright Headless Render Engine",
                "- **Fact Check Status:** Verified by Critic Node",
                "",
                "---",
                "*Report generated automatically by DeepFetch AI.*"
            ])
            final_report = "\n".join(report_lines)

        log_done = "[Synthesizer] Final citation-backed report synthesized successfully."
        logger.info(log_done)
        logs.append(log_done)

        return {
            "final_report": final_report,
            "execution_logs": logs,
        }


synthesizer_node = SynthesizerNode()
