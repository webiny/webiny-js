const path = require("path");
const { getProjectApplication } = require("@webiny/cli/utils");
const createProjectApplicationWorkspace = require("./createProjectApplicationWorkspace");
const login = require("./login");
const loadEnvVariables = require("./loadEnvVariables");
const getPulumi = require("./getPulumi");

module.exports = (name, commandFunction) => {
    return async (inputs, context) => {
        // If folder not specified, that means we want to deploy the whole project (all project applications).
        // For that, we look if there are registered plugins that perform that.
        if (!inputs.folder) {
            const plugin = context.plugins.byName(`cli-command-deployment-${name}-all`);
            if (!plugin) {
                throw new Error(
                    `Cannot continue - "cli-command-deployment-${name}-all" plugin not found.`
                );
            }

            return plugin.deploy(inputs, context);
        }

        if (!inputs.env) {
            throw new Error(`Please specify environment, for example "dev".`);
        }

        const start = new Date();
        const getDuration = () => {
            return (new Date() - start) / 1000 + "s";
        };

        const cwd = path.join(process.cwd(), inputs.folder);

        // Get project application metadata.
        const projectApplication = getProjectApplication({
            cwd: path.join(cwd, inputs.folder)
        });

        // If needed, let's create a project application workspace.
        if (projectApplication.type === "v5-workspaces") {
            await createProjectApplicationWorkspace(projectApplication, { env: inputs.env });
        }

        // Load env vars specified via .env files located in project application folder.
        await loadEnvVariables(inputs, context);

        await login(projectApplication);

        const pulumi = await getPulumi({ projectApplication });

        return commandFunction({ inputs, context, projectApplication, pulumi, getDuration });
    };
};
