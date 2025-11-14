import { Command } from "webiny/cli/features/Command.js";
import { UiService } from "webiny/cli/features/Ui.js";

export interface IMyCustomCommandParams {
    name: string;
}

class MyCustomCommandImpl implements Command.Interface<IMyCustomCommandParams> {
    constructor(private ui: UiService.Interface) {}

    execute(): Command.CommandDefinition<IMyCustomCommandParams> {
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

export const MyCustomCommand = Command.createImplementation({
    implementation: MyCustomCommandImpl,
    dependencies: [UiService]
});
