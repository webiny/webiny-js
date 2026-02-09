import { License, NullLicense, getWcpProjectLicense } from "@webiny/wcp";
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
            const decryptedLicense = await getWcpProjectLicense({
                orgId,
                projectId,
                projectEnvironmentApiKey: apiKey
            });
            const fetchLatency = Date.now() - startTime;

            loggerService.debug(
                `WCP project license fetch completed in ${fetchLatency}ms for ${orgId}/${projectId}`
            );

            // License.fromLicenseDto handles the null case internally, returning NullLicense if needed.
            const license = License.fromLicenseDto(decryptedLicense);

            if (!decryptedLicense) {
                loggerService.debug(`No license found for ${orgId}/${projectId}`);
            } else {
                loggerService.debug(`Successfully retrieved and decrypted WCP project license.`);
            }

            return license;
        } catch (error) {
            loggerService.error({ error }, `Error fetching WCP project license.`);
            return new NullLicense();
        }
    }
}
