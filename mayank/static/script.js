function analyzeText() {
    const text = document.getElementById('textInput').value;
    const fileInput = document.getElementById('fileInput');
    const formData = new FormData();

    if (fileInput.files.length > 0) {
        formData.append('file', fileInput.files[0]);
    } else {
        formData.append('text', text);
    }

    fetch('/analyze', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        displayResults(data.frequencies);
        createChart(data.frequencies);
        createWordCloud(data.frequencies);
        
        // Show the results, chart, and word cloud sections
        document.querySelector('.results').style.display = 'block';
        document.querySelector('.chart').style.display = 'block';
        document.querySelector('.word-cloud').style.display = 'block';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while analyzing the text. Please try again.');
    });
}

function startAutoPrediction(text) {
    const predictionInput = document.getElementById('predictionInput');
    const words = text.split(/\s+/);
    let currentIndex = 0;

    function predictNext() {
        if (currentIndex < words.length) {
            predictionInput.value = words.slice(0, currentIndex + 1).join(' ');
            predictNextWord();
            currentIndex++;
            setTimeout(predictNext, 1000); // Predict next word every second
        }
    }

    predictNext();
}

function displayResults(wordCounts) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';
    
    const sortedEntries = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);
    const topWords = sortedEntries.slice(0, 20); // Display top 20 words

    topWords.forEach(([word, count], index) => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-item';
        wordElement.style.animationDelay = `${index * 0.1}s`;
        
        const wordText = document.createElement('span');
        wordText.className = 'word-text';
        wordText.textContent = word.length > 10 ? word.slice(0, 10) + '...' : word;
        
        const countBadge = document.createElement('span');
        countBadge.className = 'count-badge';
        countBadge.textContent = count;
        
        wordElement.appendChild(wordText);
        wordElement.appendChild(countBadge);
        resultsContainer.appendChild(wordElement);
    });
}

function createChart(wordCounts) {
    const ctx = document.getElementById('frequencyChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.frequencyChart instanceof Chart) {
        window.frequencyChart.destroy();
    }

    const sortedEntries = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);
    const topWords = sortedEntries.slice(0, 10);

    // Define colors corresponding to the badge colors
    const colors = ['#2196F3', '#FF9800', '#E91E63', '#4CAF50'];

    window.frequencyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topWords.map(entry => entry[0]),
            datasets: [{
                label: 'Word Frequency',
                data: topWords.map(entry => entry[1]),
                backgroundColor: topWords.map((_, index) => colors[index % colors.length]),
                borderColor: topWords.map((_, index) => colors[index % colors.length]),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frequency'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Words'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Most Frequent Words'
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

function resetText() {
    document.getElementById('textInput').value = '';
    document.getElementById('resultsContainer').innerHTML = '';
    
    // Clear the chart
    const ctx = document.getElementById('frequencyChart').getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (window.frequencyChart instanceof Chart) {
        window.frequencyChart.destroy();
    }

    // Clear the word cloud
    d3.select("#wordCloudContainer").html("");

    // Hide the results, chart, and word cloud sections
    document.querySelector('.results').style.display = 'none';
    document.querySelector('.chart').style.display = 'none';
    document.querySelector('.word-cloud').style.display = 'none';
}

function loadFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('textInput').value = e.target.result;
        };
        reader.readAsText(file);
        
        // Update the file input text with the selected file name
        const fileInputText = document.querySelector('.file-input-text');
        fileInputText.textContent = file.name;
    }
}

