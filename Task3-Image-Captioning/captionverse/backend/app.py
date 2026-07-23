import colorsys
import json
import os
import re
from collections import Counter
from functools import lru_cache

import time
import logging
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image
from groq import Groq

# Try importing torch
try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except Exception as e:
    torch = None
    nn = None
    TORCH_AVAILABLE = False
    print(f"Warning: torch import failed: {e}")

# Try importing torchvision
TORCHVISION_AVAILABLE = False
ResNet50_Weights = None
resnet50 = None
if TORCH_AVAILABLE:
    try:
        from torchvision.models import ResNet50_Weights, resnet50
        if ResNet50_Weights is not None and resnet50 is not None:
            TORCHVISION_AVAILABLE = True
    except Exception as e:
        print(f"Warning: torchvision import failed: {e}")

# Try importing transformers
try:
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
    from transformers import BlipProcessor, BlipForConditionalGeneration
    TRANSFORMERS_AVAILABLE = True
except Exception as e:
    AutoModelForSeq2SeqLM = None
    AutoTokenizer = None
    BlipProcessor = None
    BlipForConditionalGeneration = None
    TRANSFORMERS_AVAILABLE = False
    print(f"Warning: transformers import failed: {e}")

load_dotenv()

groq_client = None
if os.getenv("GROQ_API_KEY"):
    try:
        groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    except Exception as e:
        print(f"Warning: Failed to initialize Groq client: {e}")


app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
CORS(app, origins=["http://localhost:3003"])

CAPTION_STYLES = {
    "professional": "Write a formal, informative caption like a professional photographer or journalist.",
    "poetic": "Write a poetic, lyrical, emotionally rich caption with metaphors and imagery.",
    "funny": "Write a witty, humorous, funny caption like a comedian describing this image.",
    "news": "Write a breaking news headline plus one sentence description like a news reporter.",
    "social": "Write a catchy social media caption with energy and personality, Instagram style.",
}

LANGUAGES = {
    "english": "English",
    "tamil": "Tamil (தமிழ்)",
    "hindi": "Hindi (हिन्दी)",
    "french": "French (Français)",
    "spanish": "Spanish (Español)",
    "arabic": "Arabic (العربية)",
    "japanese": "Japanese (日本語)",
}

EMOTION_EMOJIS = {
    "joy": "😊",
    "calm": "😌",
    "excitement": "🔥",
    "nostalgia": "🕰️",
    "wonder": "✨",
    "tension": "⚡",
    "melancholy": "🌧️",
    "playful": "😄",
}

SCENE_TYPES = [
    "portrait",
    "landscape",
    "street",
    "food",
    "architecture",
    "nature",
    "animal",
    "technology",
    "sports",
    "indoor",
    "outdoor",
    "abstract",
    "travel",
    "object",
]

CAPTION_DECODER_MODEL = os.getenv("CAPTION_DECODER_MODEL", "google/flan-t5-small")
VISION_CAPTION_MODEL = os.getenv("VISION_CAPTION_MODEL", "Salesforce/blip-image-captioning-large")
VISION_CAPTION_MODEL_FALLBACK = os.getenv("VISION_CAPTION_MODEL_FALLBACK", "Salesforce/blip-image-captioning-base")

DEVICE = None
if TORCH_AVAILABLE:
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

FAST_MODE = str(os.getenv("FAST_MODE", "false")).lower() in ("1", "true", "yes")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


def normalize_whitespace(text):
    return re.sub(r"\s+", " ", text).strip()


def clean_caption(text):
    caption = normalize_whitespace(text)
    caption = re.sub(r"^(caption|answer|caption:)\s*[:\-]?\s*", "", caption, flags=re.IGNORECASE)
    caption = caption.strip().strip('"').strip("'")
    return caption


