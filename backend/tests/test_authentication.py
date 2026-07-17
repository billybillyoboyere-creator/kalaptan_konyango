import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app, generate_password_hash


class AuthenticationTests(unittest.TestCase):
    def test_delete_loan_history_requires_admin_role(self):
        app = create_app()
        client = app.test_client()
        token_response = client.get("/api/csrf-token")
        self.assertEqual(token_response.status_code, 200)
        csrf_token = token_response.get_json()["csrfToken"]

        response = client.delete(
            "/api/loans/history/reset",
            headers={"X-User-Role": "Secretary", "X-CSRF-Token": csrf_token},
        )

        self.assertEqual(response.status_code, 403)
        self.assertIn("Admin access required", response.get_json()["error"])

    def test_mutating_requests_require_csrf_token(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append((query, params))

            def fetchone(self):
                if self.executed_queries and self.executed_queries[-1][0].startswith("SELECT id, username, password_hash, role FROM auth_users"):
                    return {
                        "id": 1,
                        "username": "chairman",
                        "password_hash": generate_password_hash("34717215"),
                        "role": "Chairman",
                    }
                return None

            def fetchall(self):
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
        with patch("app._get_mysql_connection", return_value=(fake_conn, None)):
            app = create_app()
            client = app.test_client()
            token_response = client.get("/api/csrf-token")
            self.assertEqual(token_response.status_code, 200)
            csrf_token = token_response.get_json()["csrfToken"]
            self.assertTrue(csrf_token)

            no_token_response = client.post(
                "/api/login",
                json={"username": "chairman", "password": "34717215"},
            )
            self.assertEqual(no_token_response.status_code, 403)

            token_response = client.post(
                "/api/login",
                json={"username": "chairman", "password": "34717215"},
                headers={"X-CSRF-Token": csrf_token},
            )
            self.assertEqual(token_response.status_code, 200)
            self.assertEqual(token_response.get_json()["user"], "chairman")

    def test_login_authenticates_against_database_record(self):
        class FakeCursor:
            def __init__(self):
                self.executed_queries = []

            def execute(self, query, params=None, **kwargs):
                self.executed_queries.append((query, params))

            def fetchone(self):
                if self.executed_queries and self.executed_queries[-1][0].startswith("SELECT id, username, password_hash, role FROM auth_users"):
                    return {
                        "id": 1,
                        "username": "chairman",
                        "password_hash": generate_password_hash("34717215"),
                        "role": "Chairman",
                    }
                return None

            def fetchall(self):
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
        with patch("app._get_mysql_connection", return_value=(fake_conn, None)):
            app = create_app()
            client = app.test_client()
            token_response = client.get("/api/csrf-token")
            self.assertEqual(token_response.status_code, 200)
            csrf_token = token_response.get_json()["csrfToken"]
            response = client.post(
                "/api/login",
                json={"username": "chairman", "password": "34717215"},
                headers={"X-CSRF-Token": csrf_token},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["role"], "Chairman")
        self.assertEqual(response.get_json()["user"], "chairman")


if __name__ == "__main__":
    unittest.main()
