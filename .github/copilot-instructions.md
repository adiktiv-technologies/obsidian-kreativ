# Obsidian Plugin Development Guide

## Project Context

This is the **Kreativ** Obsidian community plugin built with TypeScript and bundled with esbuild. The entry point is `src/main.ts`, which compiles to `main.js` at the project root and is loaded by Obsidian at runtime.

## Critical Architecture

-   **Single-file bundle**: All code must be bundled into `main.js` (no external runtime dependencies)
-   **Plugin lifecycle**: Everything happens in the `Plugin` class via `onload()` and `onunload()`
-   **Settings pattern**: Use `loadData()`/`saveData()` for persistence, with defaults merged via `Object.assign()`
-   **Cleanup is mandatory**: Use `this.registerDomEvent()`, `this.registerInterval()`, `this.registerEvent()` for automatic cleanup on unload

## Build & Development Workflow

```bash
npm install           # First-time setup
npm run dev          # Watch mode (auto-recompiles + auto-copies to .vault/)
npm run build        # Production build (minified, no sourcemaps)
```

**Automatic local testing**: The esbuild config uses `esbuild-plugin-copy` to automatically copy `main.js`, `manifest.json`, and `styles.css` to `.vault/.obsidian/plugins/kreativ/` on every build. Just reload Obsidian (Ctrl/Cmd+R) to test changes.

The `dev` script runs esbuild in watch mode with inline sourcemaps. The `build` script includes TypeScript type checking (`tsc -noEmit`) before bundling.

## Key Files

-   `src/main.ts`: Plugin entry point (exports `Kreativ` class with sample commands, modals, settings)
-   `main.js`: Compiled bundle (generated, gitignored, auto-copied to `.vault/` in dev mode)
-   `manifest.json`: Plugin metadata (id: `sample-plugin`, name: `Sample Plugin`). **Never change `id` after first release.**
-   `esbuild.config.mjs`: Bundles TypeScript → JavaScript with Obsidian API externalized + auto-copy plugin for local testing
-   `version-bump.mjs`: Syncs version between `manifest.json`, `package.json`, and `versions.json` (run via `npm version`)
-   `.vault/`: Local test vault (gitignored, auto-populated by esbuild-plugin-copy)

## Code Patterns in This Project

### Command Registration (from `src/main.ts`)

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

### Settings Pattern (from `src/main.ts`)

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

### Modal Pattern (from `src/main.ts`)

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

-   **File structure**: Source in `src/`, currently single-file (`src/main.ts`). For larger plugins, split into separate modules for commands, settings, UI components (see `AGENTS.md` for detailed structure recommendations)
-   **Code style**: EditorConfig enforces tabs (4-space width) and LF line endings. ESLint configured with TypeScript rules
-   **TypeScript strict mode**: `tsconfig.json` uses `strictNullChecks` and `noImplicitAny`
-   **No Node.js APIs**: Plugin is `isDesktopOnly: false` in manifest, so avoid Node/Electron APIs for mobile compatibility
-   **Bundler externals**: `obsidian`, `electron`, and CodeMirror packages are externalized in `esbuild.config.mjs` (provided by Obsidian runtime)
-   **Entry point**: `esbuild.config.mjs` references `main.ts` at root, but actual source is `src/main.ts` (symlink or copy pattern)

## Release Process

1. Update `minAppVersion` in `manifest.json` if using newer APIs
2. Run `npm version patch|minor|major` (triggers `version-bump.mjs`)
3. Create GitHub release with tag matching version (no `v` prefix)
4. Attach `manifest.json`, `main.js`, `styles.css` as release assets

## Common Pitfalls

-   **Plugin ID mismatch**: For local testing, `manifest.json` `id` must match the folder name in `.obsidian/plugins/` (currently `kreativ` in `.vault/`)
-   **Missing cleanup**: Forgetting to use `register*` helpers causes memory leaks
-   **Hardcoded paths**: Avoid assuming desktop-only behavior (status bar doesn't work on mobile)
-   **Build artifacts in git**: Never commit `node_modules/`, `main.js`, or `.vault/` (all in `.gitignore`)
-   **Source path confusion**: Edit `src/main.ts`, not the compiled `main.js` at root

## Essential Reading

Comprehensive development guidelines are in `AGENTS.md` (includes security, privacy, UX conventions, and code organization patterns).
