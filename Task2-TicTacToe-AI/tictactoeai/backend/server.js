require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

// Generate win lines for any grid size
function getWinLines(size) {
  const lines = [];
  // rows
  for (let r = 0; r < size; r++) {
    lines.push(Array.from({length: size}, (_, c) => r * size + c));
  }
  // cols
  for (let c = 0; c < size; c++) {
    lines.push(Array.from({length: size}, (_, r) => r * size + c));
  }
  // diagonals
  lines.push(Array.from({length: size}, (_, i) => i * size + i));
  lines.push(Array.from({length: size}, (_, i) => i * size + (size - 1 - i)));
  return lines;
}

function checkWinner(board, size) {
  const lines = getWinLines(size);
  for (const line of lines) {
    const first = board[line[0]];
    if (first && line.every(i => board[i] === first)) return first;
  }
  if (board.every(x => x)) return "draw";
  return null;
}

// Minimax for 3x3 only (too slow for larger)
function minimax(board, isMax, alpha, beta, aiMark, humanMark, size) {
  const res = checkWinner(board, size);
  if (res === aiMark) return 10;
  if (res === humanMark) return -10;
  if (res === "draw") return 0;
  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = aiMark;
        best = Math.max(best, minimax(board, false, alpha, beta, aiMark, humanMark, size));
        board[i] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = humanMark;
        best = Math.min(best, minimax(board, true, alpha, beta, aiMark, humanMark, size));
        board[i] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  }
}

function getBestMinimax(board, aiMark, humanMark, size) {
  let best = -Infinity, move = -1;
  for (let i = 0; i < board.length; i++) {
    if (!board[i]) {
      board[i] = aiMark;
      const score = minimax(board, false, -Infinity, Infinity, aiMark, humanMark, size);
      board[i] = null;
      if (score > best) { best = score; move = i; }
    }
  }
  return move;
}

// Heuristic move for larger boards (4x4, 5x5, 6x6)
function getHeuristicMove(board, aiMark, humanMark, size, difficulty) {
  const empty = board.map((v,i)=>i).filter(i=>!board[i]);
  const lines = getWinLines(size);

  // Easy: random
  if (difficulty === "easy") return empty[Math.floor(Math.random() * empty.length)];

  // Check win / block
  for (const mark of [aiMark, humanMark]) {
    for (const line of lines) {
      const vals = line.map(i => board[i]);
      const filled = vals.filter(v => v === mark).length;
      const empties = line.filter(i => !board[i]);
      if (filled === size - 1 && empties.length === 1) {
        if (mark === aiMark || difficulty !== "easy") return empties[0];
      }
    }
  }

  // Medium: 50% random
  if (difficulty === "medium" && Math.random() < 0.5) return empty[Math.floor(Math.random() * empty.length)];

  // Prefer center, then corners, then edges
  const center = Math.floor(board.length / 2);
  if (!board[center]) return center;
  const corners = [0, size-1, size*(size-1), size*size-1];
  for (const c of corners) if (!board[c]) return c;
  return empty[Math.floor(Math.random() * empty.length)];
}

const PERSONALITY_PROMPTS = {
  aggressive: "You play aggressively — always prioritize winning over blocking. If you can extend your own line, do it even if the human might win next turn.",
  defensive: "You play defensively — always block the human first before trying to win yourself.",
  chaotic: "You play chaotically — mix random moves with occasional brilliant ones. Be unpredictable.",
  strategic: "You play strategically — perfectly balance offense and defense. Think 2 moves ahead.",
};

app.get("/health", (req, res) => {
  res.json({ status: "ok", model: process.env.GROQ_MODEL });
});

app.post("/api/ai-move", async (req, res) => {
  const { board, aiMark, humanMark, size = 3, difficulty = "unbeatable", personality = "strategic" } = req.body;

  if (!board || board.length !== size * size) {
    return res.status(400).json({ error: "Invalid board" });
  }

  const empty = board.map((v,i)=>i).filter(i=>!board[i]);
  if (empty.length === 0) return res.status(400).json({ error: "Board is full" });

  // Easy/Medium use heuristic (fast)
  if (difficulty === "easy" || difficulty === "medium") {
    const move = getHeuristicMove([...board], aiMark, humanMark, size, difficulty);
    return res.json({ move, reasoning: difficulty === "easy" ? "Playing casually..." : "Thinking a little...", source: "heuristic" });
  }

  // Hard/Unbeatable on 3x3 — use Minimax
  if (size === 3 && difficulty === "unbeatable") {
    const move = getBestMinimax([...board], aiMark, humanMark, size);
    return res.json({ move, reasoning: "Minimax: optimal move calculated.", source: "minimax" });
  }

  // Groq LLaMA3 for hard/unbeatable on larger boards
  try {
    const rows = [];
    for (let r = 0; r < size; r++) {
      rows.push(board.slice(r*size, r*size+size).map((v,i)=>v||(r*size+i)).join(" | "));
    }
    const boardDisplay = rows.join("\n" + "-".repeat(size*4) + "\n");
    const personalityNote = PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.strategic;

    const prompt = `You are a Tic-Tac-Toe AI on a ${size}x${size} board playing as '${aiMark}'.
Personality: ${personalityNote}
Difficulty: ${difficulty}

Board:
${boardDisplay}

Legend: numbers=empty cell index, X/O=taken.
Empty cells: [${empty.join(", ")}]
Win condition: ${size} in a row (horizontal, vertical, or diagonal).

Rules:
1. WIN if possible (${size} in a row)
2. BLOCK human ('${humanMark}') from winning
3. Apply your personality style
4. Pick from empty cells only: [${empty.join(", ")}]

Respond ONLY in this JSON:
{"move": <index>, "reasoning": "<one short sentence>"}`;

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
      temperature: personality === "chaotic" ? 0.8 : 0.1,
    });

    const text = completion.choices[0]?.message?.content?.trim() || "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    const move = parseInt(parsed.move);

    if (!isNaN(move) && empty.includes(move)) {
      return res.json({ move, reasoning: parsed.reasoning, source: "groq-llama3" });
    }
    throw new Error("Invalid Groq move");
  } catch (err) {
    console.error("Groq error, heuristic fallback:", err.message);
    const move = getHeuristicMove([...board], aiMark, humanMark, size, "hard");
    return res.json({ move, reasoning: "Heuristic fallback.", source: "heuristic-fallback" });
  }
});

app.post("/api/game-state", (req, res) => {
  const { board, size = 3 } = req.body;
  const lines = getWinLines(size);
  const winner = checkWinner(board, size);
  const winCells = winner && winner !== "draw"
    ? (lines.find(line => { const f = board[line[0]]; return f && line.every(i => board[i] === f); }) || [])
    : [];
  res.json({ winner, winCells });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🤖 Tic-Tac-Toe AI Backend → http://localhost:${PORT}`);
  console.log(`   Model : ${process.env.GROQ_MODEL}`);
  console.log(`   Sizes : 3x3 4x4 5x5 6x6`);
  console.log(`   Modes : Easy Medium Hard Unbeatable\n`);
});
