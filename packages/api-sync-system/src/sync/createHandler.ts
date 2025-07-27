import { createHandlerConverter } from "~/sync/handler/HandlerConverter.js";
import { NullCommandValue } from "~/sync/handler/converter/commands/NullCommandValue.js";
import { createBatchWriteCommandConverter } from "~/sync/handler/converter/BatchWriteCommandConverter.js";
import { createPutCommandConverter } from "~/sync/handler/converter/PutCommandConverter.js";
import { createDeleteCommandConverter } from "~/sync/handler/converter/DeleteCommandConverter.js";
import { createUpdateCommandConverter } from "~/sync/handler/converter/UpdateCommandConverter.js";
import { createSyncHandler } from "~/sync/handler/Handler.js";
import type { EventBridgeClient } from "@webiny/aws-sdk/client-eventbridge/index.js";
import type { ICommandConverter, IManifest, ISystem } from "./types.js";
import { createBatchGetCommandConverter } from "./handler/converter/BatchGetCommandConverter.js";
import { createQueryCommandConverter } from "./handler/converter/QueryCommandConverter.js";
import { createScanCommandConverter } from "~/sync/handler/converter/ScanCommandConverter.js";
import { createGetCommandConverter } from "./handler/converter/GetCommandConverter.js";
import type { PluginsContainer } from "@webiny/plugins/PluginsContainer.js";
import { FilterOutRecordPlugin } from "~/sync/plugins/FilterOutRecordPlugin.js";
import { createFilterOutRecord } from "~/sync/FilterOutRecord.js";

export interface ICreateHandlerParams {
    getEventBridgeClient(): Pick<EventBridgeClient, "send">;
    commandConverters?: ICommandConverter[];
    system: ISystem;
    manifest: IManifest;
    getPlugins: () => PluginsContainer;
}

export const createHandler = (params: ICreateHandlerParams) => {
    const { manifest, commandConverters, system, getEventBridgeClient, getPlugins } = params;

    const filterOutRecordPlugins = getPlugins().byType<FilterOutRecordPlugin>(
        FilterOutRecordPlugin.type
    );

    const filterOutRecord = createFilterOutRecord(filterOutRecordPlugins);

    const converter = createHandlerConverter({
        defaultValue: new NullCommandValue()
    });
    /**
     * We register users command converters because those are tested out first.
     * Our converters are in some order I got from my head - the most used commands are first.
     */
    converter.register(commandConverters || []);
    converter.register(createBatchGetCommandConverter());
    converter.register(createGetCommandConverter());
    converter.register(createQueryCommandConverter());
    converter.register(createScanCommandConverter());
    converter.register(createBatchWriteCommandConverter());
    converter.register(createPutCommandConverter());
    converter.register(createDeleteCommandConverter());
    converter.register(createUpdateCommandConverter());

    const handler = createSyncHandler({
        system,
        getEventBridgeClient,
        eventBus: {
            arn: manifest.sync.eventBusArn,
            name: manifest.sync.eventBusName
        },
        converter,
        filterOutRecord
    });
    return {
        handler,
        converter
    };
};
