import { Plugin } from "@webiny/plugins";
import type { CommandType } from "~/types.js";
import type { IStoreItem, IStorer } from "~/resolver/app/storer/types.js";
import type { IDeployment } from "~/resolver/deployment/types.js";
import type { ITable } from "~/sync/types.js";
import type { IBundle } from "~/resolver/app/bundler/types.js";

export interface ICommandHandlerPluginCallable {
    (params: ICommandHandlerPluginHandleParams): Promise<void>;
}

export interface ICommandHandlerPluginCanHandleCallable {
    (command: CommandType): boolean;
}

export interface ICommandHandlerPluginHandleParams {
    storer: IStorer;
    items: IStoreItem[];
    bundle: IBundle;
    targetDeployment: IDeployment;
    targetTable: ITable;
}

export interface ICommandHandlerPluginParams {
    handle: ICommandHandlerPluginCallable;
    canHandle: ICommandHandlerPluginCanHandleCallable;
}

export class CommandHandlerPlugin extends Plugin {
    public static override type: string = "syncSystem.commandHandlerPlugin";

    private readonly config: ICommandHandlerPluginParams;

    public constructor(params: ICommandHandlerPluginParams) {
        super();
        this.config = params;
    }

    public canHandle(command: CommandType): boolean {
        return this.config.canHandle(command);
    }

    public async handle(params: ICommandHandlerPluginHandleParams): Promise<void> {
        return await this.config.handle(params);
    }
}

export const createCommandHandlerPlugin = (
    params: ICommandHandlerPluginParams
): CommandHandlerPlugin => {
    return new CommandHandlerPlugin(params);
};
