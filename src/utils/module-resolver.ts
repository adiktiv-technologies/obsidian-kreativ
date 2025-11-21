import * as path from "path";
import * as fs from "fs";

const NATIVE_MODULES = ["onnxruntime-node", "sharp"];

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
            const resolved = tryResolveModule(pluginNodeModules, request);
            if (resolved) {
                return resolved;
            }
        }

        return originalResolveFilename.call(this, request, parent, isMain, options);
    };
}

function shouldInterceptModule(request: string): boolean {
    return NATIVE_MODULES.includes(request) || request.startsWith("onnxruntime-");
}

function tryResolveModule(pluginNodeModules: string, request: string): string | null {
    try {
        const modulePath = path.join(pluginNodeModules, request);
        const packageJsonPath = path.join(modulePath, "package.json");

        if (fs.existsSync(packageJsonPath)) {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
            const mainFile = pkg.main || "index.js";
            const resolvedPath = path.join(modulePath, mainFile);

            if (fs.existsSync(resolvedPath)) {
                return resolvedPath;
            }
        }

        const indexPath = path.join(modulePath, "index.js");
        if (fs.existsSync(indexPath)) {
            return indexPath;
        }
    } catch {
    }

    return null;
}
