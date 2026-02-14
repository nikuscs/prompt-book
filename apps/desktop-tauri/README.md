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
bun run build
bun run tauri build
```

## Stack

- Tauri v2
- React 19 + Vite
- Tailwind CSS v4
- Rust + TypeScript strict checks
