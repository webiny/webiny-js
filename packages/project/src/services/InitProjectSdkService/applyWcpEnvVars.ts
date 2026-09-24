import { encrypt, decrypt } from "@webiny/wcp";
import type { ILicense } from "@webiny/wcp/types";
import { Container } from "@webiny/di";
import {
    GetProjectIdService,
    LoggerService,
    ProjectSdkParamsService,
    WcpService
} from "~/abstractions/index.js";

/*
 * Fetches the project license and puts it in `WCP_PROJECT_LICENSE`, which is where the config render
 * reads it from. License-gated feature flags decide which extensions the rendered config contains,
 * so a missing license silently produces a config without them.
 */
const applyProjectLicense = async (
    wcpService: WcpService.Interface,
    params: { apiKey: string; orgId: string; projectId: string }
): Promise<ILicense | null> => {
    if (!params.apiKey) {
        return null;
    }

    const license = await wcpService.getProjectLicense(params);
    if (!license) {
        return null;
    }

    const licenseDto = license.toDto();
    if (licenseDto) {
        process.env.WCP_PROJECT_LICENSE = JSON.stringify(licenseDto);
    }

    return license;
};

export const applyWcpEnvVars = async (container: Container) => {
    /**
     * The environment variables we set via these hooks are the following:
     * - WCP_PROJECT_ENVIRONMENT - contains encrypted data about the deployed project environment
     * - WEBINY_PROJECT_API_KEY / WCP_PROJECT_ENVIRONMENT_API_KEY - for easier access, we also set the API key
     * - WCP_PROJECT_LICENSE - contains encrypted license data
     */

    /**
     * There are multiple ways the hooks below prepare the WCP-enabled project for deployment.
     * 1. If `WCP_PROJECT_ENVIRONMENT` metadata env var is defined, we decrypt it, retrieve the
     *    API key from it, and assign it as the `WEBINY_PROJECT_API_KEY` and `WCP_PROJECT_ENVIRONMENT_API_KEY` env vars.
     * 2. If `WEBINY_PROJECT_API_KEY` or `WCP_PROJECT_ENVIRONMENT_API_KEY` env var is defined, then we use that as the
     *    project environment API key. We use that to load the project environment data
     *    and to also assign the `WCP_PROJECT_ENVIRONMENT` metadata env var.
     * 3. If none of the above is defined, we retrieve (or create) the project environment,
     *    retrieve its API key and again assign it as `WEBINY_PROJECT_API_KEY` and `WCP_PROJECT_ENVIRONMENT_API_KEY` env vars.
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

    // The `id` has the orgId/projectId structure, for example `my-org-x/my-project-y`.
    const [orgId, projectId] = wcpProjectId.split("/");

    // Case 1: For development purposes, we allow setting the WCP_PROJECT_ENVIRONMENT env var directly.
    if (process.env.WCP_PROJECT_ENVIRONMENT) {
        loggerService.info(
            'The "WCP_PROJECT_ENVIRONMENT" env var is already set. Using that value instead of looking the environment up.'
        );
        // If we have WCP_PROJECT_ENVIRONMENT env var, we set the WEBINY_PROJECT_API_KEY and WCP_PROJECT_ENVIRONMENT_API_KEY too.
        const decryptedProjectEnvironment = decrypt(process.env.WCP_PROJECT_ENVIRONMENT);
        process.env.WEBINY_PROJECT_API_KEY = decryptedProjectEnvironment.apiKey;
        process.env.WCP_PROJECT_ENVIRONMENT_API_KEY = decryptedProjectEnvironment.apiKey;

        // Build and watch processes inherit `WCP_PROJECT_LICENSE` along with this variable, so they
        // already have one. Someone who sets `WCP_PROJECT_ENVIRONMENT` by hand, in CI for instance,
        // usually doesn't, and without it the config renders as though the project had no license.
        //
        // Only if the environment belongs to the project this config names, though. Otherwise the
        // config would render with another project's entitlements. This path has never checked
        // that, and failing here would break setups that work today, so a mismatch skips the
        // license with a warning instead, the same as if it had never been fetched.
        const suppliedOrgId = decryptedProjectEnvironment.org?.id;
        const suppliedProjectId = decryptedProjectEnvironment.project?.id;
        const belongsToThisProject = suppliedOrgId === orgId && suppliedProjectId === projectId;

        if (!process.env.WCP_PROJECT_LICENSE && !belongsToThisProject) {
            loggerService.warn(
                { suppliedOrgId, suppliedProjectId, wcpProjectId },
                `"WCP_PROJECT_ENVIRONMENT" belongs to "${suppliedOrgId}/${suppliedProjectId}", not to "${wcpProjectId}". Not fetching its license.`
            );
        }

        if (!process.env.WCP_PROJECT_LICENSE && belongsToThisProject) {
            await applyProjectLicense(wcpService, {
                apiKey: decryptedProjectEnvironment.apiKey,
                orgId,
                projectId
            });
        }

        return;
    }

    // Check if API key is already set (prefer WEBINY_PROJECT_API_KEY over WCP_PROJECT_ENVIRONMENT_API_KEY).
    const apiKey =
        process.env.WEBINY_PROJECT_API_KEY || process.env.WCP_PROJECT_ENVIRONMENT_API_KEY;

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

    const license = await applyProjectLicense(wcpService, {
        apiKey: projectEnvironment.apiKey,
        orgId,
        projectId
    });

    // Assign `WCP_PROJECT_ENVIRONMENT`, `WEBINY_PROJECT_API_KEY` and `WCP_PROJECT_ENVIRONMENT_API_KEY`. The license was assigned above.
    const wcpProjectEnvironment = {
        id: projectEnvironment.id,
        apiKey: projectEnvironment.apiKey,
        org: { id: projectEnvironment.org.id },
        project: { id: projectEnvironment.project.id }
    };

    process.env.WCP_PROJECT_ENVIRONMENT = encrypt(wcpProjectEnvironment);
    process.env.WEBINY_PROJECT_API_KEY = projectEnvironment.apiKey;
    process.env.WCP_PROJECT_ENVIRONMENT_API_KEY = projectEnvironment.apiKey;

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
