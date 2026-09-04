(async () => {
  const intervalInput = document.getElementById('interval');
  const soundInput = document.getElementById('sound');
  const status = document.getElementById('status');

  const authStatus = document.getElementById('auth-status');
  const signedOutBlock = document.getElementById('signed-out-block');
  const signedInBlock = document.getElementById('signed-in-block');
  const authEmail = document.getElementById('auth-email');
  const authPassword = document.getElementById('auth-password');
  const authError = document.getElementById('auth-error');

  async function loadSettings() {
    const settings = await window.settingsApi.getSettings();
    intervalInput.value = settings.intervalMinutes;
    soundInput.checked = settings.soundEnabled;
  }

  async function refreshAuthUI() {
    const { signedIn, email } = await window.settingsApi.getAuthStatus();
    authStatus.textContent = signedIn ? `Signed in as ${email}` : 'Not signed in — settings stay local only.';
    signedOutBlock.style.display = signedIn ? 'none' : 'block';
    signedInBlock.style.display = signedIn ? 'block' : 'none';
  }

  await loadSettings();
  await refreshAuthUI();

  document.getElementById('save').addEventListener('click', async () => {
    await window.settingsApi.saveSettings({
      intervalMinutes: Number(intervalInput.value),
      soundEnabled: soundInput.checked,
    });
    status.textContent = 'Saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 1500);
  });

  async function handleAuthAction(action) {
    authError.textContent = '';
    try {
      await action(authEmail.value, authPassword.value);
      authPassword.value = '';
      await refreshAuthUI();
      await loadSettings();
    } catch (err) {
      authError.textContent = err.message || 'Something went wrong.';
    }
  }

  document.getElementById('auth-sign-in').addEventListener('click', () => {
    handleAuthAction(window.settingsApi.signIn);
  });

  document.getElementById('auth-sign-up').addEventListener('click', () => {
    handleAuthAction(window.settingsApi.signUp);
  });

  document.getElementById('auth-sign-out').addEventListener('click', async () => {
    await window.settingsApi.signOut();
    await refreshAuthUI();
  });
})();
