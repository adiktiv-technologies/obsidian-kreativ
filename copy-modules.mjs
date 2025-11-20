import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceRoot = path.join(__dirname, "node_modules");
const targetRoot = path.join(
	__dirname,
	".vault",
	".obsidian",
	"plugins",
	"kreativ",
	"node_modules"
);

// Modules that need to be copied
const modulesToCopy = [
	"@huggingface/transformers",
	"@huggingface/jinja",
	"onnxruntime-common",
	"onnxruntime-node",
	"onnxruntime-web",
	"sharp",
];

function copyRecursiveSync(src, dest) {
	const exists = fs.existsSync(src);
	const stats = exists && fs.statSync(src);
	const isDirectory = exists && stats.isDirectory();

	if (isDirectory) {
		if (!fs.existsSync(dest)) {
			fs.mkdirSync(dest, { recursive: true });
		}
		fs.readdirSync(src).forEach((childItemName) => {
			copyRecursiveSync(
				path.join(src, childItemName),
				path.join(dest, childItemName)
			);
		});
	} else {
		fs.copyFileSync(src, dest);
	}
}

console.log("📦 Copying node_modules to plugin directory...");

// Create target node_modules directory
if (!fs.existsSync(targetRoot)) {
	fs.mkdirSync(targetRoot, { recursive: true });
}

// Copy each required module
for (const moduleName of modulesToCopy) {
	const sourcePath = path.join(sourceRoot, moduleName);
	const targetPath = path.join(targetRoot, moduleName);

	if (fs.existsSync(sourcePath)) {
		console.log(`  ✓ Copying ${moduleName}...`);
		copyRecursiveSync(sourcePath, targetPath);
	} else {
		console.log(`  ⚠ ${moduleName} not found, skipping...`);
	}
}

// Copy @onnxruntime-node (note the @ prefix)
const onnxRuntimeNode = "@onnxruntime-node";
const onnxSourcePath = path.join(sourceRoot, onnxRuntimeNode);
const onnxTargetPath = path.join(targetRoot, onnxRuntimeNode);

if (fs.existsSync(onnxSourcePath)) {
	console.log(`  ✓ Copying ${onnxRuntimeNode}...`);
	copyRecursiveSync(onnxSourcePath, onnxTargetPath);
}

console.log("✅ Done copying modules!");
