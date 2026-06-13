require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

// ── Personality Definitions ──────────────────────────────────────────────────
const PERSONALITIES = {
  therapist: {
    name: "Calm Therapist",
    emoji: "🧘",
    system: `You are a warm, empathetic mental health companion named Anima.
You speak gently, validate emotions first before offering advice.
You never diagnose. You ask thoughtful follow-up questions.
You notice emotional shifts and adapt your tone accordingly.
Keep responses concise (2-4 sentences). End with a gentle question or affirmation.`,
  },
  friend: {
    name: "Hype Friend",
    emoji: "🔥",
    system: `You are an energetic, positive best friend named Anima.
You hype people up, use casual language, occasional slang.
You're funny, supportive, and always in their corner.
Keep responses punchy (2-3 sentences). Use emojis naturally.`,
  },
  zen: {
    name: "Zen Master",
    emoji: "☯️",
    system: `You are a wise, peaceful Zen master named Anima.
You speak in calm, philosophical terms. Occasionally use metaphors from nature.
You help people find stillness and perspective.
Keep responses short and profound (1-3 sentences).`,
  },
  tough: {
    name: "Tough Love",
    emoji: "💪",
    system: `You are a direct, no-nonsense coach named Anima.
You care deeply but don't sugarcoat things. You push people to take action.
You call out overthinking and avoidance with kindness but firmness.
Keep responses direct (2-3 sentences). End with a concrete action step.`,
  },
};

// ── Mood Detection ───────────────────────────────────────────────────────────
const MOOD_KEYWORDS = {
  happy:   ["happy","excited","great","amazing","wonderful","joy","love","fantastic","good","yay","😊","😄","🎉"],
  sad:     ["sad","cry","crying","depressed","lonely","hopeless","miss","grief","tears","😢","😭","💔"],
  angry:   ["angry","furious","hate","mad","frustrated","annoyed","rage","irritated","😠","😤","🤬"],
  anxious: ["anxious","nervous","worried","anxiety","panic","scared","fear","overwhelmed","😰","😨","😟"],
  stressed:["stressed","stress","pressure","deadline","exhausted","tired","burnout","overloaded","😩","😫"],
  neutral: [],
};

function detectMood(text) {
  const lower = text.toLowerCase();
  let scores = { happy:0, sad:0, angry:0, anxious:0, stressed:0, neutral:1 };
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (mood === "neutral") continue;
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[mood]++;
    }
  }
  return Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];
}

// Auto-select best personality for mood
function autoPersonality(mood) {
  const map = { happy:"friend", sad:"therapist", angry:"therapist", anxious:"zen", stressed:"tough", neutral:"therapist" };
  return map[mood] || "therapist";
}

// ── Language Detection ────────────────────────────────────────────────────────
function detectLanguage(text) {
  const tamil  = /[\u0B80-\u0BFF]/;
  const hindi  = /[\u0900-\u097F]/;
  if (tamil.test(text))  return "Tamil";
  if (hindi.test(text))  return "Hindi";
  return "English";
}

// ── Chat Endpoint ─────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { message, history = [], personalityId = "auto", sessionMoods = [] } = req.body;

  if (!message?.trim()) return res.status(400).json({ error: "Empty message" });

  const mood     = detectMood(message);
  const lang     = detectLanguage(message);
  const pid      = personalityId === "auto" ? autoPersonality(mood) : personalityId;
  const persona  = PERSONALITIES[pid] || PERSONALITIES.therapist;

  // Build mood trajectory summary
  const allMoods    = [...sessionMoods, mood];
  const moodSummary = allMoods.length > 1
    ? `The user's mood has shifted: ${allMoods.join(" → ")}.`
    : `Current detected mood: ${mood}.`;

  const langNote = lang !== "English"
    ? `IMPORTANT: The user is writing in ${lang}. Reply ONLY in ${lang}.`
    : "";

  const systemPrompt = `${persona.system}

${moodSummary}
${langNote}

Adaptive Emotional Resonance: You are aware of the user's emotional journey this session.
Gently acknowledge mood shifts when relevant. Never be robotic.
You remember everything discussed in this conversation.`;

  // Build messages array with full history
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL,
      messages,
      max_tokens: 300,
      temperature: pid === "zen" ? 0.9 : pid === "friend" ? 0.8 : 0.7,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "I'm here for you.";

    res.json({
      reply,
      mood,
      language: lang,
      personalityId: pid,
      personalityName: persona.name,
      personalityEmoji: persona.emoji,
      allMoods,
    });
  } catch (err) {
    console.error("Groq error:", err.message);
    res.status(500).json({ error: "AI unavailable", reply: "I'm having trouble connecting. Please try again." });
  }
});

// ── Mood Analysis Endpoint ────────────────────────────────────────────────────
app.post("/api/mood-summary", async (req, res) => {
  const { history = [], allMoods = [] } = req.body;
  if (!history.length) return res.json({ summary: "No conversation yet." });

  const prompt = `Based on this conversation and mood trajectory (${allMoods.join(" → ")}), 
write a 2-sentence compassionate summary of how the user is feeling and one encouraging insight.
Conversation: ${history.map(h=>`${h.role}: ${h.content}`).join("\n")}`;

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });
    res.json({ summary: completion.choices[0]?.message?.content?.trim() });
  } catch {
    res.json({ summary: "Keep going — every conversation is a step forward." });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", model: process.env.GROQ_MODEL, personalities: Object.keys(PERSONALITIES) });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n🧠 Anima Backend → http://localhost:${PORT}`);
  console.log(`   Model      : ${process.env.GROQ_MODEL}`);
  console.log(`   Features   : Mood detection, Language detection, Memory, Personalities\n`);
});
