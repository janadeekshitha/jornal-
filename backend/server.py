from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import hashlib
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

# Configure logging (define logger early so route handlers can use it)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Basic models
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "LITTLE API", "status": "ok"}


class Profile(BaseModel):
    user_id: str
    name: str = "you"
    reminder_time: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    reminder_time: Optional[str] = None


class MemoryCreate(BaseModel):
    user_id: str
    day_key: str
    image_base64: str
    mood: str
    mood_emoji: str
    caption: Optional[str] = ""
    song: Optional[str] = ""
    location: Optional[str] = ""
    is_core: bool = False


class Memory(MemoryCreate):
    id: str
    created_at: str


def public_memory(doc: dict) -> dict:
    return {key: value for key, value in doc.items() if key != "_id"}


@api_router.get("/profiles/{user_id}", response_model=Profile)
async def get_profile(user_id: str):
    profile = await db.profiles.find_one({"user_id": user_id}, {"_id": 0})
    if profile:
        return Profile(**profile)
    new_profile = Profile(user_id=user_id)
    await db.profiles.insert_one(new_profile.model_dump())
    return new_profile


@api_router.patch("/profiles/{user_id}", response_model=Profile)
async def update_profile(user_id: str, input: ProfileUpdate):
    changes = {key: value for key, value in input.model_dump().items() if value is not None}
    if changes:
        await db.profiles.update_one({"user_id": user_id}, {"$set": changes}, upsert=True)
    profile = await db.profiles.find_one({"user_id": user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return Profile(**profile)


@api_router.get("/memories", response_model=List[Memory])
async def get_memories(user_id: str = Query(...), day_key: Optional[str] = None):
    query = {"user_id": user_id}
    if day_key:
        query["day_key"] = day_key
    docs = await db.memories.find(query, {"_id": 0}).sort("day_key", -1).to_list(500)
    return [Memory(**public_memory(doc)) for doc in docs]


@api_router.post("/memories", response_model=Memory)
async def create_memory(input: MemoryCreate):
    existing = await db.memories.find_one({"user_id": input.user_id, "day_key": input.day_key}, {"_id": 0})
    now = datetime.now(timezone.utc).isoformat()
    memory_id = existing.get("id") if existing else str(uuid.uuid4())
    memory = Memory(id=memory_id, created_at=existing.get("created_at", now) if existing else now, **input.model_dump())
    await db.memories.replace_one({"user_id": input.user_id, "day_key": input.day_key}, memory.model_dump(), upsert=True)
    return memory


@api_router.get("/memories/{memory_id}", response_model=Memory)
async def get_memory(memory_id: str, user_id: str = Query(...)):
    doc = await db.memories.find_one({"id": memory_id, "user_id": user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Memory not found")
    return Memory(**public_memory(doc))


@api_router.patch("/memories/{memory_id}", response_model=Memory)
async def update_memory(memory_id: str, input: MemoryCreate):
    memory = Memory(id=memory_id, created_at=datetime.now(timezone.utc).isoformat(), **input.model_dump())
    result = await db.memories.replace_one({"id": memory_id}, memory.model_dump())
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memory


@api_router.delete("/memories/{memory_id}")
async def delete_memory(memory_id: str, user_id: str = Query(...)):
    result = await db.memories.delete_one({"id": memory_id, "user_id": user_id})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"deleted": True}


@api_router.get("/mood-summary")
async def mood_summary(user_id: str = Query(...)):
    docs = await db.memories.find({"user_id": user_id}, {"_id": 0, "mood": 1, "mood_emoji": 1}).to_list(500)
    counts: dict[str, int] = {}
    for doc in docs:
        counts[doc["mood"]] = counts.get(doc["mood"], 0) + 1
    return {"total": len(docs), "counts": counts}


# ---------------------------------------------------------------------------
# Daily Prompt Engine
# ---------------------------------------------------------------------------
PROMPT_BANK = {
    "everyday": [
        "What does today look like?",
        "Photograph your current view.",
        "A tiny thing worth remembering.",
        "Something ordinary you'll miss someday.",
    ],
    "gratitude": [
        "What made today a little better?",
        "Something small you're thankful for.",
        "A tiny win from today.",
        "What softened your day?",
    ],
    "people": [
        "Who made you smile today?",
        "Someone you love, right now.",
        "A face that felt like home today.",
    ],
    "environment": [
        "What's your current view?",
        "The sky right now.",
        "Your shoes today.",
        "Where are your hands right now?",
    ],
    "funny": [
        "Today's most random moment.",
        "Something that made you laugh out loud.",
        "The chaos of today, in one shot.",
    ],
    "nostalgic": [
        "Something you might miss someday.",
        "A slow moment worth keeping.",
        "The soft light of today.",
    ],
    "creative": [
        "Photograph something blue.",
        "Something round in your life today.",
        "Your favourite texture right now.",
    ],
    "self": [
        "How are you showing up today?",
        "Your current vibe, uncensored.",
        "What are you wearing today?",
    ],
    "main_character": [
        "Your main-character moment.",
        "The most cinematic thing near you.",
        "A little scene you'd screenshot.",
    ],
}

ALL_PROMPTS = [(cat, text) for cat, items in PROMPT_BANK.items() for text in items]


@api_router.get("/prompts/today")
async def prompt_today(day_key: str = Query(...)):
    seed = int(hashlib.sha1(day_key.encode()).hexdigest(), 16)
    cat, text = ALL_PROMPTS[seed % len(ALL_PROMPTS)]
    return {"category": cat, "prompt": text, "day_key": day_key}


@api_router.get("/prompts/surprise")
async def prompt_surprise():
    cat, text = random.choice(ALL_PROMPTS)
    return {"category": cat, "prompt": text}


# ---------------------------------------------------------------------------
# Achievements Engine (computed on the fly)
# ---------------------------------------------------------------------------
ACHIEVEMENT_DEFS = [
    {"id": "first_moment", "emoji": "📸", "title": "First Moment", "detail": "Captured your first little day.", "target": 1, "kind": "count"},
    {"id": "tiny_habit", "emoji": "🌱", "title": "Tiny Habit", "detail": "3 moments captured.", "target": 3, "kind": "count"},
    {"id": "one_week", "emoji": "✨", "title": "One Week", "detail": "7 little moments.", "target": 7, "kind": "count"},
    {"id": "one_month", "emoji": "🌈", "title": "One Whole Month", "detail": "30 little moments.", "target": 30, "kind": "count"},
    {"id": "hundred", "emoji": "💯", "title": "100 Little Moments", "detail": "You did the thing.", "target": 100, "kind": "count"},
    {"id": "happy_soul", "emoji": "☀️", "title": "Sunshine Soul", "detail": "5 happy moments.", "target": 5, "kind": "mood", "mood": "Happy"},
    {"id": "loved_pack", "emoji": "🫶", "title": "Loved Loud", "detail": "5 loved moments.", "target": 5, "kind": "mood", "mood": "Loved"},
    {"id": "chill_pack", "emoji": "🍃", "title": "Chill Collector", "detail": "5 chill moments.", "target": 5, "kind": "mood", "mood": "Chill"},
    {"id": "grateful_pack", "emoji": "🌼", "title": "Grateful Heart", "detail": "5 grateful moments.", "target": 5, "kind": "mood", "mood": "Grateful"},
    {"id": "core_five", "emoji": "💖", "title": "Core Five", "detail": "Mark 5 core memories.", "target": 5, "kind": "core"},
    {"id": "captioner", "emoji": "✍️", "title": "Tiny Writer", "detail": "10 captions written.", "target": 10, "kind": "caption"},
    {"id": "streak_three", "emoji": "🔥", "title": "3-Day Streak", "detail": "Three days in a row.", "target": 3, "kind": "streak"},
]


def _compute_streak(day_keys: list[str]) -> int:
    if not day_keys:
        return 0
    day_set = set(day_keys)
    today = datetime.now(timezone.utc).date()
    from datetime import timedelta
    streak = 0
    cursor = today
    # allow starting from yesterday too (grace)
    if cursor.isoformat() not in day_set:
        cursor = cursor - timedelta(days=1)
    while cursor.isoformat() in day_set:
        streak += 1
        cursor = cursor - timedelta(days=1)
    return streak


@api_router.get("/achievements")
async def achievements(user_id: str = Query(...)):
    docs = await db.memories.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    total = len(docs)
    mood_counts: dict[str, int] = {}
    core_count = 0
    caption_count = 0
    for doc in docs:
        mood_counts[doc.get("mood", "")] = mood_counts.get(doc.get("mood", ""), 0) + 1
        if doc.get("is_core"):
            core_count += 1
        if (doc.get("caption") or "").strip():
            caption_count += 1
    day_keys = [doc.get("day_key", "") for doc in docs]
    streak = _compute_streak(day_keys)

    results = []
    for ach in ACHIEVEMENT_DEFS:
        kind = ach["kind"]
        target = ach["target"]
        if kind == "count":
            progress = total
        elif kind == "mood":
            progress = mood_counts.get(ach["mood"], 0)
        elif kind == "core":
            progress = core_count
        elif kind == "caption":
            progress = caption_count
        elif kind == "streak":
            progress = streak
        else:
            progress = 0
        results.append({
            "id": ach["id"],
            "emoji": ach["emoji"],
            "title": ach["title"],
            "detail": ach["detail"],
            "target": target,
            "progress": min(progress, target),
            "unlocked": progress >= target,
        })

    return {"total_memories": total, "streak": streak, "core_count": core_count, "achievements": results}


# ---------------------------------------------------------------------------
# AI Caption Magic (Claude Sonnet 4.6 via Emergent LLM)
# ---------------------------------------------------------------------------
class CaptionRequest(BaseModel):
    mood: str
    tone: str = "cute"
    hint: Optional[str] = ""
    user_id: Optional[str] = "anonymous"


TONE_GUIDES = {
    "cute": "warm, soft, sweet, 6-14 words, no hashtags, lower-case is welcome",
    "funny": "silly, self-aware, punchy, one-liner 6-16 words, one gentle joke",
    "deep": "reflective, quiet, one clean sentence 8-18 words, gently poetic",
    "poetic": "lyrical, imagistic, 8-16 words, no clichés",
    "minimal": "3-6 words, calm, understated, no punctuation heavy",
    "genz": "gen-z internet voice, lower-case, playful, 6-14 words, tasteful slang, no cringe",
    "chaotic": "unhinged but wholesome, chaotic-good energy, 8-16 words, one exclamation ok",
}


@api_router.post("/captions/generate")
async def generate_caption(input: CaptionRequest):
    tone_key = input.tone.lower() if input.tone else "cute"
    guide = TONE_GUIDES.get(tone_key, TONE_GUIDES["cute"])
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    system_message = (
        "You are LITTLE, a poetic caption assistant for a photo journal app. "
        "You write one short caption for a daily photo memory. "
        "Never wrap the caption in quotes. Never add hashtags. Never say 'here is your caption'. "
        "Only output the caption text itself, nothing else."
    )
    hint_part = f" The person added a hint: '{input.hint.strip()}'." if input.hint and input.hint.strip() else ""
    user_prompt = (
        f"Write ONE caption for a photo the person saved today. "
        f"They chose the mood: {input.mood}. Tone: {tone_key} ({guide}).{hint_part} "
        f"Do not use quotes around the caption. Return the caption only."
    )

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        session_id = f"caption-{input.user_id}-{uuid.uuid4()}"
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_message,
        ).with_model("anthropic", "claude-sonnet-4-6")
        result = await chat.send_message(UserMessage(text=user_prompt))
        text = str(result).strip().strip('"').strip("'")
        # never let it echo more than one line
        text = text.split("\n")[0].strip()
        return {"caption": text, "tone": tone_key, "mood": input.mood}
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover
        logger.exception("Caption generation failed: %s", exc)
        raise HTTPException(status_code=502, detail="Caption magic hiccuped, try again in a sec.")


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
# (already configured above)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
