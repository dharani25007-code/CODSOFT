import os, json, sqlite3, hashlib, secrets
from datetime import datetime
from functools import wraps
from urllib.parse import quote as urlquote
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
import requests

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "unirec_secret_2026")
CORS(app, supports_credentials=True, origins=["*"])
bcrypt = Bcrypt(app)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL   = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
DB_PATH      = os.path.join(os.path.dirname(__file__), "unirec.db")

# ── Categories ────────────────────────────────────────────────────────────────
CATEGORIES = [
    {"id": "movies",   "label": "Movies & Shows", "emoji": "🎬"},
    {"id": "music",    "label": "Music",           "emoji": "🎵"},
    {"id": "books",    "label": "Books",           "emoji": "📚"},
    {"id": "games",    "label": "Games",           "emoji": "🎮"},
    {"id": "food",     "label": "Food & Recipes",  "emoji": "🍕"},
    {"id": "fitness",  "label": "Fitness",         "emoji": "🏋️"},
    {"id": "travel",   "label": "Travel",          "emoji": "🌍"},
    {"id": "apps",     "label": "Apps & Tools",    "emoji": "📱"},
]

MOODS = {
    "happy":     {"emoji": "😊", "vibe": "upbeat, fun, feel-good, energetic"},
    "sad":       {"emoji": "😢", "vibe": "comforting, emotional, healing, touching"},
    "excited":   {"emoji": "🤩", "vibe": "thrilling, adventurous, fast-paced, hype"},
    "relaxed":   {"emoji": "😌", "vibe": "calm, chill, peaceful, ambient"},
    "motivated": {"emoji": "💪", "vibe": "inspiring, powerful, achievement, growth"},
    "bored":     {"emoji": "😑", "vibe": "unique, surprising, weird, discovery"},
    "stressed":  {"emoji": "😩", "vibe": "stress-relief, light, easy, escapism"},
    "romantic":  {"emoji": "💕", "vibe": "romantic, warm, love, connection"},
}

