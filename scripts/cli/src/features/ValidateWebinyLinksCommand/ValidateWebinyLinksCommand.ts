import { createImplementation } from "@webiny/di";
import { Command, UiService } from "../../abstractions/index.js";
import { ValidateWebinyLinks } from "./ValidateWebinyLinks.js";

interface CommandParams {
    errorOnBrokenLinks?: boolean;
}

export class ValidateWebinyLinksCommand implements Command.Interface<CommandParams> {
    constructor(private ui: UiService.Interface) {}

    async execute(): Promise<Command.CommandDefinition<CommandParams>> {
        return {
            name: "validate-webiny-links",
            description: "Validates webiny.link URLs in the packages folder",
            params: [],
            options: [
                {
                    name: "error-on-broken-links",
                    description: "Exit with error code 1 if broken links are found",
                    type: "boolean",
                    default: false
                }
            ],
            handler: async (params: CommandParams) => {
                const validator = new ValidateWebinyLinks(this.ui);
                await validator.execute(params.errorOnBrokenLinks || false);
            }
        };
    }
}

export const validateWebinyLinksCommand = createImplementation({
    abstraction: Command,
    implementation: ValidateWebinyLinksCommand,
    dependencies: [UiService]
});
