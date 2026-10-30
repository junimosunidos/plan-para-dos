/* ---------- ¿Quién soy?: el móvil en la frente y agitar para parar el cronómetro ---------- */
const QS = (() => {
  const ARM_MS = 1500;      // al empezar, ni toques ni sacudidas cuentan durante este margen
  const SHAKE_FORCE = 14;   // m/s² de aceleración para contar una sacudida
  const SHAKES = 3;         // sacudidas seguidas necesarias...
  const SHAKE_WINDOW = 1500; // ...dentro de este tiempo

  const P = {
    phase: 'setup', // setup | write | pass | countdown | play | turn | round | final
    rounds: 3, round: 1, turn: 0,
    word: '', times: [], scores: [0, 0],
    startAt: 0, elapsed: 0, gaveUp: false, confirm: false, count: 3,
  };
  let tick = null, countdown = null, wake = null, peaks = [];

  // En la ronda 1 adivina primero el jugador 2; en cada ronda se alterna quién empieza
  const guesser = () => ((P.round + P.turn) % 2 === 1 ? 1 : 0);
  const writer = () => 1 - guesser();
  const fmt = ms => (ms / 1000).toFixed(2).replace('.', ',') + ' s';
  const clock = ms => { const s = ms / 1000; return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')},${Math.floor(ms / 100) % 10}`; };

  /* ---------- cronómetro y sacudidas ---------- */
  function onMotion(e) {
    if (P.phase !== 'play' || performance.now() - P.startAt < ARM_MS) return;
    const a = e.acceleration;
    let m;
    if (a && a.x != null) m = Math.hypot(a.x, a.y, a.z);
    else {
      const g = e.accelerationIncludingGravity;
      if (!g || g.x == null) return;
      m = Math.abs(Math.hypot(g.x, g.y, g.z) - 9.81);
    }
    const t = performance.now();
    if (m < SHAKE_FORCE || (peaks.length && t - peaks[peaks.length - 1] < 120)) return;
    peaks = peaks.filter(p => t - p < SHAKE_WINDOW);
    peaks.push(t);
    if (peaks.length >= SHAKES) stop(false);
  }
  function beep() {
    try { navigator.vibrate && navigator.vibrate([180, 80, 180]); } catch (e) {}
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.type = 'square';
      g.gain.setValueAtTime(.18, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .45);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + .5);
      setTimeout(() => ctx.close(), 800);
    } catch (e) {}
  }
  function cleanup() {
    clearInterval(tick); clearInterval(countdown); tick = countdown = null;
    window.removeEventListener('devicemotion', onMotion);
    if (wake) { wake.release().catch(() => {}); wake = null; }
  }
  function startCountdown() {
    P.phase = 'countdown'; P.count = 3; render();
    try { navigator.wakeLock && navigator.wakeLock.request('screen').then(l => { wake = l; }).catch(() => {}); } catch (e) {}
    countdown = setInterval(() => {
      P.count--;
      if (P.count > 0) { const el = document.getElementById('qs-count'); if (el) el.textContent = P.count; return; }
      clearInterval(countdown); countdown = null;
      P.phase = 'play'; P.startAt = performance.now(); P.confirm = false; peaks = [];
      window.addEventListener('devicemotion', onMotion);
      render();
      tick = setInterval(() => { const el = document.getElementById('qs-clock'); if (el) el.textContent = clock(performance.now() - P.startAt); }, 100);
    }, 1000);
  }
  function stop(gaveUp) {
    if (P.phase !== 'play') return;
    P.elapsed = performance.now() - P.startAt;
    cleanup(); beep();
    P.gaveUp = gaveUp;
    P.times[P.turn] = { g: guesser(), t: gaveUp ? null : P.elapsed };
    P.phase = 'turn'; render();
  }

  /* ---------- resultado de la ronda ---------- */
  // Quien tarda más (o se rinde) bebe y el más rápido se lleva el punto
  function roundOutcome() {
    const [a, b] = P.times, ta = a.t == null ? Infinity : a.t, tb = b.t == null ? Infinity : b.t;
    if (ta === tb) return { both: true };
    const win = ta < tb ? a.g : b.g;
    return { winner: win, loser: 1 - win };
  }

  /* ---------- vistas ---------- */
  const head = () => topbar('¿Quién soy?');
  const roundTag = () => `<p class="eyebrow">Ronda ${P.round} de ${P.rounds} · ${N(0)} ${P.scores[0]} – ${P.scores[1]} ${N(1)}</p>`;

  function view() {
    const g = guesser(), w = writer();
    switch (P.phase) {
      case 'setup':
        return `<main class="screen">${head()}
          <ul class="yn-rules">
            <li>Por turnos, uno escribe un nombre de alguien o algo y el otro se pone el móvil en la frente sin verlo.</li>
            <li>El que lleva el móvil hace preguntas hasta adivinarlo. Cuando lo adivine, <b>agita el móvil</b> o toca la pantalla y el cronómetro se para.</li>
            <li>En cada ronda adivináis los dos: quien tarde más, bebe, y el más rápido se lleva el punto.</li>
          </ul>
          <section class="stack"><div class="eyebrow">Rondas</div>
            <div class="modes">${[3, 5, 10].map(v => `<button class="mode ${P.rounds === v ? 'on' : ''}" data-heat="4" data-act="qs-rounds" data-v="${v}" aria-pressed="${P.rounds === v}">${v} rondas</button>`).join('')}</div></section>
          <button class="btn primary big qs-btn" data-act="qs-start">Empezar</button>
        </main>`;
      case 'write':
        return `<main class="screen">${head()}${roundTag()}
          <div class="qs-center">
            <h3 class="qs-big">${N(w)}, escribe un nombre para ${N(g)}</h3>
            <p class="note">${N(g)}, no mires la pantalla.</p>
            <form class="panel qs-form" id="qs-form" novalidate>
              <div class="field"><label for="qs-word">Persona, personaje o cosa</label>
                <input id="qs-word" maxlength="60" autocomplete="off" placeholder="Por ejemplo: Rosalía" value="${esc(P.word)}"></div>
              <p class="err" id="qs-err" hidden>Escribe algo para que ${N(g)} lo adivine.</p>
              <button class="btn primary big qs-btn" type="submit">Hecho</button>
            </form>
          </div></main>`;
      case 'pass':
        return `<main class="screen">${head()}${roundTag()}
          <div class="qs-center">
            <h3 class="qs-big">Pásale el móvil a ${N(g)} sin enseñarle la pantalla</h3>
            <p class="note">${N(g)}: al pulsar el botón tendrás 3 segundos para ponerte el móvil en la frente, con la pantalla hacia ${N(w)}. Cuando lo adivines, agítalo con fuerza.</p>
          </div>
          <button class="btn primary big qs-btn" data-act="qs-go">${N(g)}: ¡estoy listo/a!</button>
        </main>`;
      case 'countdown':
        return `<main class="screen qs-full"><div class="qs-center">
          <p class="qs-count" id="qs-count">${P.count}</p>
          <p class="qs-big">Ponte el móvil en la frente</p></div></main>`;
      case 'play': {
        const k = Math.max(7, Math.min(18, 150 / Math.max(5, P.word.length)));
        return `<main class="screen qs-full qs-play" data-tap="qs">
          <div class="qs-clock" id="qs-clock">0:00,0</div>
          <div class="qs-center"><p class="qs-word" style="font-size:min(${k}vw, 26vh)">${esc(P.word)}</p></div>
          <div class="qs-foot"><span class="note">Agita el móvil o toca la pantalla al adivinarlo</span>
            <button class="tb-btn ${P.confirm ? 'warn' : ''}" data-act="qs-giveup">${P.confirm ? '¿Seguro? Toca otra vez' : 'Se rinde'}</button></div>
        </main>`;
      }
      case 'turn': {
        const second = P.turn === 1;
        return `<main class="screen">${head()}${roundTag()}
          <div class="qs-center">
            ${P.gaveUp ? `<p class="drink">${N(g)} se ha rendido</p>` : `<p class="res ok">¡${N(g)} lo ha adivinado!</p><p class="qs-time">${fmt(P.elapsed)}</p>`}
            <p class="note">Era:</p><p class="qs-big">${esc(P.word)}</p>
          </div>
          <button class="btn primary big qs-btn" data-act="qs-next">${second ? 'Ver quién bebe' : `Ahora escribe ${N(g)} para ${N(w)}`}</button>
        </main>`;
      }
      case 'round': {
        const o = roundOutcome(), last = P.round >= P.rounds;
        const line = i => { const r = P.times.find(x => x.g === i); return `<li><span>${N(i)}</span><b>${r.t == null ? 'Se rindió' : fmt(r.t)}</b></li>`; };
        return `<main class="screen">${head()}${roundTag()}
          <div class="qs-center">
            <ul class="qs-times">${line(0)}${line(1)}</ul>
            ${o.both ? '<p class="drink">¡Empate! Bebéis los dos</p>' : `<p class="drink">¡${N(o.loser)} bebe!</p><p class="note">${N(o.winner)} ha sido más rápido/a y se lleva el punto.</p>`}
          </div>
          <button class="btn primary big qs-btn" data-act="qs-round">${last ? 'Ver el resultado final' : 'Siguiente ronda'}</button>
        </main>`;
      }
      case 'final': {
        const [a, b] = P.scores;
        return `<main class="screen">${head()}
          <div class="qs-center">
            <p class="eyebrow">Resultado final</p>
            <p class="pm-final"><span>${N(0)} <b>${a}</b></span><span class="amp">–</span><span><b>${b}</b> ${N(1)}</span></p>
            <p class="drink">${a === b ? '¡Empate!' : `¡${N(a > b ? 0 : 1)} gana ¿Quién soy?!`}</p>
          </div>
          <div class="stack"><button class="btn primary big qs-btn" data-act="qs-again">Revancha</button><button class="btn ghost" data-act="home">Volver al inicio</button></div>
        </main>`;
      }
    }
  }

  function afterRender() {
    const input = document.getElementById('qs-word');
    if (input && !input.value) input.focus();
  }

  app.addEventListener('submit', e => {
    if (e.target.id !== 'qs-form') return;
    e.preventDefault(); e.stopImmediatePropagation();
    const v = document.getElementById('qs-word').value.trim();
    if (!v) { document.getElementById('qs-err').hidden = false; return; }
    P.word = v; P.phase = 'pass'; render();
  }, true);
  // Tocar la pantalla mientras corre el cronómetro también lo para (salvo en el margen inicial)
  app.addEventListener('click', e => {
    if (S.view !== 'qs' || P.phase !== 'play' || e.target.closest('[data-act]')) return;
    if (performance.now() - P.startAt < ARM_MS) return;
    stop(false);
  });

  return {
    get live() { return P.phase !== 'setup' && P.phase !== 'final'; },
    view, afterRender,
    open() { go('qs'); },
    // Si se sale a mitad de un turno, ese turno se repite al volver
    leave() { if (P.phase === 'countdown' || P.phase === 'play') { cleanup(); P.phase = 'pass'; } },
    handle(act, el) {
      switch (act) {
        case 'qs-rounds': P.rounds = +el.dataset.v; render(); return true;
        case 'qs-start': case 'qs-again':
          Object.assign(P, { round: 1, turn: 0, scores: [0, 0], times: [], word: '', phase: 'write' }); render(); return true;
        case 'qs-go': startCountdown(); return true;
        case 'qs-giveup': if (P.confirm) stop(true); else { P.confirm = true; render(); } return true;
        case 'qs-next':
          if (P.turn === 0) { P.turn = 1; P.word = ''; P.phase = 'write'; }
          else { const o = roundOutcome(); if (!o.both) P.scores[o.winner]++; P.phase = 'round'; }
          render(); return true;
        case 'qs-round':
          if (P.round >= P.rounds) P.phase = 'final';
          else { P.round++; P.turn = 0; P.times = []; P.word = ''; P.phase = 'write'; }
          render(); return true;
      }
      return false;
    },
  };
})();
GAMES.qs = QS;
