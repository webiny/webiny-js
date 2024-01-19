const { getProjectApplication } = require("@webiny/cli/utils");
const createProjectApplicationWorkspace = require("./createProjectApplicationWorkspace");
const login = require("./login");
const getPulumi = require("./getPulumi");

const createPulumiCommand = ({ name, command }) => {
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
        }

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

        if (!inputs.env) {
            throw new Error(`Please specify environment, for example "dev".`);
        }

        const start = new Date();
        const getDuration = () => {
            return (new Date() - start) / 1000 + "s";
        };

        const projectApplication = getProjectApplication({ name: inputs.folder });

        // Check if there are any plugins that need to be registered. This needs to happen
        // always, no matter the value of `createProjectApplicationWorkspaceParam` parameter.
        if (projectApplication.config.plugins) {
            context.plugins.register(projectApplication.config.plugins);
        }

        console.log('ajmoo')
        const createAppWorkspacePlugins = context.plugins.byType("hook-create-app-workspace");
        for (let i = 0; i < createAppWorkspacePlugins.length; i++) {
            const plugin = createAppWorkspacePlugins[i];
            await plugin.hook({ projectApplication });
        }

        console.log('stopa')
        process.exit();
        await login(projectApplication);

        const pulumi = await getPulumi({ projectApplication });

        return command({ inputs, context, projectApplication, pulumi, getDuration });
    };
};

module.exports = createPulumiCommand;