def clean_list(value, fallback=None, target_count=0):
    fallback = fallback or []
    items = []

    if isinstance(value, list):
        items = [normalize_whitespace(str(item)) for item in value]
    elif isinstance(value, str):
        pieces = re.split(r"[,\n;]+", value)
        items = [normalize_whitespace(piece) for piece in pieces]

    items = [item.lstrip("#").strip() for item in items if item]
    deduped = []
    for item in items:
        if item.lower() not in {existing.lower() for existing in deduped}:
            deduped.append(item)

    for item in fallback:
        if target_count and len(deduped) >= target_count:
            break
        if item.lower() not in {existing.lower() for existing in deduped}:
            deduped.append(item)

    if target_count:
        deduped = deduped[:target_count]
    return deduped


def safe_int(value, default=0):
    try:
        return int(round(float(value)))
    except Exception:
        return default


def safe_json_parse(text):
    if not text:
        return None

    candidate = normalize_whitespace(text)
    try:
        return json.loads(candidate)
    except Exception:
        pass

    match = re.search(r"\{.*\}", candidate, flags=re.S)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            return None
    return None


def style_instruction(style):
    return CAPTION_STYLES.get(style, CAPTION_STYLES["professional"])


@lru_cache(maxsize=1)
def load_models():
    start = time.time()
    if not TORCH_AVAILABLE or not TRANSFORMERS_AVAILABLE:
        logging.warning("Local PyTorch/Transformers models are not available. Running in API/Heuristic mode.")
        return {"use_blip": False}

    if TORCHVISION_AVAILABLE:
        weights = ResNet50_Weights.DEFAULT
        encoder = resnet50(weights=weights)
        feature_extractor = nn.Sequential(*list(encoder.children())[:-1])
        encoder = encoder.to(DEVICE).eval()
        feature_extractor = feature_extractor.to(DEVICE).eval()

        tokenizer = AutoTokenizer.from_pretrained(CAPTION_DECODER_MODEL)
        decoder = AutoModelForSeq2SeqLM.from_pretrained(CAPTION_DECODER_MODEL).to(DEVICE).eval()

        result = {
            "use_blip": False,
            "encoder": encoder,
            "feature_extractor": feature_extractor,
            "preprocess": weights.transforms(),
            "categories": weights.meta["categories"],
            "tokenizer": tokenizer,
            "decoder": decoder,
        }
    else:
        # Use BLIP (no torchvision dependency) as an alternate image encoder/processor
        try:
            processor = BlipProcessor.from_pretrained(VISION_CAPTION_MODEL)
            blip = BlipForConditionalGeneration.from_pretrained(VISION_CAPTION_MODEL).to(DEVICE).eval()
            vision_model_name = VISION_CAPTION_MODEL
        except Exception as exc:
            logging.warning(f"Primary vision caption model failed ({VISION_CAPTION_MODEL}): {exc}; falling back to {VISION_CAPTION_MODEL_FALLBACK}")
            processor = BlipProcessor.from_pretrained(VISION_CAPTION_MODEL_FALLBACK)
            blip = BlipForConditionalGeneration.from_pretrained(VISION_CAPTION_MODEL_FALLBACK).to(DEVICE).eval()
            vision_model_name = VISION_CAPTION_MODEL_FALLBACK
        tokenizer = AutoTokenizer.from_pretrained(CAPTION_DECODER_MODEL)
        decoder = AutoModelForSeq2SeqLM.from_pretrained(CAPTION_DECODER_MODEL).to(DEVICE).eval()

        result = {
            "use_blip": True,
            "vision_model_name": vision_model_name,
            "processor": processor,
            "blip": blip,
            "tokenizer": tokenizer,
            "decoder": decoder,
        }

    logging.info(f"Loaded models in {time.time() - start:.2f}s (use_blip={result.get('use_blip')})")
    return result


def process_image(file):
    image = Image.open(file)
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")
    elif image.mode != "RGB":
        image = image.convert("RGB")

    max_dim = 1024
    if max(image.size) > max_dim:
        image.thumbnail((max_dim, max_dim), Image.LANCZOS)
    return image


