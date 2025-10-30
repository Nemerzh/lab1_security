// =========================
// Application data
// =========================
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

// =========================
// Global state
// =========================
let currentLanguage = 'ukrainian';
let currentCipher = 'caesar'; // 'caesar' | 'trithemius'
let settings = {
    caseHandling: 'preserve', // 'preserve' | 'upper' | 'lower'
    nonAlphaHandling: 'preserve' // 'preserve' | 'remove' | 'space'
};

// =========================
/* DOM refs – ініціалізуються після DOMContentLoaded */
// =========================
let inputText, outputText, keyInput, languageSelect, keyRange, keyValidation;
let charCount, operationTime, fileName;

// =========================
// Base validators/utilities
// =========================
class KeyValidator {
    constructor(language) {
        this.language = language;
        this.maxKey = appData[language].alphabet.length - 1;
    }

    validate(key) {
        if (key === null || key === undefined || key === '') {
            return {valid: false, message: 'Ключ не може бути порожнім'};
        }
        const numKey = parseInt(key);
        if (isNaN(numKey)) {
            return {valid: false, message: 'Ключ повинен бути числом'};
        }
        if (numKey < 1) {
            return {valid: false, message: 'Ключ повинен бути більше 0'};
        }
        if (numKey > this.maxKey) {
            return {valid: false, message: `Ключ не може бути більше ${this.maxKey}`};
        }
        return {valid: true, message: 'Ключ коректний'};
    }

    getRange() {
        return `1-${this.maxKey}`;
    }
}

// =========================
// Caesar cipher
// =========================
class CaesarCipher {
    constructor(language) {
        this.language = language;
        this.data = appData[language];
        this.validator = new KeyValidator(language);
    }

    encrypt(text, key) {
        const validation = this.validator.validate(key);
        if (!validation.valid) throw new Error(validation.message);
        const numKey = parseInt(key);
        return this.processText(text, numKey, true);
    }

    decrypt(text, key) {
        const validation = this.validator.validate(key);
        if (!validation.valid) throw new Error(validation.message);
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
                const shift = isEncrypt ? key : alphabetSize - key;
                const newIndex = (upperIndex + shift) % alphabetSize;
                const newUpper = this.data.alphabet[newIndex];
                const newLower = this.data.lowercase[newIndex];
                if (settings.caseHandling === 'preserve' && char === char.toLowerCase()) {
                    result += newLower;
                } else if (settings.caseHandling === 'lower') {
                    result += newLower;
                } else {
                    result += newUpper;
                }
            } else if (lowerIndex !== -1) {
                const shift = isEncrypt ? key : alphabetSize - key;
                const newIndex = (lowerIndex + shift) % alphabetSize;
                const newUpper = this.data.alphabet[newIndex];
                const newLower = this.data.lowercase[newIndex];
                if (settings.caseHandling === 'upper') {
                    result += newUpper;
                } else {
                    result += newLower;
                }
            } else {
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

// =========================
// Brute force for Caesar
// =========================
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
                results.push({key, text: decrypted, score, likely: score > 0.6});
                if (callback) callback(key, this.alphabetSize - 1, results[results.length - 1]);
            } catch (e) { /* ignore */
            }
        }
        return results.sort((a, b) => b.score - a.score);
    }

    scoreText(text) {
        const commonWords = this.language === 'ukrainian'
            ? ['і', 'в', 'на', 'з', 'до', 'за', 'по', 'від', 'для', 'про', 'що', 'як', 'але', 'або', 'та', 'це']
            : ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with', 'for', 'as', 'was', 'are'];
        const words = text.toLowerCase().split(/\s+/);
        const wordCount = words.filter(Boolean).length;
        if (!wordCount) return 0;
        const commonWordMatches = words.filter(w => commonWords.some(c => w.includes(c))).length;
        return commonWordMatches / wordCount;
    }
}

