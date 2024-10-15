import { newExtensionScaffold } from "@webiny/cli-plugin-scaffold-extensions";
import { CliCommandPlugin } from "@webiny/cli-plugin-scaffold/types";
import inquirer from "inquirer";
import { downloadAndLinkExtension } from "~/downloadAndLinkExtension";
import { generateExtension } from "~/generateExtension";
import { promptQuestions } from "~/promptQuestions";
import ora from "ora";
import { ExtensionCommandGenerateParams, ExtensionsCommandParams } from "~/types";

export const EXTENSIONS_ROOT_FOLDER = "extensions";

export default (): CliCommandPlugin => ({
    type: "cli-command",
    name: "cli-command-extension",
    create({ yargs, context }) {
        yargs.command(
            "extension [download-from]",
            newExtensionScaffold.description,
            (yargs: Record<string, any>) => {
                yargs.example("$0 extension");
                yargs.example("$0 extension --type admin --name customFilePreview");
                yargs.example("$0 extension admin-logo");

                yargs.option("type", {
                    describe: `Name of the extension to run (used when running in non-interactive mode).`,
                    type: "string"
                });
                yargs.option("name", {
                    describe: `Arguments for the extension to run (used when running in non-interactive mode).`,
                    type: "string"
                });
            },
            async (params: ExtensionsCommandParams) => {
                const oraInstance = ora();
                if ("downloadFrom" in params) {
                    return downloadAndLinkExtension({
                        ora: oraInstance,
                        context,
                        source: params.downloadFrom
                    });
                }

                if ("type" in params) {
                    return generateExtension({
                        ora: oraInstance,
                        context,
                        input: params
                    });
                }

                const input = await inquirer.prompt(promptQuestions) as ExtensionCommandGenerateParams;

                return generateExtension({
                    ora: oraInstance,
                    input,
                    context
                });
            }
        );
    }
});
