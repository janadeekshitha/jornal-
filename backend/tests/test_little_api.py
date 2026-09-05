import os
import uuid

import requests


BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL") or os.environ.get("EXPO_BACKEND_URL")


def test_profile_memory_mood_crud_and_base64():
    user_id = f"TEST_{uuid.uuid4().hex}"
    memory = {
        "user_id": user_id,
        "day_key": "2099-01-01",
        "image_base64": "aGVsbG8=",
        "mood": "Happy",
        "mood_emoji": "Happy",
        "caption": "TEST moment",
        "song": "TEST song",
        "location": "",
        "is_core": False,
    }
    session = requests.Session()
    profile = session.get(f"{BASE_URL}/api/profiles/{user_id}")
    assert profile.status_code == 200 and profile.json()["user_id"] == user_id
    updated = session.patch(f"{BASE_URL}/api/profiles/{user_id}", json={"name": "TEST Name"})
    assert updated.status_code == 200 and updated.json()["name"] == "TEST Name"
    created = session.post(f"{BASE_URL}/api/memories", json=memory)
    assert created.status_code == 200 and created.json()["image_base64"] == "aGVsbG8="
    memory_id = created.json()["id"]
    listed = session.get(f"{BASE_URL}/api/memories", params={"user_id": user_id})
    assert listed.status_code == 200 and listed.json()[0]["id"] == memory_id
    summary = session.get(f"{BASE_URL}/api/mood-summary", params={"user_id": user_id})
    assert summary.status_code == 200 and summary.json() == {"total": 1, "counts": {"Happy": 1}}
    fetched = session.get(f"{BASE_URL}/api/memories/{memory_id}", params={"user_id": user_id})
    assert fetched.status_code == 200 and fetched.json()["image_base64"] == "aGVsbG8="
    deleted = session.delete(f"{BASE_URL}/api/memories/{memory_id}", params={"user_id": user_id})
    assert deleted.status_code == 200 and deleted.json()["deleted"] is True
    assert session.get(f"{BASE_URL}/api/memories/{memory_id}", params={"user_id": user_id}).status_code == 404