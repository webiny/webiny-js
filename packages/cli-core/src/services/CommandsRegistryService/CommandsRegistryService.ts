import { createImplementation } from "@webiny/di";
import { CliCommand, CommandsRegistryService } from "~/abstractions/index.js";

export class DefaultCommandsRegistryService implements CommandsRegistryService.Interface {
    constructor(private commands: CliCommand.Interface<any>[]) {}

    execute() {
        return this.commands;
    }
}

export const commandsRegistryService = createImplementation({
    abstraction: CommandsRegistryService,
    implementation: DefaultCommandsRegistryService,
    dependencies: [[CliCommand, { multiple: true }]]
});