// =========================
// File handler
// =========================
class FileHandler {
    static loadFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsText(file, 'utf-8');
        });
    }

    static saveFile(content, filename) {
        const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
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

// =========================
// Trithemius: key/cipher/validator
// =========================
class TrithemiusKey {
    // mode: 'linear' | 'quadratic' | 'motto'; params: {A,B,pBase} | {A,B,C,pBase} | {motto,pBase}
    constructor(mode, params) {
        this.mode = mode;
        this.params = params || {};
    }

    kAt(pIndex, n, alphabet) {
        const p = pIndex + ((this.params.pBase | 0) === 1 ? 1 : 0);
        if (this.mode === 'linear') {
            const A = Number(this.params.A) || 0;
            const B = Number(this.params.B) || 0;
            return ((A * p + B) % n + n) % n;
        }
        if (this.mode === 'quadratic') {
            const A = Number(this.params.A) || 0;
            const B = Number(this.params.B) || 0;
            const C = Number(this.params.C) || 0;
            return ((A * p * p + B * p + C) % n + n) % n;
        }
        if (this.mode === 'motto') {
            const motto = this.params.motto || '';
            if (!motto.length) return 0;
            const ch = motto[pIndex % motto.length];
            let idx = alphabet.indexOf(ch);
            if (idx < 0 && alphabet.toLowerCase) idx = alphabet.toLowerCase().indexOf(ch);
            return ((idx >= 0 ? idx : 0) % n + n) % n;
        }
        return 0;
    }
}

class TrithemiusKeyValidator {
    static validate(mode, params, alphabet) {
        if (mode === 'linear') {
            if (!Number.isFinite(+params.A) || !Number.isFinite(+params.B)) {
                return {valid: false, message: 'A і B мають бути числами'};
            }
            return {valid: true};
        }
        if (mode === 'quadratic') {
            if (!Number.isFinite(+params.A) || !Number.isFinite(+params.B) || !Number.isFinite(+params.C)) {
                return {valid: false, message: 'A, B, C мають бути числами'};
            }
            return {valid: true};
        }
        if (mode === 'motto') {
            const motto = params.motto || '';
            if (!motto.length) return {valid: false, message: 'Гасло не може бути порожнім'};
            for (const ch of motto) {
                if (!alphabet.includes(ch) && !(alphabet.toLowerCase && alphabet.toLowerCase().includes(ch))) {
                    return {valid: false, message: `Символ "${ch}" відсутній у вибраному алфавіті`};
                }
            }
            return {valid: true};
        }
        return {valid: false, message: 'Невідомий режим ключа'};
    }
}

class TrithemiusCipher {
    constructor(alphabet) {
        this.alphabet = alphabet;
        this.lower = alphabet.toLowerCase ? alphabet.toLowerCase() : alphabet;
        this.n = alphabet.length;
    }

    indexOfChar(ch) {
        const isLetter = ch.toLowerCase() !== ch.toUpperCase();
        const isUpper = isLetter && ch === ch.toUpperCase();
        const base = isUpper ? this.alphabet : this.lower;
        return {idx: base.indexOf(ch), isUpper};
    }

    mapIdx(idx, isUpper) {
        const base = isUpper ? this.alphabet : this.lower;
        return base[idx];
    }

    transform(text, key, mode = 'enc') {
        let p = 0;
        const out = [];
        for (const ch of text) {
            const {idx, isUpper} = this.indexOfChar(ch);
            if (idx === -1) {
                switch (settings.nonAlphaHandling) {
                    case 'preserve':
                        out.push(ch);
                        break;
                    case 'remove':
                        break;
                    case 'space':
                        out.push(' ');
                        break;
                }
                continue;
            }
            const k = key.kAt(p, this.n, this.alphabet);
            const y = mode === 'enc' ? (idx + k) % this.n
                : ((idx - (k % this.n)) % this.n + this.n) % this.n;
            let mapped = this.mapIdx(y, isUpper);
            if (settings.caseHandling === 'upper') mapped = this.alphabet[y];
            if (settings.caseHandling === 'lower') mapped = this.lower[y];
            out.push(mapped);
            p++;
        }
        return out.join('');
    }

    encrypt(text, key) {
        return this.transform(text, key, 'enc');
    }

    decrypt(text, key) {
        return this.transform(text, key, 'dec');
    }
}


// =========================
// Book Cipher (Poem Cipher)
// =========================
class BookCipherKey {
    // grid: 2D масив — матриця з віршем (10x10, наприклад)
    // formato: [[char, char, ...], [char, char, ...], ...]
    constructor(gridText, gridSize = 10) {
        this.gridSize = gridSize;
        this.grid = this.buildGrid(gridText, gridSize);
        this.coordinateMap = this.buildCoordinateMap();
    }

    buildGrid(text, size) {
        // Видаляємо пробіли, розділові знаки
        const cleanText = text
            .replace(/[^а-яіїєґА-ЯІЇЄҐA-Za-z]/g, '')
            .toUpperCase();

        const grid = [];
        let idx = 0;
        for (let row = 0; row < size; row++) {
            grid[row] = [];
            for (let col = 0; col < size; col++) {
                grid[row][col] = cleanText[idx] || '_';
                idx++;
            }
        }
        return grid;
    }

    buildCoordinateMap() {
        const map = {};
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const char = this.grid[row][col];
                if (char !== '_') {
                    if (!map[char]) map[char] = [];
                    map[char].push(`${row + 1}/${col + 1}`);
                }
            }
        }
        return map;
    }

    getCoordinate(char) {
        const upper = char.toUpperCase();
        if (!this.coordinateMap[upper]) return null;
        // Повертаємо першу знайдену координату
        return this.coordinateMap[upper][0];
    }

    charAtCoordinate(row, col) {
        if (row < 1 || row > this.gridSize || col < 1 || col > this.gridSize) {
            return null;
        }
        return this.grid[row - 1][col - 1];
    }
}

