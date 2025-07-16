from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pandas as pd
import os
from datetime import datetime
import difflib  # For finding similar words

app = Flask(__name__)
CORS(app)

# Get the base directory of the app
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Path to the Excel file in /database/
EXCEL_PATH = os.path.join(BASE_DIR, 'database', 'kannada_words_cleaned_updated.xlsx')

# Load the cleaned Excel file
data = pd.read_excel(EXCEL_PATH)
data['kundapura_kannada'] = data['kundapura_kannada'].astype(str).str.strip().str.lower()
data['normal_kannada'] = data['normal_kannada'].astype(str).str.strip().str.lower()

# In-memory storage for suggestions and contact form
suggested_words = []
contact_submissions = []

# Utility: Find similar words
def get_similar_words(word, threshold=0.6, max_results=5):
    similar_words = []
    for existing_word in data['kundapura_kannada']:
        similarity = difflib.SequenceMatcher(None, word, existing_word).ratio()
        if similarity >= threshold:
            similar_words.append(existing_word)
    return similar_words[:max_results]

# Home routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/home')
def home_page():
    return render_template('home.html')

@app.route('/h')
def h_page():
    return render_template('h.html')

# Word Search Route
@app.route("/search", methods=["POST"])
def search_word():
    try:
        word = request.json.get("word", "").strip().lower()
        if not word:
            return jsonify({"meaning": "Please enter a word to search."})

        # Check Kundapura Kannada to Normal Kannada
        result_kundapura = data[data["kundapura_kannada"] == word]
        if not result_kundapura.empty:
            return jsonify({"meaning": result_kundapura.iloc[0]["normal_kannada"]})

        # Check Normal Kannada to Kundapura Kannada
        result_normal = data[data["normal_kannada"] == word]
        if not result_normal.empty:
            return jsonify({"meaning": result_normal.iloc[0]["kundapura_kannada"]})

        # No exact match, suggest similar words
        similar_words = get_similar_words(word)
        if similar_words:
            return jsonify({"meaning": "No exact match found. Similar words: " + ", ".join(similar_words)})

        return jsonify({"meaning": "No result found."})

    except Exception as e:
        return jsonify({"meaning": f"An error occurred: {str(e)}"})

# Add Word Suggestion
@app.route("/add_word", methods=["POST"])
def add_word():
    try:
        data_json = request.get_json()
        word = data_json.get("word")
        meaning = data_json.get("meaning")
        user = data_json.get("user", "Anonymous")

        new_word_data = {
            "word": word,
            "meaning": meaning,
            "user": user,
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        suggested_words.append(new_word_data)
        return jsonify({"message": "New word added for admin review."})

    except Exception as e:
        return jsonify({"message": f"An error occurred: {str(e)}"})

# Get Suggested Words (for Admin)
@app.route("/admin/suggested_words", methods=["GET"])
def get_suggested_words():
    try:
        return jsonify(suggested_words)
    except Exception as e:
        return jsonify({"message": f"An error occurred: {str(e)}"})

# Save Contact Form Data
@app.route("/contact", methods=["POST"])
def save_contact():
    try:
        contact_data = request.get_json()
        contact_data["date"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        contact_submissions.append(contact_data)
        return jsonify({"message": "Contact form data saved successfully."})
    except Exception as e:
        return jsonify({"message": f"An error occurred: {str(e)}"})

# Get Contact Submissions (for Admin)
@app.route("/admin/contact_submissions", methods=["GET"])
def get_contact_submissions():
    try:
        return jsonify(contact_submissions)
    except Exception as e:
        return jsonify({"message": f"An error occurred: {str(e)}"})

# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True)
