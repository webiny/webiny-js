import { License, NullLicense, fetchWcpProjectLicense } from "@webiny/wcp";
import type { ILicense } from "@webiny/wcp/types";
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

    async execute(params: IGetProjectLicenseParams): Promise<ILicense> {
        const { apiKey, orgId, projectId } = params;
        const { loggerService } = this.di;

        try {
            loggerService.debug(`Fetching WCP project license for ${orgId}/${projectId}`);

            const startTime = Date.now();
            const fetchedLicense = await fetchWcpProjectLicense({
                orgId,
                projectId,
                projectEnvironmentApiKey: apiKey
            });
            const fetchLatency = Date.now() - startTime;

            loggerService.debug(
                `WCP project license fetch completed in ${fetchLatency}ms for ${orgId}/${projectId}`
            );

            if (!fetchedLicense) {
                loggerService.debug(`No license found for ${orgId}/${projectId}`);
                return new NullLicense();
            }

            // Decrypt the license from the response
            const license = License.fromLicenseDto(fetchedLicense.license);

            loggerService.debug(`Successfully retrieved and decrypted WCP project license.`);

            return license;
        } catch (error) {
            loggerService.error({ error }, `Error fetching WCP project license.`);
            return new NullLicense();
        }
    }
}
