# CaptionVerse

CaptionVerse is an image captioning AI that turns an uploaded image into a concise natural-language caption. The app is built around the classic computer vision plus NLP pipeline from the assignment: a pretrained ResNet50 encoder extracts image features, and a transformer-based decoder turns those features into text.

The backend also returns extra captioning outputs like object predictions, emotion, story, hashtags, SEO tags, scene type, and color mood so the UI can show more than the base requirement without drifting away from it.

## What it does

- Upload or drag and drop an image
- Generate a single caption from that image
- Show the top ResNet50 visual concepts used for captioning
- Display extra analysis such as emotion, story, hashtags, SEO tags, and scene type
- Copy the caption to the clipboard
- Review a short explanation of the captioning pipeline

## How it works

1. The frontend sends the image to the Flask API.
2. The backend preprocesses the image and forwards it through the ResNet50 encoder.
3. The captioning transformer generates the main caption and the extra analysis fields.
4. The caption and supporting details are rendered in the result card.

## Project Structure

```text
captionverse/
├── backend/
│   ├── app.py
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
    ├── App.jsx
    ├── App.css
        ├── index.css
        └── main.jsx
```

## API

| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/api/caption` | Generate a caption from an uploaded image |
| `POST` | `/api/analyze` | Compatibility alias for `/api/caption` |
| `POST` | `/api/translate-caption` | Translate a caption into another language |
| `POST` | `/api/restyle` | Rewrite a caption in another style |
| `GET` | `/health` | Backend status, model, and pipeline info |

## Getting Started

```bash
# Backend
cd backend
pip install -r requirements.txt
python app.py

# Frontend
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3003` and proxies API requests to the Flask backend on `http://localhost:5003`.

## Environment

Create `backend/.env` with the optional decoder model configuration:

```env
CAPTION_DECODER_MODEL=google/flan-t5-small
PORT=5003
```

## Tech Stack

- Frontend: React 18, Vite
- Backend: Flask, Flask-CORS
- Image processing: Pillow
- Vision encoder: ResNet50 from torchvision
- Caption generation: transformer decoder from Hugging Face Transformers

## Notes

- The app is intentionally focused on one output: a clean caption.
- The wording, UI, and project description are aligned with the classic VGG/ResNet encoder plus RNN/transformer decoder architecture.
- Extra outputs are present, but the main requirement is still satisfied by the captioning pipeline.

