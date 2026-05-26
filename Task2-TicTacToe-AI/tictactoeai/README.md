# Tic-Tac-Toe AI — Groq + LLaMA3

> CodSoft AI Internship — Task 2

A full-stack Tic-Tac-Toe game where the AI opponent is powered by **Groq's LLaMA3-8B** model, with a **Minimax + Alpha-Beta Pruning** fallback for unbeatable play.

---

## Features

- **LLaMA3 AI** — Groq LLM reasons about the board and explains its move
- **Minimax fallback** — classic unbeatable algorithm if Groq is unavailable  
- **Switch AI modes** — toggle between LLaMA3 and Minimax mid-game
- **Move history log** — see every move in sequence
- **AI reasoning** — the AI explains why it picked its move
- **Score tracker** — persists across games
- **Play as X or O** — AI goes first when you're O
- **Stunning dark UI** — animated grid, smooth transitions, game-over overlay

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite |
| Backend | Node.js, Express |
| AI | Groq SDK (`llama3-8b-8192`) |
| Fallback | Minimax + Alpha-Beta Pruning |
| Styling | Pure CSS (custom design system) |

---

## Project Structure

```
tictactoe-groq-ai/
├── backend/
│   ├── server.js        # Express API + Minimax logic
│   ├── package.json
│   └── .env             # GROQ_API_KEY (never commit)
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main game component
│   │   ├── App.css      # Full dark UI styles
│   │   ├── api.js       # Backend service layer
│   │   ├── main.jsx
│   │   └── index.css    # Global styles + animations
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## Setup & Run

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/CODSOFT.git
cd CODSOFT/tictactoe-groq-ai
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env      # Add your GROQ_API_KEY
node server.js
# Runs on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# Runs on http://localhost:3000
```

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Check backend + model status |
| POST | `/api/ai-move` | Get AI's next move (Groq or Minimax) |
| POST | `/api/game-state` | Check winner + winning cells |

### POST `/api/ai-move`
```json
{
  "board": [null, "X", null, "O", null, null, null, null, null],
  "aiMark": "O",
  "humanMark": "X",
  "useGroq": true
}
```
Response:
```json
{
  "move": 4,
  "reasoning": "Taking center to maximize winning lines",
  "source": "groq-llama3"
}
```

---

## Algorithm

The backend implements both:

1. **Groq LLaMA3** — sends board state as a structured prompt, parses JSON response for move + reasoning
2. **Minimax with Alpha-Beta Pruning** — classic recursive game tree search, evaluates every possible outcome in O(b^d) pruned to near O(b^(d/2))

---

## Environment Variables

```env
# backend/.env
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama3-8b-8192
PORT=5000
```

Get a free key at [console.groq.com](https://console.groq.com)

---

Made with React + Express + Groq
