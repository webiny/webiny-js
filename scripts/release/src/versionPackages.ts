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

        const webiny = (pkgJson as any).webiny as { publishFrom?: string } | undefined;
        const publishFrom = webiny?.publishFrom;
        const targetFile =
            publishFrom && publishFrom !== "."
                ? path.join(pkgRoot, publishFrom, "package.json")
                : pkgJsonPath;

        if (!fs.existsSync(targetFile)) {
            continue;
        }

        const targetJson = loadJsonFileSync<PackageJson>(targetFile);

        if (targetJson.version !== "0.0.0") {
            continue;
        }

        targetJson.version = version;

        for (const depKey of ["dependencies", "devDependencies", "peerDependencies"] as const) {
            const deps = targetJson[depKey];
            if (!deps) {
                continue;
            }

            for (const name of Object.keys(deps)) {
                if (name.startsWith("@webiny/") && deps[name] === "0.0.0") {
                    deps[name] = version;
                }
            }
        }

        writeJsonFileSync(targetFile, targetJson);
        results.push({ name: pkgJson.name!, targetFile });
    }

    return results;
}
