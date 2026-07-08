import { execa } from "execa";
import chalk from "chalk";
const { green } = chalk;

export class EnsureNoGlobalWebinyCli {
    async execute() {
        try {
            await execa("npm", ["list", "-g", "@webiny/cli"]);
            console.log(
                [
                    "",
                    "🚨 IMPORTANT NOTICE:",
                    "----------------------------------------",
                    `We've detected a global installation of ${green(
                        "@webiny/cli"
                    )}. This might not play well with your new project.`,
                    `We recommend you do one of the following things:\n`,
                    ` - uninstall the global @webiny/cli package by running ${green(
                        "npm rm -g @webiny/cli"
                    )} or`,
                    ` - run webiny commands using ${green(
                        "yarn webiny"
                    )} so that the package is always resolved to your project dependencies\n`,
                    `The second option is also recommended if you have an older version of Webiny project you want to keep using.`,
                    "----------------------------------------",
                    ""
                ].join("\n")
            );

            process.exit(1);
        } catch {
            // @webiny/cli is not installed globally
        }
    }
}
