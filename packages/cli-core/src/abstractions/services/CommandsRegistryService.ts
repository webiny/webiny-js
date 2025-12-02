import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { CliCommand } from "~/abstractions/index.js";

export interface ICommandsRegistryService {
    execute(): CliCommand.Interface<any>[];
}

export const CommandsRegistryService =
    createAbstraction<ICommandsRegistryService>("CommandsRegistryService");

export namespace CommandsRegistryService {
    export type Interface = ICommandsRegistryService;
}
