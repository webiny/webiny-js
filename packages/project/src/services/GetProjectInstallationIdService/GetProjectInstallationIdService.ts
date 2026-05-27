import { createImplementation } from "@webiny/di";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { GetProjectInstallationIdService } from "~/abstractions/index.js";

class DefaultGetProjectInstallationIdService implements GetProjectInstallationIdService.Interface {
    cachedInstallationId: string | null | undefined;

    execute() {
        if (this.cachedInstallationId !== undefined) {
            return this.cachedInstallationId;
        }

        try {
            const path = join(process.cwd(), "package.json");
            if (!existsSync(path)) {
                this.cachedInstallationId = null;
                return null;
            }
            const data = JSON.parse(readFileSync(path, "utf8"));
            this.cachedInstallationId =
                typeof data?.webiny?.installationId === "string"
                    ? data.webiny.installationId
                    : null;
        } catch {
            this.cachedInstallationId = null;
        }

        return this.cachedInstallationId;
    }
}

export const getProjectInstallationIdService = createImplementation({
    abstraction: GetProjectInstallationIdService,
    implementation: DefaultGetProjectInstallationIdService,
    dependencies: []
});
