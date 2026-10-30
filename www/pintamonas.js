/* ---------- Pintamonas: dibujar a la vez en dos móviles ---------- */
const PM = (() => {
  const FIREBASE = {
    apiKey: 'AIzaSyCeP4znyXQO2fCLV26bJBsnl-QynfrjzcQ',
    authDomain: 'plan-para-dos.firebaseapp.com',
    databaseURL: 'https://plan-para-dos-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'plan-para-dos',
    storageBucket: 'plan-para-dos.firebasestorage.app',
    messagingSenderId: '505609647203',
    appId: '1:505609647203:web:23be59597b40028d97b456',
  };
  const WEB_URL = 'https://junimosunidos.github.io/plan-para-dos/';
  // Súbelo cuando cambie cómo se guarda la partida: los móviles con otra versión no podrán unirse
  const PROTOCOL = 2;
  const CHARACTERS = [
    'Mickey Mouse', 'Minnie Mouse', 'Pato Donald', 'Goofy', 'Bugs Bunny', 'Pato Lucas', 'Piolín', 'Silvestre', 'Correcaminos', 'Coyote',
    'Pantera Rosa', 'Scooby-Doo', 'Pedro Picapiedra', 'Popeye', 'Pájaro Loco', 'Tom', 'Jerry', 'Garfield', 'Snoopy', 'Pitufo',
    'Bob Esponja', 'Patricio Estrella', 'Calamardo', 'Homer Simpson', 'Bart Simpson', 'Marge Simpson', 'Peter Griffin', 'Rick', 'Morty', 'Doraemon',
    'Shin-chan', 'Peppa Pig', 'Bluey', 'Pocoyó', 'Hello Kitty',
    'Simba', 'Stitch', 'Olaf', 'Elsa', 'Nemo', 'Dory', 'Buzz Lightyear', 'Woody', 'Rayo McQueen', 'Wall-E', 'Mike Wazowski', 'Winnie the Pooh', 'Dumbo', 'Ariel', 'Ratatouille',
    'Mario', 'Luigi', 'Yoshi', 'Bowser', 'Pikachu', 'Sonic', 'Pac-Man', 'Kirby', 'Link', 'Donkey Kong', 'Lara Croft', 'Crash Bandicoot', 'Steve de Minecraft', 'Creeper', 'Among Us',
    'Shrek', 'Burro de Shrek', 'Gru', 'Minion', 'E.T.', 'Darth Vader', 'Yoda', 'Chewbacca', 'R2-D2', 'Harry Potter', 'Gollum', 'Batman', 'Superman', 'Spider-Man', 'Hulk',
    'Iron Man', 'Groot', 'Godzilla', 'King Kong', 'Frankenstein', 'Drácula',
    'Barbie', 'Ken', 'Chucky', 'Pennywise', 'Jack Skellington',
  ];
  const COLORS = ['#1f1530', '#e63946', '#ff8a3d', '#ffd23f', '#3bb273', '#3a86ff', '#9b5de5', '#8d5a3b'];
  const SIZES = [4, 10, 22];
  const PAPER = '#fbf6ee';
  const CANVAS_PX = 600;
  const ROLES = ['host', 'guest'];
  const other = r => (r === 'host' ? 'guest' : 'host');

  const P = {
    view: 'menu',      // menu | connecting | lobby | game | error
    me: 0,             // índice en S.names del jugador de este móvil (solo anfitrión)
    time: 60,
    rounds: 5,
    joinCode: '',
    error: '',
    code: null,
    role: null,
    room: null,
    uid: null,
    spun: {},
    spinning: {},
    sig: '',
  };
  let db = null, roomRef = null, offset = 0, loading = null, timerId = null;
  const pad = { key: null, canvas: null, strokes: [], color: COLORS[0], size: SIZES[1], eraser: false, sent: null, locked: false };

  /* ---------- Firebase ---------- */
  function loadScript(src) {
    return new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  }
  function connect() {
    if (loading) return loading;
    loading = (async () => {
      if (!window.firebase) {
        await loadScript('vendor/firebase-app-compat.js');
        await loadScript('vendor/firebase-auth-compat.js');
        await loadScript('vendor/firebase-database-compat.js');
      }
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE);
      const cred = firebase.auth().currentUser || (await firebase.auth().signInAnonymously()).user;
      P.uid = cred.uid;
      db = firebase.database();
      db.ref('.info/serverTimeOffset').on('value', s => { offset = s.val() || 0; });
    })();
    loading.catch(() => { loading = null; });
    return loading;
  }
  const now = () => Date.now() + offset;
  const fail = msg => { P.view = 'error'; P.error = msg; S.view === 'pm' ? render() : go('pm'); };
  const NO_NET = 'No se ha podido conectar. Pintamonas necesita internet en los dos móviles: revisa la conexión y vuelve a intentarlo.';

  function newCode() {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
  }
  // Personaje al azar de toda la lista; solo se evita repetir el que acaba de salir
  function randomChar(prev) {
    let i;
    do { i = Math.floor(Math.random() * CHARACTERS.length); } while (i === prev);
    return i;
  }
  function freshState(game) {
    return {
      phase: 'lobby', game, round: 1,
      char: randomChar(), pos: 0,
      scores: { host: 0, guest: 0 },
    };
  }

  async function createRoom() {
    P.view = 'connecting'; render();
    try { await connect(); } catch (e) { return fail(NO_NET); }
    for (let tries = 0; tries < 5; tries++) {
      const code = newCode();
      const room = {
        v: PROTOCOL,
        host: P.uid,
        names: { host: S.names[P.me], guest: S.names[1 - P.me] },
        settings: { time: P.time, rounds: P.rounds },
        createdAt: Date.now(),
        state: freshState(1),
      };
      try {
        const res = await db.ref('rooms/' + code).transaction(cur => (cur ? undefined : room));
        if (res.committed) return enter(code, 'host');
      } catch (e) { return fail(NO_NET); }
    }
    fail('No se ha podido crear la partida. Vuelve a intentarlo.');
  }

  async function joinRoom(code) {
    code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const show = () => (S.view === 'pm' ? render() : go('pm'));
    if (code.length !== 4) { P.error = 'El código tiene 4 letras o números.'; P.view = 'menu'; show(); return; }
    P.view = 'connecting'; show();
    try { await connect(); } catch (e) { return fail(NO_NET); }
    try {
      const snap = await db.ref('rooms/' + code).get();
      const room = snap.val();
      if (!room) return fail(`No hay ninguna partida con el código ${code}. Revisa que esté bien escrito.`);
      if (room.v !== PROTOCOL) return fail('Esta partida se ha creado con otra versión de la app. Actualizad los dos móviles a la última versión (instalar el APK nuevo o recargar la web) y cread la partida otra vez.');
      if (room.host === P.uid) return enter(code, 'host');
      const res = await db.ref(`rooms/${code}/guest`).transaction(cur => (cur && cur !== P.uid ? undefined : P.uid));
      if (!res.committed) return fail('Esta partida ya tiene dos jugadores.');
      await db.ref(`rooms/${code}/state`).transaction(s => {
        if (s && s.phase === 'lobby') s.phase = 'reveal';
        return s;
      });
      enter(code, 'guest');
    } catch (e) { fail(NO_NET); }
  }

  function enter(code, role) {
    leaveRoom();
    P.code = code; P.role = role; P.view = 'game'; P.error = ''; P.sig = '';
    roomRef = db.ref('rooms/' + code);
    roomRef.on('value', snap => {
      P.room = snap.val();
      if (!P.room) { leaveRoom(); return fail('La otra persona ha salido de la partida.'); }
      onRoom();
    });
    go('pm');
  }
  function leaveRoom() {
    if (roomRef) roomRef.off();
    roomRef = null; P.room = null; P.code = null; P.role = null;
    clearInterval(timerId); timerId = null;
  }
  const st = () => P.room.state;
  const tx = fn => db.ref(`rooms/${P.code}/state`).transaction(s => (s ? fn(s) : s));
  const drawKey = s => `${s.game}-${s.round}`;
  const nameOf = role => esc(P.room.names[role]);

  /* ---------- reacciones a cambios de la sala ---------- */
  function onRoom() {
    const s = st();
    // Si la fase de dibujo ya terminó y este móvil no ha enviado su dibujo, se envía ahora
    if (s.phase === 'vote' && !(P.room.drawings && P.room.drawings[drawKey(s)] && P.room.drawings[drawKey(s)][P.role])) sendDrawing();
    if (s.phase === 'draw') startTimer(); else { clearInterval(timerId); timerId = null; }
    // Solo se repinta cuando cambia lo que se ve, para no interrumpir un trazo a medias
    const d = P.room.drawings && P.room.drawings[drawKey(s)];
    const sig = JSON.stringify([s.phase, s.round, s.game, s.pos, s.ready, s.votes, s.result, s.final, !!P.room.guest, d ? Object.keys(d).sort() : 0]);
    if (sig !== P.sig && S.view === 'pm') { P.sig = sig; render(); }
  }

  function startTimer() {
    if (timerId) return;
    timerId = setInterval(() => {
      const s = P.room && st();
      if (!s || s.phase !== 'draw') { clearInterval(timerId); timerId = null; return; }
      const left = Math.max(0, s.endsAt - now());
      const el = document.getElementById('pm-timer');
      if (el) { el.textContent = Math.min(P.room.settings.time, Math.ceil(left / 1000)); el.classList.toggle('hurry', left < 10000); }
      if (left <= 0) {
        clearInterval(timerId); timerId = null;
        sendDrawing().then(() => tx(x => { if (x.phase === 'draw' && x.round === s.round) x.phase = 'vote'; return x; }));
      }
    }, 200);
  }

  /* ---------- acciones de partida ---------- */
  function ready() {
    const s = st(), r = s.round, pos = s.pos;
    tx(x => {
      if (x.phase !== 'reveal' || x.round !== r || x.pos !== pos) return x;
      x.ready = Object.assign({}, x.ready, { [P.role]: true });
      if (x.ready.host && x.ready.guest) {
        x.phase = 'draw';
        x.endsAt = now() + P.room.settings.time * 1000 + 1500; // margen para que llegue a los dos móviles
        x.ready = null;
      }
      return x;
    });
  }
  function skip() {
    const s = st(), pos = s.pos;
    tx(x => {
      if (x.phase !== 'reveal' || x.pos !== pos) return x;
      x.pos += 1; x.char = randomChar(x.char);
      x.ready = null;
      return x;
    });
  }
  function vote(choice) {
    const s = st(), r = s.round;
    tx(x => {
      if (x.phase !== 'vote' || x.round !== r) return x;
      x.votes = Object.assign({}, x.votes, { [P.role]: choice });
      if (x.votes.host && x.votes.guest) {
        let winner, method, spin = 0;
        if (x.votes.host === x.votes.guest) { winner = x.votes.host; method = 'votes'; }
        else {
          const loser = Math.random() < .5 ? 'host' : 'guest';
          winner = other(loser); method = 'roulette'; spin = spinTo(loser);
        }
        x.scores[winner] = (x.scores[winner] || 0) + 1;
        x.result = { winner, loser: other(winner), method, spin };
        x.phase = 'result';
      }
      return x;
    });
  }
  function nextRound() {
    const s = st(), r = s.round;
    tx(x => {
      if (x.phase !== 'result' || x.round !== r) return x;
      if (x.round >= P.room.settings.rounds) {
        const h = x.scores.host || 0, g = x.scores.guest || 0;
        if (h === g) { const loser = Math.random() < .5 ? 'host' : 'guest'; x.final = { winner: other(loser), loser, tie: true, spin: spinTo(loser) }; }
        else x.final = { winner: h > g ? 'host' : 'guest', loser: h > g ? 'guest' : 'host', tie: false };
        x.phase = 'final';
      } else {
        x.round += 1; x.pos += 1; x.char = randomChar(x.char);
        x.phase = 'reveal'; x.votes = null; x.result = null; x.ready = null;
      }
      return x;
    });
  }
  function rematch() {
    const s = st(), game = s.game;
    tx(x => {
      if (x.phase !== 'final' || x.game !== game) return x;
      const n = freshState(game + 1);
      n.pos = x.pos + 1; n.phase = 'reveal';
      return n;
    });
    db.ref(`rooms/${P.code}/drawings`).remove().catch(() => {});
  }
  // Salir de la partida la borra para los dos: al volver se empieza creando una nueva
  function leave() {
    const ref = roomRef;
    leaveRoom();
    if (ref) ref.remove().catch(() => {});
    P.view = 'menu'; P.error = '';
  }
  function finish() { leave(); go('pm'); }

  // Ruleta: la mitad del anfitrión va de 0° a 180° y la del invitado de 180° a 360°, con el puntero arriba
  function spinTo(loser) {
    const a = (loser === 'host' ? 25 : 205) + Math.random() * 130;
    return 360 * 6 + (360 - a);
  }

  /* ---------- lienzo ---------- */
  function ensurePad(key) {
    if (pad.key === key && pad.canvas) return pad.canvas;
    const c = document.createElement('canvas');
    c.width = c.height = CANVAS_PX; c.className = 'pm-canvas';
    pad.key = key; pad.canvas = c; pad.strokes = []; pad.sent = null; pad.locked = false;
    let cur = null;
    const pt = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * CANVAS_PX / r.width, (e.clientY - r.top) * CANVAS_PX / r.height]; };
    c.addEventListener('pointerdown', e => {
      if (pad.locked) return;
      e.preventDefault(); c.setPointerCapture(e.pointerId);
      cur = { color: pad.eraser ? PAPER : pad.color, size: pad.eraser ? SIZES[2] * 1.6 : pad.size, pts: [pt(e)] };
      pad.strokes.push(cur); paint();
    });
    c.addEventListener('pointermove', e => { if (!cur || pad.locked) return; cur.pts.push(pt(e)); paint(); });
    const end = () => { cur = null; };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    paint();
    return c;
  }
  function paint() {
    const c = pad.canvas, g = c.getContext('2d');
    g.fillStyle = PAPER; g.fillRect(0, 0, CANVAS_PX, CANVAS_PX);
    g.lineCap = g.lineJoin = 'round';
    for (const s of pad.strokes) {
      g.strokeStyle = s.color; g.fillStyle = s.color; g.lineWidth = s.size;
      if (s.pts.length === 1) { g.beginPath(); g.arc(s.pts[0][0], s.pts[0][1], s.size / 2, 0, Math.PI * 2); g.fill(); continue; }
      g.beginPath(); g.moveTo(...s.pts[0]);
      for (let i = 1; i < s.pts.length; i++) g.lineTo(...s.pts[i]);
      g.stroke();
    }
  }
  function sendDrawing() {
    const s = st(), key = drawKey(s);
    if (pad.sent === key) return Promise.resolve();
    pad.sent = key; pad.locked = true;
    if (pad.key !== key) ensurePad(key); // sin lienzo de esta ronda (p. ej. se recargó la página): se envía en blanco
    const data = pad.canvas.toDataURL('image/jpeg', 0.72);
    return db.ref(`rooms/${P.code}/drawings/${key}/${P.role}`).set(data).catch(() => { pad.sent = null; });
  }

  /* ---------- QR ---------- */
  function qrSvg(text) {
    const q = qrcode(0, 'M'); q.addData(text); q.make();
    return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  }

  /* ---------- vistas ---------- */
  const chips = (act, values, cur, fmt) => values.map(v => `<button class="mode ${v === cur ? 'on' : ''}" data-heat="4" data-act="${act}" data-v="${v}" aria-pressed="${v === cur}">${fmt(v)}</button>`).join('');
  const scoreBar = s => `<div class="pm-score"><span class="pm-p host">${nameOf('host')} <b>${s.scores.host || 0}</b></span><span class="pm-round">Ronda ${s.round} de ${P.room.settings.rounds}</span><span class="pm-p guest"><b>${s.scores.guest || 0}</b> ${nameOf('guest')}</span></div>`;
  const wheel = (key, spin) => {
    const done = P.spun[key];
    return `<div class="pm-wheel-wrap"><span class="pm-pointer" aria-hidden="true">▼</span>
      <div class="pm-wheel" id="pm-wheel" data-key="${key}" data-spin="${spin}" style="transform:rotate(${done ? spin : 0}deg)">
        <span class="pm-wl host">${nameOf('host')}</span><span class="pm-wl guest">${nameOf('guest')}</span>
      </div></div>`;
  };

  function menuView() {
    const names = S.names;
    return `<main class="screen">
      ${topbar('Pintamonas')}
      <p class="lead">Os sale el mismo personaje y lo dibujáis a la vez, cada uno en su móvil. Luego votáis el mejor y el que pierde bebe.</p>
      ${names ? `
      <section class="stack"><div class="eyebrow">¿Quién juega en este móvil?</div>
        <div class="modes">${names.map((n, i) => `<button class="mode ${P.me === i ? 'on' : ''}" data-heat="4" data-act="pm-me" data-v="${i}">${esc(n)}</button>`).join('')}</div></section>
      <section class="stack"><div class="eyebrow">Tiempo para dibujar</div><div class="modes">${chips('pm-time', [30, 60, 90], P.time, v => v + ' s')}</div></section>
      <section class="stack"><div class="eyebrow">Rondas</div><div class="modes">${chips('pm-rounds', [3, 5, 10], P.rounds, v => v + ' rondas')}</div></section>
      <button class="btn primary big pm-btn" data-act="pm-create">Crear partida</button>` : ''}
      <section class="panel"><div class="field"><label for="pm-code">${names ? '¿Te han invitado? Escribe el código' : 'Código de la partida'}</label>
        <input id="pm-code" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD" value="${esc(P.joinCode)}"></div>
        ${P.error ? `<p class="err">${esc(P.error)}</p>` : ''}
        <button class="btn ghost" data-act="pm-join">Unirme a la partida</button></section>
    </main>`;
  }

  function gameView() {
    const s = st(), me = P.role, them = other(me);
    const right = '';
    const head = topbar('Pintamonas', right);
    if (s.phase === 'lobby') {
      const url = WEB_URL + '?sala=' + P.code;
      return `<main class="screen">${head}
        <div class="pm-center">
          <p class="lead">Que ${nameOf('guest')} escanee este código con la cámara del móvil:</p>
          <div class="pm-qr">${qrSvg(url)}</div>
          <p class="pm-code-label">O que escriba este código en su app:</p>
          <p class="pm-code">${P.code}</p>
          <p class="taphint">Esperando a ${nameOf('guest')}…</p>
          <p class="note">${P.room.settings.time} s por dibujo · ${P.room.settings.rounds} rondas</p>
        </div></main>`;
    }
    if (s.phase === 'reveal') {
      const iReady = s.ready && s.ready[me];
      return `<main class="screen">${head}${scoreBar(s)}
        <div class="pm-center">
          <p class="eyebrow">Tenéis que dibujar a</p>
          <h3 class="pm-char neon">${esc(CHARACTERS[s.char])}</h3>
          <p class="note">${P.room.settings.time} segundos. La cuenta atrás empieza cuando los dos estéis listos.</p>
        </div>
        <div class="stack">
          ${iReady ? `<button class="btn ghost big" disabled>Esperando a ${nameOf(them)}…</button>` : '<button class="btn primary big pm-btn" data-act="pm-ready">¡Listo!</button>'}
          <button class="btn ghost" data-act="pm-skip">No lo conozco · saltar</button>
        </div></main>`;
    }
    if (s.phase === 'draw') {
      const left = Math.min(P.room.settings.time, Math.max(0, Math.ceil((s.endsAt - now()) / 1000)));
      return `<main class="screen pm-draw">${head}
        <div class="pm-drawhead"><span class="pm-what">${esc(CHARACTERS[s.char])}</span><span class="pm-timer ${left <= 10 ? 'hurry' : ''}" id="pm-timer">${left}</span></div>
        <div class="pm-canvas-box" id="pm-canvas-box"></div>
        <div class="pm-tools">
          <div class="pm-colors">${COLORS.map(c => `<button class="pm-color ${!pad.eraser && pad.color === c ? 'on' : ''}" style="--c:${c}" data-act="pm-color" data-v="${c}" aria-label="Color"></button>`).join('')}</div>
          <div class="pm-row">
            ${SIZES.map((z, i) => `<button class="pm-tool ${!pad.eraser && pad.size === z ? 'on' : ''}" data-act="pm-size" data-v="${z}" aria-label="Grosor ${i + 1}"><i style="width:${6 + i * 6}px;height:${6 + i * 6}px"></i></button>`).join('')}
            <button class="pm-tool ${pad.eraser ? 'on' : ''}" data-act="pm-eraser">Goma</button>
            <button class="pm-tool" data-act="pm-undo">Deshacer</button>
            <button class="pm-tool" data-act="pm-clear">Borrar</button>
          </div>
        </div></main>`;
    }
    const d = (P.room.drawings && P.room.drawings[drawKey(s)]) || {};
    const pics = ROLES.map(r => `<figure class="pm-pic ${s.votes && s.votes[me] === r ? 'on' : ''}">
        ${d[r] ? `<img src="${d[r]}" alt="Dibujo de ${nameOf(r)}">` : `<div class="pm-wait">Esperando el dibujo…</div>`}
        <figcaption>${nameOf(r)}</figcaption></figure>`).join('');
    if (s.phase === 'vote') {
      const both = d.host && d.guest, voted = s.votes && s.votes[me];
      return `<main class="screen">${head}${scoreBar(s)}
        <p class="prompt pm-q">${esc(CHARACTERS[s.char])}: ¿qué dibujo es mejor?</p>
        <div class="pm-pics">${pics}</div>
        ${!both ? '<p class="taphint">Llegando los dibujos…</p>'
          : voted ? `<p class="taphint">Has votado. Esperando a ${nameOf(them)}…</p>`
          : `<div class="bets">${ROLES.map(r => `<button class="btn primary pm-btn" data-act="pm-vote" data-v="${r}">Dibujo de ${nameOf(r)}</button>`).join('')}</div>`}
      </main>`;
    }
    if (s.phase === 'result') {
      const R = s.result, key = `${s.game}-${s.round}`;
      const showText = R.method === 'votes' || P.spun[key];
      const text = R.method === 'votes'
        ? `<p class="res ok">Los dos votáis el dibujo de ${nameOf(R.winner)}.</p><p class="drink">¡${nameOf(R.loser)} bebe!</p>`
        : `<p class="res">No coincidís: decide la ruleta.</p>${showText ? `<p class="drink">¡${nameOf(R.loser)} bebe!</p><p class="note">${nameOf(R.winner)} se lleva el punto.</p>` : ''}`;
      const last = s.round >= P.room.settings.rounds;
      return `<main class="screen">${head}${scoreBar(s)}
        <div class="pm-pics small">${pics}</div>
        ${R.method === 'roulette' ? wheel(key, R.spin) : ''}
        <div class="pm-center">${text}</div>
        ${showText ? `<button class="btn primary big pm-btn" data-act="pm-next">${last ? 'Ver el resultado final' : 'Siguiente personaje'}</button>` : ''}
      </main>`;
    }
    if (s.phase === 'final') {
      const F = s.final, key = `final-${s.game}`, showText = !F.tie || P.spun[key];
      return `<main class="screen">${head}
        <div class="pm-center">
          <p class="eyebrow">Resultado final</p>
          <p class="pm-final"><span>${nameOf('host')} <b>${s.scores.host || 0}</b></span><span class="amp">–</span><span><b>${s.scores.guest || 0}</b> ${nameOf('guest')}</span></p>
          ${F.tie ? '<p class="res">¡Empate! La ruleta decide quién bebe.</p>' + wheel(key, F.spin) : ''}
          ${showText ? `<p class="drink">¡${nameOf(F.loser)} es un/a pintamonas!</p><p class="prompt">${nameOf(F.winner)} gana la partida. ${nameOf(F.loser)}, te toca beber.</p>` : ''}
        </div>
        ${showText ? `<div class="stack"><button class="btn primary big pm-btn" data-act="pm-rematch">Revancha</button><button class="btn ghost" data-act="pm-finish">Terminar</button></div>` : ''}
      </main>`;
    }
    return `<main class="screen">${head}</main>`;
  }

  function view() {
    if (P.view === 'connecting') return `<main class="screen">${topbar('Pintamonas')}<div class="pm-center"><p class="taphint">Conectando…</p></div></main>`;
    if (P.view === 'error') return `<main class="screen">${topbar('Pintamonas')}<div class="pm-center"><p class="res bad">${esc(P.error)}</p><button class="btn ghost" data-act="pm-menu">Volver</button></div></main>`;
    if (P.view === 'game' && P.room) return gameView();
    return menuView();
  }

  // Después de pintar la vista: colocar el lienzo y lanzar la ruleta
  function afterRender() {
    if (S.view !== 'pm') return;
    const box = document.getElementById('pm-canvas-box');
    if (box && P.room) box.appendChild(ensurePad(drawKey(st())));
    const w = document.getElementById('pm-wheel');
    if (w && !P.spun[w.dataset.key]) {
      const key = w.dataset.key;
      if (P.spinning[key]) { w.style.transform = `rotate(${w.dataset.spin}deg)`; return; }
      P.spinning[key] = true;
      requestAnimationFrame(() => requestAnimationFrame(() => { w.style.transform = `rotate(${w.dataset.spin}deg)`; }));
      setTimeout(() => { P.spun[key] = true; P.sig = ''; if (S.view === 'pm') render(); }, 4300);
    }
  }

  function handle(act, el) {
    const v = el.dataset.v;
    switch (act) {
      case 'pm-me': P.me = +v; render(); return true;
      case 'pm-time': P.time = +v; render(); return true;
      case 'pm-rounds': P.rounds = +v; render(); return true;
      case 'pm-create': createRoom(); return true;
      case 'pm-join': P.joinCode = document.getElementById('pm-code').value; P.error = ''; joinRoom(P.joinCode); return true;
      case 'pm-menu': P.view = 'menu'; P.error = ''; render(); return true;
      case 'pm-ready': ready(); return true;
      case 'pm-skip': skip(); return true;
      case 'pm-vote': vote(v); return true;
      case 'pm-next': nextRound(); return true;
      case 'pm-rematch': rematch(); return true;
      case 'pm-finish': finish(); return true;
      case 'pm-color': pad.color = v; pad.eraser = false; render(); return true;
      case 'pm-size': pad.size = +v; pad.eraser = false; render(); return true;
      case 'pm-eraser': pad.eraser = !pad.eraser; render(); return true;
      case 'pm-undo': if (!pad.locked) { pad.strokes.pop(); paint(); } return true;
      case 'pm-clear': if (!pad.locked) { pad.strokes = []; paint(); } return true;
    }
    return false;
  }

  return {
    view, handle, afterRender, joinRoom,
    leave,
    open() { leave(); go('pm'); },
  };
})();