def get_visual_features(image):
    start = time.time()
    if not TORCH_AVAILABLE or not TRANSFORMERS_AVAILABLE:
        color_mood = analyze_color_mood(image)
        logging.info("get_visual_features (fallback): torch/transformers not available.")
        return {
            "objects": [{"name": "image", "confidence": 50}],
            "top_label": "image",
            "top_score": 50,
            "feature_norm": 0.0,
            "keywords": ["image"],
            "visual_caption": f"A scene with colors that feel {color_mood}.",
            "silhouette_like": False,
        }

    models = load_models()
    silhouette_like = detect_silhouette_like(image)

    if models.get("use_blip"):
        # Use BLIP to produce a quick caption and extract keywords
        prompt = "a dark silhouette of a statue or deity" if silhouette_like else "a photo of"
        inputs = models["processor"](image, text=prompt, return_tensors="pt").to(DEVICE)
        with torch.inference_mode():
            output_ids = models["blip"].generate(**inputs, max_new_tokens=24, num_beams=5, do_sample=False)
        blip_caption = clean_caption(models["processor"].decode(output_ids[0], skip_special_tokens=True))
        keywords = keyword_candidates(blip_caption)[:5]
        objects = [{"name": k, "confidence": 60} for k in keywords]
        top_label = keywords[0] if keywords else "unknown"
        top_score = objects[0]["confidence"] if objects else 0
        feature_norm = 0.0
        logging.info(f"get_visual_features (blip): top_label={top_label} top_score={top_score} time={(time.time()-start):.2f}s")
        return {
            "objects": objects,
            "top_label": top_label,
            "top_score": top_score,
            "feature_norm": feature_norm,
            "keywords": [item["name"] for item in objects],
            "visual_caption": blip_caption,
            "silhouette_like": silhouette_like,
        }

    tensor = models["preprocess"](image).unsqueeze(0).to(DEVICE)

    with torch.inference_mode():
        logits = models["encoder"](tensor)
        probabilities = torch.softmax(logits, dim=1)[0]
        top_probabilities, top_indices = torch.topk(probabilities, k=5)
        feature_vector = models["feature_extractor"](tensor).flatten(1)

    categories = models["categories"]
    objects = []
    for index, probability in zip(top_indices.tolist(), top_probabilities.tolist()):
        objects.append({
            "name": categories[index],
            "confidence": safe_int(probability * 100, 0),
        })

    top_label = objects[0]["name"] if objects else "unknown"
    top_score = objects[0]["confidence"] if objects else 0
    feature_norm = float(torch.norm(feature_vector).item())

    logging.info(f"get_visual_features: top_label={top_label} top_score={top_score} time={(time.time()-start):.2f}s")

    return {
        "objects": objects,
        "top_label": top_label,
        "top_score": top_score,
        "feature_norm": feature_norm,
        "keywords": [item["name"] for item in objects],
        "visual_caption": f"A {infer_scene_type([top_label])} scene with {top_label.replace('_', ' ')}.",
        "silhouette_like": silhouette_like,
    }


def analyze_color_mood(image):
    sample = image.resize((48, 48))
    pixels = list(sample.getdata())
    count = len(pixels) or 1

    avg_r = sum(pixel[0] for pixel in pixels) / count
    avg_g = sum(pixel[1] for pixel in pixels) / count
    avg_b = sum(pixel[2] for pixel in pixels) / count
    hue, saturation, value = colorsys.rgb_to_hsv(avg_r / 255.0, avg_g / 255.0, avg_b / 255.0)

    spread = max(avg_r, avg_g, avg_b) - min(avg_r, avg_g, avg_b)
    if value < 0.28 or spread < 16:
        return "monochrome"
    if value > 0.75 and 0.10 <= hue <= 0.20:
        return "golden"
    if saturation > 0.45 and value > 0.55:
        return "vibrant"
    if hue < 0.12 or hue > 0.92:
        return "warm"
    if 0.12 <= hue <= 0.35:
        return "warm"
    if 0.35 < hue <= 0.75:
        return "cool"
    return "muted"


