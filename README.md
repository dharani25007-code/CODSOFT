div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=6c63ff&height=200&section=header&text=CODSOFT&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=AI%20Internship%20%7C%20May%20Batch%20C2%20%7C%202026&descAlignY=60&descAlign=50" width="100%"/>


<br/>

![CodSoft](https://img.shields.io/badge/CodSoft-AI%20Internship-6c63ff?style=for-the-badge&logo=openai&logoColor=white)
![Batch](https://img.shields.io/badge/Batch-MAY%20C2%202026-ff6b6b?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-2.3-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-4.10-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLaMA3.3--70B-FF6B35?style=for-the-badge&logoColor=white)
![Tasks](https://img.shields.io/badge/Tasks-5%2F5%20Completed-22c55e?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)

<br/>

> **CodSoft AI Internship — May Batch C2 2026** — All 5 tasks completed with modern full-stack architecture, powered by **Groq LLaMA3.3-70B**, featuring unique UI/UX, patent-worthy innovations, sound effects, and novelties far beyond the basic requirements.

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
| 3 | **CaptionVerse** — VGG16/ResNet50 + Transformer captioning | Python + Flask + PyTorch + Groq | ✅ Completed |
| 4 | **UniRec** — Universal AI Recommendation Engine | React + Python + Flask + Groq | ✅ Completed |
| 5 | **FaceVerse** — Haar + DNN Face Detection & Recognition | Python + Flask + OpenCV + Groq | ✅ Completed |

</div>

---

## ✅ Task 1 — MoodBot AI Chatbot

<table>
<tr>
<td width="50%">

### Features
- 🧠 **Adaptive Emotional Resonance Engine** — patent-worthy
- 😊 **Real-time mood detection** — keyword pattern matching
- 🔄 **Auto personality switching** — if-else rule system
- 🧘 **4 AI Personalities** — Therapist, Hype Friend, Zen Master, Tough Love
- 🌍 **Auto language detection** — English, Tamil, Hindi
- 🎤 **Voice input + TTS output** — Web Speech API
- 📜 **Full conversation memory**
- 📊 **Mood journey + summary**

</td>
<td width="50%">

### Pipeline
```mermaid
flowchart LR
    U["User Input<br>(text / voice)"] --> F["Frontend UI"]
    F --> API["API / WebSocket"]
    API --> MD["Backend Mood & Intent Detector"]
    MD --> PS{Personality Selector}
    PS --> P1[Therapist]
    PS --> P2["Hype Friend"]
    PS --> P3["Zen Master"]
    PS --> P4["Tough Love"]
    P1 --> RESP["Groq LLaMA3.3-70B Response"]
    P2 --> RESP
    P3 --> RESP
    P4 --> RESP
    RESP --> PP["Post-processing<br>(memory, safety, tags)"]
    PP --> OUT["TTS (optional) / Text Output"]
    OUT --> F
```

### Architecture
```text
Task1-Chatbot/
├── backend/
│   ├── server.js       # Express + Groq SDK
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── vite.config.js
└── README.md
```

</td>
</tr>
</table>

### Run Task 1
```bash
cd Task1-Chatbot/backend && npm install && node server.js   # :5001
cd Task1-Chatbot/frontend && npm install && npm run dev     # :3001
```

---

## ✅ Task 2 — Tic-Tac-Toe AI

<table>
<tr>
<td width="50%">

### Features
- 🤖 **Groq LLaMA3** as the AI brain
- 🎯 **4 Difficulty levels** — Easy, Medium, Hard, Unbeatable
- 🧠 **4 AI Personalities** — Strategic, Aggressive, Defensive, Chaotic
- 📐 **4 Grid sizes** — 3×3, 4×4, 5×5, 6×6
- ⏱️ **Move timer** — pressure mode
- 🏆 **Match mode** — First to 3/5/7 wins
- 🔊 **Sound effects** — Web Audio API
- 💡 **AI reasoning** — explains every move

</td>
<td width="50%">

### Pipeline
```mermaid
flowchart LR
    P["Player Action"] --> F[Frontend]
    F --> API["API Call"]
    API --> S["Server Game Logic"]
    S --> AI{AI Decision}
    AI --> GReq["Groq LLaMA3.3-70B<br>(strategy hint)"]
    AI --> Minimax["Minimax + Alpha-Beta<br>(fallback / precise move)"]
    GReq --> Move["Select Move"]
    Minimax --> Move
    Move --> S
    S --> State["Update Board & History"]
    State --> F
    State --> Analytics["Move explanation + metrics"]
```

### Architecture
```text
Task2-TicTacToe-AI/
├── backend/
│   ├── server.js       # Express + Groq + Minimax
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── vite.config.js
└── README.md
```

</td>
</tr>
</table>

### Run Task 2
```bash
cd Task2-TicTacToe-AI/backend && npm install && node server.js   # :5000
cd Task2-TicTacToe-AI/frontend && npm install && npm run dev     # :3000
```

---

## ✅ Task 3 — CaptionVerse Image Captioning

<table>
<tr>
<td width="50%">

### Features
- 🖼️ **VGG16** — 138M param CNN feature extractor
- 🖼️ **ResNet50** — 25M param residual CNN extractor
- 🤖 **Groq LLaMA4 Scout** — Transformer caption decoder
- 📝 **5 Caption styles** — Professional, Poetic, Funny, News, Social
- 🎭 **Emotion detection** — confidence score
- 📖 **Scene storytelling** — 3-sentence narrative
- 🔍 **Object detection** — with confidence bars
- 🌍 **7 language translation**
- 🏷️ **12 hashtags + 8 SEO tags**

</td>
<td width="50%">

### Pipeline
```mermaid
flowchart LR
    A["Input Image"] --> B["Preprocessing<br>Resize / Normalize"]
    B --> C1["VGG16<br>Feature Extractor"]
    B --> C2["ResNet50<br>Feature Extractor"]
    C1 --> D["Feature Fusion<br>4096 / 2048-dim embeddings"]
    C2 --> D
    D --> E["Groq LLaMA4 Scout<br>Caption Decoder"]
    E --> F["Caption Styles<br>Professional / Poetic / Funny / News / Social"]
    E --> G["Scene Storytelling<br>Emotion + Narrative"]
    E --> H["SEO Layer<br>Hashtags + Tags + Translation"]
    F --> I["Final Output"]
    G --> I
    H --> I
```

</td>
</tr>
</table>
 
### Architecture
```text
Task3-Image-Captioning/captionverse/
├── backend/
│   ├── app.py              # Flask + PyTorch (ResNet50/BLIP) + decoder (Flan-T5 / Groq)
│   ├── requirements.txt    # Python dependencies
│   ├── .env                # GROQ_API_KEY, model overrides
│   ├── models/             # saved encoders / checkpoint (optional)
│   └── test_images/        # sample images
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── CaptionApp.jsx
│       ├── main.jsx
│       ├── App.css
│       └── index.css
└── README.md
```

### Run Task 3
```bash
cd Task3-Image-Captioning/backend
pip install -r requirements.txt
python app.py                          # :5003

cd Task3-Image-Captioning/frontend
npm install && npm run dev             # :3003
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

### Pipeline
```mermaid
flowchart LR
    U["User Profile / Event"] --> Ingest["Ingestion & Preprocessing"]
    Ingest --> FS["Feature Store / Embeddings"]
    FS --> Model["Recommendation Engine<br>(Groq + Collaborative / Content)"]
    Model --> Rank["Scoring & Ranking"]
    Rank --> Serve["API / Frontend"]
    Serve --> Feedback["User Feedback Loop"]
    Feedback --> Ingest
```

### Architecture
```text
Task4-Recommendation-System/
├── backend/
│   ├── app.py          # Flask + Groq + SQLite
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Auth.jsx
│   │   └── api.js
│   └── vite.config.js
└── README.md
```

</td>
</tr>
</table>

### Run Task 4
```bash
cd Task4-Recommendation-System/backend
pip install -r requirements.txt
python app.py                          # :5002

cd Task4-Recommendation-System/frontend
npm install && npm run dev             # :3002
```

---

## ✅ Task 5 — FaceVerse Facial Intelligence Engine

<table>
<tr>
<td width="50%">

### Features
- 🔍 **Haar Cascade** — OpenCV classic face detector
- 🧠 **DNN SSD ResNet** — Deep learning face detector
- 😊 **Emotion recognition** — 7 emotions per face via Groq
- 👤 **Age & gender estimation** — per face with confidence
- 👥 **Crowd analysis** — count + density + area metric
- 🎥 **Live webcam** — real-time detection stream
- 🏷️ **Face registry** — register names + SQLite storage
- 📊 **Detection history** — stats dashboard
- 🖼️ **Annotated output** — bounding boxes drawn on image

</td>
<td width="50%">

### Pipeline
```mermaid
flowchart TB
    A["Image / Webcam Stream"] --> B["Frame Capture + Preprocessing"]
    B --> C{Face Detection}
    C --> C1["Haar Cascade<br>Fast classical detector"]
    C --> C2["DNN SSD ResNet<br>Deep detection"]
    C1 --> D["Face Crops + Bounding Boxes"]
    C2 --> D
    D --> E["Groq LLaMA3.3-70B<br>Emotion / Age / Gender"]
    D --> F["Face Registry<br>Name lookup + SQLite"]
    D --> G["Crowd Analysis Engine<br>Count / Density / Area"]
    E --> H["Insights Aggregator"]
    F --> H
    G --> H
    H --> I["Annotated Output<br>Dashboard + Intelligence Report"]
```

</td>
</tr>
</table>
 
### Architecture
```text
Task5-Face-Detection/faceverse/
├── backend/
│   ├── app.py                  # Flask + OpenCV + Groq inference hooks
│   ├── requirements.txt
│   ├── models/
│   │   ├── deploy.prototxt
│   │   └── res10_300x300_ssd_iter_140000.caffemodel
│   ├── .env
│   └── recordings/             # optional saved frames / history
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── App.css
│       └── index.css
└── README.md
```

### Run Task 5
```bash
cd Task5-Face-Detection/backend
pip install -r requirements.txt
python app.py                          # :5004

cd Task5-Face-Detection/frontend
npm install && npm run dev             # :3004
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
| **Frontend** | React 18 + Vite 5 | Tasks 1, 2, 3, 4, 5 |
| **Backend** | Node.js + Express | Tasks 1, 2 |
| **Backend** | Python 3.10 + Flask | Tasks 3, 4, 5 |
| **AI Model** | Groq LLaMA3.3-70B | Tasks 1, 2, 4, 5 |
| **Vision AI** | Groq LLaMA4 Scout | Task 3 |
| **CNN Models** | VGG16 + ResNet50 (PyTorch) | Task 3 |
| **Face Detector** | Haar Cascade + DNN SSD ResNet | Task 5 |
| **Fallback AI** | Minimax + Alpha-Beta Pruning | Task 2 |
| **Database** | SQLite | Tasks 4, 5 |
| **Auth** | Flask-Bcrypt + Sessions | Task 4 |
| **CV Library** | OpenCV 4.10 | Task 5 |
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

**All 5 tasks completed — CodSoft AI Internship ✦**

<img src="https://capsule-render.vercel.app/api?type=waving&color=6c63ff&height=100&section=footer" width="100%"/>

</div>
