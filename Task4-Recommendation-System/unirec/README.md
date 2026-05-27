<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=7c6fff&height=200&section=header&text=UniRec&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Universal%20AI%20Recommendation%20Engine%20%7C%20CodSoft%20AI%20Internship%20Task%204&descAlignY=60&descAlign=50" width="100%"/>

<br/>

![CodSoft](https://img.shields.io/badge/CodSoft-Task%204-7c6fff?style=for-the-badge&logo=openai&logoColor=white)
![Batch](https://img.shields.io/badge/Batch-MAY%20C2%202026-ff6b6b?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLaMA3.3--70B-FF6B35?style=for-the-badge&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Status](https://img.shields.io/badge/Status-Completed-22c55e?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)

<br/>

> **UniRec** is a Universal AI Recommendation Engine that recommends everything in the world — Movies, Music, Books, Games, Food, Fitness, Travel, and Apps — powered by **Groq LLaMA3.3-70B**. It features three patent-worthy innovations: **Emotional DNA Fingerprinting**, **Cross-Category Resonance Engine**, and **Mood-to-Universe Mapping**.

<br/>

[✨ Features](#-features) · [🧠 Innovation](#-patent-innovations) · [🏗️ Architecture](#%EF%B8%8F-architecture) · [🔌 API](#-api-endpoints) · [🚀 Setup](#-getting-started) · [👨‍💻 Author](#-author)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🌍 Universal Recommendations
- 🎬 Movies & Shows
- 🎵 Music & Albums
- 📚 Books & Comics
- 🎮 Games (PC, Mobile, Console)
- 🍕 Food & Recipes
- 🏋️ Fitness & Workouts
- 🌍 Travel & Destinations
- 📱 Apps & Tools

</td>
<td width="50%">

### 🎭 8 Mood Modes
- 😊 Happy → Fun & upbeat picks
- 😢 Sad → Comforting & healing
- 🤩 Excited → Thrilling & adventurous
- 😌 Relaxed → Calm & chill
- 💪 Motivated → Inspiring & powerful
- 😑 Bored → Unique & surprising
- 😩 Stressed → Light & escapism
- 💕 Romantic → Warm & connected

</td>
</tr>
<tr>
<td width="50%">

### 🔐 Auth System
- Secure registration & login
- Bcrypt password hashing
- Session-based authentication
- Persistent user profiles

</td>
<td width="50%">

### ⭐ Preference Learning
- 5-star rating system
- Save to favourites
- Mood history tracking
- Emotional DNA auto-updating

</td>
</tr>
</table>

---

## 🧠 Patent Innovations

### 1. 🧬 Emotional DNA Fingerprint
> Every user gets a unique emotional preference profile built from their ratings and mood history. No two users ever get the same recommendations.

```python
# Built from rating history across all categories
dna = {
  "movies": 4.5,   # avg rating in this category
  "music": 3.8,
  "books": 5.0,
  "dominant_mood": "excited"
}
```

### 2. 🔗 Cross-Category Resonance Engine
> If you love thriller movies → UniRec automatically recommends thriller books, intense music, and strategy games. It connects dots across ALL categories.

```
User loves: Inception (movie) → 5★
UniRec recommends:
  📚 "Dark Matter" by Blake Crouch (same mind-bending plot)
  🎵 Hans Zimmer's "Time" (same cinematic intensity)
  🎮 "Portal 2" (same puzzle-solving satisfaction)
```

### 3. 🗺️ Mood-to-Universe Mapping
> Your current mood maps to an entire universe of recommendations across all 8 categories simultaneously — not just one category.

```
Mood: Motivated 💪
→ 🎬 Rocky (movie)
→ 🎵 Eye of the Tiger (music)
→ 📚 Atomic Habits (book)
→ 🏋️ HIIT workout plan (fitness)
→ 🌍 Kilimanjaro trek (travel)
```

---

## 🏗️ Architecture

```
Task4-Recommendation-System/
│
├── 🐍 backend/
│   ├── app.py                 # Flask API + recommendation engine
│   │                          # Emotional DNA builder
│   │                          # Cross-category resonance
│   │                          # Mood-to-universe mapping
│   │                          # Auth (bcrypt + sessions)
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # GROQ_API_KEY (gitignored)
│
├── ⚛️  frontend/
│   ├── src/
│   │   ├── App.jsx            # Main dashboard + rec cards
│   │   ├── App.css            # Dark universe UI
│   │   ├── Auth.jsx           # Login + Register pages
│   │   ├── Auth.css           # Split-screen auth UI
│   │   ├── api.js             # Backend service layer
│   │   ├── main.jsx           # React entry point
│   │   └── index.css          # Global styles + animations
│   ├── index.html
│   ├── vite.config.js         # Proxy → backend :5002
│   └── package.json
│
├── .gitignore                 # .env + DB excluded
└── README.md
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/api/register` | Create new account |
| `POST` | `/api/login` | Login with username/email + password |
| `POST` | `/api/logout` | Clear session |
| `GET`  | `/api/me` | Get current user + Emotional DNA |

### Recommendations
| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/api/recommend` | Get AI recommendations (mood + category + DNA) |
| `GET`  | `/api/trending` | Get trending items by category |
| `POST` | `/api/search` | Search anything across all categories |

### User Data
| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/api/rate` | Rate an item (1-5 stars) |
| `POST` | `/api/save` | Save / unsave an item |
| `GET`  | `/api/saved` | Get all saved items |
| `GET`  | `/api/ratings` | Get all ratings |
| `GET`  | `/api/dna` | Get Emotional DNA fingerprint |
| `GET`  | `/health` | Backend health check |

### POST `/api/recommend` — Request
```json
{
  "mood": "excited",
  "category": "all",
  "query": "mind-bending stories"
}
```

### POST `/api/recommend` — Response
```json
{
  "recommendations": [
    {
      "title": "Inception",
      "category": "movies",
      "emoji": "🎬",
      "genre": "Sci-Fi Thriller",
      "year": "2010",
      "why": "Your love of mind-bending plots + excited mood = perfect match",
      "match_score": 97,
      "trending": false,
      "cross_resonance": "You rated Dark Knight 5★ → same director, same intensity"
    }
  ],
  "mood": "excited",
  "mood_emoji": "🤩",
  "emotional_dna": {"movies": 4.5, "books": 3.8, "dominant_mood": "excited"}
}
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Free [Groq API key](https://console.groq.com) — no credit card needed

### 1. Clone the repo
```bash
git clone https://github.com/dharani25007-code/CODSOFT.git
cd CODSOFT/Task4-Recommendation-System
```

### 2. Backend setup
```bash
cd backend
pip install -r requirements.txt
```

Create `.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
SECRET_KEY=your_secret_key_here
PORT=5002
```

Start backend:
```bash
python app.py
# ✅ Running at http://localhost:5002
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
# ✅ Running at http://localhost:3002
```

> Open two terminals — both must run simultaneously.

### 4. Get your free Groq API key
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up free — no credit card needed
3. **API Keys** → **Create API Key**
4. Paste into `backend/.env`

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite 5 | Dashboard UI + auth pages |
| **Backend** | Python 3.10 + Flask 3.0 | REST API server |
| **AI Model** | Groq LLaMA3.3-70B | Recommendation reasoning |
| **Auth** | Flask-Bcrypt + Sessions | Secure login system |
| **Database** | SQLite | Users, ratings, saves, moods |
| **Styling** | Pure CSS | Dark universe design system |

</div>

---

## 📸 Demo Flow

```
1. Register → Create your account
2. Pick mood → 😊 Happy / 💪 Motivated / 😩 Stressed etc.
3. Pick category → All / Movies / Music / Books etc.
4. Click Recommend Me → Groq AI generates personalized picks
5. Rate items → ★★★★★ to build your Emotional DNA
6. Save favourites → Click ♡ Save
7. Watch DNA evolve → Go to 🧬 My DNA tab
8. Search anything → "dark thriller" / "Italian food" / "indie games"
```

---

## 📄 License

MIT License — free to use and modify.

---

## 👨‍💻 Author

<div align="center">

<img src="https://github.com/dharani25007-code.png" width="100" style="border-radius:50%"/>

### Dharanidharan M

*CodSoft AI Intern — May Batch C2 2026*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Dharanidharan_M-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/dharani-dharan-m-370083376/)
[![GitHub](https://img.shields.io/badge/GitHub-dharani25007--code-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/dharani25007-code)

</div>

---

<div align="center">

**CodSoft AI Internship — Task 4 ✦**

<img src="https://capsule-render.vercel.app/api?type=waving&color=7c6fff&height=100&section=footer" width="100%"/>

</div>
