<div align="center">



<br/>

![CodSoft](https://img.shields.io/badge/CodSoft-AI%20Internship-6c63ff?style=for-the-badge&logo=openai&logoColor=white)
![Batch](https://img.shields.io/badge/Batch-MAY%20C2%202026-ff6b6b?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLaMA3.3--70B-FF6B35?style=for-the-badge&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-22c55e?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)

<br/>

> **CodSoft AI Internship** — 5 tasks built with modern full-stack architecture, powered by **Groq LLaMA3.3-70B**, featuring unique UI/UX, patent-worthy innovations, sound effects, and novelties far beyond the basic requirements.

<br/>

[📋 Tasks](#-tasks) · [🚀 Getting Started](#-getting-started) · [🛠️ Tech Stack](#%EF%B8%8F-tech-stack) · [👨‍💻 Author](#-author)

</div>

---

## 📋 Tasks

<div align="center">

| # | Task | Tech | Status |
|---|---|---|---|
| 1 | **MoodBot** — Adaptive Emotional Resonance Chatbot | React + Node.js + Groq | ✅ Completed |
| 2 | **Tic-Tac-Toe AI** — Groq LLaMA3 powered game | React + Node.js + Groq | ✅ Completed |
| 3 | **Image Captioning** — CNN + Transformer | Python + Flask | 🔜 Coming soon |
| 4 | **UniRec** — Universal AI Recommendation Engine | React + Python + Flask + Groq | ✅ Completed |
| 5 | **Face Detection & Recognition** — Deep learning | Python + OpenCV | 🔜 Coming soon |

</div>

---

## ✅ Task 1 — MoodBot AI Chatbot

<table>
<tr>
<td width="50%">

### Features
- 🧠 **Adaptive Emotional Resonance Engine** — patent-worthy
- 😊 **Real-time mood detection** — 6 emotional states
- 🔄 **Auto personality switching** — based on your mood
- 🧘 **4 AI Personalities** — Therapist, Hype Friend, Zen Master, Tough Love
- 🌍 **Auto language detection** — English, Tamil, Hindi
- 🎤 **Voice input + TTS output** — Web Speech API
- 📜 **Full conversation memory**
- 📊 **Mood journey + summary**

</td>
<td width="50%">

### Architecture
```
Task1-Chatbot/
├── backend/
│   ├── server.js       # Express + Groq SDK
│   ├── package.json
│   └── .env            # GROQ_API_KEY
├── frontend/
│   ├── src/
│   │   ├── App.jsx     # Chat UI + voice + sound
│   │   ├── App.css     # Glassmorphism dark theme
│   │   └── api.js      # Backend service
│   └── vite.config.js
├── .gitignore
└── README.md
```

</td>
</tr>
</table>

### Run Task 1
```bash
# Backend
cd Task1-Chatbot/backend
npm install
node server.js          # http://localhost:5001

# Frontend (new terminal)
cd Task1-Chatbot/frontend
npm install
npm run dev             # http://localhost:3001
```

---

## ✅ Task 2 — Tic-Tac-Toe AI

<table>
<tr>
<td width="50%">

### Features
- 🤖 **Groq LLaMA3** as the AI brain — reasons about every move
- 🎯 **4 Difficulty levels** — Easy, Medium, Hard, Unbeatable
- 🧠 **4 AI Personalities** — Strategic, Aggressive, Defensive, Chaotic
- 📐 **4 Grid sizes** — 3×3, 4×4, 5×5, 6×6
- ⏱️ **Move timer** — 5s / 10s / 15s / 20s pressure mode
- 🏆 **Match mode** — First to 3 / 5 / 7 wins
- 🔊 **Sound effects** — Web Audio API
- 💡 **AI reasoning** — explains its move every turn
- 📜 **Move history log** — color-coded per player

</td>
<td width="50%">

### Architecture
```
Task2-TicTacToe-AI/
├── backend/
│   ├── server.js       # Express + Groq SDK
│   ├── package.json
│   └── .env            # GROQ_API_KEY
├── frontend/
│   ├── src/
│   │   ├── App.jsx     # Game logic + UI
│   │   ├── App.css     # Dark design system
│   │   └── api.js      # Backend service
│   └── vite.config.js
├── .gitignore
└── README.md
```

</td>
</tr>
</table>

### Run Task 2
```bash
# Backend
cd Task2-TicTacToe-AI/backend
npm install
node server.js          # http://localhost:5000

# Frontend (new terminal)
cd Task2-TicTacToe-AI/frontend
npm install
npm run dev             # http://localhost:3000
```

---

## ✅ Task 4 — UniRec Universal AI Recommendation Engine

<table>
<tr>
<td width="50%">

### Features
- 🌍 **8 Categories** — Movies, Music, Books, Games, Food, Fitness, Travel, Apps
- 🧬 **Emotional DNA Fingerprint** — unique preference profile
- 🔗 **Cross-Category Resonance** — connects dots across categories
- 🗺️ **Mood-to-Universe Mapping** — 8 moods × 8 categories
- 🔐 **Login / Register** — bcrypt auth + sessions
- ⭐ **Rate & Save** — 5-star ratings + favourites
- 🔍 **Universal search** — find anything
- 📱 **Real links** — IMDb, Spotify, Goodreads, Steam

</td>
<td width="50%">

### Architecture
```
Task4-Recommendation-System/
├── backend/
│   ├── app.py          # Flask + Groq + SQLite
│   ├── requirements.txt
│   └── .env            # GROQ_API_KEY
├── frontend/
│   ├── src/
│   │   ├── App.jsx     # Dashboard + rec cards
│   │   ├── Auth.jsx    # Login + Register
│   │   ├── App.css     # Dark universe UI
│   │   └── api.js      # Backend service
│   └── vite.config.js
├── .gitignore
└── README.md
```

</td>
</tr>
</table>

### Run Task 4
```bash
# Backend
cd Task4-Recommendation-System/backend
pip install -r requirements.txt
python app.py           # http://localhost:5002

# Frontend (new terminal)
cd Task4-Recommendation-System/frontend
npm install
npm run dev             # http://localhost:3002
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Free [Groq API key](https://console.groq.com) — no credit card needed

### Clone the repo
```bash
git clone https://github.com/dharani25007-code/CODSOFT.git
cd CODSOFT
```

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Used in |
|---|---|---|
| **Frontend** | React 18 + Vite 5 | Tasks 1, 2, 4 |
| **Backend** | Node.js + Express | Tasks 1, 2 |
| **Backend** | Python 3.10 + Flask | Task 4 |
| **AI Model** | Groq LLaMA3.3-70B | Tasks 1, 2, 4 |
| **Fallback AI** | Minimax + Alpha-Beta Pruning | Task 2 |
| **Database** | SQLite | Task 4 |
| **Auth** | Flask-Bcrypt + Sessions | Task 4 |
| **CV Models** | OpenCV + PyTorch | Tasks 3, 5 |
| **Styling** | Pure CSS (custom dark theme) | All tasks |
| **Audio** | Web Audio API | Tasks 1, 2 |
| **Voice** | Web Speech API | Task 1 |

</div>

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

**Built with passion for the CodSoft AI Internship ✦**

<img src="https://capsule-render.vercel.app/api?type=waving&color=6c63ff&height=100&section=footer" width="100%"/>

</div>