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
		request.startsWith("onnxruntime-") ||
		request.startsWith("@huggingface/");
}

function resolveNativeModule(pluginNodeModules: string, request: string): string | null {
	const modulePath = path.join(pluginNodeModules, request);

	// Special case for @huggingface/transformers - use the Node.js CommonJS build
	if (request === "@huggingface/transformers") {
		const cjsPath = path.join(modulePath, "dist", "transformers.node.cjs");
		if (fs.existsSync(cjsPath)) return cjsPath;
	}

	const packageJsonPath = path.join(modulePath, "package.json");

	if (fs.existsSync(packageJsonPath)) {
		const packageData = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
		// Support both 'main' and 'exports' fields for modern packages
		const mainFile = packageData.main || packageData.module || "index.js";
		const resolvedPath = path.join(modulePath, mainFile);
		if (fs.existsSync(resolvedPath)) return resolvedPath;
	}

	// Try common entry points
	const possiblePaths = [
		path.join(modulePath, "index.js"),
		path.join(modulePath, "dist", "index.js"),
		path.join(modulePath, "lib", "index.js"),
	];

	for (const possiblePath of possiblePaths) {
		if (fs.existsSync(possiblePath)) return possiblePath;
	}

	return null;
}
