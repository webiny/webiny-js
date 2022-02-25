import { green } from "chalk";
import ora from "ora";
import merge from "lodash/merge";
import { Pulumi, Options as PulumiOptions } from "@webiny/pulumi-sdk-v6";
import { useContext } from "@webiny/cli";

interface Options {
    install?: boolean;
}

export const getPulumi = async (args: PulumiOptions = {}, options: Options = {}) => {
    const context = await useContext();
    const spinner = ora();

    const pulumi = new Pulumi(
        merge(
            {
                pulumiFolder: context.resolve(".webiny"),
                beforePulumiInstall: () => {
                    console.log(
                        `It looks like this is your first time using ${green(
                            "@webiny/pulumi-sdk-v6"
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
