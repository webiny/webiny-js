const { green } = require("chalk");
const { Pulumi } = require("@webiny/pulumi-sdk");
const ora = require("ora");
const merge = require("lodash/merge");
const { getProject } = require("@webiny/cli/utils");
const path = require("path");

module.exports = async ({ projectApplication, pulumi, install }) => {
    const spinner = new ora();

    const instance = new Pulumi(
        merge(
            {
                pulumiFolder: path.join(getProject().root, ".webiny"),
                beforePulumiInstall: () => {
                    console.log(
                        `It looks like this is your first time using ${green(
                            "@webiny/pulumi-sdk"
                        )}.`
                    );
                    spinner.start(`Downloading Pulumi...`);
                },
                afterPulumiInstall: () => {
                    spinner.stopAndPersist({
                        symbol: green("✔"),
                        text: `Pulumi downloaded, continuing...`
                    });
                }
            },
            projectApplication && {
                execa: {
                    cwd:
                        projectApplication.type === "v5-workspaces"
                            ? projectApplication.paths.workspace
                            : projectApplication.paths.absolute
                }
            },
            pulumi
        )
    );

    // Run install method, just in case Pulumi wasn't installed yet.
    if (install !== false) {
        await instance.install();
    }

    return instance;
};
