import execa from "execa";
import * as path from "path";
import { merge, kebabCase, set } from "lodash";
import toConsole from "./toConsole";
import downloadBinaries from "./downloadBinaries";

type Command = string | string[];
type PulumiArgs = { [key: string]: string | boolean };
type ExecaArgs = { [key: string]: any };

type DefaultArgs = {
    args?: PulumiArgs;
    execa?: ExecaArgs;
    beforePulumiInstall?: () => any;
    afterPulumiInstall?: () => any;
};

type RunArgs = {
    command: Command;
    args?: PulumiArgs;
    execa?: ExecaArgs;
    beforePulumiInstall?: () => any;
    afterPulumiInstall?: () => any;
};

const FLAG_NON_INTERACTIVE = "--non-interactive";
const PULUMI_FOLDER = path.join(__dirname, "pulumi");

class Pulumi {
    defaultArgs: DefaultArgs;
    constructor(options: DefaultArgs = {}) {
        this.defaultArgs = options;
    }

    async run(rawArgs: RunArgs) {
        const args = merge({}, this.defaultArgs, rawArgs);

        const installed = await downloadBinaries(
            PULUMI_FOLDER,
            args.beforePulumiInstall,
            args.afterPulumiInstall
        );

        if (installed) {
            const subProcess = execa(
                path.join(PULUMI_FOLDER, "pulumi", "pulumi"),
                ["plugin", "install", "resource", "aws", "v2.13.1"],
                {
                    env: {
                        PULUMI_HOME: PULUMI_FOLDER
                    }
                }
            );

            await toConsole(subProcess);
        }

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

            switch (typeof value) {
                case "boolean":
                    finalArgs.push(`--${kebabCase(key)}`);
                    continue;
                default:
                    finalArgs.push(`--${kebabCase(key)}`, value);
            }
        }

        // Prepare execa args.
        set(args.execa, "env.PULUMI_SKIP_UPDATE_CHECK", "true");
        set(args.execa, "env.PULUMI_HOME", PULUMI_FOLDER);

        const subProcess = execa(
            path.join(PULUMI_FOLDER, "pulumi", "pulumi"),
            [...args.command, ...finalArgs, FLAG_NON_INTERACTIVE],
            args.execa
        );

        return {
            installed,
            process: subProcess,
            toConsole: () => toConsole(subProcess)
        };
    }
}

export { Pulumi };
