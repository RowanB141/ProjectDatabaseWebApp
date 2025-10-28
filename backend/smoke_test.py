import os, requests

BASE = os.getenv('BASE_URL', 'http://127.0.0.1:5000')
USERNAME = os.getenv('SMOKE_USER')    # optional
PASSWORD = os.getenv('SMOKE_PASS')    # optional
TOKEN = os.getenv('TOKEN')            # optional

def get_token():
    global TOKEN
    if TOKEN:
        return TOKEN
    if USERNAME and PASSWORD:
        r = requests.post(f'{BASE}/api/auth/login', json={'username': USERNAME, 'password': PASSWORD})
        r.raise_for_status()
        TOKEN = r.json().get('access_token') or r.json().get('accessToken') or r.json().get('token')
        return TOKEN
    raise RuntimeError('No TOKEN and no SMOKE_USER/SMOKE_PASS set')

def health():
    try:
        token = get_token()
        headers = {'Authorization': f'Bearer {token}'}
        r = requests.get(f"{BASE}/api/hardware/", headers=headers, timeout=5)
        print('hardware status:', r.status_code)
        print(r.json())
    except Exception as e:
        print('hardware check failed:', e)

if __name__ == '__main__':
    health()
