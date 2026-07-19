import hashlib
import hmac
import os
import secrets
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse

import mysql.connector
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from mysql.connector import Error
from dotenv import load_dotenv
import time


def generate_registration_number(existing_members=None):
    prefix = "KKSHG"
    numbers = []
    for member in existing_members or []:
        reg = ""
        if isinstance(member, dict):
            reg = str(member.get("reg") or member.get("registration_number") or member.get("registrationNumber") or "").strip().upper()
        else:
            reg = str(member).strip().upper()
        if reg.startswith(prefix):
            suffix = reg[len(prefix):]
            if suffix.isdigit():
                numbers.append(int(suffix))
    if not numbers:
        return f"{prefix}1"
    return f"{prefix}{max(numbers) + 1}"


def build_member_select_query(columns=None):
    default_columns = ["id", "name", "registration_number", "registration_fee", "emergency", "education", "development", "fixed_deposit", "loan_balance", "created_at", "updated_at"]
    columns = list(columns or default_columns)
    has_full_name_column = "full_name" in columns
    has_name_column = "name" in columns
    select_columns = []
    for column in columns:
        if column == "full_name":
            select_columns.append("full_name")
        elif column == "name":
            select_columns.append("name AS full_name" if not has_full_name_column and has_name_column else "name")
        elif column == "registration_number":
            select_columns.append("registration_number")
        elif column == "registration_fee":
            select_columns.append("registration_fee")
        elif column == "emergency":
            select_columns.append("emergency")
        elif column == "education":
            select_columns.append("education")
        elif column == "development":
            select_columns.append("development")
        elif column == "loan_balance":
            select_columns.append("loan_balance")
        elif column == "created_at":
            select_columns.append("created_at")
        elif column == "updated_at":
            select_columns.append("updated_at")
        else:
            select_columns.append(column)
    return f"SELECT {', '.join(select_columns)} FROM members ORDER BY name"


def build_member_insert_query(columns=None, data=None):
    default_columns = ["name", "registration_number", "registration_fee", "emergency", "education", "development", "fixed_deposit", "loan_balance"]
    data = data or {}
    columns = list(columns or default_columns)

    priority_columns = ["name", "full_name", "registration_number", "registration_fee", "emergency", "education", "development", "fixed_deposit", "loan_balance", "id"]
    ordered_columns = [column for column in priority_columns if column in columns]
    ordered_columns.extend(column for column in columns if column not in ordered_columns)

    insert_columns = []
    values = []
    for column in ordered_columns:
        if column == "full_name":
            insert_columns.append("full_name" if "full_name" in columns else "name")
            values.append(data.get("full_name") or data.get("name") or "")
        elif column == "name":
            insert_columns.append("name")
            values.append(data.get("name") or data.get("full_name") or "")
        elif column == "registration_number":
            insert_columns.append("registration_number")
            values.append(data.get("registration_number") or data.get("reg") or "")
        elif column == "registration_fee":
            insert_columns.append("registration_fee")
            values.append(data.get("registration_fee", 0))
        elif column == "emergency":
            insert_columns.append("emergency")
            values.append(data.get("emergency", 0))
        elif column == "education":
            insert_columns.append("education")
            values.append(data.get("education", 0))
        elif column == "development":
            insert_columns.append("development")
            values.append(data.get("development", 0))
        elif column == "fixed_deposit":
            insert_columns.append("fixed_deposit")
            values.append(data.get("fixed_deposit", 0))
        elif column == "loan_balance":
            insert_columns.append("loan_balance")
            values.append(data.get("loan_balance", 0))
        else:
            insert_columns.append(column)
            values.append(data.get(column))
    query = f"INSERT INTO members ({', '.join(insert_columns)}) VALUES ({', '.join(['%s'] * len(insert_columns))})"
    return query, values


BASE_DIR = Path(__file__).resolve().parent
SCHEMA_PATH = BASE_DIR.parent / "database" / "schema.sql"

# Local development settings live in the project-level .env file. Environment
# variables supplied by Railway or another host still take precedence.
load_dotenv(BASE_DIR.parent / ".env")


def build_mysql_config():
    mysql_url = os.environ.get("MYSQL_URL") or os.environ.get("MYSQLPUBLICURL") or os.environ.get("MYSQL_PUBLIC_URL")
    if mysql_url:
        parsed = urlparse(mysql_url)
        if parsed.hostname:
            host = parsed.hostname
            port = parsed.port or 3306
            user = unquote(parsed.username) if parsed.username else (os.environ.get("MYSQLUSER") or os.environ.get("MYSQL_USER") or "root")
            password = (
                unquote(parsed.password) if parsed.password else None
                or os.environ.get("MYSQLPASSWORD")
                or os.environ.get("MYSQL_PASSWORD")
                or os.environ.get("MYSQL_ROOT_PASSWORD")
                or os.environ.get("MYSQLROOTPASSWORD")
                or os.environ.get("MYSQL_ROOT_PASS")
                or os.environ.get("MYSQL_ROOT_PASSWD")
                or ""
            )
            database = unquote(parsed.path.lstrip("/")) or os.environ.get("MYSQLDATABASE") or os.environ.get("MYSQL_DATABASE") or "kalapatan_db"
            return {
                "host": host,
                "port": port,
                "user": user,
                "password": password,
                "database": database,
                "autocommit": False,
            }

    host = os.environ.get("MYSQLHOST") or os.environ.get("MYSQL_HOST") or "127.0.0.1"
    port = int(os.environ.get("MYSQLPORT") or os.environ.get("MYSQL_PORT") or "3306")
    user = os.environ.get("MYSQLUSER") or os.environ.get("MYSQL_USER") or "root"
    password = (
        os.environ.get("MYSQLPASSWORD")
        or os.environ.get("MYSQL_PASSWORD")
        or os.environ.get("MYSQL_ROOT_PASSWORD")
        or os.environ.get("MYSQLROOTPASSWORD")
        or os.environ.get("MYSQL_ROOT_PASS")
        or os.environ.get("MYSQL_ROOT_PASSWD")
        or ""
    )
    database = os.environ.get("MYSQLDATABASE") or os.environ.get("MYSQL_DATABASE") or "kalapatan_db"
    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "database": database,
        "autocommit": False,
    }


MYSQL_CONFIG = build_mysql_config()


def _get_mysql_connection():
    try:
        return mysql.connector.connect(**MYSQL_CONFIG), None
    except Error as exc:
        return None, str(exc)


def serialize_row(row):
    if row is None:
        return None
    if hasattr(row, "keys"):
        return {key: row[key] for key in row.keys()}
    return {index: value for index, value in enumerate(row)}


def extract_column_names(rows):
    column_names = set()
    for row in rows:
        if row is None:
            continue
        if hasattr(row, "keys"):
            if "Field" in row:
                column_names.add(row["Field"])
            else:
                column_names.update(row.keys())
        elif isinstance(row, (list, tuple)) and row:
            if len(row) >= 1:
                value = row[0]
                if isinstance(value, str):
                    column_names.add(value)
                else:
                    column_names.add(str(value))
    return column_names


def build_member_balance_snapshot_rows(member_rows):
    snapshot_rows = []
    snapshot_date = datetime.now(timezone.utc).date().isoformat()
    for row in member_rows:
        if row is None:
            continue
        amount = float(row.get("balance") or 0)
        if amount <= 0:
            continue
        snapshot_rows.append(
            {
                "id": row.get("id"),
                "member_id": row.get("id"),
                "member_name": row.get("member_name") or row.get("full_name") or "Unknown Member",
                "amount": amount,
                "saved_on": snapshot_date,
                "notes": "Existing member savings snapshot",
            }
        )
    return snapshot_rows


