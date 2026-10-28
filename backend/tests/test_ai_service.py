import json
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from config.settings import settings
from models.alert import AlertRequest
from services.ai_service import AIServiceError
from services.risk_service import analyze_alert
from fastapi.testclient import TestClient
from main import app


class AnalyzeAlertTests(unittest.TestCase):
    def test_uses_rule_based_analysis_without_api_key(self):
        with patch.object(settings, "openai_api_key", None):
            result = analyze_alert(AlertRequest(message="hello", source="SMS"))

        self.assertEqual(result.risk_level, "low")
        self.assertEqual(result.source, "SMS")

    def test_uses_openai_and_normalizes_result(self):
        response_content = json.dumps(
            {
                "is_suspicious": False,
                "risk_score": 82,
                "risk_level": "low",
                "summary": "Potential scam.",
                "indicators": ["Requests a payment"],
                "recommendations": ["Verify independently."],
                "source": "untrusted model value",
            }
        )
        response = SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content=response_content))]
        )
        client = MagicMock()
        client.__enter__.return_value = client
        client.chat.completions.create.return_value = response
        alert = AlertRequest(message="Pay a registration fee", source="SMS")

        with (
            patch.object(settings, "openai_api_key", "test-key"),
            patch("services.ai_service.OpenAI", return_value=client),
        ):
            result = analyze_alert(alert)

        self.assertEqual(result.risk_level, "critical")
        self.assertTrue(result.is_suspicious)
        self.assertEqual(result.source, "SMS")
        client.chat.completions.create.assert_called_once()

    def test_reports_openai_connection_errors(self):
        from openai import APIConnectionError

        client = MagicMock()
        client.__enter__.return_value = client
        client.chat.completions.create.side_effect = APIConnectionError(request=None)
        with (
            patch.object(settings, "openai_api_key", "test-key"),
            patch("services.ai_service.OpenAI", return_value=client),
        ):
            with self.assertRaisesRegex(AIServiceError, "Could not connect to OpenAI"):
                analyze_alert(AlertRequest(message="hello"))

    def test_returns_provider_errors_as_gateway_errors(self):
        from routes import alerts

        client = TestClient(app)
        with (
            patch.object(alerts, "get_user_from_token", return_value={"id": "test-user"}),
            patch.object(
                alerts,
                "evaluate_alert",
                side_effect=AIServiceError("OpenAI analysis failed."),
            ),
        ):
            response = client.post(
                "/api/v1/analyze",
                headers={"Authorization": "Bearer test-token"},
                json={"message": "hello"},
            )

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.json()["detail"], "OpenAI analysis failed.")


if __name__ == "__main__":
    unittest.main()
