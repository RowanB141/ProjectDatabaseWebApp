from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import mongo
from bson.objectid import ObjectId
from .projects import update_project_hardware, get_project_hardware

hardware_bp = Blueprint("hardware", __name__)


# Returns all the info for HWSet1 and HWSet2
@hardware_bp.route("/", methods=["GET"])
@jwt_required()
def list_hardware():
    hw_coll = mongo.db.hardware

    items = []
    for h in hw_coll.find():
        items.append({
            "id": str(h["_id"]),
            "name": h.get("name"),
            "capacity": int(h.get("capacity", 0)),
            "available": int(h.get("available", 0))
        })
    
    return jsonify(items), 200


# <hid> is a string of the _id field for the specific hardware (HWSet1 or HWSet2) from the hardware document in the database
# The frontend originally gets all the HIDs when it calls list_hardware to populate the HWSet values
@hardware_bp.route("/<hid>", methods=["PUT"])
@jwt_required()
def update_hardware(hid):
    data = request.get_json() or {}

    action = data.get("action")
    amount = int(data.get("amount", 1))
    project_id = data.get("project_id")  

    hw_coll = mongo.db.hardware
    try:
        obj_id = ObjectId(hid)
    except Exception:
        return jsonify({"message": "Invalid id"}), 400

    hw = hw_coll.find_one({"_id": obj_id})
    if not hw:
        return jsonify({"message": "Not found"}), 404

    available = int(hw.get("available", 0))
    capacity = int(hw.get("capacity", 0))

    if action == "checkout":
        if available - amount < 0:
            return jsonify({"message": "Not enough available"}), 400
        
        available -= amount
        
        name = hw.get("name")
        if name is None:
            return jsonify({"message": "Unknown hardware set name"}), 404
        elif name == "HWSet1":
            message, status_code = update_project_hardware(project_id, amount, 0)
        elif name == "HWSet2":
            message, status_code = update_project_hardware(project_id, 0, amount)

        if status_code != 200:
            return jsonify({"message": message}), status_code
    elif action == "checkin":
        hwset1, hwset2, message, status_code = get_project_hardware(project_id)
        
        if status_code != 200:
            return jsonify({"message": message}), status_code
        
        name = hw.get("name")
        if name is None:
            return jsonify({"message": "No hardware name found."}), 404

        project_usage = hwset1 if name == "HWSet1" else hwset2
        
        if project_usage < amount:
            return jsonify({"message": "Cannot check in more than checked out"}), 400
        
        available = min(capacity, available + amount)

        if name == "HWSet1":
            message, status_code = update_project_hardware(project_id, -1 * amount, 0)
        elif name == "HWSet2":
            message, status_code = update_project_hardware(project_id, 0, -1 * amount)

        if status_code != 200:
            return jsonify({"message": message}), status_code
    else:
        return jsonify({"message": "Invalid action"}), 400

    hw_coll.update_one(
        {"_id": obj_id},
        {"$set": {"available": available}}
    )
    updated = hw_coll.find_one({"_id": obj_id})

    return jsonify({
        "id": str(updated["_id"]),
        "name": updated.get("name"),
        "capacity": int(updated.get("capacity", 0)),
        "available": int(updated.get("available", 0)),
        "global_usage": updated.get("global_usage", {})
    }), 200
