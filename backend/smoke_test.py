import requests
import os

BASE = os.getenv('BASE_URL', 'http://127.0.0.1:5000')

def health():
    try:
        r = requests.get(f"{BASE}/api/hardware/")
        print('hardware status:', r.status_code)
    except Exception as e:
        print('hardware check failed:', e)

if __name__ == '__main__':
    health()
