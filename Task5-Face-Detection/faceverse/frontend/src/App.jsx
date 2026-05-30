import { useState, useRef, useCallback, useEffect } from "react";
import "./App.css";

const DETECTORS = [
  { id:"dnn",  label:"Deep Learning", emoji:"🧠", desc:"SSD ResNet — high accuracy" },
  { id:"haar", label:"Haar Cascade",  emoji:"🔍", desc:"OpenCV classic — fast" },
  { id:"both", label:"Both",          emoji:"⚡", desc:"Best of both" },
];

const EMOTION_COLORS = {
  happy:"#fbbf24", sad:"#60a5fa", angry:"#f87171",
  surprised:"#a78bfa", neutral:"#34d399", fearful:"#fb923c", disgusted:"#f472b6"
};

const TABS = [
  { id:"image",    label:"📷 Image",    desc:"Upload photo" },
  { id:"webcam",   label:"🎥 Webcam",   desc:"Live detection" },
  { id:"registry", label:"👤 Registry", desc:"Known faces" },
  { id:"stats",    label:"📊 Stats",    desc:"Detection history" },
];

function FaceCard({ face, emotion, ageGender, index }) {
  const colors = ["#00d4aa","#a78bfa","#f472b6","#60a5fa","#fbbf24"];
  const color = colors[index % colors.length];
  const emotionColor = EMOTION_COLORS[emotion?.emotion] || "#34d399";
  return (
    <div className="face-card" style={{"--fc":color}} role="article">
      <div className="fc-header">
        <div className="fc-num" style={{background:color}}>#{index+1}</div>
        <div className="fc-method">{face.method}</div>
        {face.confidence && <div className="fc-conf">{face.confidence}%</div>}
      </div>
      {emotion && (
        <div className="fc-emotion" style={{color:emotionColor}}>
          <span className="fc-emoji">{emotion.emotion_emoji}</span>
          <div>
            <div className="fc-emotion-name">{emotion.emotion}</div>
            <div className="fc-emotion-conf">{emotion.emotion_confidence}% confident</div>
          </div>
        </div>
      )}
      {ageGender && (
        <div className="fc-ag">
          <span>👤 {ageGender.gender}</span>
          <span>🎂 Age {ageGender.age_range}</span>
        </div>
      )}
      {emotion?.description && <p className="fc-desc">{emotion.description}</p>}
      <div className="fc-pos">Position: ({face.x}, {face.y}) · {face.w}×{face.h}px</div>
    </div>
  );
}

