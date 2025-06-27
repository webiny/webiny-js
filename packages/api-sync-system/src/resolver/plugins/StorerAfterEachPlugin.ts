import { Plugin } from "@webiny/plugins/Plugin.js";
import { CommandType } from "~/types.js";
import type { IStoreItem } from "~/resolver/app/storer/types.js";
import type { ITable } from "~/sync/types.js";
import type {
    DeleteCommandOutput,
    PutCommandOutput
} from "@webiny/aws-sdk/client-dynamodb/index.js";

export interface IStorerAfterEachPluginCanHandleParams {
    command: CommandType;
    item: IStoreItem;
    table: ITable;
    result: PutCommandOutput | DeleteCommandOutput;
}

export interface IStorerAfterEachPluginHandleParams<T> {
    command: CommandType;
    item: IStoreItem;
    table: ITable;
    result: T;
}

export interface IStorerAfterEachPluginParams {
    canHandle: (params: IStorerAfterEachPluginCanHandleParams) => boolean;
    handle: <T>(params: IStorerAfterEachPluginHandleParams<T>) => Promise<void>;
}

export class StorerAfterEachPlugin<T = PutCommandOutput | DeleteCommandOutput> extends Plugin {
    public static override readonly type: string = "syncSystem.storerAfterEachPlugin";

    private readonly config: IStorerAfterEachPluginParams;

    public constructor(config: IStorerAfterEachPluginParams) {
        super();
        this.config = config;
    }

    public canHandle(params: IStorerAfterEachPluginCanHandleParams): boolean {
        return this.config.canHandle(params);
    }

    public handle(params: IStorerAfterEachPluginHandleParams<T>): Promise<void> {
        return this.config.handle<T>(params);
    }
}

export const createStorerAfterEachPlugin = <T>(params: IStorerAfterEachPluginParams) => {
    return new StorerAfterEachPlugin<T>(params);
};

export const createStorerAfterEachPluginWithName = <T>(
    name: string,
    params: IStorerAfterEachPluginParams
) => {
    const plugin = createStorerAfterEachPlugin<T>(params);
    plugin.name = `${StorerAfterEachPlugin.type}.${name}`;
    return plugin;
};
