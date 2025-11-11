import { createImplementation } from "@webiny/di";
import { Command, CommandsRegistryService } from "../../abstractions/index.js";

export class DefaultCommandsRegistryService implements CommandsRegistryService.Interface {
    constructor(private commands: Command.Interface<any>[]) {}

    execute() {
        return this.commands;
    }
}

export const commandsRegistryService = createImplementation({
    abstraction: CommandsRegistryService,
    implementation: DefaultCommandsRegistryService,
    dependencies: [[Command, { multiple: true }]]
});
