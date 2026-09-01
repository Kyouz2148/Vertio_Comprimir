import os
import io
import uuid
import time
import zipfile
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Response
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.compressor import compress_file_dispatch

app = FastAPI(
    title="Vertio Comprimir",
    description="Otimizador e compressor minimalista de imagens e arquivos",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COMPRESSED_CACHE = {}
CACHE_TTL_SECONDS = 600  # 10 minutes

def clean_expired_cache():
    now = time.time()
    expired = [k for k, v in COMPRESSED_CACHE.items() if now - v["created_at"] > CACHE_TTL_SECONDS]
    for k in expired:
        del COMPRESSED_CACHE[k]

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>Vertio Comprimir API está em execução</h1>")

@app.post("/api/compress")
async def compress_files(
    files: List[UploadFile] = File(...),
    quality: int = Form(75),
    target_format: str = Form("original"),
    max_width: Optional[int] = Form(None),
    max_height: Optional[int] = Form(None),
    pdf_quality: str = Form("medium"),
    target_max_kb: Optional[int] = Form(None),
    target_min_kb: Optional[int] = Form(None)
):
    clean_expired_cache()
    
    if not files:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado.")

    results = []
    for file in files:
        try:
            content = await file.read()
            if not content:
                continue

            result = compress_file_dispatch(
                file_bytes=content,
                filename=file.filename or "file",
                quality=quality,
                target_format=target_format,
                max_width=max_width if max_width and max_width > 0 else None,
                max_height=max_height if max_height and max_height > 0 else None,
                pdf_quality=pdf_quality,
                target_max_kb=target_max_kb if target_max_kb and target_max_kb > 0 else None,
                target_min_kb=target_min_kb if target_min_kb and target_min_kb > 0 else None
            )

            file_id = str(uuid.uuid4())
            COMPRESSED_CACHE[file_id] = {
                "bytes": result["bytes"],
                "filename": result["compressed_filename"],
                "mime_type": result["mime_type"],
                "created_at": time.time()
            }

            results.append({
                "id": file_id,
                "original_filename": result["original_filename"],
                "compressed_filename": result["compressed_filename"],
                "original_size": result["original_size"],
                "compressed_size": result["compressed_size"],
                "saved_bytes": result["saved_bytes"],
                "percent_saved": result["percent_saved"],
                "mime_type": result["mime_type"],
                "file_type": result["file_type"],
                "meta": result.get("meta", {}),
                "download_url": f"/api/download/{file_id}"
            })
        except Exception as e:
            results.append({
                "original_filename": file.filename,
                "error": str(e)
            })

    return {"status": "success", "results": results}

@app.get("/api/download/{file_id}")
async def download_file(file_id: str):
    clean_expired_cache()
    cached = COMPRESSED_CACHE.get(file_id)
    if not cached:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado ou link expirado.")

    return Response(
        content=cached["bytes"],
        media_type=cached["mime_type"],
        headers={
            "Content-Disposition": f'attachment; filename="{cached["filename"]}"'
        }
    )

@app.post("/api/download-zip")
async def download_batch_zip(
    file_ids: List[str] = Form(...)
):
    clean_expired_cache()
    if not file_ids:
        raise HTTPException(status_code=400, detail="Nenhum arquivo selecionado para download.")

    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, "w", zipfile.ZIP_DEFLATED) as zipf:
        for f_id in file_ids:
            item = COMPRESSED_CACHE.get(f_id)
            if item:
                zipf.writestr(item["filename"], item["bytes"])

    zip_io.seek(0)
    return StreamingResponse(
        zip_io,
        media_type="application/zip",
        headers={
            "Content-Disposition": 'attachment; filename="vertio_comprimidos.zip"'
        }
    )
