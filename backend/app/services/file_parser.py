from typing import Optional
from fastapi import UploadFile
import io
import csv

try:
    from pypdf import PdfReader
except Exception:
    PdfReader = None

MAX_BYTES = 5 * 1024 * 1024  # 5 MB per file


async def parse_file(upload_file: UploadFile) -> Optional[str]:
    """Parse uploaded file into plain text. Supports PDF, CSV, TXT, MD."""
    filename = upload_file.filename or ""
    content_type = (upload_file.content_type or "").lower()

    # Read safely up to MAX_BYTES
    data = await upload_file.read()
    if not data:
        return None
    if len(data) > MAX_BYTES:
        data = data[:MAX_BYTES]

    lower = filename.lower()
    try:
        if lower.endswith('.pdf') or 'pdf' in content_type:
            if PdfReader is None:
                return ""  # PDF parser not available
            try:
                reader = PdfReader(io.BytesIO(data))
                texts = []
                for page in reader.pages:
                    try:
                        texts.append(page.extract_text() or "")
                    except Exception:
                        continue
                return "\n\n".join(t for t in texts if t)
            except Exception:
                return None
        elif lower.endswith('.csv') or 'csv' in content_type:
            try:
                text_io = io.StringIO(data.decode('utf-8', errors='replace'))
                reader = csv.reader(text_io)
                rows = []
                for row in reader:
                    rows.append(', '.join(row))
                    if sum(len(r) for r in rows) > MAX_BYTES:
                        break
                return '\n'.join(rows)
            except Exception:
                return None
        else:
            # treat as text (txt, md, etc.)
            try:
                return data.decode('utf-8', errors='replace')
            except Exception:
                return None
    finally:
        try:
            await upload_file.close()
        except Exception:
            pass
