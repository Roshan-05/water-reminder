import { LocalNotifications } from '@capacitor/local-notifications';
import { pushUserState } from './dataLayer.js';

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
  markScheduled();
}

async function cancelReminder() {
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  markScheduled();
}

async function rescheduleIn(minutes) {
  await scheduleAt(new Date(Date.now() + minutes * 60000));
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

  await rescheduleIn(state.intervalMinutes);
}

export { requestPermissions, armFromStoredState, rescheduleIn, cancelReminder };
