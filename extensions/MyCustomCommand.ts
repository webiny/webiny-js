import { CliCommandFactory } from "webiny/cli/command";
import { Ui } from "webiny/cli/ui";
import { Logger } from "webiny/cli/logger";

export interface IMyCustomCommandParams {
    name: string;
}

class MyCustomCommandImpl implements CliCommandFactory.Interface<IMyCustomCommandParams> {
    constructor(
        private readonly ui: Ui.Interface,
        private readonly logger: Logger.Interface
    ) {}

    execute(): CliCommandFactory.CommandDefinition<IMyCustomCommandParams> {
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
                this.ui.emptyLine();
                this.ui.success(`Hello, ${params.name}! This is my custom command.`);
            }
        };
    }
}

export default CliCommandFactory.createImplementation({
    implementation: MyCustomCommandImpl,
    dependencies: [Ui, Logger]
});
