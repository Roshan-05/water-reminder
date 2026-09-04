import { PROMPTS } from './prompts.js';

const WALK_IN_EASING = 'linear';
const WALK_OUT_EASING = 'linear';
const WALK_BOB_PX = 4;

export function createReminderController({
  container,
  spriteConfig,
  onDrank,
  onSnooze,
  playChime,
  onShowConfetti = () => {},
  onHideConfetti = () => {},
}) {
  const character = container.querySelector('#character');
  const img = container.querySelector('#sprite-img');
  const bubble = container.querySelector('#bubble');
  const bubbleText = container.querySelector('#bubble-text');
  const btnYes = container.querySelector('#btn-yes');
  const snoozeButtons = Array.from(container.querySelectorAll('.snooze-btn'));

  const dir = spriteConfig.imageDir;
  const walk = spriteConfig.walk;
  const timing = spriteConfig.timing;
  const travelPx = walk.distancePx + walk.haltOffsetFromRightPx;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let cycleTimer = null;

  function stopFrames() {
    if (cycleTimer) {
      clearInterval(cycleTimer);
      cycleTimer = null;
    }
  }

  function applyFrame(frame, index, bobPx) {
    img.src = dir + frame;
    img.style.transform = bobPx && index % 2 !== 0 ? `translateY(-${bobPx}px)` : 'translateY(0)';
  }

  function setFrame(frame) {
    stopFrames();
    applyFrame(frame, 0, 0);
  }

  function playFrames(frames, frameDurationMs, bobPx = 0) {
    stopFrames();
    let i = 0;
    applyFrame(frames[0], 0, bobPx);
    if (frames.length > 1 && frameDurationMs) {
      cycleTimer = setInterval(() => {
        i = (i + 1) % frames.length;
        applyFrame(frames[i], i, bobPx);
      }, frameDurationMs);
    }
  }

  async function onWalkInComplete() {
    setFrame(spriteConfig.hold.frame);
    await sleep(timing.holdMs);

    setFrame(spriteConfig.drink.frames[0]);
    await sleep(timing.drinkFrame1Ms);
    setFrame(spriteConfig.drink.frames[1]);
    await sleep(timing.drinkFrame2Ms);
    setFrame(spriteConfig.drink.frames[0]);
    await sleep(timing.drinkFrame3Ms);

    setFrame(spriteConfig.idle.frame);
    await sleep(timing.idleMs);

    showBubble();
  }

  function showBubble() {
    bubbleText.textContent = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    bubble.classList.add('visible');
    if (playChime) playChime();
  }

  function playWalkOut(onDone) {
    playFrames(spriteConfig.walkOut.frames, spriteConfig.walkOut.frameDurationMs, WALK_BOB_PX);
    character.addEventListener(
      'transitionend',
      () => {
        stopFrames();
        onDone();
      },
      { once: true }
    );
    character.style.transition = `transform ${walk.durationMs}ms ${WALK_OUT_EASING}`;
    character.style.transform = `translateX(${travelPx}px)`;
  }

  async function walkOutAndClose(onDone) {
    bubble.classList.remove('visible');
    await sleep(timing.hideBubbleDelayMs);
    playWalkOut(onDone);
  }

  function disableAllButtons() {
    btnYes.disabled = true;
    snoozeButtons.forEach((btn) => { btn.disabled = true; });
  }

  async function handleYes() {
    disableAllButtons();
    bubble.classList.remove('visible');
    await sleep(timing.hideBubbleDelayMs);
    onShowConfetti();
    await sleep(timing.confettiMs);
    onHideConfetti();
    playWalkOut(() => onDrank());
  }

  function handleSnoozeClick(event) {
    const minutes = Number(event.currentTarget.dataset.minutes);
    disableAllButtons();
    walkOutAndClose(() => onSnooze(minutes));
  }

  function start() {
    character.style.height = `${spriteConfig.displayHeightPx}px`;
    character.style.right = `${walk.haltOffsetFromRightPx}px`;
    character.style.transition = 'none';
    character.style.transform = `translateX(${travelPx}px)`;
    playFrames(spriteConfig.walkIn.frames, spriteConfig.walkIn.frameDurationMs, WALK_BOB_PX);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        character.style.transition = `transform ${walk.durationMs}ms ${WALK_IN_EASING}`;
        character.style.transform = 'translateX(0)';
      });
    });

    character.addEventListener('transitionend', onWalkInComplete, { once: true });

    btnYes.addEventListener('click', handleYes);
    snoozeButtons.forEach((btn) => btn.addEventListener('click', handleSnoozeClick));
  }

  function destroy() {
    stopFrames();
    btnYes.removeEventListener('click', handleYes);
    snoozeButtons.forEach((btn) => btn.removeEventListener('click', handleSnoozeClick));
  }

  return { start, destroy };
}
