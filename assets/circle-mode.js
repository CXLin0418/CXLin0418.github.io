// Exact focusing standing wave ψ = exp(i(θ + t)) Q(r) on R².
// The radius of the interaction circle and the temporal frequency are both 1.
const circleMode = (() => {
  // I₁ power series on 0 ≤ r ≤ 1 (DLMF 10.25.2).
  function besselI1(r) {
    let term = r / 2;
    let sum = term;
    for (let k = 1; k <= 10; k++) {
      term *= r * r / (4 * k * (k + 1));
      sum += term;
    }
    return sum;
  }

  // K₁(r) = ∫ exp(−r cosh u) cosh u du (DLMF 10.32.9).
  // Only r ≥ 1 is used. The integrand is already below 5e−31 at u = 5.
  const panels = 80;
  const step = 5 / panels;
  const coshes = Array.from({length: panels + 1}, (_, j) => Math.cosh(j * step));
  function besselK1(r) {
    let sum = 0;
    for (let j = 0; j <= panels; j++) {
      const weight = j === 0 || j === panels ? 0.5 : 1;
      sum += weight * Math.exp(-r * coshes[j]) * coshes[j];
    }
    return step * sum;
  }

  const innerTrace = besselI1(1);
  const outerTrace = besselK1(1);
  // The Wronskian gives Q′(1+) − Q′(1−) = −A/(I₁(1)K₁(1)) = −2A³.
  const amplitude = 1 / Math.sqrt(2 * innerTrace * outerTrace);
  const sourceAmplitude = 2 * amplitude ** 3;
  function radial(r) {
    return amplitude * (r <= 1 ? besselI1(r) / innerTrace : besselK1(r) / outerTrace);
  }
  function realSource(theta, t) {
    return -sourceAmplitude * Math.cos(theta + t);
  }
  return {amplitude, radial, sourceAmplitude, realSource};
})();
