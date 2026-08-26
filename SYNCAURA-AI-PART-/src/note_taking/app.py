from fastapi import FastAPI, UploadFile, File
import whisper
import joblib
import os
import tempfile
import re

# ================= APP =================
app = FastAPI(title="Live Note Taking Assistant API")

# ================= PATHS =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "importance_classifier.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "tfidf_vectorizer.pkl")

# ================= LOAD MODELS (ONCE) =================
print(" Loading Whisper model...")
whisper_model = whisper.load_model("base")
print("Whisper loaded")

print("Loading ML classifier...")
clf = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)
print("Classifier loaded (90.48% accuracy)")

# ================= CONSTANTS =================
CONFIDENCE_THRESHOLD = 0.65

IMPORTANT_KEYWORDS = [
    "deadline", "submit", "complete", "finish",
    "by monday", "by tuesday", "by wednesday", "by thursday", "by friday",
    "by tomorrow", "by today", "by eod", "by next week",
    "need to", "have to", "must", "should", "remember", "important",
    "will handle", "will complete", "will finish", "will prepare",
    "assigned to", "responsible for", "budget", "allocate", "critical", "urgent"
]

NOISE_PHRASES = [
    "am i audible", "can you hear", "can you see", "can everyone hear",
    "network issue", "on mute", "audio issue", "video", "camera",
    "hello everyone", "good morning", "sorry", "give me a moment",
    "one second", "hold on", "wait", "reconnect", "rejoin",
    "screen share", "sharing screen", "frozen", "lag", "glitch"
]

# ================= HELPERS =================
def preprocess(text: str):
    text = text.strip()
    if len(text.split()) < 2:
        return None
    return text

def has_action_pattern(sentence: str) -> bool:
    """Check for action/task patterns"""
    s = sentence.lower()
    
   
    if re.search(r'\b[A-Z][a-z]+\s+(will|is|assigned|responsible)', sentence):
        return True
    
    
    if re.search(r'\b(by|before|until)\s+(monday|tuesday|wednesday|thursday|friday|eod|today|tomorrow)', s):
        return True
    
    # Pattern: budget/allocation
    if re.search(r'\d+k?\s*(budget|allocation)|allocate', s):
        return True
    
    return False

def predict_importance(sentence: str):
    s = sentence.lower()

    # Rule 1: Noise detection
    if any(n in s for n in NOISE_PHRASES):
        return "NOT IMPORTANT", 0.95
    
    # Rule 2: Very short sentences
    if len(sentence.split()) <= 3:
        return "NOT IMPORTANT", 0.90

    # Rule 3: Action patterns = boost important
    if has_action_pattern(sentence):
        vec = vectorizer.transform([sentence])
        probs = clf.predict_proba(vec)[0]
        prob_important = max(probs[1], 0.75)
        return "IMPORTANT", round(prob_important, 2)

    # Rule 4: Important keywords
    if any(k in s for k in IMPORTANT_KEYWORDS):
        vec = vectorizer.transform([sentence])
        probs = clf.predict_proba(vec)[0]
        if probs[1] >= 0.50:
            return "IMPORTANT", round(probs[1], 2)

    # Rule 5: ML fallback
    vec = vectorizer.transform([sentence])
    probs = clf.predict_proba(vec)[0]

    if probs[1] >= CONFIDENCE_THRESHOLD:
        return "IMPORTANT", round(probs[1], 2)
    else:
        return "NOT IMPORTANT", round(probs[0], 2)

# ================= ROUTES =================
@app.get("/")
def health_check():
    return {
        "status": "API running",
        "model_accuracy": "90.48%",
        "version": "2.0"
    }

@app.post("/analyze-audio")
async def analyze_audio(file: UploadFile = File(...)):
    # Save uploaded audio temporarily
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp:
        audio_path = temp.name
        temp.write(await file.read())

    # Transcribe
    result = whisper_model.transcribe(audio_path)
    os.remove(audio_path)

    text = result["text"].strip()

    clean = preprocess(text)
    if not clean:
        return {
            "transcription": text,
            "label": "NOT IMPORTANT",
            "confidence": 0.0
        }

    label, confidence = predict_importance(clean)

    return {
        "transcription": clean,
        "label": label,
        "confidence": confidence
    }


# in terminal type: uvicorn app:app --reload or python -m uvicorn app:app --reload
# open http://127.0.0.1:8000/docs in browser


