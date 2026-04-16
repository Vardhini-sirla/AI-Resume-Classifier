from flask import Blueprint, request, jsonify
from config import get_database
import bcrypt
import secrets
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

def get_users_collection():
    db = get_database()
    return db["users"]

def get_sessions_collection():
    db = get_database()
    return db["sessions"]

@auth_bp.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    company = data.get('company', '').strip()
    
    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    users = get_users_collection()
    
    # Check if user already exists
    if users.find_one({'email': email}):
        return jsonify({'error': 'An account with this email already exists'}), 409
    
    # Hash password
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user = {
        'name': name,
        'email': email,
        'password': hashed,
        'company': company,
        'role': 'recruiter',
        'created_at': datetime.utcnow()
    }
    
    result = users.insert_one(user)
    
    # Create session token
    token = secrets.token_hex(32)
    sessions = get_sessions_collection()
    sessions.insert_one({
        'token': token,
        'user_id': str(result.inserted_id),
        'email': email,
        'name': name,
        'company': company,
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(days=7)
    })
    
    return jsonify({
        'message': 'Account created successfully',
        'token': token,
        'user': {
            'name': name,
            'email': email,
            'company': company
        }
    }), 201

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    users = get_users_collection()
    user = users.find_one({'email': email})
    
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Check password
    if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Create session token
    token = secrets.token_hex(32)
    sessions = get_sessions_collection()
    sessions.insert_one({
        'token': token,
        'user_id': str(user['_id']),
        'email': email,
        'name': user['name'],
        'company': user.get('company', ''),
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(days=7)
    })
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {
            'name': user['name'],
            'email': email,
            'company': user.get('company', '')
        }
    })

@auth_bp.route('/api/auth/verify', methods=['GET'])
def verify_token():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    sessions = get_sessions_collection()
    session = sessions.find_one({
        'token': token,
        'expires_at': {'$gt': datetime.utcnow()}
    })
    
    if not session:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    return jsonify({
        'user': {
            'name': session['name'],
            'email': session['email'],
            'company': session.get('company', '')
        }
    })

@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if token:
        sessions = get_sessions_collection()
        sessions.delete_one({'token': token})
    
    return jsonify({'message': 'Logged out successfully'})