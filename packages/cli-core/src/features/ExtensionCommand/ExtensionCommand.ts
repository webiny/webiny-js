import { createImplementation } from "@webiny/di";
import { CliCommand, GetProjectSdkService, UiService } from "~/abstractions/index.js";
import { InstallExtensionService } from "@webiny/project/abstractions/services/InstallExtensionService.js";
import chalk from "chalk";
import ora from "ora";

interface IExtensionCommandParams {
    source: string;
}

export class ExtensionCommand implements CliCommand.Interface<IExtensionCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface,
        private installExtensionService: InstallExtensionService.Interface
    ) {}

    execute(): CliCommand.CommandDefinition<IExtensionCommandParams> {
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

                const result = await this.installExtensionService.execute({
                    source,
                    onProgress: (message: string) => {
                        spinner.start(message);
                    },
                    onSuccess: (message: string) => {
                        spinner.succeed(message);
                    },
                    onError: (message: string) => {
                        spinner.fail(message);
                    }
                });

                // Display next steps if available
                if (result.success && result.nextSteps && result.nextSteps.length > 0) {
                    this.uiService.emptyLine();
                    this.uiService.text(chalk.bold("Next Steps"));
                    result.nextSteps.forEach(({ text, variables = [] }) => {
                        const formattedText = variables.reduce(
                            (acc, variable, index) => acc.replace(`%s`, chalk.green(variable)),
                            text
                        );
                        this.uiService.text(`‣ ${formattedText}`);
                    });
                }

                // Display additional notes if available
                if (result.success && result.additionalNotes && result.additionalNotes.length > 0) {
                    this.uiService.emptyLine();
                    this.uiService.text(chalk.bold("Additional Notes"));
                    result.additionalNotes.forEach(({ text, variables = [] }) => {
                        const formattedText = variables.reduce(
                            (acc, variable, index) => acc.replace(`%s`, chalk.green(variable)),
                            text
                        );
                        this.uiService.text(`‣ ${formattedText}`);
                    });
                }

                if (!result.success) {
                    process.exit(1);
                }
            }
        };
    }
}

export const extensionCommand = createImplementation({
    abstraction: CliCommand,
    implementation: ExtensionCommand,
    dependencies: [GetProjectSdkService, UiService, InstallExtensionService]
});
