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



const FALLBACK_RECS = [
  {
    title: "Interstellar", category: "movies", emoji: "🚀", genre: "Sci-Fi / Drama", year: "2014",
    why: "A mind-bending epic about love, time, and human perseverance that aligns perfectly with your mindset.",
    match_score: 96, trending: true, cross_resonance: "Deep cosmic story matching your mood."
  },
  {
    title: "Whiplash", category: "movies", emoji: "🥁", genre: "Drama / Music", year: "2014",
    why: "An intense exploration of obsession and drive that will ignite your inner motivation.",
    match_score: 94, trending: false, cross_resonance: "High energy determination."
  },
  {
    title: "Oppenheimer", category: "movies", emoji: "⚛️", genre: "Biographical Drama", year: "2023",
    why: "A gripping tale of intellect, ambition, and historic impact.",
    match_score: 95, trending: true, cross_resonance: "Mind-expanding cinematic experience."
  },
  {
    title: "Spirited Away", category: "movies", emoji: "🏮", genre: "Anime / Fantasy", year: "2001",
    why: "A enchanting masterpiece of imagination, wonder, and emotional depth.",
    match_score: 97, trending: true, cross_resonance: "Immersive magical escapism."
  },
  {
    title: "Atomic Habits by James Clear", category: "books", emoji: "📖", genre: "Self-Improvement", year: "2018",
    why: "Practical framework for continuous growth, perfect for your current mindset.",
    match_score: 98, trending: true, cross_resonance: "Personal excellence and habit design."
  },
  {
    title: "Dune by Frank Herbert", category: "books", emoji: "🏜️", genre: "Sci-Fi Epic", year: "1965",
    why: "An intricate universe of strategy, destiny, and epic worldbuilding.",
    match_score: 93, trending: true, cross_resonance: "Strategic foresight and epic storytelling."
  },
  {
    title: "Deep Work by Cal Newport", category: "books", emoji: "🧠", genre: "Productivity", year: "2016",
    why: "Rules for focused success in a distracted world to maximize your output.",
    match_score: 92, trending: false, cross_resonance: "Channeling focus into tangible achievement."
  },
  {
    title: "Hans Zimmer - Live in Prague", category: "music", emoji: "🎼", genre: "Cinematic Orchestral", year: "2017",
    why: "Powerful, soaring symphonic compositions that elevate your energy and focus.",
    match_score: 95, trending: true, cross_resonance: "Translates epic themes into soundscapes."
  },
  {
    title: "Daft Punk - Discovery", category: "music", emoji: "⚡", genre: "Electronic / Synthwave", year: "2001",
    why: "Energetic synth beats and timeless electronic rhythms that uplift your mood.",
    match_score: 90, trending: false, cross_resonance: "High-tempo productive flow state."
  },
  {
    title: "Lofi Girl - Chill Beats to Relax", category: "music", emoji: "🎧", genre: "Lofi Hip Hop", year: "2024",
    why: "Calm, relaxing beats perfect for studying, working, or unwinding.",
    match_score: 96, trending: true, cross_resonance: "Peaceful atmosphere for deep focus."
  },
  {
    title: "Hades", category: "games", emoji: "⚔️", genre: "Rogue-like Action", year: "2020",
    why: "Fast-paced, highly rewarding gameplay with an incredible soundtrack and story.",
    match_score: 93, trending: true, cross_resonance: "Persistent, rewarding game loop."
  },
  {
    title: "Celeste", category: "games", emoji: "🏔️", genre: "Precision Platformer", year: "2018",
    why: "A moving journey about overcoming obstacles and scaling impossible heights.",
    match_score: 91, trending: false, cross_resonance: "Resonates with resilience and overcoming challenges."
  },
  {
    title: "Stardew Valley", category: "games", emoji: "🌾", genre: "Farming RPG", year: "2016",
    why: "A relaxing escape into building your farm, making friends, and finding peace.",
    match_score: 96, trending: true, cross_resonance: "Wholesome, soothing gameplay experience."
  },
  {
    title: "High-Protein Grain & Avocado Bowl", category: "food", emoji: "🥗", genre: "Healthy & Fueling", year: "Fresh",
    why: "Nutrient-dense power meal to sustain high energy and cognitive focus.",
    match_score: 89, trending: true, cross_resonance: "Physical nutrition aligned with mental drive."
  },
  {
    title: "Artisanal Neapolitan Margherita Pizza", category: "food", emoji: "🍕", genre: "Comfort Food", year: "Fresh",
    why: "Crispy wood-fired crust with fresh basil and melted mozzarella.",
    match_score: 94, trending: true, cross_resonance: "Delicious comfort food for your mood."
  },
  {
    title: "30-Minute HIIT Power Circuit", category: "fitness", emoji: "🔥", genre: "Full Body Cardio", year: "Active",
    why: "High-intensity workout designed to release endorphins and build endurance.",
    match_score: 95, trending: true, cross_resonance: "Direct physical outlet for your energy."
  },
  {
    title: "Morning Sunset Yoga & Mobility", category: "fitness", emoji: "🧘", genre: "Stretching & Balance", year: "Active",
    why: "Gentle mobility routine to release tension and restore mental balance.",
    match_score: 92, trending: false, cross_resonance: "Calming physical alignment."
  },
  {
    title: "Kyoto Temple & Bamboo Forest Hike", category: "travel", emoji: "⛩️", genre: "Adventure / Culture", year: "Explorer",
    why: "An inspiring journey combining serene nature with ancient architectural wonder.",
    match_score: 88, trending: false, cross_resonance: "Expands your horizons with timeless beauty."
  },
  {
    title: "Amalfi Coast Scenic Cliffside Drive", category: "travel", emoji: "🌊", genre: "Coastal Paradise", year: "Explorer",
    why: "Breathtaking Mediterranean views, pastel villages, and sun-soaked coastlines.",
    match_score: 94, trending: true, cross_resonance: "Wanderlust travel inspiration."
  },
  {
    title: "Forest - Deep Focus & Productivity", category: "apps", emoji: "🌲", genre: "Productivity Tool", year: "2024",
    why: "Gamified focus timer that helps you stay off distractions and build your virtual forest.",
    match_score: 94, trending: true, cross_resonance: "Keeps your focus locked on your goals."
  },
  {
    title: "Notion - All-in-One Mind Workspace", category: "apps", emoji: "📝", genre: "Organization", year: "2024",
    why: "Organize your life, projects, notes, and goals in one clean aesthetic workspace.",
    match_score: 95, trending: true, cross_resonance: "Structured mental clarity tool."
  }
];