def build_savings_history_payload(rows):
    periods = {
        "daily": {"total": 0.0, "entries": []},
        "weekly": {"total": 0.0, "entries": []},
        "monthly": {"total": 0.0, "entries": []},
        "annual": {"total": 0.0, "entries": []},
    }
    grouped_entries = defaultdict(list)

    for row in rows:
        if row is None:
            continue
        saved_on = row.get("saved_on") or row.get("date")
        try:
            parsed_date = datetime.fromisoformat(str(saved_on)).date()
        except (TypeError, ValueError):
            parsed_date = None

        amount_value = float(row.get("amount") or 0)
        entry = {
            "id": row.get("id"),
            "memberName": row.get("member_name") or row.get("memberName") or "Unknown Member",
            "amount": amount_value,
            "date": str(saved_on or ""),
            "notes": row.get("notes") or "",
        }
        if parsed_date is None:
            for bucket in periods:
                periods[bucket]["entries"].append(entry)
                periods[bucket]["total"] += amount_value
            continue

        entry["date"] = parsed_date.isoformat()
        daily_bucket = parsed_date.isoformat()
        weekly_bucket = f"{parsed_date.isocalendar().year}-W{parsed_date.isocalendar().week:02d}"
        monthly_bucket = parsed_date.strftime("%Y-%m")
        annual_bucket = parsed_date.strftime("%Y")

        grouped_entries["daily"].append({**entry, "period": daily_bucket})
        grouped_entries["weekly"].append({**entry, "period": weekly_bucket})
        grouped_entries["monthly"].append({**entry, "period": monthly_bucket})
        grouped_entries["annual"].append({**entry, "period": annual_bucket})

    for period_name, bucket_entries in grouped_entries.items():
        ordered_entries = sorted(bucket_entries, key=lambda item: (item["period"], item["date"], item["id"]), reverse=True)
        periods[period_name]["entries"] = ordered_entries
        periods[period_name]["total"] = round(sum(float(item.get("amount") or 0) for item in ordered_entries), 2)

    return periods


def build_frequency_ranking_payload(rows):
    ranked_rows = []
    for row in rows:
        if row is None:
            continue
        count = int(row.get("savings_count") or 0)
        qualifying_amount = float(row.get("qualifying_amount") or row.get("qualifyingTotalAmount") or 0)
        if count <= 0:
            continue
        ranked_rows.append(
            {
                "memberId": row.get("member_id"),
                "memberName": row.get("member_name") or "Unknown Member",
                "savingsCount": count,
                "qualifyingAmount": round(qualifying_amount, 2),
            }
        )

    ranked_rows.sort(
        key=lambda item: (
            -int(item.get("savingsCount") or 0),
            -(float(item.get("qualifyingAmount") or 0)),
            str(item.get("memberName") or "").lower(),
        )
    )
    return ranked_rows


