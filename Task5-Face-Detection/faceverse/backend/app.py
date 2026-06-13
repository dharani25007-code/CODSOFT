import os, json, base64, sqlite3, io, urllib.request
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import numpy as np
import requests as req_lib

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:3004"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL   = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
PORT         = int(os.getenv("PORT", 5004))
DB_PATH      = os.path.join(os.path.dirname(__file__), "faceverse.db")
MODELS_DIR   = os.path.join(os.path.dirname(__file__), "models")

os.makedirs(MODELS_DIR, exist_ok=True)

# ── Model URLs ─────────────────────────────────────────────────────────────────
MODEL_URLS = {
    "deploy.prototxt": "https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt",
    "res10_300x300_ssd_iter_140000.caffemodel": "https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel",
    "age_deploy.prototxt": "https://raw.githubusercontent.com/spmallick/learnopencv/master/AgeGender/age_deploy.prototxt",
    "age_net.caffemodel": "https://huggingface.co/AjaySharma/genderDetection/resolve/main/age_net.caffemodel",
    "gender_deploy.prototxt": "https://raw.githubusercontent.com/spmallick/learnopencv/master/AgeGender/gender_deploy.prototxt",
    "gender_net.caffemodel": "https://huggingface.co/AjaySharma/genderDetection/resolve/main/gender_net.caffemodel",
}

AGE_LIST    = ["(0-2)", "(4-6)", "(8-12)", "(15-20)", "(25-32)", "(38-43)", "(48-53)", "(60-100)"]
GENDER_LIST = ["Male", "Female"]

EMOTION_LABELS = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprised"]

# ── Lazy model cache ──────────────────────────────────────────────────────────
_cache = {}

def download_model(filename, url):
    path = os.path.join(MODELS_DIR, filename)
    if not os.path.exists(path):
        print(f"  Downloading {filename}...")
        try:
            urllib.request.urlretrieve(url, path)
            print(f"  ✅ {filename} downloaded")
        except Exception as e:
            print(f"  ⚠️  Could not download {filename}: {e}")
            return None
    return path

def get_face_detector_dnn():
    if "face_dnn" not in _cache:
        try:
            import cv2
            proto = download_model("deploy.prototxt", MODEL_URLS["deploy.prototxt"])
            model = download_model("res10_300x300_ssd_iter_140000.caffemodel",
                                   MODEL_URLS["res10_300x300_ssd_iter_140000.caffemodel"])
            if proto and model:
                try:
                    _cache["face_dnn"] = cv2.dnn.readNetFromCaffe(proto, model)
                    print("✅ DNN face detector loaded")
                except Exception as e:
                    print(f"⚠️  DNN load failed: {e}")
                    # Remove potentially corrupted model and retry download once
                    try:
                        if os.path.exists(model):
                            os.remove(model)
                            print("  Removed corrupted DNN model file, retrying download...")
                            model = download_model("res10_300x300_ssd_iter_140000.caffemodel",
                                                   MODEL_URLS["res10_300x300_ssd_iter_140000.caffemodel"])
                            if model:
                                _cache["face_dnn"] = cv2.dnn.readNetFromCaffe(proto, model)
                                print("✅ DNN face detector loaded after re-download")
                            else:
                                _cache["face_dnn"] = None
                        else:
                            _cache["face_dnn"] = None
                    except Exception as e2:
                        print(f"⚠️  DNN load retry failed: {e2}")
                        _cache["face_dnn"] = None
            else:
                _cache["face_dnn"] = None
        except Exception as e:
            print(f"⚠️  DNN load failed: {e}")
            _cache["face_dnn"] = None
    return _cache["face_dnn"]

def get_haar():
    if "haar" not in _cache:
        try:
            import cv2
            haar = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
            _cache["haar"] = haar
            print("✅ Haar cascade loaded")
        except Exception as e:
            print(f"⚠️  Haar load failed: {e}")
            _cache["haar"] = None
    return _cache["haar"]

def get_eye_cascade():
    if "eye_cascade" not in _cache:
        try:
            import cv2
            _cache["eye_cascade"] = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
        except:
            _cache["eye_cascade"] = None
    return _cache["eye_cascade"]

