import { createImplementation } from "@webiny/di";
import {
    GetProjectIdService,
    GetWcpProjectEnvironmentService,
    LoggerService,
    ProjectSdkParamsService,
    WcpService
} from "~/abstractions/index.js";
import { IWcpEnvironmentModel } from "~/abstractions/models/index.js";

export class DefaultGetWcpProjectEnvironmentService implements GetWcpProjectEnvironmentService.Interface {
    constructor(
        private getProjectIdService: GetProjectIdService.Interface,
        private wcpService: WcpService.Interface,
        private loggerService: LoggerService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute(): Promise<IWcpEnvironmentModel | null> {
        const wcpProjectId = await this.getProjectIdService.execute();

        // If the project isn't linked with WCP, do nothing.
        if (!wcpProjectId) {
            this.loggerService.debug(
                'Was not able to determine the WCP project ID. Cannot retrieve WCP project environment.'
            );
            return null;
        }

        // The `id` has the orgId/projectId structure, for example `my-org-x/my-project-y`.
        const [orgId, projectId] = wcpProjectId.split("/");

        const apiKey = process.env.WCP_PROJECT_ENVIRONMENT_API_KEY;

        const sdkParams = this.projectSdkParamsService.get();
        const env = sdkParams.env;

        let projectEnvironment;
        if (apiKey) {
            projectEnvironment = await this.wcpService.getProjectEnvironment({ apiKey });
        } else {
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

            this.loggerService.debug(
                `Retrieving the "${env}" project environment for the "${project.name}" project.`
            );

            projectEnvironment = await this.wcpService.getProjectEnvironment({
                orgId,
                projectId,
                userId: user.id,
                environmentId: env
            });
        }

        // Validate the project environment belongs to the correct org and project
        if (projectEnvironment.org.id !== orgId) {
            this.loggerService.error(
                `The "${projectEnvironment.name}" project environment doesn't belong to the "${orgId}" organization.`
            );
            throw new Error(
                `Cannot retrieve project environment because the "${projectEnvironment.name}" project environment doesn't belong to the "${orgId}" organization. Please check your WCP project ID (currently set to "${wcpProjectId}").`
            );
        }

        if (projectEnvironment.project.id !== projectId) {
            this.loggerService.error(
                `The "${projectEnvironment.name}" project environment doesn't belong to the "${projectId}" project.`
            );
            throw new Error(
                `Cannot retrieve project environment because the "${projectEnvironment.name}" project environment doesn't belong to the "${wcpProjectId}" project. Please check your WCP project ID (currently set to "${wcpProjectId}").`
            );
        }

        if (projectEnvironment && projectEnvironment.status !== "enabled") {
            this.loggerService.error(
                `The "${projectEnvironment.name}" project environment has been disabled.`
            );
            throw new Error(
                `Cannot retrieve project environment because the "${projectEnvironment.name}" project environment has been disabled.`
            );
        }

        return projectEnvironment;
    }
}

export const getWcpProjectEnvironmentService = createImplementation({
    abstraction: GetWcpProjectEnvironmentService,
    implementation: DefaultGetWcpProjectEnvironmentService,
    dependencies: [GetProjectIdService, WcpService, LoggerService, ProjectSdkParamsService]
});
