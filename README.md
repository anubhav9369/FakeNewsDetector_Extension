# 📌 Fake News Detection using RoBERTa-Based LLMs

A complete end-to-end fake news detection system with a fine-tuned RoBERTa model, backend API, and a Chrome Extension.

# Demo
<img width="306" height="245" alt="image" src="https://github.com/user-attachments/assets/177a323e-02a1-4685-aab2-460d8727bf72" />





# 🚀 Project Overview

This project presents a RoBERTa-based fake news detection system that identifies misinformation from online article headlines. It includes:

✔ A fine-tuned RoBERTa model
✔ Backend Flask API for real-time predictions
✔ A Chrome Extension that users can install manually
✔ Scripts for downloading large model files from Google Drive

The system classifies news as FAKE or REAL with high accuracy and supports real-time browser-level predictions.

# 🗂 6. Dataset

Includes Fake.csv and True.csv containing:

Headlines
Article text
Subject
Publish date

# 📊 9. Model Performance

RoBERTa gives the best accuracy for short and long news formats
Provides better accuracy without high computation cost
Balanced performance for real-time deployment

# 🧩 10. Chrome Extension

The Chrome Extension:
✔ Extracts news headline from any news page
✔ Sends it to your backend API
✔ Shows REAL / FAKE instantly
✔ Works in a popup window
✔ Requires no login or signup

How to Install the Extension

Go to chrome://extensions/
Turn ON Developer Mode
Click Load Unpacked
Select the extension/ folder from this repository
Extension will appear in the Chrome toolbar

# 💾 12. Model Download (Google Drive)

GitHub cannot store files >100 MB, so download them automatically.

Python Script
pip install gdown
python download_models.py

Shell Script
chmod +x download_models.sh
./download_models.sh


Downloads:
best_roberta.pt
roberta_model_weights.pt

Stored into:
models/

Direct Links

best_roberta.pt
https://drive.google.com/file/d/1pbdk6kV4tuAbAMKGZPfnGixH2cL6Ou18/view?usp=sharing

roberta_model_weights.pt
https://drive.google.com/file/d/1TWH1x8RCXGtMTzcJtf-OBJWMA9IV3dsb/view?usp=sharing

# 🏗 13. Project Structure
FakeNewsDetector/
│── api/
│   ├── app.py
│   ├── model/
│   ├── download_models.py
│── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── icon.png
│── models/ (ignored)
│── download_models.sh
│── README.md
│── requirements.txt


# 🚀 14. How to Run Backend API
Install dependencies
pip install -r requirements.txt

Download models
python download_models.py

Run Flask API
python app.py

API runs on:
http://localhost:5000/predict

