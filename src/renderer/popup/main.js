(async () => {
  const config = await window.waterReminder.getSpriteConfig();
  const basePath = '../../../assets/sprite/';

  const spriteEl = document.getElementById('sprite');
  const bubbleEl = document.getElementById('bubble');
  const btnYes = document.getElementById('btn-yes');
  const btnSnooze = document.getElementById('btn-snooze');

  const animator = new SpriteAnimator(spriteEl, basePath);
  const walkConfig = config.walk;

  spriteEl.style.height = config.displayHeightPx + 'px';
  spriteEl.style.transition = `right ${walkConfig.durationMs}ms linear`;
  spriteEl.style.right = `-${walkConfig.distancePx}px`;

  animator.play(config.states.walk);
  spriteEl.addEventListener('transitionend', onWalkComplete, { once: true });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      spriteEl.style.right = `${walkConfig.haltOffsetFromRightPx}px`;
    });
  });

  function onWalkComplete() {
    animator.play(config.states.idle, {
      onComplete: () => {
        animator.play(config.states.sip, { onComplete: showBubble });
      },
    });
  }

  function showBubble() {
    bubbleEl.classList.add('visible');
  }

  btnYes.addEventListener('click', () => window.waterReminder.drankWater());
  btnSnooze.addEventListener('click', () => window.waterReminder.snooze());
})();