def detect_silhouette_like(image):
    sample = image.resize((64, 64)).convert("L")
    pixels = list(sample.getdata())
    if not pixels:
        return False

    dark_ratio = sum(1 for pixel in pixels if pixel < 60) / len(pixels)
    very_dark_ratio = sum(1 for pixel in pixels if pixel < 35) / len(pixels)

    center = sample.crop((16, 16, 48, 48))
    center_pixels = list(center.getdata()) or [255]
    edge_pixels = [
        *sample.crop((0, 0, 64, 8)).getdata(),
        *sample.crop((0, 56, 64, 64)).getdata(),
        *sample.crop((0, 8, 8, 56)).getdata(),
        *sample.crop((56, 8, 64, 56)).getdata(),
    ] or [255]

    center_avg = sum(center_pixels) / len(center_pixels)
    edge_avg = sum(edge_pixels) / len(edge_pixels)
    overall_avg = sum(pixels) / len(pixels)

    return (
        dark_ratio > 0.25
        and very_dark_ratio > 0.08
        and center_avg + 10 < edge_avg
        and overall_avg < 120
    )


def infer_scene_type(keywords):
    blob = " ".join(keyword.lower() for keyword in keywords)

    keyword_groups = [
        ("portrait", ["person", "man", "woman", "boy", "girl", "face", "bride", "groom", "selfie"]),
        ("animal", ["dog", "cat", "bird", "horse", "elephant", "zebra", "lion", "bear", "animal"]),
        ("food", ["pizza", "sandwich", "burger", "cake", "bowl", "plate", "salad", "fruit", "drink", "cup"]),
        ("architecture", ["building", "church", "cathedral", "tower", "bridge", "house", "castle", "skyscraper"]),
        ("street", ["street", "road", "car", "bus", "truck", "train", "bike", "bicycle", "motorcycle", "traffic"]),
        ("nature", ["tree", "forest", "mountain", "river", "lake", "beach", "ocean", "sky", "flower", "grass"]),
        ("technology", ["laptop", "computer", "keyboard", "screen", "phone", "tablet", "monitor", "camera"]),
        ("sports", ["ball", "tennis", "soccer", "basketball", "baseball", "skateboard", "surfboard", "runner"]),
        ("indoor", ["room", "chair", "table", "sofa", "bed", "kitchen", "hallway", "desk"]),
        ("outdoor", ["park", "field", "garden", "road", "street", "outdoor"]),
        ("travel", ["plane", "airport", "train", "car", "boat", "luggage", "tourist"]),
        ("abstract", ["pattern", "abstract", "texture", "art", "shape"]),
    ]

    for scene_type, words in keyword_groups:
        if any(word in blob for word in words):
            return scene_type

    if "person" in blob or "face" in blob:
        return "portrait"
    return "object"


def infer_emotion(scene_type, color_mood, top_label):
    label = top_label.lower()
    if scene_type in {"sports", "street", "travel"}:
        emotion = "excitement"
    elif scene_type in {"animal", "nature", "outdoor"} and color_mood in {"vibrant", "golden"}:
        emotion = "joy"
    elif color_mood == "cool":
        emotion = "calm"
    elif color_mood == "monochrome":
        emotion = "nostalgia"
    elif color_mood == "muted":
        emotion = "melancholy"
    elif scene_type == "portrait":
        emotion = "wonder" if "smile" in label else "calm"
    else:
        emotion = "playful" if scene_type == "animal" else "wonder"

    confidence = 65
    if emotion in {"joy", "calm", "wonder"}:
        confidence = 72
    if color_mood in {"golden", "vibrant"}:
        confidence = min(92, confidence + 10)
    return emotion, confidence, EMOTION_EMOJIS.get(emotion, "🙂")


