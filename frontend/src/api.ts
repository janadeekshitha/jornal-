import Constants from "expo-constants";

// EXPO_PUBLIC_BACKEND_URL is the protected preview variable; EXPO_BACKEND_URL
// remains a compatible fallback for standalone native builds.
const backendUrl =
  Constants.expoConfig?.extra?.backendUrl ?? process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_BACKEND_URL ?? "";
const API_URL = `${String(backendUrl).replace(/\/$/, "")}/api`;

export type Profile = {
  user_id: string;
  name: string;
  reminder_time?: string | null;
  created_at: string;
};

export type Memory = {
  id: string;
  user_id: string;
  day_key: string;
  image_base64: string;
  mood: string;
  mood_emoji: string;
  caption: string;
  song: string;
  location: string;
  is_core: boolean;
  created_at: string;
};

type MemoryInput = Omit<Memory, "id" | "created_at">;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    throw new Error(`LITTLE request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  getProfile: (userId: string) => request<Profile>(`/profiles/${userId}`),
  updateProfile: (userId: string, input: { name?: string; reminder_time?: string }) =>
    request<Profile>(`/profiles/${userId}`, { method: "PATCH", body: JSON.stringify(input) }),
  getMemories: (userId: string) => request<Memory[]>(`/memories?user_id=${encodeURIComponent(userId)}`),
  getMemory: (memoryId: string, userId: string) => request<Memory>(`/memories/${memoryId}?user_id=${encodeURIComponent(userId)}`),
  saveMemory: (input: MemoryInput) =>
    request<Memory>("/memories", { method: "POST", body: JSON.stringify(input) }),
  deleteMemory: (memoryId: string, userId: string) =>
    request<{ deleted: boolean }>(`/memories/${memoryId}?user_id=${encodeURIComponent(userId)}`, { method: "DELETE" }),
  getMoodSummary: (userId: string) => request<{ total: number; counts: Record<string, number> }>(`/mood-summary?user_id=${encodeURIComponent(userId)}`),
};

export function asDataUri(value: string) {
  return value.startsWith("data:") ? value : `data:image/jpeg;base64,${value}`;
}