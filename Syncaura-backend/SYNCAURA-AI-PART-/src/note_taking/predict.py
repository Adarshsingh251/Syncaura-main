import joblib
import re

# Load saved model and vectorizer
model = joblib.load("importance_classifier.pkl")
vectorizer = joblib.load("tfidf_vectorizer.pkl")

# Technical/meeting noise keywords
NOISE_KEYWORDS = [
    "can you hear", "am i audible", "on mute", "unmute", "muted",
    "video", "camera", "screen share", "sharing screen", "can you see",
    "wifi", "internet", "connection", "lag", "frozen", "freeze",
    "rejoin", "reconnect", "glitch", "audio issue", "mic",
    "give me a moment", "one second", "hold on", "wait",
    "good morning", "hello everyone", "bye", "thank you everyone",
    "nothing from my side", "no updates", "that's all"
]

# Strong action/task indicators
ACTION_KEYWORDS = [
    "will complete", "will handle", "will prepare", "will update",
    "will finalize", "will review", "will create", "will fix",
    "assigned to", "responsible for", "deadline", "by friday",
    "by monday", "by eod", "must finish", "should complete",
    "budget", "allocate", "team must", "please ensure",
    "needs to be", "has to be", "required", "priority"
]

# Confidence threshold
CONFIDENCE_THRESHOLD = 0.65 

def has_action_pattern(sentence: str) -> bool:
    """Check if sentence contains clear action/task patterns"""
    sentence_lower = sentence.lower()
    
    
    name_action_pattern = r'\b[A-Z][a-z]+\s+(will|is|assigned|responsible)'
    if re.search(name_action_pattern, sentence):
        return True
    
    
    deadline_pattern = r'\b(by|before|until)\s+(monday|tuesday|wednesday|thursday|friday|eod|next week)'
    if re.search(deadline_pattern, sentence_lower):
        return True
    
    
    if re.search(r'\d+k?\s*budget|allocate|approved', sentence_lower):
        return True
    
    return False

def is_clearly_noise(sentence: str) -> bool:
    """Check if sentence is clearly technical/meeting noise"""
    sentence_lower = sentence.lower()
    
    # Short sentences are often noise
    if len(sentence.split()) <= 4:
        return True
    
    # Check noise keywords
    for keyword in NOISE_KEYWORDS:
        if keyword in sentence_lower:
            return True
    
    return False

def predict_importance(sentence: str):
    """
    Predict if a sentence is important or not
    Returns: (label, confidence)
    """
    sentence = sentence.strip()
    
    
    if is_clearly_noise(sentence):
        return "not_important", 0.95
    
    
    if has_action_pattern(sentence):
       
        sentence_tfidf = vectorizer.transform([sentence])
        prob = model.predict_proba(sentence_tfidf)[0]
        prob_important = max(prob[1], 0.75)  
        return "important", round(prob_important, 2)
    
    
    sentence_tfidf = vectorizer.transform([sentence])
    prob = model.predict_proba(sentence_tfidf)[0]
    
    prob_not_important = prob[0]
    prob_important = prob[1]
    
   
    sentence_lower = sentence.lower()
    has_action_keyword = any(kw in sentence_lower for kw in ACTION_KEYWORDS)
    
   
    threshold = CONFIDENCE_THRESHOLD
    if has_action_keyword:
        threshold = 0.50  
    
    if prob_important >= threshold:
        return "important", round(prob_important, 2)
    else:
        return "not_important", round(prob_not_important, 2)

def batch_predict(sentences: list):
    """Predict importance for multiple sentences"""
    results = []
    for sentence in sentences:
        label, conf = predict_importance(sentence)
        results.append({
            'sentence': sentence,
            'label': label,
            'confidence': conf
        })
    return results

if __name__ == "__main__":
    # Test with examples
    test_sentences = [
        "Riya will complete the backend integration by Friday",
        "Can you hear me clearly?",
        "The deadline for the project is Monday",
        "I think my audio is lagging",
        "Please allocate 50k budget for documentation",
        "Give me a moment",
        "Arjun will fix the critical bug today"
    ]
    
    print("Testing with sample sentences:\n")
    for sentence in test_sentences:
        label, conf = predict_importance(sentence)
        print(f"[{label.upper()}] ({conf}) - {sentence}")
    
    print("\n" + "="*60)
    print("Interactive mode - Enter sentences to classify")
    print("="*60 + "\n")
    
    while True:
        sentence = input("Enter a sentence (or 'exit' to quit): ")
        if sentence.lower() == 'exit':
            break
        
        label, conf = predict_importance(sentence)
        
       
        if label == "important":
            print(f" IMPORTANT (confidence: {conf})\n")
        else:
            print(f" NOT IMPORTANT (confidence: {conf})\n")