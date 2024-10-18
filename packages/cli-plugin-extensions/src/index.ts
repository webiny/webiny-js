import { CliCommandPlugin } from "@webiny/cli-plugin-scaffold/types";
import inquirer from "inquirer";
import { downloadAndLinkExtension } from "~/downloadAndLinkExtension";
import { generateExtension } from "~/generateExtension";
import { promptQuestions } from "~/promptQuestions";
import ora from "ora";
import { ExtensionCommandGenerateParams, ExtensionsCommandParams } from "~/types";
import { runYarnInstall } from "~/utils/runYarnInstall";
import { CliContext } from "@webiny/cli/types";

export interface CliPluginExtensionParams {
    context: CliContext;
    params: ExtensionsCommandParams;
}

export const cliPluginExtension = async (params: CliPluginExtensionParams) => {
    const oraInstance = ora();
    if ("downloadFrom" in params.params) {
        return downloadAndLinkExtension({
            ora: oraInstance,
            context: params.context,
            source: params.params.downloadFrom
        });
    }

    if ("type" in params.params) {
        return generateExtension({
            ora: oraInstance,
            context: params.context,
            input: params.params
        });
    }

    const input = (await inquirer.prompt(promptQuestions)) as ExtensionCommandGenerateParams;

    return generateExtension({
        ora: oraInstance,
        input,
        context: params.context
    });
};

export default (): CliCommandPlugin[] => {
    return [
        {
            type: "cli-command",
            name: "cli-command-extension",
            create({ yargs, context }) {
                yargs.command(
                    "extension [download-from]",
                    "Create a new extension",
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
                    (params: ExtensionsCommandParams) => cliPluginExtension({ context, params })
                );
            }
        },
        {
            type: "cli-command",
            name: "cli-command-link-extensions",
            // @ts-ignore This plugin doesn't have a type
            create({ yargs }) {
                yargs.command(["link-extensions"], `Link all project extensions.`, async () => {
                    await import(__dirname + "/utils/linkAllExtensions.js").then(m =>
                        m.linkAllExtensions()
                    );

                    await runYarnInstall();

                    process.exit(0);
                });
            }
        }
    ];
};
