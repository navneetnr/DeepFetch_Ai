import json
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.core.logging import logger
from app.db.database import SessionLocal
from app.db.models import ResearchSession


def save_research_session(
    *,
    db: Session,
    user_id: Optional[int],
    query: str,
    report_markdown: str,
    sources: List[Dict[str, Any]],
) -> ResearchSession:
    session = ResearchSession(
        user_id=user_id,
        query=query,
        report_markdown=report_markdown,
        sources_json=json.dumps(sources, ensure_ascii=False),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    logger.info(f"[History] Saved research session {session.id} for user_id={user_id}")
    return session


def save_research_session_with_new_db(
    *,
    user_id: Optional[int],
    query: str,
    report_markdown: str,
    sources: List[Dict[str, Any]],
) -> None:
    db = SessionLocal()
    try:
        save_research_session(
            db=db,
            user_id=user_id,
            query=query,
            report_markdown=report_markdown,
            sources=sources,
        )
    except Exception:
        db.rollback()
        logger.warning("[History] Failed to save research session", exc_info=True)
    finally:
        db.close()