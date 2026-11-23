(() => {
  const figure = document.querySelector(".wave-sheet");
  if (!figure) return;
  const canvas = figure.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const time = figure.querySelector("#wave-time");
  const readout = figure.querySelector("#time-value");
  const play = figure.querySelector("#wave-play");
  const modes = [...figure.querySelectorAll("input[name='wave-mode']")];
  const a = 0.24;
  const chirp = 1.40;
  const extent = 3.1;
  const cols = 78;
  const rows = 56;
  const vertices = [];
  const faces = [];
  let frame = 0;
  let startedAt = 0;
  let lastPaint = 0;

  // Fixed orthographic projection. Sort the ground cells from back to front.
  for (let j = 0; j <= rows; j++) {
    const y = extent * (2 * j / rows - 1);
    for (let i = 0; i <= cols; i++) {
      const x = extent * (2 * i / cols - 1);
      vertices.push({
        radius2: x*x + y*y,
        x: 280 + 54 * (0.87*x + 0.56*y),
        baseline: 157 + 54 * (0.22*x - 0.34*y),
        y: 0,
        z: 0,
      });
      if (i < cols && j < rows) {
        const k = vertices.length - 1;
        faces.push({ k, depth: 0.56*x - 0.87*y, cross: i % 3 === 0 });
      }
    }
  }
  faces.sort((left, right) => left.depth - right.depth);

  // For i ψ_t + Δψ = 0 in two dimensions and s = a - i·chirp,
  // ψ(r,t) = exp(-s r² / q) / q, where q = 1 + 4 i s t.
  function paint() {
    const t = Number(time.value);
    const density = modes[1].checked;
    const qr = 1 + 4*chirp*t;
    const qi = 4*a*t;
    const norm2 = qr*qr + qi*qi;
    const argument = Math.atan2(qi, qr);
    const radialPhase = (chirp*qr + a*qi) / norm2;
    for (const p of vertices) {
      const envelope = Math.exp(-a*p.radius2/norm2) / Math.sqrt(norm2);
      p.z = density ? envelope*envelope : envelope*Math.cos(radialPhase*p.radius2 - argument);
      p.y = p.baseline - 112*p.z;
    }
    ctx.clearRect(0, 0, 560, 282);
    ctx.lineJoin = "round";
    for (const f of faces) {
      const p = vertices[f.k];
      const q = vertices[f.k+1];
      const s = vertices[f.k+cols+1];
      const r = vertices[f.k+cols+2];
      const slope = (q.z-p.z)*cols*.15 - (s.z-p.z)*rows*.09;
      const shade = Math.min(1, Math.max(0, .28 + .32*slope + .16*(1-p.z)));
      const red = Math.round(254 - 43*shade);
      const green = Math.round(231 - 127*shade);
      const blue = Math.round(197 - 133*shade);
      ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
      ctx.beginPath();
      ctx.moveTo(p.x,p.y);
      ctx.lineTo(q.x,q.y);
      ctx.lineTo(r.x,r.y);
      ctx.lineTo(s.x,s.y);
      ctx.closePath();
      ctx.fill();
      // The lighter stroke seals seams. Darker strokes engrave the mesh.
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = .65;
      ctx.stroke();
      ctx.strokeStyle = "rgba(112,46,31,.88)";
      ctx.lineWidth = .73;
      ctx.beginPath();
      ctx.moveTo(s.x,s.y);
      ctx.lineTo(r.x,r.y);
      ctx.stroke();
      if (f.cross) {
        ctx.strokeStyle = "rgba(112,46,31,.64)";
        ctx.lineWidth = .52;
        ctx.beginPath();
        ctx.moveTo(p.x,p.y);
        ctx.lineTo(s.x,s.y);
        ctx.stroke();
      }
    }
    ctx.font = "italic 15px Georgia, serif";
    ctx.fillStyle = "#595f53";
    ctx.fillText("x", 342, 263);
    ctx.fillText("y", 532, 138);
    readout.textContent = "t = " + t.toFixed(2);
    canvas.setAttribute("aria-label", (density ? "Squared magnitude" : "Real part") + " of a freely spreading radial wave packet at time " + t.toFixed(2));
    time.style.setProperty("--filled", (100*t/Number(time.max))+"%");
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(box.width*ratio));
    canvas.height = Math.max(1, Math.round(box.height*ratio));
    ctx.setTransform(canvas.width/560, 0, 0, canvas.height/282, 0, 0);
    paint();
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    play.classList.remove("playing");
    play.querySelector(".play-label").textContent = "Play";
    play.setAttribute("aria-label", "Play wave animation");
  }

  function animate(now) {
    const elapsed = Math.min(1, (now-startedAt)/6500);
    if (now-lastPaint > 1000/25 || elapsed === 1) {
      time.value = (elapsed*Number(time.max)).toFixed(3);
      paint();
      lastPaint = now;
    }
    if (elapsed === 1) stop();
    else frame = requestAnimationFrame(animate);
  }

  play.addEventListener("click", () => {
    if (frame) return stop();
    if (Number(time.value) >= Number(time.max)) time.value = 0;
    startedAt = performance.now() - 6500*Number(time.value)/Number(time.max);
    play.classList.add("playing");
    play.querySelector(".play-label").textContent = "Pause";
    play.setAttribute("aria-label", "Pause wave animation");
    frame = requestAnimationFrame(animate);
  });
  time.addEventListener("input", () => { stop(); paint(); });
  modes.forEach(mode => mode.addEventListener("change", paint));
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
  window.addEventListener("pagehide", stop);
  figure.querySelectorAll("[data-wave-controls]").forEach(el => { el.hidden = false; });
  figure.classList.add("wave-ready");
  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);
})();
