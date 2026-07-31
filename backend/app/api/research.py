import json
import asyncio
from typing import List, Dict, Any, AsyncGenerator, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Form, File, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agents.graph import research_graph
from app.agents.state import ResearchState
from app.core.logging import logger
from app.services.file_parser import parse_file

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
async def execute_research(
    query: str = Form(..., description="Target research topic or query"),
    search_mode: str = Form('live', description="Search mode: 'live'|'document'|'hybrid'"),
    files: Optional[List[UploadFile]] = File(None),
):
    """Executes full autonomous multi-agent research graph synchronously to completion."""
    try:
        logger.info(f"Received research execution request: '{query}' (mode={search_mode})")

        # Parse uploaded files (if any) into a combined file_context
        combined_text = None
        if files:
            parts = []
            for f in files:
                try:
                    parsed = await parse_file(f)
                    if parsed:
                        parts.append(parsed)
                except Exception as e:
                    logger.warning(f"Failed to parse uploaded file {f.filename}: {e}")
            if parts:
                combined_text = "\n\n".join(parts)

        initial_state: ResearchState = {
            "user_query": query,
            "sub_queries": [],
            "scraped_data": [],
            "critic_verdict": "",
            "critic_feedback": "",
            "final_report": "",
            "execution_logs": [f"[System] Initiated autonomous workflow for query: '{query}' (mode={search_mode})"],
            "revision_count": 0,
            "file_context": combined_text,
            "search_mode": search_mode,
        }

        final_state = await research_graph.ainvoke(initial_state)

        return ResearchResponse(
            query=query,
            report=final_state.get("final_report", ""),
            scraped_data=final_state.get("scraped_data", []),
            execution_logs=final_state.get("execution_logs", []),
            critic_verdict=final_state.get("critic_verdict", "APPROVED"),
        )
    except Exception as e:
        logger.error(f"Error executing research graph: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Research execution failed: {str(e)}")


async def generate_sse_stream(initial_state: ResearchState) -> AsyncGenerator[str, None]:
    """Generates Server-Sent Events (SSE) streaming live execution agent state updates.

    Accepts a fully prepared `initial_state` so callers may include `file_context` and `search_mode`.
    """

    try:
        yield f"data: {json.dumps({'event': 'start', 'query': initial_state.get('user_query', ''), 'message': 'Initialized agent graph'})}\n\n"
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
async def stream_research(
    query: str = Form(...),
    search_mode: str = Form('live'),
    files: Optional[List[UploadFile]] = File(None),
):
    """Streams real-time agent execution traces and findings via Server-Sent Events (SSE)."""
    logger.info(f"Received research streaming request: '{query}' (mode={search_mode})")

    combined_text = None
    if files:
        parts = []
        for f in files:
            try:
                parsed = await parse_file(f)
                if parsed:
                    parts.append(parsed)
            except Exception as e:
                logger.warning(f"Failed to parse uploaded file {f.filename}: {e}")
        if parts:
            combined_text = "\n\n".join(parts)

    initial_state: ResearchState = {
        "user_query": query,
        "sub_queries": [],
        "scraped_data": [],
        "critic_verdict": "",
        "critic_feedback": "",
        "final_report": "",
        "execution_logs": [f"[System] Initiated real-time streaming workflow for: '{query}'"],
        "revision_count": 0,
        "file_context": combined_text,
        "search_mode": search_mode,
    }

    return StreamingResponse(
        generate_sse_stream(initial_state),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
