# Diary of Memories — Merged Site

One Vite + React app. One `npm run dev`. Replaces both the interview app and the map site.

## Site Structure

```
/           → Cinematic intro (terminal animation → title)
/hub        → Hub page (buttons: experience, map, about)
/interview  → AI interview → BERT result (the yellow page from your diagram)
/map        → World map with story markers → BERT panels on click
/about      → About us page
```

## Setup

### 1. Copy your environment keys

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase anon key:

```
VITE_SUPABASE_URL=https://tvshvsfnbzhcmnsmntlp.supabase.co
VITE_SUPABASE_ANON_KEY=paste_your_actual_key_here   ← THIS WAS EMPTY — causes BERT data not saving
VITE_MAPBOX_TOKEN=pk.eyJ1...                         ← already filled from your old code
VITE_MAPBOX_STYLE=mapbox://styles/...                ← already filled
```

> **Why was BERT data not saving?**  
> In the old `saveMemory.ts`, `SUPABASE_KEY` was set to `""` (empty string).  
> All tokens were being computed but never written to the database.  
> The map site was then reading empty `bert_tokens` fields.  
> Filling in the `.env` fixes this completely.

### 2. Install dependencies

```bash
npm install
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Pages To Still Build (from your diagram — marked red)

- **Privacy disclaimer page** — add as `/privacy`, link from `/hub`
- **Story grid page** — the search/filter/added stories view on `/map` (currently shows world map; grid can be a toggle)
- **About us content** — fill in `AboutPage.tsx` with your actual team info

## Key Changes from Old Code

| Before | After |
|---|---|
| Two separate servers (Vite + Live Server) | One Vite app |
| `Go to the Map` button → `localhost:5500` | `Go to the Map` button → `/map` (React Router) |
| `SUPABASE_KEY = ""` | `SUPABASE_KEY` from `.env` |
| Map site reads from `bert_tokens` (often empty) | Fixed: tokens now save correctly |
| `ConversationTerminal.tsx` imports `jsPDF` (missing) | PDF export removed — PNG remains |
