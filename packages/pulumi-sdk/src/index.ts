import execa from "execa";
import { merge, kebabCase, get } from "lodash";
import toConsole from "./toConsole";

type Command = string | string[];
type Flags = { [key: string]: string | boolean };
type Options = {
    env?: { [key: string]: string };
};

type ConstructorOptions = {
    defaults?: {
        flags: Flags;
        options: Options;
    };
};

class Pulumi {
    options: ConstructorOptions;
    constructor(options: ConstructorOptions = {}) {
        this.options = options;
    }

    run(command: Command, rawFlags: Flags, rawOptions: Options = {}) {
        if (!Array.isArray(command)) {
            command = [command];
        }

        const normalizedFlags = merge({}, get(this.options, "defaults.flags"), rawFlags);
        const finalFlags = [];
        for (const key in normalizedFlags) {
            const value = normalizedFlags[key];
            if (!value) {
                continue;
            }

            switch (typeof value) {
                case "boolean":
                    finalFlags.push(`--${kebabCase(key)}`);
                    continue;
                default:
                    finalFlags.push(`--${kebabCase(key)}`, value);
            }
        }

        const finalOptions = merge({}, get(this.options, "defaults.options"), rawOptions);

        const subProcess = execa(
            "pulumi",
            [...command, ...finalFlags, "--non-interactive"],
            finalOptions
        );

        // @ts-ignore
        subProcess.toConsole = () => {
            return toConsole(subProcess);
        };

        return subProcess;
    }
}

export { Pulumi };
