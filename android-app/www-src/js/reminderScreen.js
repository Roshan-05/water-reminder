import { observeAuthState, subscribeToUserState, pushUserState } from './dataLayer.js';
import { scheduleAt, computeAndPushNextFireAt } from './scheduler.js';
import { createReminderController } from '../../../src/shared/reminderAnimation.js';
import { playChime } from '../../../src/shared/chime.js';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const confettiEl = document.getElementById('confetti');

observeAuthState(async (user) => {
  if (!user) {
    window.location.href = 'signin.html';
    return;
  }

  const uid = user.uid;
  let state = null;
  const unsubscribe = subscribeToUserState(uid, (remote) => {
    state = remote;
  });

  const spriteConfig = await fetch('assets/sprite/sprite.config.json').then((res) => res.json());
  spriteConfig.imageDir = 'assets/sprite/';

  const controller = createReminderController({
    container: document,
    spriteConfig,
    onDrank: async () => {
      const key = todayKey();
      const isNewDay = !state || state.todayDate !== key;
      const intervalMinutes = state ? state.intervalMinutes : 30;
      const nextFireAt = Date.now() + intervalMinutes * 60000;
      const payload = isNewDay
        ? { todayDate: key, todayCount: 1, nextFireAt }
        : { todayDate: key, todayCountDelta: 1, nextFireAt };
      await pushUserState(uid, payload);
      await scheduleAt(new Date(nextFireAt));
      unsubscribe();
      window.location.href = 'index.html';
    },
    onSnooze: async (minutes) => {
      await computeAndPushNextFireAt(uid, minutes);
      unsubscribe();
      window.location.href = 'index.html';
    },
    onShowConfetti: () => confettiEl.classList.add('active'),
    onHideConfetti: () => confettiEl.classList.remove('active'),
    playChime: () => playChime(state ? state.soundEnabled : true),
  });

  controller.start();
});
