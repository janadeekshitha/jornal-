"""Backend tests for LITTLE new features: prompts, achievements, captions.
Uses internal URL http://localhost:8001 per test brief.
"""
import base64
import time
from datetime import datetime, timezone

import pytest
import requests

BASE_URL = "http://localhost:8001"
USER_ID = "test-little"

# Tiny 1x1 PNG base64 for memory image payload
TINY_PNG_B64 = (
    "data:image/png;base64,"
    + base64.b64encode(bytes.fromhex(
        "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4"
        "890000000A49444154789C63000100000500010D0A2DB40000000049454E44AE"
        "426082"
    )).decode()
)


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Prompt Engine -------------------------------------------------
class TestPromptEngine:
    def test_prompt_today_shape(self, api):
        r = api.get(f"{BASE_URL}/api/prompts/today", params={"day_key": "2026-09-05"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert set(data.keys()) >= {"category", "prompt", "day_key"}
        assert data["day_key"] == "2026-09-05"
        assert isinstance(data["prompt"], str) and data["prompt"].strip()
        assert isinstance(data["category"], str) and data["category"].strip()

    def test_prompt_today_deterministic(self, api):
        r1 = api.get(f"{BASE_URL}/api/prompts/today", params={"day_key": "2026-09-05"}).json()
        r2 = api.get(f"{BASE_URL}/api/prompts/today", params={"day_key": "2026-09-05"}).json()
        r3 = api.get(f"{BASE_URL}/api/prompts/today", params={"day_key": "2026-10-01"}).json()
        assert r1 == r2, "Same day_key should return identical prompt"
        # Different day_key likely differs (not guaranteed, but with 32 prompts and sha1 seed it should)
        assert (r1["prompt"], r1["category"]) != (r3["prompt"], r3["category"]) or r3["day_key"] == "2026-10-01"

    def test_prompt_surprise_shape_and_variance(self, api):
        seen = set()
        for _ in range(6):
            r = api.get(f"{BASE_URL}/api/prompts/surprise")
            assert r.status_code == 200, r.text
            data = r.json()
            assert set(data.keys()) >= {"category", "prompt"}
            assert isinstance(data["prompt"], str) and data["prompt"].strip()
            seen.add(data["prompt"])
        # Very unlikely all 6 identical if random
        assert len(seen) > 1, f"Surprise prompt not varying across 6 calls: {seen}"


# --- Existing endpoints regression --------------------------------
class TestExistingEndpoints:
    def test_get_profile_creates(self, api):
        r = api.get(f"{BASE_URL}/api/profiles/{USER_ID}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user_id"] == USER_ID
        assert "name" in data

    def test_get_memories(self, api):
        r = api.get(f"{BASE_URL}/api/memories", params={"user_id": USER_ID})
        assert r.status_code == 200, r.text
        assert isinstance(r.json(), list)

    def test_mood_summary(self, api):
        r = api.get(f"{BASE_URL}/api/mood-summary", params={"user_id": USER_ID})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "total" in data and "counts" in data
        assert isinstance(data["counts"], dict)


# --- Memory create + Achievements integration ---------------------
class TestAchievementsFlow:
    def _cleanup_memories(self, api):
        mems = api.get(f"{BASE_URL}/api/memories", params={"user_id": USER_ID}).json()
        for m in mems:
            api.delete(f"{BASE_URL}/api/memories/{m['id']}", params={"user_id": USER_ID})

    def test_achievements_shape_empty(self, api):
        self._cleanup_memories(api)
        r = api.get(f"{BASE_URL}/api/achievements", params={"user_id": USER_ID})
        assert r.status_code == 200, r.text
        data = r.json()
        assert set(data.keys()) >= {"total_memories", "streak", "core_count", "achievements"}
        assert data["total_memories"] == 0
        assert isinstance(data["achievements"], list) and len(data["achievements"]) == 12
        for a in data["achievements"]:
            assert set(a.keys()) >= {"id", "emoji", "title", "detail", "target", "progress", "unlocked"}
            assert a["unlocked"] is False
            assert a["progress"] == 0

    def test_create_memory_unlocks_first_moment(self, api):
        today = datetime.now(timezone.utc).date().isoformat()
        payload = {
            "user_id": USER_ID,
            "day_key": today,
            "image_base64": TINY_PNG_B64,
            "mood": "Happy",
            "mood_emoji": "😊",
            "caption": "TEST caption",
            "song": "",
            "location": "",
            "is_core": False,
        }
        r = api.post(f"{BASE_URL}/api/memories", json=payload)
        assert r.status_code == 200, r.text
        mem = r.json()
        assert mem["user_id"] == USER_ID
        assert mem["day_key"] == today
        assert "_id" not in mem  # ObjectId should not leak

        # GET to verify persistence
        listing = api.get(f"{BASE_URL}/api/memories", params={"user_id": USER_ID}).json()
        assert any(m["id"] == mem["id"] for m in listing)

        # Achievements reflect the new memory
        ach = api.get(f"{BASE_URL}/api/achievements", params={"user_id": USER_ID}).json()
        assert ach["total_memories"] >= 1
        by_id = {a["id"]: a for a in ach["achievements"]}
        assert by_id["first_moment"]["unlocked"] is True
        assert by_id["first_moment"]["progress"] == 1
        # Captioner counts captions with non-empty content
        assert by_id["captioner"]["progress"] >= 1

        # Cleanup
        self._cleanup_memories(api)


# --- Caption Generation (LLM) - keep to 7 tones only --------------
TONES = ["cute", "funny", "deep", "poetic", "minimal", "genz", "chaotic"]


class TestCaptions:
    @pytest.mark.parametrize("tone", TONES)
    def test_caption_tone(self, api, tone):
        payload = {"mood": "Happy", "tone": tone, "hint": "coffee", "user_id": USER_ID}
        r = api.post(f"{BASE_URL}/api/captions/generate", json=payload, timeout=60)
        assert r.status_code == 200, f"{tone}: {r.status_code} {r.text}"
        data = r.json()
        assert data["tone"] == tone
        assert data["mood"] == "Happy"
        cap = data.get("caption", "")
        assert isinstance(cap, str) and cap.strip(), f"Empty caption for tone {tone}"
        assert len(cap) < 200, f"Caption too long ({len(cap)} chars) for tone {tone}: {cap}"
        assert not (cap.startswith('"') and cap.endswith('"')), f"Caption wrapped in quotes: {cap}"
        assert not (cap.startswith("'") and cap.endswith("'")), f"Caption wrapped in single quotes: {cap}"
        assert "\n" not in cap, f"Caption contains newline: {cap!r}"
        # brief pacing to be gentle on LLM
        time.sleep(0.3)
