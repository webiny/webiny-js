import { getWcpApiUrl } from "@webiny/wcp";
import type { EncryptedWcpProjectLicense } from "@webiny/wcp";
import { LoggerService } from "~/abstractions/index.js";
import { IGetProjectLicenseParams } from "~/abstractions/services/WcpService.js";

export interface IGetProjectLicenseDi {
    loggerService: LoggerService.Interface;
}

export class GetProjectLicense {
    di: IGetProjectLicenseDi;

    constructor(di: IGetProjectLicenseDi) {
        this.di = di;
    }

    async execute(params: IGetProjectLicenseParams): Promise<EncryptedWcpProjectLicense | null> {
        const { apiKey, orgId, projectId } = params;
        const { loggerService } = this.di;

        try {
            // Construct the license endpoint URL
            const licenseUrl = getWcpApiUrl(`/orgs/${orgId}/projects/${projectId}/license`);

            loggerService.debug(`Fetching WCP project license from: ${licenseUrl}`);

            // Fetch the license using the REST endpoint
            const response = await fetch(licenseUrl, {
                method: "GET",
                headers: {
                    authorization: apiKey,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                loggerService.error(
                    { status: response.status, statusText: response.statusText },
                    `Failed to fetch WCP project license.`
                );
                return null;
            }

            const license = await response.json();

            loggerService.debug(`Successfully retrieved WCP project license.`);

            return license;
        } catch (error) {
            loggerService.error({ error }, `Error fetching WCP project license.`);
            return null;
        }
    }
}
