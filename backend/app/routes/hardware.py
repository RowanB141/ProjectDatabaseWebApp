from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import mongo
from bson.objectid import ObjectId

hardware_bp = Blueprint("hardware", __name__)

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
    global_usage = hw.get("global_usage", {})  

    if action == "checkout":
        if available - amount < 0:
            return jsonify({"message": "Not enough available"}), 400
        available -= amount
        global_usage[project_id] = global_usage.get(project_id, 0) + amount

    elif action == "checkin":
        used = global_usage.get(project_id, 0)
        if used < amount:
            return jsonify({"message": "Cannot check in more than checked out"}), 400
        available = min(capacity, available + amount)
        global_usage[project_id] = used - amount
        if global_usage[project_id] == 0:
            del global_usage[project_id]
    else:
        return jsonify({"message": "Invalid action"}), 400

    hw_coll.update_one(
        {"_id": obj_id},
        {"$set": {"available": available, "global_usage": global_usage}}
    )

    updated = hw_coll.find_one({"_id": obj_id})
    return jsonify({
        "id": str(updated["_id"]),
        "name": updated.get("name"),
        "capacity": int(updated.get("capacity", 0)),
        "available": int(updated.get("available", 0)),
        "global_usage": updated.get("global_usage", {})
    }), 200
