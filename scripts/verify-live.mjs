const targets = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : ['https://atc-tr.vercel.app', 'https://atc-tr-play.vercel.app'];
const expectedCommit = process.env.EXPECTED_COMMIT?.trim();

for (const target of targets) {
  const baseUrl = new URL(target);
  const [pageResponse, buildResponse] = await Promise.all([
    fetch(baseUrl, { cache: 'no-store' }),
    fetch(new URL('/build-info.json', baseUrl), { cache: 'no-store' }),
  ]);

  if (!pageResponse.ok) throw new Error(`${baseUrl.origin} returned HTTP ${pageResponse.status}.`);
  if (!buildResponse.ok) throw new Error(`${baseUrl.origin}/build-info.json returned HTTP ${buildResponse.status}.`);

  const html = await pageResponse.text();
  const buildInfo = await buildResponse.json();
  if (!html.includes('<title>Airspace Control</title>')) throw new Error(`${baseUrl.origin} title check failed.`);
  if (buildInfo.app !== 'airspace-control') throw new Error(`${baseUrl.origin} build info check failed.`);
  if (expectedCommit && !String(buildInfo.commit).startsWith(expectedCommit) && !expectedCommit.startsWith(String(buildInfo.commit))) {
    throw new Error(`${baseUrl.origin} serves ${buildInfo.commit}; expected ${expectedCommit}.`);
  }

  console.log(`${baseUrl.origin} READY · ${String(buildInfo.commit).slice(0, 12)} · ${buildInfo.builtAt}`);
}
