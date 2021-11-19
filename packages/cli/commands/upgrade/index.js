const { red } = require("chalk");
const execa = require("execa");
const semver = require("semver");

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
                    yargs.option("use-version", {
                        describe:
                            "Use upgrade script for a specific version. Should only be used for development/testing purposes.",
                        type: "string"
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

                    const defaultUpgradeTargetVersion = semver.coerce(context.version).version;
                    const ctx = {
                        project: {
                            name: context.project.name,
                            root: context.project.root
                        }
                    };

                    await execa(
                        "npx",
                        [
                            "https://github.com/webiny/webiny-upgrades",
                            argv.useVersion || defaultUpgradeTargetVersion,
                            "--context",
                            `'${JSON.stringify(ctx)}'`
                        ],
                        {
                            stdio: "inherit"
                        }
                    );
                }
            );
        }
    }
];
