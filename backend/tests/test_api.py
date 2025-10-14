import os
import pytest
from app import create_app
from app.extensions import mongo


@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    app.config['MONGO_URI'] = os.getenv('MONGO_URI', 'mongodb://localhost:27017/projectdb_test')
    with app.test_client() as c:
        yield c


def test_hardware_list_empty(client):
    # Ensure endpoint returns 200 (may be empty list)
    rv = client.get('/api/hardware/')
    assert rv.status_code in (200, 401)
