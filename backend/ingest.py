import os
import uuid
import logging
import fitz
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient # type: ignore
from qdrant_client.models import VectorParams, Distance, PointStruct # type: ignore

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

EMBEDDING_DIM = int(os.environ.get("EMBEDDING_DIM", "768"))


def smart_chunking(text: str, chunk_size: int = 800, overlap: int = 150) -> list[str]:
    words = text.split()
    chunks = []

    step = chunk_size - overlap

    for i in range(0, len(words), step):
        chunk = " ".join(words[i:i + chunk_size])
        if len(chunk.strip()) > 50:
            chunks.append(chunk)

    return chunks


def init_vector_db(client: QdrantClient, collection_name: str) -> None:
    if not client.collection_exists(collection_name):
        logger.info(f"Creating new Qdrant collection: {collection_name}")
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=EMBEDDING_DIM,
                distance=Distance.COSINE
            )
        )


def ingest_pdf(
    filepath: str,
    collection_name: str,
    client: QdrantClient,
    model: SentenceTransformer
) -> None:
    init_vector_db(client, collection_name)

    logger.info(f"Parsing PDF: {filepath}")

    doc = None
    points = []
    clean_filename = os.path.basename(filepath)

    try:
        doc = fitz.open(filepath)

        all_chunks = []

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")
            text = " ".join(text.split())

            if not text:
                continue

            chunks = smart_chunking(text)

            for i, chunk in enumerate(chunks):
                all_chunks.append({
                    "page_num": page_num,
                    "chunk_index": i,
                    "text": chunk
                })

        if not all_chunks:
            logger.warning(f"No readable text found in PDF: {clean_filename}")
            return

        logger.info(f"Embedding {len(all_chunks)} chunks...")

        vectors = model.encode(
            [item["text"] for item in all_chunks],
            batch_size=16,
            show_progress_bar=False
        )

        for item, vector in zip(all_chunks, vectors):
            payload = {
                "source_type": "document",
                "title": clean_filename,
                "page": item["page_num"] + 1,
                "text": item["text"]
            }

            chunk_id = str(uuid.uuid5(
                uuid.NAMESPACE_DNS,
                f"{collection_name}_{clean_filename}_p{item['page_num']}_c{item['chunk_index']}"
            ))

            points.append(PointStruct(
                id=chunk_id,
                vector=vector.tolist(),
                payload=payload
            ))

        if points:
            client.upsert(collection_name=collection_name, points=points)
            logger.info(f"Committed {len(points)} vectors to collection '{collection_name}'.")

    finally:
        if doc is not None:
            doc.close()