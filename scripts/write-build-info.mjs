import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

function localGitValue(args, fallback = 'unknown') {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || fallback;
  } catch {
    return fallback;
  }
}

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || localGitValue(['rev-parse', 'HEAD']);
const branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || localGitValue(['branch', '--show-current']);
const buildInfo = {
  app: 'airspace-control',
  version: packageJson.version,
  commit,
  branch,
  builtAt: new Date().toISOString(),
};

await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/build-info.json', import.meta.url), `${JSON.stringify(buildInfo, null, 2)}\n`, 'utf8');

console.log(`Build info written for ${commit.slice(0, 12)} (${branch}).`);