class BookCipher {
    constructor(language = 'ukrainian') {
        this.language = language;
    }

    setKey(bookCipherKey) {
        this.key = bookCipherKey;
    }

    encrypt(text, key) {
        if (!key) throw new Error('Ключ не встановлений');

        const coords = [];
        for (const char of text) {
            const coord = key.getCoordinate(char);
            if (coord) {
                coords.push(coord);
            } else if (char.match(/[а-яіїєґА-ЯІЇЄҐA-Za-z]/)) {
                coords.push('--/--'); // Символ не знайдено
            } else {
                switch (settings.nonAlphaHandling) {
                    case 'preserve':
                        coords.push(`[${char}]`);
                        break;
                    case 'remove':
                        break;
                    case 'space':
                        coords.push('[_]');
                        break;
                }
            }
        }
        return coords.join(', ');
    }

    decrypt(coordString, key) {
        if (!key) throw new Error('Ключ не встановлений');

        const codes = coordString.split(/[,;]\s*/);
        let result = '';
        for (const code of codes) {
            if (code.startsWith('[') && code.endsWith(']')) {
                // Спеціальний символ
                result += code.slice(1, -1);
                continue;
            }
            const [rowStr, colStr] = code.split('/');
            const row = parseInt(rowStr);
            const col = parseInt(colStr);
            const char = key.charAtCoordinate(row, col);
            if (char && char !== '_') {
                result += char;
            } else {
                result += '?';
            }
        }
        return result;
    }
}

// =========================
// Global instances (Caesar)
// =========================
let cipher = new CaesarCipher(currentLanguage);
let validator = new KeyValidator(currentLanguage);
let bruteForcer = new BruteForceAttacker(currentLanguage);

// =========================
// DOM and init
// =========================
document.addEventListener('DOMContentLoaded', function () {
    // Bind DOM
    inputText = document.getElementById('inputText');
    outputText = document.getElementById('outputText');
    keyInput = document.getElementById('keyInput');
    languageSelect = document.getElementById('languageSelect');
    keyRange = document.getElementById('keyRange');
    keyValidation = document.getElementById('keyValidation');
    charCount = document.getElementById('charCount');
    operationTime = document.getElementById('operationTime');
    fileName = document.getElementById('fileName');

    // Event listeners
    if (keyInput) keyInput.addEventListener('input', validateKey);
    if (inputText) inputText.addEventListener('input', updateCharCount);

    // Cipher selector glue (if present)
    const cipherSel = document.getElementById('cipherSelect');
    if (cipherSel) {
        cipherSel.addEventListener('change', onCipherChange);
    }
    const triModeSel = document.getElementById('trithemiusMode');
    if (triModeSel) {
        triModeSel.addEventListener('change', onTrithemiusModeChange);
    }

    // Init UI
    updateLanguage();
    validateKey();
    updateCharCount();

    // Show correct panels on load
    onCipherChange();
    onTrithemiusModeChange();
});

