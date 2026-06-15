const BASE = "https://tictactoeai-vynh.onrender.com";

export async function fetchAIMove(board, aiMark, humanMark, size=3, difficulty="unbeatable", personality="strategic") {
  const res = await fetch(`${BASE}/api/ai-move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ board, aiMark, humanMark, size, difficulty, personality }),
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}