def get_age_net():
    if "age_net" not in _cache:
        try:
            import cv2
            proto = download_model("age_deploy.prototxt", MODEL_URLS["age_deploy.prototxt"])
            model = download_model("age_net.caffemodel", MODEL_URLS["age_net.caffemodel"])
            if proto and model:
                _cache["age_net"] = cv2.dnn.readNetFromCaffe(proto, model)
                print("✅ Age Caffe model loaded")
            else:
                _cache["age_net"] = None
        except Exception as e:
            print(f"⚠️  Age model load failed: {e}")
            _cache["age_net"] = None
    return _cache["age_net"]

def get_gender_net():
    if "gender_net" not in _cache:
        try:
            import cv2
            proto = download_model("gender_deploy.prototxt", MODEL_URLS["gender_deploy.prototxt"])
            model = download_model("gender_net.caffemodel", MODEL_URLS["gender_net.caffemodel"])
            if proto and model:
                _cache["gender_net"] = cv2.dnn.readNetFromCaffe(proto, model)
                print("✅ Gender Caffe model loaded")
            else:
                _cache["gender_net"] = None
        except Exception as e:
            print(f"⚠️  Gender model load failed: {e}")
            _cache["gender_net"] = None
    return _cache["gender_net"]

def predict_age_gender_local(img, faces):
    import cv2
    age_net = get_age_net()
    gender_net = get_gender_net()
    if age_net is None or gender_net is None:
        return None
    
    MODEL_MEAN_VALUES = (78.4263377603, 87.7689143744, 114.895847746)
    results = []
    img_h, img_w = img.shape[:2]
    
    for i, face in enumerate(faces):
        x, y, w, h = face["x"], face["y"], face["w"], face["h"]
        
        # Add a minor 5% padding to capture full head context
        pad_x = int(w * 0.05)
        pad_y = int(h * 0.05)
        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(img_w, x + w + pad_x)
        y2 = min(img_h, y + h + pad_y)
        
        if x2 - x1 <= 0 or y2 - y1 <= 0:
            results.append({
                "face_id": i + 1,
                "age_range": "20-35",
                "gender": "Unknown",
                "gender_confidence": 50
            })
            continue
            
        face_img = img[y1:y2, x1:x2]
        try:
            # Test-Time Augmentation (TTA)
            crops = [face_img]
            crops.append(cv2.flip(face_img, 1)) # Flipped
            
            # 90% center crop
            ch, cw = face_img.shape[:2]
            cy1, cy2 = int(ch * 0.05), int(ch * 0.95)
            cx1, cx2 = int(cw * 0.05), int(cw * 0.95)
            if (cy2 - cy1) > 0 and (cx2 - cx1) > 0:
                crops.append(face_img[cy1:cy2, cx1:cx2])
                
            age_sum = np.zeros((1, 8))
            gender_sum = np.zeros((1, 2))
            
            for c in crops:
                blob = cv2.dnn.blobFromImage(c, 1.0, (227, 227), MODEL_MEAN_VALUES, swapRB=False)
                
                # Predict gender
                gender_net.setInput(blob)
                gender_preds = gender_net.forward()
                gender_sum += gender_preds
                
                # Predict age
                age_net.setInput(blob)
                age_preds = age_net.forward()
                age_sum += age_preds
                
            age_idx = age_sum.argmax()
            gender_idx = gender_sum.argmax()
            
            age_range = AGE_LIST[age_idx]
            gender = GENDER_LIST[gender_idx]
            
            # Normalize confidence score
            gender_confidence = int(round((gender_sum[0][gender_idx] / len(crops)) * 100))
            gender_confidence = max(0, min(100, gender_confidence))
            
            if age_range.startswith("(") and age_range.endswith(")"):
                age_range = age_range[1:-1]
                
            results.append({
                "face_id": i + 1,
                "age_range": age_range,
                "gender": gender,
                "gender_confidence": gender_confidence
            })
        except Exception as e:
            print(f"⚠️  Local age/gender prediction failed for face {i+1}: {e}")
            results.append({
                "face_id": i + 1,
                "age_range": "20-35",
                "gender": "Unknown",
                "gender_confidence": 50
            })
    return results

