const els = {
  passwordField: document.getElementById('passwordField'),
  lengthSlider: document.getElementById('length'),
  lengthValue: document.getElementById('lengthValue'),
  generateBtn: document.getElementById('generateBtn'),
  regenBtn: document.getElementById('regenBtn'),
  copyBtn: document.getElementById('copyBtn'),
  strengthBar: document.getElementById('strengthBar'),
  strengthLabel: document.getElementById('strengthLabel'),
  crackTime: document.getElementById('crackTime'),
  breakdown: document.getElementById('breakdown'),
  themeToggle: document.getElementById('themeToggle'),
  toggleVisibility: document.getElementById('toggleVisibility'),
  toast: document.getElementById('toast'),
  qrBtn: document.getElementById('qrBtn'),
  qrPanel: document.getElementById('qrPanel'),
  qrCode: document.getElementById('qrCode'),
  closeQr: document.getElementById('closeQr'),
};

const upperEl = document.getElementById('uppercase');
const lowerEl = document.getElementById('lowercase');
const numberEl = document.getElementById('numbers');
const symbolEl = document.getElementById('symbols');

const syllablesSlider = document.getElementById('syllables');
const syllablesValue = document.getElementById('syllablesValue');
const pronNumber = document.getElementById('pronNumber');
const pronSymbol = document.getElementById('pronSymbol');
const pronCapitalize = document.getElementById('pronCapitalize');

const wordCountSlider = document.getElementById('wordCount');
const wordCountValue = document.getElementById('wordCountValue');
const separatorEl = document.getElementById('separator');
const phraseCapitalize = document.getElementById('phraseCapitalize');
const phraseNumber = document.getElementById('phraseNumber');

const tabs = document.querySelectorAll('.tab-btn');
const panels = {
  random: document.getElementById('randomSettings'),
  pronounceable: document.getElementById('pronounceableSettings'),
  passphrase: document.getElementById('passphraseSettings'),
};

let currentMode = 'random';

const SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}',
};

