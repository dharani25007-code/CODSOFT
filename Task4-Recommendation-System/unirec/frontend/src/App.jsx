import { useState, useEffect, useCallback } from "react";
import { api } from "./api.js";
import Auth from "./Auth.jsx";
import "./App.css";

const MOODS = [
  { id:"happy",     emoji:"😊", label:"Happy" },
  { id:"sad",       emoji:"😢", label:"Sad" },
  { id:"excited",   emoji:"🤩", label:"Excited" },
  { id:"relaxed",   emoji:"😌", label:"Relaxed" },
  { id:"motivated", emoji:"💪", label:"Motivated" },
  { id:"bored",     emoji:"😑", label:"Bored" },
  { id:"stressed",  emoji:"😩", label:"Stressed" },
  { id:"romantic",  emoji:"💕", label:"Romantic" },
];

const CATS = [
  { id:"all",     emoji:"🌍", label:"All" },
  { id:"movies",  emoji:"🎬", label:"Movies" },
  { id:"music",   emoji:"🎵", label:"Music" },
  { id:"books",   emoji:"📚", label:"Books" },
  { id:"games",   emoji:"🎮", label:"Games" },
  { id:"food",    emoji:"🍕", label:"Food" },
  { id:"fitness", emoji:"🏋️", label:"Fitness" },
  { id:"travel",  emoji:"🌍", label:"Travel" },
  { id:"apps",    emoji:"📱", label:"Apps" },
];

const CAT_COLORS = {
  movies:"#f472b6", music:"#60a5fa", books:"#34d399", games:"#f59e0b",
  food:"#fb923c", fitness:"#ef4444", travel:"#06b6d4", apps:"#a78bfa"
};

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="stars">
      {[1,2,3,4,5].map(s => (
        <button key={s} className={`star ${s <= (hover||value) ? "lit" : ""}`}
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}>★</button>
      ))}
    </div>
  );
}

function RecCard({ item, onRate, onSave, savedIds }) {
  const [rating, setRating]     = useState(0);
  const [saving, setSaving]     = useState(false);
  const [rating2, setRating2]   = useState(false);
  const isSaved = savedIds.has(item.title);
  const color   = CAT_COLORS[item.category] || "var(--accent2)";

  const handleRate = async (v) => {
    setRating(v); setRating2(true);
    await onRate(item.title, item.category, v);
    setTimeout(() => setRating2(false), 1000);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(item.title, item.category, item.why);
    setSaving(false);
  };

  return (
    <div className="rec-card" style={{ "--cat-color": color }}>
      <div className="rec-header">
        <span className="rec-emoji">{item.emoji}</span>
        <div className="rec-meta">
          <span className="rec-cat" style={{ color }}>{item.category}</span>
          {item.trending && <span className="rec-trend">🔥 Trending</span>}
        </div>
        <div className="rec-score">{item.match_score}%</div>
      </div>
      <h3 className="rec-title">{item.title}</h3>
      <p className="rec-genre">{item.genre} {item.year ? `· ${item.year}` : ""}</p>
      <p className="rec-why">💡 {item.why}</p>
      {item.sources && item.sources.length > 0 && (
        <div className="rec-sources">
          {item.sources.map((src, i) => (
            <div key={i} className="rec-source">
              <a href={src.url} target="_blank" rel="noreferrer" className="source-link">
                🔗 {src.name}
              </a>
              {src.extract && <p className="source-extract">{src.extract}</p>}
            </div>
          ))}
        </div>
      )}
      {item.cross_resonance && item.cross_resonance.toLowerCase() !== "none" && item.cross_resonance.trim() !== "" && (
        <p className="rec-cross">🔗 {item.cross_resonance}</p>
      )}
      <div className="rec-actions">
        <StarRating value={rating} onChange={handleRate} />
        <button className={`save-btn ${isSaved ? "saved" : ""}`} onClick={handleSave} disabled={saving}>
          {isSaved ? "♥ Saved" : "♡ Save"}
        </button>
      </div>
      {rating2 && <div className="rated-toast">Rated {rating}★ — DNA updated!</div>}
    </div>
  );
}

