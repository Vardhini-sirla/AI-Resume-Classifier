from routes.auth import auth_bp
from routes.export import export_bp
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from routes.score import score_bp
from config import get_database
from routes.upload import upload_bp
from routes.delete import delete_bp
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

# Upload folder config
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Register blueprints
app.register_blueprint(upload_bp)
app.register_blueprint(score_bp)
app.register_blueprint(export_bp)
app.register_blueprint(delete_bp)
app.register_blueprint(auth_bp)


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running!"})

@app.route("/api/test", methods=["GET"])
def test_route():
    return jsonify({"message": "API is working!"})

@app.route('/api/db-test', methods=['GET'])
def db_test():
    try:
        db = get_database()
        db.command('ping')
        return jsonify({"status": "connected", "message": "MongoDB is working!"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
