import asyncio
import json
from typing import Any, AsyncGenerator, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.agents.graph import research_graph
from app.agents.state import ResearchState
from app.api.dependencies import get_current_user, get_optional_current_user
from app.core.logging import logger
from app.db.database import get_db
from app.db.models import ResearchSession, User
from app.services.file_parser import parse_file
from app.services.research_history import save_research_session, save_research_session_with_new_db

router = APIRouter(prefix="/api/v1/research", tags=["Autonomous Research"])


class ResearchRequest(BaseModel):
    query: str = Field(..., description="Target research topic or query", min_length=3)


class ResearchResponse(BaseModel):
    query: str
    report: str
    scraped_data: List[Dict[str, Any]]
    execution_logs: List[str]
    critic_verdict: str


class ResearchHistoryItem(BaseModel):
    id: int
    query: str
    report_markdown: str
    sources: List[Dict[str, Any]]
    created_at: str


def _history_item(session: ResearchSession) -> ResearchHistoryItem:
    try:
        sources = json.loads(session.sources_json or "[]")
    except json.JSONDecodeError:
        sources = []

    return ResearchHistoryItem(
        id=session.id,
        query=session.query,
        report_markdown=session.report_markdown,
        sources=sources,
        created_at=session.created_at.isoformat(),
    )


async def _parse_uploads(files: Optional[List[UploadFile]]) -> Optional[str]:
    if not files:
        return None

    parts = []
    for f in files:
        try:
            parsed = await parse_file(f)
            if parsed:
                parts.append(parsed)
        except Exception as e:
            logger.warning(f"Failed to parse uploaded file {f.filename}: {e}")
    return "\n\n".join(parts) if parts else None


def _initial_state(query: str, search_mode: str, combined_text: Optional[str], user_id: Optional[int]) -> ResearchState:
    return {
        "user_query": query,
        "sub_queries": [],
        "scraped_data": [],
        "critic_verdict": "",
        "critic_feedback": "",
        "final_report": "",
        "execution_logs": [f"[System] Initiated autonomous workflow for query: '{query}' (mode={search_mode})"],
        "revision_count": 0,
        "max_revisions_exhausted": False,
        "file_context": combined_text,
        "search_mode": search_mode,
        "user_id": user_id,
    }


def _persist_final_state(db: Session, final_state: ResearchState, user_id: Optional[int]) -> None:
    report = final_state.get("final_report", "")
    if not report:
        return

    try:
        save_research_session(
            db=db,
            user_id=user_id,
            query=final_state.get("user_query", ""),
            report_markdown=report,
            sources=final_state.get("scraped_data", []),
        )
    except Exception:
        db.rollback()
        logger.warning("[History] Failed to persist completed research report", exc_info=True)


@router.post("/execute", response_model=ResearchResponse)
async def execute_research(
    query: str = Form(..., description="Target research topic or query"),
    search_mode: str = Form("live", description="Search mode: 'live'|'document'|'hybrid'"),
    files: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Executes full autonomous multi-agent research graph synchronously to completion."""
    try:
        logger.info(f"Received research execution request: '{query}' (mode={search_mode})")

        combined_text = await _parse_uploads(files)
        user_id = current_user.id
        initial_state = _initial_state(query, search_mode, combined_text, user_id)

        final_state = await research_graph.ainvoke(initial_state)
        _persist_final_state(db, final_state, user_id)

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


@router.get("/history", response_model=List[ResearchHistoryItem])
def get_research_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetches persisted research sessions for the authenticated user."""
    sessions = (
        db.query(ResearchSession)
        .filter(ResearchSession.user_id == current_user.id)
        .order_by(ResearchSession.created_at.desc())
        .all()
    )
    return [_history_item(session) for session in sessions]


async def generate_sse_stream(initial_state: ResearchState) -> AsyncGenerator[str, None]:
    """Generates Server-Sent Events (SSE) streaming live execution agent state updates."""

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

        final_state = await research_graph.ainvoke(initial_state)
        report = final_state.get("final_report", "")
        if report:
            save_research_session_with_new_db(
                user_id=initial_state.get("user_id"),
                query=final_state.get("user_query", ""),
                report_markdown=report,
                sources=final_state.get("scraped_data", []),
            )

        completion_payload = {
            "event": "complete",
            "report": report,
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
    search_mode: str = Form("live"),
    files: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_user),
):
    """Streams real-time agent execution traces and findings via Server-Sent Events (SSE)."""
    logger.info(f"Received research streaming request: '{query}' (mode={search_mode})")

    combined_text = await _parse_uploads(files)
    user_id = current_user.id
    initial_state = _initial_state(query, search_mode, combined_text, user_id)
    initial_state["execution_logs"] = [f"[System] Initiated real-time streaming workflow for: '{query}'"]

    return StreamingResponse(
        generate_sse_stream(initial_state),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )