import * as rimraf from "rimraf";
import { join } from "path";
import glob from "fast-glob";
import { babelCompile } from "./buildPackage/babelCompile.js";
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

    // Snapshot existing dist files before building. We build in-place (overwriting)
    // instead of deleting dist/ first, because Rspack's Rust resolver permanently
    // caches "module not found" when the symlink target (dist/) disappears.
    // After building, we remove any stale files that were not overwritten.
    const distDir = join(cwd, "dist");
    const distPattern = join(distDir, "**/*").replace(/\\/g, "/");
    const filesBefore = new Set(glob.sync(distPattern, { onlyFiles: true, dot: true }));

    await babelCompile(options);
    await tsCompile(options);

    options.logs !== false && console.log("Copying meta files...");
    copyToDist("package.json", options);
    copyToDist("LICENSE", options);

    // Remove stale dist files that no longer correspond to any source file.
    // Since we build in-place, renamed/deleted source files leave orphaned
    // dist files behind. We compute the expected dist files from src/ and
    // remove anything not in that set.
    const srcPattern = join(cwd, "src/**/*.*").replace(/\\/g, "/");
    const srcFiles = glob.sync(srcPattern, { onlyFiles: true, dot: true });
    const expectedDistFiles = new Set();

    for (const srcFile of srcFiles) {
        const relative = srcFile.replace(cwd + "/", "");
        const distRelative = relative.replace(/^src\//, "dist/");

        if (/\.(ts|tsx|js|jsx)$/.test(srcFile) && !srcFile.endsWith(".d.ts")) {
            // Compiled files produce .js and .js.map
            const jsPath = join(cwd, distRelative.replace(/\.(ts|tsx|jsx)$/, ".js"));
            expectedDistFiles.add(jsPath);
            expectedDistFiles.add(jsPath + ".map");
        } else {
            // Non-compiled files are copied as-is
            expectedDistFiles.add(join(cwd, distRelative));
        }
    }

    // tsCompile emits .d.ts files — keep all of those.
    // Also keep package.json and LICENSE.
    expectedDistFiles.add(join(distDir, "package.json"));
    expectedDistFiles.add(join(distDir, "LICENSE"));

    const distFilesNow = glob.sync(distPattern, { onlyFiles: true, dot: true });
    let staleCount = 0;
    for (const file of distFilesNow) {
        if (
            !expectedDistFiles.has(file) &&
            !file.endsWith(".d.ts") &&
            !file.endsWith(".d.ts.map")
        ) {
            // Only remove files that existed before the build (truly stale).
            if (filesBefore.has(file)) {
                rimraf.sync(file);
                staleCount++;
            }
        }
    }
    if (staleCount > 0) {
        options.logs !== false && console.log(`Removed ${staleCount} stale file(s).`);
    }

    const duration = (new Date() - start) / 1000;
    options.logs !== false && console.log(`Done! Build finished in ${duration + "s"}.`);

    return { duration };
};
