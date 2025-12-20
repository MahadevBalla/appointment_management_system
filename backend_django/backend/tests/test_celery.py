from django.test import TestCase
from unittest.mock import patch


class CeleryTests(TestCase):

    @patch("config.celery.app.control.inspect")
    def test_celery_inspect_called(self, mock_inspect):
        inspector = mock_inspect.return_value
        inspector.stats.return_value = {"worker1": {}}

        stats = inspector.stats()
        self.assertTrue(stats)
