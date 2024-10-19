from flask import Flask, request, render_template, jsonify, send_from_directory, make_response
from collections import defaultdict
import os
import csv
import io
from main import count_word_frequencies, build_ngram_model, predict_next_word

app = Flask(__name__)
ngram_model = None

# Function to count word frequencies
def count_word_frequencies(text):
    word_count = defaultdict(int)
    words = text.lower().split()
    for word in words:
        word_count[word] += 1
    return dict(word_count)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze_text():
    global ngram_model
    if 'file' in request.files:
        file = request.files['file']
        if file.filename != '':
            text = file.read().decode('utf-8')
    else:
        text = request.form['text']
    
    word_frequencies = count_word_frequencies(text)
    ngram_model = build_ngram_model(text)
    return jsonify({
        'frequencies': word_frequencies
    })

@app.route('/download_csv')
def download_csv():
    word_frequencies = request.args.get('data')
    if not word_frequencies:
        return jsonify({'error': 'No data provided'})
    
    word_frequencies = eval(word_frequencies)  # Convert string to dictionary
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Word', 'Frequency'])
    for word, freq in word_frequencies.items():
        writer.writerow([word, freq])
    
    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=word_frequencies.csv"
    response.headers["Content-type"] = "text/csv"
    return response

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route('/predict', methods=['POST'])
def predict_next():
    global ngram_model
    text = request.form['text']
    if ngram_model is None:
        return jsonify({'error': 'No model available'})
    next_word = predict_next_word(text, ngram_model)
    return jsonify({
        'next_word': next_word
    })

if __name__ == '__main__':
    app.run(debug=True)