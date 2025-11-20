import { App } from "obsidian";

/**
 * Get absolute vault root path - works on Windows/macOS/Linux
 */
export function getVaultRoot(app: App): string {
    const adapter = app.vault.adapter as any;
    return typeof adapter.getBasePath === "function"
        ? adapter.getBasePath()
        : adapter.basePath;
}
