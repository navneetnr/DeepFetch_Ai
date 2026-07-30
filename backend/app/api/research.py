import json
import asyncio
from typing import List, Dict, Any, AsyncGenerator
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agents.graph import research_graph
from app.agents.state import ResearchState
from app.core.logging import logger

router = APIRouter(prefix="/api/v1/research", tags=["Autonomous Research"])


class ResearchRequest(BaseModel):
    query: str = Field(..., description="Target research topic or query", min_length=3)


class ResearchResponse(BaseModel):
    query: str
    report: str
    scraped_data: List[Dict[str, Any]]
    execution_logs: List[str]
    critic_verdict: str


@router.post("/execute", response_model=ResearchResponse)
async def execute_research(request: ResearchRequest):
    """Executes full autonomous multi-agent research graph synchronously to completion."""
    try:
        logger.info(f"Received research execution request: '{request.query}'")
        
        initial_state: ResearchState = {
            "user_query": request.query,
            "sub_queries": [],
            "scraped_data": [],
            "critic_verdict": "",
            "critic_feedback": "",
            "final_report": "",
            "execution_logs": [f"[System] Initiated autonomous workflow for query: '{request.query}'"],
            "revision_count": 0,
        }

        final_state = await research_graph.ainvoke(initial_state)

        return ResearchResponse(
            query=request.query,
            report=final_state.get("final_report", ""),
            scraped_data=final_state.get("scraped_data", []),
            execution_logs=final_state.get("execution_logs", []),
            critic_verdict=final_state.get("critic_verdict", "APPROVED"),
        )
    except Exception as e:
        logger.error(f"Error executing research graph: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Research execution failed: {str(e)}")


async def generate_sse_stream(query: str) -> AsyncGenerator[str, None]:
    """Generates Server-Sent Events (SSE) streaming live execution agent state updates."""
    initial_state: ResearchState = {
        "user_query": query,
        "sub_queries": [],
        "scraped_data": [],
        "critic_verdict": "",
        "critic_feedback": "",
        "final_report": "",
        "execution_logs": [f"[System] Initiated real-time streaming workflow for: '{query}'"],
        "revision_count": 0,
    }

    try:
        yield f"data: {json.dumps({'event': 'start', 'query': query, 'message': 'Initialized agent graph'})}\n\n"
        await asyncio.sleep(0.1)

        async for output in research_graph.astream(initial_state):
            for node_name, node_state in output.items():
                event_payload = {
                    "event": "node_update",
                    "node": node_name,
                    "logs": node_state.get("execution_logs", []),
                    "sub_queries": node_state.get("sub_queries", []),
                    "scraped_count": len(node_state.get("scraped_data", [])),
                    "critic_verdict": node_state.get("critic_verdict", ""),
                    "report_snippet": node_state.get("final_report", "")[:200],
                }
                yield f"data: {json.dumps(event_payload)}\n\n"
                await asyncio.sleep(0.1)

        # Yield final completed payload
        final_state = await research_graph.ainvoke(initial_state)
        completion_payload = {
            "event": "complete",
            "report": final_state.get("final_report", ""),
            "execution_logs": final_state.get("execution_logs", []),
            "scraped_data": final_state.get("scraped_data", []),
        }
        yield f"data: {json.dumps(completion_payload)}\n\n"

    except Exception as e:
        logger.error(f"SSE stream error: {e}", exc_info=True)
        err_payload = {"event": "error", "message": str(e)}
        yield f"data: {json.dumps(err_payload)}\n\n"


@router.post("/stream")
async def stream_research(request: ResearchRequest):
    """Streams real-time agent execution traces and findings via Server-Sent Events (SSE)."""
    logger.info(f"Received research streaming request: '{request.query}'")
    return StreamingResponse(
        generate_sse_stream(request.query),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
