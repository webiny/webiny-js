import { createImplementation } from "@webiny/di";
import { decrypt } from "@webiny/wcp";
import {
    GetProjectIdService,
    GetWcpProjectEnvironmentApiKeyService,
    LoggerService
} from "~/abstractions/index.js";

export class DefaultGetWcpProjectEnvironmentApiKeyService
    implements GetWcpProjectEnvironmentApiKeyService.Interface
{
    constructor(
        private getProjectIdService: GetProjectIdService.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async execute(): Promise<string | null> {
        const wcpProjectId = await this.getProjectIdService.execute();

        // If the project isn't linked with WCP, do nothing.
        if (!wcpProjectId) {
            this.loggerService.debug(
                "Was not able to determine the WCP project ID. Cannot retrieve WCP project environment API key."
            );
            return null;
        }

        // If we have WCP_PROJECT_ENVIRONMENT env var, we decrypt it to get the API key.
        if (process.env.WCP_PROJECT_ENVIRONMENT) {
            this.loggerService.info(
                'The "WCP_PROJECT_ENVIRONMENT" env var is already set. Using that to retrieve the API key.'
            );
            const decryptedProjectEnvironment = decrypt(process.env.WCP_PROJECT_ENVIRONMENT);
            return decryptedProjectEnvironment.apiKey;
        }

        // If we have WCP_PROJECT_ENVIRONMENT_API_KEY env var, we use that.
        const apiKey = process.env.WCP_PROJECT_ENVIRONMENT_API_KEY;
        if (apiKey) {
            this.loggerService.debug(
                'The "WCP_PROJECT_ENVIRONMENT_API_KEY" env var is already set. Using that value.'
            );
            return apiKey;
        }

        // Return null if no API key is available in environment variables.
        // This service only checks environment variables to avoid circular dependencies.
        // Use GetWcpProjectEnvironmentService for full environment retrieval.
        return null;
    }
}

export const getWcpProjectEnvironmentApiKeyService = createImplementation({
    abstraction: GetWcpProjectEnvironmentApiKeyService,
    implementation: DefaultGetWcpProjectEnvironmentApiKeyService,
    dependencies: [GetProjectIdService, LoggerService]
});
