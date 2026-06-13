import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

const API = "http://localhost:5001";

const PERSONALITIES = [
  { id: "auto",      emoji: "🤖", label: "Auto",        desc: "AI picks best for your mood" },
  { id: "therapist", emoji: "🧘", label: "Therapist",   desc: "Calm & empathetic" },
  { id: "friend",    emoji: "🔥", label: "Hype Friend", desc: "Energetic & supportive" },
  { id: "zen",       emoji: "☯️", label: "Zen Master",  desc: "Wise & philosophical" },
  { id: "tough",     emoji: "💪", label: "Tough Love",  desc: "Direct & action-oriented" },
];

const MOOD_META = {
  happy:   { color: "#fbbf24", emoji: "😊", label: "Happy" },
  sad:     { color: "#60a5fa", emoji: "😢", label: "Sad" },
  angry:   { color: "#f87171", emoji: "😠", label: "Angry" },
  anxious: { color: "#a78bfa", emoji: "😰", label: "Anxious" },
  stressed:{ color: "#fb923c", emoji: "😩", label: "Stressed" },
  neutral: { color: "#6ee7b7", emoji: "😐", label: "Neutral" },
};

// Sound engine
function beep(freq=440, dur=0.1, type="sine", vol=0.2) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = freq; o.type = type;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch {}
}
const SFX = {
  send:    () => beep(600, 0.06, "sine", 0.2),
  receive: () => { beep(440, 0.06, "sine", 0.15); setTimeout(() => beep(520, 0.06, "sine", 0.15), 80); },
  mood:    () => beep(800, 0.1, "triangle", 0.2),
  clear:   () => beep(300, 0.15, "sawtooth", 0.15),
};

// Text to speech
function speak(text, lang = "English") {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang === "Tamil" ? "ta-IN" : lang === "Hindi" ? "hi-IN" : "en-US";
  utt.rate = 0.95; utt.pitch = 1.05;
  window.speechSynthesis.speak(utt);
}

// Speech recognition
function createRecognizer(onResult, onEnd) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.continuous = false; r.interimResults = false; r.lang = "en-US";
  r.onresult = e => onResult(e.results[0][0].transcript);
  r.onend = onEnd;
  return r;
}

