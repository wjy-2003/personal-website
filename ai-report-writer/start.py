import os
# Clear proxy env vars (prevent httpx/requests from using system proxy)
for _var in ['ALL_PROXY', 'HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']:
    os.environ.pop(_var, None)

"""Start the AI Report Writer server (reliable method)"""
import os, sys

# Disable chromadb telemetry
os.environ["CHROMA_TELEMETRY_ENABLED"] = "false"
os.environ["CHROMA_TELEMETRY_OPT_OUT"] = "true"

# Import the server module (this loads chromadb, etc.)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import knowledge_server

# Pre-load the embedding model (avoids lazy-load during first request)
print("[INFO] Pre-loading embedding model...")
m = knowledge_server.get_embedder()
print(f"[INFO] Model loaded: {m.get_sentence_embedding_dimension()}d")

# Start the server
import uvicorn
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8888"))

print(f"""
╔══════════════════════════════════════╗
║     AI Report Writer Server         ║
║     http://localhost:{PORT}          ║
╚══════════════════════════════════════╝
""")
uvicorn.run(knowledge_server.app, host=HOST, port=PORT, log_level="info")
