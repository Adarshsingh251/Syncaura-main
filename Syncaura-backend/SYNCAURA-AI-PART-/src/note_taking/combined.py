import whisper
import sounddevice as sd
import numpy as np
import joblib
import os
import tempfile
import scipy.io.wavfile as wavfile
import re

# ================= PATHS =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "importance_classifier.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "tfidf_vectorizer.pkl")

# ================= LOAD MODELS =================
print("Loading Whisper model...")
whisper_model = whisper.load_model("base")
print("Whisper loaded")

print("Loading ML classifier...")
clf = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)
print("Classifier loaded (90.48% accuracy)")

# ================= CONSTANTS =================
SAMPLE_RATE = 16000
RECORD_SECONDS = 6
CONFIDENCE_THRESHOLD = 0.65  # Improved from 0.55

# ================= IMPROVED KEYWORDS =================
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

# ================= IMPROVED HELPERS =================
def preprocess(text):
    text = text.strip()
    if len(text.split()) < 2:  # Changed from 3 to 2
        return None
    return text

def has_action_pattern(sentence: str) -> bool:
    """Check for action/task patterns"""
    s = sentence.lower()
    
    
    if re.search(r'\b[A-Z][a-z]+\s+(will|is|assigned|responsible)', sentence):
        return True
    
    
    if re.search(r'\b(by|before|until)\s+(monday|tuesday|wednesday|thursday|friday|eod|today|tomorrow)', s):
        return True
    
   
    if re.search(r'\d+k?\s*(budget|allocation)|allocate', s):
        return True
    
    return False

def predict_importance(sentence):
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

# ================= RECORD AUDIO =================
def record_audio():
    print("Recording...")
    audio = sd.rec(
        int(RECORD_SECONDS * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype=np.int16
    )
    sd.wait()
    print("Recording complete")
    return audio.flatten()

# ================= MAIN LOOP =================
print("\n" + "="*60)
print("LIVE NOTE TAKING ASSISTANT")
print("="*60)
print("Model Accuracy: 90.48%")
print("Recording Duration: 6 seconds")
print("\nPress ENTER to start recording, then speak.")
print("Press CTRL+C to exit.")
print("="*60 + "\n")

try:
    while True:
        input("Press ENTER and speak... ")

        audio = record_audio()

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            wavfile.write(f.name, SAMPLE_RATE, audio)
            audio_path = f.name

        print("Transcribing...")
        result = whisper_model.transcribe(audio_path)
        text = result["text"].strip()

        os.remove(audio_path)

        if not text:
            print("No speech detected\n")
            continue

        clean = preprocess(text)
        if not clean:
            print("Text too short, ignored\n")
            continue

        label, confidence = predict_importance(clean)

        # Pretty output
        print("\n" + "-"*60)
        print(f" Transcription: {clean}")
        
        if label == "IMPORTANT":
            print(f"Result: {label} (confidence: {confidence})")
        else:
            print(f"Result: {label} (confidence: {confidence})")
        
        print("-"*60 + "\n")

except KeyboardInterrupt:
    print("\n\n Stopped. Goodbye!")
    print("="*60)