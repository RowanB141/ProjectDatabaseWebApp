from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from ..extensions import mongo

projects_bp = Blueprint("projects", __name__)

@projects_bp.route("/", methods=["GET"])
@jwt_required()
def list_projects():
    user_id = get_jwt_identity()
    proj_coll = mongo.db.projects
    cursor = proj_coll.find({})
    out = []
    for p in cursor:
        out.append({
            "id": str(p["_id"]),
            "name": p.get("name"),
            "owner": p.get("owner"),
            "members": p.get("members", []),
            "description": p.get("description", ""),
            "isMember": user_id in p.get("members", [])
        })
    return jsonify(out), 200


@projects_bp.route("/", methods=["POST"])
@jwt_required()
def create_project():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Get data from request
    name = data.get("name")
    project_id = data.get("id")
    description = data.get("description", "")
    
    # Validate required fields
    if not name or not project_id:
        return jsonify({"message": "name and id are required"}), 400
    
    # Create project in database
    proj_coll = mongo.db.projects
    new_project = {
        "name": name,
        "projectId": project_id,
        "description": description,
        "owner": user_id,
        "members": [user_id]
    }
    
    result = proj_coll.insert_one(new_project)
    
    # Return the created project
    return jsonify({
        "id": str(result.inserted_id),
        "name": name,
        "projectId": project_id,
        "description": description,
        "owner": user_id,
        "members": [user_id],
        "isMember": True
    }), 201


@projects_bp.route("/<project_id>/join", methods=["POST"])
@jwt_required()
def join_project(project_id):
    user_id = get_jwt_identity()
    proj_coll = mongo.db.projects
    
    # Add user to members array if not already there
    result = proj_coll.update_one(
        {"_id": ObjectId(project_id)},
        {"$addToSet": {"members": user_id}}
    )
    
    if result.matched_count == 0:
        return jsonify({"message": "Project not found"}), 404
    
    return jsonify({"message": "Joined successfully"}), 200


@projects_bp.route("/<project_id>/leave", methods=["POST"])
@jwt_required()
def leave_project(project_id):
    user_id = get_jwt_identity()
    proj_coll = mongo.db.projects
    
    # Remove user from members array
    result = proj_coll.update_one(
        {"_id": ObjectId(project_id)},
        {"$pull": {"members": user_id}}
    )
    
    if result.matched_count == 0:
        return jsonify({"message": "Project not found"}), 404
    
    return jsonify({"message": "Left successfully"}), 200


@projects_bp.route("/<project_id>", methods=["DELETE"])
@jwt_required()
def delete_project(project_id):
    user_id = get_jwt_identity()
    proj_coll = mongo.db.projects
    
    result = proj_coll.delete_one({"_id": ObjectId(project_id)})
    
    if result.deleted_count == 0:
        return jsonify({"message": "Project not found"}), 404
    
    return jsonify({"message": "Deleted successfully"}), 200
