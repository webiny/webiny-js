import { encrypt } from "@webiny/wcp";
import {
    GetWcpProjectEnvironmentService,
    LoggerService
} from "~/abstractions/index.js";

interface IWcpSetEnvVarsDi {
    getWcpProjectEnvironmentService: GetWcpProjectEnvironmentService.Interface;
    loggerService: LoggerService.Interface;
}

export class WcpSetEnvVars {
    di: IWcpSetEnvVarsDi;

    constructor(di: IWcpSetEnvVarsDi) {
        this.di = di;
    }

    async execute() {
        /**
         * The two environment variables we set via these hooks are the following:
         * - WCP_PROJECT_ENVIRONMENT - contains encrypted data about the deployed project environment
         * - WCP_PROJECT_ENVIRONMENT_API_KEY - for easier access, we also set the API key
         */

        /**
         * There are multiple ways the hooks below prepare the WCP-enabled project for deployment.
         * 1. If `WCP_PROJECT_ENVIRONMENT` metadata env var is defined, we decrypt it, retrieve the
         *    API key from it, and assign it as the `WCP_PROJECT_ENVIRONMENT_API_KEY` env var.
         * 2. If `WCP_PROJECT_ENVIRONMENT_API_KEY` env var is defined, then we use that as the
         *    project environment API key. We use that to load the project environment data
         *    and to also assign the `WCP_PROJECT_ENVIRONMENT` metadata env var.
         * 3. If none of the above is defined, we retrieve (or create) the project environment,
         *    retrieve its API key and again assign it as `WCP_PROJECT_ENVIRONMENT_API_KEY` env var.
         *    As in 2), we also assign the `WCP_PROJECT_ENVIRONMENT` metadata env var.
         */

        const { getWcpProjectEnvironmentService, loggerService } = this.di;

        // Use the dedicated service to get the project environment
        const projectEnvironment = await getWcpProjectEnvironmentService.execute();

        // If no project environment was retrieved, we're done
        if (!projectEnvironment) {
            return;
        }

        // Assign `WCP_PROJECT_ENVIRONMENT` and `WCP_PROJECT_ENVIRONMENT_API_KEY`
        const wcpProjectEnvironment = {
            id: projectEnvironment.id,
            apiKey: projectEnvironment.apiKey,
            org: { id: projectEnvironment.org.id },
            project: { id: projectEnvironment.project.id }
        };

        process.env.WCP_PROJECT_ENVIRONMENT = encrypt(wcpProjectEnvironment);
        process.env.WCP_PROJECT_ENVIRONMENT_API_KEY = projectEnvironment.apiKey;

        loggerService.debug(
            {
                id: projectEnvironment.id,
                apiKey: projectEnvironment.apiKey.replace(/./g, "#"),
                org: { id: projectEnvironment.org.id },
                project: { id: projectEnvironment.project.id }
            },
            `WCP project environment "${projectEnvironment.name}" (ID: ${projectEnvironment.id}) has been set.`
        );
    }
}
