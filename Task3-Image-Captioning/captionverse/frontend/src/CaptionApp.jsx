import { useEffect, useRef, useState } from "react";
import "./CaptionApp.css";

const HIGHLIGHTS = [
  "VGG/ResNet visual features",
  "RNN/transformer decoder",
  "One clean caption",
  "Copy-ready output",
];

const FLOW = [
  {
    step: "1",
    title: "Upload an image",
    body: "Drop a JPG, PNG, WEBP, or GIF file into the panel.",
  },
  {
    step: "2",
    title: "Extract visual features",
    body: "A pre-trained encoder such as VGG or ResNet turns the image into feature vectors.",
  },
  {
    step: "3",
    title: "Decode the caption",
    body: "An RNN or transformer converts those features into a natural-language sentence.",
  },
];

const LOADING_STEPS = [
  "Encoding the image",
  "Passing features to the decoder",
  "Turning features into words",
  "Writing the final caption",
];

const PIPELINE_LABEL = "VGG/ResNet encoder + RNN/transformer decoder";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button className="secondary-btn copy-btn" onClick={handleCopy} disabled={!text}>
      {copied ? "Copied" : "Copy caption"}
    </button>
  );
}

export default function CaptionApp() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState("");
  const [model, setModel] = useState("");
  const [pipeline, setPipeline] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!image) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  const loadFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    setImage(file);
    setCaption("");
    setModel("");
    setPipeline("");
    setError("");
  };

  const openPicker = () => fileInputRef.current?.click();

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    loadFile(event.dataTransfer.files?.[0]);
  };

  const runCaption = async () => {
    if (!image || loading) return;

    setLoading(true);
    setError("");
    setCaption("");
    setModel("");
    setPipeline("");

    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch("https://captionverse-d6qr.onrender.com/api/caption", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Caption generation failed.");
      }

      if (!data.caption) {
        throw new Error("Caption model returned no text.");
      }

      setCaption(data.caption.trim());
      setModel(data.model || "");
      setPipeline(data.pipeline || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Caption generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setPreviewUrl("");
    setCaption("");
    setModel("");
    setPipeline("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">CV</div>
          <div>
            <p className="eyebrow">Computer vision + NLP</p>
            <h1>CaptionVerse</h1>
          </div>
        </div>
        <div className="topbar-chip">{PIPELINE_LABEL}</div>
      </header>

      <main className="workspace">
        <section className="hero-card">
          <p className="hero-kicker">Image Captioning AI</p>
          <h2>Turn an image into a concise natural-language caption.</h2>
          <p className="hero-copy">
            Upload a photo and let a pre-trained encoder such as VGG or ResNet extract visual features before an RNN or transformer decoder turns them into one clean sentence.
          </p>
          <div className="feature-row">
            {HIGHLIGHTS.map((item) => (
              <span key={item} className="feature-pill">
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="grid">
          <aside className="panel upload-panel">
            <div className="panel-header">
              <div>
                <h3>Upload image</h3>
                <p>Drop a file here or choose one from your device.</p>
              </div>
              {image && (
                <button className="link-btn" onClick={clearImage}>
                  Clear
                </button>
              )}
            </div>

            <div
              className={`dropzone ${dragging ? "dragging" : ""} ${previewUrl ? "has-image" : ""}`}
              onClick={openPicker}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <div className="preview-frame">
                  <img src={previewUrl} alt="Selected preview" />
                  <div className="preview-overlay">
                    <div>
                      <div className="preview-title">{image?.name || "Selected image"}</div>
                      <div className="preview-subtitle">Ready for captioning</div>
                    </div>
                    <button className="secondary-btn inline-btn" onClick={(event) => { event.stopPropagation(); openPicker(); }}>
                      Replace
                    </button>
                  </div>
                </div>
              ) : (
                <div className="upload-empty">
                  <div className="upload-icon">CV</div>
                  <h4>Drop your image here</h4>
                  <p>Use a photo, artwork, screenshot, or product shot to generate a caption.</p>
                  <div className="upload-helper">JPG · PNG · WEBP · GIF</div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              className="hidden-input"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                loadFile(file);
                event.target.value = "";
              }}
            />

            <div className="panel-actions">
              <button className="secondary-btn" onClick={openPicker}>
                Choose image
              </button>
              <button className="primary-btn" onClick={runCaption} disabled={!image || loading}>
                {loading ? "Generating caption..." : "Generate caption"}
              </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="step-card">
              <div className="step-card-title">How it works</div>
              <div className="step-list">
                {FLOW.map((item) => (
                  <div className="step-item" key={item.step}>
                    <div className="step-index">{item.step}</div>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="panel result-panel">
            <div className="panel-header">
              <div>
                <h3>Caption result</h3>
                <p>One sentence produced by the encoder-decoder pipeline.</p>
              </div>
              {caption && <CopyButton text={caption} />}
            </div>

            {!image && !loading && !caption ? (
              <div className="empty-state">
                <div className="empty-graphic">CV</div>
                <h4>Upload an image to begin</h4>
                <p>The result panel will show a single natural-language caption once the encoder and decoder finish.</p>
                <div className="code-pill">{PIPELINE_LABEL}</div>
              </div>
            ) : loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <h4>Generating caption...</h4>
                <p className="loading-copy">
                  The encoder is reading the image while the decoder turns the features into a concise sentence.
                </p>
                <div className="loading-steps">
                  {LOADING_STEPS.map((step, index) => (
                    <div
                      className="loading-item"
                      key={step}
                      style={{ animationDelay: `${index * 120}ms` }}
                    >
                      <span className="loading-dot" />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="caption-card fade-in">
                  <div className="caption-meta">
                    <span className="caption-chip">{PIPELINE_LABEL}</span>
                    {model && <span className="caption-chip">{model}</span>}
                  </div>
                  <p className="caption-text">{caption}</p>
                  <div className="caption-actions">
                    <CopyButton text={caption} />
                  </div>
                </div>

                <div className="architecture-card">
                  <div className="architecture-title">Classic computer vision + NLP pipeline</div>
                  <div className="architecture-flow">
                    {FLOW.map((item) => (
                      <article className="architecture-item" key={item.step}>
                        <strong>{item.step}</strong>
                        <h4>{item.title}</h4>
                        <p>{item.body}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
