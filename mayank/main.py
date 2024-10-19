from collections import defaultdict
import random

# Function to count word frequencies
def count_word_frequencies(text):
    word_count = defaultdict(int)
    words = text.lower().split()
    for word in words:
        word_count[word] += 1
    return dict(word_count)

# Example usage
sample_text = "I am Mayank. I am a student. I am from India. I am a software engineer. I am a data scientist. I am a machine learning engineer. I am a deep learning engineer. I am a computer vision engineer. I am a natural language processing engineer. I am a ai engineer. I am a ai researcher. I am a ai developer. I am a ai scientist. I am a ai engineer."
word_frequencies = count_word_frequencies(sample_text)

# Print word frequencies
print("Word Frequencies:")
for word, count in word_frequencies.items():
    print(f"Frequency of {word}: {count}")

# Function to build n-gram model
def build_ngram_model(text, n=2):
    words = text.lower().split()
    ngrams = defaultdict(list)
    for i in range(len(words) - n):
        key = tuple(words[i:i+n])
        ngrams[key].append(words[i+n])
    return dict(ngrams)

# Function to predict next word
def predict_next_word(text, model):
    words = text.lower().split()
    if len(words) < 2:
        return random.choice(list(set(sum(model.values(), []))))
    key = tuple(words[-2:])
    if key in model:
        return random.choice(model[key])
    return random.choice(list(set(sum(model.values(), []))))

# Global variable to store the model
ngram_model = None