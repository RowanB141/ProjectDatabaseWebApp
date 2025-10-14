from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import mongo

projects_bp = Blueprint("projects", __name__)

@projects_bp.route("/", methods=["GET"])
@jwt_required()
def list_projects():
    user_id = get_jwt_identity()
    proj_coll = mongo.db.projects
    cursor = proj_coll.find({
        "$or": [
            {"owner": user_id},
            {"members": {"$in": [user_id]}}
        ]
    })
    out = []
    for p in cursor:
        out.append({
            "id": str(p["_id"]),
            "name": p.get("name"),
            "owner": p.get("owner"),
            "members": p.get("members", []),
            "description": p.get("description", "")
        })
    return jsonify(out), 200
