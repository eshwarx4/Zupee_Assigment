# Bharat Nivesh Saathi (भारत निवेश साथी)

AI-powered Indian investment advisor mobile app built with React Native (Expo) and Node.js.

## Project Structure

```
bharat-nivesh-saathi/
├── backend/          # Express API server
│   ├── src/
│   │   ├── config/   # Firebase config
│   │   ├── middleware/# Auth middleware
│   │   ├── routes/   # API routes (chat, order, portfolio, goals)
│   │   └── index.js  # Server entry
│   └── .env          # Backend secrets
├── frontend/         # Expo React Native app
│   ├── src/
│   │   ├── config/   # Firebase client config
│   │   ├── navigation/# App navigator
│   │   ├── screens/  # All screens
│   │   └── services/ # API service
│   └── .env          # Frontend config
└── README.md
```

## Setup

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (or iOS/Android emulator)

### Backend

```bash
cd backend
npm install
npm start
```

Server runs on http://localhost:3000

### Frontend

```bash
cd frontend
npm install
npx expo start
```

Scan QR code with Expo Go or press `i` for iOS / `a` for Android emulator.

### Connecting Frontend to Backend

- For local dev with Expo Go on physical device, update `EXPO_PUBLIC_BACKEND_URL` in `frontend/.env` to your machine's local IP (e.g., `http://192.168.1.x:3000`)
- For emulator: use `http://localhost:3000` (iOS) or `http://10.0.2.2:3000` (Android)

## API Endpoints

| Method | Route         | Description              | Auth |
|--------|---------------|--------------------------|------|
| POST   | /chat         | AI investment advice     | Yes  |
| POST   | /place-order  | Place stock order        | Yes  |
| GET    | /portfolio    | Get user investments     | Yes  |
| POST   | /goals        | Create goal              | Yes  |
| GET    | /goals        | List user goals          | Yes  |
| PUT    | /goals/:id    | Update goal              | Yes  |
| DELETE | /goals/:id    | Delete goal              | Yes  |
| GET    | /             | Health check             | No   |

## Deploying Backend to Render

1. Push backend to a Git repo
2. Create a new Web Service on Render
3. Set root directory to `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add all env variables from `backend/.env`
7. Update `EXPO_PUBLIC_BACKEND_URL` in frontend to your Render URL

## Notes

- Trading is in **simulation mode** by default (no Zerodha access token). Set `ZERODHA_ACCESS_TOKEN` for live trading.
- For production Firebase Admin auth verification, add a service account JSON file.
- AI powered by Groq (Llama 3.3 70B model).
