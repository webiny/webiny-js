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

    const distDir = join(cwd, "dist");

    if (options.safeReplace) {
        await buildWithSafeReplace(options, distDir);
    } else {
        await buildDirect(options, distDir);
    }

    const duration = (new Date() - start) / 1000;
    options.logs !== false && console.log(`Done! Build finished in ${duration + "s"}.`);

    return { duration };
};

async function buildDirect(options, distDir) {
    // Clear dist/ contents without removing the directory itself.
    // node_modules/@webiny/<pkg> symlinks directly to dist/, so deleting
    // the directory would leave a dangling symlink and break Rspack resolution.
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
}

async function buildWithSafeReplace(options, distDir) {
    const stagingDir = distDir + "._build";

    // Clean up any leftover staging dir from a previous failed build.
    if (fs.existsSync(stagingDir)) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
    }
    fs.mkdirSync(stagingDir, { recursive: true });

    const stagingOptions = { ...options, outputDir: stagingDir };

    await babelCompile(stagingOptions);
    await tsCompile(stagingOptions);

    stagingOptions.logs !== false && console.log("Copying meta files...");
    copyToDist("package.json", stagingOptions);
    copyToDist("LICENSE", stagingOptions);

    // Fast-swap: clear dist contents and move staged files in.
    if (fs.existsSync(distDir)) {
        for (const entry of fs.readdirSync(distDir)) {
            fs.rmSync(join(distDir, entry), { recursive: true, force: true });
        }
    } else {
        fs.mkdirSync(distDir, { recursive: true });
    }

    for (const entry of fs.readdirSync(stagingDir)) {
        fs.renameSync(join(stagingDir, entry), join(distDir, entry));
    }

    fs.rmSync(stagingDir, { recursive: true, force: true });
}