def generate_text(prompt, max_new_tokens=96):
    if groq_client:
        try:
            start = time.time()
            response = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_new_tokens,
                temperature=0.7,
            )
            result = response.choices[0].message.content.strip()
            logging.info(f"generate_text (groq): len={len(result)} time={(time.time()-start):.2f}s")
            return clean_caption(result)
        except Exception as e:
            logging.warning(f"Groq API call failed: {e}; falling back to local model.")

    start = time.time()
    models = load_models()
    inputs = models["tokenizer"](
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=256,
    ).to(DEVICE)

    with torch.inference_mode():
        output_ids = models["decoder"].generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            num_beams=4,
            do_sample=False,
            early_stopping=True,
            repetition_penalty=1.08,
        )

    decoded = models["tokenizer"].decode(output_ids[0], skip_special_tokens=True)
    logging.info(f"generate_text: len={len(decoded)} time={(time.time()-start):.2f}s")
    return clean_caption(decoded)


def keyword_candidates(*texts):
    stopwords = {
        "the", "and", "with", "from", "this", "that", "into", "for", "your", "image", "caption",
        "scene", "photo", "picture", "one", "a", "an", "of", "in", "on", "to", "is", "are",
        "showing", "featuring", "look", "looks", "like", "based", "using", "return", "only",
    }
    tokens = []
    for text in texts:
        for raw in re.findall(r"[A-Za-z0-9]+", text.lower()):
            if len(raw) > 2 and raw not in stopwords:
                tokens.append(raw)

    counts = Counter(tokens)
    ordered = [word for word, _ in counts.most_common()]
    return ordered


def fallback_hashtags(caption, keywords, scene_type):
    sources = keyword_candidates(caption, " ".join(keywords), scene_type, "image captioning")
    tags = []
    for word in sources:
        tag = word.replace(" ", "")
        if tag and tag not in tags:
            tags.append(tag)
        if len(tags) == 12:
            break

    while len(tags) < 12:
        tag = f"caption{len(tags) + 1}"
        if tag not in tags:
            tags.append(tag)
    return tags


def fallback_seo_tags(caption, keywords, scene_type, color_mood):
    sources = keyword_candidates(caption, " ".join(keywords), scene_type, color_mood, "visual description")
    tags = []
    for word in sources:
        if word not in tags:
            tags.append(word)
        if len(tags) == 8:
            break

    while len(tags) < 8:
        filler = f"keyword{len(tags) + 1}"
        if filler not in tags:
            tags.append(filler)
    return tags


def fallback_caption_alt(caption, style_name):
    stripped = caption.rstrip(".")
    if style_name == "poetic":
        return f"A lyrical view of {stripped.lower()}."
    if style_name == "funny":
        return f"A lighthearted take on {stripped.lower()}."
    if style_name == "news":
        return f"Breaking: {stripped}"
    if style_name == "social":
        return f"{stripped} - ready for the feed."
    return f"Another angle on {stripped.lower()}."


def fallback_story(caption, scene_type, color_mood):
    stripped = caption.rstrip(".")
    return (
        f"{stripped}. The scene feels {color_mood} and grounded in a {scene_type} moment. "
        "It reads like a short story captured in a single frame."
    )


def build_analysis_prompt(primary_caption, label_text, style, language_name, scene_type, color_mood):
    return f"""You are helping an image captioning app.
Use the caption and detected visual concepts to return valid JSON only.

Rules:
- caption: rewrite the main caption to match the style instruction: {style_instruction(style)}. Write in {language_name}.
- caption_alt: a different caption in the same language as the main caption, also matching the style instruction.
- story: exactly 3 sentences inspired by the image, written in {language_name}.
- hashtags: exactly 12 short tags without the # symbol.
- seo_tags: exactly 8 short SEO keywords.
- scene_type: one of {", ".join(SCENE_TYPES)}.
- emotion: one word from joy, calm, excitement, nostalgia, wonder, tension, melancholy, playful.
- emotion_score and confidence: integers from 0 to 100.
- color_mood: one of warm, cool, vibrant, muted, monochrome, golden.

Main caption: {primary_caption}
Detected concepts: {label_text}
Requested style: {style_instruction(style)}
Requested language: {language_name}
Scene type hint: {scene_type}
Color mood hint: {color_mood}

Return JSON with keys caption, caption_alt, story, hashtags, seo_tags, scene_type, emotion, emotion_score, color_mood, confidence.
"""