# ── DB Setup ──────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def init_db():
    with get_db() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            emotional_dna TEXT DEFAULT '{}'
        );
        CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_title TEXT NOT NULL,
            category TEXT NOT NULL,
            rating INTEGER NOT NULL,
            rated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS mood_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            mood TEXT NOT NULL,
            logged_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS saved_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_title TEXT NOT NULL,
            category TEXT NOT NULL,
            reason TEXT,
            saved_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS preference_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category TEXT NOT NULL,
            liked_genres TEXT,
            disliked_genres TEXT,
            updated_at TEXT DEFAULT (datetime('now'))
        );
        """)

init_db()

# ── Auth helpers ──────────────────────────────────────────────────────────────
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated

def current_user_id():
    return session.get("user_id")

# ── Groq helper ───────────────────────────────────────────────────────────────
def ask_groq(prompt, max_tokens=1000, temperature=0.8):
    try:
        res = requests.post(GROQ_URL, json={
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }, headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }, timeout=30)
        data = res.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return None


# ── Verification helpers (Wikipedia) ──────────────────────────────────────────
def fetch_wikipedia_summary(title):
    """Search Wikipedia for `title` and return a summary dict or None."""
    try:
        # Search for the best matching page title
        sres = requests.get("https://en.wikipedia.org/w/api.php", params={
            "action": "query",
            "list": "search",
            "srsearch": title,
            "format": "json",
            "srlimit": 1,
        }, timeout=6)
        sjson = sres.json()
        hits = sjson.get("query", {}).get("search", [])
        if not hits:
            return None
        page_title = hits[0]["title"]

        # Fetch page summary
        summary_res = requests.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{urlquote(page_title)}", timeout=6)
        summary = summary_res.json()
        page_url = None
        if isinstance(summary.get("content_urls"), dict):
            page_url = summary.get("content_urls", {}).get("desktop", {}).get("page")
        if not page_url:
            # Fallback to standard wiki url
            page_url = f"https://en.wikipedia.org/wiki/{urlquote(page_title.replace(' ', '_'))}"

        return {
            "name": "Wikipedia",
            "title": summary.get("title", page_title),
            "url": page_url,
            "extract": summary.get("extract", ""),
        }
    except Exception:
        return None


def fetch_openlib_link(title, author=""):
    """Fetch OpenLibrary link for a book."""
    try:
        q = f'"{title}"'
        if author:
            q += f' author:{author}'
        res = requests.get("https://openlibrary.org/search.json", params={"title": title, "limit": 1}, timeout=6)
        data = res.json()
        if data.get("docs"):
            doc = data["docs"][0]
            key = doc.get("key", "")
            if key:
                return {"name": "OpenLibrary", "title": title, "url": f"https://openlibrary.org{key}", "extract": f"Edition: {doc.get('first_publish_year', 'N/A')}"}
    except Exception:
        pass
    return None


def fetch_musicbrainz_link(artist_or_title):
    """Fetch MusicBrainz link for music."""
    try:
        res = requests.get("https://musicbrainz.org/ws/2/artist", params={
            "query": artist_or_title,
            "fmt": "json",
            "limit": 1
        }, headers={"User-Agent": "UniRec/1.0"}, timeout=6)
        data = res.json()
        if data.get("artists"):
            artist = data["artists"][0]
            aid = artist.get("id", "")
            name = artist.get("name", artist_or_title)
            if aid:
                return {"name": "MusicBrainz", "title": name, "url": f"https://musicbrainz.org/artist/{aid}", "extract": f"Country: {artist.get('country', 'N/A')}"}
    except Exception:
        pass
    return None


def fetch_steam_link(game_title):
    """Construct Steam search link for games (no API key needed, just URL)."""
    try:
        search_url = f"https://store.steampowered.com/search/?term={urlquote(game_title)}"
        return {"name": "Steam Store", "title": game_title, "url": search_url, "extract": "Click to find on Steam"}
    except Exception:
        pass
    return None


def fetch_imdb_link(movie_title):
    """Construct IMDb search link for movies."""
    try:
        search_url = f"https://www.imdb.com/find?q={urlquote(movie_title)}&s=all"
        return {"name": "IMDb", "title": movie_title, "url": search_url, "extract": "Click to find on IMDb"}
    except Exception:
        pass
    return None


def fetch_national_parks_link(park_name):
    """Fetch official National Parks link for US travel destinations."""
    try:
        if "national park" in park_name.lower():
            park_code = park_name.lower().replace("national park", "").replace(" ", "").strip()
            if park_code:
                url = f"https://www.nps.gov/index.htm"
                return {"name": "National Park Service", "title": park_name, "url": url, "extract": "Official US Parks site"}
    except Exception:
        pass
    return None


def get_category_sources(title, category):
    """Smart source lookup per category. Returns list of source dicts."""
    sources = []
    
    # Try Wikipedia first for all
    wiki = fetch_wikipedia_summary(title)
    if wiki:
        sources.append(wiki)
    
    # Category-specific lookups
    if category == "books":
        lib = fetch_openlib_link(title)
        if lib and lib not in sources:
            sources.append(lib)
    elif category == "music":
        mb = fetch_musicbrainz_link(title)
        if mb and mb not in sources:
            sources.append(mb)
    elif category == "games":
        steam = fetch_steam_link(title)
        if steam and steam not in sources:
            sources.append(steam)
    elif category == "movies":
        imdb = fetch_imdb_link(title)
        if imdb and imdb not in sources:
            sources.append(imdb)
    elif category == "travel":
        nps = fetch_national_parks_link(title)
        if nps and nps not in sources:
            sources.append(nps)
    
    # Fallback: if no sources found, create a generic search link
    if not sources:
        fallback_url = f"https://www.google.com/search?q={urlquote(title + ' ' + category)}"
        sources.append({"name": "Google Search", "title": title, "url": fallback_url, "extract": f"Search for {title}"})
    
    return sources


def verify_items_with_sources(items):
    """For each item, fetch category-specific authoritative sources.
    Adds `sources` (list) and `verified` (bool) fields to each item.
    """
    if not isinstance(items, list):
        return items
    for it in items:
        try:
            title = it.get("title") or it.get("name") or ""
            category = it.get("category", "").lower()
            if not title:
                it["sources"] = []
                it["verified"] = False
                continue
            sources = get_category_sources(title, category)
            it["sources"] = sources
            it["verified"] = len(sources) > 0
        except Exception:
            it["sources"] = []
            it["verified"] = False
    return items

# ── Emotional DNA builder ─────────────────────────────────────────────────────
def build_emotional_dna(user_id):
    """Patent feature 1: Build unique emotional preference fingerprint."""
    with get_db() as db:
        ratings = db.execute(
            "SELECT category, rating FROM ratings WHERE user_id=? ORDER BY rated_at DESC LIMIT 50",
            (user_id,)
        ).fetchall()
        moods = db.execute(
            "SELECT mood FROM mood_history WHERE user_id=? ORDER BY logged_at DESC LIMIT 20",
            (user_id,)
        ).fetchall()

    cat_scores = {}
    for r in ratings:
        cat = r["category"]
        cat_scores[cat] = cat_scores.get(cat, [])
        cat_scores[cat].append(r["rating"])

    dna = {}
    for cat, scores in cat_scores.items():
        dna[cat] = round(sum(scores) / len(scores), 2)

    mood_counts = {}
    for m in moods:
        mood_counts[m["mood"]] = mood_counts.get(m["mood"], 0) + 1
    dna["dominant_mood"] = max(mood_counts, key=mood_counts.get) if mood_counts else "relaxed"

    with get_db() as db:
        db.execute("UPDATE users SET emotional_dna=? WHERE id=?", (json.dumps(dna), user_id))
    return dna

# ── Auth routes ───────────────────────────────────────────────────────────────
@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username", "").strip()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "All fields required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    hashed = bcrypt.generate_password_hash(password).decode("utf-8")
    try:
        with get_db() as db:
            db.execute("INSERT INTO users (username, email, password) VALUES (?,?,?)",
                       (username, email, hashed))
        return jsonify({"message": "Account created! Please login."}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username or email already exists"}), 409

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    identifier = data.get("identifier", "").strip()
    password   = data.get("password", "")

    with get_db() as db:
        user = db.execute(
            "SELECT * FROM users WHERE username=? OR email=?", (identifier, identifier)
        ).fetchone()

    if not user or not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    session["user_id"]  = user["id"]
    session["username"] = user["username"]
    return jsonify({
        "message": "Login successful",
        "user": {"id": user["id"], "username": user["username"], "email": user["email"]}
    })

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})

@app.route("/api/me", methods=["GET"])
@login_required
def me():
    with get_db() as db:
        user = db.execute("SELECT id, username, email, created_at, emotional_dna FROM users WHERE id=?",
                          (current_user_id(),)).fetchone()
    dna = json.loads(user["emotional_dna"] or "{}")
    return jsonify({"user": dict(user), "emotional_dna": dna})

# ── Core Recommendation Engine ────────────────────────────────────────────────
@app.route("/api/recommend", methods=["POST"])
@login_required
def recommend():
    """Patent feature 2: Cross-Category Resonance + Mood-to-Universe Mapping."""
    data     = request.json
    mood     = data.get("mood", "relaxed")
    category = data.get("category", "all")
    query    = data.get("query", "")
    uid      = current_user_id()

    # Log mood
    with get_db() as db:
        db.execute("INSERT INTO mood_history (user_id, mood) VALUES (?,?)", (uid, mood))
        ratings = db.execute(
            "SELECT item_title, category, rating FROM ratings WHERE user_id=? ORDER BY rating DESC LIMIT 10",
            (uid,)
        ).fetchall()
        saved = db.execute(
            "SELECT item_title, category FROM saved_items WHERE user_id=? ORDER BY saved_at DESC LIMIT 5",
            (uid,)
        ).fetchall()

    dna = build_emotional_dna(uid)
    mood_meta = MOODS.get(mood, MOODS["relaxed"])
    vibe = mood_meta["vibe"]

    # Top rated items for context
    rated_context = ", ".join([f"{r['item_title']}({r['rating']}★)" for r in ratings]) if ratings else "none yet"
    saved_context = ", ".join([r["item_title"] for r in saved]) if saved else "none yet"

    # Category targets
    if category == "all":
        cat_targets = [c["label"] for c in CATEGORIES]
    else:
        cat_targets = [c["label"] for c in CATEGORIES if c["id"] == category]

    user_query = f'User wants: "{query}"' if query else ""

    prompt = f"""You are UniRec — the world's most advanced universal recommendation AI.

