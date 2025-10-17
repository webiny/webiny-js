import * as rimraf from "rimraf";
import { join } from "path";
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
    options.logs !== false && console.log("Deleting existing build files...");
    rimraf.sync(join(cwd, "./dist"));
    rimraf.sync(join(cwd, "*.tsbuildinfo"), { glob: true });

    options.logs !== false && console.log("Building...");

    // Make sure `overrides` is an object.
    if (options.overrides && typeof options.overrides === "string") {
        options.overrides = JSON.parse(options.overrides);
    }

    // Validate ESM imports before compiling
    await validateEsmImports({ cwd, logs: options.logs });

    await babelCompile(options);
    await tsCompile(options);

    options.logs !== false && console.log("Copying meta files...");
    copyToDist("package.json", options);
    copyToDist("LICENSE", options);

    const duration = (new Date() - start) / 1000;
    options.logs !== false && console.log(`Done! Build finished in ${duration + "s"}.`);

    return { duration };
};
