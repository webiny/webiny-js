const upgrades = require("./upgrades");
const { red } = require("chalk");

module.exports = [
    upgrades,
    {
        type: "cli-command",
        name: "cli-command-upgrade",
        create({ yargs, context }) {
            yargs.example("$0 upgrade 5.5.0");
            yargs.command(
                "upgrade <target-version>",
                `Run an upgrade script for a specific Webiny version`,
                yargs => {
                    yargs.positional("target-version", {
                        describe: `A version to which you want to upgrade`,
                        type: "string"
                    });
                },
                async argv => {
                    const plugin = context.plugins
                        .byType("cli-upgrade")
                        .find(plugin => plugin.version === argv.targetVersion);

                    if (!plugin) {
                        throw new Error(
                            `An upgrade script for specified version (${red(
                                argv.targetVersion
                            )}) was not found.`
                        );
                    }

                    if (typeof plugin.canUpgrade === "function") {
                        try {
                            const canUpgrade = await plugin.canUpgrade(argv, context);
                            if (canUpgrade === false) {
                                throw new Error();
                            }
                        } catch (ex) {
                            const msg = ex.message || "unknown";
                            throw new Error(
                                `Cannot upgrade to ${argv.targetVersion}. Reason: ${msg}`
                            );
                        }
                    }

                    await plugin.upgrade(argv, context);
                }
            );
        }
    }
];
