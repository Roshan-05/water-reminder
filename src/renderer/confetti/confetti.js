(() => {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#577590', '#277da1'];
  const PARTICLE_COUNT = 160;

  const rand = (min, max) => Math.random() * (max - min) + min;

  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: rand(0, canvas.width),
    y: rand(-60, 20),
    w: rand(6, 12),
    h: rand(8, 16),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    vy: rand(4, 8),
    vx: rand(-1.2, 1.2),
    rotation: rand(0, Math.PI * 2),
    rotationSpeed: rand(-0.15, 0.15),
    sway: rand(0.5, 2),
    swayOffset: rand(0, Math.PI * 2),
  }));

  let frame = 0;

  function tick() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.y += p.vy;
      p.x += p.vx + Math.sin(frame * 0.05 + p.swayOffset) * p.sway * 0.2;
      p.rotation += p.rotationSpeed;
      if (p.y > canvas.height + 20) {
        p.y = rand(-40, -10);
        p.x = rand(0, canvas.width);
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    requestAnimationFrame(tick);
  }

  tick();
})();