// =========================
// Language ops
// =========================
function changeLanguage() {
    currentLanguage = languageSelect.value;
    updateLanguage();
}

function toggleLanguage() {
    currentLanguage = currentLanguage === 'ukrainian' ? 'english' : 'ukrainian';
    languageSelect.value = currentLanguage;
    updateLanguage();
}

function updateAlphabetInfo() {
    const info = document.getElementById('alphabetInfo');
    if (info) {
        const n = appData[currentLanguage].alphabet.length;
        const langName = currentLanguage === 'ukrainian' ? 'Українська' : 'Англійська';
        info.textContent = `Алфавіт: ${langName}, n=${n}`;
    }
}

function updateLanguage() {
    cipher = new CaesarCipher(currentLanguage);
    validator = new KeyValidator(currentLanguage);
    bruteForcer = new BruteForceAttacker(currentLanguage);
    const range = validator.getRange();
    if (keyRange) keyRange.textContent = `Діапазон: ${range}`;
    if (keyInput) keyInput.max = validator.maxKey;
    updateAlphabetInfo();
    validateKey();
}

// =========================
/* Cipher selection panels */

// =========================
function setCipher(name) {
    const sel = document.getElementById('cipherSelect');
    if (sel) {
        sel.value = name;
        onCipherChange();
    }
}

function onCipherChange() {
    const sel = document.getElementById('cipherSelect');
    if (!sel) {
        console.warn('cipherSelect not found');
        return;
    }

    currentCipher = sel.value;

    const caesar = document.getElementById('caesarParams');
    const tri = document.getElementById('trithemiusParams');
    const book = document.getElementById('bookCipherParams');  // ДОДАЙ ЦЕ

    if (caesar && tri && book) {
        const triActive = currentCipher === 'trithemius';
        const bookActive = currentCipher === 'bookcipher';

        caesar.classList.toggle('hidden', triActive || bookActive);
        tri.classList.toggle('hidden', !triActive);
        book.classList.toggle('hidden', !bookActive);  // ДОДАЙ ЦЕ
    }

    onTrithemiusModeChange();
}


function onTrithemiusModeChange() {
    const mode = document.getElementById('trithemiusMode')?.value || 'linear';
    const lin = document.getElementById('triLinear');
    const quad = document.getElementById('triQuadratic');
    const mot = document.getElementById('triMotto');
    if (lin) lin.classList.toggle('hidden', mode !== 'linear');
    if (quad) quad.classList.toggle('hidden', mode !== 'quadratic');
    if (mot) mot.classList.toggle('hidden', mode !== 'motto');
}

// =========================
// Crypto operations
// =========================
function encrypt() {
    performCryptOperation(true);
}

function decrypt() {
    performCryptOperation(false);
}

let bookCipherKey = null;

function generateBookCipherKey() {
    const keyText = document.getElementById('bookCipherKeyText').value;
    if (!keyText || keyText.trim().length < 100) {
        alert('Вірш повинен мати мін. 100 символів');
        return;
    }

    try {
        bookCipherKey = new BookCipherKey(keyText, 10);
        showBookCipherGrid();
        const validDiv = document.getElementById('bookCipherValidation');
        if (validDiv) {
            validDiv.textContent = '✓ Ключ створено успішно';
            validDiv.className = 'validation-message success';
        }
    } catch (error) {
        alert('Помилка при створенні ключа: ' + error.message);
    }
}

function showBookCipherGrid() {
    if (!bookCipherKey) return;

    const preview = document.getElementById('bookCipherGridPreview');
    let html = '<table class="book-cipher-table">';

    // Заголовок стовпців
    html += '<tr><th>\\</th>';
    for (let c = 1; c <= 10; c++) html += `<th>${c}</th>`;
    html += '</tr>';

    // Рядки
    for (let r = 0; r < 10; r++) {
        html += `<tr><th>${r + 1}</th>`;
        for (let c = 0; c < 10; c++) {
            html += `<td>${bookCipherKey.grid[r][c]}</td>`;
        }
        html += '</tr>';
    }
    html += '</table>';

    preview.innerHTML = html;
}

