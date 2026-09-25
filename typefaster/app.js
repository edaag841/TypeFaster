const wordBanks = {
  english: `quiet forest rhythm orange paper window gentle focus bright lantern cloud river useful moment simple horizon meadow music careful journey silver pocket garden winter velvet signal summer field wonder pencil candle curious marble autumn coffee soft thunder planet morning balance whisper maple friendly button yellow memory honest feather ocean little bottle shadow blossom magnet sunday perfect blanket hidden travel keyboard winter freedom camera tiny olive rocket laughter valley circle native bridge coral library comet subtle picnic steady poetry golden pencil fragile breeze random puzzle future circle velvet`,
  german: `ruhig wald rhythmus orange papier fenster sanft fokus hell laterne wolke fluss nützlich moment einfach horizont wiese musik vorsichtig reise silber tasche garten winter samt signal sommer feld wunder bleistift kerze neugierig marmor herbst kaffee weich donner planet morgen balance flüstern ahorn freundlich knopf gelb erinnerung ehrlich feder ozean schatten blüte magnet sonntag perfekt decke verborgen reise tastatur freiheit kamera klein oliven rakete lachen tal kreis brücke koralle komet subtil picknick stetig poesie golden zerbrechlich zufall rätsel zukunft`,
  turkish: `sessiz orman ritim turuncu kâğıt pencere nazik odak parlak fener bulut nehir faydalı an basit ufuk çayır müzik dikkatli yolculuk gümüş cep bahçe kış kadife sinyal yaz alan merak kalem mum meraklı mermer sonbahar kahve yumuşak gök gürültüsü gezegen sabah denge fısıltı akçaağaç dost canlısı düğme sarı hafıza dürüst tüy okyanus gölge çiçek mıknatıs pazar mükemmel battaniye gizli seyahat klavye özgürlük kamera küçük zeytin roket kahkaha vadi daire köprü mercan kuyruklu yıldız ince piknik sürekli şiir altın kırılgan rastgele bulmaca gelecek`,
  french: `calme forêt rythme orange papier fenêtre doux attention vif lanterne nuage rivière utile moment simple horizon prairie musique prudent voyage argent poche jardin hiver velours signal été champ merveille crayon bougie curieux marbre automne café tendre tonnerre planète matin équilibre murmure érable amical bouton jaune mémoire honnête plume océan ombre fleur aimant dimanche parfait couverture caché voyage clavier liberté caméra minuscule olive fusée rire vallée cercle pont corail comète subtil pique nique stable poésie doré fragile hasard puzzle avenir`,
  spanish: `tranquilo bosque ritmo naranja papel ventana suave enfoque brillante farol nube río útil momento simple horizonte prado música atento viaje plata bolsillo jardín invierno terciopelo señal verano campo maravilla lápiz vela curioso mármol otoño café blando trueno planeta mañana equilibrio susurro arce amable botón amarillo memoria honesto pluma océano sombra flor imán domingo perfecto manta oculto viaje teclado libertad cámara pequeño oliva cohete risa valle círculo puente coral cometa sutil picnic firme poesía dorado frágil azar rompecabezas futuro`,
  italian: `calmo foresta ritmo arancia carta finestra gentile attenzione luminoso lanterna nuvola fiume utile momento semplice orizzonte prato musica attento viaggio argento tasca giardino inverno velluto segnale estate campo meraviglia matita candela curioso marmo autunno caffè morbido tuono pianeta mattino equilibrio sussurro acero amichevole bottone giallo memoria onesto piuma oceano ombra fiore calamita domenica perfetto coperta nascosto viaggio tastiera libertà fotocamera piccolo oliva razzo risata valle cerchio ponte corallo cometa sottile picnic costante poesia dorato fragile caso puzzle futuro`,
  polish: `spokojny las rytm pomarańcza papier okno łagodny skupienie jasny latarnia chmura rzeka użyteczny moment prosty horyzont łąka muzyka ostrożny podróż srebro kieszeń ogród zima aksamit sygnał lato pole cud ołówek świeca ciekawy marmur jesień kawa miękki grzmot planeta poranek równowaga szept klon przyjazny guzik żółty pamięć uczciwy pióro ocean cień kwiat magnes niedziela idealny koc ukryty podróż klawiatura wolność kamera mały oliwka rakieta śmiech dolina koło most koral kometa subtelny piknik stały poezja złoty kruchy przypadek zagadka przyszłość`
};
const els = {
  words: document.querySelector('#words'), input: document.querySelector('#typingInput'), timer: document.querySelector('#timer'),
  wpm: document.querySelector('#wpm'), completedWords: document.querySelector('#completedWords'),
  characters: document.querySelector('#characters'), modeLength: document.querySelector('#modeLength'), stage: document.querySelector('#testStage'),
  card: document.querySelector('#resultCard'), finalWpm: document.querySelector('#finalWpm'), resultCopy: document.querySelector('#resultCopy'), language: document.querySelector('#languageSelect'), typingSound: document.querySelector('#typingSound'), errorSound: document.querySelector('#errorSound'), soundToggle: document.querySelector('#soundToggle')
};
let duration = 30, testWords = [], startedAt = null, interval = null, finished = false, firstLineWordCount = 1, completedCount = 0, acceptedCharacters = 0, soundsMuted = false;
function pickWords() { const wordBank = wordBanks[els.language.value].split(' '); return Array.from({length: 76}, () => wordBank[Math.floor(Math.random() * wordBank.length)]); }
function playSound(sound, volume = 0.35) { if (soundsMuted) return; sound.pause(); sound.currentTime = 0; sound.volume = volume; sound.play().catch(() => {}); }
function renderWords() {
  els.words.innerHTML = testWords
    .map((word, offset) => {
      const index = offset;
      const typedWord = index === completedCount ? [...els.input.value] : [];
      const renderedWord = index === completedCount ? [...word].map((letter, charIndex) => {
        const typedLetter = typedWord[charIndex];
        const state = typedLetter === undefined ? '' : typedLetter === letter ? 'typed-correct' : 'typed-incorrect';
        return `<span class="${state}">${letter}</span>`;
      }).join('') : word;
      return `<span class="word ${index === completedCount ? 'current' : ''}" data-index="${index}">${renderedWord}</span>`;
    }).join(' ');
}
function measureFirstLine() {
  const nodes = [...els.words.querySelectorAll('.word')];
  if (!nodes.length) return;
  const firstTop = nodes[0].offsetTop;
  const nextLineIndex = nodes.findIndex(node => node.offsetTop !== firstTop);
  firstLineWordCount = nextLineIndex === -1 ? nodes.length : Math.max(1, nextLineIndex);
}
function formatTime(sec) { return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }
function stats() {
  const completed = completedCount;
  const current = els.input.value;
  let matchingCurrentChars = 0;
  for (let i = 0; i < current.length && current[i] === (testWords[completed] || '')[i]; i++) matchingCurrentChars++;
  const correctChars = acceptedCharacters + matchingCurrentChars;
  const elapsed = startedAt ? Math.max((Date.now()-startedAt)/60000, 1/60) : 0;
  const wpm = elapsed ? Math.round((correctChars / 5) / elapsed) : 0;
  return {completed, correctChars, wpm};
}
function update() {
  const s = stats();
  renderWords();
  document.querySelectorAll('.word').forEach(node => {
    const index = Number(node.dataset.index);
    node.className = 'word';
    if (index < s.completed) node.classList.add('correct');
    else if (index === s.completed) node.classList.add('current');
  });
  els.wpm.textContent=s.wpm; els.completedWords.textContent=s.completed; els.characters.textContent=acceptedCharacters + els.input.value.length;
}
function start(){ if(startedAt || finished) return; startedAt=Date.now(); interval=setInterval(()=>{ const remaining=Math.max(0,duration-Math.floor((Date.now()-startedAt)/1000)); els.timer.textContent=formatTime(remaining); update(); if(!remaining) finish(); },250); }
function finish(){ if(finished)return; finished=true; clearInterval(interval); els.input.disabled=true; update(); const s=stats(); els.finalWpm.textContent=s.wpm; els.resultCopy.textContent=`You completed ${s.completed} words without skipping a typo. Keep that rhythm going.`; els.card.classList.remove('hidden'); els.card.scrollIntoView({behavior:'smooth',block:'nearest'}); }
function reset(){ clearInterval(interval); testWords=pickWords(); startedAt=null; finished=false; completedCount=0;acceptedCharacters=0;els.input.disabled=false;els.input.value='';els.timer.textContent=formatTime(duration);els.wpm.textContent='0';els.completedWords.textContent='0';els.characters.textContent='0';els.modeLength.textContent=duration;els.card.classList.add('hidden');renderWords();requestAnimationFrame(()=>{measureFirstLine();els.words.focus();}); }
function processTyping(){ const spaceIndex=els.input.value.indexOf(' '); if(spaceIndex !== -1){const typedWord=els.input.value.slice(0,spaceIndex);if(typedWord===testWords[completedCount]){completedCount++;acceptedCharacters+=typedWord.length+1;els.input.value='';}else{els.input.value=typedWord;}} start();update(); }
els.input.addEventListener('input', processTyping);
els.words.addEventListener('keydown', event => { if (event.ctrlKey || event.metaKey || event.altKey) return; if (event.key !== ' ') playSound(els.typingSound); if (event.key === ' ' && els.input.value && els.input.value !== testWords[completedCount]) playSound(els.errorSound); if (event.key === 'Backspace') { event.preventDefault(); els.input.value=els.input.value.slice(0,-1); update(); return; } if (event.key.length === 1) { event.preventDefault(); els.input.value+=event.key; processTyping(); } });
els.words.addEventListener('click', () => els.words.focus());
els.soundToggle.addEventListener('click', () => { soundsMuted=!soundsMuted; els.soundToggle.setAttribute('aria-pressed', soundsMuted); els.soundToggle.setAttribute('aria-label', soundsMuted ? 'Unmute typing sounds' : 'Mute typing sounds'); els.soundToggle.innerHTML=soundsMuted ? '🔇 <span>Sound off</span>' : '🔊 <span>Sound on</span>'; });
document.querySelectorAll('.mode').forEach(button=>button.addEventListener('click',()=>{document.querySelector('.mode.active').classList.remove('active');button.classList.add('active');duration=Number(button.dataset.seconds);reset();}));
els.language.addEventListener('change', reset);
document.querySelector('#restart').addEventListener('click',reset);document.querySelector('#tryAgain').addEventListener('click',reset);document.querySelector('#themeToggle').addEventListener('click',()=>document.body.classList.toggle('dark'));
reset();
