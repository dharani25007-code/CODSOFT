<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=00d4aa&height=200&section=header&text=FaceVerse&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Facial%20Intelligence%20Engine%20%7C%20CodSoft%20AI%20Internship%20Task%205&descAlignY=60&descAlign=50" width="100%"/>

<br/>

![CodSoft](https://img.shields.io/badge/CodSoft-Task%205-00d4aa?style=for-the-badge&logo=openai&logoColor=white)
![Batch](https://img.shields.io/badge/Batch-MAY%20C2%202026-ff6b6b?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-4.10-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLaMA3.3--70B-FF6B35?style=for-the-badge&logoColor=white)
![Status](https://img.shields.io/badge/Status-Completed-22c55e?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)

<br/>

> **FaceVerse** is a Facial Intelligence Engine that goes far beyond basic face detection. It uses **Haar Cascades + DNN deep learning detectors**, analyzes emotions, estimates age & gender, performs crowd analysis, and maintains a face registry — all powered by **OpenCV + Groq LLaMA3.3**.

<br/>

[✨ Features](#-features) · [🧠 Innovation](#-patent-innovation) · [🏗️ Architecture](#%EF%B8%8F-architecture) · [🔌 API](#-api-endpoints) · [🚀 Setup](#-getting-started) · [👨‍💻 Author](#-author)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔍 Dual Face Detection
- **Haar Cascade** — OpenCV classic, fast, lightweight
- **DNN SSD ResNet** — Deep learning, high accuracy
- Switchable detector in UI
- Compare Haar vs DNN results side by side
- Confidence scores per detection

</td>
<td width="50%">

### 😊 Emotion Recognition
- Groq LLaMA3 analyzes facial context
- 7 emotions: happy, sad, angry, surprised, neutral, fearful, disgusted
- Per-face confidence score
- Natural language description per face

</td>
</tr>
<tr>
<td width="50%">

### 👤 Age & Gender Estimation
- Age range estimation per face
- Gender classification with confidence
- Works on multiple faces simultaneously

</td>
<td width="50%">

### 👥 Crowd Analysis
- Total face count
- Density classification (individual → dense crowd)
- Faces per area calculation
- Detection log history

</td>
</tr>
<tr>
<td width="50%">

### 🎥 Live Webcam Detection
- Real-time camera stream
- Capture & analyze any frame
- Live mode — auto-detects every 2 seconds
- Face count badge overlay

</td>
<td width="50%">

### 🏷️ Face Registry
- Register known faces with names
- SQLite persistent storage
- Delete registered faces
- Detection history log

</td>
</tr>
</table>

---

## 🧠 Patent Innovation — Facial Intelligence Orchestration Engine (FIOE)

Traditional face detection just draws boxes.

**FIOE** builds a complete intelligence profile of every face:

```
📷 Input Image / 🎥 Webcam Frame
           │
           ▼
┌──────────────────────────────┐
│  Step 1: Dual Detection      │
│  Haar Cascade (OpenCV)       │
│  + DNN SSD ResNet            │
│  → Best faces selected       │
└──────────────┬───────────────┘
               │ Face bounding boxes
               ▼
┌──────────────────────────────┐
│  Step 2: Groq Intelligence   │
│  LLaMA3.3-70B analyzes:      │
│  • Emotion + confidence      │
│  • Age range estimation      │
│  • Gender classification     │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Step 3: Crowd Analysis      │
│  • Count → density mapping   │
│  • Faces per area metric     │
│  • Log to SQLite             │
└──────────────┬───────────────┘
               │
               ▼
📊 Annotated image + Full intelligence report
```

| CodSoft Requirement | Implementation |
|---|---|
| Face detection | ✅ Haar Cascades (OpenCV) |
| Deep learning detector | ✅ DNN SSD ResNet10 |
| Face recognition | ✅ Face registry with name labeling |
| Images | ✅ Image upload with drag & drop |
| Videos | ✅ Live webcam stream |

---

## 🏗️ Architecture

```
Task5-Face-Detection/
├── 🐍 backend/
│   ├── app.py                 # Flask API
│   │                          # Haar Cascade detector
│   │                          # DNN SSD ResNet detector
│   │                          # Groq emotion + age/gender
│   │                          # Crowd analysis engine
│   │                          # Face registry (SQLite)
│   │                          # Image annotation (OpenCV)
│   ├── requirements.txt
│   ├── models/                # Auto-downloaded on startup
│   │   ├── deploy.prototxt
│   │   └── res10_300x300_ssd_iter_140000.caffemodel
│   └── .env
│
├── ⚛️  frontend/
│   ├── src/
│   │   ├── App.jsx            # Full UI — image + webcam + registry + stats
│   │   ├── App.css            # Dark teal design system
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/api/analyze` | Detect faces + emotion + age/gender + crowd analysis |
| `POST` | `/api/register-face` | Register a face with a name |
| `GET`  | `/api/registry` | List all registered faces |
| `DELETE` | `/api/registry/<id>` | Remove a registered face |
| `GET`  | `/api/stats` | Detection history + totals |
| `GET`  | `/health` | Backend health check |

### POST `/api/analyze` — Request
```json
{
  "image": "data:image/jpeg;base64,...",
  "detector": "dnn"
}
```

### POST `/api/analyze` — Response
```json
{
  "face_count": 2,
  "faces": [{"x":100,"y":80,"w":120,"h":120,"method":"Deep Learning (SSD ResNet)","confidence":96.5}],
  "emotions": [{"face_id":1,"emotion":"happy","emotion_confidence":88,"emotion_emoji":"😊","description":"..."}],
  "age_gender": [{"face_id":1,"age_range":"25-32","gender":"Female","gender_confidence":85}],
  "crowd": {"face_count":2,"density":"small group","density_emoji":"👥","note":"Small group detected."},
  "annotated_image": "base64...",
  "haar_count": 2,
  "dnn_count": 2
}
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Free [Groq API key](https://console.groq.com)

### 1. Clone the repo
```bash
git clone https://github.com/dharani25007-code/CODSOFT.git
cd CODSOFT/Task5-Face-Detection
```

### 2. Backend setup
```bash
cd backend
pip install -r requirements.txt
```

Create `.env`:
```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
PORT=5004
```

Start backend:
```bash
python app.py
# ✅ Running at http://localhost:5004
# ✅ Haar Cascade loaded
# ✅ DNN model auto-downloaded
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
# ✅ Running at http://localhost:3004
```

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite 5 | UI — image, webcam, registry, stats |
| **Backend** | Python 3.10 + Flask | REST API server |
| **Detector 1** | Haar Cascade (OpenCV) | Classic fast face detection |
| **Detector 2** | DNN SSD ResNet (OpenCV) | Deep learning face detection |
| **Emotion AI** | Groq LLaMA3.3-70B | Emotion + age + gender analysis |
| **Database** | SQLite | Face registry + detection log |
| **Styling** | Pure CSS | Dark teal design system |

</div>

---

## 📄 License

MIT License — free to use and modify.

---

## 👨‍💻 Author

<div align="center">

### Dharanidharan M
*CodSoft AI Intern — May Batch C2 2026*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Dharanidharan_M-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/dharani-dharan-m-370083376/)
[![GitHub](https://img.shields.io/badge/GitHub-dharani25007--code-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/dharani25007-code)

</div>

