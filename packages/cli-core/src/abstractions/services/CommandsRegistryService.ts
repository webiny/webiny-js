import { Abstraction } from "@webiny/di";
import { Command } from "~/abstractions/index.js";

export interface ICommandsRegistryService {
    execute(): Command.Interface<any>[];
}

export const CommandsRegistryService = new Abstraction<ICommandsRegistryService>(
    "CommandsRegistryService"
);

export namespace CommandsRegistryService {
    export type Interface = ICommandsRegistryService;
}
