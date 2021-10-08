import os from "os";
import execa from "execa";
import * as path from "path";
import { merge, kebabCase, set } from "lodash";
import downloadBinaries from "./downloadBinaries";

type Command = string | string[];
type PulumiArgs = { [key: string]: string | boolean };
type ExecaArgs = { [key: string]: any };

type Options = {
    args?: PulumiArgs;
    execa?: ExecaArgs;
    beforePulumiInstall?: () => any;
    afterPulumiInstall?: () => any;

    // A folder into which the Pulumi CLI, along with all of its meta data and config files, will be set up.
    // It's recommended this folder is not checked in into a code repository, since the Pulumi CLI can store
    // sensitive information here, for example - user's Pulumi Service credentials.
    pulumiFolder?: string;
};

type RunArgs = {
    command: Command;
    args?: PulumiArgs;
    execa?: ExecaArgs;
    beforePulumiInstall?: () => any;
    afterPulumiInstall?: () => any;
};

type InstallArgs = {
    beforePulumiInstall?: () => any;
    afterPulumiInstall?: () => any;
};

export const FLAG_NON_INTERACTIVE = "--non-interactive";

export class Pulumi {
    options: Options;
    pulumiFolder: string;
    pulumiBinaryPath: string;
    constructor(options: Options = {}) {
        this.options = options;

        this.pulumiFolder = path.join(
            options.pulumiFolder || process.cwd(),
            "pulumi-cli",
            os.platform()
        );
        this.pulumiBinaryPath = path.join(this.pulumiFolder, "pulumi", "pulumi");
    }

    run(rawArgs: RunArgs) {
        const args = merge({}, this.options, rawArgs);

        if (!Array.isArray(args.command)) {
            args.command = [args.command];
        }

        // 1. Prepare Pulumi args.
        const finalArgs = [];
        for (const key in args.args) {
            const value = args.args[key];
            if (!value) {
                continue;
            }

            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    finalArgs.push(`--${kebabCase(key)}`, value[i]);
                }
                continue;
            }

            if (typeof value === "boolean") {
                finalArgs.push(`--${kebabCase(key)}`);
                continue;
            }

            finalArgs.push(`--${kebabCase(key)}`, value);
        }

        // Prepare execa args.
        set(args.execa, "env.PULUMI_SKIP_UPDATE_CHECK", "true");
        set(args.execa, "env.PULUMI_HOME", this.pulumiFolder);

        return execa(this.pulumiBinaryPath, [...args.command, ...finalArgs, FLAG_NON_INTERACTIVE], {
            ...args.execa
        });
    }

    async install(rawArgs?: InstallArgs): Promise<boolean> {
        const args = merge({}, this.options, rawArgs);

        const installed = await downloadBinaries(
            this.pulumiFolder,
            args.beforePulumiInstall,
            args.afterPulumiInstall
        );

        if (installed) {
            const { version } = require("@pulumi/aws/package.json");
            await execa(
                this.pulumiBinaryPath,
                ["plugin", "install", "resource", "aws", version],
                {
                    stdio: "inherit",
                    env: {
                        PULUMI_HOME: this.pulumiFolder,
                        PULUMI_SKIP_UPDATE_CHECK: "true"
                    }
                }
            );
        }

        return installed;
    }
}
