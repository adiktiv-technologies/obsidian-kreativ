import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const rootDir = dirname(fileURLToPath(import.meta.url));

const targets = [
	join(rootDir, ".vault", ".kreativ", "dist"),
	join(rootDir, ".vault", ".obsidian", "plugins", "kreativ"),
];

for (const target of targets) {
	if (existsSync(target)) {
		rmSync(target, { recursive: true, force: true });
		console.log(`Removed ${target}`);
	} else {
		console.log(`Skipped ${target} (not found)`);
	}
}

execSync("npm run build", { cwd: rootDir, stdio: "inherit" });
