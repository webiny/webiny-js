import { encrypt, decrypt, License } from "@webiny/wcp";
import type { ILicense } from "@webiny/wcp/types";
import { Container } from "@webiny/di";
import {
    GetProjectIdService,
    LoggerService,
    ProjectSdkParamsService,
    WcpService
} from "~/abstractions/index.js";

export const applyWcpEnvVars = async (container: Container) => {
    /**
     * The environment variables we set via these hooks are the following:
     * - WCP_PROJECT_ENVIRONMENT - contains encrypted data about the deployed project environment
     * - WCP_PROJECT_ENVIRONMENT_API_KEY - for easier access, we also set the API key
     * - WCP_PROJECT_LICENSE - contains encrypted license data
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

    const getProjectIdService = container.resolve(GetProjectIdService);
    const wcpService = container.resolve(WcpService);
    const loggerService = container.resolve(LoggerService);
    const projectSdkParamsService = container.resolve(ProjectSdkParamsService);

    const wcpProjectId = await getProjectIdService.execute();

    // If the project isn't linked with WCP, do nothing.
    if (!wcpProjectId) {
        loggerService.debug(
            'Was not able to determine the WCP project ID. Skipping the setting of "WCP_PROJECT_ENVIRONMENT" and "WCP_PROJECT_ENVIRONMENT_API_KEY" env vars.'
        );
        return;
    }

    // Case 1: For development purposes, we allow setting the WCP_PROJECT_ENVIRONMENT env var directly.
    if (process.env.WCP_PROJECT_ENVIRONMENT) {
        loggerService.info(
            'The "WCP_PROJECT_ENVIRONMENT" env var is already set. Using that value and skipping the rest of the process.'
        );
        // If we have WCP_PROJECT_ENVIRONMENT env var, we set the WCP_PROJECT_ENVIRONMENT_API_KEY too.
        const decryptedProjectEnvironment = decrypt(process.env.WCP_PROJECT_ENVIRONMENT);
        process.env.WCP_PROJECT_ENVIRONMENT_API_KEY = decryptedProjectEnvironment.apiKey;
        return;
    }

    // The `id` has the orgId/projectId structure, for example `my-org-x/my-project-y`.
    const [orgId, projectId] = wcpProjectId.split("/");

    // Check if API key is already set
    const apiKey = process.env.WCP_PROJECT_ENVIRONMENT_API_KEY;

    const sdkParams = projectSdkParamsService.get();
    const env = sdkParams.env;

    let projectEnvironment;
    if (apiKey) {
        projectEnvironment = await wcpService.getProjectEnvironment({ apiKey });
    } else {
        const isValidId = orgId && projectId;
        if (!isValidId) {
            loggerService.error(
                { orgId, projectId, wcpProjectId },
                `The project ID, specified in "webiny.config.tsx" file, seems to be invalid.`
            );
            throw new Error(
                `It seems the project ID, specified in "webiny.config.tsx" file, is invalid.`
            );
        }

        // If there is no API key, that means we need to retrieve the currently logged-in user.
        const user = await wcpService.getUser();
        if (!user) {
            throw new Error(
                `It seems you are not logged into your WCP project. Please log in using the "yarn webiny login" command.`
            );
        }

        const project = user.projects.find(item => item.id === projectId);
        if (!project) {
            loggerService.error(
                { projects: user.projects },
                `The "${projectId}" project doesn't exist or you don't belong to it.`
            );
            throw new Error(
                `It seems you don't belong to the current project or the current project has been deleted.`
            );
        }

        loggerService.debug(
            `Retrieving the "${env}" project environment for the "${project.name}" project.`
        );

        projectEnvironment = await wcpService.getProjectEnvironment({
            orgId,
            projectId,
            userId: user.id,
            environmentId: env
        });
    }

    // Validate the project environment belongs to the correct org and project
    if (projectEnvironment.org.id !== orgId) {
        loggerService.error(
            `The "${projectEnvironment.name}" project environment doesn't belong to the "${orgId}" organization.`
        );
        throw new Error(
            `Cannot retrieve project environment because the "${projectEnvironment.name}" project environment doesn't belong to the "${orgId}" organization. Please check your WCP project ID (currently set to "${wcpProjectId}").`
        );
    }

    if (projectEnvironment.project.id !== projectId) {
        loggerService.error(
            `The "${projectEnvironment.name}" project environment doesn't belong to the "${projectId}" project.`
        );
        throw new Error(
            `Cannot retrieve project environment because the "${projectEnvironment.name}" project environment doesn't belong to the "${wcpProjectId}" project. Please check your WCP project ID (currently set to "${wcpProjectId}").`
        );
    }

    if (projectEnvironment && projectEnvironment.status !== "enabled") {
        loggerService.error(
            `The "${projectEnvironment.name}" project environment has been disabled.`
        );
        throw new Error(
            `Cannot retrieve project environment because the "${projectEnvironment.name}" project environment has been disabled.`
        );
    }

    // Fetch license
    let license: ILicense | null = null;
    if (projectEnvironment.apiKey) {
        license = await wcpService.getProjectLicense({
            apiKey: projectEnvironment.apiKey,
            orgId,
            projectId
        });
    }

    // Assign `WCP_PROJECT_ENVIRONMENT`, `WCP_PROJECT_ENVIRONMENT_API_KEY`, and `WCP_PROJECT_LICENSE`
    const wcpProjectEnvironment = {
        id: projectEnvironment.id,
        apiKey: projectEnvironment.apiKey,
        org: { id: projectEnvironment.org.id },
        project: { id: projectEnvironment.project.id }
    };

    process.env.WCP_PROJECT_ENVIRONMENT = encrypt(wcpProjectEnvironment);
    process.env.WCP_PROJECT_ENVIRONMENT_API_KEY = projectEnvironment.apiKey;
    if (license) {
        const licenseDto = License.toDto(license);
        if (licenseDto) {
            process.env.WCP_PROJECT_LICENSE = JSON.stringify(licenseDto);
        }
    }

    loggerService.debug(
        {
            id: projectEnvironment.id,
            apiKey: projectEnvironment.apiKey.replace(/./g, "#"),
            org: { id: projectEnvironment.org.id },
            project: { id: projectEnvironment.project.id },
            license: license ? "present" : "not fetched"
        },
        `WCP project environment "${projectEnvironment.name}" (ID: ${projectEnvironment.id}) has been set.`
    );
};
