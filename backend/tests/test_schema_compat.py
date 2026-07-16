import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from mysql.connector import Error

from app import build_member_insert_query, build_member_select_query, build_mysql_config, create_app, generate_registration_number


class MemberSchemaCompatibilityTests(unittest.TestCase):
    def test_build_member_select_query_uses_name_for_legacy_schema(self):
        query = build_member_select_query({"id", "name", "registration_number"})
        self.assertIn("name AS full_name", query)
        self.assertIn("FROM members", query)

    def test_build_member_select_query_uses_full_name_for_current_schema(self):
        query = build_member_select_query({"id", "full_name", "name", "registration_number"})
        self.assertIn("full_name", query)
        self.assertNotIn("name AS full_name", query)

    def test_build_member_insert_query_uses_name_for_legacy_schema(self):
        query, values = build_member_insert_query(
            {"id", "name", "registration_number"},
            {"full_name": "Jane Doe"},
        )
        self.assertIn("INSERT INTO members", query)
        self.assertIn("name", query)
        self.assertIn("registration_number", query)
        self.assertEqual(values[0], "Jane Doe")

    def test_generate_registration_number_follows_kkshg_sequence(self):
        self.assertEqual(generate_registration_number([]), "KKSHG1")
        self.assertEqual(generate_registration_number([{"reg": "KKSHG1"}, {"reg": "KKSHG2"}]), "KKSHG3")

    def test_build_mysql_config_parses_railway_mysql_url(self):
        with patch.dict(os.environ, {"MYSQL_URL": "mysql://root:secret@mysql.railway.internal:3306/kalaptan_dp"}, clear=False):
            config = build_mysql_config()
        self.assertEqual(config["host"], "mysql.railway.internal")
        self.assertEqual(config["port"], 3306)
        self.assertEqual(config["user"], "root")
        self.assertEqual(config["password"], "secret")
        self.assertEqual(config["database"], "kalaptan_dp")

    def test_get_mysql_connection_returns_tuple_shape_on_failure(self):
        with patch("app.mysql.connector.connect", side_effect=Error("boom")):
            conn, error = __import__("app")._get_mysql_connection()
        self.assertIsNone(conn)
        self.assertEqual(error, "boom")

    def test_create_member_inserts_into_name_when_full_name_is_generated(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append((query, params))
                if kwargs.get("multi"):
                    return iter(())
                return None

            def fetchone(self):
                if self.executed_queries and self.executed_queries[-1][0] == "DESCRIBE members":
                    return {"Field": "id"}
                if self.executed_queries and "information_schema.columns" in self.executed_queries[-1][0]:
                    return {"GENERATION_EXPRESSION": "name"}
                return None

            def fetchall(self):
                if self.executed_queries and self.executed_queries[-1][0] == "DESCRIBE members":
                    return [{"Field": "id"}, {"Field": "name"}, {"Field": "full_name"}]
                return []

            @property
            def lastrowid(self):
                return 100

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            app = create_app()
            client = app.test_client()
            response = client.post(
                "/api/members",
                json={"full_name": "Jane Doe"},
            )

        self.assertEqual(response.status_code, 201)
        insert_query = next(
            query
            for query, params in fake_conn.cursor_obj.executed_queries
            if query.startswith("INSERT INTO members") and params is not None
        )
        self.assertIn("name", insert_query)
        self.assertNotIn("full_name", insert_query)

    def test_update_member_updates_existing_record(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append((query, params))
                if kwargs.get("multi"):
                    return iter(())
                return None

            def fetchone(self):
                return None

            def fetchall(self):
                if self.executed_queries and self.executed_queries[-1][0] == "DESCRIBE members":
                    return [{"Field": "id"}, {"Field": "full_name"}, {"Field": "registration_number"}]
                return []

            @property
            def lastrowid(self):
                return 7

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            app = create_app()
            client = app.test_client()
            response = client.put(
                "/api/members/7",
                json={"full_name": "Updated Name", "registration_number": "KKSHG777"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["full_name"], "Updated Name")

    def test_init_db_adds_registration_columns_for_existing_members_table(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append(query)
                return None

            def fetchall(self):
                if self.executed_queries and self.executed_queries[-1] == "SHOW TABLES":
                    return [("members",)]
                if self.executed_queries and self.executed_queries[-1] == "DESCRIBE members":
                    return [{"Field": "id"}, {"Field": "full_name"}]
                return []

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            create_app()

        executed_queries = fake_conn.cursor_obj.executed_queries
        self.assertTrue(any("ALTER TABLE members ADD COLUMN registration_number" in query for query in executed_queries))
        self.assertTrue(any("ALTER TABLE members ADD COLUMN registration_fee" in query for query in executed_queries))
        self.assertTrue(any("ALTER TABLE members ADD COLUMN emergency" in query for query in executed_queries))

    def test_init_db_widens_legacy_status_columns_to_allow_settled_state(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append(query)
                return None

            def fetchall(self):
                if self.executed_queries and self.executed_queries[-1] == "SHOW TABLES":
                    return [("members",), ("loans",), ("repayment_statements",)]
                if self.executed_queries and self.executed_queries[-1] == "DESCRIBE loans":
                    return [{"Field": "id"}, {"Field": "member_id"}, {"Field": "status"}]
                if self.executed_queries and self.executed_queries[-1] == "DESCRIBE repayment_statements":
                    return [{"Field": "id"}, {"Field": "member_id"}, {"Field": "status"}]
                return []

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            create_app()

        executed_queries = fake_conn.cursor_obj.executed_queries
        self.assertTrue(any("ALTER TABLE loans MODIFY status VARCHAR(20)" in query for query in executed_queries))
        self.assertTrue(any("ALTER TABLE repayment_statements MODIFY status VARCHAR(20)" in query for query in executed_queries))

    def test_savings_history_endpoint_returns_period_totals(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append((query, params))
                return None

            def fetchall(self):
                if self.executed_queries and self.executed_queries[-1][0] == "SHOW TABLES":
                    return [("members",)]
                if self.executed_queries and "DESCRIBE members" in self.executed_queries[-1][0]:
                    return [{"Field": "id"}, {"Field": "full_name"}]
                if self.executed_queries and "FROM savings" in self.executed_queries[-1][0]:
                    return [
                        {"id": 1, "member_id": 1, "member_name": "Jane Doe", "saved_on": "2026-07-12", "amount": 200.0},
                        {"id": 2, "member_id": 1, "member_name": "Jane Doe", "saved_on": "2026-06-12", "amount": 400.0},
                    ]
                return []

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            app = create_app()
            client = app.test_client()
            response = client.get("/api/savings/history")

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertIn("daily", payload)
        self.assertIn("weekly", payload)
        self.assertIn("monthly", payload)
        self.assertIn("annual", payload)

    def test_savings_history_reset_endpoint_clears_saved_history(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append(query)
                return None

            def fetchall(self):
                if self.executed_queries and self.executed_queries[-1] == "SHOW TABLES":
                    return [("members",)]
                return []

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            app = create_app()
            client = app.test_client()
            response = client.delete("/api/savings/history/reset")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()["success"])

    def test_savings_creation_rejects_missing_member_reference(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append((query, params))
                return None

            def fetchone(self):
                last_query = self.executed_queries[-1][0] if self.executed_queries else ""
                if last_query == "SELECT id FROM members WHERE id = %s":
                    return None
                return None

            def fetchall(self):
                last_query = self.executed_queries[-1][0] if self.executed_queries else ""
                if last_query == "DESCRIBE members":
                    return [{"Field": "id"}, {"Field": "full_name"}, {"Field": "emergency"}, {"Field": "education"}, {"Field": "development"}, {"Field": "fixed_deposit"}]
                return []

            @property
            def lastrowid(self):
                return 10

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            app = create_app()
            client = app.test_client()
            response = client.post(
                "/api/savings",
                json={"member_id": 999, "amount": 100},
            )

        self.assertEqual(response.status_code, 404)
        self.assertIn("member not found", response.get_json()["error"].lower())

    def test_loan_creation_rejects_missing_member_reference(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append((query, params))
                return None

            def fetchone(self):
                last_query = self.executed_queries[-1][0] if self.executed_queries else ""
                if last_query == "SELECT id FROM members WHERE id = %s":
                    return None
                return None

            def fetchall(self):
                last_query = self.executed_queries[-1][0] if self.executed_queries else ""
                if last_query == "DESCRIBE loans":
                    return [{"Field": "id"}, {"Field": "member_id"}, {"Field": "amount"}, {"Field": "status"}]
                return []

            @property
            def lastrowid(self):
                return 20

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            app = create_app()
            client = app.test_client()
            response = client.post(
                "/api/loans",
                json={"member_id": 999, "amount": 1000, "interest_rate": 10},
            )

        self.assertEqual(response.status_code, 404)
        self.assertIn("member not found", response.get_json()["error"].lower())

    def test_loan_history_reset_endpoint_clears_saved_history(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append(query)
                return None

            def fetchall(self):
                if self.executed_queries and self.executed_queries[-1] == "SHOW TABLES":
                    return [("members",)]
                return []

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            app = create_app()
            client = app.test_client()
            response_all = client.delete("/api/loans/history/reset")
            response_member = client.delete("/api/loans/history/7/reset")

        self.assertEqual(response_all.status_code, 200)
        self.assertTrue(response_all.get_json()["success"])
        self.assertEqual(response_member.status_code, 200)
        self.assertTrue(response_member.get_json()["success"])

    def test_savings_rankings_endpoint_returns_frequency_winners(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append((query, params))
                return None

            def fetchall(self):
                if self.executed_queries and self.executed_queries[-1][0] == "SHOW TABLES":
                    return [("members",)]
                if self.executed_queries and "DESCRIBE members" in self.executed_queries[-1][0]:
                    return [{"Field": "id"}, {"Field": "full_name"}]
                if self.executed_queries and "COUNT(s.id)" in self.executed_queries[-1][0]:
                    return [
                        {"member_id": 1, "member_name": "Jane Doe", "savings_count": 4},
                        {"member_id": 2, "member_name": "John Doe", "savings_count": 2},
                    ]
                return []

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            app = create_app()
            client = app.test_client()
            response = client.get("/api/savings/rankings")

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertIn("week", payload)
        self.assertIn("month", payload)
        self.assertIn("year", payload)
        self.assertEqual(payload["week"][0]["memberName"], "Jane Doe")

    def test_repayment_creation_records_custom_payment_datetime_and_updates_status(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []
                self._lastrowid = 22

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append((query, params))
                if kwargs.get("multi"):
                    return iter(())
                return None

            def fetchone(self):
                last_query = self.executed_queries[-1][0] if self.executed_queries else ""
                if last_query == "SELECT member_id FROM loans WHERE id = %s":
                    return {"member_id": 5}
                if last_query == "DESCRIBE repayments":
                    return {"Field": "loan_id"}
                if last_query == "SELECT amount, interest_rate FROM loans WHERE id = %s":
                    return {"amount": "5000.00", "interest_rate": "10.00"}
                if last_query == "SELECT COALESCE(SUM(amount), 0) AS total_paid FROM repayments WHERE loan_id = %s":
                    return {"total_paid": "1500.00"}
                return None

            def fetchall(self):
                last_query = self.executed_queries[-1][0] if self.executed_queries else ""
                if last_query == "SHOW TABLES":
                    return [("members",), ("loans",), ("repayments",)]
                if "DESCRIBE members" in last_query:
                    return [{"Field": "id"}, {"Field": "full_name"}, {"Field": "name"}]
                if last_query == "DESCRIBE repayments":
                    return [{"Field": "id"}, {"Field": "loan_id"}, {"Field": "member_id"}, {"Field": "amount"}, {"Field": "paid_on"}, {"Field": "paid_at"}, {"Field": "notes"}]
                return []

            @property
            def lastrowid(self):
                return self._lastrowid

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            app = create_app()
            client = app.test_client()
            response = client.post(
                "/api/repayments",
                json={
                    "loan_id": 12,
                    "member_id": 5,
                    "amount": 1500,
                    "paid_on": "2026-07-12",
                    "payment_time": "14:45",
                    "notes": "Secretary approved payment"
                },
            )

        self.assertEqual(response.status_code, 201)
        payload = response.get_json()
        self.assertEqual(payload["paid_on"], "2026-07-12")
        self.assertEqual(payload["paid_at"], "2026-07-12 14:45:00")

    def test_create_app_bootstraps_missing_loan_related_tables_when_members_exist(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append((query, params))
                if kwargs.get("multi"):
                    return iter(())
                return None

            def fetchone(self):
                return None

            def fetchall(self):
                if self.executed_queries and self.executed_queries[-1][0] == "SHOW TABLES":
                    return [("members",)]
                if self.executed_queries and "DESCRIBE members" in self.executed_queries[-1][0]:
                    return [{"Field": "id"}, {"Field": "full_name"}, {"Field": "name"}]
                return []

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            app = create_app()
            client = app.test_client()
            response = client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(any("CREATE TABLE IF NOT EXISTS loans" in query for query, _ in fake_conn.cursor_obj.executed_queries))
        self.assertTrue(any("CREATE TABLE IF NOT EXISTS repayments" in query for query, _ in fake_conn.cursor_obj.executed_queries))

    def test_create_app_repairs_legacy_loan_defaults_for_existing_tables(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append((query, params))
                if kwargs.get("multi"):
                    return iter(())
                return None

            def fetchone(self):
                return None

            def fetchall(self):
                if self.executed_queries and self.executed_queries[-1][0] == "SHOW TABLES":
                    return [("members",), ("loans",), ("repayments",)]
                if self.executed_queries and self.executed_queries[-1][0] == "DESCRIBE loans":
                    return [
                        {"Field": "id"},
                        {"Field": "member_id"},
                        {"Field": "principal"},
                        {"Field": "months"},
                        {"Field": "interest"},
                        {"Field": "total_due"},
                    ]
                if self.executed_queries and self.executed_queries[-1][0] == "DESCRIBE repayments":
                    return [{"Field": "id"}, {"Field": "loan_id"}, {"Field": "amount"}, {"Field": "paid_on"}]
                if self.executed_queries and self.executed_queries[-1][0] == "DESCRIBE members":
                    return [{"Field": "id"}, {"Field": "name"}, {"Field": "full_name"}]
                return []

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            app = create_app()
            client = app.test_client()
            response = client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(any("ALTER TABLE loans MODIFY principal" in query for query, _ in fake_conn.cursor_obj.executed_queries))
        self.assertTrue(any("ALTER TABLE loans MODIFY interest" in query for query, _ in fake_conn.cursor_obj.executed_queries))
        self.assertTrue(any("ALTER TABLE loans MODIFY total_due" in query for query, _ in fake_conn.cursor_obj.executed_queries))

    def test_create_repayment_uses_current_date_sql_literal(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append((query, params))
                if kwargs.get("multi"):
                    return iter(())
                return None

            def fetchone(self):
                last_query = self.executed_queries[-1][0] if self.executed_queries else ""
                if last_query == "SELECT member_id FROM loans WHERE id = %s":
                    return {"member_id": 7}
                if last_query == "SELECT amount, interest_rate FROM loans WHERE id = %s":
                    return {"amount": "5000.00", "interest_rate": "10.00"}
                if last_query == "SELECT COALESCE(SUM(amount), 0) AS total_paid FROM repayments WHERE loan_id = %s":
                    return {"total_paid": "0.00"}
                return None

            def fetchall(self):
                last_query = self.executed_queries[-1][0] if self.executed_queries else ""
                if last_query == "DESCRIBE repayments":
                    return [{"Field": "id"}, {"Field": "loan_id"}, {"Field": "amount"}, {"Field": "paid_on"}]
                return []

            @property
            def lastrowid(self):
                return 42

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            app = create_app()
            client = app.test_client()
            response = client.post(
                "/api/repayments",
                json={"loan_id": 7, "amount": 500},
            )

        self.assertEqual(response.status_code, 201)
        insert_query = next(
            query
            for query, params in fake_conn.cursor_obj.executed_queries
            if query.startswith("INSERT INTO repayments")
        )
        self.assertIn("CURRENT_DATE", insert_query)
        self.assertNotIn("'CURRENT_DATE'", insert_query)

    def test_api_not_found_returns_json_error(self):
        app = create_app()
        client = app.test_client()

        response = client.get("/api/not-found")

        self.assertEqual(response.status_code, 404)
        self.assertTrue(response.is_json)
        self.assertIn("error", response.get_json())

    def test_create_member_handles_dictionary_describe_rows(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append((query, params))
                return [] if kwargs.get("multi") else None

            def fetchall(self):
                if self.executed_queries and "DESCRIBE members" in self.executed_queries[-1][0]:
                    return [{"Field": "id"}, {"Field": "full_name"}]
                return []

            @property
            def lastrowid(self):
                return 99

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            app = create_app()
            client = app.test_client()
            response = client.post(
                "/api/members",
                json={"full_name": "Jane Doe", "registration_number": "KKSHG100"},
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["full_name"], "Jane Doe")

    def test_create_app_bootstraps_form_library_and_withdrawal_statement_tables(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append((query, params))
                return None

            def fetchall(self):
                if self.executed_queries and self.executed_queries[-1][0] == "SHOW TABLES":
                    return [("members",)]
                return []

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            app = create_app()
            client = app.test_client()
            response = client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(any("CREATE TABLE IF NOT EXISTS uploaded_forms" in query for query, _ in fake_conn.cursor_obj.executed_queries))
        self.assertTrue(any("CREATE TABLE IF NOT EXISTS withdrawal_statements" in query for query, _ in fake_conn.cursor_obj.executed_queries))

    def test_forms_and_withdrawal_statement_endpoints_are_exposed(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []
                self.row_map = {
                    "SELECT id, name, file_name, size_label, data_url, created_at FROM uploaded_forms ORDER BY created_at DESC, id DESC": [
                        {
                            "id": 1,
                            "name": "Member Registration Form",
                            "file_name": "member-registration.pdf",
                            "size_label": "1 KB",
                            "data_url": "data:application/pdf;base64,AAA",
                            "created_at": "2026-07-13 08:00:00",
                        }
                    ],
                    "SELECT id, member_id, member_name, member_reg, account, account_label, amount, balance_before, balance_after, timestamp FROM withdrawal_statements ORDER BY timestamp DESC, id DESC": [
                        {
                            "id": 1,
                            "member_id": 5,
                            "member_name": "Jane Doe",
                            "member_reg": "KKSHG5",
                            "account": "emergency",
                            "account_label": "Emergency Fund",
                            "amount": 250.0,
                            "balance_before": 400.0,
                            "balance_after": 150.0,
                            "timestamp": "2026-07-13T08:00:00",
                        }
                    ],
                }

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append((query, params))
                if kwargs.get("multi"):
                    return iter(())
                return None

            def fetchone(self):
                return None

            def fetchall(self):
                if self.executed_queries and self.executed_queries[-1][0] == "SHOW TABLES":
                    return [("members",)]
                if self.executed_queries and "DESCRIBE members" in self.executed_queries[-1][0]:
                    return [{"Field": "id"}, {"Field": "full_name"}]
                normalized_query = self.executed_queries[-1][0].strip().replace("\n", " ").replace("\t", " ")
                if self.executed_queries and "uploaded_forms" in normalized_query:
                    return self.row_map[
                        "SELECT id, name, file_name, size_label, data_url, created_at FROM uploaded_forms ORDER BY created_at DESC, id DESC"
                    ]
                if self.executed_queries and "withdrawal_statements" in normalized_query:
                    return self.row_map[
                        "SELECT id, member_id, member_name, member_reg, account, account_label, amount, balance_before, balance_after, timestamp FROM withdrawal_statements ORDER BY timestamp DESC, id DESC"
                    ]
                return []

            @property
            def lastrowid(self):
                return 11

            def close(self):
                return None

        class FakeConnection:
            def __init__(self):
                self.cursor_obj = FakeCursor()

            def cursor(self, dictionary=False):
                return self.cursor_obj

            def commit(self):
                return None

            def rollback(self):
                return None

            def close(self):
                return None

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        fake_conn = FakeConnection()
        with patch("app.mysql.connector.connect", return_value=fake_conn):
            app = create_app()
            client = app.test_client()
            forms_response = client.get("/api/forms")
            withdrawal_response = client.get("/api/withdrawal-statements")

        self.assertEqual(forms_response.status_code, 200)
        self.assertEqual(withdrawal_response.status_code, 200)
        self.assertEqual(forms_response.get_json()[0]["name"], "Member Registration Form")
        self.assertEqual(withdrawal_response.get_json()[0]["member_name"], "Jane Doe")


if __name__ == "__main__":
    unittest.main()
