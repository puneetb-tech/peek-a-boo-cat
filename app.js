const cat = document.querySelector('#cat');
const catVisual = document.querySelector('.cat-visual');
const playButton = document.querySelector('#playButton');
const startScreen = document.querySelector('#startScreen');
const soundToggle = document.querySelector('#soundToggle');
const stars = document.querySelector('#stars');
const bubble = document.querySelector('#speechBubble');
const hint = document.querySelector('#gentleHint');
const playfield = document.querySelector('#playfield');
const celebration = document.querySelector('#celebration');
const catMeow = document.querySelector('#catMeow');

const places = ['left', 'right', 'top', 'bottom'];
const catPoses = {
  side: 'assets/peek-cat-side-tight.png',
  top: 'assets/peek-cat-top-tight.png',
  bottom: 'assets/peek-cat-bottom-tight.png'
};
const helloWords = ['Peek-a-boo!', 'Hello, hello!', 'Here I am!', 'Meow! Peek-a-boo!'];
const foundWords = ['Yay!', 'You found me!', 'Meow-velous!', 'That was fun!', 'Hooray, friend!'];
const missedWords = ['Where am I?', 'Hee hee!', 'Try again!', 'I will peek somewhere else!'];
let isPlaying = false;
let isVisible = false;
let soundOn = true;
let starCount = 0;
let turnTimer;
let nextTimer;
let voiceTimer;
let previousPlace = '';
let voice;

function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

function chooseVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  const englishVoices = voices.filter(v => /^en/i.test(v.lang));
  voice = englishVoices.find(v => /child|kid|junior|young/i.test(v.name))
    || englishVoices.find(v => /ava|samantha|zira|aria|jenny|serena|female/i.test(v.name))
    || englishVoices[0];
}
if ('speechSynthesis' in window) { chooseVoice(); speechSynthesis.onvoiceschanged = chooseVoice; }

function speak(text) {
  if (!soundOn || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  // A bright, slightly faster delivery reads as a child's voice even when
  // the device does not provide a dedicated child voice.
  utterance.rate = 0.94;
  utterance.pitch = 1.58;
  utterance.volume = 0.7;
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}

function withGiggle(text) {
  return Math.random() < 0.32 ? `${text} Hee hee!` : text;
}

function unlockMeow() {
  if (!catMeow) return;
  catMeow.volume = 0;
  const attempt = catMeow.play();
  if (attempt) {
    attempt.then(() => {
      catMeow.pause();
      catMeow.currentTime = 0;
      catMeow.volume = .72;
    }).catch(() => { catMeow.volume = .72; });
  }
}

function playMeow() {
  if (!soundOn || !catMeow) return;
  catMeow.pause();
  catMeow.currentTime = 0;
  catMeow.volume = .72;
  const attempt = catMeow.play();
  if (attempt) attempt.catch(() => {});
}

function softChime(kind = 'hello') {
  if (!soundOn || !window.AudioContext && !window.webkitAudioContext) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  const notes = kind === 'yay' ? [523, 659, 784] : kind === 'miss' ? [440, 523] : [523, 659];
  notes.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + index * .11);
    gain.gain.exponentialRampToValueAtTime(.075, ctx.currentTime + index * .11 + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + index * .11 + .24);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(ctx.currentTime + index * .11); oscillator.stop(ctx.currentTime + index * .11 + .26);
  });
  setTimeout(() => ctx.close(), 800);
}

function showBubble(text) {
  bubble.textContent = text;
  const rect = cat.getBoundingClientRect();
  const field = playfield.getBoundingClientRect();
  let x = Math.max(82, Math.min(field.width - 82, rect.left - field.left + rect.width / 2));
  let y = Math.max(14, rect.top - field.top - 58);

  if (previousPlace === 'top') {
    x = field.width / 2;
    y = Math.min(field.height - 70, rect.bottom - field.top + 12);
  } else if (previousPlace === 'bottom') {
    x = field.width / 2;
    y = Math.max(14, rect.top - field.top - 60);
  }
  bubble.style.left = `${x}px`;
  bubble.style.top = `${y}px`;
  bubble.classList.add('show');
}
function hideBubble() { bubble.classList.remove('show'); }

function choosePlace() {
  const options = places.filter(place => place !== previousPlace);
  previousPlace = pick(options);
  return previousPlace;
}

