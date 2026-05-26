import { useState, useEffect, useCallback, useRef } from "react";
import { fetchAIMove, fetchHealth } from "./api.js";
import "./App.css";

function getWinLines(size) {
  const lines = [];
  for (let r = 0; r < size; r++) lines.push(Array.from({length:size},(_,c)=>r*size+c));
  for (let c = 0; c < size; c++) lines.push(Array.from({length:size},(_,r)=>r*size+c));
  lines.push(Array.from({length:size},(_,i)=>i*size+i));
  lines.push(Array.from({length:size},(_,i)=>i*size+(size-1-i)));
  return lines;
}

function checkWinnerLocal(board, size) {
  for (const line of getWinLines(size)) {
    const f = board[line[0]];
    if (f && line.every(i => board[i] === f)) return { winner: f, cells: line };
  }
  if (board.every(x => x)) return { winner: "draw", cells: [] };
  return null;
}

const PERSONALITIES = [
  { id: "strategic", label: "Strategic", emoji: "🧠", desc: "Balanced & optimal" },
  { id: "aggressive", label: "Aggressive", emoji: "⚔️", desc: "Always attacks" },
  { id: "defensive", label: "Defensive", emoji: "🛡️", desc: "Always blocks" },
  { id: "chaotic", label: "Chaotic", emoji: "🎲", desc: "Unpredictable" },
];

const DIFFICULTIES = [
  { id: "easy",       label: "Easy",       color: "#34d399" },
  { id: "medium",     label: "Medium",     color: "#fbbf24" },
  { id: "hard",       label: "Hard",       color: "#f87171" },
  { id: "unbeatable", label: "Unbeatable", color: "#a78bfa" },
];

const GRID_SIZES = [3, 4, 5, 6];

const TAUNT_MAP = {
  strategic:  { thinking: ["Calculating optimal move…","Evaluating all futures…","Processing…"], win: ["Flawless logic wins again.","You never had a chance."], lose: ["Impressive. Truly.","You outplayed me this time."] },
  aggressive: { thinking: ["Going for the kill…","Attack mode ON…","Hunting your pieces…"], win: ["Obliterated!","No mercy."], lose: ["You survived my assault?!","Lucky escape."] },
  defensive:  { thinking: ["Building my fortress…","Blocking your plans…","Fortifying…"], win: ["Patience wins every time.","Defense is the best offense."], lose: ["My wall had a crack.","You found the gap."] },
  chaotic:    { thinking: ["??????????","Spinning the wheel…","Rolling dice…"], win: ["CHAOS REIGNS!","Random wins baby!"], lose: ["Even chaos can lose.","The entropy betrayed me."] },
};

function randomFrom(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

// Sound engine
function createBeep(freq=440, dur=0.08, type="sine", vol=0.3) {
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
    osc.start(); osc.stop(ctx.currentTime+dur);
  } catch {}
}

const SFX = {
  place:  () => createBeep(600, 0.07, "sine", 0.25),
  aiMove: () => createBeep(400, 0.07, "triangle", 0.2),
  win:    () => { createBeep(523,0.12,"sine",0.3); setTimeout(()=>createBeep(659,0.12,"sine",0.3),120); setTimeout(()=>createBeep(784,0.2,"sine",0.3),240); },
  lose:   () => { createBeep(300,0.15,"sawtooth",0.25); setTimeout(()=>createBeep(250,0.3,"sawtooth",0.2),150); },
  draw:   () => createBeep(440, 0.3, "triangle", 0.2),
  tick:   () => createBeep(880, 0.04, "sine", 0.15),
  alarm:  () => { createBeep(1000,0.08,"square",0.3); setTimeout(()=>createBeep(800,0.08,"square",0.3),100); },
};

const TIMER_OPTIONS = [0, 5, 10, 15, 20]; // 0 = off
const MATCH_WINS_OPTIONS = [3, 5, 7];

