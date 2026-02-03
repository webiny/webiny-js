import { createImplementation } from "@webiny/di";
import { decrypt } from "@webiny/wcp";
import {
    GetProjectIdService,
    GetWcpProjectEnvironmentApiKeyService,
    LoggerService,
    ProjectSdkParamsService,
    WcpService
} from "~/abstractions/index.js";

export class DefaultGetWcpProjectEnvironmentApiKeyService implements GetWcpProjectEnvironmentApiKeyService.Interface {
    constructor(
        private getProjectIdService: GetProjectIdService.Interface,
        private wcpService: WcpService.Interface,
        private loggerService: LoggerService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute(): Promise<string | null> {
        const wcpProjectId = await this.getProjectIdService.execute();

        // If the project isn't linked with WCP, do nothing.
        if (!wcpProjectId) {
            this.loggerService.debug(
                'Was not able to determine the WCP project ID. Cannot retrieve WCP project environment API key.'
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

        // Otherwise, we need to retrieve the project environment to get the API key.
        const [orgId, projectId] = wcpProjectId.split("/");
        const isValidId = orgId && projectId;
        if (!isValidId) {
            this.loggerService.error(
                { orgId, projectId, wcpProjectId },
                `The project ID, specified in "webiny.config.tsx" file, seems to be invalid.`
            );
            throw new Error(
                `It seems the project ID, specified in "webiny.config.tsx" file, is invalid.`
            );
        }

        // If there is no API key, that means we need to retrieve the currently logged-in user.
        const user = await this.wcpService.getUser();
        if (!user) {
            throw new Error(
                `It seems you are not logged into your WCP project. Please log in using the "yarn webiny login" command.`
            );
        }

        const project = user.projects.find(item => item.id === projectId);
        if (!project) {
            this.loggerService.error(
                { projects: user.projects },
                `The "${projectId}" project doesn't exist or you don't belong to it.`
            );
            throw new Error(
                `It seems you don't belong to the current project or the current project has been deleted.`
            );
        }

        const sdkParams = this.projectSdkParamsService.get();
        const env = sdkParams.env;

        this.loggerService.debug(
            `Retrieving the "${env}" project environment for the "${project.name}" project.`
        );

        const projectEnvironment = await this.wcpService.getProjectEnvironment({
            orgId,
            projectId,
            userId: user.id,
            environmentId: env
        });

        return projectEnvironment.apiKey;
    }
}

export const getWcpProjectEnvironmentApiKeyService = createImplementation({
    abstraction: GetWcpProjectEnvironmentApiKeyService,
    implementation: DefaultGetWcpProjectEnvironmentApiKeyService,
    dependencies: [GetProjectIdService, WcpService, LoggerService, ProjectSdkParamsService]
});
