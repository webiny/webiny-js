import { findUpSync } from "find-up";
import { loadJsonFileSync } from "load-json-file";
import type { PackageJson } from "type-fest";
import path from "path";

interface Options {
    cwd: string;
}

export const resolvePackageVersion = (packageName: string, { cwd }: Options) => {
    const searchPath = path.join("node_modules", packageName, "package.json");
    const packageJson = findUpSync(searchPath, { cwd });
    if (packageJson) {
        const json = loadJsonFileSync<PackageJson>(packageJson);
        return json?.version;
    }

    return undefined;
};
