import { createImplementation } from "@webiny/di";
import { CliCommandFactory, GetProjectSdkService, UiService } from "~/abstractions/index.js";
import chalk from "chalk";
import ora from "ora";

interface IExtensionCommandParams {
    source: string;
}

export class ExtensionCommand implements CliCommandFactory.Interface<IExtensionCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    execute(): CliCommandFactory.CommandDefinition<IExtensionCommandParams> {
        return {
            name: "extension",
            description: "Download and install extensions from the Webiny extensions repository.",
            params: [
                {
                    name: "source",
                    description: "Extension name or path (e.g., admin-logo)",
                    type: "string",
                    required: true
                }
            ],
            examples: ["webiny extension admin-logo", "webiny extension my-api-extension"],
            handler: async (args: IExtensionCommandParams) => {
                const { source } = args;

                const spinner = ora();
                const projectSdk = await this.getProjectSdkService.execute();

                spinner.start("Installing extension...");

                try {
                    const result = await projectSdk.installExtension(source);

                    spinner.succeed(
                        `Extension "${result.extensionName}" installed successfully to ${result.extensionPaths.join(", ")}`
                    );

                    // Display next steps if available
                    if (result.nextSteps && result.nextSteps.length > 0) {
                        this.uiService.emptyLine();
                        this.uiService.text(chalk.bold("Next Steps"));
                        result.nextSteps.forEach(({ text, variables = [] }) => {
                            const formattedText = variables.reduce(
                                (acc, variable) => acc.replace(`%s`, chalk.green(variable)),
                                text
                            );
                            this.uiService.text(`‣ ${formattedText}`);
                        });
                    }

                    // Display additional notes if available
                    if (result.additionalNotes && result.additionalNotes.length > 0) {
                        this.uiService.emptyLine();
                        this.uiService.text(chalk.bold("Additional Notes"));
                        result.additionalNotes.forEach(({ text, variables = [] }) => {
                            const formattedText = variables.reduce(
                                (acc, variable) => acc.replace(`%s`, chalk.green(variable)),
                                text
                            );
                            this.uiService.text(`‣ ${formattedText}`);
                        });
                    }
                } catch (error) {
                    spinner.fail("Installation failed.");
                    throw new Error(
                        `Failed to install extension from source "${source}": ${error.message}`
                    );
                }
            }
        };
    }
}

export const extensionCommand = createImplementation({
    abstraction: CliCommandFactory,
    implementation: ExtensionCommand,
    dependencies: [GetProjectSdkService, UiService]
});
