import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { CliCommandFactory } from "~/abstractions/index.js";

export interface ICommandsRegistryService {
    execute(): CliCommandFactory.Interface<any>[];
}

export const CommandsRegistryService =
    createAbstraction<ICommandsRegistryService>("CommandsRegistryService");

export namespace CommandsRegistryService {
    export type Interface = ICommandsRegistryService;
}
