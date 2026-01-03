import { execSync } from "child_process";
import { createWriteStream, readFileSync } from "fs";
import { dirname, join } from "path";
import process from "process";
import { fileURLToPath } from "url";
import archiver from "archiver";

const rootDir = dirname(fileURLToPath(import.meta.url));
const distDir = join(rootDir, "dist");

// Get plugin name from manifest
const zipName = `${
	JSON.parse(readFileSync(join(rootDir, "manifest.json"), "utf-8")).id
}.zip`;

async function createZip() {
	const zipPath = join(distDir, zipName);
	const output = createWriteStream(zipPath);
	const archive = archiver("zip", { zlib: { level: 9 } });

	return new Promise((resolve, reject) => {
		output.on("close", resolve);
		archive.on("error", reject);

		archive.pipe(output);

		// Add files with flat structure (no directory prefix)
		archive.file(join(distDir, "main.js"), { name: "main.js" });
		archive.file(join(distDir, "manifest.json"), { name: "manifest.json" });
		archive.file(join(distDir, "styles.css"), { name: "styles.css" });

		archive.finalize();
	});
}

async function build() {
	console.log("🔍 Running TypeScript check...");
	execSync("tsc -noEmit -skipLibCheck", { cwd: rootDir, stdio: "inherit" });

	console.log("📦 Building with esbuild...");
	execSync("node esbuild.config.mjs production", {
		cwd: rootDir,
		stdio: "inherit",
	});

	console.log("🗜️  Creating zip archive...");
	await createZip();

	console.log(`✅ Build complete: dist/${zipName}`);
}

build().catch((err) => {
	console.error("❌ Build failed:", err.message);
	process.exit(1);
});
