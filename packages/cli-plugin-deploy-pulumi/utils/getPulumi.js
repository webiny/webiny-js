const { green } = require("chalk");
const { Pulumi } = require("@webiny/pulumi-sdk");
const ora = require("ora");
const merge = require("lodash/merge");

module.exports = async (args = {}, options = {}) => {
    const spinner = new ora();

    const pulumi = new Pulumi(
        merge(
            {
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
            args
        )
    );

    // Run install method, just in case Pulumi wasn't installed yet.
    if (options.install !== false) {
        await pulumi.install();
    }

    return pulumi;
};
