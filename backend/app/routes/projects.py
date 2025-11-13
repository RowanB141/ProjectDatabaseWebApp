from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from ..extensions import mongo

projects_bp = Blueprint("projects", __name__)


# Returns all the current projects that the user is approved to view
@projects_bp.route("/", methods=["GET"])
@jwt_required()
def list_projects():
    user_id = get_jwt_identity()
    proj_coll = mongo.db.projects
    
    # Only fetch projects where user is owner OR in members array
    cursor = proj_coll.find({
        "$or": [
            {"owner": user_id},
            {"members": user_id}
        ]
    })

    out = []
    for p in cursor:
        out.append({
            "id": str(p["_id"]),
            "name": p.get("name"),
            "projectId": p.get("projectId"),
            "owner": p.get("owner"),
            "members": p.get("members", []),
            "description": p.get("description", ""),
            "hardware": p.get("hardware", {}),
            "isMember": user_id in p.get("members", [])
        })
    
    return jsonify(out), 200



# Create a new project, assign the current user as owner, and add it to the project database
# TODO: New input, approved users. Only approved users can view and join the project.
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

    existing = proj_coll.find_one({"projectId": {"$regex": f"^{project_id}$", "$options": "i"}})
    if existing:
        return jsonify({"message": "Project ID already exists"}), 409

    new_project = {
        "name": name,
        "projectId": project_id,
        "description": description,
        "owner": user_id,
        "members": [user_id],
        "hardware": {"HWSet1": 0, "HWSet2": 0}
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
        "hardware": {"HWSet1": 0, "HWSet2": 0},
        "isMember": True
    }), 201


def update_project_hardware(project_id, hwset1_change, hwset2_change):
    """
    Args:
        project_id: The project ID of the target project (not _id).
        hwset1_change (int): The value by which to change the target project's HWSet1 number checked-out (e.g., 4 or -3)
        hwset2_change (int): The value by which to change the target project's HWSet2 number checked-out (e.g., 4 or -3)
    """
    user_id = get_jwt_identity()
    proj_coll = mongo.db.projects
    project = proj_coll.find_one({"projectId": project_id})

    if project is None:
        return "Project not found", 404

    if not (isinstance(hwset1_change, int) and isinstance(hwset2_change, int)):
        return "HWSets must change by integer values", 400

    result = proj_coll.update_one(
        {"_id": project["_id"]},
        {"$set": {
            "hardware": {
                "HWSet1": project["hardware"].get("HWSet1", 0) + hwset1_change,
                "HWSet2": project["hardware"].get("HWSet2", 0) + hwset2_change
                }
            }
        }
    )

    return "Hardware updated successfully", 200


def get_project_hardware(project_id):
    """
    Get the hardware usage for a specific project.
    
    Args:
        project_id: The project ID (user-defined, not _id)
    
    Returns:
        tuple: (hwset1_amount, hwset2_amount, success_message, status_code)
               or (None, None, error_message, error_code) on failure
    """
    proj_coll = mongo.db.projects
    project = proj_coll.find_one({"projectId": project_id})
    
    if project is None:
        return None, None, "Project not found", 404
    
    hardware = project.get("hardware", {})
    hwset1 = hardware.get("HWSet1", 0)
    hwset2 = hardware.get("HWSet2", 0)
    
    return hwset1, hwset2, "Success", 200
    

# Adds the current user to the project with <project_id>
# TODO: User should only be able to join projects they are approved to join
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


# Removes the current user from the project with <project_id>
# TODO: If the user trying to leave is the owner, should that be allowed?
# TODO: Possible solution: If user is owner, and other users are in project, assign a random user to be the new owner.
# TODO:                    If user is owner and is last one in project, do not let them leave.
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


# Deletes the project with <project_id> and returns all checked-out hardware first
@projects_bp.route("/<project_id>", methods=["DELETE"])
@jwt_required()
def delete_project(project_id):
    user_id = get_jwt_identity()
    proj_coll = mongo.db.projects
    hw_coll = mongo.db.hardware

    try:
        obj_id = ObjectId(project_id)
    except Exception:
        return jsonify({"message": "Invalid project id"}), 400

    project = proj_coll.find_one({"_id": obj_id})
    if not project:
        return jsonify({"message": "Project not found"}), 404

    hw_usage = project.get("hardware", {}) or {}
    hwset1_amt = int(hw_usage.get("HWSet1", 0) or 0)
    hwset2_amt = int(hw_usage.get("HWSet2", 0) or 0)

    returned = {"HWSet1": 0, "HWSet2": 0}

    def return_to_set(set_name, amount):
        if amount <= 0:
            return 0
        hw_doc = hw_coll.find_one({"name": set_name})
        if not hw_doc:
            return 0
        new_available = int(hw_doc.get("available", 0) or 0) + amount
        hw_coll.update_one({"_id": hw_doc["_id"]}, {"$set": {"available": new_available}})
        return amount

    returned["HWSet1"] = return_to_set("HWSet1", hwset1_amt)
    returned["HWSet2"] = return_to_set("HWSet2", hwset2_amt)

    result = proj_coll.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        return jsonify({"message": "Project not found"}), 404

    return jsonify({
        "message": "Deleted successfully; hardware returned",
        "returned": returned
    }), 200