function getFrontendFallbackRecs(mood, category, query) {
  let list = FALLBACK_RECS;
  if (category && category !== "all") {
    list = list.filter(item => item.category === category);
  }
  if (!list || list.length === 0) list = FALLBACK_RECS;
  if (query) {
    const q = query.toLowerCase();
    const matched = list.filter(i => i.title.toLowerCase().includes(q) || i.why.toLowerCase().includes(q) || i.genre.toLowerCase().includes(q));
    if (matched.length > 0) list = matched;
  }
  return list.map(item => ({
    ...item,
    verified: true,
    sources: [
      { name: "Google Search", title: item.title, url: `https://www.google.com/search?q=${encodeURIComponent(item.title)}`, extract: `Search for ${item.title}` },
      { name: "Wikipedia", title: item.title, url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(item.title)}`, extract: `Learn more about ${item.title}` }
    ]
  })).slice(0, 8);
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
      if (d.recommendations && d.recommendations.length > 0) {
        setRecs(d.recommendations);
      } else {
        setRecs(getFrontendFallbackRecs(mood, category, query));
      }
      if (d.emotional_dna) setDna(d.emotional_dna);
    } catch (err) {
      console.warn("Backend recommendation fetch error, using fallback recommendations:", err);
      setRecs(getFrontendFallbackRecs(mood, category, query));
    }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setSearchMode(true);
    try {
      const d = await api.search({ query });
      if (d.results && d.results.length > 0) {
        setRecs(d.results);
      } else {
        setRecs(getFrontendFallbackRecs(mood, category, query));
      }
    } catch {
      setRecs(getFrontendFallbackRecs(mood, category, query));
    }
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
          {["discover","saved","ratings"].map(t => (
            <button key={t} className={`nav-btn ${tab===t?"active":""}`} onClick={() => setTab(t)}>
              {t === "discover" ? "🌍 Discover" : t === "saved" ? "♥ Saved" : "⭐ Ratings"}
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


      </main>
    </div>
  );
}
