import type { IRecordHandler, IRecordHandlerHandleParams } from "./abstractions/RecordHandler.js";
import { CommandHandlerPlugin } from "../plugins/CommandHandlerPlugin.js";
import { convertException } from "@webiny/utils";
import type { CommandType } from "~/types.js";
import type { PluginsContainer } from "@webiny/plugins";
import type { IFetcher } from "~/resolver/app/fetcher/types.js";
import type { IStoreItem, IStorer } from "~/resolver/app/storer/types.js";
import type { IBundle, IBundler } from "~/resolver/app/bundler/types.js";
import type { IDeployment, IDeployments } from "~/resolver/deployment/types.js";
import type { ITransformHandler } from "~/resolver/app/transform/TransformHandler.js";
import type { ITable } from "~/sync/types.js";
import type { ISourceDataContainer } from "~/resolver/app/data/types.js";

export interface IRecordHandlerParams {
    fetcher: IFetcher;
    storer: IStorer;
    plugins: PluginsContainer;
    commandBundler: IBundler;
    tableBundler: IBundler;
    deployments: IDeployments;
    transformHandler: ITransformHandler;
    createSourceDataContainer: () => ISourceDataContainer;
}

interface IFindTargetTableParams {
    bundle: IBundle;
    targetDeployment: IDeployment;
}

export class RecordHandler implements IRecordHandler {
    private readonly plugins: PluginsContainer;
    private readonly commandHandlerPlugins: CommandHandlerPlugin[];
    private readonly fetcher: IFetcher;
    private readonly storer: IStorer;
    private readonly commandBundler: IBundler;
    private readonly tableBundler: IBundler;
    private readonly deployments: IDeployments;
    private readonly transformHandler: ITransformHandler;
    private readonly createSourceDataContainer: () => ISourceDataContainer;

    public constructor(params: IRecordHandlerParams) {
        this.plugins = params.plugins;
        this.fetcher = params.fetcher;
        this.storer = params.storer;
        this.commandBundler = params.commandBundler;
        this.tableBundler = params.tableBundler;
        this.deployments = params.deployments;
        this.transformHandler = params.transformHandler;
        this.createSourceDataContainer = params.createSourceDataContainer;

        this.commandHandlerPlugins = this.plugins.byType<CommandHandlerPlugin>(
            CommandHandlerPlugin.type
        );
    }

    public async handle(params: IRecordHandlerHandleParams): Promise<void> {
        const { data } = params;

        const sources = this.tableBundler.bundle({
            items: data.getItems()
        });

        const container = this.createSourceDataContainer();

        for (const bundle of sources.getBundles()) {
            /**
             * Need to fetch all the records from the source deployment tables.
             */
            const { items, error } = await this.fetcher.exec({
                deployment: bundle.source,
                table: bundle.table,
                items: bundle.items,
                maxBatchSize: 25
            });
            if (error) {
                console.error(
                    `Could not fetch records from the source table (${bundle.source.name} / ${bundle.table.name}). More info in next log line.`
                );
                console.log(convertException(error));
                continue;
            }
            container.merge(items);
        }
        /**
         * We can now handle the records by going through all the items bundled by command, in correct order.
         */
        const bundlesByCommand = this.commandBundler.bundle({
            items: data.getItems()
        });
        for (const bundle of bundlesByCommand.getBundles()) {
            const deployments = this.deployments.without(bundle.source);
            for (const targetDeployment of deployments.all()) {
                /**
                 * We need to map keys to actual items from the source deployment.
                 */
                const items = bundle.items
                    .map(item => {
                        return container.get({
                            PK: item.PK,
                            SK: item.SK,
                            table: bundle.table,
                            source: bundle.source
                        });
                    })
                    .filter((item): item is IStoreItem => !!item);

                const targetTable = this.findTargetTable({
                    bundle,
                    targetDeployment
                });
                if (!targetTable) {
                    console.error(
                        `Could not find target table for source table "${bundle.table.name}" in deployment "${bundle.source.name}".`
                    );
                    continue;
                }

                const result = await this.transformHandler.transform({
                    items,
                    sourceDeployment: bundle.source,
                    sourceTable: bundle.table,
                    targetDeployment: targetDeployment,
                    targetTable: targetTable
                });

                let commandHandler: CommandHandlerPlugin;
                try {
                    commandHandler = this.getCommandHandler(bundle.command);
                } catch (ex) {
                    console.error(ex.message);
                    continue;
                }

                await commandHandler.handle({
                    storer: this.storer,
                    items: result.items,
                    bundle,
                    targetDeployment: targetDeployment,
                    targetTable: targetTable
                });
            }
        }
    }

    private findTargetTable(params: IFindTargetTableParams): ITable | null {
        const { bundle, targetDeployment } = params;

        try {
            return targetDeployment.getTable(bundle.table.type);
        } catch {
            return null;
        }
    }

    private getCommandHandler(command: CommandType): CommandHandlerPlugin {
        const handler = this.commandHandlerPlugins.find(plugin => plugin.canHandle(command));
        if (!handler) {
            throw new Error(`Could not find a command handler for command: ${command}`);
        }

        return handler;
    }
}

export const createRecordHandler = (params: IRecordHandlerParams): IRecordHandler => {
    return new RecordHandler(params);
};
