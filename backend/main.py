import os
import json
import logging
import shutil
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Import the updated permanent ingestion function
from ingest import ingest_pdf

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

ml_services = {}

# PERMANENT FILE STORAGE DIRECTORY
# This creates a safe folder on your hard drive where PDFs live forever
ARCHIVE_DIR = "knowledge_archive"
os.makedirs(ARCHIVE_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager to initialize heavy ML models on startup."""
    logging.info("Booting up AI models and connecting to DB...")
    
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
    ml_services["embedder"] = SentenceTransformer('all-MiniLM-L6-v2')
    ml_services["qdrant"] = QdrantClient("localhost", port=6333)
    
    logging.info("Backend is ready to accept connections!")
    yield
    ml_services.clear()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "success", "message": "Knowledge Assistant API is running!"}

class ChatRequest(BaseModel):
    message: str

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Endpoint to handle PDF uploads, save them permanently, and trigger ingestion."""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    # Save the file cleanly into the permanent store
    permanent_file_path = os.path.join(ARCHIVE_DIR, file.filename)
    
    try:
        # Stream chunks of data to disk to efficiently write small or large files
        with open(permanent_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Log path for verification
        logging.info(f"File stored permanently at: {permanent_file_path}")
        
        # Trigger the vector parsing pipeline directly using the permanent file location
        ingest_pdf(permanent_file_path)
        
        return {"status": "success", "message": f"Successfully stored and indexed {file.filename}"}
    except Exception as e:
        logging.error(f"Upload/Ingestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    try:
        query_vector = ml_services["embedder"].encode(req.message).tolist()
        
        results = ml_services["qdrant"].search(
            collection_name="knowledge_base",
            query_vector=query_vector,
            limit=5
        )
        
        async def event_generator():
            try:
                sources = [{"source_type": r.payload.get("source_type", "document"), "title": r.payload.get("title", "Unknown"), "page": r.payload.get("page", 1)} for r in results]
                yield f"data: {json.dumps({'type': 'sources', 'data': sources})}\n\n".encode('utf-8')
                
                context_blocks = []
                for i, r in enumerate(results):
                    context_blocks.append(f"[Source {i+1}: {r.payload.get('title')} - Page {r.payload.get('page')}]\n{r.payload.get('text')}")
                
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