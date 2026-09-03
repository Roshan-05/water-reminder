(async () => {
  const settings = await window.settingsApi.getSettings();
  const intervalInput = document.getElementById('interval');
  const snoozeInput = document.getElementById('snooze');
  const status = document.getElementById('status');

  intervalInput.value = settings.intervalMinutes;
  snoozeInput.value = settings.snoozeMinutes;

  document.getElementById('save').addEventListener('click', async () => {
    await window.settingsApi.saveSettings({
      intervalMinutes: Number(intervalInput.value),
      snoozeMinutes: Number(snoozeInput.value),
    });
    status.textContent = 'Saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 1500);
  });
})();