function performCryptOperation(isEncrypt) {
    const text = inputText.value;
    if (!text) {
        alert('Введіть текст для обробки');
        return;
    }
    const startTime = Date.now();
    let result = '';

    const sel = document.getElementById('cipherSelect');
    if (sel && sel.value !== currentCipher) {
        currentCipher = sel.value; // синхронізація на випадок розсинхрону
    }

    if (currentCipher === 'caesar') {
        const key = keyInput.value;
        try {
            result = isEncrypt ? cipher.encrypt(text, key) : cipher.decrypt(text, key);
        } catch (error) {
            alert('Помилка: ' + error.message);
            return;
        }
    } else if (currentCipher === 'trithemius') {
        // Trithemius
        const alphabet = appData[currentLanguage].alphabet;
        const triCipher = new TrithemiusCipher(alphabet);
        const mode = document.getElementById('trithemiusMode').value;
        const params = (mode === 'linear')
            ? {
                A: +document.getElementById('triA').value,
                B: +document.getElementById('triB').value,
                pBase: +document.getElementById('triPBase').value
            }
            : (mode === 'quadratic')
                ? {
                    A: +document.getElementById('triQA').value,
                    B: +document.getElementById('triQB').value,
                    C: +document.getElementById('triQC').value,
                    pBase: +document.getElementById('triQPBase').value
                }
                : {
                    motto: document.getElementById('triMottoText').value,
                    pBase: +document.getElementById('triMPBase').value
                };

        const v = TrithemiusKeyValidator.validate(mode, params, alphabet);
        const errId = mode === 'linear' ? 'triLinearValidation' : mode === 'quadratic' ? 'triQuadraticValidation' : 'triMottoValidation';
        const vEl = document.getElementById(errId);
        if (!v.valid) {
            if (vEl) {
                vEl.textContent = v.message;
                vEl.className = 'validation-message error';
            }
            alert(v.message);
            return;
        } else {
            ['triLinearValidation', 'triQuadraticValidation', 'triMottoValidation'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.textContent = '';
                    el.className = 'validation-message';
                }
            });
        }
        const triKey = new TrithemiusKey(mode, params);
        result = isEncrypt ? triCipher.encrypt(text, triKey) : triCipher.decrypt(text, triKey);
    } else if (currentCipher === 'bookcipher') {
        // Book Cipher
        if (!bookCipherKey) {
            alert('Спочатку згенеруйте таблицю-ключ');
            return;
        }

        const bcCipher = new BookCipher(currentLanguage);
        bcCipher.setKey(bookCipherKey);

        try {
            result = isEncrypt
                ? bcCipher.encrypt(text, bookCipherKey)
                : bcCipher.decrypt(text, bookCipherKey);
        } catch (error) {
            alert('Помилка: ' + error.message);
            return;
        }

        outputText.value = result;
        operationTime.textContent = `Час: ${Date.now() - startTime}мс`;
        updateCharCount();
    }
}

