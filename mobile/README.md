# TaskFlow — Mobile App

React Native + Expo (SDK 57) client. Talks only to the backend REST API (never Supabase directly).

## Stack
- **Expo Router** — file-based navigation (`app/`)
- **TanStack Query** — server state + optimistic updates (instant-feeling create/toggle/delete)
- **Reanimated + Gesture Handler** — swipe-to-complete / swipe-to-delete, animated checkbox
- **expo-haptics** — tactile feedback
- **React Native `StyleSheet` + a small theme system** — light/dark, zero styling-lib compat risk
- Axios · `@expo/vector-icons` · `@react-native-community/datetimepicker`

> Note: NativeWind (from the original plan) was intentionally dropped — on bleeding-edge RN 0.86 /
> React 19.2 it's a compatibility risk. StyleSheet + tokens gives the same visual quality reliably.

## Setup
```bash
cd mobile
cp .env.example .env      # set EXPO_PUBLIC_API_URL + EXPO_PUBLIC_API_KEY
npm install               # .npmrc enables legacy-peer-deps (SDK 57 web-deps quirk)
npm run start             # scan the QR with Expo Go
```

Requires **Node 22.13+** (Expo SDK 57 minimum) to run the dev server.

### Environment
| var | notes |
|-----|-------|
| `EXPO_PUBLIC_API_URL` | Render URL in prod; your Mac's **LAN IP** (not `localhost`) for a physical phone in dev |
| `EXPO_PUBLIC_API_KEY` | must match the backend `API_KEY`; sent as `x-api-key` |

## Structure
```
app/
  _layout.tsx     providers (Query, GestureHandler, SafeArea) + Stack
  index.tsx       home: stats, search, filter tabs, list, FAB
  new.tsx         create (modal)
  task/[id].tsx   edit / delete / toggle
components/        TaskCard, Checkbox, Badges, FilterTabs, SearchBar, StatsHeader, EmptyState, TaskForm
lib/               api, queries (TanStack hooks), types, theme, format
```

## Features
- Create / edit / delete / check-off with **optimistic updates** (instant UI, auto-rollback on error).
- **Swipe** a card right to complete, left to delete — with haptics.
- Filter tabs (All · Today · Upcoming · Done) with live counts, plus search.
- Priority badges, relative due-date chips (overdue in red), and a **"from email"** badge on tasks
  created by the n8n automation.
- Stats header (open / overdue / done-today), pull-to-refresh, loading + empty states.
- **Light & dark mode** following the system.

## Verified
`npx tsc --noEmit` is clean and `npx expo export --platform ios` bundles successfully (all native
modules resolve). Run on a device with Expo Go to exercise the live flow against the backend.