function downloadCSV() {
    const wordCounts = getWordCounts();
    const csvContent = [
        ['Word', 'Frequency'],
        ...Object.entries(wordCounts)
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "word_frequencies.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function getWordCounts() {
    const resultsContainer = document.getElementById('resultsContainer');
    const wordItems = resultsContainer.getElementsByClassName('word-item');
    const wordCounts = {};
    
    for (let item of wordItems) {
        const word = item.querySelector('.word-text').textContent;
        const count = parseInt(item.querySelector('.count-badge').textContent);
        wordCounts[word] = count;
    }
    
    return wordCounts;
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add text content
    doc.text("Word Frequencies", 14, 15);

    // Create table data
    const wordCounts = getWordCounts();
    const tableData = Object.entries(wordCounts).map(([word, count]) => [word, count]);

    // Add table to PDF
    doc.autoTable({
        head: [['Word', 'Frequency']],
        body: tableData,
        startY: 20,
    });

    // Capture the frequency chart as an image
    html2canvas(document.getElementById('frequencyChart')).then(canvas => {
        const chartImgData = canvas.toDataURL('image/png');
        const chartImgWidth = doc.internal.pageSize.getWidth() - 20;
        const chartImgHeight = canvas.height * chartImgWidth / canvas.width;

        // Add the chart image to the PDF
        doc.addPage();
        doc.text("Word Frequency Chart", 14, 15);
        doc.addImage(chartImgData, 'PNG', 10, 20, chartImgWidth, chartImgHeight);

        // Capture the word cloud as an image
        html2canvas(document.getElementById('wordCloudContainer')).then(cloudCanvas => {
            const cloudImgData = cloudCanvas.toDataURL('image/png');
            const cloudImgWidth = doc.internal.pageSize.getWidth() - 20;
            const cloudImgHeight = cloudCanvas.height * cloudImgWidth / cloudCanvas.width;

            // Add the word cloud image to the PDF
            doc.addPage();
            doc.text("Word Cloud", 14, 15);
            doc.addImage(cloudImgData, 'PNG', 10, 20, cloudImgWidth, cloudImgHeight);

            // Save the PDF
            doc.save("word_frequencies_and_cloud.pdf");
        });
    });
}

function createWordCloud(wordCounts) {
    // Clear previous word cloud
    d3.select("#wordCloudContainer").html("");

    const width = 600;
    const height = 400;

    // Calculate the maximum frequency for scaling
    const maxFreq = Math.max(...Object.values(wordCounts));

    const words = Object.entries(wordCounts)
        .map(([text, size]) => ({
            text,
            size: Math.sqrt(size / maxFreq) * 50 + 10 // Adjust size calculation
        }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 100);  // Limit to top 100 words for performance

    const layout = d3.layout.cloud()
        .size([width, height])
        .words(words)
        .padding(5)
        .rotate(() => ~~(Math.random() * 2) * 90)
        .font("Arial")
        .fontSize(d => d.size)
        .on("end", draw);

    layout.start();

    function draw(words) {
        const svg = d3.select("#wordCloudContainer")
            .append("svg")
            .attr("width", layout.size()[0])
            .attr("height", layout.size()[1]);

        const wordCloud = svg.append("g")
            .attr("transform", `translate(${layout.size()[0] / 2},${layout.size()[1] / 2})`)
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", d => `${d.size}px`)
            .style("font-family", "Arial, sans-serif")
            .style("font-weight", "bold")
            .style("fill", () => d3.scale.category20()(Math.random()))
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
            .text(d => d.text);

        // Add hover effect
        wordCloud.on("mouseover", function() {
            d3.select(this)
                .transition()
                .duration(200)
                .style("font-size", d => `${d.size * 1.2}px`)
                .style("cursor", "pointer");
        }).on("mouseout", function() {
            d3.select(this)
                .transition()
                .duration(200)
                .style("font-size", d => `${d.size}px`);
        });
    }
}

let predictionInterval;

function startPrediction() {
    clearInterval(predictionInterval);  // Clear any existing interval
    const text = document.getElementById('predictionInput').value;
    const wordCount = parseInt(document.getElementById('wordCount').value);
    let predictedWords = 0;

    function predictNext() {
        if (predictedWords < wordCount) {
            predictNextWord();
            predictedWords++;
        } else {
            clearInterval(predictionInterval);
        }
    }

    predictNext();  // Predict the first word immediately
    if (wordCount > 1) {
        predictionInterval = setInterval(predictNext, 1000);  // Then predict every second
    }
}

function predictNextWord() {
    const text = document.getElementById('predictionInput').value;
    const formData = new FormData();
    formData.append('text', text);

    fetch('/predict', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const nextWord = data.next_word;
        const resultElement = document.getElementById('predictionResult');
        if (nextWord) {
            document.getElementById('predictionInput').value += ' ' + nextWord;
            resultElement.textContent = `Predicted word: ${nextWord}`;
            resultElement.style.color = '#4CAF50';
        } else {
            resultElement.textContent = 'No prediction available';
            resultElement.style.color = '#f44336';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('predictionResult').textContent = 'An error occurred';
        document.getElementById('predictionResult').style.color = '#f44336';
    });
}