# ── DB setup ──────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS face_registry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            encoding TEXT NOT NULL,
            registered_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS detection_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            face_count INTEGER,
            emotions TEXT,
            crowd_density TEXT,
            detected_at TEXT DEFAULT (datetime('now'))
        );
        """)

init_db()

# ── Image helpers ─────────────────────────────────────────────────────────────
def decode_image(data):
    import cv2
    if not data:
        return None
    if isinstance(data, str) and data.startswith("data:"):
        parts = data.split(",")
        if len(parts) < 2:
            return None
        data = parts[1]
    if not data:
        return None
    try:
        img_bytes = base64.b64decode(data)
    except Exception:
        return None
    if not img_bytes:
        return None
    arr = np.frombuffer(img_bytes, np.uint8)
    if arr.size == 0:
        return None
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)

def encode_image(img):
    import cv2
    _, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return base64.b64encode(buf).decode("utf-8")

def pil_to_cv2(pil_img):
    import cv2
    arr = np.array(pil_img)
    return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)

# ── Face detection ────────────────────────────────────────────────────────────
def detect_faces_haar(gray, img):
    haar = get_haar()
    if haar is None:
        return []
    faces = haar.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30,30))
    result = []
    for (x,y,w,h) in faces:
        result.append({"x":int(x),"y":int(y),"w":int(w),"h":int(h),"method":"Haar Cascade"})
    return result

def detect_faces_dnn(img):
    import cv2
    net = get_face_detector_dnn()
    if net is None:
        return []
    h, w = img.shape[:2]
    blob = cv2.dnn.blobFromImage(cv2.resize(img,(300,300)), 1.0, (300,300), (104,177,123))
    net.setInput(blob)
    detections = net.forward()
    result = []
    for i in range(detections.shape[2]):
        conf = float(detections[0,0,i,2])
        if conf > 0.5:
            box = detections[0,0,i,3:7] * np.array([w,h,w,h])
            x1,y1,x2,y2 = box.astype(int)
            result.append({
                "x":int(x1),"y":int(y1),
                "w":int(x2-x1),"h":int(y2-y1),
                "confidence":round(conf*100,1),
                "method":"Deep Learning (SSD ResNet)"
            })
    return result

def estimate_emotion_groq(face_count, face_descriptions):
    """Use Groq to generate emotion narrative based on face analysis."""
    try:
        prompt = f"""You are analyzing {face_count} face(s) detected in an image.
Face details: {face_descriptions}

For each face, estimate:
1. Dominant emotion (happy/sad/angry/surprised/neutral/fearful/disgusted)
2. Confidence percentage

Return ONLY valid JSON array:
[{{"face_id": 1, "emotion": "happy", "emotion_confidence": 88, "emotion_emoji": "😊", "description": "one sentence about this face"}}]"""

        res = req_lib.post(GROQ_URL, json={
            "model": GROQ_MODEL,
            "messages": [{"role":"user","content":prompt}],
            "max_tokens": 400,
            "temperature": 0.3,
        }, headers={"Authorization":f"Bearer {GROQ_API_KEY}","Content-Type":"application/json"}, timeout=20)
        text = res.json()["choices"][0]["message"]["content"].strip()
        start = text.find("["); end = text.rfind("]")+1
        return json.loads(text[start:end])
    except:
        return [{"face_id":i+1,"emotion":"neutral","emotion_confidence":70,"emotion_emoji":"😐","description":"Face detected"} for i in range(face_count)]

def estimate_age_gender_groq(face_count):
    """Use Groq to estimate age and gender."""
    try:
        prompt = f"""Estimate age range and gender for {face_count} face(s) detected in an image.
