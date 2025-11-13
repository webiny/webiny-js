import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { Command } from "~/abstractions/index.js";

export interface ICommandsRegistryService {
    execute(): Command.Interface<any>[];
}

export const CommandsRegistryService = createAbstraction<ICommandsRegistryService>(
    "CommandsRegistryService"
);

export namespace CommandsRegistryService {
    export type Interface = ICommandsRegistryService;
}
