import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import fs from "node:fs";

let cachedPath = null;

export function getTscBinaryPath() {
    if (cachedPath) {
        return cachedPath;
    }

    const require = createRequire(import.meta.url);
    const tsPackageJsonPath = require.resolve("typescript/package.json");
    const tsDir = dirname(tsPackageJsonPath);

    const platformPackage = "@typescript/typescript-" + process.platform + "-" + process.arch;

    let platformPkgPath;
    try {
        const platformRequire = createRequire(join(tsDir, "package.json"));
        platformPkgPath = platformRequire.resolve(platformPackage + "/package.json");
    } catch {
        throw new Error(
            "Unable to resolve " +
                platformPackage +
                ". " +
                "Either your platform is unsupported, or you are missing the package on disk."
        );
    }

    const libDir = join(dirname(platformPkgPath), "lib");

    let exe = join(libDir, "tsc");
    if (process.platform === "win32") {
        exe += ".exe";
        if (exe.length >= 248) {
            exe = "\\\\?\\" + exe;
        }
    }

    if (!fs.existsSync(exe)) {
        throw new Error("TypeScript native binary not found: " + exe);
    }

    cachedPath = exe;
    return cachedPath;
}
