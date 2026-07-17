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
Copy-Item .env.example .env
# Set MYSQL_PASSWORD in .env to the password for your local MySQL user.
python app.py
```

The backend creates `kalapatan_db` and its tables automatically on first start.
The MySQL account in `.env` needs permission to create that database. If it
does not, create the database once with an administrator account:

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS kalapatan_db;"
```