const WORDS = ['apple','breeze','coral','delta','ember','forest','glow','harbor','ivory','jungle',
  'kite','lemon','maple','nova','opal','pebble','quartz','river','summit','tiger',
  'umbra','velvet','willow','xenon','yonder','zephyr','amber','birch','cedar','dusk',
  'echo','frost','grove','haze','indigo','jade','karma','lunar','marsh','noon',
  'orbit','pine','quiet','rustic','solar','tundra','urban','violet','wave','yield'];

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  els.themeToggle.textContent = theme === 'light' ? '☀️' : '🌙';
  localStorage.setItem('pg-theme', theme);
}
applyTheme(localStorage.getItem('pg-theme') ||
  (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
els.themeToggle.addEventListener('click', () => {
  applyTheme(document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
});

function switchMode(mode) {
  currentMode = mode;
  tabs.forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  Object.entries(panels).forEach(([key, panel]) => panel.classList.toggle('hidden', key !== mode));
}
tabs.forEach(tab => tab.addEventListener('click', () => switchMode(tab.dataset.mode)));

els.lengthSlider.addEventListener('input', () => els.lengthValue.textContent = els.lengthSlider.value);
syllablesSlider.addEventListener('input', () => syllablesValue.textContent = syllablesSlider.value);
wordCountSlider.addEventListener('input', () => wordCountValue.textContent = wordCountSlider.value);

els.toggleVisibility.addEventListener('click', () => {
  const isHidden = els.passwordField.type === 'password';
  els.passwordField.type = isHidden ? 'text' : 'password';
  els.toggleVisibility.textContent = isHidden ? '🙈' : '👁️';
});

function secureRandomInt(max) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

function generateRandom() {
  const length = Number(els.lengthSlider.value);
  let pools = [];
  if (upperEl.checked) pools.push(SETS.upper);
  if (lowerEl.checked) pools.push(SETS.lower);
  if (numberEl.checked) pools.push(SETS.numbers);
  if (symbolEl.checked) pools.push(SETS.symbols);
  if (!pools.length) return null;

  const fullPool = pools.join('');
  let passwordChars = pools.map(p => p[secureRandomInt(p.length)]);
  while (passwordChars.length < length) {
    passwordChars.push(fullPool[secureRandomInt(fullPool.length)]);
  }
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }
  return passwordChars.slice(0, length).join('');
}

function generatePronounceable() {
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  const vowels = 'aeiou';
  const syllables = Number(syllablesSlider.value);
  let word = '';
  for (let i = 0; i < syllables; i++) {
    word += consonants[secureRandomInt(consonants.length)];
    word += vowels[secureRandomInt(vowels.length)];
  }
  if (pronCapitalize.checked) word = word.charAt(0).toUpperCase() + word.slice(1);
  if (pronNumber.checked) word += String(secureRandomInt(90) + 10);
  if (pronSymbol.checked) word += SETS.symbols[secureRandomInt(SETS.symbols.length)];
  return word;
}

function generatePassphrase() {
  const count = Number(wordCountSlider.value);
  const sep = separatorEl.value;
  const words = [];
  for (let i = 0; i < count; i++) {
    let w = WORDS[secureRandomInt(WORDS.length)];
    if (phraseCapitalize.checked) w = w.charAt(0).toUpperCase() + w.slice(1);
    words.push(w);
  }
  let phrase = words.join(sep);
  if (phraseNumber.checked) phrase += sep + String(secureRandomInt(90) + 10);
  return phrase;
}

function generatePassword() {
  let password = null;
  if (currentMode === 'random') password = generateRandom();
  else if (currentMode === 'pronounceable') password = generatePronounceable();
  else password = generatePassphrase();

  if (!password) {
    els.passwordField.value = '';
    updateStrength('');
    showToast('Select at least one character type');
    return;
  }

  els.passwordField.value = password;
  updateStrength(password);
}

function updateStrength(password) {
  if (!password) {
    els.strengthBar.style.width = '0%';
    els.strengthLabel.textContent = '';
    els.crackTime.textContent = 'Crack time: —';
    els.breakdown.textContent = '';
    return;
  }

  let varietyCount = 0, poolSize = 0;
  if (/[A-Z]/.test(password)) { varietyCount++; poolSize += 26; }
  if (/[a-z]/.test(password)) { varietyCount++; poolSize += 26; }
  if (/[0-9]/.test(password)) { varietyCount++; poolSize += 10; }
  if (/[^A-Za-z0-9]/.test(password)) { varietyCount++; poolSize += 32; }
  poolSize = poolSize || 26;

  const score = (password.length >= 12 ? 2 : password.length >= 8 ? 1 : 0) + varietyCount;
  const percent = Math.min(100, (score / 6) * 100);
  els.strengthBar.style.width = percent + '%';

  if (score <= 2) { els.strengthBar.style.background = 'var(--weak)'; els.strengthLabel.textContent = 'Weak'; }
  else if (score <= 4) { els.strengthBar.style.background = 'var(--medium)'; els.strengthLabel.textContent = 'Medium'; }
  else { els.strengthBar.style.background = 'var(--strong)'; els.strengthLabel.textContent = 'Strong'; }

  const entropy = password.length * Math.log2(poolSize);
  const guesses = Math.pow(2, entropy) / 2;
  const seconds = guesses / 1e10;
  els.crackTime.textContent = 'Crack time: ' + humanizeSeconds(seconds);

  const counts = {
    Upper: (password.match(/[A-Z]/g) || []).length,
    Lower: (password.match(/[a-z]/g) || []).length,
    Num: (password.match(/[0-9]/g) || []).length,
    Sym: (password.match(/[^A-Za-z0-9]/g) || []).length,
  };
  els.breakdown.textContent = Object.entries(counts).filter(([,v]) => v > 0).map(([k,v]) => `${v} ${k}`).join(', ');
}

function humanizeSeconds(s) {
  if (s < 1) return 'instantly';
  const units = [['years', 31536000], ['days', 86400], ['hours', 3600], ['minutes', 60], ['seconds', 1]];
  for (const [name, secs] of units) {
    if (s >= secs) {
      const val = s / secs;
      return val > 1e6 ? 'centuries' : `${val.toFixed(val < 10 ? 1 : 0)} ${name}`;
    }
  }
  return 'instantly';
}

let toastTimer;
function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2000);
}

els.generateBtn.addEventListener('click', generatePassword);
els.regenBtn.addEventListener('click', () => {
  els.regenBtn.style.transform = 'rotate(180deg)';
  setTimeout(() => els.regenBtn.style.transform = 'rotate(0deg)', 300);
  generatePassword();
});
els.copyBtn.addEventListener('click', () => {
  if (!els.passwordField.value) { showToast('Generate a password first'); return; }
  navigator.clipboard.writeText(els.passwordField.value).then(() => showToast('Password copied to clipboard'));
});

els.qrBtn.addEventListener('click', () => {
  if (!els.passwordField.value) { showToast('Generate a password first'); return; }
  els.qrCode.innerHTML = '';
  new QRCode(els.qrCode, { text: els.passwordField.value, width: 160, height: 160 });
  els.qrPanel.classList.remove('hidden');
});
els.closeQr.addEventListener('click', () => els.qrPanel.classList.add('hidden'));

document.addEventListener('keydown', (e) => {
  const tag = document.activeElement.tagName;
  if ((e.code === 'Space' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') ||
      (e.ctrlKey && e.key.toLowerCase() === 'g')) {
    e.preventDefault();
    generatePassword();
  }
});

// No password generated on load — field stays empty until user clicks Generate