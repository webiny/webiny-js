module.exports = {
    type: "cli-command",
    name: "cli-command-info",
    create({ yargs, context }) {
        yargs.command(
            "info",
            `Lists all relevant URLs for your deployed stacks/environments`,
            async () => {
                const infoPlugins = context.plugins.byType("hook-stacks-info");
                for (let i = 0; i < infoPlugins.length; i++) {
                    const infoPlugin = infoPlugins[i];
                    await infoPlugin.hook({ first: i === 0, last: i === infoPlugins.length - 1 });
                }
            }
        );
    }
};
