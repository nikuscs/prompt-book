# PromptBook Desktop (Tauri)

Desktop app package for PromptBook.

## Run

```bash
bun install
bun run tauri dev
```

## Validate

```bash
bun run check
```

## Icons

The app icon source is `icon.icon` (Apple Icon Composer bundle).

**macOS composited icon** (rounded corners, gradient, shadow):

```bash
mkdir -p /tmp/icon-build
xcrun actool ./icon.icon --app-icon icon --compile /tmp/icon-build \
  --output-partial-info-plist /dev/null --target-device mac \
  --minimum-deployment-target 11.0 --platform macosx \
  --include-all-app-icons --enable-on-demand-resources NO
cp /tmp/icon-build/icon.icns src-tauri/icons/icon.icns
```

**Platform icons** (ico, PNGs for Windows/Linux):

```bash
./node_modules/.bin/tauri icon ./icon.icon/Assets/logo.png
```

## Build

```bash
TAURI_SIGNING_PRIVATE_KEY_PATH=~/.tauri/promptbook.key bun run tauri build
```

The signing key is required for the updater to verify updates. Generate one with:

```bash
./node_modules/.bin/tauri signer generate -w ~/.tauri/promptbook.key --ci -p ""
```

## Updater

Auto-updates are served from GitHub Releases. When creating a release:

1. Build with the signing key (see Build above)
2. Upload the generated artifacts from `src-tauri/target/release/bundle/`
3. Upload the `latest.json` file (generated alongside the bundle)
4. Tag the release matching the version in `tauri.conf.json`

The app checks for updates on launch and every hour.

## Installing on macOS (unsigned)

The app is not code-signed with an Apple Developer certificate. macOS will block it by default. To allow it:

**Option A — System Settings (recommended):**

1. Open the `.dmg` and drag PromptBook to Applications
2. Open PromptBook — macOS will show "cannot be opened"
3. Go to **System Settings → Privacy & Security** and click **Open Anyway**

**Option B — Terminal:**

```bash
xattr -cr /Applications/PromptBook.app
```

## Stack

- Tauri v2
- React 19 + Vite
- Tailwind CSS v4
- Rust + TypeScript strict checks
