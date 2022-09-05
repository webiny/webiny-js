const { encrypt, decrypt } = require("@webiny/wcp");
const { getUser, getProjectEnvironment, updateUserLastActiveOn } = require("./utils");

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

let projectEnvironment;

module.exports = () => [
    {
        type: "hook-before-deploy",
        name: "hook-before-deploy-environment-get-environment",
        async hook(args, context) {
            // For development purposes, we allow setting the WCP_PROJECT_ENVIRONMENT env var directly.
            if (process.env.WCP_PROJECT_ENVIRONMENT) {
                // If we have WCP_PROJECT_ENVIRONMENT env var, we set the WCP_PROJECT_ENVIRONMENT_API_KEY too.
                const decryptedProjectEnvironment = decrypt(process.env.WCP_PROJECT_ENVIRONMENT);
                process.env.WCP_PROJECT_ENVIRONMENT_API_KEY = decryptedProjectEnvironment.apiKey;
                return;
            }

            // If the project isn't activated, do nothing.
            const wcpProjectId = context.project.config.id || process.env.WCP_PROJECT_ID;
            if (!wcpProjectId) {
                return;
            }

            // The `id` has the orgId/projectId structure, for example `my-org-x/my-project-y`.
            const [orgId, projectId] = wcpProjectId.split("/");

            const apiKey = process.env.WCP_PROJECT_ENVIRONMENT_API_KEY;

            let projectEnvironment;
            if (apiKey) {
                projectEnvironment = await getProjectEnvironment({ apiKey });
            } else {
                const isValidId = orgId && projectId;
                if (!isValidId) {
                    throw new Error(
                        `It seems the project ID, specified in "webiny.project.ts" file, is invalid.`
                    );
                }

                // If there is no API key, that means we need to retrieve the currently logged-in user.
                const user = await getUser();
                const project = user.projects.find(item => item.id === projectId);
                if (!project) {
                    throw new Error(
                        `It seems you don't belong to the current project or the current project has been deleted.`
                    );
                }

                projectEnvironment = await getProjectEnvironment({
                    orgId,
                    projectId,
                    userId: user.id,
                    environmentId: args.env
                });
            }

            if (projectEnvironment.org.id !== orgId) {
                throw new Error(
                    `Cannot proceed with the deployment because the "${projectEnvironment.name}" project environment doesn't belong to the "${orgId}" organization. Please check your WCP project ID (currently set to "${wcpProjectId}").`
                );
            }

            if (projectEnvironment.project.id !== projectId) {
                throw new Error(
                    `Cannot proceed with the deployment because the "${projectEnvironment.name}" project environment doesn't belong to the "${wcpProjectId}" project. Please check your WCP project ID (currently set to "${wcpProjectId}").`
                );
            }

            if (projectEnvironment && projectEnvironment.status !== "enabled") {
                throw new Error(
                    `Cannot proceed with the deployment because the "${projectEnvironment.name}" project environment has been disabled.`
                );
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
        }
    },
    {
        type: "hook-before-deploy",
        name: "hook-before-deploy-update-last-active-on",
        async hook() {
            if (!projectEnvironment) {
                return;
            }

            // Is this a user environment? If so, let's update his "last active" field.
            if (projectEnvironment.user) {
                await updateUserLastActiveOn();
            }
        }
    }
];
