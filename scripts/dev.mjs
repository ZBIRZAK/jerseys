import { spawn } from 'node:child_process';

const commands = [
  ['node', ['scripts/upload-server.mjs']],
  ['vite', []],
];

const children = commands.map(([command, args]) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
      children.forEach((item) => {
        if (item !== child) item.kill();
      });
    }
  });

  return child;
});

function shutdown() {
  children.forEach((child) => child.kill());
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
