import fs from "fs";
import path from "path";
import { loadJsonFileSync } from "load-json-file";
import { writeJsonFileSync } from "write-json-file";
import type { PackageJson } from "type-fest";

interface VersionResult {
    name: string;
    targetFile: string;
}

export function versionPackages(version: string): VersionResult[] {
    const packagesDir = path.resolve(process.cwd(), "packages");
    const entries = fs.readdirSync(packagesDir, { withFileTypes: true });
    const results: VersionResult[] = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }

        const pkgRoot = path.join(packagesDir, entry.name);
        const pkgJsonPath = path.join(pkgRoot, "package.json");

        if (!fs.existsSync(pkgJsonPath)) {
            continue;
        }

        const pkgJson = loadJsonFileSync<PackageJson>(pkgJsonPath);

        if (pkgJson.private) {
            continue;
        }

        const hasSrc = fs.existsSync(path.join(pkgRoot, "src"));
        const targetFile = hasSrc ? path.join(pkgRoot, "dist", "package.json") : pkgJsonPath;

        if (!fs.existsSync(targetFile)) {
            continue;
        }

        const targetJson = loadJsonFileSync<PackageJson>(targetFile);
        targetJson.version = version;

        for (const depKey of ["dependencies", "devDependencies", "peerDependencies"] as const) {
            const deps = targetJson[depKey];
            if (!deps) {
                continue;
            }

            for (const name of Object.keys(deps)) {
                if (name.startsWith("@webiny/")) {
                    deps[name] = version;
                }
            }
        }

        writeJsonFileSync(targetFile, targetJson);
        results.push({ name: pkgJson.name!, targetFile });
    }

    return results;
}
