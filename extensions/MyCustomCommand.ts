import { CliCommand } from "webiny/cli/features/CliCommand";
import { UiService } from "webiny/cli/features/Ui";

export interface IMyCustomCommandParams {
    name: string;
}

class MyCustomCommandImpl implements CliCommand.Interface<IMyCustomCommandParams> {
    constructor(private ui: UiService.Interface) {}

    execute(): CliCommand.CommandDefinition<IMyCustomCommandParams> {
        return {
            name: "my-custom-command",
            description: "This is my custom command",
            examples: ["$0 my-custom-command test1", "$0 my-custom-command test2"],
            params: [
                {
                    name: "name",
                    description: "Your name",
                    type: "string"
                }
            ],
            handler: async params => {
                this.ui.info("Starting my custom command...");
                this.ui.newLine();
                this.ui.success(`Hello, ${params.name}! This is my custom command.`);
            }
        };
    }
}

export const MyCustomCommand = CliCommand.createImplementation({
    implementation: MyCustomCommandImpl,
    dependencies: [UiService]
});
