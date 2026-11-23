(() => {
  const figure = document.querySelector('.wave-sheet');
  if (!figure || typeof circleMode === 'undefined' || typeof Path2D === 'undefined') return;
  const canvas = figure.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const time = figure.querySelector('#wave-time');
  const readout = figure.querySelector('#time-value');
  const play = figure.querySelector('#wave-play');
  const modes = [...figure.querySelectorAll("input[name='wave-mode']")];
  const fieldName = figure.querySelector('#field-name');
  const fieldLow = figure.querySelector('#field-low');
  const fieldHigh = figure.querySelector('#field-high');
  const fieldScale = figure.querySelector('#field-scale');
  const period = 2 * Math.PI;
  const width = 560;
  const height = 220;
  const unit = 59; // Both panels use the same number of pixels per spatial unit.
  const midY = 110;
  const animationMs = 8500;
  let frame = 0;
  let startedAt = 0;
  let lastPaint = 0;
  let labelScale = 1;

  // Q/A increases towards r=1 on each branch, starting from opposite sides.
  // Invert sampled branches once to draw level curves of Q(r) cos(θ+t).
  function profileBranch(start, end) {
    const steps = Math.abs(end - start) * 144;
    return Array.from({length: steps + 1}, (_, i) => {
      const r = start + (end - start) * i / steps;
      return {r, value: circleMode.radial(r) / circleMode.amplitude};
    });
  }
  const inner = profileBranch(0, 1);
  const outer = profileBranch(7, 1);
  function radiusAt(branch, value) {
    let lo = 0;
    let hi = branch.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >>> 1;
      if (branch[mid].value < value) lo = mid;
      else hi = mid;
    }
    const a = branch[lo];
    const b = branch[hi];
    const fraction = (Math.min(value, 1) - a.value) / (b.value - a.value);
    return a.r + fraction * (b.r - a.r);
  }

  function lobeAt(level) {
    const path = new Path2D();
    const limit = Math.acos(level);
    const inside = [];
    for (let k = 0; k <= 80; k++) {
      const theta = limit * (2 * k / 80 - 1);
      const x = Math.cos(theta);
      const y = Math.sin(theta);
      const value = level / x;
      const rOut = radiusAt(outer, value);
      const rIn = radiusAt(inner, value);
      if (k === 0) path.moveTo(rOut * x, rOut * y);
      else path.lineTo(rOut * x, rOut * y);
      inside.push([rIn * x, rIn * y]);
    }
    for (const [x, y] of inside.reverse()) path.lineTo(x, y);
    path.closePath();
    return path;
  }
  function annulusAt(level) {
    const path = new Path2D();
    const rIn = radiusAt(inner, Math.sqrt(level));
    const rOut = radiusAt(outer, Math.sqrt(level));
    path.arc(0, 0, rOut, 0, period);
    path.moveTo(rIn, 0);
    path.arc(0, 0, rIn, 0, period);
    return path;
  }

  const neutral = [247, 245, 233];
  const positive = [178, 62, 29];
  const negative = [37, 94, 115];
  function ink(value) {
    const amount = Math.min(1, Math.abs(value));
    const endpoint = value >= 0 ? positive : negative;
    const rgb = neutral.map((start, i) => Math.round(start + amount * (endpoint[i] - start)));
    return 'rgb(' + rgb.join(',') + ')';
  }
  const levels = Array.from({length: 47}, (_, i) => {
    const level = (i + 1) / 48;
    return {lobe: lobeAt(level), annulus: annulusAt(level), warm: ink(level), cool: ink(-level), contour: (i + 1) % 6 === 0};
  });

  function drawField(cx, t, density) {
    ctx.save();
    ctx.translate(cx, midY);
    ctx.scale(unit, -unit);
    if (!density) ctx.rotate(-t);
    ctx.lineWidth = 0.78 / unit;
    for (const band of levels) {
      ctx.fillStyle = band.warm;
      const path = density ? band.annulus : band.lobe;
      ctx.fill(path, 'evenodd');
      if (band.contour) {
        ctx.strokeStyle = 'rgba(116, 57, 31, .61)';
        ctx.stroke(path);
      }
      if (!density) {
        ctx.save();
        ctx.rotate(Math.PI);
        ctx.fillStyle = band.cool;
        ctx.fill(band.lobe);
        if (band.contour) {
          ctx.strokeStyle = 'rgba(29, 78, 98, .65)';
          ctx.stroke(band.lobe);
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // g is a density with respect to arclength. Only the curve gets colored.
  function drawSource(cx, t) {
    ctx.save();
    ctx.translate(cx, midY);
    ctx.scale(1, -1);
    ctx.strokeStyle = '#4a524b';
    ctx.lineWidth = 8.5;
    ctx.beginPath();
    ctx.arc(0, 0, unit, 0, period);
    ctx.stroke();
    const arcs = 160;
    ctx.lineWidth = 6.8;
    for (let i = 0; i < arcs; i++) {
      const theta = period * (i + 0.5) / arcs;
      ctx.strokeStyle = ink(circleMode.realSource(theta, t) / circleMode.sourceAmplitude);
      ctx.beginPath();
      ctx.arc(0, 0, unit, period * i / arcs, period * (i + 1) / arcs + .003);
      ctx.stroke();
    }
    ctx.restore();
  }

  function label(text, x, y, math = false) {
    ctx.font = math ? 'italic ' + 15 * labelScale + 'px Georgia, serif' : 11 * labelScale + 'px ui-monospace, monospace';
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = 'rgba(250,249,242,.84)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = '#344038';
    ctx.fillText(text, x, y);
  }
  function drawAxes(cx) {
    ctx.beginPath();
    for (const k of [-2, -1.5, -1, -.5, .5, 1, 1.5, 2]) {
      ctx.moveTo(cx + k * unit, 8);
      ctx.lineTo(cx + k * unit, height - 8);
      ctx.moveTo(cx - 127, midY - k * unit);
      ctx.lineTo(cx + 127, midY - k * unit);
    }
    ctx.lineWidth = .65;
    ctx.strokeStyle = 'rgba(71,94,79,.18)';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 127, midY);
    ctx.lineTo(cx + 127, midY);
    ctx.moveTo(cx, 8);
    ctx.lineTo(cx, height - 8);
    for (const n of [-1, 1]) {
      ctx.moveTo(cx + n * unit, midY - 3);
      ctx.lineTo(cx + n * unit, midY + 3);
      ctx.moveTo(cx - 3, midY - n * unit);
      ctx.lineTo(cx + 3, midY - n * unit);
    }
    ctx.lineWidth = .88;
    ctx.strokeStyle = 'rgba(49,62,53,.55)';
    ctx.stroke();
  }
  function drawPanel(cx, source, t, density) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - 127, 8, 254, height - 16);
    ctx.clip();
    ctx.fillStyle = '#f7f5e9';
    ctx.fillRect(cx - 127, 8, 254, height - 16);
    if (!source) drawField(cx, t, density);
    drawAxes(cx);
    if (source) drawSource(cx, t);
    else {
      ctx.beginPath();
      ctx.arc(cx, midY, unit, 0, period);
      ctx.strokeStyle = 'rgba(255,250,229,.85)';
      ctx.lineWidth = 3.7;
      ctx.stroke();
      ctx.strokeStyle = '#34443a';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
    label('x', cx + 104, midY - 6, true);
    label('y', cx + 6, 28, true);
    label('1', cx + unit + 5, midY + 15);
    ctx.restore();
    ctx.strokeStyle = '#b8c1af';
    ctx.lineWidth = .85;
    ctx.strokeRect(cx - 127, 8, 254, height - 16);
  }

  function paint() {
    const fraction = Number(time.value) / Number(time.max);
    const t = period * fraction;
    const density = modes[1].checked;
    ctx.clearRect(0, 0, width, height);
    drawPanel(width / 4, false, t, density);
    drawPanel(3 * width / 4, true, t, density);
    const clock = 't = ' + (fraction === 1 ? '2π' : t.toFixed(2));
    readout.textContent = clock;
    time.setAttribute('aria-valuetext', clock);
    time.style.setProperty('--filled', (100 * fraction) + '%');
    canvas.setAttribute('aria-label', (density ? 'Stationary wave density' : 'Real part of the wave') + ' in the x,y plane, and real cubic source per unit arclength on the unit circle. ' + clock);
  }
  function updateQuantity() {
    const density = modes[1].checked;
    const peak = circleMode.amplitude;
    fieldName.textContent = density ? '|ψ|²' : 'Re ψ';
    fieldLow.textContent = density ? '0' : '−' + peak.toFixed(2);
    fieldHigh.textContent = density ? (peak * peak).toFixed(2) : '+' + peak.toFixed(2);
    fieldScale.classList.toggle('sequential', density);
    paint();
  }
  function resize() {
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(box.width * ratio));
    canvas.height = Math.max(1, Math.round(box.height * ratio));
    labelScale = Math.min(1.65, Math.max(1, width / box.width));
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    paint();
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    play.classList.remove('playing');
    play.querySelector('.play-label').textContent = 'Play';
    play.setAttribute('aria-label', 'Play wave animation');
  }
  function animate(now) {
    const elapsed = Math.min(1, (now - startedAt) / animationMs);
    if (now - lastPaint > 1000 / 25 || elapsed === 1) {
      time.value = Math.round(elapsed * Number(time.max));
      paint();
      lastPaint = now;
    }
    if (elapsed === 1) stop();
    else frame = requestAnimationFrame(animate);
  }
  play.addEventListener('click', () => {
    if (frame) return stop();
    if (Number(time.value) >= Number(time.max)) time.value = 0;
    startedAt = performance.now() - animationMs * Number(time.value) / Number(time.max);
    play.classList.add('playing');
    play.querySelector('.play-label').textContent = 'Pause';
    play.setAttribute('aria-label', 'Pause wave animation');
    frame = requestAnimationFrame(animate);
  });
  time.addEventListener('input', () => { stop(); paint(); });
  modes.forEach(mode => mode.addEventListener('change', updateQuantity));
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  figure.querySelectorAll('[data-wave-controls]').forEach(el => { el.hidden = false; });
  resize();
  updateQuantity();
  figure.classList.add('wave-ready');
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
})();
