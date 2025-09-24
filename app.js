// Application data
const appData = {
    ukrainian: {
        alphabet: "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ",
        lowercase: "абвгґдеєжзиіїйклмнопрстуфхцчшщьюя",
        sample: "Привіт світ! Це приклад тексту для шифрування.",
        help: "Шифр Цезаря - це метод шифрування, де кожна буква замінюється на букву, що знаходиться на фіксованому числі позицій далі в алфавіті."
    },
    english: {
        alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        lowercase: "abcdefghijklmnopqrstuvwxyz",
        sample: "Hello world! This is a sample text for encryption.",
        help: "Caesar cipher is an encryption method where each letter is replaced by a letter a fixed number of positions down the alphabet."
    }
};

// Current language settings
let currentLanguage = 'ukrainian';
let settings = {
    caseHandling: 'preserve',
    nonAlphaHandling: 'preserve'
};

// Key Validator Class
class KeyValidator {
    constructor(language) {
        this.language = language;
        this.maxKey = appData[language].alphabet.length - 1;
    }

    validate(key) {
        if (key === null || key === undefined || key === '') {
            return { valid: false, message: 'Ключ не може бути порожнім' };
        }

        const numKey = parseInt(key);
        if (isNaN(numKey)) {
            return { valid: false, message: 'Ключ повинен бути числом' };
        }

        if (numKey < 1) {
            return { valid: false, message: 'Ключ повинен бути більше 0' };
        }

        if (numKey > this.maxKey) {
            return { valid: false, message: `Ключ не може бути більше ${this.maxKey}` };
        }

        return { valid: true, message: 'Ключ коректний' };
    }

    getRange() {
        return `1-${this.maxKey}`;
    }
}

// Caesar Cipher Class
class CaesarCipher {
    constructor(language) {
        this.language = language;
        this.data = appData[language];
        this.validator = new KeyValidator(language);
    }

    encrypt(text, key) {
        const validation = this.validator.validate(key);
        if (!validation.valid) {
            throw new Error(validation.message);
        }

        const numKey = parseInt(key);
        return this.processText(text, numKey, true);
    }

    decrypt(text, key) {
        const validation = this.validator.validate(key);
        if (!validation.valid) {
            throw new Error(validation.message);
        }

        const numKey = parseInt(key);
        return this.processText(text, numKey, false);
    }

    processText(text, key, isEncrypt) {
        let result = '';
        const alphabetSize = this.data.alphabet.length;

        for (let char of text) {
            const upperIndex = this.data.alphabet.indexOf(char.toUpperCase());
            const lowerIndex = this.data.lowercase.indexOf(char);

            if (upperIndex !== -1) {
                // Upper case character
                const shift = isEncrypt ? key : alphabetSize - key;
                const newIndex = (upperIndex + shift) % alphabetSize;
                const newChar = this.data.alphabet[newIndex];
                
                if (settings.caseHandling === 'preserve' && char === char.toLowerCase()) {
                    result += this.data.lowercase[newIndex];
                } else if (settings.caseHandling === 'lower') {
                    result += this.data.lowercase[newIndex];
                } else {
                    result += newChar;
                }
            } else if (lowerIndex !== -1) {
                // Lower case character
                const shift = isEncrypt ? key : alphabetSize - key;
                const newIndex = (lowerIndex + shift) % alphabetSize;
                const newChar = this.data.lowercase[newIndex];
                
                if (settings.caseHandling === 'upper') {
                    result += this.data.alphabet[newIndex];
                } else {
                    result += newChar;
                }
            } else {
                // Non-alphabetic character
                switch (settings.nonAlphaHandling) {
                    case 'preserve':
                        result += char;
                        break;
                    case 'remove':
                        break;
                    case 'space':
                        result += ' ';
                        break;
                }
            }
        }

        return result;
    }
}

// Brute Force Attacker Class
class BruteForceAttacker {
    constructor(language) {
        this.language = language;
        this.cipher = new CaesarCipher(language);
        this.alphabetSize = appData[language].alphabet.length;
    }

    attack(ciphertext, callback) {
        const results = [];
        
        for (let key = 1; key < this.alphabetSize; key++) {
            try {
                const decrypted = this.cipher.decrypt(ciphertext, key);
                const score = this.scoreText(decrypted);
                
                results.push({
                    key: key,
                    text: decrypted,
                    score: score,
                    likely: score > 0.6
                });

                if (callback) {
                    callback(key, this.alphabetSize - 1, results[results.length - 1]);
                }
            } catch (error) {
                console.error(`Error with key ${key}:`, error);
            }
        }

        return results.sort((a, b) => b.score - a.score);
    }

