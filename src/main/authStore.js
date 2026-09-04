const Store = require('electron-store');
const { safeStorage } = require('electron');

const store = new Store({
  name: 'auth',
  defaults: {
    email: '',
    encryptedPassword: '',
    uid: '',
  },
});

function saveCredentials(email, password, uid) {
  if (!safeStorage.isEncryptionAvailable()) return;
  const encryptedPassword = safeStorage.encryptString(password).toString('base64');
  store.set({ email, encryptedPassword, uid });
}

function getCredentials() {
  if (!safeStorage.isEncryptionAvailable()) return null;
  const email = store.get('email');
  const encryptedPassword = store.get('encryptedPassword');
  const uid = store.get('uid');
  if (!email || !encryptedPassword) return null;
  const password = safeStorage.decryptString(Buffer.from(encryptedPassword, 'base64'));
  return { email, password, uid };
}

function clearCredentials() {
  store.clear();
}

module.exports = { saveCredentials, getCredentials, clearCredentials };
