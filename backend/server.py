from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
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

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
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
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
