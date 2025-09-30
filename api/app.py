from flask import Flask, request, jsonify
import torch
import torch.nn as nn
from transformers import RobertaModel, RobertaTokenizer
import re

app = Flask(__name__)

# Load tokenizer
tokenizer = RobertaTokenizer.from_pretrained("roberta-base")

# Define the model architecture (must match training)
class CustomRobertaClassifier(nn.Module):
    def __init__(self):
        super(CustomRobertaClassifier, self).__init__()
        self.roberta = RobertaModel.from_pretrained("roberta-base")
        self.classifier = nn.Sequential(
            nn.Linear(768, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 2)
        )

    def forward(self, input_ids, attention_mask):
        outputs = self.roberta(input_ids=input_ids, attention_mask=attention_mask)
        cls_output = outputs.last_hidden_state[:, 0, :]  # Take [CLS] token
        logits = self.classifier(cls_output)
        return logits

# Load model and weights
model = CustomRobertaClassifier()
model.load_state_dict(torch.load("best_roberta.pt", map_location=torch.device("cpu")))
model.eval()

# Text preprocessing function
def preprocess_text(text):
    # Convert to lowercase
    text = text.lower()
    
    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    
    # Remove HTML tags
    text = re.sub(r'<.*?>', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Remove special characters but keep basic punctuation
    text = re.sub(r'[^\w\s\.\!\?\,\;\:\-\'\"]', '', text)
    
    return text

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400

    # Preprocess the text
    processed_text = preprocess_text(text)
    
    encoding = tokenizer(processed_text, return_tensors="pt", padding=True, truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(encoding["input_ids"], encoding["attention_mask"])
        
        # Apply softmax to get probabilities
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        confidence, prediction = torch.max(probabilities, dim=1)
        
        # Get both probabilities
        fake_prob = probabilities[0][1].item()
        real_prob = probabilities[0][0].item()
        
        # Determine label based on higher probability
        label = "FAKE" if prediction.item() == 1 else "REAL"
        
        # Calculate confidence percentage
        confidence_percent = confidence.item() * 100
        
        # Determine if prediction is confident
        is_confident = confidence_percent > 75  # Threshold for confident prediction
        
    return jsonify({
        "prediction": label,
        "confidence": confidence_percent,
        "real_probability": real_prob * 100,
        "fake_probability": fake_prob * 100,
        "is_confident": is_confident,
        "preprocessed_text": processed_text
    })

if __name__ == "__main__":
    app.run(debug=True, port=5001)