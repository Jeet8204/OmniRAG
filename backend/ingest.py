import os
import uuid
import logging
import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient # type: ignore
from qdrant_client.models import VectorParams, Distance, PointStruct # type: ignore

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

EMBEDDING_DIM = 768


def smart_chunking(text: str, chunk_size: int = 800, overlap: int = 150) -> list[str]:
    """Splits text into overlapping chunks to preserve semantic context."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if len(chunk.strip()) > 50:
            chunks.append(chunk)
    return chunks


def init_vector_db(client: QdrantClient, collection_name: str) -> None:
    """Ensures a per-user collection exists in Qdrant."""
    if not client.collection_exists(collection_name):
        logger.info(f"Creating new Qdrant collection: {collection_name}")
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE)
        )


def ingest_pdf(filepath: str, collection_name: str, client: QdrantClient, model: SentenceTransformer) -> None:
    """Parses, chunks, embeds, and upserts a PDF into the given user's collection.

    `client` and `model` are passed in so the singletons already loaded in
    FastAPI's lifespan are reused, instead of reloading the embedding model
    from disk on every single upload.
    """
    init_vector_db(client, collection_name)

    logger.info(f"Parsing and chunking data from file path: {filepath}")
    doc = fitz.open(filepath)
    points = []

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
            # Namespacing by collection_name avoids cross-user id collisions
            chunk_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{collection_name}_{clean_filename}_p{page_num}_c{i}"))
            points.append(PointStruct(id=chunk_id, vector=vector, payload=payload))

    if points:
        client.upsert(collection_name=collection_name, points=points)
        logger.info(f"Committed {len(points)} vectors to collection '{collection_name}'.")
    doc.close()