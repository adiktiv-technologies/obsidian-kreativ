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
		const primaryPath = buildModelCachePath(cacheDir, modelId, true);
		if (deleteDirectory(primaryPath)) return true;

		const alternativePath = buildModelCachePath(cacheDir, modelId, false);
		if (deleteDirectory(alternativePath)) return true;

		return false;
	} catch {
		return false;
	}
}

function buildModelCachePath(cacheDir: string, modelId: string, usePrefix: boolean): string {
	const sanitizedId = modelId.replace(/\//g, "--");
	const filename = usePrefix ? `models--${sanitizedId}` : sanitizedId;
	return path.join(cacheDir, filename);
}

function deleteDirectory(directoryPath: string): boolean {
	if (fs.existsSync(directoryPath)) {
		fs.rmSync(directoryPath, { recursive: true, force: true });
		return true;
	}
	return false;
}
