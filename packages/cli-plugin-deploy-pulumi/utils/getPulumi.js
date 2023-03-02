const { green, red } = require("chalk");
const { Pulumi } = require("@webiny/pulumi-sdk");
const ora = require("ora");
const merge = require("lodash/merge");
const { getProject } = require("@webiny/cli/utils");
const path = require("path");
const fs = require("fs");

module.exports = async ({ projectApplication, pulumi, install }) => {
    const spinner = new ora();

    let cwd = projectApplication.paths.absolute;
    if (projectApplication.type === "v5-workspaces") {
        cwd = projectApplication.paths.workspace;
        if (!fs.existsSync(cwd)) {
            const message = [
                "The command cannot be run because the project application hasn't been built. ",
                "To build the application, run ",
                red(`yarn webiny build ${projectApplication.paths.relative} --env {environment}`),
                "."
            ].join("");
            throw new Error(message);
        }
    }

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
            projectApplication && { execa: { cwd } },
            pulumi
        )
    );

    // Run install method, just in case Pulumi wasn't installed yet.
    if (install !== false) {
        await instance.install();
    }

    return instance;
};
