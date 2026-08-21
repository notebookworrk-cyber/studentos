# Releasing StudentOS

StudentOS ships through the built-in updater: users install once and every
later version is delivered automatically from GitHub Releases.

## Release workflow

```powershell
# 1. Make your changes and verify them locally
npx vitest run
npx tsc -b
npm run build

# 2. Bump the version in package.json (semver)
#    bug fix -> 3.2.1, feature -> 3.3.0, breaking -> 4.0.0

# 3. Commit
git add -A
git commit -m "chore: release 3.2.1"

# 4. Tag and push — this is the release trigger
git tag v3.2.1
git push origin main
git push origin v3.2.1
```

Pushing the `v*` tag runs the `.github/workflows/release.yml` workflow, which:

1. installs dependencies (`npm ci`)
2. runs tests (`vitest run`) and typecheck (`tsc -b`)
3. builds the renderer (`npm run build`)
4. creates a GitHub release with notes generated from commits since the last tag
5. builds the Windows NSIS installer and publishes it plus the update metadata
   (`latest.yml` + `.blockmap`) to the release

Installed StudentOS apps detect the new version on startup, every 4 hours, or
manually from **Settings → Updates**, then download, verify, stage, and install
on restart. User data lives outside the install directory and is never touched.

## Requirements

- The tag version must match `package.json` `version` (e.g. `v3.2.1` ↔ `3.2.1`).
- No additional token is required — the workflow uses the built-in
  `GITHUB_TOKEN`. Only releases from tag pushes are published; ordinary commits
  never trigger a release.
- Update notifications appear only in packaged builds, never in dev mode.
- Differential downloads (blockmap-based) stay enabled for the NSIS target.

## Code signing

No signing certificate is configured, so builds are unsigned. To sign, add a
certificate as repository secrets:

- `CSC_LINK` — path or base64 of the `.pfx`
- `CSC_KEY_PASSWORD` — the pfx password

The workflow passes both to `electron-builder` automatically when present.
Until then the release is published unsigned — do not claim otherwise.

## Local testing of the updater

Point a packaged build at a local update feed instead of GitHub:

1. Build and package `release/` via `npx electron-builder --win`.
2. Serve `release/` over HTTP, e.g. `python -m http.server 8888 -d release`.
3. Run the installed build with `STUDENTOS_UPDATE_FEED=http://localhost:8888`
   and confirm it detects the latest version in that folder's `latest.yml`.

For a real end-to-end test: install the previous version, push a tag for the
new version, wait for CI, then check **Settings → Updates** in the installed app.