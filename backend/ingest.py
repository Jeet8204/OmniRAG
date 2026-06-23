import os
import uuid
import logging
import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

COLLECTION_NAME = "knowledge_base"
EMBEDDING_DIM = 384  

def smart_chunking(text: str, chunk_size: int = 800, overlap: int = 150) -> list[str]:
    """Splits text into overlapping chunks to preserve semantic context."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if len(chunk.strip()) > 50:  
            chunks.append(chunk)
    return chunks

def init_vector_db():
    client = QdrantClient("localhost", port=6333)
    if not client.collection_exists(COLLECTION_NAME):
        logger.info(f"Creating new Qdrant collection: {COLLECTION_NAME}")
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE)
        )
    return client

def ingest_pdf(filepath: str):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    client = init_vector_db()
    
    logger.info(f"Parsing and chunking data from file path: {filepath}")
    doc = fitz.open(filepath)
    points = []
    
    # Store only the clean file name in the metadata for the UI to display cleanly
    clean_filename = os.path.basename(filepath)
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        
        text = " ".join(text.split())
        if not text:
            continue
            
        chunks = smart_chunking(text)
        
        for i, chunk in enumerate(chunks):
            vector = model.encode(chunk).tolist()
            payload = {
                "source_type": "document",
                "title": clean_filename,
                "page": page_num + 1,
                "text": chunk
            }
            
            chunk_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{clean_filename}_p{page_num}_c{i}"))
            points.append(PointStruct(id=chunk_id, vector=vector, payload=payload))
            
    if points:
        client.upsert(collection_name=COLLECTION_NAME, points=points)
        logger.info(f"Successfully committed vectors to database storage layer.")