import os
import json
import logging
import shutil
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends # type: ignore
from fastapi.responses import StreamingResponse # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from pydantic import BaseModel
import google.generativeai as genai # type: ignore
from qdrant_client import QdrantClient # type: ignore
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv # type: ignore
from routers import gmail

from ingest import ingest_pdf
from auth import init_firebase, get_current_user_id, collection_name_for_user

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

ml_services = {}

ARCHIVE_DIR = "knowledge_archive"
os.makedirs(ARCHIVE_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.info("Booting up AI models and connecting to DB...")

    init_firebase()

    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY is missing from the .env file.")

    genai.configure(api_key=api_key)

    system_prompt = (
        "You are a precise and helpful knowledge assistant. "
        "Answer the user's question using ONLY the context provided below. "
        "If the answer cannot be determined from the context, state clearly that you do not have that information. "
        "Always cite your sources dynamically based on the context provided."
    )

    ml_services["gemini"] = genai.GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=system_prompt
    )
    ml_services["embedder"] = SentenceTransformer('BAAI/bge-base-en-v1.5')
    ml_services["qdrant"] = QdrantClient("localhost", port=6333)

    logging.info("Backend is ready to accept connections!")
    yield
    ml_services.clear()


# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(lifespan=lifespan)

app.include_router(gmail.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"status": "success", "message": "Knowledge Assistant API is running!"}


# ── Upload ───────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    uid: str = Depends(get_current_user_id),
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    user_dir = os.path.join(ARCHIVE_DIR, uid)
    os.makedirs(user_dir, exist_ok=True)
    permanent_file_path = os.path.join(user_dir, file.filename)

    try:
        with open(permanent_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        logging.info(f"File stored permanently at: {permanent_file_path}")

        collection_name = collection_name_for_user(uid)
        ingest_pdf(
            permanent_file_path,
            collection_name,
            ml_services["qdrant"],
            ml_services["embedder"],
        )

        return {"status": "success", "message": f"Successfully stored and indexed {file.filename}"}
    except Exception as e:
        logging.error(f"Upload/Ingestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


# ── Chat ─────────────────────────────────────────────────────────────────────
@app.post("/api/chat")
async def chat_endpoint(
    req: ChatRequest,
    uid: str = Depends(get_current_user_id),
):
    try:
        collection_name = collection_name_for_user(uid)
        qdrant = ml_services["qdrant"]

        if not qdrant.collection_exists(collection_name):
            async def empty_generator():
                yield f"data: {json.dumps({'type': 'sources', 'data': []})}\n\n".encode('utf-8')
                msg = "I don't have any documents indexed for you yet. Please upload a PDF first."
                yield f"data: {json.dumps({'type': 'token', 'data': msg})}\n\n".encode('utf-8')
                yield b"data: [DONE]\n\n"
            return StreamingResponse(empty_generator(), media_type="text/event-stream")

        query_vector = ml_services["embedder"].encode(req.message).tolist()

        results = qdrant.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=5,
        )

        async def event_generator():
            try:
                sources = [
                    {
                        "source_type": r.payload.get("source_type", "document"),
                        "title": r.payload.get("title", "Unknown"),
                        "page": r.payload.get("page", 1),
                    }
                    for r in results
                ]
                yield f"data: {json.dumps({'type': 'sources', 'data': sources})}\n\n".encode('utf-8')

                context_blocks = [
                    f"[Source {i+1}: {r.payload.get('title')} - Page {r.payload.get('page')}]\n{r.payload.get('text')}"
                    for i, r in enumerate(results)
                ]
                full_context = "\n\n".join(context_blocks)
                prompt = f"Context Data:\n{full_context}\n\nUser Question: {req.message}"

                response = ml_services["gemini"].generate_content(prompt, stream=True)

                for chunk in response:
                    if chunk.text:
                        yield f"data: {json.dumps({'type': 'token', 'data': chunk.text})}\n\n".encode('utf-8')

                yield b"data: [DONE]\n\n"

            except Exception as e:
                logging.error(f"Streaming error: {str(e)}")
                yield f"data: {json.dumps({'type': 'token', 'data': '[ERROR: Connection to AI interrupted]'})}\n\n".encode('utf-8')
                yield b"data: [DONE]\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    except Exception as e:
        logging.error(f"Endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during context retrieval.")