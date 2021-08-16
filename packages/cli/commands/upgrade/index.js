const { red } = require("chalk");
const execa = require("execa");

module.exports = [
    {
        type: "cli-command",
        name: "cli-command-upgrade",
        create({ yargs, context }) {
            yargs.example("$0 upgrade");
            yargs.command(
                "upgrade",
                `Run an upgrade script for currently installed version of Webiny`,
                yargs => {
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

                    const { canUpgrade, upgrade } = require("./upgrades/upgrade");
                    if (typeof canUpgrade === "function" && !argv.skipChecks) {
                        try {
                            const canPerformUpgrade = await canUpgrade(argv, context);
                            if (canPerformUpgrade === false) {
                                throw new Error();
                            }
                        } catch (ex) {
                            const msg = ex.message || "unknown";
                            throw new Error(`Upgrade failed. Reason: ${msg}`);
                        }
                    }

                    await upgrade(argv, context);
                }
            );
        }
    }
];
