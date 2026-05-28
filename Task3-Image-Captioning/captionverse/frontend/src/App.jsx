import { useState, useRef, useCallback } from "react";
import "./App.css";

const STYLES = [
  { id:"professional", label:"Professional", emoji:"💼", desc:"Formal & informative" },
  { id:"poetic",       label:"Poetic",       emoji:"🌸", desc:"Lyrical & emotional" },
  { id:"funny",        label:"Funny",        emoji:"😂", desc:"Witty & humorous" },
  { id:"news",         label:"News",         emoji:"📰", desc:"Breaking news style" },
  { id:"social",       label:"Social",       emoji:"📱", desc:"Instagram ready" },
];

const LANGUAGES = [
  { id:"english", label:"English",  flag:"🇬🇧" },
  { id:"tamil",   label:"Tamil",    flag:"🇮🇳" },
  { id:"hindi",   label:"Hindi",    flag:"🇮🇳" },
  { id:"french",  label:"French",   flag:"🇫🇷" },
  { id:"spanish", label:"Spanish",  flag:"🇪🇸" },
  { id:"arabic",  label:"Arabic",   flag:"🇸🇦" },
  { id:"japanese",label:"Japanese", flag:"🇯🇵" },
];

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className="copy-btn" onClick={copy}>{copied ? "✓ Copied" : "Copy"}</button>
  );
}

