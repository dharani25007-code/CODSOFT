import { useState } from "react";
import { api } from "./api.js";
import "./Auth.css";

const FEATURES = [
  { emoji: "🌍", text: "Recommendations across 8 universes" },
  { emoji: "🧬", text: "Emotional DNA fingerprint — unique to you" },
  { emoji: "🔗", text: "Cross-category resonance engine" },
  { emoji: "🎭", text: "Mood-to-universe mapping" },
  { emoji: "⭐", text: "Rate, save & learn your taste" },
];

export default function Auth({ onAuth }) {
  const [mode, setMode]       = useState("login"); // login | register
  const [form, setForm]       = useState({ username:"", email:"", password:"", confirm:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const set = (k, v) => { setForm(f => ({...f, [k]: v})); setError(""); };

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!form.password) return setError("Password is required");
    if (mode === "register") {
      if (!form.username || !form.email) return setError("All fields are required");
      if (form.password.length < 6) return setError("Password must be at least 6 characters");
      if (form.password !== form.confirm) return setError("Passwords do not match");
    }
    if (!form.password && mode === "login") return setError("Enter your credentials");

    setLoading(true);
    try {
      if (mode === "register") {
        await api.register({ username: form.username, email: form.email, password: form.password });
        setSuccess("Account created! Logging you in...");
        await new Promise(r => setTimeout(r, 800));
        const data = await api.login({ identifier: form.username, password: form.password });
        onAuth(data.user);
      } else {
        const data = await api.login({ identifier: form.email || form.username, password: form.password });
        onAuth(data.user);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">
            <span className="auth-logo-icon">◈</span>
            <span className="auth-logo-text">UniRec</span>
          </div>
          <p className="auth-tagline">The Universe of Recommendations — Personalized for You</p>
        </div>

        <div className="auth-features">
          {FEATURES.map((f, i) => (
            <div key={i} className="auth-feature" style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="af-emoji">{f.emoji}</span>
              <span className="af-text">{f.text}</span>
            </div>
          ))}
        </div>

        <div className="auth-categories">
          {["🎬","🎵","📚","🎮","🍕","🏋️","🌍","📱"].map((e, i) => (
            <div key={i} className="cat-orb" style={{ animationDelay: `${i * 0.15}s` }}>{e}</div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-right">
        <div className="auth-card">
          {/* Tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab ${mode==="login"?"active":""}`} onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>
              Sign In
            </button>
            <button className={`auth-tab ${mode==="register"?"active":""}`} onClick={() => { setMode("register"); setError(""); setSuccess(""); }}>
              Create Account
            </button>
          </div>

          <div className="auth-form">
            <h2 className="auth-title">
              {mode === "login" ? "Welcome back 👋" : "Join UniRec 🌍"}
            </h2>
            <p className="auth-sub">
              {mode === "login"
                ? "Sign in to your personalized universe"
                : "Create your Emotional DNA profile"}
            </p>

            {mode === "register" && (
              <div className="field-group">
                <label className="field-label">Username</label>
                <input
                  className="field-input"
                  placeholder="e.g. jack"
                  value={form.username}
                  onChange={e => set("username", e.target.value)}
                  onKeyDown={handleKey}
                />
              </div>
            )}

            <div className="field-group">
              <label className="field-label">
                {mode === "login" ? "Username or Email" : "Email"}
              </label>
              <input
                className="field-input"
                placeholder={mode === "login" ? "username or email" : "you@email.com"}
                value={mode === "login" ? (form.email || form.username) : form.email}
                onChange={e => mode === "login" ? set("email", e.target.value) : set("email", e.target.value)}
                onKeyDown={handleKey}
                type={mode === "register" ? "email" : "text"}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Password</label>
              <input
                className="field-input"
                type="password"
                placeholder={mode === "register" ? "min 6 characters" : "your password"}
                value={form.password}
                onChange={e => set("password", e.target.value)}
                onKeyDown={handleKey}
              />
            </div>

            {mode === "register" && (
              <div className="field-group">
                <label className="field-label">Confirm Password</label>
                <input
                  className="field-input"
                  type="password"
                  placeholder="repeat password"
                  value={form.confirm}
                  onChange={e => set("confirm", e.target.value)}
                  onKeyDown={handleKey}
                />
              </div>
            )}

            {error   && <div className="auth-error">⚠ {error}</div>}
            {success && <div className="auth-success">✓ {success}</div>}

            <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? <span className="auth-spinner" /> : null}
              {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>

            <p className="auth-switch">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button className="auth-switch-btn" onClick={() => { setMode(mode==="login"?"register":"login"); setError(""); setSuccess(""); }}>
                {mode === "login" ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