function DNAPanel({ dna }) {
  if (!dna || Object.keys(dna).length === 0) return null;
  const cats = Object.entries(dna).filter(([k]) => k !== "dominant_mood");
  return (
    <div className="dna-panel">
      <div className="dna-title">🧬 Your Emotional DNA</div>
      {dna.dominant_mood && (
        <div className="dna-mood">Dominant mood: <strong>{dna.dominant_mood}</strong></div>
      )}
      <div className="dna-bars">
        {cats.map(([cat, score]) => (
          <div key={cat} className="dna-bar-row">
            <span className="dna-cat">{CATS.find(c=>c.id===cat)?.emoji || "◈"} {cat}</span>
            <div className="dna-bar-track">
              <div className="dna-bar-fill" style={{ width: `${(score/5)*100}%`, background: CAT_COLORS[cat] || "var(--accent)" }} />
            </div>
            <span className="dna-score">{score}★</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser]           = useState(null);
  const [checking, setChecking]   = useState(true);
  const [mood, setMood]           = useState("relaxed");
  const [category, setCategory]   = useState("all");
  const [query, setQuery]         = useState("");
  const [recs, setRecs]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [tab, setTab]             = useState("discover"); // discover | saved | ratings | dna
  const [saved, setSaved]         = useState([]);
  const [ratings, setRatings]     = useState([]);
  const [dna, setDna]             = useState({});
  const [savedIds, setSavedIds]   = useState(new Set());
  const [searchMode, setSearchMode] = useState(false);

  useEffect(() => {
    api.me().then(d => { setUser(d.user); setDna(d.emotional_dna || {}); }).catch(() => {}).finally(() => setChecking(false));
  }, []);

  const loadSaved = useCallback(async () => {
    const d = await api.getSaved();
    setSaved(d.saved);
    setSavedIds(new Set(d.saved.map(s => s.item_title)));
  }, []);

  const loadRatings = useCallback(async () => {
    const d = await api.getRatings();
    setRatings(d.ratings);
  }, []);

  useEffect(() => {
    if (user) { loadSaved(); loadRatings(); }
  }, [user, loadSaved, loadRatings]);

  const handleAuth = (u) => setUser(u);

  const handleLogout = async () => {
    await api.logout();
    setUser(null); setRecs([]); setSaved([]); setRatings([]); setDna({});
  };

  const getRecommendations = async () => {
    setLoading(true); setSearchMode(false);
    try {
      const d = await api.recommend({ mood, category, query });
      setRecs(d.recommendations || []);
      setDna(d.emotional_dna || {});
    } catch {}
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setSearchMode(true);
    try {
      const d = await api.search({ query });
      setRecs(d.results || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleRate = async (title, cat, rating) => {
    await api.rate({ title, category: cat, rating });
    const d = await api.getDNA();
    setDna(d.emotional_dna);
    loadRatings();
  };

  const handleSave = async (title, cat, reason) => {
    await api.save({ title, category: cat, reason });
    loadSaved();
  };

  if (checking) return (
    <div className="checking"><div className="check-spinner" /><p>Loading UniRec...</p></div>
  );

  if (!user) return <Auth onAuth={handleAuth} />;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span className="header-logo">◈ UniRec</span>
        </div>
        <nav className="header-nav">
          {["discover","saved","ratings","dna"].map(t => (
            <button key={t} className={`nav-btn ${tab===t?"active":""}`} onClick={() => setTab(t)}>
              {t === "discover" ? "🌍 Discover" : t === "saved" ? "♥ Saved" : t === "ratings" ? "⭐ Ratings" : "🧬 My DNA"}
            </button>
          ))}
        </nav>
        <div className="header-right">
          <div className="user-chip">
            <span className="user-avatar">{user.username[0].toUpperCase()}</span>
            <span className="user-name">{user.username}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main className="main">
        {/* Discover tab */}
        {tab === "discover" && (
          <div className="discover">
            {/* Hero */}
            <div className="hero">
              <h1 className="hero-title">What's your universe today?</h1>
              <p className="hero-sub">Tell us your mood. We'll map the entire universe of recommendations for you.</p>
            </div>

            {/* Mood selector */}
            <div className="section-label">How are you feeling?</div>
            <div className="mood-grid">
              {MOODS.map(m => (
                <button key={m.id} className={`mood-btn ${mood===m.id?"active":""}`} onClick={() => setMood(m.id)}>
                  <span className="mood-emoji">{m.emoji}</span>
                  <span className="mood-label">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Category selector */}
            <div className="section-label">Category</div>
            <div className="cat-strip">
              {CATS.map(c => (
                <button key={c.id} className={`cat-btn ${category===c.id?"active":""}`}
                  style={category===c.id?{borderColor: CAT_COLORS[c.id]||"var(--accent)", color: CAT_COLORS[c.id]||"var(--accent)"}:{}}
                  onClick={() => setCategory(c.id)}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div className="search-row">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input className="search-input" placeholder="Search anything... (optional)" value={query} onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (query ? handleSearch() : getRecommendations())} />
                {query && <button className="search-clear" onClick={() => setQuery("")}>×</button>}
              </div>
              {query && <button className="btn-search" onClick={handleSearch} disabled={loading}>Search</button>}
              <button className="btn-rec" onClick={getRecommendations} disabled={loading}>
                {loading ? <span className="spinner-sm" /> : "✦"} {loading ? "Finding..." : "Recommend Me"}
              </button>
            </div>

            {/* DNA panel */}
            <DNAPanel dna={dna} />

            {/* Results */}
            {recs.length > 0 && (
              <div className="results-section">
                <div className="results-header">
                  <h2 className="results-title">
                    {searchMode ? `Search results for "${query}"` : `Your Universe — ${mood} mood`}
                  </h2>
                  <span className="results-count">{recs.length} picks</span>
                </div>
                <div className="rec-grid">
                  {recs.map((item, i) => (
                    <RecCard key={i} item={item} onRate={handleRate} onSave={handleSave} savedIds={savedIds} />
                  ))}
                </div>
              </div>
            )}

            {recs.length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-emoji">🌌</div>
                <h3>Your universe awaits</h3>
                <p>Pick a mood and hit Recommend Me to explore!</p>
              </div>
            )}
          </div>
        )}

        {/* Saved tab */}
        {tab === "saved" && (
          <div className="tab-content">
            <h2 className="tab-title">♥ Saved Items</h2>
            {saved.length === 0 ? (
              <div className="empty-state"><div className="empty-emoji">♡</div><h3>Nothing saved yet</h3><p>Hit ♡ Save on any recommendation to save it here.</p></div>
            ) : (
              <div className="list-grid">
                {saved.map((s, i) => (
                  <div key={i} className="list-card" style={{ "--cat-color": CAT_COLORS[s.category] || "var(--accent)" }}>
                    <div className="lc-cat" style={{ color: CAT_COLORS[s.category] }}>{s.category}</div>
                    <div className="lc-title">{s.item_title}</div>
                    {s.reason && <div className="lc-reason">💡 {s.reason}</div>}
                    <div className="lc-date">{new Date(s.saved_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ratings tab */}
        {tab === "ratings" && (
          <div className="tab-content">
            <h2 className="tab-title">⭐ My Ratings</h2>
            {ratings.length === 0 ? (
              <div className="empty-state"><div className="empty-emoji">⭐</div><h3>No ratings yet</h3><p>Rate items in Discover to build your Emotional DNA.</p></div>
            ) : (
              <div className="list-grid">
                {ratings.map((r, i) => (
                  <div key={i} className="list-card" style={{ "--cat-color": CAT_COLORS[r.category] || "var(--accent)" }}>
                    <div className="lc-cat" style={{ color: CAT_COLORS[r.category] }}>{r.category}</div>
                    <div className="lc-title">{r.item_title}</div>
                    <div className="lc-rating">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</div>
                    <div className="lc-date">{new Date(r.rated_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DNA tab */}
        {tab === "dna" && (
          <div className="tab-content">
            <h2 className="tab-title">🧬 Your Emotional DNA</h2>
            <p className="tab-sub">Your unique preference fingerprint — built from your ratings and mood history.</p>
            <DNAPanel dna={dna} />
            {(!dna || Object.keys(dna).length === 0) && (
              <div className="empty-state"><div className="empty-emoji">🧬</div><h3>DNA not built yet</h3><p>Rate at least 3 items in Discover to generate your Emotional DNA profile.</p></div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
