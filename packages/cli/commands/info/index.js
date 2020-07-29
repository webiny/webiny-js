module.exports = {
    type: "cli-command",
    name: "cli-command-info",
    create({ yargs, context }) {
        yargs.command(
            "info",
            `Lists all relevant URLs for your deployed stacks/environments`,
            () => {
                const infoPlugins = context.plugins.byType("hook-stacks-info");
                for (const infoPlugin of infoPlugins) {
                    infoPlugin.hook();
                }
            }
        );
    }
};
