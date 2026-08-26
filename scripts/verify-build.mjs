import { access, readFile, stat } from 'node:fs/promises';

const distUrl = new URL('../dist/', import.meta.url);
const requiredFiles = ['index.html', 'manifest.webmanifest', 'sw.js', 'icon.svg', 'build-info.json'];
const maxJavaScriptBytes = 530_000;

await Promise.all(requiredFiles.map((file) => access(new URL(file, distUrl))));

const html = await readFile(new URL('index.html', distUrl), 'utf8');
const buildInfo = JSON.parse(await readFile(new URL('build-info.json', distUrl), 'utf8'));
const scriptMatch = html.match(/<script[^>]+src="([^"]+\.js)"/);
const stylesheetMatch = html.match(/<link[^>]+href="([^"]+\.css)"/);

if (!html.includes('<title>Airspace Control</title>')) throw new Error('Production HTML title is missing.');
if (!scriptMatch || !stylesheetMatch) throw new Error('Production JS or CSS asset reference is missing.');
if (buildInfo.app !== 'airspace-control') throw new Error('Build info app id is invalid.');
if (!/^[0-9a-f]{7,40}$/i.test(buildInfo.commit)) throw new Error(`Build info commit is invalid: ${buildInfo.commit}`);

const scriptUrl = new URL(scriptMatch[1].replace(/^\//, ''), distUrl);
const scriptStats = await stat(scriptUrl);

await access(scriptUrl);
await access(new URL(stylesheetMatch[1].replace(/^\//, ''), distUrl));

if (scriptStats.size > maxJavaScriptBytes) {
  throw new Error(`Production JS exceeds the ${maxJavaScriptBytes}-byte budget: ${scriptStats.size}`);
}

console.log(
  `Production artifact verified: ${buildInfo.commit.slice(0, 12)} · ${scriptMatch[1]} (${scriptStats.size} bytes) · ${stylesheetMatch[1]}`,
);
