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
		const sanitizedModelId = "models--" + modelId.replace(/\//g, "--");
		const modelPath = path.join(cacheDir, sanitizedModelId);

		if (fs.existsSync(modelPath)) {
			fs.rmSync(modelPath, { recursive: true, force: true });
			return true;
		}

		const altModelPath = path.join(cacheDir, modelId.replace(/\//g, "--"));
		if (fs.existsSync(altModelPath)) {
			fs.rmSync(altModelPath, { recursive: true, force: true });
			return true;
		}

		return false;
	} catch {
		return false;
	}
}
