const generateTsConfigs = require("./generateTsConfigs");

module.exports = () => {
    return {
        type: "cli-command",
        name: "cli-command-generate-tsconfigs",
        create({ yargs, context }) {
            yargs.command(
                "tools generate-tsconfigs <folder>",
                "Generate tsconfig files",
                yargs => {
                    yargs.positional("folder", {
                        describe: `Workspace to generate TS configs in.`,
                        type: "string"
                    });
                },
                args => {
                    return generateTsConfigs({ folder: args.folder, context });
                }
            );
        }
    };
};
