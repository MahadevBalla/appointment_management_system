from django.test import TestCase
from django.core.cache import cache
from django.conf import settings


class RedisTests(TestCase):

    def test_redis_cache_basic_ops(self):
        if not getattr(settings, "USE_REDIS", False):
            self.skipTest("Redis not enabled")

        cache.set("test_key", "hello", timeout=5)
        self.assertEqual(cache.get("test_key"), "hello")

        cache.delete("test_key")
        self.assertIsNone(cache.get("test_key"))
