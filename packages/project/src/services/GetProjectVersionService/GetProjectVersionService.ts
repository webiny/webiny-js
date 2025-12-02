import { createImplementation } from "@webiny/di";
import findUp from "find-up";
import path from "path";
import { GetProjectVersionService } from "~/abstractions/index.js";
import readJsonSync from "read-json-sync";
import type { PackageJson } from "type-fest";

class DefaultGetProjectVersionService implements GetProjectVersionService.Interface {
    cachedProjectVersion: string | null = null;

    execute() {
        if (this.cachedProjectVersion) {
            return this.cachedProjectVersion;
        }

        const envProjectVersion = process.env.WEBINY_VERSION;
        if (envProjectVersion) {
            this.cachedProjectVersion = envProjectVersion;
            return this.cachedProjectVersion;
        }

        const pkgJsonPath = findUp.sync("package.json", {
            cwd: path.dirname(import.meta.dirname)
        });

        const pkgJson = pkgJsonPath ? (readJsonSync(pkgJsonPath) as PackageJson) : null;

        if (pkgJson?.version) {
            this.cachedProjectVersion = pkgJson.version;
            return this.cachedProjectVersion;
        }

        return "0.0.0";
    }
}

export const getProjectVersionService = createImplementation({
    abstraction: GetProjectVersionService,
    implementation: DefaultGetProjectVersionService,
    dependencies: []
});
