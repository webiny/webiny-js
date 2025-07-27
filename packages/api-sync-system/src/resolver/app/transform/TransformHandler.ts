import type { ITable } from "~/sync/types";
import type { IDeployment } from "~/resolver/deployment/types.js";
import type { PluginsContainer } from "@webiny/plugins/types";
import { TransformRecordPlugin } from "~/resolver/plugins/TransformRecordPlugin.js";
import { middleware } from "./middleware.js";
import { IStoreItem } from "../storer/types";

export interface IMiddlewareParams {
    readonly plugins: PluginsContainer;
    readonly record: IStoreItem;
    readonly sourceDeployment: IDeployment;
    readonly targetDeployment: IDeployment;
    readonly sourceTable: ITable;
    readonly targetTable: ITable;
}

export interface ITransformHandlerTransformParams {
    readonly sourceTable: ITable;
    readonly sourceDeployment: IDeployment;
    readonly targetTable: ITable;
    readonly targetDeployment: IDeployment;
    readonly items: IStoreItem[];
}

export interface ITransformHandlerTransformResult {
    items: IStoreItem[];
}

export interface ITransformHandler {
    transform(params: ITransformHandlerTransformParams): Promise<ITransformHandlerTransformResult>;
}

export interface ITransformHandlerParams {
    readonly plugins: PluginsContainer;
}

export class TransformHandler implements ITransformHandler {
    private readonly pluginsContainer: PluginsContainer;
    private readonly plugins: TransformRecordPlugin[];

    public constructor(params: ITransformHandlerParams) {
        this.pluginsContainer = params.plugins;
        this.plugins = params.plugins.byType<TransformRecordPlugin>(TransformRecordPlugin.type);
    }

    public async transform(
        params: ITransformHandlerTransformParams
    ): Promise<ITransformHandlerTransformResult> {
        const { sourceTable, sourceDeployment, targetDeployment, targetTable, items } = params;

        if (this.plugins.length === 0) {
            process.env.DEBUG === "true" &&
                console.log("There are no transform plugins registered in the system.");
            return {
                items
            };
        }

        const plugins = this.plugins.filter(plugin => {
            if (plugin.isForTableType(sourceTable.type) === false) {
                return false;
            }
            return plugin.canTransform({
                from: sourceDeployment,
                to: targetDeployment
            });
        });

        if (plugins.length === 0) {
            process.env.DEBUG === "true" &&
                console.log(
                    "There are no transform plugins registered for the given deployment versions or sourceTable type.",
                    {
                        sourceVersion: sourceDeployment.version.format(),
                        targetVersion: targetDeployment.version.format(),
                        sourceTable
                    }
                );
            return {
                items
            };
        }

        const runner = middleware<IMiddlewareParams, IStoreItem>(
            plugins.map(plugin => {
                return async (params, next) => {
                    return await plugin.transform(params, next);
                };
            })
        );

        const results = await Promise.all(
            items.map(async input => {
                const record = Object.freeze(input);
                return await runner(
                    {
                        plugins: this.pluginsContainer,
                        sourceTable,
                        sourceDeployment,
                        targetDeployment,
                        targetTable,
                        record
                    },
                    record
                );
            })
        );
        return {
            items: results.filter((item): item is IStoreItem => !!item)
        };
    }
}
