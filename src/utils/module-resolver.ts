import * as path from "path";
import * as fs from "fs";

export function setupModuleResolution(pluginNodeModules: string): void {
	const Module = require("module");
	const originalResolveFilename = Module._resolveFilename;

	Module._resolveFilename = function (
		request: string,
		parent: any,
		isMain: boolean,
		options?: any
	) {
		if (shouldInterceptModule(request)) {
			const resolvedPath = resolveNativeModule(pluginNodeModules, request);
			if (resolvedPath) return resolvedPath;
		}
		return originalResolveFilename.call(this, request, parent, isMain, options);
	};
}

function shouldInterceptModule(request: string): boolean {
	return request === "onnxruntime-node" ||
		request === "sharp" ||
		request.startsWith("onnxruntime-");
}

function resolveNativeModule(pluginNodeModules: string, request: string): string | null {
	const modulePath = path.join(pluginNodeModules, request);
	const packageJsonPath = path.join(modulePath, "package.json");

	if (fs.existsSync(packageJsonPath)) {
		const packageData = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
		const mainFile = packageData.main || "index.js";
		const resolvedPath = path.join(modulePath, mainFile);
		if (fs.existsSync(resolvedPath)) return resolvedPath;
	}

	const indexPath = path.join(modulePath, "index.js");
	if (fs.existsSync(indexPath)) return indexPath;

	return null;
}
