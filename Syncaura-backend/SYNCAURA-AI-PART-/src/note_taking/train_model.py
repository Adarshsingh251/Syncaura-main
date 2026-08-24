import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import numpy as np

def train_model():
    df = pd.read_csv("new_dataset2_clean.csv")
    print("Dataset shape:", df.shape)
    print("\nClass distribution:")
    print(df['label'].value_counts())

    X = df['sentence']
    y = df['label_num']

    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\nTrain size: {X_train.shape[0]}")
    print(f"Test size: {X_test.shape[0]}")

    
    tfidf = TfidfVectorizer(
        lowercase=True,
        stop_words='english',
        ngram_range=(1, 3), 
        max_features=8000,   
        min_df=2,             
        max_df=0.9,           
        sublinear_tf=True    
    )

    X_train_tfidf = tfidf.fit_transform(X_train)
    X_test_tfidf = tfidf.transform(X_test)

    print(f"\nTF-IDF train shape: {X_train_tfidf.shape}")
    print(f"TF-IDF test shape: {X_test_tfidf.shape}")

    
   
    model = RandomForestClassifier(
        n_estimators=200,           
        max_depth=30,               
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight='balanced',    
        random_state=42,
        n_jobs=-1                    
    )

    print("\nTraining model...")
    model.fit(X_train_tfidf, y_train)

    # Predictions
    y_pred = model.predict(X_test_tfidf)
    y_pred_proba = model.predict_proba(X_test_tfidf)

    # Evaluation
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n{'='*50}")
    print(f"ACCURACY: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"{'='*50}")

    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)
    print(f"\nTrue Negatives: {cm[0,0]}")
    print(f"False Positives: {cm[0,1]}")
    print(f"False Negatives: {cm[1,0]}")
    print(f"True Positives: {cm[1,1]}")

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['not_important', 'important']))

    
    feature_names = tfidf.get_feature_names_out()
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1][:20]
    
    print("\nTop 20 Most Important Features:")
    for i, idx in enumerate(indices, 1):
        print(f"{i}. {feature_names[idx]}: {importances[idx]:.4f}")

    # Save model and vectorizer
    joblib.dump(model, "importance_classifier.pkl")
    joblib.dump(tfidf, "tfidf_vectorizer.pkl")
    print("\n✓ Model and vectorizer saved successfully")

if __name__ == "__main__":
    train_model()