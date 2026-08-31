# Release checklist

Every production change follows the same gate. Vercel continues to deploy from
GitHub `main`; no second deployment workflow is introduced.

## Before push

1. Create a release branch from an up-to-date, clean `origin/main`.
2. Use Node 24, matching the Vercel production runtime.
3. Run `npm ci` when the lockfile changes.
4. Run `npm run verify`; this also enforces the 530,000-byte production
   JavaScript budget.
5. Review the diff and confirm that generated build output is not committed.
6. Push the release branch and wait for the GitHub `Quality Gate` to pass.
7. Only after the gate passes, merge or fast-forward the verified commit to
   `main` so Vercel can create the production deployment.

## After push

1. Wait for the Vercel production deployment to become ready.
2. Read `/build-info.json` on both production domains and confirm that the
   deployed commit matches GitHub `main`.
3. Open the landing page and start a shift.
4. Open the direct-play domain and issue at least one controller command.
5. Check the browser console for application errors.
6. Verify the relevant desktop and phone acceptance path for the change.

## Commands

```bash
npm run verify
EXPECTED_COMMIT=$(git rev-parse HEAD) npm run verify:live
```

The live script is a fast availability and commit check. It does not replace
the browser interaction test required after every production step.
