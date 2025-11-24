# Copilot Instructions for Obsidian Kreativ

## Project Overview

Obsidian Kreativ is a **desktop-only** Obsidian plugin that brings privacy-first AI capabilities directly into user vaults using local LLMs powered by `transformers.js` and `onnxruntime-node`. No cloud services, API keys, or external tools required.

**Current Implementation:**

-   Sentiment analysis feature with local model inference (Xenova/distilbert-base-uncased-finetuned-sst-2-english)
-   Text translation feature using T5 Small model (Xenova/t5-small)
-   Settings tab with comprehensive configuration options including model management
-   Ribbon icon with context menu for quick access to AI features
-   Model download/delete functionality in settings

**Planned Features:** Chat with vault, summarization, content generation, and knowledge linking

## Architecture

### Entry Point & Plugin Structure

-   [`src/main.ts`](src/main.ts) - Main plugin class (`Kreativ`) extending Obsidian's `Plugin` base class
    -   Initializes [`ModelManager`](src/models/model-manager.ts), [`SentimentPipeline`](src/models/sentiment-pipeline.ts), and [`TranslationPipeline`](src/models/translation-pipeline.ts)
    -   Registers commands (sentiment analysis, text translation, dev reload)
    -   Manages module resolution and model preloading
    -   Handles settings integration and ribbon icon with context menu
-   `main.js` - Build output bundled by esbuild (don't edit directly)
-   Plugin ID: `kreativ` (as defined in [`manifest.json`](manifest.json))

### Module Organization

```
src/
  main.ts                        # Plugin entry point, lifecycle management
  settings.ts                    # Settings interface and defaults
  models/
    model-manager.ts             # Core ML model loading & caching with state management
    sentiment-pipeline.ts        # Sentiment analysis pipeline wrapper
    translation-pipeline.ts      # Text translation pipeline wrapper
  ui/
    sentiment-result-modal.ts    # Modal for displaying analysis results
    translation-result-modal.ts  # Modal for displaying translation results with copy functionality
    settings-tab.ts              # Plugin settings tab UI with model download/delete controls
  utils/
    module-resolver.ts           # Node module resolution setup for transformers.js
    vault.ts                     # Vault path utilities and model cache deletion
```

### Desktop-Only by Design

-   Plugin requires Node.js modules (`fs`, `path`) declared in [`global.d.ts`](global.d.ts)
-   Uses `onnxruntime-node` for local model inference
-   Set `isDesktopOnly: true` in manifest - this is fundamental to the architecture

### Dependencies

-   **AI/ML Stack:** `@huggingface/transformers` (v3.7.6+) for model handling, `onnxruntime-node` (v1.14.0) for inference, `onnxruntime-web` (dev version) for web compatibility layer
-   **Build:** TypeScript (4.7.4), esbuild (0.20.0) with `esbuild-plugin-copy` for asset copying
-   **Electron rebuild required:** Run `npm run rebuild` after installing dependencies to rebuild `onnxruntime-node` for Electron 30.1.0

## Development Workflow

### Build & Dev Commands

```bash
npm run dev        # Watch mode with inline sourcemaps, auto-copies to .vault/
npm run build      # Production build (minified, no sourcemaps)
npm run rebuild    # Rebuild native modules (onnxruntime-node) for Electron 30.1.0
npm run version    # Bump version in manifest.json & versions.json, then git add
```

### Hot Reload Development

-   `npm run dev` watches for changes and **automatically copies** built files to `.vault/.obsidian/plugins/kreativ/`
-   The `.vault/` directory is a local test vault (not in git)
-   Files copied: `main.js`, `manifest.json`, `styles.css`
-   After save, reload plugin in Obsidian (Ctrl/Cmd+R or disable/enable plugin)

### Build Configuration (`esbuild.config.mjs`)

-   Entry: `main.ts` (note: NOT `src/main.ts` - esbuild handles path resolution)
-   Output: CommonJS (`format: "cjs"`) targeting ES2018
-   **Critical externals:** `obsidian`, `electron`, all `@codemirror/*` packages, and builtin Node modules
-   Copy plugin moves artifacts to `.vault/.obsidian/plugins/kreativ/` for testing

## Code Conventions

### TypeScript Configuration

-   `baseUrl: "./src"` - import paths relative to src/ directory
-   `strictNullChecks: true` - handle nullability explicitly
-   `target: "ES6"` - modern JS features available
-   Type checking runs before production builds (`tsc -noEmit -skipLibCheck`)

### Styling

-   Use CSS custom properties from Obsidian's theme system:
    -   `var(--background-secondary)` for backgrounds
    -   `var(--interactive-accent)` for primary actions
    -   `var(--text-error)` for errors
    -   `var(--font-monospace)` for code/IDs
-   Class naming: `kreativ-*` prefix (e.g., `kreativ-model-card`, `kreativ-status-badge`)
-   Responsive breakpoint: `@media (max-width: 768px)`

### Component Patterns (from styles.css)

-   Status badges: `kreativ-status-*` variants (available, downloading, cached, loading, error)
-   Progress indicators: `kreativ-progress-container` with optional indeterminate animation
-   Model cards: `kreativ-model-card` with hover effects and absolute-positioned badges
-   Empty states: `kreativ-empty-state` with centered content

## Version Management

### Releasing New Versions

1. Update `version` in `package.json`
2. Run `npm run version` - this script:
    - Reads version from `package.json` (`process.env.npm_package_version`)
    - Updates `manifest.json` with new version
    - Adds entry to `versions.json` mapping version → `minAppVersion`
    - Stages changes for commit (`git add`)
3. Commit and tag the release

### Version Files

-   `manifest.json` - Current plugin version and metadata
-   `versions.json` - Historical version compatibility map (version → minAppVersion)
-   `version-bump.mjs` - Automated sync script run via npm version hook

## Critical Patterns

### Node.js Integration

-   Declare Node modules in `global.d.ts` before using in plugin code
-   Example: `declare module 'fs';` enables `import fs from 'fs';`
-   Native modules like `onnxruntime-node` require electron-rebuild after install

### Obsidian Plugin API

-   Extend `Plugin` class from `obsidian` package
-   Plugin lifecycle: `onload()` for initialization, `onunload()` for cleanup
-   Use Obsidian's type definitions (installed via `obsidian` package)

### Local-First AI Philosophy

-   All ML operations must run on-device using transformers.js
-   No network requests for AI features (downloading models during setup is acceptable)
-   Cache models locally for offline operation
-   Progressive enhancement: work without internet after initial setup

## Testing & Debugging

### Local Vault Testing

-   Test vault location: `.vault/` (gitignored)
-   Plugin auto-installs to `.vault/.obsidian/plugins/kreativ/` during dev
-   Enable Developer Tools in Obsidian: View → Toggle Developer Tools
-   Console logs appear in Obsidian's DevTools, not terminal

### Common Issues

-   **Native module errors:** Run `npm run rebuild` to recompile for Electron
-   **Plugin not loading:** Check console for errors, verify manifest.json syntax
-   **Changes not appearing:** Ensure dev build is running, try plugin reload in Obsidian

## Repository Context

-   **Owner:** adiktiv-technologies
-   **License:** MIT
-   **Branch:** main (default)
-   **Current Status:** Working implementation with sentiment analysis and text translation features. Plugin demonstrates local model loading, inference, settings management, and UI integration patterns with ribbon icon and context menu.
