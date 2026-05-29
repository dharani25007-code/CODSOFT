<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=7c6fff&height=200&section=header&text=CaptionVerse&fontSize=70&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Visual%20Emotional%20Narrative%20Engine%20%7C%20CodSoft%20AI%20Internship%20Task%203&descAlignY=60&descAlign=50" width="100%"/>

<br/>

![CodSoft](https://img.shields.io/badge/CodSoft-Task%203-7c6fff?style=for-the-badge&logo=openai&logoColor=white)
![Batch](https://img.shields.io/badge/Batch-MAY%20C2%202026-ff6b6b?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLaMA3.3--70B-FF6B35?style=for-the-badge&logoColor=white)
![Status](https://img.shields.io/badge/Status-Completed-22c55e?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)

<br/>

> **CaptionVerse** is an AI-powered Visual Intelligence Engine that detects emotions, writes stories, identifies objects, generates hashtags, and translates captions into multiple languages — powered by a mix of PyTorch vision models and text decoders (BLIP / Flan-T5 by default). It integrates with Groq where configured.

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🧠 Visual Emotional Narrative Engine (VENE)
- Patent-worthy multi-dimensional image analysis
- Poet, journalist, comedian & storyteller — all at once
- Real-time style switching without re-uploading
- Confidence scores for every detection

</td>
<td width="50%">

### 📝 5 Caption Styles
- 💼 **Professional** — Formal & informative
- 🌸 **Poetic** — Lyrical & emotional
- 😂 **Funny** — Witty & humorous
- 📰 **News** — Breaking news style
- 📱 **Social** — Instagram ready

</td>
</tr>
<tr>
<td width="50%">

### 🎭 Scene Intelligence
- Emotion detection with confidence score
- Scene type classification
- Color mood analysis
- Object detection with confidence bars

</td>
<td width="50%">

### 🌍 Multi-language (7 languages)
- English, Tamil, Hindi
- French, Spanish, Arabic, Japanese
- Translate any caption instantly
- Per-language copy button

</td>
</tr>
</table>

---

## 🧠 Patent Innovation — Visual Emotional Narrative Engine (VENE)

Traditional image captioning describes **what** is in an image.

**VENE** understands the **feeling** of the image:

```
Input: Any image

VENE Output:
├── 📝 Caption (5 styles — switch instantly)
├── 🎭 Emotion detection + confidence score
├── 📖 3-sentence narrative story
├── 🔍 Object detection list with confidence bars
├── 🏷️ 12 hashtags + 8 SEO keywords
├── 🌍 Translation in 7 languages
└── 🎨 Color mood + scene type classification
```

---

## 🏗️ Architecture

```
Task3-Image-Captioning/captionverse/
├── backend/
│   ├── app.py              # Flask + PyTorch (ResNet50/BLIP) + decoder (Flan-T5 by default)
│   ├── requirements.txt    # Python dependencies
│   ├── .env                # GROQ_API_KEY, model overrides
│   ├── test_images/        # sample images (test_*.jpg)
│   └── __pycache__/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── App.jsx
│   │   ├── CaptionApp.jsx
│   │   ├── main.jsx
│   │   ├── App.css
│   │   ├── CaptionApp.css
│   │   └── index.css
│   └── dist/               # build output
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/api/analyze` | Full VENE analysis — caption, emotion, story, objects, hashtags |
| `POST` | `/api/translate-caption` | Translate caption to any of 7 languages |
| `POST` | `/api/restyle` | Restyle caption without re-uploading image |
| `GET`  | `/health` | Backend health check |

---

## 🚀 Getting Started

```bash
# Backend
cd backend
pip install -r requirements.txt
python app.py     # http://localhost:5003

# Frontend (new terminal)
cd frontend
npm install
npm run dev       # http://localhost:3003
```

Add your Groq API key to `backend/.env`:
```env
GROQ_API_KEY=your_key_here
GROQ_VISION_MODEL=meta-llama/llama-3.3-70b
PORT=5003
```

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite 5 | Split-screen UI |
| **Backend** | Python 3.10 + Flask | REST API |
| **Vision AI** | Groq LLaMA3.3-70B | Image understanding |
| **Text AI** | Groq LLaMA3.3-70B | Translation + restyling |
| **Image processing** | Pillow | Resize + compress |
| **Styling** | Pure CSS | Dark design system |

</div>

---

## 👨‍💻 Author

<div align="center">

### Dharanidharan M
*CodSoft AI Intern — May Batch C2 2026*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Dharanidharan_M-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/dharani-dharan-m-370083376/)
[![GitHub](https://img.shields.io/badge/GitHub-dharani25007--code-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/dharani25007-code)

</div>
