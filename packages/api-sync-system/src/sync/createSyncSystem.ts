import type { Plugin } from "@webiny/plugins/types.js";
import type { IGetEventBridgeCallable, ISystem } from "./types.js";
import { validateSystemInput } from "./utils/validateSystemInput.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { PossiblyUndefinedProperties } from "@webiny/api/types";
import { createSyncSystemHandlerOnRequestPlugin } from "./requestPlugin.js";
import type { FilterOutRecordPlugin } from "./plugins/FilterOutRecordPlugin.js";
import { createDefaultFilterOutRecordPlugins } from "./filter/createDefaultFilterOutRecordPlugins.js";

export type IAllowedPlugins = FilterOutRecordPlugin;

export interface ICreateSyncSystemParams {
    getDocumentClient(): Pick<DynamoDBDocument, "send">;
    getEventBridgeClient: IGetEventBridgeCallable;
    system: PossiblyUndefinedProperties<Omit<ISystem, "name">>;
    plugins?: IAllowedPlugins[];
}

export interface ICreateSyncSystemResponse {
    plugins(): Plugin[];
}

const emptyResponse: ICreateSyncSystemResponse = {
    plugins(): Plugin[] {
        return [];
    }
};

export const createSyncSystem = (params: ICreateSyncSystemParams): ICreateSyncSystemResponse => {
    const { system, error } = validateSystemInput(params.system);
    /**
     * We do not want to throw any errors. We will log them and just return a function which returns empty array as plugins.
     */
    if (error) {
        console.error(error);
        return emptyResponse;
    } else if (!system) {
        console.error("Sync System: No system provided. Sync System will not be attached.");
        return emptyResponse;
    }

    return {
        plugins: () => {
            return [
                ...(params.plugins || []),
                ...createDefaultFilterOutRecordPlugins(),
                createSyncSystemHandlerOnRequestPlugin({
                    getDocumentClient: params.getDocumentClient,
                    getEventBridgeClient: params.getEventBridgeClient,
                    system
                })
            ];
        }
    };
};