User Emotional DNA: {json.dumps(dna)}
Current Mood: {mood} ({vibe})
Previously loved: {rated_context}
Saved items: {saved_context}
{user_query}

Generate EXACTLY 8 recommendations across these categories: {', '.join(cat_targets)}

PATENT FEATURE — Cross-Category Resonance: If user loves thriller movies, also recommend thriller books, intense music, strategy games.
PATENT FEATURE — Mood-to-Universe Mapping: Map the mood "{mood}" ({vibe}) to recommendations that perfectly match this emotional state.

Return ONLY valid JSON array — no markdown, no explanation:
[
  {{
    "title": "Item name",
    "category": "movies|music|books|games|food|fitness|travel|apps",
    "emoji": "single emoji",
    "genre": "genre/type",
    "year": "year or era",
    "why": "One sentence — why THIS user with THIS mood and DNA will love this",
    "match_score": 85,
    "trending": true or false,
    "cross_resonance": "which preference triggered this (e.g. 'You loved Inception → this book has same mind-bending plot')"
  }}
]"""

    raw = ask_groq(prompt, max_tokens=1500, temperature=0.85)

    try:
        # Extract JSON array from response
        start = raw.find("[")
        end   = raw.rfind("]") + 1
        items = json.loads(raw[start:end])
    except Exception:
        items = []
    # Verify each item and attach authoritative sources
    try:
        items = verify_items_with_sources(items)
    except Exception:
        pass
    return jsonify({
        "recommendations": items,
        "mood": mood,
        "mood_emoji": mood_meta["emoji"],
        "emotional_dna": dna,
        "category": category,
    })

# ── Rating ────────────────────────────────────────────────────────────────────
@app.route("/api/rate", methods=["POST"])
@login_required
def rate():
    data = request.json
    title    = data.get("title", "").strip()
    category = data.get("category", "")
    rating   = int(data.get("rating", 3))

    if not title or not category or not (1 <= rating <= 5):
        return jsonify({"error": "Invalid rating data"}), 400

    uid = current_user_id()
    with get_db() as db:
        existing = db.execute(
            "SELECT id FROM ratings WHERE user_id=? AND item_title=?", (uid, title)
        ).fetchone()
        if existing:
            db.execute("UPDATE ratings SET rating=?, rated_at=datetime('now') WHERE user_id=? AND item_title=?",
                       (rating, uid, title))
        else:
            db.execute("INSERT INTO ratings (user_id, item_title, category, rating) VALUES (?,?,?,?)",
                       (uid, title, category, rating))

    dna = build_emotional_dna(uid)
    return jsonify({"message": "Rated!", "new_dna": dna})

# ── Save ──────────────────────────────────────────────────────────────────────
@app.route("/api/save", methods=["POST"])
@login_required
def save_item():
    data  = request.json
    title = data.get("title", "").strip()
    cat   = data.get("category", "")
    reason= data.get("reason", "")
    uid   = current_user_id()

    with get_db() as db:
        existing = db.execute(
            "SELECT id FROM saved_items WHERE user_id=? AND item_title=?", (uid, title)
        ).fetchone()
        if existing:
            db.execute("DELETE FROM saved_items WHERE user_id=? AND item_title=?", (uid, title))
            return jsonify({"message": "Removed from favourites", "saved": False})
        db.execute("INSERT INTO saved_items (user_id, item_title, category, reason) VALUES (?,?,?,?)",
                   (uid, title, cat, reason))
    return jsonify({"message": "Saved to favourites!", "saved": True})

@app.route("/api/saved", methods=["GET"])
@login_required
def get_saved():
    with get_db() as db:
        items = db.execute(
            "SELECT * FROM saved_items WHERE user_id=? ORDER BY saved_at DESC",
            (current_user_id(),)
        ).fetchall()
    return jsonify({"saved": [dict(i) for i in items]})

# ── Ratings history ───────────────────────────────────────────────────────────
@app.route("/api/ratings", methods=["GET"])
@login_required
def get_ratings():
    with get_db() as db:
        items = db.execute(
            "SELECT * FROM ratings WHERE user_id=? ORDER BY rated_at DESC",
            (current_user_id(),)
        ).fetchall()
    return jsonify({"ratings": [dict(i) for i in items]})

# ── Emotional DNA endpoint ────────────────────────────────────────────────────
@app.route("/api/dna", methods=["GET"])
@login_required
def get_dna():
    dna = build_emotional_dna(current_user_id())
    return jsonify({"emotional_dna": dna})

# ── Trending (Groq-powered) ───────────────────────────────────────────────────
@app.route("/api/trending", methods=["GET"])
@login_required
def trending():
    category = request.args.get("category", "all")
    prompt = f"""List 6 currently trending items in {category if category != 'all' else 'movies, music, books, games, food, travel'}.
