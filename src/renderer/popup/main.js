import { createReminderController } from '../../shared/reminderAnimation.js';
import { playChime } from '../../shared/chime.js';

(async () => {
  const [spriteConfig, settings] = await Promise.all([
    window.waterReminder.getSpriteConfig(),
    window.waterReminder.getSettings(),
  ]);

  createReminderController({
    container: document,
    spriteConfig,
    onDrank: () => window.waterReminder.drankWater(),
    onSnooze: (minutes) => window.waterReminder.snooze(minutes),
    onShowConfetti: () => window.waterReminder.showConfetti(),
    onHideConfetti: () => window.waterReminder.hideConfetti(),
    playChime: () => playChime(settings.soundEnabled),
  }).start();
})();
