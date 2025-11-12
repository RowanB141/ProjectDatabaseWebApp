from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import mongo
from flask_jwt_extended import create_access_token

auth_bp = Blueprint("auth", __name__)


# Create a new user in the users collection.
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'message':'Missing fields'}), 400
    
    users = mongo.db.users
    if users.find_one({'username': username}):
        return jsonify({'message':'User exists'}), 400
    
    pw_hash = generate_password_hash(password)
    res = users.insert_one({'username': username, 'passwordHash': pw_hash, 'role': 'user'})
    user = {'id': str(res.inserted_id), 'username': username, 'role': 'user'}
    token = create_access_token(identity=user['id'])
    
    return jsonify({'token': token, 'user': user}), 200


# Validate that the user exists and the given password hashed matches the password hash from the users collection.
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}

    username = data.get('username')
    password = data.get('password')

    users = mongo.db.users
    user = users.find_one({'username': username})
    if not user or not check_password_hash(user.get('passwordHash',''), password):
        return jsonify({'message':'Invalid credentials'}), 400
    
    user_payload = {'id': str(user['_id']), 'username': user['username'], 'role': user.get('role','user')}
    token = create_access_token(identity=user_payload['id'])

    return jsonify({'token': token, 'user': user_payload}), 200
