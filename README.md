# Jump

Vimium-style keyboard-driven hint navigation for websites as a Firefox extension.

## What it does

- Press `Ctrl+J` to toggle hints on/off.
- Works on any website — no per-site configuration needed.
- Unique multi-character labels appear on every clickable element.
- Type characters to filter hints by prefix — matched characters dim.
- When only one hint matches, the element is clicked automatically.
- Press `Backspace` to undo the last typed character.
- Press `Escape` to dismiss hints.
- Hints are filtered to visible elements in the current viewport.

## Install (from release)

1. Download the `.xpi` asset from GitHub Releases.
2. Open Firefox.
3. Go to `about:addons`.
4. Click the gear icon → **Install Add-on From File...**
5. Select the downloaded `.xpi`.

## Development

### Requirements

- [Bun](https://bun.sh)
- Firefox (for extension testing)

### Setup

```bash
bun install
```

### Build

```bash
bun run build
```

### Run in Firefox (temporary add-on)

```bash
bunx web-ext run --source-dir .
```

## Project structure

- `src/content.ts` — key handling + interaction flow
- `src/hints.ts` — hint creation, labeling, filtering, viewport detection
- `manifest.json` — extension manifest

## Release

GitHub Actions workflow (`.github/workflows/release.yml`) builds and publishes an installable `.xpi` on tag push (`v*`).

Example:

```bash
jj tag create v0.1.1 -r @
jj git push --tags
```
