import { LocalNotifications } from '@capacitor/local-notifications';
import { registerPlugin } from '@capacitor/core';
import { pushUserState } from './dataLayer.js';

const FullScreenReminder = registerPlugin('FullScreenReminder');
const OverlayReminder = registerPlugin('OverlayReminder');

const REMINDER_ID = 1;
const CHANNEL_ID = 'water-reminder';
const LAST_SCHEDULED_KEY = 'waterReminder:lastScheduledAt';
const SKIP_ARM_WINDOW_MS = 5000;
let channelReady = false;

function markScheduled() {
  try {
    sessionStorage.setItem(LAST_SCHEDULED_KEY, String(Date.now()));
  } catch (err) {
    console.error('[scheduler] markScheduled failed:', err);
  }
}

function recentlyScheduled() {
  try {
    const last = Number(sessionStorage.getItem(LAST_SCHEDULED_KEY) || 0);
    return Date.now() - last < SKIP_ARM_WINDOW_MS;
  } catch (err) {
    return false;
  }
}

async function ensureChannel() {
  if (channelReady) return;
  channelReady = true;
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Water reminders',
      importance: 4,
    });
  } catch (err) {
    console.error('[scheduler] createChannel failed:', err);
  }
}

async function requestPermissions() {
  await LocalNotifications.requestPermissions();
}

async function scheduleAt(atDate) {
  await ensureChannel();
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          title: 'Water Reminder',
          body: 'Time for a water break!',
          channelId: CHANNEL_ID,
          schedule: { at: atDate, allowWhileIdle: true },
        },
      ],
    });
  } catch (err) {
    console.error('[scheduler] LocalNotifications.schedule failed:', err);
  }
  try {
    await FullScreenReminder.schedule({ atMillis: String(atDate.getTime()) });
  } catch (err) {
    console.error('[scheduler] FullScreenReminder.schedule failed:', err);
  }
  markScheduled();
}

async function cancelReminder() {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  } catch (err) {
    console.error('[scheduler] LocalNotifications.cancel failed:', err);
  }
  try {
    await FullScreenReminder.cancel();
  } catch (err) {
    console.error('[scheduler] FullScreenReminder.cancel failed:', err);
  }
  markScheduled();
}

async function canUseFullScreenIntent() {
  try {
    const { allowed } = await FullScreenReminder.canUseFullScreenIntent();
    return allowed;
  } catch (err) {
    console.error('[scheduler] canUseFullScreenIntent failed:', err);
    return true;
  }
}

async function openFullScreenIntentSettings() {
  try {
    await FullScreenReminder.openFullScreenIntentSettings();
  } catch (err) {
    console.error('[scheduler] openFullScreenIntentSettings failed:', err);
  }
}

async function canDrawOverlays() {
  try {
    const { allowed } = await OverlayReminder.canDrawOverlays();
    return allowed;
  } catch (err) {
    console.error('[scheduler] canDrawOverlays failed:', err);
    return false;
  }
}

async function requestOverlayPermission() {
  try {
    await OverlayReminder.requestOverlayPermission();
  } catch (err) {
    console.error('[scheduler] requestOverlayPermission failed:', err);
  }
}

async function showOverlayNow() {
  try {
    await OverlayReminder.showNow();
    return true;
  } catch (err) {
    console.error('[scheduler] showOverlayNow failed:', err);
    return false;
  }
}

async function rescheduleIn(minutes) {
  await scheduleAt(new Date(Date.now() + minutes * 60000));
}

async function computeAndPushNextFireAt(uid, minutes) {
  const nextFireAt = Date.now() + minutes * 60000;
  await pushUserState(uid, { nextFireAt });
  await scheduleAt(new Date(nextFireAt));
  return nextFireAt;
}

async function armFromStoredState(uid, state) {
  if (recentlyScheduled()) return;

  if (state.paused) {
    await cancelReminder();
    return;
  }

  if (state.pausedUntil) {
    const remainingMs = new Date(state.pausedUntil).getTime() - Date.now();
    if (remainingMs > 0) {
      await cancelReminder();
      return;
    }
    await pushUserState(uid, { pausedUntil: null });
  }

  if (state.nextFireAt) {
    await scheduleAt(new Date(state.nextFireAt));
  } else {
    await computeAndPushNextFireAt(uid, state.intervalMinutes);
  }
}

export {
  requestPermissions,
  armFromStoredState,
  rescheduleIn,
  scheduleAt,
  computeAndPushNextFireAt,
  cancelReminder,
  canUseFullScreenIntent,
  openFullScreenIntentSettings,
  canDrawOverlays,
  requestOverlayPermission,
  showOverlayNow,
};