    scoreText(text) {
        // Simple scoring based on common patterns
        const commonWords = this.language === 'ukrainian' 
            ? ['і', 'в', 'на', 'з', 'до', 'за', 'по', 'від', 'для', 'про', 'що', 'як', 'але', 'або', 'та', 'це']
            : ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with', 'for', 'as', 'was', 'are'];
        
        const words = text.toLowerCase().split(/\s+/);
        const wordCount = words.length;
        
        if (wordCount === 0) return 0;
        
        const commonWordMatches = words.filter(word => 
            commonWords.some(common => word.includes(common))
        ).length;
        
        return commonWordMatches / wordCount;
    }
}

// File Handler Class
class FileHandler {
    static loadFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file, 'utf-8');
        });
    }

    static saveFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Global instances
let cipher = new CaesarCipher(currentLanguage);
let validator = new KeyValidator(currentLanguage);
let bruteForcer = new BruteForceAttacker(currentLanguage);

// DOM Elements
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const keyInput = document.getElementById('keyInput');
const languageSelect = document.getElementById('languageSelect');
const keyRange = document.getElementById('keyRange');
const keyValidation = document.getElementById('keyValidation');
const charCount = document.getElementById('charCount');
const operationTime = document.getElementById('operationTime');
const fileName = document.getElementById('fileName');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    updateLanguage();
    validateKey();
    
    // Add event listeners
    keyInput.addEventListener('input', validateKey);
    inputText.addEventListener('input', updateCharCount);
    
    updateCharCount();
});

// File operations
function newFile() {
    if (confirm('Очистити поточний текст?')) {
        inputText.value = '';
        outputText.value = '';
        fileName.textContent = '';
        updateCharCount();
    }
}

async function openFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const content = await FileHandler.loadFile(file);
                inputText.value = content;
                fileName.textContent = file.name;
                updateCharCount();
            } catch (error) {
                alert('Помилка завантаження файлу: ' + error.message);
            }
        }
    };
    input.click();
}

function saveFile() {
    const content = outputText.value;
    if (!content) {
        alert('Немає результату для збереження');
        return;
    }
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `caesar_result_${timestamp}.txt`;
    FileHandler.saveFile(content, filename);
}

function printFile() {
    const content = outputText.value || inputText.value;
    if (!content) {
        alert('Немає тексту для друку');
        return;
    }
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
        <html>
        <head>
            <title>Друк - Шифр Цезаря</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                .content { white-space: pre-wrap; margin: 20px 0; }
            </style>
        </head>
        <body>
            <h1>Результат шифрування - Шифр Цезаря</h1>
            <div class="content">${content}</div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

function exitApp() {
    if (confirm('Закрити додаток?')) {
        window.close();
    }
}

// Cryptography operations
function encrypt() {
    performCryptOperation(true);
}

function decrypt() {
    performCryptOperation(false);
}

function performCryptOperation(isEncrypt) {
    const text = inputText.value;
    const key = keyInput.value;
    
    if (!text) {
        alert('Введіть текст для обробки');
        return;
    }
    
    const startTime = Date.now();
    
    try {
        const result = isEncrypt ? cipher.encrypt(text, key) : cipher.decrypt(text, key);
        outputText.value = result;
        
        const endTime = Date.now();
        operationTime.textContent = `Час: ${endTime - startTime}мс`;
        
        updateCharCount();
    } catch (error) {
        alert('Помилка: ' + error.message);
    }
}

// Language operations
function changeLanguage() {
    currentLanguage = languageSelect.value;
    updateLanguage();
}

function toggleLanguage() {
    currentLanguage = currentLanguage === 'ukrainian' ? 'english' : 'ukrainian';
    languageSelect.value = currentLanguage;
    updateLanguage();
}

function updateLanguage() {
    cipher = new CaesarCipher(currentLanguage);
    validator = new KeyValidator(currentLanguage);
    bruteForcer = new BruteForceAttacker(currentLanguage);
    
    const range = validator.getRange();
    keyRange.textContent = `Діапазон: ${range}`;
    keyInput.max = validator.maxKey;
    
    validateKey();
}

// Key operations
function validateKey() {
    const key = keyInput.value;
    const validation = validator.validate(key);
    
    keyValidation.textContent = validation.message;
    keyValidation.className = `validation-message ${validation.valid ? 'success' : 'error'}`;
}

function generateRandomKey() {
    const maxKey = validator.maxKey;
    const randomKey = Math.floor(Math.random() * maxKey) + 1;
    keyInput.value = randomKey;
    validateKey();
}

function setKey(key) {
    keyInput.value = key;
    validateKey();
}

// Utility functions
function loadSample() {
    inputText.value = appData[currentLanguage].sample;
    updateCharCount();
}

function loadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (file) {
        FileHandler.loadFile(file).then(content => {
            inputText.value = content;
            fileName.textContent = file.name;
            updateCharCount();
        }).catch(error => {
            alert('Помилка завантаження файлу: ' + error.message);
        });
    }
}

