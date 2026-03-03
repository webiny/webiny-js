import findUp from "find-up";
import { loadJsonFileSync } from "load-json-file";
import type { PackageJson } from "type-fest";

export class GetCwpVersion {
    execute(): string {
        const cwpPackageJsonPath = findUp.sync("package.json", {
            cwd: import.meta.dirname
        });
        if (!cwpPackageJsonPath) {
            throw new Error("Could not find package.json for create-webiny-project.");
        }
        const cwpPackageJson = loadJsonFileSync<PackageJson>(cwpPackageJsonPath);
        if (!cwpPackageJson?.version) {
            throw new Error("Could not find version in create-webiny-project's package.json.");
        }
        return cwpPackageJson.version;
    }
}
