const paletteEl = document.getElementById('palette');
const favoritesEl = document.getElementById('favorites');
const gradA = document.getElementById('grad-color-a');
const gradB = document.getElementById('grad-color-b');
const gradPreview = document.getElementById('gradient-preview');
const gradCssOutput = document.getElementById('gradient-css-output');
const numColors = 5;
let colors = [];

function randomColor() {
  const hex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  return '#' + hex;
}

// ---------- COLOR CONVERSIONS ----------
function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// ---------- LOAD FROM SHARE LINK (if present) ----------
function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const shared = params.get('colors');
  if (shared) {
    const hexes = shared.split('-').map(h => '#' + h);
    colors = hexes.map(hex => ({ hex, locked: false }));
    return true;
  }
  return false;
}

function buildPalette() {
  if (colors.length === 0) {
    for (let i = 0; i < numColors; i++) {
      colors.push({ hex: randomColor(), locked: false });
    }
  } else {
    colors = colors.map(c => c.locked ? c : { hex: randomColor(), locked: false });
  }
  renderPalette();
}

function renderPalette() {
  paletteEl.innerHTML = '';

  colors.forEach((colorObj) => {
    const box = document.createElement('div');
    box.className = 'color-box';
    box.style.backgroundColor = colorObj.hex;

    const rgb = hexToRgb(colorObj.hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const code = document.createElement('span');
    code.className = 'hex-code';
    code.textContent = colorObj.hex;

    const rgbEl = document.createElement('span');
    rgbEl.className = 'rgb-code';
    rgbEl.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

    const hslEl = document.createElement('span');
    hslEl.className = 'hsl-code';
    hslEl.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

    box.addEventListener('click', () => {
      navigator.clipboard.writeText(colorObj.hex);
      code.textContent = 'Copied!';
      setTimeout(() => { code.textContent = colorObj.hex; }, 1000);
    });

    const lockBtn = document.createElement('button');
    lockBtn.className = 'lock-btn';
    lockBtn.textContent = colorObj.locked ? 'LOCKED' : 'LOCK';

    lockBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      colorObj.locked = !colorObj.locked;
      renderPalette();
    });

    box.appendChild(lockBtn);
    box.appendChild(hslEl);
    box.appendChild(rgbEl);
    box.appendChild(code);
    paletteEl.appendChild(box);
  });

  updateGradientOptions();
}

if (!loadFromUrl()) {
  buildPalette();
} else {
  renderPalette();
}

document.getElementById('generate-btn').addEventListener('click', buildPalette);

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    buildPalette();
  }
});

// ---------- DOWNLOAD AS PNG ----------
document.getElementById('download-btn').addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  const stripWidth = canvas.width / colors.length;

  colors.forEach((colorObj, i) => {
    ctx.fillStyle = colorObj.hex;
    ctx.fillRect(i * stripWidth, 0, stripWidth, canvas.height);
    ctx.fillStyle = '#000';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(colorObj.hex, i * stripWidth + stripWidth / 2, canvas.height - 20);
  });

  const link = document.createElement('a');
  link.download = 'palette.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// ---------- SAVE FAVORITES ----------
function getFavorites() {
  const stored = localStorage.getItem('favoritePalettes');
  return stored ? JSON.parse(stored) : [];
}

function saveFavorites(favs) {
  localStorage.setItem('favoritePalettes', JSON.stringify(favs));
}

function renderFavorites() {
  favoritesEl.innerHTML = '';
  const favs = getFavorites();

  favs.forEach((palette, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'favorite-wrapper';

    const strip = document.createElement('div');
    strip.className = 'favorite-strip';
    palette.forEach(hex => {
      const swatch = document.createElement('div');
      swatch.style.backgroundColor = hex;
      strip.appendChild(swatch);
    });
    strip.addEventListener('click', () => {
      colors = palette.map(hex => ({ hex, locked: false }));
      renderPalette();
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-fav-btn';
    removeBtn.textContent = 'X';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const updated = getFavorites();
      updated.splice(index, 1);
      saveFavorites(updated);
      renderFavorites();
    });

    wrapper.appendChild(strip);
    wrapper.appendChild(removeBtn);
    favoritesEl.appendChild(wrapper);
  });
}

document.getElementById('save-btn').addEventListener('click', () => {
  const favs = getFavorites();
  favs.push(colors.map(c => c.hex));
  saveFavorites(favs);
  renderFavorites();
});

renderFavorites();

// ---------- THEME TOGGLE ----------
document.getElementById('theme-btn').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

// ---------- SHARE PALETTE ----------
document.getElementById('share-btn').addEventListener('click', () => {
  const hexes = colors.map(c => c.hex.replace('#', '')).join('-');
  const url = `${window.location.origin}${window.location.pathname}?colors=${hexes}`;
  navigator.clipboard.writeText(url);
  alert('Share link copied to clipboard!');
});

// ---------- GRADIENT GENERATOR ----------
function updateGradientOptions() {
  const prevA = gradA.value, prevB = gradB.value;
  gradA.innerHTML = '';
  gradB.innerHTML = '';

  colors.forEach(c => {
    const optA = document.createElement('option');
    optA.value = c.hex; optA.textContent = c.hex;
    gradA.appendChild(optA);

    const optB = document.createElement('option');
    optB.value = c.hex; optB.textContent = c.hex;
    gradB.appendChild(optB);
  });

  gradA.value = colors.some(c => c.hex === prevA) ? prevA : colors[0].hex;
  gradB.value = colors.some(c => c.hex === prevB) ? prevB : colors[1].hex;

  updateGradientPreview();
}

function updateGradientPreview() {
  const css = `linear-gradient(90deg, ${gradA.value}, ${gradB.value})`;
  gradPreview.style.background = css;
  gradCssOutput.textContent = `background: ${css};`;
}

gradA.addEventListener('change', updateGradientPreview);
gradB.addEventListener('change', updateGradientPreview);

document.getElementById('copy-gradient-btn').addEventListener('click', () => {
  const css = `background: linear-gradient(90deg, ${gradA.value}, ${gradB.value});`;
  navigator.clipboard.writeText(css);
  alert('Gradient CSS copied!');
});