import { App } from "obsidian";
import * as fs from "fs";
import * as path from "path";

export function getVaultRoot(app: App): string {
	const adapter = app.vault.adapter as any;
	return typeof adapter.getBasePath === "function"
		? adapter.getBasePath()
		: adapter.basePath;
}

export function deleteModelCache(modelId: string, cacheDir: string): boolean {
	try {
		// Primary path: Direct path as stored by transformers.js (e.g., "Xenova/t5-small")
		const primaryPath = path.join(cacheDir, modelId);
		if (deleteDirectory(primaryPath)) return true;

		// Fallback: Try with "models--" prefix format (e.g., "models--Xenova--t5-small")
		const sanitizedId = modelId.replace(/\//g, "--");
		const alternativePath = path.join(cacheDir, `models--${sanitizedId}`);
		if (deleteDirectory(alternativePath)) return true;

		return false;
	} catch {
		return false;
	}
}

function deleteDirectory(directoryPath: string): boolean {
	if (fs.existsSync(directoryPath)) {
		fs.rmSync(directoryPath, { recursive: true, force: true });
		return true;
	}
	return false;
}
