const { spawn } = require('child_process');
const path = require('path');

const electronPath = require('electron');
const projectRoot = path.join(__dirname, '..');

const child = spawn(electronPath, [projectRoot], {
  cwd: projectRoot,
  env: { ...process.env, WR_TEST_AUTOFIRE: '1' },
});

let output = '';
const startedAt = Date.now();

child.stdout.on('data', (chunk) => {
  output += chunk.toString();
  process.stdout.write(chunk);
});

child.stderr.on('data', (chunk) => {
  output += chunk.toString();
  process.stderr.write(chunk);
});

const timeout = setTimeout(() => {
  child.kill();
  console.error('Smoke test timed out waiting for the app to quit.');
  process.exit(1);
}, 15000);

child.on('exit', (code) => {
  clearTimeout(timeout);
  const elapsedMs = Date.now() - startedAt;

  if (elapsedMs < 2000) {
    console.warn(
      'App quit almost immediately — this usually means another instance was ' +
        'already running (single-instance lock) and this run never actually ' +
        'exercised the app. Quit any running instance and re-run.'
    );
  }

  const errorPattern = /Uncaught|TypeError|ReferenceError|ENOENT|Error:/i;
  if (errorPattern.test(output)) {
    console.error('Smoke test FAILED: error pattern detected in output.');
    process.exit(1);
  }

  console.log(`Smoke test passed (exit code ${code}, ${elapsedMs}ms).`);
  process.exit(0);
});