function copyResult() {
    if (!outputText.value) {
        alert('Немає результату для копіювання');
        return;
    }
    
    outputText.select();
    document.execCommand('copy');
    alert('Результат скопійовано в буфер обміну');
}

function clearResult() {
    outputText.value = '';
    updateCharCount();
}

function updateCharCount() {
    const text = outputText.value || inputText.value;
    charCount.textContent = `Символів: ${text.length}`;
}

// Brute Force Modal
function showBruteForce() {
    const text = inputText.value;
    if (!text) {
        alert('Введіть зашифрований текст для атаки');
        return;
    }
    
    document.getElementById('bruteForceModal').classList.remove('hidden');
    document.getElementById('bruteForceResults').innerHTML = '';
    document.getElementById('progressFill').style.width = '0%';
}

function closeBruteForce() {
    document.getElementById('bruteForceModal').classList.add('hidden');
}

function startBruteForce() {
    const text = inputText.value;
    const resultsContainer = document.getElementById('bruteForceResults');
    const progressFill = document.getElementById('progressFill');
    
    resultsContainer.innerHTML = '<p>Виконується атака...</p>';
    
    bruteForcer.attack(text, (currentKey, totalKeys, result) => {
        const progress = (currentKey / totalKeys) * 100;
        progressFill.style.width = progress + '%';
        
        if (currentKey === 1) {
            resultsContainer.innerHTML = '';
        }
        
        const resultDiv = document.createElement('div');
        resultDiv.className = `brute-force-result ${result.likely ? 'likely' : ''}`;
        resultDiv.innerHTML = `
            <span class="brute-force-key">Ключ ${result.key}:</span>
            <span class="brute-force-text">${result.text.substring(0, 100)}${result.text.length > 100 ? '...' : ''}</span>
            <button class="brute-force-select" onclick="selectBruteForceResult(${result.key}, '${result.text.replace(/'/g, "\\'")}')">Вибрати</button>
        `;
        
        resultsContainer.appendChild(resultDiv);
    });
}

function selectBruteForceResult(key, text) {
    keyInput.value = key;
    outputText.value = text;
    validateKey();
    updateCharCount();
    closeBruteForce();
}

// Settings Modal
function showSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');
    document.getElementById('caseHandling').value = settings.caseHandling;
    document.getElementById('nonAlphaHandling').value = settings.nonAlphaHandling;
}

function closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
}

function saveSettings() {
    settings.caseHandling = document.getElementById('caseHandling').value;
    settings.nonAlphaHandling = document.getElementById('nonAlphaHandling').value;
    closeSettings();
    alert('Налаштування збережено');
}

// Help Modal
function showHelp() {
    document.getElementById('helpModal').classList.remove('hidden');
}

function closeHelp() {
    document.getElementById('helpModal').classList.add('hidden');
}

// About Modal
function showAbout() {
    document.getElementById('aboutModal').classList.remove('hidden');
}

function closeAbout() {
    document.getElementById('aboutModal').classList.add('hidden');
}

// Close modals on outside click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey) {
        switch(e.key) {
            case 'e':
                e.preventDefault();
                encrypt();
                break;
            case 'd':
                e.preventDefault();
                decrypt();
                break;
            case 's':
                e.preventDefault();
                saveFile();
                break;
            case 'o':
                e.preventDefault();
                openFile();
                break;
            case 'n':
                e.preventDefault();
                newFile();
                break;
        }
    }
});