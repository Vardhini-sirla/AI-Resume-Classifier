from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

def get_database():
    client = MongoClient(os.getenv("MONGODB_URI"))
    db = client["resume_classifier"]
    return db

def get_collections():
    db = get_database()
    return {
        "resumes": db["resumes"],
        "job_descriptions": db["job_descriptions"],
        "scores": db["scores"]
    }