function hideCat() {
  isVisible = false;
  clearTimeout(turnTimer);
  clearTimeout(voiceTimer);
  cat.classList.remove('show', 'happy');
  hideBubble();
}

function schedulePeek(delay = 900) {
  clearTimeout(nextTimer);
  nextTimer = setTimeout(showCat, delay);
}

function showCat() {
  if (!isPlaying) return;
  const place = choosePlace();
  const pose = place === 'top' ? 'top' : place === 'bottom' ? 'bottom' : 'side';
  catVisual.src = catPoses[pose];
  catVisual.alt = place === 'top'
    ? 'A happy kitten hanging upside down from above'
    : place === 'bottom'
      ? 'A happy kitten popping up from below'
      : `A happy kitten peeking from the ${place}`;
  cat.setAttribute('aria-label', `Tap the kitten ${place === 'top' ? 'hanging from above' : place === 'bottom' ? 'popping up from below' : `peeking from the ${place}`}!`);
  cat.className = `cat ${place} show`;
  isVisible = true;
  const word = withGiggle(pick(helloWords));
  hint.textContent = 'Tap the kitty!';
  requestAnimationFrame(() => {
    showBubble(word);
    playMeow();
    voiceTimer = setTimeout(() => speak(word), 850);
  });
  // Keep the cat visible long enough for the slow side peek to play out.
  turnTimer = setTimeout(missedTurn, 4300);
}

function missedTurn() {
  if (!isVisible) return;
  isVisible = false;
  clearTimeout(voiceTimer);
  const word = withGiggle(pick(missedWords));
  showBubble(word); speak(word); softChime('miss');
  hint.textContent = 'The kitty will peek again…';
  setTimeout(() => { hideCat(); schedulePeek(850); }, 950);
}

function makeCelebration() {
  const rect = cat.getBoundingClientRect();
  const field = playfield.getBoundingClientRect();
  const x = rect.left - field.left + rect.width / 2;
  const y = rect.top - field.top + rect.height / 2;
  ['★','♥','✦','🌟','♡','✨','★'].forEach((icon, index) => {
    const bit = document.createElement('span');
    const angle = (Math.PI * 2 * index) / 7 - Math.PI / 2;
    const distance = 65 + Math.random() * 75;
    bit.textContent = icon;
    bit.style.left = `${x}px`; bit.style.top = `${y}px`;
    bit.style.setProperty('--burst-x', `${Math.cos(angle) * distance}px`);
    bit.style.setProperty('--burst-y', `${Math.sin(angle) * distance}px`);
    celebration.append(bit);
    setTimeout(() => bit.remove(), 1300);
  });
}

function foundCat() {
  if (!isPlaying || !isVisible) return;
  isVisible = false;
  clearTimeout(turnTimer);
  clearTimeout(voiceTimer);
  const word = withGiggle(pick(foundWords));
  cat.classList.add('happy');
  showBubble(word);
  speak(word); softChime('yay'); makeCelebration();
  starCount += 1; stars.textContent = starCount;
  hint.textContent = 'Amazing finding!';
  setTimeout(() => { hideCat(); hint.textContent = 'The kitty is coming soon…'; schedulePeek(800); }, 1250);
}

playButton.addEventListener('click', () => {
  isPlaying = true;
  unlockMeow();
  startScreen.classList.add('hidden');
  hint.textContent = 'The kitty is coming soon…';
  softChime('hello');
  schedulePeek(700);
});
cat.addEventListener('pointerdown', event => { event.preventDefault(); foundCat(); });
soundToggle.addEventListener('click', () => {
  soundOn = !soundOn;
  soundToggle.classList.toggle('muted', !soundOn);
  soundToggle.setAttribute('aria-pressed', String(!soundOn));
  soundToggle.setAttribute('aria-label', soundOn ? 'Turn sounds off' : 'Turn sounds on');
  soundToggle.querySelector('span').textContent = soundOn ? '🔊' : '🔇';
  if (!soundOn) {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (catMeow) { catMeow.pause(); catMeow.currentTime = 0; }
  }
  if (soundOn) { unlockMeow(); softChime('hello'); }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { clearTimeout(turnTimer); clearTimeout(nextTimer); clearTimeout(voiceTimer); if (catMeow) catMeow.pause(); if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  else if (isPlaying && !isVisible) schedulePeek(700);
});
