import { storage } from "@/src/utils/storage";

export const MOODS = [
  { name: "Happy", icon: "sunny-outline" as const, color: "sunny" as const },
  { name: "Loved", icon: "heart-outline" as const, color: "peach" as const },
  { name: "Chill", icon: "leaf-outline" as const, color: "mint" as const },
  { name: "Excited", icon: "sparkles-outline" as const, color: "brandSecondary" as const },
  { name: "Peaceful", icon: "cloud-outline" as const, color: "lavender" as const },
  { name: "Tired", icon: "moon-outline" as const, color: "surfaceTertiary" as const },
  { name: "Sad", icon: "rainy-outline" as const, color: "sky" as const },
  { name: "Grateful", icon: "flower-outline" as const, color: "paper" as const },
];

export const PROMPTS = [
  "What made today a little better?",
  "Photograph your current view.",
  "Something ordinary you'll miss someday.",
  "Your main-character moment.",
  "What does today look like?",
  "A tiny thing worth remembering.",
];

export async function getLittleUserId() {
  const existing = await storage.getItem("little_user_id", "");
  if (existing) return existing;
  const newId = `little-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await storage.setItem("little_user_id", newId);
  return newId;
}

export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function prettyDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(date);
}

export function getMood(moodName: string) {
  return MOODS.find((mood) => mood.name === moodName) ?? MOODS[0];
}