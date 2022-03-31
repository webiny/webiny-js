const { getUser, getProjectEnvironmentBySlug, updateUserLastActiveOn } = require("./utils");

module.exports = () => [
    // Within this hook, we're setting the `WCP_ENVIRONMENT_API_KEY` env variable, which can then be used in
    // build / deploy steps. For example, we pass it to GraphQL and Headless CMS Lambda functions.
    {
        type: "hook-before-deploy",
        name: "hook-before-deploy-environment-api-key",
        async hook(args, context) {
            // If the `WCP_ENVIRONMENT_API_KEY` has already been assigned, no need to do anything.
            if (process.env.WCP_ENVIRONMENT_API_KEY) {
                return;
            }

            const environment = await getProjectEnvironment(args, context);
            if (environment) {
                process.env.WCP_ENVIRONMENT_API_KEY = environment.apiKey;
            }
        }
    },
    // Within this hook, we're updating user's "last active" field.
    {
        type: "hook-before-deploy",
        name: "hook-before-deploy-update-last-active-on",
        async hook(args, context) {
            // Is this a user environment? If so, let's update his "last active" field.
            const environment = await getProjectEnvironment(args, context);
            if (environment && environment.user) {
                await updateUserLastActiveOn();
            }
        }
    }
];

const getProjectEnvironment = async (args, context) => {
    // If the project isn't activated, also do nothing.
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

    // Check login.
    const user = await getUser();
    const project = user.projects.find(item => item.id === projectId);
    if (!project) {
        throw new Error(
            `It seems you don't belong to the current project or the current project has been deleted.`
        );
    }

    return getProjectEnvironmentBySlug({
        orgId,
        projectId,
        environmentSlug: args.env,
        userId: user.id
    });
};