Return ONLY valid JSON array:
[{{"face_id": 1, "age_range": "25-32", "gender": "Male", "gender_confidence": 85}}]"""
        res = req_lib.post(GROQ_URL, json={
            "model": GROQ_MODEL,
            "messages": [{"role":"user","content":prompt}],
            "max_tokens": 200,
            "temperature": 0.2,
        }, headers={"Authorization":f"Bearer {GROQ_API_KEY}","Content-Type":"application/json"}, timeout=15)
        text = res.json()["choices"][0]["message"]["content"].strip()
        start = text.find("["); end = text.rfind("]")+1
        return json.loads(text[start:end])
    except:
        return [{"face_id":i+1,"age_range":"20-35","gender":"Unknown","gender_confidence":60} for i in range(face_count)]

def crowd_analysis(face_count, img_area):
    """Analyze crowd density."""
    if face_count == 0:
        density = "empty"
        emoji = "🏜️"
        note = "No faces detected in the scene."
    elif face_count == 1:
        density = "individual"
        emoji = "👤"
        note = "Single person detected."
    elif face_count <= 3:
        density = "small group"
        emoji = "👥"
        note = "Small group of people."
    elif face_count <= 8:
        density = "medium crowd"
        emoji = "👨‍👩‍👧‍👦"
        note = "Medium-sized gathering detected."
    elif face_count <= 20:
        density = "large crowd"
        emoji = "🏟️"
        note = "Large crowd detected."
    else:
        density = "dense crowd"
        emoji = "🎪"
        note = "Dense crowd — high population density."

    return {
        "face_count": face_count,
        "density": density,
        "density_emoji": emoji,
        "note": note,
        "faces_per_100px": round(face_count / (img_area / 10000), 2) if img_area > 0 else 0
    }

def draw_annotations(img, faces, emotions, age_gender):
    """Draw bounding boxes and labels on image."""
    import cv2
    annotated = img.copy()
    colors = [(0,255,128),(255,128,0),(128,0,255),(0,128,255),(255,0,128)]

    for i, face in enumerate(faces):
        x,y,w,h = face["x"],face["y"],face["w"],face["h"]
        color = colors[i % len(colors)]

        # Draw box
        cv2.rectangle(annotated, (x,y), (x+w,y+h), color, 2)

        # Emotion label
        emotion_info = emotions[i] if i < len(emotions) else {}
        emotion = emotion_info.get("emotion","?")
        emoji_map = {"happy":"😊","sad":"😢","angry":"😠","surprised":"😲","neutral":"😐","fearful":"😨","disgusted":"🤢"}

        # Age/gender label
        ag_info = age_gender[i] if i < len(age_gender) else {}
        age = ag_info.get("age_range","?")
        gender = ag_info.get("gender","?")

        label1 = f"{emotion} | {gender}"
        label2 = f"Age: {age}"

        # Background for text
        cv2.rectangle(annotated, (x, y-45), (x+w, y), (0,0,0), -1)
        cv2.putText(annotated, label1, (x+4, y-28), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        cv2.putText(annotated, label2, (x+4, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200,200,200), 1)

        # Face number
        cv2.circle(annotated, (x+w-16, y+16), 14, color, -1)
        cv2.putText(annotated, str(i+1), (x+w-20, y+21), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,0,0), 2)

    return annotated

# ── Main analyze endpoint ─────────────────────────────────────────────────────
@app.route("/api/analyze", methods=["POST"])
def analyze():
    try:
        import cv2
        data = request.json
        image_data = data.get("image", "")
        detector = data.get("detector", "dnn")  # haar | dnn | both

        if not image_data:
            return jsonify({"error": "No image provided"}), 400

        try:
            img = decode_image(image_data)
            if img is None:
                return jsonify({"error": "Invalid image"}), 400
        except Exception as e:
            return jsonify({"error": f"Image decode failed: {e}"}), 400

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        h, w = img.shape[:2]
        img_area = h * w

        # ── Step 1: Haar Cascade Detection ────────────────────────────────────────
        haar_faces = detect_faces_haar(gray, img)

        # ── Step 2: DNN Detection ─────────────────────────────────────────────────
        dnn_faces = detect_faces_dnn(img)

        # Choose best faces
        if detector == "haar":
            faces = haar_faces
        elif detector == "dnn":
            faces = dnn_faces if dnn_faces else haar_faces
        else:  # both — use DNN, fallback to Haar
            faces = dnn_faces if dnn_faces else haar_faces

        face_count = len(faces)

        # ── Step 3: Groq Emotion Analysis ────────────────────────────────────────
        face_descriptions = [f"Face {i+1} at position ({f['x']},{f['y']}) size {f['w']}x{f['h']}" for i, f in enumerate(faces)]
        emotions = estimate_emotion_groq(face_count, face_descriptions) if face_count > 0 else []
        
        # Try local age/gender prediction, fallback to Groq
        age_gender = None
        if face_count > 0:
            age_gender = predict_age_gender_local(img, faces)
            if not age_gender:
                age_gender = estimate_age_gender_groq(face_count)
        else:
            age_gender = []

        # ── Step 4: Crowd Analysis ────────────────────────────────────────────────
        crowd = crowd_analysis(face_count, img_area)

        # ── Step 5: Draw annotations ──────────────────────────────────────────────
        annotated_img = draw_annotations(img, faces, emotions, age_gender)
        annotated_b64 = encode_image(annotated_img)

        # ── Step 6: Log detection ─────────────────────────────────────────────────
        try:
            with get_db() as db:
                db.execute(
                    "INSERT INTO detection_log (face_count, emotions, crowd_density) VALUES (?,?,?)",
                    (face_count, json.dumps([e.get("emotion", "?") for e in emotions]), crowd["density"])
                )
        except Exception:
            # Logging should not break response flow
            pass

        return jsonify({
            "success": True,
            "face_count": face_count,
            "faces": faces,
            "emotions": emotions,
            "age_gender": age_gender,
            "crowd": crowd,
            "annotated_image": annotated_b64,
            "haar_count": len(haar_faces),
            "dnn_count": len(dnn_faces),
            "detector_used": detector,
            "image_size": {"width": w, "height": h},
        })
    except Exception as e:
        print(f"Analyze endpoint error: {e}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

# ── Face registry ─────────────────────────────────────────────────────────────
@app.route("/api/register-face", methods=["POST"])
def register_face():
    data = request.json
    name = data.get("name","").strip()
    if not name:
        return jsonify({"error":"Name is required"}), 400

    # Store a simple face encoding placeholder (face histogram as encoding)
    image_data = data.get("image","")
    encoding = base64.b64encode(image_data[:200].encode()).decode() if image_data else ""

    with get_db() as db:
        db.execute("INSERT INTO face_registry (name, encoding) VALUES (?,?)", (name, encoding))

    return jsonify({"message":f"'{name}' registered successfully!", "name":name})

@app.route("/api/registry", methods=["GET"])
def get_registry():
    with get_db() as db:
        people = db.execute("SELECT id, name, registered_at FROM face_registry ORDER BY registered_at DESC").fetchall()
    return jsonify({"people": [dict(p) for p in people]})

@app.route("/api/registry/<int:pid>", methods=["DELETE"])
def delete_registry(pid):
    with get_db() as db:
        db.execute("DELETE FROM face_registry WHERE id=?", (pid,))
    return jsonify({"message":"Removed from registry"})

# ── Detection stats ────────────────────────────────────────────────────────────
@app.route("/api/stats", methods=["GET"])
def stats():
    with get_db() as db:
        total = db.execute("SELECT COUNT(*) as c FROM detection_log").fetchone()["c"]
        total_faces = db.execute("SELECT SUM(face_count) as s FROM detection_log").fetchone()["s"] or 0
        recent = db.execute("SELECT * FROM detection_log ORDER BY detected_at DESC LIMIT 5").fetchall()
    return jsonify({
        "total_analyses": total,
        "total_faces_detected": total_faces,
        "recent": [dict(r) for r in recent]
    })

@app.route("/health")
def health():
    return jsonify({
        "status":"ok",
        "model":GROQ_MODEL,
        "version":"FaceVerse v1.0",
        "detectors":["Haar Cascade","DNN SSD ResNet"],
        "features":["emotion","age","gender","crowd_analysis","face_registry"]
    })

if __name__ == "__main__":
    print(f"\n🎭 FaceVerse Backend → http://localhost:{PORT}")
    print(f"   Model     : {GROQ_MODEL}")
    print(f"   Detectors : Haar Cascade + DNN SSD ResNet")
    print(f"   Features  : Emotion + Age + Gender + Crowd Analysis + Registry\n")
    print("Loading models...")
    get_haar()
    get_face_detector_dnn()
    get_age_net()
    get_gender_net()
    app.run(debug=True, port=PORT, threaded=True)
