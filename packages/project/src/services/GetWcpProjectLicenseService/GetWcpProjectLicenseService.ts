import { createImplementation } from "@webiny/di";
import { getWcpApiUrl } from "@webiny/wcp";
import type { EncryptedWcpProjectLicense } from "@webiny/wcp";
import {
    GetProjectIdService,
    GetWcpProjectLicenseService,
    GetWcpProjectEnvironmentApiKeyService,
    LoggerService
} from "~/abstractions/index.js";

export class DefaultGetWcpProjectLicenseService implements GetWcpProjectLicenseService.Interface {
    constructor(
        private getProjectIdService: GetProjectIdService.Interface,
        private getWcpProjectEnvironmentApiKeyService: GetWcpProjectEnvironmentApiKeyService.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async execute(): Promise<EncryptedWcpProjectLicense | null> {
        const wcpProjectId = await this.getProjectIdService.execute();

        // If the project isn't linked with WCP, do nothing.
        if (!wcpProjectId) {
            this.loggerService.debug(
                "Was not able to determine the WCP project ID. Cannot retrieve WCP project license."
            );
            return null;
        }

        // Get the API key using the dedicated service
        const apiKey = await this.getWcpProjectEnvironmentApiKeyService.execute();
        if (!apiKey) {
            this.loggerService.debug(
                "WCP_PROJECT_ENVIRONMENT_API_KEY is not available. Cannot retrieve WCP project license."
            );
            return null;
        }

        // The `id` has the orgId/projectId structure, for example `my-org-x/my-project-y`.
        const [orgId, projectId] = wcpProjectId.split("/");

        const isValidId = orgId && projectId;
        if (!isValidId) {
            this.loggerService.error(
                { orgId, projectId, wcpProjectId },
                `The project ID, specified in "webiny.config.tsx" file, seems to be invalid.`
            );
            return null;
        }

        try {
            // Construct the license endpoint URL
            const licenseUrl = getWcpApiUrl(`/orgs/${orgId}/projects/${projectId}/license`);

            this.loggerService.debug(`Fetching WCP project license from: ${licenseUrl}`);

            // Fetch the license using the REST endpoint
            const response = await fetch(licenseUrl, {
                method: "GET",
                headers: {
                    authorization: apiKey,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                this.loggerService.error(
                    { status: response.status, statusText: response.statusText },
                    `Failed to fetch WCP project license.`
                );
                return null;
            }

            const license = await response.json();

            this.loggerService.debug(`Successfully retrieved WCP project license.`);

            return license;
        } catch (error) {
            this.loggerService.error({ error }, `Error fetching WCP project license.`);
            return null;
        }
    }
}

export const getWcpProjectLicenseService = createImplementation({
    abstraction: GetWcpProjectLicenseService,
    implementation: DefaultGetWcpProjectLicenseService,
    dependencies: [GetProjectIdService, GetWcpProjectEnvironmentApiKeyService, LoggerService]
});
