import { observeAuthState, signIn, signUp } from './dataLayer.js';

const form = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const heading = document.getElementById('heading');
const submitBtn = document.getElementById('submit-btn');
const toggleModeBtn = document.getElementById('toggle-mode');
const errorEl = document.getElementById('error');

let mode = 'signin';

observeAuthState((user) => {
  if (user) window.location.href = 'index.html';
});

toggleModeBtn.addEventListener('click', () => {
  mode = mode === 'signin' ? 'signup' : 'signin';
  const isSignUp = mode === 'signup';
  heading.textContent = isSignUp ? 'Create account' : 'Sign in';
  submitBtn.textContent = isSignUp ? 'Create account' : 'Sign in';
  toggleModeBtn.textContent = isSignUp ? 'Already have an account? Sign in' : 'Need an account? Create one';
  errorEl.textContent = '';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorEl.textContent = '';
  submitBtn.disabled = true;
  try {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (mode === 'signup') {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
  } catch (err) {
    errorEl.textContent = err.message || 'Something went wrong.';
    submitBtn.disabled = false;
  }
});
