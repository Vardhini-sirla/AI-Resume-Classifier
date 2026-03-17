from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()  # loads variables from .env file

app = Flask(__name__)
CORS(app)  # allows React frontend to talk to this backend

# Upload folder config
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running!"})

@app.route("/api/test", methods=["GET"])
def test_route():
    return jsonify({"message": "API is working!"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)


