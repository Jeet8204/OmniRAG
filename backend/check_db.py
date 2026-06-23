from qdrant_client import QdrantClient

# Connect to local database
client = QdrantClient("localhost", port=6333)

# Fetch a few points from your knowledge base
results = client.scroll(
    collection_name="knowledge_base",
    limit=3, # Change this to see more chunks
    with_payload=True, # This tells it to bring back your readable text
    with_vectors=False # Keeps the output clean by hiding the giant number arrays
)

print(f"--- Found {len(results[0])} chunks ---")
for point in results[0]:
    print(f"\nID: {point.id}")
    print(f"Title: {point.payload.get('title')}")
    print(f"Text Snippet: {point.payload.get('text')[:100]}...")