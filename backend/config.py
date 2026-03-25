from pymongo import MongoClient
from dotenv import load_dotenv
import os
import certifi

load_dotenv()

def get_database():
    uri = os.getenv("MONGODB_URI")
    client = MongoClient(uri, tlsCAFile=certifi.where())
    db = client["resume_classifier"]
    return db

def get_collections():
    db = get_database()
    return {
        "resumes": db["resumes"],
        "job_descriptions": db["job_descriptions"],
        "scores": db["scores"]
    }
