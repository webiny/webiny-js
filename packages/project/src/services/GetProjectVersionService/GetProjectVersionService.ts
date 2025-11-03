import { createImplementation } from "@webiny/di";
import findUp from "find-up";
import path, { dirname } from "path";
import { GetProjectVersionService } from "~/abstractions/index.js";
import readJsonSync from "read-json-sync";
import type { PackageJson } from "type-fest";

class DefaultGetProjectVersionService implements GetProjectVersionService.Interface {
    cachedProjectVersion: string | null = null;

    execute(cwd = process.cwd()) {
        if (this.cachedProjectVersion) {
            return this.cachedProjectVersion;
        }

        const envProjectVersion = process.env.WEBINY_VERSION;
        if (envProjectVersion) {
            this.cachedProjectVersion = envProjectVersion;
            return this.cachedProjectVersion;
        }

        const webinyConfigFilePathString = findUp.sync("webiny.config.tsx", { cwd });
        if (!webinyConfigFilePathString) {
            throw new Error(`Could not detect project in given directory (${cwd}).`);
        }

        const pkgJsonPath = path.join(dirname(webinyConfigFilePathString), "package.json");
        const pkgJson = readJsonSync(pkgJsonPath) as PackageJson;

        if (pkgJson.version) {
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
