from app import create_app
from app.extensions import mongo

app = create_app()
with app.app_context():
    hw = mongo.db.hardware
    if hw.count_documents({"name":"HWSet1"}) == 0:
        hw.insert_one({"name":"HWSet1", "capacity": 100, "available": 100})
    if hw.count_documents({"name":"HWSet2"}) == 0:
        hw.insert_one({"name":"HWSet2", "capacity": 100, "available": 100})
    print("Seed complete")
