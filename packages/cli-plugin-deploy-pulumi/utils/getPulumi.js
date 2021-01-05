const { green } = require("chalk");
const { Pulumi } = require("@webiny/pulumi-sdk");
const ora = require("ora");
import merge from "lodash/merge";

module.exports = async (cwd, args = {}) => {
    const spinner = new ora();

    return new Pulumi(
        merge(
            {
                execa: {
                    cwd,
                    env: {
                        PULUMI_CONFIG_PASSPHRASE: process.env.PULUMI_CONFIG_PASSPHRASE
                    }
                },
                args: {
                    secretsProvider: "passphrase"
                },
                beforePulumiInstall: () => {
                    console.log(
                        `💡 It looks like this is your first time using ${green(
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
};
