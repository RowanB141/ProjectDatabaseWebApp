from app import create_app
from app.extensions import mongo

app = create_app()
with app.app_context():
    hw = mongo.db.hardware
    if hw.count_documents({"name": "HWSet1"}) == 0:
        hw.insert_one({
            "name": "HWSet1",
            "capacity": 10,
            "available": 10,
            "global_usage": {}
        })
    if hw.count_documents({"name": "HWSet2"}) == 0:
        hw.insert_one({
            "name": "HWSet2",
            "capacity": 8,
            "available": 8,
            "global_usage": {}
        })
    print("Seed complete with global usage tracking.")