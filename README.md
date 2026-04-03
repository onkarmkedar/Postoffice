# Post Office & Address Finder

Smart web/mobile-ready application for finding India post offices, PIN codes, and nearest postal services.

## Features

- India Post API integration for `/pincode/{PINCODE}` and `/postoffice/{NAME}`
- Search by post office name with debounced auto-suggestions and fuzzy matching
- Search by validated 6-digit PIN code
- OCR Lens mode with image upload/camera via `tesseract.js`
- Address to coordinates via Google Geocoding API (`/api/geocode`)
- Near Me using Geolocation API
- Distance sorting via Haversine formula
- Map integration via Leaflet with markers and navigate links
- Favorites + recent searches persisted in local storage
- Multilingual labels: English, Hindi, Marathi
- Security and performance: input validation, caching, rate limiting, lazy-loaded map

## Project Structure

- `client/`: React + Vite app
- `server/`: Node.js + Express API proxy and geocoding service
- `docs/api/india-post-api.md`: reusable API notes

## Run Locally

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:4000`

## View Links

After starting the app, open the following links:

- Web App: `http://localhost:5173`
- API Health: `http://localhost:4000/api/health`
- API by PIN example: `http://localhost:4000/api/pincode/110001`
- API by Post Office example: `http://localhost:4000/api/postoffice/Connaught%20Place`

## Environment Variables

Create `server/.env`:

```env
PORT=4000
GEOCODING_API_KEY=your_google_maps_geocoding_key
```

## Security + Reliability

- Rate limiting on `/api/*`
- Input sanitization and PIN validation
- Response caching for frequent pincode/postoffice lookups

## Mobile Experience

- Responsive layout and camera capture support (`capture="environment"`)

## Localhost Unreachable (Fix)

If `localhost` is unreachable from your machine/container:

- Frontend now binds to `0.0.0.0:5173`
- Backend now binds to `0.0.0.0:4000`

Try these links:

- `http://127.0.0.1:5173`
- `http://127.0.0.1:4000/api/health`

If using Docker/remote VM, replace `127.0.0.1` with the VM/container host IP.

## Make It Live (Deployment)

This repo is now deployment-ready for a **single live URL**:

1. Build frontend: `npm run build -w client`
2. Start backend in production: `NODE_ENV=production npm run start -w server`
3. Open: `http://<your-host>:4000`

In production mode, Express serves `client/dist` and the API from the same host.

### Optional hosted deployment

- Render / Railway: deploy `server/` as a Node web service, run client build in build command, and set `GEOCODING_API_KEY`.
- Vercel/Netlify (frontend): set `VITE_API_BASE` to your backend URL (e.g. `https://your-api.com/api`).


## Deploy

### Option A: Render (one-click via `render.yaml`)

1. Push this repo to GitHub.
2. In Render, create a **Blueprint** from the repository.
3. Set `GEOCODING_API_KEY` in Render environment variables.
4. Deploy and open the generated Render URL.

### Option B: Docker

```bash
docker build -t postoffice-finder .
docker run -p 4000:4000 -e GEOCODING_API_KEY=your_key postoffice-finder
```

Then open `http://localhost:4000`.

### Option C: Railway/Heroku-style Procfile

- `Procfile` is included (`web: npm run start -w server`).
- Ensure build step runs `npm install --workspaces --include-workspace-root && npm run build -w client`.
- Set env vars: `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT=4000`, `GEOCODING_API_KEY=...`.
