/* ---------- Yo nunca haría ---------- */
const YN = (() => {
  // Frases del documento, en su orden original. a: 1 = categoría +18
  const PHRASES = [{"t": "Yo nunca me masturbaría pensando en alguien que conozco.", "a": 1}, {"t": "Yo nunca tendría sexo delante de un espejo.", "a": 1}, {"t": "Yo nunca probaría el BDSM.", "a": 1}, {"t": "Yo nunca haría un trío.", "a": 1}, {"t": "Yo nunca intercambiaría pareja con otra pareja.", "a": 1}, {"t": "Yo nunca tendría conversaciones subidas de tono con alguien teniendo pareja.", "a": 1}, {"t": "Yo nunca tendría una conversación sexual con alguien que tuviera pareja.", "a": 1}, {"t": "Yo nunca haría un trío con una persona que conozco.", "a": 1}, {"t": "Yo nunca tendría sexo con alguien de mi mismo sexo por curiosidad.", "a": 1}, {"t": "Yo nunca tendría sexo a cambio de dinero.", "a": 1}, {"t": "Yo nunca tendría una relación abierta.", "a": 1}, {"t": "Yo nunca ocultaría que alguien me ha tirado la caña.", "a": 1}, {"t": "Yo nunca tendría sexo en un sitio donde existiera riesgo de que nos pillaran.", "a": 1}, {"t": "Yo nunca dejaría de pedirle a mi pareja algo que me gustaría probar en la cama por vergüenza.", "a": 1}, {"t": "Yo nunca tendría sexo con alguien mucho mayor que yo.", "a": 1}, {"t": "Yo nunca tendría sexo con alguien mucho más joven que yo, siendo ambos adultos.", "a": 1}, {"t": "Yo nunca probaría el sexo en grupo.", "a": 1}, {"t": "Yo nunca buscaría contenido sexual de alguien que conozco.", "a": 1}, {"t": "Yo nunca vería contenido erótico con mi pareja para inspirarnos.", "a": 1}, {"t": "Yo nunca le pediría a mi pareja que probáramos algo que aparece en una película o vídeo erótico.", "a": 1}, {"t": "Yo nunca tendría sexo con mi pareja en un lugar elegido por ella aunque me diera vergüenza.", "a": 1}, {"t": "Yo nunca habría mantenido a alguien en la recámara por si mi relación salía mal.", "a": 1}, {"t": "Yo nunca habría perdonado unos cuernos si nadie llegaba a enterarse.", "a": 1}, {"t": "Yo nunca habría puesto los cuernos si supiera que mi pareja jamás lo descubriría.", "a": 1}, {"t": "Yo nunca habría tenido sexo con alguien que acababa de conocer por una aplicación.", "a": 1}, {"t": "Yo nunca habría tenido sexo con alguien que me caía mal, simplemente porque me atraía.", "a": 1}, {"t": "Yo nunca habría buscado a un ex en redes sociales para ver si sigue soltero.", "a": 1}, {"t": "Yo nunca habría tenido celos de alguien con quien mi pareja estuvo antes de conocerme.", "a": 1}, {"t": "Yo nunca aceptaría dinero por guardar un secreto muy comprometido."}, {"t": "Yo nunca fingiría estar enfermo para librarme de un compromiso importante."}, {"t": "Yo nunca aceptaría un favor sabiendo que después no podría devolverlo."}, {"t": "Yo nunca inventaría una historia sobre mi vida para impresionar a alguien."}, {"t": "Yo nunca habría cotilleado conversaciones ajenas sin permiso."}, {"t": "Yo nunca habría creado un perfil falso para cotillear la vida de alguien."}, {"t": "Yo nunca habría fingido no reconocer a alguien para evitar saludarlo."}, {"t": "Yo nunca me casaría por dinero."}, {"t": "Yo nunca gastaría los ahorros compartidos en algo para mí sin consultarlo."}, {"t": "Yo nunca aceptaría un trabajo que fuera contra mis principios por cobrar mucho."}, {"t": "Yo nunca prestaría dinero a un amigo sabiendo que probablemente no me lo devolverá."}, {"t": "Yo nunca dejaría que mi pareja pagara una deuda que he provocado yo."}, {"t": "Yo nunca participaría en un reality show como La Isla de las Tentaciones."}, {"t": "Yo nunca revisaría las redes sociales de la nueva pareja de mi ex."}, {"t": "Yo nunca ocultaría a un amigo que su pareja le está engañando."}, {"t": "Yo nunca invitaría a una persona a mi boda sabiendo que no la soporto."}, {"t": "Yo nunca perdonaría a alguien que ha hablado mal de mi pareja."}, {"t": "Yo nunca mantendría una amistad por puro interés."}, {"t": "Yo nunca habría fingido estar feliz por un éxito que me daba envidia."}, {"t": "Yo nunca habría disfrutado viendo cómo alguien que me cae mal pasaba vergüenza."}, {"t": "Yo nunca habría sentido alivio al cancelar un plan con alguien."}, {"t": "Yo nunca habría mentido diciendo que estaba ocupado para no quedar con alguien."}, {"t": "Yo nunca fingiría tener una vida mejor de la que realmente tengo en redes sociales."}, {"t": "Yo nunca mentiría sobre mi edad para conseguir algo."}, {"t": "Yo nunca me quedaría con dinero que alguien me ha transferido por error."}, {"t": "Yo nunca cambiaría mi forma de ser para parecer más interesante."}, {"t": "Yo nunca publicaría una indirecta para que una persona concreta se diera por aludida."}, {"t": "Yo nunca viajaría al pasado si supiera que podría cambiar mi vida actual."}, {"t": "Yo nunca aceptaría conocer una infidelidad futura antes de que sucediera."}];
  const P = { started: false, adult: true, order: [], i: 0 };

  function newRound() {
    P.order = shuffle(PHRASES.map((p, i) => i).filter(i => P.adult || !PHRASES[i].a));
    P.i = 0;
  }

  function intro() {
    const adultCount = PHRASES.filter(p => p.a).length;
    return `<main class="screen">
      ${topbar('Yo nunca haría')}
      <div class="yn-intro">
        <h1 class="neon yn-title">Yo nunca haría</h1>
        <ul class="yn-rules">
          <li>Sale una frase en el centro de la pantalla y la leéis los dos.</li>
          <li>Si tú sí harías lo que dice la frase, bebes un trago. Es una indicación del juego, nunca una obligación.</li>
          <li>Toca en cualquier parte para pasar a la siguiente frase.</li>
        </ul>
        <button class="cat yn-toggle ${P.adult ? 'on' : ''}" data-heat="3" data-act="yn-adult" role="switch" aria-checked="${P.adult}">
          <span class="ico" aria-hidden="true">🔞</span>
          <span class="txt"><span class="nm">Categoría +18</span><span class="ds">${P.adult ? `Incluida: ${PHRASES.length} frases en total.` : `Sin ella: ${PHRASES.length - adultCount} frases.`}</span></span>
          <span class="sw" aria-hidden="true"></span>
        </button>
      </div>
      <button class="btn primary big yn-btn" data-act="yn-start">Empezar</button>
    </main>`;
  }

  function game() {
    const done = P.i >= P.order.length;
    const body = done
      ? `<article class="dcard yn-card" style="text-align:center;align-items:center">
          <span class="num">Ronda terminada</span>
          <p class="dtext">Habéis visto las ${P.order.length} frases.</p>
          <button class="btn primary big yn-btn" data-act="yn-again">Otra ronda</button>
          <button class="btn ghost" data-act="yn-intro">Cambiar categoría +18</button>
        </article>`
      : `<article class="dcard yn-card" aria-live="polite">
          <span class="num">Frase ${P.i + 1} de ${P.order.length}</span>
          <p class="dtext">${esc(PHRASES[P.order[P.i]].t)}</p>
        </article>
        <p class="taphint">Toca en cualquier parte para la siguiente frase</p>`;
    return `<main class="screen dil-screen" ${done ? '' : 'data-tap="yn"'}>
      ${topbar('Yo nunca haría')}
      <div class="progress" aria-hidden="true"><i style="width:${Math.min(P.i + (done ? 0 : 1), P.order.length) / P.order.length * 100}%;background:linear-gradient(90deg,var(--hot),var(--amber))"></i></div>
      <div class="dil-stage">${body}</div>
    </main>`;
  }

  // Tocar la pantalla fuera de cualquier botón pasa a la siguiente frase
  app.addEventListener('click', e => {
    if (S.view !== 'yn' || e.target.closest('[data-act]') || !e.target.closest('[data-tap="yn"]')) return;
    P.i++; render();
  });

  return {
    total: PHRASES.length,
    get live() { return P.started && P.i > 0 && P.i < P.order.length ? P.i + 1 : 0; },
    view: () => (P.started ? game() : intro()),
    open() { go('yn'); },
    handle(act) {
      switch (act) {
        case 'yn-adult': P.adult = !P.adult; render(); return true;
        case 'yn-start': newRound(); P.started = true; render(); return true;
        case 'yn-again': newRound(); render(); return true;
        case 'yn-intro': P.started = false; render(); return true;
      }
      return false;
    },
  };
})();
GAMES.yn = YN;
