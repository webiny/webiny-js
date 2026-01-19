import { createImplementation } from "@webiny/di";
import { CliCommandFactory, CommandsRegistryService } from "~/abstractions/index.js";

export class DefaultCommandsRegistryService implements CommandsRegistryService.Interface {
    constructor(private commands: CliCommandFactory.Interface<any>[]) {}

    execute() {
        return this.commands;
    }
}

export const commandsRegistryService = createImplementation({
    abstraction: CommandsRegistryService,
    implementation: DefaultCommandsRegistryService,
    dependencies: [[CliCommandFactory, { multiple: true }]]
});
