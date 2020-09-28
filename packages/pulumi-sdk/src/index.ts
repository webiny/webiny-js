import execa from "execa";
import * as path from "path";
import { merge, kebabCase, get, set } from "lodash";
import toConsole from "./toConsole";

type Command = string | string[];
type PulumiArgs = { [key: string]: string | boolean };
type ExecaArgs = { [key: string]: string };

type ConstructorOptions = {
    defaults?: {
        pulumi: PulumiArgs;
        execa: ExecaArgs;
    };
};

const FLAG_NON_INTERACTIVE = "--non-interactive";

class Pulumi {
    options: ConstructorOptions;
    constructor(options: ConstructorOptions = {}) {
        this.options = options;
    }

    run(command: Command, pulumiArgs?: PulumiArgs, rawExeca?: ExecaArgs) {
        if (!Array.isArray(command)) {
            command = [command];
        }

        // 1. Prepare Pulumi args.
        const normalizedPulumiArgs = merge({}, get(this.options, "defaults.pulumi"), pulumiArgs);
        const finalPulumiArgs = [];
        for (const key in normalizedPulumiArgs) {
            const value = normalizedPulumiArgs[key];
            if (!value) {
                continue;
            }

            switch (typeof value) {
                case "boolean":
                    finalPulumiArgs.push(`--${kebabCase(key)}`);
                    continue;
                default:
                    finalPulumiArgs.push(`--${kebabCase(key)}`, value);
            }
        }

        // Prepare Execa args.
        const finalExecaArgs = merge({}, get(this.options, "defaults.execa"), rawExeca);

        set(finalExecaArgs, "env.PULUMI_SKIP_UPDATE_CHECK", "true");

        const subProcess = execa(
            path.join(__dirname, "binaries", "pulumi", "pulumi"),
            [...command, ...finalPulumiArgs, FLAG_NON_INTERACTIVE],
            finalExecaArgs
        );

        return {
            process: subProcess,
            toConsole: () => toConsole(subProcess)
        };
    }
}

export { Pulumi };
