import json
from typing import Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings
from app.core.logging import logger
from app.agents.state import ResearchState


class PlannerNode:
    """Planner Node: Decomposes complex research queries into focused sub-queries."""

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY or settings.GROQ_API_KEY

    async def execute(self, state: ResearchState) -> Dict[str, Any]:
        user_query = state.get("user_query", "")
        logs = list(state.get("execution_logs", []))
        
        log_msg = f"[Planner] Decomposing complex user query: '{user_query}'"
        logger.info(log_msg)
        logs.append(log_msg)

        sub_queries: List[str] = []

        if self.api_key:
            try:
                llm = ChatOpenAI(
                    model=settings.OPENAI_MODEL,
                    api_key=self.api_key,
                    temperature=0.2,
                )
                system_prompt = (
                    "You are an expert Autonomous Research Planner. Given a user's research query, "
                    "extract exactly 3 short, keyword-focused sub-queries targeting different angles. "
                    "Each query should be concise, search-ready, and should NOT include boilerplate phrases like 'overview', 'summary', 'facts', or 'citations'. "
                    "Return ONLY a JSON array of strings, e.g. [\"NVIDIA Blackwell B200 vs AMD Instinct MI300X specs memory bandwidth FP8\", \"NVIDIA vs AMD AI GPU data center market share 2026\", \"AMD MI300X ROCm vs CUDA B200 price per token\"]."
                )
                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=user_query),
                ]
                response = await llm.ainvoke(messages)
                content = response.content.strip()
                
                # Parse JSON array from response
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()

                parsed = json.loads(content)
                if isinstance(parsed, list):
                    sub_queries = [str(q) for q in parsed[:3]]
            except Exception as e:
                logger.error(f"[Planner] LLM decomposition failed: {e}. Falling back to NLP decomposer.")

        if not sub_queries:
            # Fallback deterministic sub-query strategy: produce concise, keyword-focused searches
            base = user_query.strip()
            sub_queries = [
                f"{base} specs memory bandwidth",
                f"{base} data center market share 2026",
                f"{base} price per token",
            ]

        log_result = f"[Planner] Generated {len(sub_queries)} sub-queries: {sub_queries}"
        logger.info(log_result)
        logs.append(log_result)

        return {
            "sub_queries": sub_queries,
            "execution_logs": logs,
            "revision_count": state.get("revision_count", 0),
        }


planner_node = PlannerNode()