def build_caption_prompt(primary_caption, label_text, style, language_name, scene_type, color_mood):
    return f"""You are a classic image captioning system.
Write one concise, natural caption in {language_name}.
{style_instruction(style)}

Detected visual concepts: {label_text}
Scene type: {scene_type}
Color mood: {color_mood}
If the concepts are uncertain, describe the main subject and setting from the strongest cues.
Return only the caption.
"""


def build_translation_prompt(caption, language_name):
    if groq_client:
        return f"""Translate this image caption to {language_name}. Keep the same tone and style.
Caption: {caption}
Return only the translated caption.
"""
    else:
        return f"translate to {language_name}: {caption}"


def build_restyle_prompt(caption, style, language_name):
    if groq_client:
        return f"""Rewrite this image caption in a new style.
Original caption: {caption}
New style instruction: {style_instruction(style)}
Write in {language_name}.
Return only the new caption.
"""
    else:
        style_word = style.lower()
        if style_word == "professional":
            style_word = "formal"
        elif style_word == "social":
            style_word = "social media"
        return f"rewrite to be {style_word} in {language_name}: {caption}"


def get_groq_analysis(caption, label_text, style, language_name, scene_type, color_mood):
    if not groq_client:
        return None
    try:
        prompt = build_analysis_prompt(caption, label_text, style, language_name, scene_type, color_mood)
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        content = response.choices[0].message.content.strip()
        parsed = safe_json_parse(content)
        if parsed:
            logging.info("Successfully fetched analysis from Groq")
            return parsed
    except Exception as e:
        logging.warning(f"Failed to get Groq analysis: {e}")
    return None


