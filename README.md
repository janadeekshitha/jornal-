# LITTLE

LITTLE is a responsive web version of the private visual photo journal: one photo, one mood, one moment.

## Local development

- Frontend: Expo web preview from `/app/frontend`.
- Backend: FastAPI on port `8001` with the protected `MONGO_URL` from `/app/backend/.env`.
- The frontend uses the protected `EXPO_PUBLIC_BACKEND_URL` value from `/app/frontend/.env` and appends `/api`.
- Regression scripts that expect `EXPO_BACKEND_URL` should map it to the same public value before running, for example: `EXPO_BACKEND_URL="$EXPO_PUBLIC_BACKEND_URL"`.

## Web experience

- Desktop: centered scrapbook workspace with branded LITTLE header navigation.
- Mobile web: compact two-row header with horizontally scrollable sections.
- Core routes: Today, Capture, Journal, Mood, and Me.
