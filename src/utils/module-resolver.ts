import * as path from "path";
import * as fs from "fs";

/**
 * Setup custom module resolution for native dependencies
 */
export function setupModuleResolution(pluginNodeModules: string): void {
    const Module = require("module");
    const originalResolveFilename = Module._resolveFilename;

    Module._resolveFilename = function (
        request: string,
        parent: any,
        isMain: boolean,
        options?: any
    ) {
        // Intercept native module requests
        if (
            request === "onnxruntime-node" ||
            request === "sharp" ||
            request.startsWith("onnxruntime-")
        ) {
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

                // Fallback to index.js
                const indexPath = path.join(modulePath, "index.js");
                if (fs.existsSync(indexPath)) {
                    return indexPath;
                }
            } catch (error) {
                console.error(`Failed to resolve ${request}:`, error);
            }
        }

        return originalResolveFilename.call(this, request, parent, isMain, options);
    };
}