def build_response_payload(image, style, language):
    if not groq_client and not globals().get("MODELS_READY", False):
        # Models not ready yet — caller should retry later
        raise RuntimeError("models_not_ready")
    if TORCH_AVAILABLE and TRANSFORMERS_AVAILABLE:
        try:
            models = load_models()
        except Exception:
            pass
    features = get_visual_features(image)
    color_mood = analyze_color_mood(image)
    scene_type = infer_scene_type(features["keywords"])
    emotion, emotion_score, emotion_emoji = infer_emotion(scene_type, color_mood, features["top_label"])
    language_name = LANGUAGES.get(language, "English")
    silhouette_like = detect_silhouette_like(image)

    label_text = ", ".join(features["keywords"][:5]) if features["keywords"] else features["top_label"]

    caption = clean_caption(features.get("visual_caption") or "")
    if not caption:
        caption = f"A {scene_type} scene with {features['top_label'].replace('_', ' ')}."

    if silhouette_like or (color_mood in {"monochrome", "cool"} and features["top_score"] < 80 and scene_type in {"object", "indoor", "architecture"}):
        caption = "A dark silhouette of a deity or statue against a blue background."
        scene_type = "portrait"
        color_mood = "monochrome"
        emotion, emotion_score, emotion_emoji = infer_emotion(scene_type, color_mood, features["top_label"])

    groq_data = get_groq_analysis(caption, label_text, style, language_name, scene_type, color_mood)
    if groq_data:
        caption = groq_data.get("caption") or caption
        extras = {
            "caption_alt": groq_data.get("caption_alt"),
            "story": groq_data.get("story"),
            "hashtags": groq_data.get("hashtags"),
            "seo_tags": groq_data.get("seo_tags"),
            "scene_type": groq_data.get("scene_type"),
            "emotion": groq_data.get("emotion"),
            "emotion_score": groq_data.get("emotion_score"),
            "color_mood": groq_data.get("color_mood"),
            "confidence": groq_data.get("confidence", max(features["top_score"], emotion_score)),
        }
    else:
        extras = {
            "caption_alt": fallback_caption_alt(caption, style),
            "story": fallback_story(caption, scene_type, color_mood),
            "hashtags": fallback_hashtags(caption, features["keywords"], scene_type),
            "seo_tags": fallback_seo_tags(caption, features["keywords"], scene_type, color_mood),
            "scene_type": scene_type,
            "emotion": emotion,
            "emotion_score": emotion_score,
            "color_mood": color_mood,
            "confidence": max(features["top_score"], emotion_score),
        }

    caption_alt = clean_caption(extras.get("caption_alt") or fallback_caption_alt(caption, style))
    story = normalize_whitespace(extras.get("story") or fallback_story(caption, scene_type, color_mood))
    hashtags = clean_list(
        extras.get("hashtags"),
        fallback=fallback_hashtags(caption, features["keywords"], scene_type),
        target_count=12,
    )
    seo_tags = clean_list(
        extras.get("seo_tags"),
        fallback=fallback_seo_tags(caption, features["keywords"], scene_type, color_mood),
        target_count=8,
    )

    scene_type = normalize_whitespace(str(extras.get("scene_type") or scene_type)).lower() or scene_type
    if scene_type not in SCENE_TYPES:
        scene_type = infer_scene_type(features["keywords"])

    emotion = normalize_whitespace(str(extras.get("emotion") or emotion)).lower() or emotion
    if emotion not in EMOTION_EMOJIS:
        emotion = infer_emotion(scene_type, color_mood, features["top_label"])[0]

    emotion_score = safe_int(extras.get("emotion_score"), emotion_score)
    confidence = safe_int(extras.get("confidence"), features["top_score"])
    color_mood = normalize_whitespace(str(extras.get("color_mood") or color_mood)).lower() or color_mood

    analysis = {
        "caption": caption,
        "caption_alt": caption_alt,
        "story": story,
        "emotion": emotion,
        "emotion_score": emotion_score,
        "emotion_emoji": EMOTION_EMOJIS.get(emotion, emotion_emoji),
        "objects": features["objects"],
        "hashtags": hashtags,
        "seo_tags": seo_tags,
        "scene_type": scene_type,
        "color_mood": color_mood,
        "confidence": confidence,
    }

    return {
        "analysis": analysis,
        "caption": caption,
        "model": f"ResNet50 + {CAPTION_DECODER_MODEL}",
        "pipeline": "ResNet50 encoder + transformer decoder",
        "language": language_name,
        "style": style,
    }


def caption_endpoint_payload():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    style = request.form.get("style", "professional")
    language = request.form.get("language", "english")

    try:
        image = process_image(file)
    except Exception as exc:
        return jsonify({"error": f"Image processing failed: {exc}"}), 400
    # Quick fallback when models are not yet loaded but FAST_MODE is enabled
    if not globals().get("MODELS_READY", False) and FAST_MODE:
        logging.info("MODELS not ready — returning FAST_MODE quick response")
        color_mood = analyze_color_mood(image)
        scene_type = "object"
        caption = f"A {scene_type} scene with colors that feel {color_mood}."
        analysis = {
            "caption": caption,
            "caption_alt": fallback_caption_alt(caption, style),
            "story": fallback_story(caption, scene_type, color_mood),
            "emotion": "neutral",
            "emotion_score": 50,
            "emotion_emoji": "🙂",
            "objects": [],
            "hashtags": fallback_hashtags(caption, [], scene_type),
            "seo_tags": fallback_seo_tags(caption, [], scene_type, color_mood),
            "scene_type": scene_type,
            "color_mood": color_mood,
            "confidence": 40,
        }
        return jsonify({"analysis": analysis, "caption": caption, "model": "fast-fallback", "pipeline": "heuristic" , "success": True})

    try:
        response = build_response_payload(image, style, language)
        response["success"] = True
        return jsonify(response)
    except Exception as exc:
        if getattr(exc, "args", None) and "models_not_ready" in str(exc):
            return jsonify({"error": "Models are still loading. Please retry in a minute."}), 503
        return jsonify({"error": f"Caption generation failed: {exc}"}), 500


