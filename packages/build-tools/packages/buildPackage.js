import * as rimraf from "rimraf";
import { join } from "path";
import fs from "node:fs";
import { rslibCompile } from "./buildPackage/rslibCompile.js";
import { tsCompile } from "./buildPackage/tsCompile.js";
import { copyToDist } from "./buildPackage/copyToDist.js";
import { validateEsmImports } from "./buildPackage/validateEsmImports.js";

export default async options => {
    const start = new Date();

    if (!options.cwd) {
        options.cwd = "";
    }
    const { cwd = "" } = options;

    rimraf.sync(join(cwd, "*.tsbuildinfo"), { glob: true });

    options.logs !== false && console.log("Building...");

    // Make sure `overrides` is an object.
    if (options.overrides && typeof options.overrides === "string") {
        options.overrides = JSON.parse(options.overrides);
    }

    // Validate ESM imports before compiling
    await validateEsmImports({ cwd, logs: options.logs });

    // Clear dist/ contents without removing the directory itself.
    // node_modules/@webiny/<pkg> symlinks directly to dist/, so deleting
    // the directory would leave a dangling symlink and break Rspack resolution.
    const distDir = join(cwd, "dist");
    if (fs.existsSync(distDir)) {
        for (const entry of fs.readdirSync(distDir)) {
            fs.rmSync(join(distDir, entry), { recursive: true, force: true });
        }
    }

    await rslibCompile(options);
    await tsCompile(options);

    options.logs !== false && console.log("Copying meta files...");
    copyToDist("package.json", options);
    copyToDist("LICENSE", options);

    const duration = (new Date() - start) / 1000;
    options.logs !== false && console.log(`Done! Build finished in ${duration + "s"}.`);

    return { duration };
};
