import { Plugin } from "@webiny/plugins/Plugin.js";
import { CommandType } from "~/types.js";
import type { IStoreItem } from "~/resolver/app/storer/types.js";
import type { ITable } from "~/sync/types.js";
import type { IDeployment } from "~/resolver/deployment/types.js";

export interface IStorerAfterEachPluginCanHandleParams {
    command: CommandType;
    target: IDeployment;
    source: IDeployment;
    table: ITable;
    item: IStoreItem;
}

export interface IStorerAfterEachPluginHandleParams {
    target: IDeployment;
    source: IDeployment;
    table: ITable;
    item: IStoreItem;
}

export interface IStorerAfterEachPluginParams {
    canHandle: (params: IStorerAfterEachPluginCanHandleParams) => boolean;
    handle: (params: IStorerAfterEachPluginHandleParams) => Promise<void>;
}

export class StorerAfterEachPlugin extends Plugin {
    public static override readonly type: string = "syncSystem.storerAfterEachPlugin";

    private readonly config: IStorerAfterEachPluginParams;

    public constructor(config: IStorerAfterEachPluginParams) {
        super();
        this.config = config;
    }

    public canHandle(params: IStorerAfterEachPluginCanHandleParams): boolean {
        return this.config.canHandle(params);
    }

    public handle(params: IStorerAfterEachPluginHandleParams): Promise<void> {
        return this.config.handle(params);
    }
}

export const createStorerAfterEachPlugin = (params: IStorerAfterEachPluginParams) => {
    return new StorerAfterEachPlugin(params);
};

export const createStorerAfterEachPluginWithName = (
    name: string,
    params: IStorerAfterEachPluginParams
) => {
    const plugin = createStorerAfterEachPlugin(params);
    plugin.name = `${StorerAfterEachPlugin.type}.${name}`;
    return plugin;
};
