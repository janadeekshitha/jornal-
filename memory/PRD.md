# LITTLE — Product Requirements & Build Memory

## Problem statement
LITTLE is a private, visual-first Gen-Z photo journal centered on one simple daily ritual: one photo, one mood, one moment. It turns ordinary life into a warm, premium digital scrapbook without shame, clinical mood tracking, or public social pressure.

## Architecture
- Mobile client: Expo SDK 57 + Expo Router, React Native components, five bottom areas (Today, Capture, Journal, Mood, Me).
- Backend: FastAPI on `0.0.0.0:8001`, MongoDB via Motor, `/api` routes.
- Persistence: generated private user id in AsyncStorage, profile and memory records in MongoDB, base64 image payloads for preview-safe image handling.
- Styling: theme-driven warm cream palette in `frontend/src/theme.ts`, Ionicons, safe-area insets, responsive scrapbook cards.

## User personas
- The sentimental documentarian: wants a low-pressure way to remember everyday life.
- The visual storyteller: prefers photos, color, mood, and small captions over long journaling.
- The private reflector: wants memories stored privately and a gentle archive to look back through.

## Core requirements (static)
- Capture one photo per day with optional mood, caption, soundtrack, and location fields.
- Keep the capture ritual fast, visually delightful, and non-judgmental.
- Make photos the visual hero with a warm scrapbook aesthetic.
- Provide Today, Capture, Journal, Mood, and Me navigation.
- Persist profiles and memories, support search/filter, mood summaries, edits/deletes, and item retrieval.
- Keep memories private by default and show intentional empty states.

## Implemented

### 2026-09-05 — Initial MVP
- Built LITTLE's visual system: warm cream base, coral/peach/sunny/mint/lavender/sky accents, rounded scrapbook cards, mood stamps, large editorial empty states, and responsive spacing.
- Added five-tab Expo Router shell with native-tab support on supported iOS versions and classic tabs elsewhere.
- Added Today greeting, onboarding name flow, daily prompt, private empty hero, captured-memory hero, quick actions, and privacy reassurance.
- Added Capture flow with Expo image-library access, base64 image persistence, mood selector, caption, soundtrack, loading, error, and save states.
- Added Journal grid, search, mood/core filters, empty state, staggered scrapbook tiles, and memory detail entry point.
- Added Mood visualization with month color field, mood mix, gentle insights, and empty/retry states.
- Added Me profile editor, moment stats, privacy/reminder/export/about rows, and retry state.
- Added FastAPI profile, memory collection/item CRUD, delete, and mood-summary routes with Mongo-safe responses.
- Added app photo/camera permissions and stable test IDs for critical UI controls.

### 2026-09-05 — Responsive website conversion
- Converted the Expo experience into a responsive web layout while preserving the same backend, private memory model, and five core areas.
- Added a centered desktop scrapbook workspace with LITTLE brand header navigation and a desktop Capture CTA.
- Added a compact mobile-web header with stacked brand/action controls and horizontally scrollable navigation to prevent horizontal overflow.
- Hid the mobile tab bar on web while retaining native/classic tab navigation on device platforms.
- Documented the protected `EXPO_PUBLIC_BACKEND_URL` mapping for backend regression scripts that use `EXPO_BACKEND_URL`.

## Prioritized backlog

### P0 — next core product work
- Add a true camera viewfinder with camera flip, flash, zoom, and permission fallback.
- Add authentication/account recovery and secure cross-device identity.
- Add notification scheduling for personalized daily reminders.
- Add a memory detail screen with edit, core-memory toggle, share, and swipe navigation.

### P1 — retention and emotional depth
- Add calendar mode with photo thumbnails and “blank page” days.
- Add On This Day, Core Memories, achievements, streak copy, and Future Self messages.
- Add monthly/weekly recap magazine views and mood rainbow export.
- Add offline capture queue and sync retry.

### P2 — signature visual features
- Add life mosaic, year universe, digital garden, and shareable memory templates.
- Add optional caption magic and recap storytelling through a server-side LLM integration.
- Add lockbox / biometric app lock and full data export/delete-account flows.

## Next task list
1. Implement camera capture and photo compression/thumbnails.
2. Add the memory detail/edit stack route.
3. Add reminder scheduling and settings persistence.
4. Expand journal calendar and recap surfaces after the capture loop has daily usage data.