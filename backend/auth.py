"""
Firebase ID-token verification for FastAPI.
Each authenticated request maps to a Firebase `uid`, used to scope
Qdrant collections (one per user) and uploaded-file storage.
"""
import os
import re
import logging

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from fastapi import Header, HTTPException

logger = logging.getLogger(__name__)


def init_firebase():
    """Initializes the Firebase Admin SDK exactly once."""
    if firebase_admin._apps:
        return

    cred_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")
    if cred_path:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    else:
        # Falls back to GOOGLE_APPLICATION_CREDENTIALS env var / GCP default creds
        firebase_admin.initialize_app()

    logger.info("Firebase Admin SDK initialized.")


async def get_current_user_id(authorization: str = Header(None)) -> str:
    """FastAPI dependency: verifies the Bearer ID token, returns the Firebase uid."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header.")

    id_token = authorization.split("Bearer ", 1)[1].strip()

    try:
        decoded = firebase_auth.verify_id_token(id_token)
        return decoded["uid"]
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token.")


def collection_name_for_user(uid: str) -> str:
    """Maps a Firebase uid to a safe, per-user Qdrant collection name."""
    safe_uid = re.sub(r"[^a-zA-Z0-9_-]", "_", uid)
    return f"kb_{safe_uid}"