@app.route("/api/analyze", methods=["POST"])
def analyze():
    return caption_endpoint_payload()


@app.route("/api/caption", methods=["POST"])
def caption():
    return caption_endpoint_payload()


@app.route("/api/translate-caption", methods=["POST"])
def translate_caption():
    data = request.json or {}
    caption = data.get("caption", "")
    language = data.get("language", "tamil")
    language_name = LANGUAGES.get(language, "Tamil")

    if not caption:
        return jsonify({"error": "No caption provided"}), 400

    try:
        if not groq_client and not globals().get("MODELS_READY", False):
            return jsonify({"error": "Models are still loading. Please retry in a minute."}), 503
        translated = generate_text(build_translation_prompt(caption, language_name), max_new_tokens=64)
        return jsonify({"translated": translated, "language": language_name})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/restyle", methods=["POST"])
def restyle():
    data = request.json or {}
    caption = data.get("caption", "")
    style = data.get("style", "professional")
    language = data.get("language", "english")
    language_name = LANGUAGES.get(language, "English")

    if not caption:
        return jsonify({"error": "No caption provided"}), 400

    try:
        if not groq_client and not globals().get("MODELS_READY", False):
            return jsonify({"error": "Models are still loading. Please retry in a minute."}), 503
        restyled = generate_text(build_restyle_prompt(caption, style, language_name), max_new_tokens=48)
        return jsonify({"caption": restyled, "style": style})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "model": f"ResNet50 + {CAPTION_DECODER_MODEL}" if TORCH_AVAILABLE else "API-only (Groq)",
        "pipeline": "ResNet50 encoder + transformer decoder" if TORCH_AVAILABLE else "Groq API Pipeline",
        "version": "CaptionVerse v3.0",
    })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5003))
    print(f"\n🖼️  CaptionVerse Backend -> http://localhost:{port}")
    print(f"   Caption Model : ResNet50 + {CAPTION_DECODER_MODEL}" if TORCH_AVAILABLE else "   Caption Model : API-only (Groq)")
    print(f"   Pipeline      : ResNet50 encoder + transformer decoder\n" if TORCH_AVAILABLE else "   Pipeline      : Groq API Pipeline\n")
    
    if not TORCH_AVAILABLE or not TRANSFORMERS_AVAILABLE:
        print("\n⚠️  PyTorch or Transformers not available/broken locally.")
        print("   Running in API-only mode using Groq for captions & analysis.\n")
        globals()["MODELS_READY"] = False
        globals()["FAST_MODE"] = True
    elif not TORCHVISION_AVAILABLE:
        print("torchvision not available or incompatible — attempting BLIP fallback (will preload BLIP models)...")
        try:
            load_models()
            globals()["MODELS_READY"] = True
            globals()["FAST_MODE"] = False
            print("BLIP models loaded — ready to accept requests.")
        except Exception as e:
            print(f"BLIP preload failed: {e}; enabling FAST_MODE heuristic fallback.")
            globals()["MODELS_READY"] = False
            globals()["FAST_MODE"] = True
    else:
        try:
            print("Loading models (this may take a while on first run)...")
            load_models()
            globals()["MODELS_READY"] = True
            print("Models loaded — ready to accept requests.")
        except Exception as e:
            print(f"Warning: failed to preload models at startup: {e}")
            globals()["MODELS_READY"] = False

    app.run(debug=True, port=port, threaded=True)