function ConfidenceBar({ value, color = "var(--accent2)" }) {
  return (
    <div className="conf-track">
      <div className="conf-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

export default function App() {
  const [image, setImage]         = useState(null);
  const [imageUrl, setImageUrl]   = useState(null);
  const [style, setStyle]         = useState("professional");
  const [language, setLanguage]   = useState("english");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");
  const [activeTab, setActiveTab] = useState("caption");
  const [dragging, setDragging]   = useState(false);
  const [restyling, setRestyling] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translations, setTranslations] = useState({});
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
    setResult(null);
    setError("");
    setTranslations({});
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const analyze = useCallback(async () => {
    if (!image) return;
    setLoading(true); setError(""); setResult(null);
    const fd = new FormData();
    fd.append("image", image);
    fd.append("style", style);
    fd.append("language", language);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data.analysis);
      setActiveTab("caption");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [image, style, language]);

  const restyle = async (newStyle) => {
    if (!result) return;
    setRestyling(true);
    try {
      const res = await fetch("/api/restyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: result.caption, style: newStyle, language }),
      });
      const data = await res.json();
      setResult(r => ({ ...r, caption: data.caption }));
      setStyle(newStyle);
    } catch {}
    finally { setRestyling(false); }
  };

  const translate = async (lang) => {
    if (!result || translations[lang]) return;
    setTranslating(true);
    try {
      const res = await fetch("/api/translate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: result.caption, language: lang }),
      });
      const data = await res.json();
      setTranslations(t => ({ ...t, [lang]: data.translated }));
    } catch {}
    finally { setTranslating(false); }
  };

  const TABS = [
    { id:"caption",   label:"Caption",   emoji:"📝" },
    { id:"emotion",   label:"Emotion",   emoji:"🎭" },
    { id:"story",     label:"Story",     emoji:"📖" },
    { id:"objects",   label:"Objects",   emoji:"🔍" },
    { id:"hashtags",  label:"Hashtags",  emoji:"🏷️" },
    { id:"translate", label:"Translate", emoji:"🌍" },
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">CaptionVerse</span>
          <span className="logo-chip">ResNet50 + transformer decoder</span>
        </div>
        <div className="header-meta">
          <span className="powered">Powered by ResNet50 features · transformer decoder</span>
        </div>
      </header>

      <div className="layout">
        {/* LEFT — Upload + Controls */}
        <aside className="left-panel">
          {/* Drop zone */}
          <div
            className={`dropzone ${dragging ? "dragging" : ""} ${imageUrl ? "has-image" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !imageUrl && fileRef.current?.click()}
          >
            {imageUrl ? (
              <div className="image-preview-wrap">
                <img src={imageUrl} className="preview-img" alt="preview" />
                {loading && (
                  <div className="scan-overlay">
                    <div className="scan-line" />
                    <div className="scan-text">Analyzing...</div>
                  </div>
                )}
                <button className="change-btn" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                  Change Image
                </button>
              </div>
            ) : (
              <div className="drop-placeholder">
                <div className="drop-icon">🖼️</div>
                <div className="drop-title">Drop your image here</div>
                <div className="drop-sub">or click to browse</div>
                <div className="drop-formats">JPG · PNG · WEBP · GIF</div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden-input"
            onChange={e => handleFile(e.target.files[0])} />

          {/* Style selector */}
          <div className="control-section">
            <div className="ctrl-label">Caption Style</div>
            <div className="style-grid">
              {STYLES.map(s => (
                <button key={s.id}
                  className={`style-btn ${style===s.id?"active":""}`}
                  onClick={() => result ? restyle(s.id) : setStyle(s.id)}>
                  <span className="sb-emoji">{s.emoji}</span>
                  <span className="sb-label">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language selector */}
          <div className="control-section">
            <div className="ctrl-label">Output Language</div>
            <div className="lang-grid">
              {LANGUAGES.map(l => (
                <button key={l.id}
                  className={`lang-btn ${language===l.id?"active":""}`}
                  onClick={() => setLanguage(l.id)}>
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze button */}
          <button className="analyze-btn" onClick={analyze} disabled={!image || loading}>
            {loading
              ? <><span className="btn-spinner" /> Analyzing image...</>
              : <><span>✦</span> Analyze Image</>}
          </button>

          {error && <div className="error-box">⚠ {error}</div>}

          {/* Stats */}
          {result && (
            <div className="result-stats">
              <div className="stat-item">
                <span className="stat-val">{result.confidence}%</span>
                <span className="stat-label">Confidence</span>
              </div>
              <div className="stat-item">
                <span className="stat-val">{result.objects?.length || 0}</span>
                <span className="stat-label">Objects</span>
              </div>
              <div className="stat-item">
                <span className="stat-val">{result.hashtags?.length || 0}</span>
                <span className="stat-label">Hashtags</span>
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT — Results */}
        <main className="right-panel">
          {!result && !loading && (
            <div className="empty-state">
              <div className="empty-icon" style={{animation:"float 3s ease-in-out infinite"}}>◈</div>
              <h2>Upload an image to begin</h2>
              <p>CaptionVerse will extract visual features with a pretrained ResNet50 encoder and generate captions with a transformer decoder, while also showing extra analysis like objects, emotion, story, hashtags, and translation.</p>
              <div className="feature-chips">
                {["📝 Smart Caption","🎭 Emotion Detection","📖 Scene Story","🔍 Object Detection","🏷️ Hashtags & SEO","🌍 7 Languages"].map(f=>(
                  <span key={f} className="feature-chip">{f}</span>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="loading-orb" />
              <h3>ResNet50 encoder + transformer decoder running...</h3>
              <div className="loading-steps">
                {["Extracting ResNet50 features","Classifying visual concepts","Generating caption text","Building extra analysis","Creating hashtags & SEO tags","Composing caption"].map((s,i)=>(
                  <div key={i} className="loading-step" style={{animationDelay:`${i*0.3}s`}}>
                    <span className="step-dot" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className="results" style={{animation:"fadeIn 0.4s ease"}}>
              {/* Scene info bar */}
              <div className="scene-bar">
                <span className="scene-type">🎬 {result.scene_type}</span>
                <span className="scene-sep">·</span>
                <span className="color-mood">🎨 {result.color_mood}</span>
                <span className="scene-sep">·</span>
                <span className="emotion-chip" >
                  {result.emotion_emoji} {result.emotion}
                  <span className="emotion-score">{result.emotion_score}%</span>
                </span>
                <ConfidenceBar value={result.confidence} />
              </div>

              {/* Tabs */}
              <div className="tabs">
                {TABS.map(t => (
                  <button key={t.id} className={`tab ${activeTab===t.id?"active":""}`}
                    onClick={() => setActiveTab(t.id)}>
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>

              <div className="tab-body">
                {/* Caption tab */}
                {activeTab === "caption" && (
                  <div className="tab-content" style={{animation:"fadeIn 0.3s ease"}}>
                    <div className="result-card main-caption">
                      <div className="rc-header">
                        <span className="rc-title">
                          {STYLES.find(s=>s.id===style)?.emoji} {STYLES.find(s=>s.id===style)?.label} Caption
                        </span>
                        {restyling && <span className="restyling-badge">Restyling...</span>}
                        <CopyBtn text={result.caption} />
                      </div>
                      <p className="caption-text">{result.caption}</p>
                    </div>
                    {result.caption_alt && (
                      <div className="result-card alt-caption">
                        <div className="rc-header">
                          <span className="rc-title">✨ Alternative Caption</span>
                          <CopyBtn text={result.caption_alt} />
                        </div>
                        <p className="caption-text alt">{result.caption_alt}</p>
                      </div>
                    )}
                    <div className="style-switcher">
                      <div className="ss-label">Switch style instantly:</div>
                      <div className="ss-btns">
                        {STYLES.filter(s=>s.id!==style).map(s=>(
                          <button key={s.id} className="ss-btn" onClick={() => restyle(s.id)} disabled={restyling}>
                            {s.emoji} {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Emotion tab */}
                {activeTab === "emotion" && (
                  <div className="tab-content" style={{animation:"fadeIn 0.3s ease"}}>
                    <div className="result-card emotion-card">
                      <div className="emotion-big">{result.emotion_emoji}</div>
                      <div className="emotion-name">{result.emotion}</div>
                      <div className="emotion-conf">{result.emotion_score}% confidence</div>
                      <ConfidenceBar value={result.emotion_score} color="#a78bfa" />
                      <div className="scene-details">
                        <div className="sd-item"><span>Scene</span><strong>{result.scene_type}</strong></div>
                        <div className="sd-item"><span>Color mood</span><strong>{result.color_mood}</strong></div>
                        <div className="sd-item"><span>AI confidence</span><strong>{result.confidence}%</strong></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Story tab */}
                {activeTab === "story" && (
                  <div className="tab-content" style={{animation:"fadeIn 0.3s ease"}}>
                    <div className="result-card story-card">
                      <div className="rc-header">
                        <span className="rc-title">📖 Scene Story</span>
                        <CopyBtn text={result.story} />
                      </div>
                      <p className="story-text">{result.story}</p>
                    </div>
                  </div>
                )}

                {/* Objects tab */}
                {activeTab === "objects" && (
                  <div className="tab-content" style={{animation:"fadeIn 0.3s ease"}}>
                    <div className="result-card">
                      <div className="rc-header">
                        <span className="rc-title">🔍 Detected Objects ({result.objects?.length || 0})</span>
                      </div>
                      <div className="objects-list">
                        {result.objects?.map((obj, i) => (
                          <div key={i} className="object-item" style={{animationDelay:`${i*0.05}s`}}>
                            <span className="obj-name">{obj.name}</span>
                            <div className="obj-bar-wrap">
                              <ConfidenceBar value={obj.confidence} color={`hsl(${260-i*15},70%,70%)`} />
                            </div>
                            <span className="obj-conf">{obj.confidence}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Hashtags tab */}
                {activeTab === "hashtags" && (
                  <div className="tab-content" style={{animation:"fadeIn 0.3s ease"}}>
                    <div className="result-card">
                      <div className="rc-header">
                        <span className="rc-title">🏷️ Hashtags</span>
                        <CopyBtn text={result.hashtags?.map(h=>`#${h}`).join(" ")} />
                      </div>
                      <div className="hashtag-cloud">
                        {result.hashtags?.map((h, i) => (
                          <span key={i} className="hashtag" style={{animationDelay:`${i*0.05}s`}}>#{h}</span>
                        ))}
                      </div>
                    </div>
                    <div className="result-card" style={{marginTop:16}}>
                      <div className="rc-header">
                        <span className="rc-title">🔍 SEO Keywords</span>
                        <CopyBtn text={result.seo_tags?.join(", ")} />
                      </div>
                      <div className="seo-tags">
                        {result.seo_tags?.map((t, i) => (
                          <span key={i} className="seo-tag">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Translate tab */}
                {activeTab === "translate" && (
                  <div className="tab-content" style={{animation:"fadeIn 0.3s ease"}}>
                    <div className="result-card">
                      <div className="rc-header">
                        <span className="rc-title">🌍 Translate Caption</span>
                      </div>
                      <p className="orig-caption">Original: {result.caption}</p>
                      <div className="translate-langs">
                        {LANGUAGES.map(l => (
                          <div key={l.id} className="trans-item">
                            <button className="trans-btn" onClick={() => translate(l.id)} disabled={translating}>
                              {l.flag} {l.label}
                              {!translations[l.id] && <span className="trans-generate">Generate</span>}
                            </button>
                            {translations[l.id] && (
                              <div className="trans-result">
                                <p>{translations[l.id]}</p>
                                <CopyBtn text={translations[l.id]} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {translating && <div className="translating-badge">Translating...</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
