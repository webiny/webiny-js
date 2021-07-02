const upgrades = require("./upgrades");
const { red } = require("chalk");
const execa = require("execa");

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

                    yargs.option("skip-checks", {
                        describe: "Do not perform CLI version and Git tree checks.",
                        type: "boolean",
                        default: false
                    });
                },
                async argv => {
                    if (!argv.skipChecks) {
                        // Before doing any upgrading, there must not be any active changes in the current branch.
                        let gitStatus = "";
                        try {
                            let { stdout } = execa.sync("git", ["status", "--porcelain"]);
                            gitStatus = stdout.trim();
                        } catch {}

                        if (gitStatus) {
                            console.error(
                                red(
                                    "This git repository has untracked files or uncommitted changes:"
                                ) +
                                    "\n\n" +
                                    gitStatus
                                        .split("\n")
                                        .map(line => line.match(/ .*/g)[0].trim())
                                        .join("\n") +
                                    "\n\n" +
                                    red(
                                        "Remove untracked files, stash or commit any changes, and try again."
                                    )
                            );
                            process.exit(1);
                        }
                    }

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

                    if (typeof plugin.canUpgrade === "function" && !argv.skipChecks) {
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
