import logging
import os

import certifi
from dotenv import load_dotenv
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.errors import OperationFailure

load_dotenv()

logger = logging.getLogger(__name__)

_client = None


def _get_client() -> MongoClient:
    """Return a cached MongoClient (connection-pooled)."""
    global _client
    if _client is None:
        uri = os.getenv("MONGODB_URI")
        if not uri:
            raise RuntimeError("MONGODB_URI environment variable is not set")
        _client = MongoClient(uri, tlsCAFile=certifi.where())
    return _client


def get_database():
    return _get_client()["resume_classifier"]


def get_collections():
    db = get_database()
    return {
        "resumes": db["resumes"],
        "job_descriptions": db["job_descriptions"],
        "scores": db["scores"],
        "users": db["users"],
        "sessions": db["sessions"],
    }


def ensure_indexes():
    """
    Create indexes for performance-critical queries.
    Safe to call multiple times — MongoDB is idempotent for existing indexes.
    """
    db = get_database()
    try:
        # resumes: filter by status (analytics, score-all) + sort by upload date
        db["resumes"].create_index([("status", ASCENDING)])
        db["resumes"].create_index([("uploaded_at", DESCENDING)])

        # users: login by email (unique)
        db["users"].create_index([("email", ASCENDING)], unique=True)

        # sessions: token lookup (unique) + TTL auto-expiry
        db["sessions"].create_index([("token", ASCENDING)], unique=True)
        db["sessions"].create_index(
            [("expires_at", ASCENDING)], expireAfterSeconds=0
        )  # MongoDB TTL index — auto-deletes expired sessions

        logger.info("MongoDB indexes ensured.")
    except OperationFailure as exc:
        # Non-fatal: index may already exist with a different option
        logger.warning("Index creation warning (non-fatal): %s", exc)
    except Exception as exc:
        logger.error("Failed to create indexes: %s", exc)
