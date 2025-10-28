# ProjectDatabaseWebApp
Project database web application for the ECE 461L team project.

## Team Members
Rowan Becker, Daniel McIver, Oneza Vhora, Jaewon Kim, Marzooq Shah, Akshita Rawat

## Quick Start (PowerShell)
```git clone https://github.com/RowanB141/ProjectDatabaseWebApp.git```

### Front End
1. Open a new terminal
2. Navigate to frontend folder
3. Run ```npm install```
4. Run ```npm run dev```

### Backend Quick Start (Flask + MongoDB):
1. [Download MongoDB](https://www.mongodb.com/try/download/community)
2. Install MongoDB
    1. Complete installation
    2. Default service configuration
    3. Install MongoDB Compass
3. Open Compass and add a new connection (defaults are fine, just give it a name, doesn't matter what)
4. Open a new terminal and go to `backend/`
5. Create and activate a Python virtualenv if you haven't already:
```powershell
py -3 -m venv .venv
. .\.venv\Scripts\Activate.ps1
```
6. Install backend dependencies:
```powershell
pip install -r requirements.txt
```
7. Create a `.env` file (or copy `.env.example`) and set `MONGO_URI` and `JWT_SECRET`.
8. Seed hardware sets (first time only):
```powershell
python seed_hardware.py
```
9. Run the server:
```powershell
python run.py
```

Testing & Utilities:
- A simple smoke script is available at `backend/smoke_test.py` (requires `requests`).
- A Postman collection is included at `postman_collection.json`.

## Quick test (copy/paste PowerShell)
Open three terminals: one for the backend (activate Python venv), one for the frontend (npm), and one for testing.

Backend terminal (activate venv and start server):
```powershell
cd ".\backend"
. .\.venv\Scripts\Activate.ps1
python run.py
```

Frontend terminal (start Vite):
```powershell
cd ".\frontend"
npm install
npm run dev
# open the Vite URL printed by the command (usually http://localhost:5173)
```

Quick API checks (use this in the third terminal). These use the test user `testuser` with password `password123`.

Test with smoke_test.py
``` powershell
$env:SMOKE_USER='testuser'
$env:SMOKE_PASS='password123'
python smoke_test.py
#smoke_test.py tests the following (success criteria):
#Server reachable at BASE_URL.
#Authentication endpoint returns a token (when using username/password).
#Authorization header accepted by protected endpoint (not 401/403).
#/api/hardware/ returns HTTP 200.
#The response body is valid JSON and can be parsed by requests.
```

Register a test user:
```powershell
$response = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:5000/api/auth/register' `
	-Headers @{ 'Content-Type' = 'application/json' } `
	-Body '{"username":"testuser","password":"password123"}'
$response | Format-List
```

Login and capture token:
```powershell
$login = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:5000/api/auth/login' `
	-Headers @{ 'Content-Type' = 'application/json' } `
	-Body '{"username":"testuser","password":"password123"}'
$token = $login.token
$token.Substring(0,40)
```

List hardware (note trailing slash):
```powershell
$hw = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:5000/api/hardware/' `
	-Headers @{ Authorization = "Bearer $token" }
$hw | Format-List
$hw[0].id
```

Checkout / Checkin examples:
```powershell
#$hid = $hw[0].id
Invoke-RestMethod -Method Put -Uri "http://127.0.0.1:5000/api/hardware/$hid" `
	-Headers @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' } `
	-Body '{"action":"checkout","amount":1}'

Invoke-RestMethod -Method Put -Uri "http://127.0.0.1:5000/api/hardware/$hid" `
	-Headers @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' } `
	-Body '{"action":"checkin","amount":1}'
```

Paste token to browser localStorage (so frontend Dashboard fetches data):
```js
// in browser DevTools Console (after logging in via API or UI)
localStorage.setItem('token','<PASTE_TOKEN_HERE>');
location.reload();
```
