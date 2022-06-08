const { encrypt } = require("@webiny/wcp");
const { getUser, getProjectEnvironment, updateUserLastActiveOn } = require("./utils");

let projectEnvironment;

module.exports = () => [
    {
        type: "hook-before-deploy",
        name: "hook-before-deploy-environment-get-environment",
        async hook(args, context) {
            // If the project isn't activated, do nothing.
            if (!context.project.config.id) {
                return;
            }

            // The `id` has the orgId/projectId structure, for example `my-org-x/my-project-y`.
            const orgProject = context.project.config.id;
            const [orgId, projectId] = orgProject.split("/");

            const isValidId = orgId && projectId;
            if (!isValidId) {
                throw new Error(
                    `It seems the project ID, specified in "webiny.project.ts" file, is invalid.`
                );
            }

            const apiKey = process.env.WCP_PROJECT_ENVIRONMENT_API_KEY;
            if (apiKey) {
                projectEnvironment = await getProjectEnvironment({ apiKey });
            } else {
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

            if (projectEnvironment && projectEnvironment.status !== "enabled") {
                throw new Error(
                    `Cannot proceed with the deployment because the "${projectEnvironment.name}" project environment has been disabled.`
                );
            }
        }
    },
    // Within this hook, we're setting the `WCP_PROJECT_ENVIRONMENT` env variable, which can then be used in
    // build / deploy steps. For example, we pass it to GraphQL and Headless CMS Lambda functions.
    {
        type: "hook-before-deploy",
        name: "hook-before-deploy-project-environment",
        async hook() {
            if (!projectEnvironment) {
                return;
            }

            // Ensure the correct API key is set into environment variable.
            const wcpProjectEnvironment = {
                id: projectEnvironment.id,
                apiKey: projectEnvironment.apiKey,
                org: { id: projectEnvironment.org.id },
                project: { id: projectEnvironment.project.id }
            };

            process.env.WCP_PROJECT_ENVIRONMENT = encrypt(wcpProjectEnvironment);
        }
    },
    // Within this hook, we're updating user's "last active" field.
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
