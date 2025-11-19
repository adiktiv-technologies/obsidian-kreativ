# Obsidian Plugin Development Guide

## Project Context

This is an **Obsidian community plugin** built with TypeScript and bundled with esbuild. The entry point is `main.ts`, which compiles to `main.js` and is loaded by Obsidian at runtime. Currently based on the official sample plugin template.

## Critical Architecture

-   **Single-file bundle**: All code must be bundled into `main.js` (no external runtime dependencies)
-   **Plugin lifecycle**: Everything happens in the `Plugin` class via `onload()` and `onunload()`
-   **Settings pattern**: Use `loadData()`/`saveData()` for persistence, with defaults merged via `Object.assign()`
-   **Cleanup is mandatory**: Use `this.registerDomEvent()`, `this.registerInterval()`, `this.registerEvent()` for automatic cleanup on unload

## Build & Development Workflow

```bash
npm install           # First-time setup
npm run dev          # Watch mode (auto-recompiles on save)
npm run build        # Production build (minified, no sourcemaps)
```

**Testing locally**: Copy `main.js`, `manifest.json`, `styles.css` to `<vault>/.obsidian/plugins/<plugin-id>/`, then reload Obsidian and enable in Settings → Community plugins.

The `dev` script runs esbuild in watch mode with inline sourcemaps. The `build` script includes TypeScript type checking (`tsc -noEmit`) before bundling.

## Key Files

-   `main.ts`: Plugin entry point (currently contains sample code demonstrating commands, modals, settings, ribbon icons)
-   `manifest.json`: Plugin metadata (id, version, minAppVersion, description). **Never change `id` after first release.**
-   `esbuild.config.mjs`: Bundles TypeScript → JavaScript with Obsidian API externalized
-   `version-bump.mjs`: Syncs version between `manifest.json`, `package.json`, and `versions.json` (run via `npm version`)

## Code Patterns in This Project

### Command Registration (from `main.ts`)

```typescript
this.addCommand({
	id: "unique-command-id",
	name: "Display Name",
	callback: () => {
		/* action */
	},
});

// Editor commands receive current editor instance
this.addCommand({
	id: "editor-command",
	editorCallback: (editor: Editor, view: MarkdownView) => {
		editor.replaceSelection("text");
	},
});
```

### Settings Pattern (from `main.ts`)

```typescript
interface MyPluginSettings {
    mySetting: string;
}
const DEFAULT_SETTINGS: MyPluginSettings = { mySetting: 'default' }

async onload() {
    // Merge saved settings over defaults
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
}

async saveSettings() {
    await this.saveData(this.settings);
}
```

### Modal Pattern (from `main.ts`)

```typescript
class SampleModal extends Modal {
	onOpen() {
		this.contentEl.setText("Content");
	}
	onClose() {
		this.contentEl.empty(); // Cleanup
	}
}
```

## Project Conventions

-   **File structure**: Currently single-file (`main.ts`). For production plugins, split into `src/` with separate modules for commands, settings, UI components (see `AGENTS.md` for detailed structure recommendations)
-   **TypeScript strict mode**: `tsconfig.json` uses `strictNullChecks` and `noImplicitAny`
-   **No Node.js APIs**: Plugin is `isDesktopOnly: false` in manifest, so avoid Node/Electron APIs for mobile compatibility
-   **Bundler externals**: `obsidian`, `electron`, and CodeMirror packages are externalized in `esbuild.config.mjs` (provided by Obsidian runtime)

## Release Process

1. Update `minAppVersion` in `manifest.json` if using newer APIs
2. Run `npm version patch|minor|major` (triggers `version-bump.mjs`)
3. Create GitHub release with tag matching version (no `v` prefix)
4. Attach `manifest.json`, `main.js`, `styles.css` as release assets

## Common Pitfalls

-   **Plugin ID mismatch**: For local testing, `manifest.json` `id` must match the folder name in `.obsidian/plugins/`
-   **Missing cleanup**: Forgetting to use `register*` helpers causes memory leaks
-   **Hardcoded paths**: Avoid assuming desktop-only behavior (status bar doesn't work on mobile)
-   **Build artifacts in git**: Never commit `node_modules/` or `main.js`

## Essential Reading

Comprehensive development guidelines are in `AGENTS.md` (includes security, privacy, UX conventions, and code organization patterns).
