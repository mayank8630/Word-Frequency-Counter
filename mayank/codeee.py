from sklearn.feature_extraction.text import CountVectorizer

# Function to read text from a file
def read_text_file(file_path):
    with open("C:\Users\Nitin\Desktop\code.txt", 'r') as file:
        return file.read()

# Read the text from the file
file_path = '"C:\Users\Nitin\Desktop\code.txt"'
Sentence = read_text_file(file_path)

# Machine learning approach using CountVectorizer
vectorizer = CountVectorizer()
X = vectorizer.fit_transform([Sentence])
word_freq = X.toarray()[0]
words = vectorizer.get_feature_names_out()
ml_dictionary = dict(zip(words, word_freq))

print("Machine Learning Approach:")
for word, freq in ml_dictionary.items():
    print(f"Frequency of {word}: {freq}")