def column_is_generated(conn, table_name, column_name):
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT GENERATION_EXPRESSION
            FROM information_schema.columns
            WHERE table_schema = %s AND table_name = %s AND column_name = %s
            """,
            (MYSQL_CONFIG["database"], table_name, column_name),
        )
        fetchone = getattr(cursor, "fetchone", None)
        if callable(fetchone):
            row = fetchone()
        else:
            rows = cursor.fetchall()
            row = rows[0] if rows else None
        cursor.close()
        return bool(row and row.get("GENERATION_EXPRESSION"))
    except Error:
        return False


def generate_password_hash(password, salt=None):
    password_text = str(password or "")
    if salt is None:
        salt = os.urandom(16).hex()
    elif isinstance(salt, bytes):
        salt = salt.hex()
    elif not isinstance(salt, str):
        salt = str(salt)
    digest = hashlib.pbkdf2_hmac("sha256", password_text.encode("utf-8"), salt.encode("utf-8"), 200_000).hex()
    return f"pbkdf2_sha256$200000${salt}${digest}"


def verify_password(password, stored_hash):
    if not stored_hash:
        return False
    if not stored_hash.startswith("pbkdf2_sha256$"):
        return str(password or "") == str(stored_hash or "")
    parts = stored_hash.split("$", 3)
    if len(parts) != 4:
        return False
    _, iterations, salt, digest = parts
    derived = hashlib.pbkdf2_hmac("sha256", str(password or "").encode("utf-8"), salt.encode("utf-8"), int(iterations)).hex()
    return hmac.compare_digest(derived, digest)


def create_app():
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
    app = Flask(__name__, static_folder=frontend_dir, static_url_path="")
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", os.getenv("FLASK_SECRET_KEY", "kalapatan-dev-secret"))
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
    CORS(app, supports_credentials=True)

    @app.after_request
    def disable_cache(response):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0, private"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

    def get_or_create_csrf_token():
        token = session.get("csrf_token")
        if not token:
            token = secrets.token_urlsafe(32)
            session["csrf_token"] = token
        return token

    def validate_csrf_token(token):
        expected_token = session.get("csrf_token")
        if not expected_token:
            return False
        return hmac.compare_digest(str(expected_token), str(token or ""))

    @app.before_request
    def enforce_csrf():
        if request.method in {"OPTIONS"}:
            return None
        if not request.path.startswith("/api/"):
            return None
        if request.method == "GET" or request.path == "/api/csrf-token":
            return None
        token = (
            request.headers.get("X-CSRF-Token")
            or request.headers.get("X-CSRFToken")
            or request.form.get("csrf_token")
            or request.args.get("csrf_token")
        )
        if not validate_csrf_token(token):
            return jsonify({"error": "CSRF token missing or invalid"}), 403
        return None

    @app.get("/api/csrf-token")
    def csrf_token():
        return jsonify({"csrfToken": get_or_create_csrf_token()})

    @app.errorhandler(404)
    def handle_not_found(error):
        if request.path.startswith("/api/"):
            return jsonify({"error": "Not found", "path": request.path}), 404
        return app.send_static_file("index.html")

    @app.errorhandler(RuntimeError)
    def handle_runtime_error(error):
        if request.path.startswith("/api/"):
            return jsonify({"error": str(error), "type": "database_unavailable"}), 503
        return app.send_static_file("index.html")

    def get_connection():
        conn, error = _get_mysql_connection()
        if conn is None:
            raise RuntimeError(error or "Database unavailable")
        return conn

    def init_db():
        # Connect without selecting the application database first. This lets a
        # new local setup create kalapatan_db before loading its schema.
        bootstrap_config = dict(MYSQL_CONFIG)
        bootstrap_config.pop("database", None)
        try:
            conn = mysql.connector.connect(**bootstrap_config)
            error = None
        except Error as exc:
            conn, error = None, str(exc)
        if conn is None:
            app.logger.warning("Database unavailable during init: %s", error)
            return False
        cursor = None
        try:
            cursor = conn.cursor()
            database_name = MYSQL_CONFIG["database"]
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{database_name}`")
            cursor.execute(f"USE `{database_name}`")

            if SCHEMA_PATH.exists():
                sql_script = SCHEMA_PATH.read_text(encoding="utf-8")
                if sql_script.strip():
                    result = cursor.execute(sql_script, multi=True)
                    if result is not None:
                        for _ in result:
                            pass

            cursor.execute("SHOW TABLES")
            fetchall = getattr(cursor, "fetchall", None)
            if callable(fetchall):
                table_names = {row[0] for row in fetchall()}
            else:
                table_names = set()

            if "members" in table_names:
                cursor.execute("DESCRIBE members")
                describe_rows = cursor.fetchall()
                columns = extract_column_names(describe_rows)
                if "full_name" not in columns and "name" in columns:
                    cursor.execute(
                        """
                        ALTER TABLE members
                        ADD COLUMN full_name VARCHAR(120) GENERATED ALWAYS AS (name) STORED
                        """
                    )
                    columns.add("full_name")
                if "phone" not in columns:
                    cursor.execute("ALTER TABLE members ADD COLUMN phone VARCHAR(30)")
                    columns.add("phone")
                if "email" not in columns:
                    cursor.execute("ALTER TABLE members ADD COLUMN email VARCHAR(120)")
                    columns.add("email")
                if "role" not in columns:
                    cursor.execute("ALTER TABLE members ADD COLUMN role VARCHAR(30) NOT NULL DEFAULT 'member'")
                    columns.add("role")
                if "joined_on" not in columns:
                    cursor.execute("ALTER TABLE members ADD COLUMN joined_on DATE NOT NULL DEFAULT (CURRENT_DATE)")
                    columns.add("joined_on")
                if "created_at" not in columns:
                    cursor.execute("ALTER TABLE members ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP")
                    columns.add("created_at")
                if "registration_number" not in columns:
                    cursor.execute("ALTER TABLE members ADD COLUMN registration_number VARCHAR(50)")
                    columns.add("registration_number")
                if "registration_fee" not in columns:
                    cursor.execute("ALTER TABLE members ADD COLUMN registration_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                    columns.add("registration_fee")
                if "emergency" not in columns:
                    cursor.execute("ALTER TABLE members ADD COLUMN emergency DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                    columns.add("emergency")
                if "education" not in columns:
                    cursor.execute("ALTER TABLE members ADD COLUMN education DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                    columns.add("education")
                if "development" not in columns:
                    cursor.execute("ALTER TABLE members ADD COLUMN development DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                    columns.add("development")
                if "fixed_deposit" not in columns:
                    cursor.execute("ALTER TABLE members ADD COLUMN fixed_deposit DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                    columns.add("fixed_deposit")
                if "loan_balance" not in columns:
                    cursor.execute("ALTER TABLE members ADD COLUMN loan_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                    columns.add("loan_balance")
                if "updated_at" not in columns:
                    cursor.execute("ALTER TABLE members ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
                    columns.add("updated_at")

            if "savings" in table_names:
                cursor.execute("DESCRIBE savings")
                savings_columns = extract_column_names(cursor.fetchall())
                if "member_id" not in savings_columns:
                    cursor.execute("ALTER TABLE savings ADD COLUMN member_id INT NOT NULL DEFAULT 0")
                    savings_columns.add("member_id")
                if "amount" not in savings_columns:
                    cursor.execute("ALTER TABLE savings ADD COLUMN amount DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                    savings_columns.add("amount")
                if "saved_on" not in savings_columns:
                    cursor.execute("ALTER TABLE savings ADD COLUMN saved_on DATE NOT NULL DEFAULT (CURRENT_DATE)")
                    savings_columns.add("saved_on")
                if "notes" not in savings_columns:
                    cursor.execute("ALTER TABLE savings ADD COLUMN notes VARCHAR(255)")
                    savings_columns.add("notes")
                if "created_at" not in savings_columns:
                    cursor.execute("ALTER TABLE savings ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP")
                    savings_columns.add("created_at")

            if "loans" in table_names:
                # DESCRIBE can fail if the table is being modified by a concurrent DDL statement.
                # Retry a few times with backoff when we encounter that specific transient error (1684).
                retries = 5
                loan_columns = set()
                for attempt in range(retries):
                    try:
                        cursor.execute("DESCRIBE loans")
                        loan_columns = extract_column_names(cursor.fetchall())
                        break
                    except Error as exc:
                        err_no = getattr(exc, "errno", None)
                        # 1684: table was skipped since its definition is being modified by concurrent DDL
                        if err_no == 1684 and attempt < retries - 1:
                            time.sleep(0.5 * (attempt + 1))
                            continue
                        raise
                if "member_id" not in loan_columns:
                    cursor.execute("ALTER TABLE loans ADD COLUMN member_id INT NOT NULL DEFAULT 0")
                    loan_columns.add("member_id")
                if "amount" not in loan_columns:
                    cursor.execute("ALTER TABLE loans ADD COLUMN amount DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                    loan_columns.add("amount")
                if "interest_rate" not in loan_columns:
                    cursor.execute("ALTER TABLE loans ADD COLUMN interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00")
                    loan_columns.add("interest_rate")
                if "issued_on" not in loan_columns:
                    cursor.execute("ALTER TABLE loans ADD COLUMN issued_on DATE NOT NULL DEFAULT (CURRENT_DATE)")
                    loan_columns.add("issued_on")
                if "due_on" not in loan_columns:
                    cursor.execute("ALTER TABLE loans ADD COLUMN due_on DATE")
                    loan_columns.add("due_on")
                if "status" not in loan_columns:
                    cursor.execute("ALTER TABLE loans ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'")
                    loan_columns.add("status")
                if "status" in loan_columns:
                    cursor.execute("ALTER TABLE loans MODIFY status VARCHAR(20) NOT NULL DEFAULT 'active'")
                if "created_at" not in loan_columns:
                    cursor.execute("ALTER TABLE loans ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP")
                    loan_columns.add("created_at")

                if "principal" in loan_columns:
                    cursor.execute("ALTER TABLE loans MODIFY principal DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                if "months" in loan_columns:
                    cursor.execute("ALTER TABLE loans MODIFY months INT NOT NULL DEFAULT 1")
                if "interest" in loan_columns:
                    cursor.execute("ALTER TABLE loans MODIFY interest DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                if "total_due" in loan_columns:
                    cursor.execute("ALTER TABLE loans MODIFY total_due DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                if "issued_at" in loan_columns and "issued_on" not in loan_columns:
                    cursor.execute("ALTER TABLE loans CHANGE issued_at issued_on DATE NOT NULL DEFAULT (CURRENT_DATE)")

            if "repayments" in table_names:
                cursor.execute("DESCRIBE repayments")
                repayment_columns = extract_column_names(cursor.fetchall())
                if "loan_id" not in repayment_columns:
                    cursor.execute("ALTER TABLE repayments ADD COLUMN loan_id INT NOT NULL DEFAULT 0")
                    repayment_columns.add("loan_id")
                if "member_id" not in repayment_columns:
                    cursor.execute("ALTER TABLE repayments ADD COLUMN member_id INT NOT NULL DEFAULT 0")
                    repayment_columns.add("member_id")
                if "amount" not in repayment_columns:
                    cursor.execute("ALTER TABLE repayments ADD COLUMN amount DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                    repayment_columns.add("amount")
                if "amount" in repayment_columns:
                    cursor.execute("ALTER TABLE repayments MODIFY amount DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                if "paid_on" not in repayment_columns:
                    cursor.execute("ALTER TABLE repayments ADD COLUMN paid_on DATE NOT NULL DEFAULT (CURRENT_DATE)")
                    repayment_columns.add("paid_on")
                if "paid_on" in repayment_columns:
                    cursor.execute("ALTER TABLE repayments MODIFY paid_on DATE NOT NULL DEFAULT (CURRENT_DATE)")
                if "paid_at" not in repayment_columns:
                    cursor.execute("ALTER TABLE repayments ADD COLUMN paid_at DATETIME NULL")
                    repayment_columns.add("paid_at")
                elif "paid_at" in repayment_columns:
                    cursor.execute("ALTER TABLE repayments MODIFY paid_at DATETIME NULL")
                if "paid_at" in repayment_columns and "paid_on" not in repayment_columns:
                    cursor.execute("ALTER TABLE repayments CHANGE paid_at paid_on DATE NOT NULL DEFAULT (CURRENT_DATE)")
                if "notes" not in repayment_columns:
                    cursor.execute("ALTER TABLE repayments ADD COLUMN notes VARCHAR(255)")
                    repayment_columns.add("notes")
                if "created_at" not in repayment_columns:
                    cursor.execute("ALTER TABLE repayments ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP")
                    repayment_columns.add("created_at")

            if "repayment_statements" in table_names:
                cursor.execute("DESCRIBE repayment_statements")
                statement_columns = extract_column_names(cursor.fetchall())
                if "status" not in statement_columns:
                    cursor.execute("ALTER TABLE repayment_statements ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'")
                    statement_columns.add("status")
                if "status" in statement_columns:
                    cursor.execute("ALTER TABLE repayment_statements MODIFY status VARCHAR(20) NOT NULL DEFAULT 'active'")

            if "uploaded_forms" in table_names:
                cursor.execute("DESCRIBE uploaded_forms")
                form_columns = extract_column_names(cursor.fetchall())
                if "name" not in form_columns:
                    cursor.execute("ALTER TABLE uploaded_forms ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT ''")
                    form_columns.add("name")
                if "file_name" not in form_columns:
                    cursor.execute("ALTER TABLE uploaded_forms ADD COLUMN file_name VARCHAR(255) NOT NULL DEFAULT ''")
                    form_columns.add("file_name")
                if "size_label" not in form_columns:
                    cursor.execute("ALTER TABLE uploaded_forms ADD COLUMN size_label VARCHAR(60) NOT NULL DEFAULT '1 KB'")
                    form_columns.add("size_label")
                if "data_url" not in form_columns:
                    cursor.execute("ALTER TABLE uploaded_forms ADD COLUMN data_url LONGTEXT NOT NULL")
                    form_columns.add("data_url")
                if "created_at" not in form_columns:
                    cursor.execute("ALTER TABLE uploaded_forms ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP")
                    form_columns.add("created_at")

            if "withdrawal_statements" in table_names:
                cursor.execute("DESCRIBE withdrawal_statements")
                withdrawal_columns = extract_column_names(cursor.fetchall())
                if "member_id" not in withdrawal_columns:
                    cursor.execute("ALTER TABLE withdrawal_statements ADD COLUMN member_id INT NOT NULL DEFAULT 0")
                    withdrawal_columns.add("member_id")
                if "member_name" not in withdrawal_columns:
                    cursor.execute("ALTER TABLE withdrawal_statements ADD COLUMN member_name VARCHAR(120) NOT NULL DEFAULT ''")
                    withdrawal_columns.add("member_name")
                if "member_reg" not in withdrawal_columns:
                    cursor.execute("ALTER TABLE withdrawal_statements ADD COLUMN member_reg VARCHAR(50) NOT NULL DEFAULT ''")
                    withdrawal_columns.add("member_reg")
                if "account" not in withdrawal_columns:
                    cursor.execute("ALTER TABLE withdrawal_statements ADD COLUMN account VARCHAR(60) NOT NULL DEFAULT 'emergency'")
                    withdrawal_columns.add("account")
                if "account_label" not in withdrawal_columns:
                    cursor.execute("ALTER TABLE withdrawal_statements ADD COLUMN account_label VARCHAR(120) NOT NULL DEFAULT 'Savings Account'")
                    withdrawal_columns.add("account_label")
                if "amount" not in withdrawal_columns:
                    cursor.execute("ALTER TABLE withdrawal_statements ADD COLUMN amount DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                    withdrawal_columns.add("amount")
                if "balance_before" not in withdrawal_columns:
                    cursor.execute("ALTER TABLE withdrawal_statements ADD COLUMN balance_before DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                    withdrawal_columns.add("balance_before")
                if "balance_after" not in withdrawal_columns:
                    cursor.execute("ALTER TABLE withdrawal_statements ADD COLUMN balance_after DECIMAL(12,2) NOT NULL DEFAULT 0.00")
                    withdrawal_columns.add("balance_after")
                if "timestamp" not in withdrawal_columns:
                    cursor.execute("ALTER TABLE withdrawal_statements ADD COLUMN timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP")
                    withdrawal_columns.add("timestamp")
                if "created_at" not in withdrawal_columns:
                    cursor.execute("ALTER TABLE withdrawal_statements ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP")
                    withdrawal_columns.add("created_at")

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS auth_users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(80) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(30) NOT NULL DEFAULT 'member',
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
                """
            )
            cursor.execute("SELECT COUNT(*) AS user_count FROM auth_users")
            user_count_row = cursor.fetchone()
            user_count = int(user_count_row[0] if user_count_row and hasattr(user_count_row, "__getitem__") else 0)
            if user_count == 0:
                default_users = [
                    ("chairman", "34717215", "Chairman"),
                    ("secretary", "34717215", "Secretary"),
                    ("treasurer", "34717215", "Treasurer"),
                ]
                for username, password, role in default_users:
                    cursor.execute(
                        "INSERT INTO auth_users (username, password_hash, role) VALUES (%s, %s, %s)",
                        (username, generate_password_hash(password), role),
                    )

            conn.commit()
            return True
        except Error as exc:
            try:
                conn.rollback()
            except Error:
                pass
            app.logger.warning("Database initialization skipped due to error: %s", exc)
            return False
        finally:
            if cursor is not None:
                cursor.close()
            conn.close()

    init_db()

    @app.get("/api/health")
    def health():
        db_state = "unavailable"
        conn, error = _get_mysql_connection()
        if conn is not None:
            db_state = "ready"
            conn.close()
        return jsonify({"status": "ok", "service": "kalapatan-api", "database": MYSQL_CONFIG["database"], "database_state": db_state, "database_error": error if error else None})

    @app.post("/api/login")
    def login():
        data = request.get_json(silent=True) or {}
        username = str(data.get("username") or data.get("user") or "").strip().lower()
        password = str(data.get("password") or "").strip()

        if not username or not password:
            return jsonify({"error": "username and password are required"}), 400

        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(
                    "SELECT id, username, password_hash, role FROM auth_users WHERE username = %s LIMIT 1",
                    (username,),
                )
                row = cursor.fetchone()
                if row is None:
                    return jsonify({"error": "Invalid username or password"}), 401

                if not verify_password(password, row.get("password_hash")):
                    return jsonify({"error": "Invalid username or password"}), 401

                return jsonify({"success": True, "user": row.get("username"), "role": row.get("role"), "id": row.get("id")})
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.post("/api/auth/password")
    def update_user_password():
        data = request.get_json(silent=True) or {}
        username = str(data.get("username") or "").strip().lower()
        password = str(data.get("password") or "").strip()
        acting_user = str(request.headers.get("X-User-Name") or request.headers.get("X-User") or "").strip().lower()
        acting_role = str(request.headers.get("X-User-Role") or "").strip().lower()

        if not username or not password:
            return jsonify({"error": "username and password are required"}), 400

        if acting_user and acting_user != username:
            is_chairman = acting_role == "chairman" or acting_role == "admin"
            if not is_chairman:
                return jsonify({"error": "Only the chairman can change another user's password"}), 403

        try:
            with get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM auth_users WHERE username = %s", (username,))
                if cursor.fetchone() is None:
                    return jsonify({"error": "User not found"}), 404
                cursor.execute(
                    "UPDATE auth_users SET password_hash = %s, updated_at = CURRENT_TIMESTAMP WHERE username = %s",
                    (generate_password_hash(password), username),
                )
                conn.commit()
                return jsonify({"success": True, "user": username})
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/forms")
    def list_uploaded_forms():
        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(
                    """
                    SELECT id, name, file_name, size_label, data_url, created_at
                    FROM uploaded_forms
                    ORDER BY created_at DESC, id DESC
                    """
                )
                rows = [serialize_row(row) for row in cursor.fetchall()]
                return jsonify(rows)
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.post("/api/forms")
    def create_uploaded_form():
        data = request.get_json(silent=True) or {}
        name = str(data.get("name") or "").strip()
        file_name = str(data.get("file_name") or data.get("fileName") or "uploaded-form").strip()
        size_label = str(data.get("size_label") or data.get("sizeLabel") or "1 KB").strip()
        data_url = str(data.get("data_url") or data.get("dataUrl") or "").strip()

        if not name or not data_url:
            return jsonify({"error": "name and data_url are required"}), 400

        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(
                    """
                    INSERT INTO uploaded_forms (name, file_name, size_label, data_url)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (name, file_name or name, size_label or "1 KB", data_url),
                )
                conn.commit()
                return jsonify({
                    "id": cursor.lastrowid,
                    "name": name,
                    "file_name": file_name or name,
                    "size_label": size_label or "1 KB",
                    "data_url": data_url,
                }), 201
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.delete("/api/forms/<int:form_id>")
    def delete_uploaded_form(form_id):
        try:
            with get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM uploaded_forms WHERE id = %s", (form_id,))
                conn.commit()
                return jsonify({"success": True, "message": "Uploaded form removed."})
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/withdrawal-statements")
    def list_withdrawal_statements():
        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(
                    """
                    SELECT id, member_id, member_name, member_reg, account, account_label, amount, balance_before, balance_after, timestamp
                    FROM withdrawal_statements
                    ORDER BY timestamp DESC, id DESC
                    """
                )
                rows = [serialize_row(row) for row in cursor.fetchall()]
                return jsonify(rows)
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.post("/api/withdrawal-statements")
    def create_withdrawal_statement():
        data = request.get_json(silent=True) or {}
        member_id = data.get("member_id")
        member_name = str(data.get("memberName") or data.get("member_name") or "").strip()
        member_reg = str(data.get("memberReg") or data.get("member_reg") or "").strip()
        account = str(data.get("account") or "emergency").strip()
        account_label = str(data.get("accountLabel") or data.get("account_label") or account.title()).strip()
        amount = data.get("amount")
        balance_before = data.get("balanceBefore")
        balance_after = data.get("balanceAfter")
        timestamp = data.get("timestamp") or data.get("dateTime") or datetime.now(timezone.utc).isoformat()

        if not member_id or amount in (None, ""):
            return jsonify({"error": "member_id and amount are required"}), 400

        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(
                    """
                    INSERT INTO withdrawal_statements (
                        member_id,
                        member_name,
                        member_reg,
                        account,
                        account_label,
                        amount,
                        balance_before,
                        balance_after,
                        timestamp
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        member_id,
                        member_name,
                        member_reg,
                        account,
                        account_label,
                        amount,
                        balance_before,
                        balance_after,
                        timestamp,
                    ),
                )
                conn.commit()
                return jsonify({
                    "id": cursor.lastrowid,
                    "member_id": member_id,
                    "member_name": member_name,
                    "member_reg": member_reg,
                    "account": account,
                    "account_label": account_label,
                    "amount": amount,
                    "balance_before": balance_before,
                    "balance_after": balance_after,
                    "timestamp": timestamp,
                }), 201
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.delete("/api/withdrawal-statements/reset")
    def reset_withdrawal_statements():
        try:
            with get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM withdrawal_statements")
                conn.commit()
                return jsonify({"success": True, "message": "Withdrawal statement history reset."})
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.get("/")
    def index():
        return app.send_static_file("index.html")

    @app.get("/api/members")
    def list_members():
        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(build_member_select_query(["id", "full_name", "name", "registration_number", "registration_fee", "emergency", "education", "development", "fixed_deposit", "loan_balance", "created_at", "updated_at"]))
                rows = [serialize_row(row) for row in cursor.fetchall()]
                return jsonify(rows)
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/loans")
    def list_loans():
        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(
                    """
                    SELECT
                        id,
                        member_id,
                        amount,
                        interest_rate,
                        issued_on,
                        due_on,
                        status,
                        created_at
                    FROM loans
                    ORDER BY id DESC
                    """
                )
                rows = [serialize_row(row) for row in cursor.fetchall()]
                return jsonify(rows)
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.post("/api/members")
    def create_member():
        data = request.get_json(silent=True) or {}
        full_name = str(data.get("full_name", "") or data.get("name", "")).strip()
        if not full_name:
            return jsonify({"error": "full_name is required"}), 400

        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute("DESCRIBE members")
                describe_rows = cursor.fetchall()
                columns = extract_column_names(describe_rows)
                registration_number = str(data.get("registration_number") or data.get("reg") or "").strip().upper()
                if not registration_number:
                    cursor.execute("SELECT registration_number FROM members")
                    existing_rows = cursor.fetchall()
                    registration_number = generate_registration_number([
                        {"registration_number": row.get("registration_number") if hasattr(row, "get") else row}
                        for row in existing_rows
                    ])

                if "full_name" in columns:
                    target_column = "name" if "name" in columns and column_is_generated(conn, "members", "full_name") else "full_name"
                    insert_columns = [target_column]
                    insert_values = [full_name]

                    if "phone" in columns and data.get("phone") is not None:
                        insert_columns.append("phone")
                        insert_values.append(data.get("phone"))
                    if "email" in columns and data.get("email") is not None:
                        insert_columns.append("email")
                        insert_values.append(data.get("email"))
                    if "role" in columns:
                        insert_columns.append("role")
                        insert_values.append(data.get("role", "member"))
                    if "joined_on" in columns and data.get("joined_on") is not None:
                        insert_columns.append("joined_on")
                        insert_values.append(data.get("joined_on"))
                    if "registration_number" in columns:
                        insert_columns.append("registration_number")
                        insert_values.append(registration_number)
                    if "registration_fee" in columns and data.get("registration_fee") is not None:
                        insert_columns.append("registration_fee")
                        insert_values.append(data.get("registration_fee"))
                    if "emergency" in columns and data.get("emergency") is not None:
                        insert_columns.append("emergency")
                        insert_values.append(data.get("emergency"))
                    if "education" in columns and data.get("education") is not None:
                        insert_columns.append("education")
                        insert_values.append(data.get("education"))
                    if "development" in columns and data.get("development") is not None:
                        insert_columns.append("development")
                        insert_values.append(data.get("development"))
                    if "fixed_deposit" in columns and data.get("fixed_deposit") is not None:
                        insert_columns.append("fixed_deposit")
                        insert_values.append(data.get("fixed_deposit"))
                    if "loan_balance" in columns and data.get("loan_balance") is not None:
                        insert_columns.append("loan_balance")
                        insert_values.append(data.get("loan_balance"))

                    query = f"INSERT INTO members ({', '.join(insert_columns)}) VALUES ({', '.join(['%s'] * len(insert_columns))})"
                    cursor.execute(query, tuple(insert_values))
                else:
                    query, values = build_member_insert_query(
                        ["name", "registration_number", "registration_fee", "emergency", "education", "development", "loan_balance"],
                        {
                            "name": full_name,
                            "registration_number": registration_number,
                            "registration_fee": data.get("registration_fee", 0),
                            "emergency": data.get("emergency", 0),
                            "education": data.get("education", 0),
                            "development": data.get("development", 0),
                            "fixed_deposit": data.get("fixed_deposit", 0),
                            "loan_balance": data.get("loan_balance", 0),
                        },
                    )
                    cursor.execute(query, values)
                conn.commit()
                return jsonify({"id": cursor.lastrowid, "full_name": full_name, "registration_number": registration_number}), 201
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.delete("/api/members/reset")
    def reset_members():
        try:
            with get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM repayments")
                cursor.execute("DELETE FROM loans")
                cursor.execute("DELETE FROM savings")
                cursor.execute("DELETE FROM members")
                conn.commit()
                return jsonify({"success": True, "message": "All members and related data were cleared."})
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    def require_admin_access():
        role = str(request.headers.get("X-User-Role") or request.headers.get("X-Role") or request.args.get("role") or "").strip().lower()
        if role != "chairman" and role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return None

    @app.delete("/api/loans/history/reset")
    def reset_all_loan_history():
        access_error = require_admin_access()
        if access_error is not None:
            return access_error
        try:
            with get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM repayment_statements")
                cursor.execute("DELETE FROM repayments")
                cursor.execute("DELETE FROM loans")
                cursor.execute("UPDATE members SET loan_balance = 0")
                conn.commit()
                return jsonify({"success": True, "message": "All loan history cleared."})
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.delete("/api/loans/history/<int:member_id>/reset")
    def reset_member_loan_history(member_id):
        access_error = require_admin_access()
        if access_error is not None:
            return access_error
        try:
            with get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM repayment_statements WHERE member_id = %s", (member_id,))
                cursor.execute("DELETE FROM repayments WHERE member_id = %s", (member_id,))
                cursor.execute("DELETE FROM loans WHERE member_id = %s", (member_id,))
                cursor.execute("UPDATE members SET loan_balance = 0 WHERE id = %s", (member_id,))
                conn.commit()
                return jsonify({"success": True, "message": "Selected member loan history cleared."})
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.put("/api/members/<int:member_id>")
    def update_member(member_id):
        data = request.get_json(silent=True) or {}
        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute("DESCRIBE members")
                describe_rows = cursor.fetchall()
                columns = extract_column_names(describe_rows)
                updates = []
                values = []

                if "full_name" in columns:
                    target_column = "name" if "name" in columns and column_is_generated(conn, "members", "full_name") else "full_name"
                    if data.get("full_name") is not None:
                        updates.append(f"{target_column} = %s")
                        values.append(str(data.get("full_name")).strip())
                elif "name" in columns and data.get("full_name") is not None:
                    updates.append("name = %s")
                    values.append(str(data.get("full_name")).strip())

                if "registration_number" in columns and data.get("registration_number") is not None:
                    updates.append("registration_number = %s")
                    values.append(data.get("registration_number"))
                if "registration_fee" in columns and data.get("registration_fee") is not None:
                    updates.append("registration_fee = %s")
                    values.append(data.get("registration_fee"))
                if "emergency" in columns and data.get("emergency") is not None:
                    updates.append("emergency = %s")
                    values.append(data.get("emergency"))
                if "education" in columns and data.get("education") is not None:
                    updates.append("education = %s")
                    values.append(data.get("education"))
                if "development" in columns and data.get("development") is not None:
                    updates.append("development = %s")
                    values.append(data.get("development"))
                if "fixed_deposit" in columns and data.get("fixed_deposit") is not None:
                    updates.append("fixed_deposit = %s")
                    values.append(data.get("fixed_deposit"))
                if "loan_balance" in columns and data.get("loan_balance") is not None:
                    updates.append("loan_balance = %s")
                    values.append(data.get("loan_balance"))
                if "phone" in columns and data.get("phone") is not None:
                    updates.append("phone = %s")
                    values.append(data.get("phone"))
                if "email" in columns and data.get("email") is not None:
                    updates.append("email = %s")
                    values.append(data.get("email"))
                if "role" in columns and data.get("role") is not None:
                    updates.append("role = %s")
                    values.append(data.get("role"))

                if not updates:
                    return jsonify({"error": "No valid fields to update"}), 400

                values.append(member_id)
                query = f"UPDATE members SET {', '.join(updates)} WHERE id = %s"
                cursor.execute(query, tuple(values))
                conn.commit()
                return jsonify({"id": member_id, "full_name": data.get("full_name") or data.get("name")}), 200
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/summary")
    def summary():
        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(
                    """
                    SELECT
                        (SELECT COALESCE(SUM(amount), 0) FROM savings) AS total_savings,
                        (SELECT COALESCE(SUM(amount), 0) FROM loans) AS total_loans,
                        (SELECT COUNT(*) FROM members) AS total_members
                    """
                )
                return jsonify(serialize_row(cursor.fetchone()))
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.post("/api/loans")
    def create_loan():
        data = request.get_json(silent=True) or {}
        member_id_raw = data.get("member_id")
        amount = data.get("amount") or data.get("principal")
        interest_rate = data.get("interest_rate", data.get("rate", 10))
        months = int(data.get("months") or 1)
        status = data.get("status", "active")
        if not member_id_raw or not amount:
            return jsonify({"error": "member_id and amount are required"}), 400

        try:
            member_id = int(member_id_raw)
        except (TypeError, ValueError):
            return jsonify({"error": "member_id must be a valid integer"}), 400

        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute("SELECT id FROM members WHERE id = %s", (member_id,))
                member_row = cursor.fetchone()
                if member_row is None:
                    return jsonify({"error": "member not found for loan creation"}), 404

                cursor.execute("DESCRIBE loans")
                loan_columns = extract_column_names(cursor.fetchall())

                principal_value = float(amount)
                rate_value = float(interest_rate)
                interest_value = principal_value * (rate_value / 100.0) * months if months > 0 else 0.0
                total_due_value = principal_value + interest_value

                insert_columns = ["member_id"]
                values = [member_id]
                if "principal" in loan_columns:
                    insert_columns.append("principal")
                    values.append(principal_value)
                if "amount" in loan_columns:
                    insert_columns.append("amount")
                    values.append(principal_value)
                if "months" in loan_columns:
                    insert_columns.append("months")
                    values.append(months)
                if "interest_rate" in loan_columns:
                    insert_columns.append("interest_rate")
                    values.append(rate_value)
                if "interest" in loan_columns:
                    insert_columns.append("interest")
                    values.append(interest_value)
                if "total_due" in loan_columns:
                    insert_columns.append("total_due")
                    values.append(total_due_value)
                if "status" in loan_columns:
                    insert_columns.append("status")
                    values.append(status)

                query = (
                    f"INSERT INTO loans ({', '.join(insert_columns)}) "
                    f"VALUES ({', '.join(['%s'] * len(insert_columns))})"
                )
                cursor.execute(query, tuple(values))
                cursor.execute(
                    "UPDATE members SET loan_balance = COALESCE(loan_balance, 0) + %s WHERE id = %s",
                    (total_due_value, member_id),
                )
                conn.commit()
                return jsonify({"id": cursor.lastrowid}), 201
        except Error as exc:
            if getattr(exc, "errno", None) == 1452:
                return jsonify({"error": "invalid member reference for loan creation"}), 400
            return jsonify({"error": str(exc)}), 500

    @app.post("/api/repayments")
    def create_repayment():
        data = request.get_json(silent=True) or {}
        loan_id = data.get("loan_id")
        member_id = data.get("member_id")
        amount = data.get("amount")
        if amount in (None, ""):
            return jsonify({"error": "amount is required"}), 400

        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                if not loan_id and member_id:
                    cursor.execute(
                        "SELECT id FROM loans WHERE member_id = %s ORDER BY id DESC LIMIT 1",
                        (member_id,),
                    )
                    loan_row = cursor.fetchone()
                    if loan_row is None:
                        return jsonify({"error": "No active loan record is available for this member"}), 404
                    loan_id = loan_row.get("id") if hasattr(loan_row, "get") else loan_row[0]
                if not loan_id:
                    return jsonify({"error": "loan_id and amount are required"}), 400

                if not member_id:
                    cursor.execute("SELECT member_id FROM loans WHERE id = %s", (loan_id,))
                    loan_data = cursor.fetchone()
                    if loan_data:
                        member_id = loan_data.get("member_id") if hasattr(loan_data, "get") else loan_data[0]
                if not member_id:
                    return jsonify({"error": "member_id is required"}), 400

                cursor.execute("DESCRIBE repayments")
                repayment_columns = extract_column_names(cursor.fetchall())

                today_iso = datetime.now(timezone.utc).date().isoformat()
                payment_date = (
                    data.get("paid_on")
                    or data.get("payment_date")
                    or data.get("date")
                )
                payment_datetime = (
                    data.get("payment_datetime")
                    or data.get("paid_at")
                    or data.get("paid_at_datetime")
                    or data.get("repayment_datetime")
                )
                payment_time = data.get("payment_time") or data.get("paid_time") or data.get("time")
                explicit_payment_date = bool(
                    data.get("paid_on")
                    or data.get("payment_date")
                    or data.get("date")
                    or payment_datetime
                )

                if hasattr(payment_date, "isoformat"):
                    payment_date = payment_date.isoformat()
                if payment_date:
                    payment_date = str(payment_date).split("T")[0]
                else:
                    payment_date = today_iso

                if payment_datetime:
                    payment_datetime = str(payment_datetime).replace("T", " ")
                    if " " in payment_datetime:
                        payment_date = payment_datetime.split(" ")[0]
                    if len(payment_datetime.split(" ")[-1].split(":")) == 2:
                        payment_datetime = f"{payment_datetime}:00"
                elif payment_time:
                    payment_datetime = f"{payment_date} {str(payment_time).strip()}"
                    if len(payment_datetime.split(" ")[-1].split(":")) == 2:
                        payment_datetime = f"{payment_datetime}:00"

                payment_datetime = payment_datetime.replace("T", " ") if payment_datetime else None

                insert_columns = ["loan_id", "member_id"]
                placeholder_columns = ["%s", "%s"]
                values = [loan_id, member_id]
                if "amount" in repayment_columns:
                    insert_columns.append("amount")
                    placeholder_columns.append("%s")
                    values.append(amount)
                if "paid_on" in repayment_columns:
                    insert_columns.append("paid_on")
                    if explicit_payment_date:
                        placeholder_columns.append("%s")
                        values.append(payment_date)
                    else:
                        placeholder_columns.append("CURRENT_DATE")
                if "paid_at" in repayment_columns:
                    insert_columns.append("paid_at")
                    placeholder_columns.append("%s")
                    values.append(payment_datetime)
                if "notes" in repayment_columns:
                    insert_columns.append("notes")
                    placeholder_columns.append("%s")
                    values.append(data.get("notes") or "")

                query = (
                    f"INSERT INTO repayments ({', '.join(insert_columns)}) "
                    f"VALUES ({', '.join(placeholder_columns)})"
                )
                cursor.execute(query, tuple(values))

                cursor.execute(
                    "UPDATE members SET loan_balance = GREATEST(COALESCE(loan_balance, 0) - %s, 0) WHERE id = %s",
                    (amount, member_id),
                )

                cursor.execute(
                    "SELECT amount, interest_rate FROM loans WHERE id = %s",
                    (loan_id,),
                )
                loan_record = cursor.fetchone()
                if loan_record:
                    principal_amount = float(loan_record.get("amount") or 0)
                    rate_value = float(loan_record.get("interest_rate") or 0)
                    total_due = principal_amount + (principal_amount * (rate_value / 100.0))
                    cursor.execute(
                        "SELECT COALESCE(SUM(amount), 0) AS total_paid FROM repayments WHERE loan_id = %s",
                        (loan_id,),
                    )
                    repayment_total = cursor.fetchone()
                    total_paid = float(repayment_total.get("total_paid") or 0)
                    update_status = "settled" if total_paid >= total_due else "active"
                    cursor.execute(
                        "UPDATE loans SET status = %s WHERE id = %s",
                        (update_status, loan_id),
                    )

                    cursor.execute(
                        """
                        INSERT INTO repayment_statements (
                            member_id,
                            loan_id,
                            statement_date,
                            principal_amount,
                            interest_rate,
                            total_due,
                            amount_paid,
                            balance_remaining,
                            status,
                            generated_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                        """,
                        (
                            member_id,
                            loan_id,
                            payment_date,
                            principal_amount,
                            rate_value,
                            total_due,
                            total_paid,
                            max(0.0, total_due - total_paid),
                            update_status,
                        ),
                    )

                conn.commit()
                return jsonify({
                    "id": cursor.lastrowid,
                    "member_id": member_id,
                    "loan_id": loan_id,
                    "amount": amount,
                    "paid_on": payment_date,
                    "paid_at": payment_datetime,
                }), 201
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/repayments/history/<int:member_id>")
    def get_repayment_history(member_id):
        """Get repayment history for a specific member"""
        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(
                    """
                    SELECT 
                        r.id,
                        r.loan_id,
                        r.member_id,
                        r.amount,
                        r.paid_on,
                        r.paid_at,
                        r.notes,
                        r.created_at,
                        l.amount as loan_amount,
                        l.interest_rate,
                        m.full_name as member_name
                    FROM repayments r
                    INNER JOIN loans l ON r.loan_id = l.id
                    INNER JOIN members m ON r.member_id = m.id
                    WHERE r.member_id = %s
                    ORDER BY r.paid_on DESC, r.created_at DESC
                    """,
                    (member_id,),
                )
                rows = [serialize_row(row) for row in cursor.fetchall()]
                return jsonify(rows)
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/repayments/loan/<int:loan_id>")
    def get_loan_repayments(loan_id):
        """Get all repayments for a specific loan"""
        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(
                    """
                    SELECT 
                        r.id,
                        r.loan_id,
                        r.member_id,
                        r.amount,
                        r.paid_on,
                        r.notes,
                        r.created_at,
                        m.full_name as member_name
                    FROM repayments r
                    INNER JOIN members m ON r.member_id = m.id
                    WHERE r.loan_id = %s
                    ORDER BY r.paid_on DESC
                    """,
                    (loan_id,),
                )
                rows = [serialize_row(row) for row in cursor.fetchall()]
                return jsonify(rows)
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/repayment-statement/<int:loan_id>")
    def get_repayment_statement(loan_id):
        """Generate repayment statement for a specific loan"""
        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(
                    """
                    SELECT 
                        l.id,
                        l.member_id,
                        l.amount,
                        l.interest_rate,
                        l.issued_on,
                        l.due_on,
                        l.status,
                        m.full_name as member_name,
                        m.phone,
                        m.email,
                        m.registration_number
                    FROM loans l
                    INNER JOIN members m ON l.member_id = m.id
                    WHERE l.id = %s
                    """,
                    (loan_id,),
                )
                loan = cursor.fetchone()
                if not loan:
                    return jsonify({"error": "Loan not found"}), 404

                cursor.execute(
                    """
                    SELECT 
                        id,
                        amount,
                        paid_on,
                        paid_at,
                        notes
                    FROM repayments
                    WHERE loan_id = %s
                    ORDER BY paid_on ASC, created_at ASC
                    """,
                    (loan_id,),
                )
                repayment_rows = cursor.fetchall()
                repayments = [serialize_row(row) for row in repayment_rows]

                total_principal = float(loan["amount"])
                interest_rate = float(loan["interest_rate"])
                total_interest = total_principal * interest_rate / 100
                total_due = total_principal + total_interest
                total_paid = sum(float(r["amount"]) for r in repayments)
                balance = max(0, total_due - total_paid)

                running_paid = 0.0
                payment_history = []
                for repayment in repayments:
                    running_paid += float(repayment.get("amount") or 0)
                    payment_history.append({
                        "id": repayment.get("id"),
                        "amount": round(float(repayment.get("amount") or 0), 2),
                        "paid_on": repayment.get("paid_on"),
                        "paid_at": repayment.get("paid_at"),
                        "notes": repayment.get("notes") or "",
                        "balance_after_payment": round(max(0.0, total_due - running_paid), 2),
                    })

                statement = {
                    "loan_id": loan_id,
                    "member_name": loan["member_name"],
                    "member_phone": loan["phone"],
                    "member_email": loan["email"],
                    "registration_number": loan["registration_number"],
                    "loan_issued_date": loan["issued_on"],
                    "loan_due_date": loan["due_on"],
                    "loan_status": loan["status"],
                    "principal_amount": total_principal,
                    "interest_rate": interest_rate,
                    "interest_amount": round(total_interest, 2),
                    "total_due": round(total_due, 2),
                    "total_paid": round(total_paid, 2),
                    "balance_remaining": round(balance, 2),
                    "repayment_history": payment_history,
                    "generated_date": datetime.now(timezone.utc).isoformat(),
                }
                return jsonify(statement)
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/repayment-statements/member/<int:member_id>")
    def get_member_repayment_statements(member_id):
        """Get all repayment statements for a member"""
        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(
                    """
                    SELECT l.id FROM loans l WHERE l.member_id = %s ORDER BY l.id DESC
                    """,
                    (member_id,),
                )
                loans = cursor.fetchall()

                statements = []
                for loan_row in loans:
                    loan_id = loan_row["id"]
                    cursor.execute(
                        """
                        SELECT 
                            l.id,
                            l.member_id,
                            l.amount,
                            l.interest_rate,
                            l.issued_on,
                            l.due_on,
                            l.status,
                            m.full_name as member_name
                        FROM loans l
                        INNER JOIN members m ON l.member_id = m.id
                        WHERE l.id = %s
                        """,
                        (loan_id,),
                    )
                    loan = cursor.fetchone()

                    cursor.execute(
                        """
                        SELECT id, amount, paid_on, paid_at, notes, created_at
                        FROM repayments
                        WHERE loan_id = %s
                        ORDER BY paid_on ASC, created_at ASC
                        """,
                        (loan_id,),
                    )
                    repayment_rows = cursor.fetchall()

                    total_paid = sum(float(row["amount"] or 0) for row in repayment_rows)
                    total_principal = float(loan["amount"])
                    interest_rate = float(loan["interest_rate"])
                    total_interest = total_principal * interest_rate / 100
                    total_due = total_principal + total_interest
                    balance = max(0, total_due - total_paid)

                    running_paid = 0.0
                    repayment_history = []
                    for row in repayment_rows:
                        running_paid += float(row["amount"] or 0)
                        repayment_history.append({
                            "id": row["id"],
                            "amount": round(float(row["amount"] or 0), 2),
                            "paid_on": row["paid_on"],
                            "paid_at": row["paid_at"],
                            "notes": row["notes"] or "",
                            "balance_after_payment": round(max(0.0, total_due - running_paid), 2),
                        })

                    statements.append({
                        "loan_id": loan_id,
                        "member_name": loan["member_name"],
                        "loan_issued_date": loan["issued_on"],
                        "loan_status": loan["status"],
                        "principal_amount": total_principal,
                        "interest_rate": interest_rate,
                        "total_due": round(total_due, 2),
                        "total_paid": round(total_paid, 2),
                        "balance_remaining": round(balance, 2),
                        "repayment_history": repayment_history,
                    })

                return jsonify(statements)
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/savings/history")
    def list_savings_history():
        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute("DESCRIBE members")
                member_columns = extract_column_names(cursor.fetchall())
                member_name_column = "full_name" if "full_name" in member_columns else "name" if "name" in member_columns else "full_name"
                cursor.execute(
                    f"""
                    SELECT s.id, s.member_id, s.amount, s.saved_on, s.notes, m.{member_name_column} AS member_name
                    FROM savings s
                    INNER JOIN members m ON m.id = s.member_id
                    ORDER BY s.saved_on DESC, s.id DESC
                    """
                )
                rows = cursor.fetchall()
                member_ids_with_history = {row.get("member_id") for row in rows if row and row.get("member_id") is not None}

                cursor.execute(
                    f"""
                    SELECT
                        m.id,
                        m.{member_name_column} AS member_name,
                        COALESCE(m.emergency, 0)
                        + COALESCE(m.education, 0)
                        + COALESCE(m.development, 0)
                        + COALESCE(m.fixed_deposit, 0) AS balance
                    FROM members m
                    WHERE COALESCE(m.emergency, 0)
                        + COALESCE(m.education, 0)
                        + COALESCE(m.development, 0)
                        + COALESCE(m.fixed_deposit, 0) > 0
                    """
                )
                balance_rows = cursor.fetchall()
                missing_balance_rows = [
                    row for row in balance_rows
                    if row and row.get("id") not in member_ids_with_history
                ]
                rows = list(rows) + build_member_balance_snapshot_rows(missing_balance_rows)

                return jsonify(build_savings_history_payload(rows))
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/savings/rankings")
    def list_savings_rankings():
        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute("DESCRIBE members")
                member_columns = extract_column_names(cursor.fetchall())
                member_name_column = "full_name" if "full_name" in member_columns else "name" if "name" in member_columns else "full_name"

                ranking_queries = {
                    "week": f"""
                        SELECT
                            m.id AS member_id,
                            m.{member_name_column} AS member_name,
                            COUNT(s.id) AS savings_count,
                            COALESCE(SUM(s.amount), 0) AS qualifying_amount
                        FROM members m
                        INNER JOIN savings s ON s.member_id = m.id
                        WHERE s.amount >= 100
                          AND s.saved_on BETWEEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
                                              AND DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY)
                        GROUP BY m.id, m.{member_name_column}
                        ORDER BY savings_count DESC, qualifying_amount DESC, member_name ASC
                    """,
                    "month": f"""
                        SELECT
                            m.id AS member_id,
                            m.{member_name_column} AS member_name,
                            COUNT(s.id) AS savings_count,
                            COALESCE(SUM(s.amount), 0) AS qualifying_amount
                        FROM members m
                        INNER JOIN savings s ON s.member_id = m.id
                        WHERE s.amount >= 100
                          AND YEAR(s.saved_on) = YEAR(CURDATE())
                          AND MONTH(s.saved_on) = MONTH(CURDATE())
                        GROUP BY m.id, m.{member_name_column}
                        ORDER BY savings_count DESC, qualifying_amount DESC, member_name ASC
                    """,
                    "year": f"""
                        SELECT
                            m.id AS member_id,
                            m.{member_name_column} AS member_name,
                            COUNT(s.id) AS savings_count,
                            COALESCE(SUM(s.amount), 0) AS qualifying_amount
                        FROM members m
                        INNER JOIN savings s ON s.member_id = m.id
                        WHERE s.amount >= 100
                          AND YEAR(s.saved_on) = YEAR(CURDATE())
                        GROUP BY m.id, m.{member_name_column}
                        ORDER BY savings_count DESC, qualifying_amount DESC, member_name ASC
                    """,
                }

                rankings = {}
                for period_name, query in ranking_queries.items():
                    cursor.execute(query)
                    rows = cursor.fetchall()
                    rankings[period_name] = build_frequency_ranking_payload(rows)

                return jsonify(rankings)
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.delete("/api/savings/history/reset")
    def reset_savings_history():
        access_error = require_admin_access()
        if access_error is not None:
            return access_error
        try:
            with get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE members SET emergency = 0, education = 0, development = 0, fixed_deposit = 0")
                cursor.execute("DELETE FROM savings")
                conn.commit()
                return jsonify({"success": True, "message": "Savings history dashboard reset for all members."})
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.delete("/api/savings/history/<int:member_id>/reset")
    def reset_member_savings_history(member_id):
        access_error = require_admin_access()
        if access_error is not None:
            return access_error
        try:
            with get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE members
                    SET emergency = 0,
                        education = 0,
                        development = 0,
                        fixed_deposit = 0
                    WHERE id = %s
                    """,
                    (member_id,),
                )
                cursor.execute("DELETE FROM savings WHERE member_id = %s", (member_id,))
                conn.commit()
                return jsonify({"success": True, "message": "Savings history reset for selected member."})
        except Error as exc:
            return jsonify({"error": str(exc)}), 500

    @app.post("/api/savings")
    def create_savings_entry():
        data = request.get_json(silent=True) or {}
        member_id_raw = data.get("member_id")
        amount = data.get("amount")
        if amount is None:
            amount = (
                (data.get("emergency") or 0)
                + (data.get("education") or 0)
                + (data.get("development") or 0)
            )
        notes = data.get("notes", "")
        if not member_id_raw or amount in (None, ""):
            return jsonify({"error": "member_id and amount are required"}), 400

        try:
            member_id = int(member_id_raw)
        except (TypeError, ValueError):
            return jsonify({"error": "member_id must be a valid integer"}), 400

        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute("SELECT id FROM members WHERE id = %s", (member_id,))
                member_row = cursor.fetchone()
                if member_row is None:
                    return jsonify({"error": "member not found for savings entry"}), 404

                cursor.execute("DESCRIBE members")
                describe_rows = cursor.fetchall()
                member_columns = extract_column_names(describe_rows)
                if {"emergency", "education", "development"}.issubset(member_columns):
                    cursor.execute(
                        """
                        UPDATE members
                        SET emergency = COALESCE(emergency, 0) + %s,
                            education = COALESCE(education, 0) + %s,
                            development = COALESCE(development, 0) + %s,
                            fixed_deposit = COALESCE(fixed_deposit, 0) + %s
                        WHERE id = %s
                        """,
                        (
                            data.get("emergency") or 0,
                            data.get("education") or 0,
                            data.get("development") or 0,
                            data.get("fixed_deposit") or 0,
                            member_id,
                        ),
                    )
                cursor.execute(
                    """
                    INSERT INTO savings (member_id, amount, saved_on, notes)
                    VALUES (%s, %s, CURRENT_DATE, %s)
                    """,
                    (member_id, amount, notes),
                )
                conn.commit()
                return jsonify({"id": cursor.lastrowid, "member_id": member_id, "amount": amount}), 201
        except Error as exc:
            if getattr(exc, "errno", None) == 1452:
                return jsonify({"error": "invalid member reference for savings entry"}), 400
            return jsonify({"error": str(exc)}), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=False)