// =========================
// Caesar brute-force modal
// =========================
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
    if (currentCipher !== 'caesar') {
        alert('Брутфорс реалізовано для шифру Цезаря');
        return;
    }
    const text = inputText.value;
    const resultsContainer = document.getElementById('bruteForceResults');
    const progressFill = document.getElementById('progressFill');
    resultsContainer.innerHTML = '<p>Виконується атака...</p>';
    bruteForcer.attack(text, (currentKey, totalKeys, result) => {
        const progress = (currentKey / totalKeys) * 100;
        progressFill.style.width = progress + '%';
        if (currentKey === 1) resultsContainer.innerHTML = '';
        const safeText = result.text.replace(/'/g, "\\'");
        const resultDiv = document.createElement('div');
        resultDiv.className = `brute-force-result ${result.likely ? 'likely' : ''}`;
        resultDiv.innerHTML = `
      <span class="brute-force-key">Ключ ${result.key}:</span>
      <span class="brute-force-text">${safeText.substring(0, 100)}${safeText.length > 100 ? '...' : ''}</span>
      <button class="brute-force-select" onclick="selectBruteForceResult(${result.key}, '${safeText}')">Вибрати</button>
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

// =========================
// File ops
// =========================
function newFile() {
    if (confirm('Очистити поточний текст?')) {
        inputText.value = '';
        outputText.value = '';
        if (fileName) fileName.textContent = '';
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
                if (fileName) fileName.textContent = file.name;
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
    const algo = currentCipher === 'caesar' ? 'caesar' : 'trithemius';
    const filename = `${algo}_result_${timestamp}.txt`;
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
      <title>Друк - Криптосистема</title>
      <style>body{font-family:Arial,sans-serif;margin:20px;}h1{color:#333}.content{white-space:pre-wrap;margin:20px 0}</style>
    </head>
    <body>
      <h1>Результат</h1>
      <div class="content">${content.replace(/</g, '&lt;')}</div>
    </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

function exitApp() {
    if (confirm('Закрити додаток?')) window.close();
}

// =========================
// Key ops (Caesar)
// =========================
function validateKey() {
    if (!keyInput) return;
    const key = keyInput.value;
    const validation = new KeyValidator(currentLanguage).validate(key);
    if (keyValidation) {
        keyValidation.textContent = validation.message;
        keyValidation.className = `validation-message ${validation.valid ? 'success' : 'error'}`;
    }
}

function generateRandomKey() {
    const maxKey = new KeyValidator(currentLanguage).maxKey;
    const randomKey = Math.floor(Math.random() * maxKey) + 1;
    keyInput.value = randomKey;
    validateKey();
}

function setKey(key) {
    keyInput.value = key;
    validateKey();
}

// =========================
// Samples / clipboard / stats
// =========================
function loadSample() {
    inputText.value = appData[currentLanguage].sample;
    updateCharCount();
}

function loadFileInput() {
    const fi = document.getElementById('fileInput');
    const file = fi.files[0];
    if (file) {
        FileHandler.loadFile(file).then(content => {
            inputText.value = content;
            if (fileName) fileName.textContent = file.name;
            updateCharCount();
        }).catch(err => alert('Помилка завантаження файлу: ' + err.message));
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
    const text = outputText.value || inputText.value || '';
    if (charCount) charCount.textContent = `Символів: ${text.length}`;
}

// =========================
// Modals & settings
// =========================
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

function showHelp() {
    document.getElementById('helpModal').classList.remove('hidden');
}

function closeHelp() {
    document.getElementById('helpModal').classList.add('hidden');
}

function showAbout() {
    document.getElementById('aboutModal').classList.remove('hidden');
}

function closeAbout() {
    document.getElementById('aboutModal').classList.add('hidden');
}

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
    }
});

// =========================
// Shortcuts
// =========================
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey) {
        switch (e.key) {
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

// =========================
// Expose needed fns to global scope for HTML onclick
// =========================
window.newFile = newFile;
window.openFile = openFile;
window.saveFile = saveFile;
window.printFile = printFile;
window.exitApp = exitApp;
window.encrypt = encrypt;
window.decrypt = decrypt;
window.changeLanguage = changeLanguage;
window.toggleLanguage = toggleLanguage;
window.validateKey = validateKey;
window.generateRandomKey = generateRandomKey;
window.setKey = setKey;
window.loadSample = loadSample;
window.loadFile = loadFileInput;
window.copyResult = copyResult;
window.clearResult = clearResult;
window.showBruteForce = showBruteForce;
window.closeBruteForce = closeBruteForce;
window.startBruteForce = startBruteForce;
window.showSettings = showSettings;
window.closeSettings = closeSettings;
window.saveSettings = saveSettings;
window.showHelp = showHelp;
window.closeHelp = closeHelp;
window.showAbout = showAbout;
window.closeAbout = closeAbout;
window.setCipher = setCipher;
window.onCipherChange = onCipherChange;
window.onTrithemiusModeChange = onTrithemiusModeChange;