export default function App() {
  const [tab, setTab]             = useState("image");
  const [detector, setDetector]   = useState("dnn");
  const [image, setImage]         = useState(null);
  const [imageUrl, setImageUrl]   = useState(null);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamResult, setWebcamResult] = useState(null);
  const [registry, setRegistry]   = useState([]);
  const [regName, setRegName]     = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [stats, setStats]         = useState(null);
  const [dragging, setDragging]   = useState(false);

  const fileRef    = useRef(null);
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const intervalRef = useRef(null);

  const loadRegistry = useCallback(async () => {
    try {
      const r = await fetch("/api/registry");
      const d = await r.json();
      setRegistry(d.people || []);
    } catch {}
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const r = await fetch("/api/stats");
      const d = await r.json();
      setStats(d);
    } catch {}
  }, []);

  useEffect(() => {
    loadRegistry();
    loadStats();
  }, [loadRegistry, loadStats]);

  const analyze = useCallback(async (imageB64) => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/analyze", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ image: imageB64, detector }),
      });
      const text = await r.text();
      if (!text) throw new Error("Empty response from server");
      let d;
      try { d = JSON.parse(text); } catch(err) { throw new Error("Invalid JSON response from server"); }
      if (!r.ok) throw new Error(d.error || "Analysis failed");
      return d;
    } catch(e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [detector]);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(file);
    setResult(null); setError("");
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    // Auto-analyze
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = await analyze(e.target.result);
      if (data) setResult(data);
    };
    reader.readAsDataURL(file);
  };

  // Webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setWebcamActive(true);
    } catch {
      setError("Camera access denied.");
    }
  };

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    clearInterval(intervalRef.current);
    setWebcamActive(false);
    setWebcamResult(null);
  };

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const data = await analyze(dataUrl);
    if (data) setWebcamResult(data);
  }, [analyze]);

  const startLiveDetection = () => {
    intervalRef.current = setInterval(captureAndAnalyze, 2000);
  };

  const stopLiveDetection = () => {
    clearInterval(intervalRef.current);
  };

  // Register face
  const registerFace = async () => {
    if (!regName.trim()) return;
    setRegLoading(true);
    try {
      const imageData = imageUrl ? await fetch(imageUrl).then(r=>r.blob()).then(b=>new Promise(res=>{const rd=new FileReader();rd.onload=e=>res(e.target.result);rd.readAsDataURL(b)})) : "";
      await fetch("/api/register-face", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ name: regName, image: imageData }),
      });
      setRegName("");
      loadRegistry();
    } catch {}
    setRegLoading(false);
  };

  const deleteRegistered = async (id) => {
    await fetch(`/api/registry/${id}`, { method:"DELETE" });
    loadRegistry();
  };

  const activeResult = tab === "webcam" ? webcamResult : result;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">FaceVerse</span>
          <span className="logo-chip">Facial Intelligence Engine</span>
        </div>
        <div className="header-right">
          <div className="detector-row">
            {DETECTORS.map(d => (
              <button key={d.id} className={`det-btn ${detector===d.id?"active":""}`}
                onClick={() => setDetector(d.id)} title={d.desc}>
                {d.emoji} {d.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs-bar">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${tab===t.id?"active":""}`}
            onClick={() => { setTab(t.id); if(t.id==="stats") loadStats(); if(t.id==="registry") loadRegistry(); }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="layout">
        {/* LEFT */}
        <aside className="left-panel">
          {/* Image tab */}
          {tab === "image" && (
            <>
              <div
                className={`dropzone ${dragging?"dragging":""} ${imageUrl?"has-image":""}`}
                onDragOver={e=>{e.preventDefault();setDragging(true)}}
                onDragLeave={()=>setDragging(false)}
                onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0])}}
                onClick={()=>!imageUrl&&fileRef.current?.click()}
              >
                {imageUrl ? (
                  <div className="preview-wrap">
                    <img src={imageUrl} className="preview-img" alt="preview" />
                    {loading && (
                      <div className="scan-overlay">
                        <div className="scan-line" />
                        <div className="scan-badge">Detecting faces...</div>
                      </div>
                    )}
                    <button className="change-btn" onClick={e=>{e.stopPropagation();fileRef.current?.click()}}>Change</button>
                  </div>
                ) : (
                  <div className="drop-empty">
                    <div className="drop-icon">🎭</div>
                    <div className="drop-title">Drop image here</div>
                    <div className="drop-sub">Auto-detects faces instantly</div>
                    <div className="drop-formats">JPG · PNG · WEBP</div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e=>handleFile(e.target.files[0])} />
              <button className="analyze-btn" onClick={()=>fileRef.current?.click()}>
                📁 Choose Image
              </button>
            </>
          )}

          {/* Webcam tab */}
          {tab === "webcam" && (
            <div className="webcam-panel">
              <div className="video-wrap">
                <video ref={videoRef} autoPlay muted playsInline className="video-feed" />
                <canvas ref={canvasRef} className="hidden" />
                {webcamActive && webcamResult && (
                  <div className="webcam-badge">{webcamResult.face_count} face{webcamResult.face_count!==1?"s":""} detected</div>
                )}
              </div>
              <div className="webcam-controls">
                {!webcamActive ? (
                  <button className="analyze-btn" onClick={startWebcam}>🎥 Start Camera</button>
                ) : (
                  <>
                    <button className="analyze-btn" onClick={captureAndAnalyze} disabled={loading}>
                      {loading?"Analyzing...":"📸 Capture & Analyze"}
                    </button>
                    <button className="sec-btn" onClick={startLiveDetection}>⚡ Live Mode</button>
                    <button className="danger-btn" onClick={stopWebcam}>⏹ Stop</button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Registry tab */}
          {tab === "registry" && (
            <div className="registry-panel">
              <div className="reg-add">
                <div className="ctrl-label">Register new face</div>
                <input className="reg-input" placeholder="Enter person's name"
                  value={regName} onChange={e=>setRegName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&registerFace()} />
                <button className="analyze-btn" onClick={registerFace} disabled={regLoading||!regName.trim()}>
                  {regLoading?"Registering...":"➕ Register Face"}
                </button>
                <p className="reg-note">Upload an image first, then register the face from it.</p>
              </div>
              <div className="ctrl-label" style={{marginTop:16}}>Registered people ({registry.length})</div>
              <div className="reg-list">
                {registry.length === 0 && <div className="empty-reg">No faces registered yet</div>}
                {registry.map(p => (
                  <div key={p.id} className="reg-item">
                    <div className="reg-avatar">{p.name[0].toUpperCase()}</div>
                    <div className="reg-info">
                      <div className="reg-name">{p.name}</div>
                      <div className="reg-date">{new Date(p.registered_at).toLocaleDateString()}</div>
                    </div>
                    <button className="reg-del" onClick={()=>deleteRegistered(p.id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats tab */}
          {tab === "stats" && stats && (
            <div className="stats-panel">
              <div className="stat-card"><span>{stats.total_analyses}</span><label>Total analyses</label></div>
              <div className="stat-card"><span>{stats.total_faces_detected}</span><label>Total faces found</label></div>
              <div className="ctrl-label" style={{marginTop:16}}>Recent detections</div>
              {stats.recent?.map((r,i) => (
                <div key={i} className="log-item">
                  <span className="log-count">{r.face_count} faces</span>
                  <span className="log-density">{r.crowd_density}</span>
                  <span className="log-date">{new Date(r.detected_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}

          {error && <div className="error-box">⚠ {error}</div>}
        </aside>

        {/* RIGHT — Results */}
        <main className="right-panel">
          {!activeResult && !loading && (
            <div className="empty-state">
              <div className="es-icon" style={{animation:"float 3s ease-in-out infinite"}}>🎭</div>
              <h2>FaceVerse — Facial Intelligence Engine</h2>
              <p>Upload an image or start webcam to detect faces, analyze emotions, estimate age & gender, and perform crowd analysis.</p>
              <div className="es-chips">
                {["🔍 Haar Cascade","🧠 Deep Learning DNN","😊 Emotion AI","👤 Age & Gender","👥 Crowd Analysis","🏷️ Face Registry"].map(f=>(
                  <span key={f} className="es-chip">{f}</span>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="loading-orb" />
              <h3>Analyzing faces...</h3>
              <div className="loading-steps">
                {["Running Haar Cascade detector","Running DNN face detector","Groq emotion analysis","Age & gender estimation","Crowd analysis"].map((s,i)=>(
                  <div key={i} className="load-step" style={{animationDelay:`${i*0.2}s`}}>
                    <span className="load-dot" />{s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeResult && !loading && (
            <div className="results" style={{animation:"fadeIn 0.4s ease"}}>
              {/* Annotated image */}
              {activeResult.annotated_image && (
                <div className="annotated-wrap">
                  <img src={`data:image/jpeg;base64,${activeResult.annotated_image}`}
                    className="annotated-img" alt="annotated" />
                </div>
              )}

              {/* Crowd summary */}
              <div className="crowd-bar">
                <span className="crowd-emoji">{activeResult.crowd?.density_emoji}</span>
                <div>
                  <div className="crowd-title">{activeResult.face_count} face{activeResult.face_count!==1?"s":""} detected — {activeResult.crowd?.density}</div>
                  <div className="crowd-note">{activeResult.crowd?.note}</div>
                </div>
                <div className="detector-badges">
                  <span className="det-badge">Haar: {activeResult.haar_count}</span>
                  <span className="det-badge">DNN: {activeResult.dnn_count}</span>
                </div>
              </div>

              {/* Face cards */}
              {activeResult.face_count > 0 && (
                <div className="faces-grid">
                  {activeResult.faces.map((face, i) => (
                    <FaceCard key={i} face={face} index={i}
                      emotion={activeResult.emotions?.[i]}
                      ageGender={activeResult.age_gender?.[i]} />
                  ))}
                </div>
              )}

              {activeResult.face_count === 0 && (
                <div className="no-faces">
                  <span>😶</span>
                  <h3>No faces detected</h3>
                  <p>Try a clearer image with visible faces, or switch detector.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
