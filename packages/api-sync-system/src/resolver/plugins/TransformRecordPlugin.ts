import { Plugin } from "@webiny/plugins";
import type { ITable } from "~/sync/types.js";
import type { IDeployment } from "~/resolver/deployment/types.js";
import type { IStoreItem } from "~/resolver/app/storer/types.js";
import type { DynamoDBTableType } from "~/types.js";
import type { PluginsContainer } from "@webiny/plugins/PluginsContainer.js";

export interface ITransformRecordPluginConfigTransformCallableParams {
    readonly plugins: PluginsContainer;
    readonly record: IStoreItem;
    sourceDeployment: IDeployment;
    targetDeployment: IDeployment;
    sourceTable: ITable;
    targetTable: ITable;
}

export interface ITransformRecordPluginConfigCanTransformCallableParams {
    from: Omit<IDeployment, "getTable">;
    to: Omit<IDeployment, "getTable">;
}

export interface ITransformRecordPluginConfigCanTransformCallable {
    (params: ITransformRecordPluginConfigCanTransformCallableParams): boolean;
}

export interface ITransformRecordPluginConfigTransformCallable {
    (
        params: ITransformRecordPluginConfigTransformCallableParams,
        next: () => Promise<Readonly<IStoreItem>>
    ): Promise<Readonly<IStoreItem>>;
}

export interface ITransformRecordPluginConfig {
    tableType: DynamoDBTableType.REGULAR | DynamoDBTableType.ELASTICSEARCH;
    canTransform: ITransformRecordPluginConfigCanTransformCallable;
    transform: ITransformRecordPluginConfigTransformCallable;
}

export class TransformRecordPlugin extends Plugin {
    public static override type: string = "syncSystem.transformRecordPlugin";

    private readonly config: ITransformRecordPluginConfig;

    public constructor(config: ITransformRecordPluginConfig) {
        super();
        this.config = config;
    }

    public isForTableType(tableType: DynamoDBTableType): boolean {
        return this.config.tableType === tableType;
    }

    public canTransform(params: ITransformRecordPluginConfigCanTransformCallableParams): boolean {
        return this.config.canTransform(params);
    }

    public transform(
        params: ITransformRecordPluginConfigTransformCallableParams,
        next: () => Promise<Readonly<IStoreItem>>
    ): Promise<Readonly<IStoreItem>> {
        return this.config.transform(params, next);
    }
}

export const createTransformRecordPlugin = (config: ITransformRecordPluginConfig) => {
    return new TransformRecordPlugin(config);
};