export default function App() {
  // Settings
  const [gridSize, setGridSize] = useState(3);
  const [difficulty, setDifficulty] = useState("unbeatable");
  const [personality, setPersonality] = useState("strategic");
  const [playerMark, setPlayerMark] = useState("X");
  const [timerSecs, setTimerSecs] = useState(0);
  const [matchWins, setMatchWins] = useState(5);
  const [soundOn, setSoundOn] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Game state
  const [board, setBoard] = useState(() => Array(9).fill(null));
  const [gameResult, setGameResult] = useState(null);
  const [winCells, setWinCells] = useState([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Your turn");
  const [reasoning, setReasoning] = useState("");
  const [lastMoveIdx, setLastMoveIdx] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [backendOnline, setBackendOnline] = useState(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Scores (match mode)
  const [scores, setScores] = useState({ player: 0, ai: 0, draw: 0 });
  const [matchOver, setMatchOver] = useState(false);
  const [matchWinner, setMatchWinner] = useState(null);

  const aiMark = playerMark === "X" ? "O" : "X";
  const sfx = useCallback((name) => { if (soundOn) SFX[name]?.(); }, [soundOn]);
  const taunt = TAUNT_MAP[personality];

  useEffect(() => {
    fetchHealth().then(() => setBackendOnline(true)).catch(() => setBackendOnline(false));
  }, []);

  // Timer logic
  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setTimeLeft(0);
  }, []);

  const startTimer = useCallback(() => {
    if (!timerSecs) return;
    stopTimer();
    setTimeLeft(timerSecs);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 3 && prev > 1) sfx("tick");
        if (prev <= 1) {
          clearInterval(timerRef.current);
          sfx("alarm");
          // Auto-random move on timeout
          setBoard(b => {
            const empty = b.map((v,i)=>i).filter(i=>!b[i]);
            if (!empty.length) return b;
            const nb = [...b];
            nb[empty[Math.floor(Math.random()*empty.length)]] = playerMark;
            return nb;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timerSecs, sfx, playerMark, stopTimer]);

  const endGame = useCallback((result, cells) => {
    stopTimer();
    setWinCells(cells);
    setGameResult(result);
    if (result === playerMark) {
      sfx("win");
      setStatusMsg(randomFrom(taunt.win));
      setScores(s => {
        const np = s.player + 1;
        if (np >= matchWins) { setMatchOver(true); setMatchWinner("player"); }
        return { ...s, player: np };
      });
    } else if (result === aiMark) {
      sfx("lose");
      setStatusMsg(randomFrom(taunt.lose));
      setScores(s => {
        const na = s.ai + 1;
        if (na >= matchWins) { setMatchOver(true); setMatchWinner("ai"); }
        return { ...s, ai: na };
      });
    } else {
      sfx("draw");
      setStatusMsg("It's a draw!");
      setScores(s => ({ ...s, draw: s.draw + 1 }));
    }
  }, [playerMark, aiMark, sfx, taunt, matchWins, stopTimer]);

  const doAIMove = useCallback(async (currentBoard) => {
    setAiThinking(true);
    stopTimer();
    setStatusMsg(randomFrom(taunt.thinking));
    setReasoning("");
    try {
      const data = await fetchAIMove(currentBoard, aiMark, playerMark, gridSize, difficulty, personality);
      const move = data.move;
      if (move === undefined || currentBoard[move]) throw new Error("Bad move");
      const nb = [...currentBoard];
      nb[move] = aiMark;
      setBoard(nb);
      setLastMoveIdx(move);
      setMoveHistory(h => [...h, { index: move, mark: aiMark }]);
      setReasoning(data.reasoning || "");
      sfx("aiMove");
      const result = checkWinnerLocal(nb, gridSize);
      if (result) { endGame(result.winner, result.cells); }
      else { setStatusMsg("Your turn"); startTimer(); }
    } catch {
      setStatusMsg("AI error — your turn");
      startTimer();
    } finally {
      setAiThinking(false);
    }
  }, [aiMark, playerMark, gridSize, difficulty, personality, sfx, endGame, taunt, startTimer, stopTimer]);

  const handleCellClick = useCallback(async (i) => {
    if (board[i] || gameResult || aiThinking || matchOver) return;
    const nb = [...board];
    nb[i] = playerMark;
    setBoard(nb);
    setLastMoveIdx(i);
    setMoveHistory(h => [...h, { index: i, mark: playerMark }]);
    sfx("place");
    stopTimer();
    const result = checkWinnerLocal(nb, gridSize);
    if (result) { endGame(result.winner, result.cells); return; }
    await doAIMove(nb);
  }, [board, gameResult, aiThinking, matchOver, playerMark, sfx, gridSize, endGame, doAIMove, stopTimer]);

  const resetGame = useCallback((keepScores = true) => {
    const nb = Array(gridSize * gridSize).fill(null);
    setBoard(nb);
    setGameResult(null);
    setWinCells([]);
    setReasoning("");
    setLastMoveIdx(null);
    setMoveHistory([]);
    setMatchOver(false);
    setMatchWinner(null);
    stopTimer();
    if (!keepScores) setScores({ player:0, ai:0, draw:0 });
    if (playerMark === "O") {
      setTimeout(() => doAIMove(nb), 400);
    } else {
      setStatusMsg("Your turn");
      startTimer();
    }
  }, [gridSize, playerMark, doAIMove, startTimer, stopTimer]);

  // Reset board when settings change
  useEffect(() => {
    const nb = Array(gridSize * gridSize).fill(null);
    setBoard(nb);
    setGameResult(null);
    setWinCells([]);
    setReasoning("");
    setLastMoveIdx(null);
    setMoveHistory([]);
    stopTimer();
    setStatusMsg("Your turn");
  }, [gridSize, playerMark, stopTimer]);

  const timerPct = timerSecs ? (timeLeft / timerSecs) * 100 : 0;
  const timerColor = timeLeft <= 3 ? "#ef4444" : timeLeft <= 6 ? "#fbbf24" : "#6c63ff";
  const totalGames = scores.player + scores.ai + scores.draw;
  const diffColor = DIFFICULTIES.find(d=>d.id===difficulty)?.color || "#6c63ff";

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-star">✦</span>
          <span className="logo-text">TicTacAI</span>
          <span className="logo-chip">Groq</span>
        </div>
        <div className="header-right">
          <div className={`dot ${backendOnline===null?"loading":backendOnline?"on":"off"}`} />
          <button className="icon-btn" onClick={() => setSettingsOpen(o=>!o)} aria-label="Settings">⚙</button>
        </div>
      </header>

      {/* Settings panel */}
      {settingsOpen && (
        <div className="settings-panel">
          <div className="settings-row">
            <span className="settings-label">Grid size</span>
            <div className="pill-group">
              {GRID_SIZES.map(s => (
                <button key={s} className={`pill ${gridSize===s?"active":""}`} onClick={()=>{setGridSize(s);setSettingsOpen(false);}}>
                  {s}×{s}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-label">You play as</span>
            <div className="pill-group">
              {["X","O"].map(m=>(
                <button key={m} className={`pill ${playerMark===m?"active":""}`} onClick={()=>setPlayerMark(m)}>{m}</button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-label">Move timer</span>
            <div className="pill-group">
              {TIMER_OPTIONS.map(t=>(
                <button key={t} className={`pill ${timerSecs===t?"active":""}`} onClick={()=>setTimerSecs(t)}>
                  {t===0?"Off":`${t}s`}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-label">Match — first to</span>
            <div className="pill-group">
              {MATCH_WINS_OPTIONS.map(n=>(
                <button key={n} className={`pill ${matchWins===n?"active":""}`} onClick={()=>setMatchWins(n)}>{n} wins</button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-label">Sound</span>
            <button className={`pill ${soundOn?"active":""}`} onClick={()=>setSoundOn(o=>!o)}>
              {soundOn?"On 🔊":"Off 🔇"}
            </button>
          </div>
        </div>
      )}

      <main className="main">
        {/* Difficulty */}
        <div className="diff-row">
          {DIFFICULTIES.map(d=>(
            <button key={d.id} className={`diff-btn ${difficulty===d.id?"active":""}`}
              style={difficulty===d.id?{borderColor:d.color,color:d.color}:{}}
              onClick={()=>setDifficulty(d.id)}>
              {d.label}
            </button>
          ))}
        </div>

        {/* Personality */}
        <div className="personality-row">
          {PERSONALITIES.map(p=>(
            <button key={p.id} className={`persona-btn ${personality===p.id?"active":""}`}
              onClick={()=>setPersonality(p.id)}
              title={p.desc}>
              <span className="persona-emoji">{p.emoji}</span>
              <span className="persona-label">{p.label}</span>
            </button>
          ))}
        </div>

        {/* Scoreboard */}
        <section className="scoreboard">
          <div className="score-card you">
            <div className="sc-label">You ({playerMark})</div>
            <div className="sc-num">{scores.player}</div>
            <div className="sc-bar" style={{width: totalGames?`${scores.player/totalGames*100}%`:"0%", background:"var(--x)"}} />
          </div>
          <div className="score-mid">
            <div className="sc-total">{totalGames}</div>
            <div className="sc-sub">games</div>
            <div className="sc-sub">{scores.draw} draws</div>
            <div className="match-goal" style={{color:diffColor}}>First to {matchWins}</div>
          </div>
          <div className="score-card ai-card">
            <div className="sc-label">AI ({aiMark})</div>
            <div className="sc-num">{scores.ai}</div>
            <div className="sc-bar" style={{width: totalGames?`${scores.ai/totalGames*100}%`:"0%", background:"var(--o)"}} />
          </div>
        </section>

        {/* Timer bar */}
        {timerSecs > 0 && !gameResult && !aiThinking && (
          <div className="timer-wrap">
            <div className="timer-track">
              <div className="timer-fill" style={{width:`${timerPct}%`, background:timerColor, transition: timeLeft===timerSecs?"none":"width 1s linear"}} />
            </div>
            <span className="timer-num" style={{color:timerColor}}>{timeLeft}s</span>
          </div>
        )}

        {/* Status */}
        <div className="status-area">
          <p className="status-text">
            {aiThinking && <span className="spinner" />}
            {statusMsg}
          </p>
          {reasoning && (
            <p className="reasoning">
              <span>💡</span> {reasoning}
            </p>
          )}
        </div>

        {/* Board */}
        <div className="board-wrap">
          <div className="board" style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gap: gridSize >= 5 ? "6px" : "10px",
            maxWidth: gridSize === 3 ? "360px" : gridSize === 4 ? "400px" : gridSize === 5 ? "440px" : "480px",
          }}>
            {board.map((val, i) => {
              const isWin = winCells.includes(i);
              const isLast = lastMoveIdx === i;
              const canClick = !val && !gameResult && !aiThinking && !matchOver;
              return (
                <button key={i}
                  className={["cell", val==="X"?"cx":val==="O"?"co":"", isWin?"cwin":"", isLast?"clast":"", canClick?"cempty":""].filter(Boolean).join(" ")}
                  style={{ fontSize: gridSize <= 3 ? "2.4rem" : gridSize === 4 ? "1.8rem" : gridSize === 5 ? "1.4rem" : "1.1rem" }}
                  onClick={() => handleCellClick(i)}
                  disabled={!canClick}
                  aria-label={val?`${val} at ${i+1}`:`Empty ${i+1}`}>
                  {val}
                </button>
              );
            })}
          </div>
        </div>

        {/* Move history */}
        {moveHistory.length > 0 && (
          <div className="history">
            <span className="hist-label">Moves</span>
            <div className="hist-list">
              {moveHistory.map((m,idx)=>(
                <span key={idx} className={`hist-item ${m.mark===playerMark?"hy":"hai"}`}>{m.mark}{m.index+1}</span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="actions">
          <button className="btn-secondary" onClick={() => resetGame(true)} disabled={aiThinking}>New game</button>
          <button className="btn-ghost" onClick={() => { setScores({player:0,ai:0,draw:0}); resetGame(false); }} disabled={aiThinking}>Reset match</button>
        </div>
      </main>

      {/* Game over modal */}
      {gameResult && (
        <div className="modal-bg" role="dialog">
          <div className="modal">
            <div className="modal-emoji">{gameResult===playerMark?"🏆":gameResult==="draw"?"🤝":"🤖"}</div>
            <h2 className="modal-title">{gameResult===playerMark?"You win!":gameResult==="draw"?"Draw!":"AI wins!"}</h2>
            <p className="modal-sub">{statusMsg}</p>
            <div className="modal-scores">
              <div className="ms"><span style={{color:"var(--x)"}}>You</span><strong>{scores.player}</strong></div>
              <div className="ms"><span>Draw</span><strong>{scores.draw}</strong></div>
              <div className="ms"><span style={{color:"var(--o)"}}>AI</span><strong>{scores.ai}</strong></div>
            </div>
            <button className="btn-primary" onClick={() => resetGame(true)}>Play again</button>
          </div>
        </div>
      )}

      {/* Match over modal */}
      {matchOver && (
        <div className="modal-bg" role="dialog">
          <div className="modal modal-match">
            <div className="modal-emoji">{matchWinner==="player"?"👑":"🤖"}</div>
            <h2 className="modal-title">{matchWinner==="player"?"You won the match!":"AI won the match!"}</h2>
            <p className="modal-sub">First to {matchWins} wins — match complete!</p>
            <div className="modal-scores">
              <div className="ms"><span style={{color:"var(--x)"}}>You</span><strong>{scores.player}</strong></div>
              <div className="ms"><span>Draw</span><strong>{scores.draw}</strong></div>
              <div className="ms"><span style={{color:"var(--o)"}}>AI</span><strong>{scores.ai}</strong></div>
            </div>
            <button className="btn-primary" onClick={() => { setMatchOver(false); resetGame(false); }}>New match</button>
          </div>
        </div>
      )}

      <footer className="footer">
        <span>{gridSize}×{gridSize} · {difficulty} · {personality}</span>
        <span className="fdot">·</span>
      </footer>
    </div>
  );
}
