# Kalapatan Konyango Self Help Group

This project folder separates the uploaded single-page app into frontend, Python backend, and MySQL database files.

## Structure

- `frontend/index.html` - HTML page using the uploaded logo.
- `frontend/css/styles.css` - CSS extracted from the original page.
- `frontend/js/app.js` - JavaScript extracted from the original page.
- `frontend/assets/kalapatan logo.PNG` - exact copied logo image.
- `backend/app.py` - Flask API starter for members and summary data.
- `backend/requirements.txt` - Python dependencies.
- `database/schema.sql` - MySQL database and tables.

## Run Frontend

Open `frontend/index.html` in a browser, or serve the folder with any static server.

## Run Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:MYSQL_HOST="localhost"
$env:MYSQL_USER="root"
$env:MYSQL_PASSWORD=""
$env:MYSQL_DATABASE="kalapatan_db"
python app.py
```

## Create MySQL Database

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS kalapatan_db;"
mysql -u root -p kalapatan_db < database/schema.sql
```