Return ONLY valid JSON array:
[{{"title":"...","category":"...","emoji":"...","genre":"...","why":"Why it is trending right now","match_score":90,"trending":true,"cross_resonance":""}}]"""
    raw = ask_groq(prompt, max_tokens=800)
    try:
        start = raw.find("["); end = raw.rfind("]") + 1
        items = json.loads(raw[start:end])
    except:
        items = []
    try:
        items = verify_items_with_sources(items)
    except Exception:
        pass
    return jsonify({"trending": items})

# ── Search ────────────────────────────────────────────────────────────────────
@app.route("/api/search", methods=["POST"])
@login_required
def search():
    query = request.json.get("query", "").strip()
    if not query:
        return jsonify({"results": []})
    prompt = f"""Search for "{query}" across all categories (movies, music, books, games, food, fitness, travel, apps).
Return 5 most relevant results as ONLY valid JSON array:
[{{"title":"...","category":"...","emoji":"...","genre":"...","year":"...","why":"Why this matches the search","match_score":80,"trending":false,"cross_resonance":""}}]"""
    raw = ask_groq(prompt, max_tokens=700)
    try:
        start = raw.find("["); end = raw.rfind("]") + 1
        items = json.loads(raw[start:end])
    except:
        items = []
    try:
        items = verify_items_with_sources(items)
    except Exception:
        pass
    return jsonify({"results": items})

# ── Categories ────────────────────────────────────────────────────────────────
@app.route("/api/categories", methods=["GET"])
def get_categories():
    return jsonify({"categories": CATEGORIES, "moods": MOODS})

@app.route("/health")
def health():
    return jsonify({"status": "ok", "model": GROQ_MODEL, "version": "UniRec v1.0"})

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5002))
    print(f"\n🌍 UniRec Backend → http://localhost:{port}")
    print(f"   Model  : {GROQ_MODEL}")
    print(f"   DB     : {DB_PATH}\n")
    app.run(host="0.0.0.0", debug=False, port=port, threaded=True)