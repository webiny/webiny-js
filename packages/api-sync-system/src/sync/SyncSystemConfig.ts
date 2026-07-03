import { createAbstraction } from "@webiny/feature/api";
import type { EventBridgeClient } from "@webiny/aws-sdk/client-eventbridge/index.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { ISystem } from "./types.js";
import type { FilterOutRecordPlugin } from "./plugins/FilterOutRecordPlugin.js";

export interface ISyncSystemConfig {
    getDocumentClient(): Pick<DynamoDBDocument, "send">;
    getEventBridgeClient(): Pick<EventBridgeClient, "send">;
    system: ISystem;
    plugins?: FilterOutRecordPlugin[];
}

export const SyncSystemConfig = createAbstraction<ISyncSystemConfig>("SyncSystemConfig");
