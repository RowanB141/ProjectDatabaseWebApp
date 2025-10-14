# ProjectDatabaseWebApp
Project database web application for the ECE 461L team project.

##
Team Members: Rowan Becker, Daniel McIver, Oneza Vhora, Jaewon Kim, Marzooq Shah, Akshita Rawat

##
Frontend Quick Start:
1. ```git clone https://github.com/RowanB141/ProjectDatabaseWebApp.git```
2. Open cmd
3. Navigate to frontend folder
4. Run ```npm install```
5. Run ```npm run dev```

Backend Quick Start (Flask + MongoDB):
1. Open a new terminal and go to `backend/`
2. Create and activate a Python virtualenv if you haven't already:
```powershell
py -3 -m venv .venv
. .\.venv\Scripts\Activate.ps1
```
3. Install backend dependencies:
```powershell
pip install -r requirements.txt
```
4. Create a `.env` file (or copy `.env.example`) and set `MONGO_URI` and `JWT_SECRET`.
5. Seed hardware sets (optional):
```powershell
python seed_hardware.py
```
6. Run the server:
```powershell
python run.py
```

Testing & Utilities:
- A simple smoke script is available at `backend/smoke_test.py` (requires `requests`).
- A Postman collection is included at `postman_collection.json`.

Quick test (copy/paste PowerShell)
---------------------------------
Run these from two terminals: one for the backend (activate Python venv) and one for the frontend (npm).

Backend terminal (activate venv and start server):
```powershell
cd "C:\Users\oneza\Documents\fall 2025\ECE461L\ProjectDatabaseWebApp\backend"
. .\.venv\Scripts\Activate.ps1
python run.py
```

Frontend terminal (start Vite):
```powershell
cd "C:\Users\oneza\Documents\fall 2025\ECE461L\ProjectDatabaseWebApp\frontend"
npm install
npm run dev
# open the Vite URL printed by the command (usually http://localhost:5173)
```

Quick API checks (use this in a separate PowerShell session). These use the test user `testuser` with password `password123`.

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
