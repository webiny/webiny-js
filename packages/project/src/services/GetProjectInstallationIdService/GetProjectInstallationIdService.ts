import { createImplementation } from "@webiny/di";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { GetCwdService, GetProjectInstallationIdService } from "~/abstractions/index.js";

class DefaultGetProjectInstallationIdService implements GetProjectInstallationIdService.Interface {
    private loaded = false;
    private installationId: string | null = null;

    constructor(private getCwdService: GetCwdService.Interface) {}

    execute() {
        if (this.loaded) {
            return this.installationId;
        }

        try {
            const path = join(this.getCwdService.execute(), "package.json");
            if (!existsSync(path)) {
                return null;
            }
            const data = JSON.parse(readFileSync(path, "utf8"));
            this.installationId =
                typeof data?.webiny?.installationId === "string"
                    ? data.webiny.installationId
                    : null;
        } catch {
            this.installationId = null;
        }

        this.loaded = true;
        return this.installationId;
    }
}

export const getProjectInstallationIdService = createImplementation({
    abstraction: GetProjectInstallationIdService,
    implementation: DefaultGetProjectInstallationIdService,
    dependencies: [GetCwdService]
});
