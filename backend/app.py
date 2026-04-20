import logging
import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from config import ensure_indexes, get_database
from routes.analytics import analytics_bp
from routes.auth import auth_bp
from routes.confidence_route import confidence_bp
from routes.delete import delete_bp
from routes.export import export_bp
from routes.score import score_bp
from routes.upload import upload_bp

load_dotenv()

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── App factory ────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ── Blueprints ─────────────────────────────────────────────────────────────────
app.register_blueprint(upload_bp)
app.register_blueprint(score_bp)
app.register_blueprint(confidence_bp)
app.register_blueprint(export_bp)
app.register_blueprint(delete_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(analytics_bp)

# ── Startup tasks ──────────────────────────────────────────────────────────────
try:
    ensure_indexes()
except Exception as exc:
    logger.warning("Startup: could not ensure indexes (%s). Continuing.", exc)

# ── Health / test routes ───────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running!"})


@app.route("/api/test", methods=["GET"])
def test_route():
    return jsonify({"message": "API is working!"})


@app.route("/api/db-test", methods=["GET"])
def db_test():
    try:
        db = get_database()
        db.command("ping")
        return jsonify({"status": "connected", "message": "MongoDB is working!"})
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 500


if __name__ == "__main__":
    app.run(debug=os.getenv("FLASK_DEBUG", "false").lower() == "true", port=5000)
