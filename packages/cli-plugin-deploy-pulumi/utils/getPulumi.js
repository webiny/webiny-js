module.exports = async ({ projectApplication, pulumi, install }) => {
    const { green, red } = require("chalk");
    const { Pulumi } = require("@webiny/pulumi-sdk");
    const ora = require("ora");
    const merge = require("lodash/merge");
    const { getProject } = require("@webiny/cli/utils");
    const path = require("path");
    const fs = require("fs");

    const spinner = new ora();

    let cwd;

    // When running the `webiny deploy` command without specifying the
    // project application, the `projectApplication` variable is empty.
    if (projectApplication) {
        cwd = projectApplication.paths.workspace;
        if (!fs.existsSync(cwd)) {
            const cmd = `yarn webiny build ${projectApplication.paths.relative} --env {environment}`;
            const message = [
                "The command cannot be run because the project application hasn't been built. ",
                "To build it, run ",
                red(cmd),
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
            { execa: { cwd } },
            pulumi
        )
    );

    // Run install method, just in case Pulumi wasn't installed yet.
    if (install !== false) {
        await instance.install();
    }

    return instance;
};
