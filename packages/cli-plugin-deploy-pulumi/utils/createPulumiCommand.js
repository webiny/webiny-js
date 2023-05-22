const path = require("path");
const { getProjectApplication, getProject } = require("@webiny/cli/utils");
const createProjectApplicationWorkspace = require("./createProjectApplicationWorkspace");
const login = require("./login");
const loadEnvVariables = require("./loadEnvVariables");
const getPulumi = require("./getPulumi");

const createPulumiCommand = ({
    name,
    command,
    createProjectApplicationWorkspace: createProjectApplicationWorkspaceParam
}) => {
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

            return plugin[name](inputs, context);
        } else {
            // Before proceeding, let's detect if multiple project applications were passed.
            const folders = inputs.folder.split(",").map(current => current.trim());
            if (folders.length > 1) {
                for (let i = 0; i < folders.length; i++) {
                    const folder = folders[i];
                    await createPulumiCommand({ name, command, createProjectApplicationWorkspace })(
                        {
                            ...inputs,
                            folder
                        },
                        context
                    );
                }

                return;
            }

            // Detect if an app alias was provided.
            const project = getProject();
            if (project.config.appAliases) {
                const appAliases = project.config.appAliases;
                if (appAliases[inputs.folder]) {
                    inputs.folder = appAliases[inputs.folder];
                }
            }
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
        const projectApplication = getProjectApplication({ cwd });

        if (projectApplication.type === "v5-workspaces") {
            // If needed, let's create a project application workspace.
            if (createProjectApplicationWorkspaceParam !== false) {
                await createProjectApplicationWorkspace({
                    projectApplication,
                    context,
                    inputs,
                    env: inputs.env
                });
            }

            // Check if there are any plugins that need to be registered. This needs to happen
            // always, no matter the value of `createProjectApplicationWorkspaceParam` parameter.
            if (projectApplication.config.plugins) {
                context.plugins.register(projectApplication.config.plugins);
            }
        }

        // Load env vars specified via .env files located in project application folder.
        await loadEnvVariables(inputs, context);

        await login(projectApplication);

        const pulumi = await getPulumi({ projectApplication });

        return command({ inputs, context, projectApplication, pulumi, getDuration });
    };
};

module.exports = createPulumiCommand;