export default function App() {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [personality, setPersonality] = useState("auto");
  const [currentMood, setCurrentMood] = useState("neutral");
  const [allMoods, setAllMoods]       = useState([]);
  const [currentPersona, setCurrentPersona] = useState({ name: "Anima", emoji: "🤖" });
  const [soundOn, setSoundOn]         = useState(true);
  const [voiceOn, setVoiceOn]         = useState(false);
  const [listening, setListening]     = useState(false);
  const [moodSummary, setMoodSummary] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [typingText, setTypingText]   = useState("");
  const [isTyping, setIsTyping]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const recognizer  = useRef(null);

  const sfx = useCallback((name) => { if (soundOn) SFX[name]?.(); }, [soundOn]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingText]);

  // Typing animation
  const animateReply = useCallback((text, cb) => {
    setIsTyping(true);
    setTypingText("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypingText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
        setTypingText("");
        cb(text);
      }
    }, 18);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback(async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    sfx("send");

    const userMsg = { role: "user", content: msg, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Build history (exclude welcome message)
    const history = messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history, personalityId: personality, sessionMoods: allMoods }),
      });
      const data = await res.json();

      setCurrentMood(data.mood);
      setAllMoods(data.allMoods || []);
      setCurrentPersona({ name: data.personalityName, emoji: data.personalityEmoji });
      sfx("mood");

      setLoading(false);
      sfx("receive");

      animateReply(data.reply, (finalText) => {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: finalText,
          mood: data.mood,
          persona: data.personalityName,
          personaEmoji: data.personalityEmoji,
          language: data.language,
          time: new Date(),
        }]);
        if (voiceOn) speak(finalText, data.language);
      });
    } catch {
      setLoading(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting. Please check if the backend is running.",
        mood: "neutral",
        time: new Date(),
      }]);
    }
  }, [input, loading, messages, personality, allMoods, sfx, animateReply, voiceOn]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const startListening = () => {
    recognizer.current = createRecognizer(
      (transcript) => { setInput(transcript); setListening(false); },
      () => setListening(false)
    );
    if (recognizer.current) { recognizer.current.start(); setListening(true); }
  };

  const clearChat = () => {
    sfx("clear");
    window.speechSynthesis?.cancel();
    setMessages([]);
    setAllMoods([]);
    setCurrentMood("neutral");
    setMoodSummary("");
    setShowSummary(false);
    setCurrentPersona({ name: "Anima", emoji: "🤖" });
  };

  const getMoodSummary = async () => {
    if (!messages.length) return;
    const res = await fetch(`${API}/api/mood-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: messages.filter(m=>m.role!=="system"), allMoods }),
    });
    const data = await res.json();
    setMoodSummary(data.summary);
    setShowSummary(true);
  };

  const mood = MOOD_META[currentMood] || MOOD_META.neutral;

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "";

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">◈</span>
            <span className="logo-text">Anima</span>
          </div>
          <button className="icon-btn" onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen ? "←" : "→"}
          </button>
        </div>

        {sidebarOpen && (
          <>
            {/* Current mood */}
            <div className="mood-display" style={{ "--mood-color": mood.color }}>
              <div className="mood-emoji" style={{ animation: "moodPop 0.4s ease" }}>{mood.emoji}</div>
              <div className="mood-info">
                <div className="mood-label">Current mood</div>
                <div className="mood-name" style={{ color: mood.color }}>{mood.label}</div>
              </div>
            </div>

            {/* Mood trail */}
            {allMoods.length > 1 && (
              <div className="mood-trail">
                <div className="trail-label">Mood journey</div>
                <div className="trail-emojis">
                  {allMoods.map((m, i) => (
                    <span key={i} className="trail-emoji" title={m}>
                      {MOOD_META[m]?.emoji || "😐"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Personality */}
            <div className="section-label">AI Personality</div>
            <div className="persona-list">
              {PERSONALITIES.map(p => (
                <button
                  key={p.id}
                  className={`persona-item ${personality === p.id ? "active" : ""}`}
                  onClick={() => setPersonality(p.id)}
                >
                  <span className="p-emoji">{p.emoji}</span>
                  <div className="p-info">
                    <div className="p-name">{p.label}</div>
                    <div className="p-desc">{p.desc}</div>
                  </div>
                  {personality === p.id && <span className="p-check">✓</span>}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="section-label">Controls</div>
            <div className="control-btns">
              <button className={`ctrl-btn ${soundOn ? "on" : ""}`} onClick={() => setSoundOn(o => !o)}>
                {soundOn ? "🔊" : "🔇"} Sound
              </button>
              <button className={`ctrl-btn ${voiceOn ? "on" : ""}`} onClick={() => setVoiceOn(o => !o)}>
                {voiceOn ? "🔈" : "🔕"} Voice reply
              </button>
            </div>

            {/* Actions */}
            <div className="sidebar-actions">
              <button className="action-btn" onClick={getMoodSummary} disabled={!messages.length}>
                📊 Mood summary
              </button>
              <button className="action-btn danger" onClick={clearChat} disabled={!messages.length}>
                🗑️ Clear chat
              </button>
            </div>

            {/* Stats */}
            <div className="stats">
              <div className="stat"><span>{messages.filter(m=>m.role==="user").length}</span><label>Messages</label></div>
              <div className="stat"><span>{allMoods.length}</span><label>Mood shifts</label></div>
            </div>
          </>
        )}
      </aside>

      {/* Main chat */}
      <main className="chat-main">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            {!sidebarOpen && (
              <button className="icon-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            )}
            <div className="active-persona">
              <span className="ap-emoji">{currentPersona.emoji}</span>
              <div>
                <div className="ap-name">{currentPersona.name}</div>
                <div className="ap-status">
                  <span className="status-dot on" />
                  <span>Online</span>
                </div>
              </div>
            </div>
          </div>
          <div className="chat-header-right">
            <div className="mood-chip" style={{ background: `${mood.color}18`, border: `1px solid ${mood.color}44`, color: mood.color }}>
              {mood.emoji} {mood.label}
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="messages">
          {messages.length === 0 && (
            <div className="welcome">
              <div className="welcome-icon">◈</div>
              <h2>Hey, I'm Anima</h2>
              <p>Your AI companion that listens, understands your mood, and adapts to what you need. Just start talking.</p>
              <div className="welcome-chips">
                {["I'm feeling stressed today", "I need some motivation", "Just had a great day!", "I'm feeling anxious"].map(s => (
                  <button key={s} className="chip" onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`msg-row ${msg.role}`} style={{ animation: "fadeIn 0.3s ease" }}>
              {msg.role === "assistant" && (
                <div className="avatar">{msg.personaEmoji || "🤖"}</div>
              )}
              <div className={`bubble ${msg.role}`}>
                {msg.role === "assistant" && msg.persona && (
                  <div className="bubble-meta">{msg.persona} · {msg.language || "English"}</div>
                )}
                <div className="bubble-text">{msg.content}</div>
                <div className="bubble-time">{formatTime(msg.time)}</div>
                {msg.mood && msg.role === "assistant" && (
                  <div className="bubble-mood" style={{ color: MOOD_META[msg.mood]?.color }}>
                    {MOOD_META[msg.mood]?.emoji} Detected: {MOOD_META[msg.mood]?.label}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="avatar user-avatar">You</div>
              )}
            </div>
          ))}

          {/* Typing animation */}
          {(loading || isTyping) && (
            <div className="msg-row assistant" style={{ animation: "fadeIn 0.2s ease" }}>
              <div className="avatar">{currentPersona.emoji}</div>
              <div className="bubble assistant">
                {isTyping && typingText ? (
                  <div className="bubble-text">{typingText}<span className="cursor">|</span></div>
                ) : (
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Mood summary modal */}
        {showSummary && (
          <div className="summary-modal">
            <div className="summary-card">
              <div className="summary-title">📊 Your Mood Summary</div>
              <div className="summary-trail">
                {allMoods.map((m, i) => (
                  <span key={i}>{MOOD_META[m]?.emoji}</span>
                ))}
              </div>
              <p className="summary-text">{moodSummary}</p>
              <button className="btn-primary" onClick={() => setShowSummary(false)}>Close</button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="input-area">
          <div className="input-wrap">
            <textarea
              ref={inputRef}
              className="input"
              placeholder="How are you feeling today..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading || isTyping}
            />
            <div className="input-actions">
              <button
                className={`icon-btn mic-btn ${listening ? "listening" : ""}`}
                onClick={startListening}
                disabled={listening || loading}
                title="Voice input"
              >
                {listening ? "⏺" : "🎤"}
              </button>
              <button
                className="send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading || isTyping}
              >
                ↑
              </button>
            </div>
          </div>
          <div className="input-hint">
            Enter to send · Shift+Enter for new line · 🎤 for voice
          </div>
        </div>
      </main>
    </div>
  );
}
