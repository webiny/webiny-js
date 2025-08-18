import type { IPendingOperationsInfoParamsContext } from "./pendingOperationsInfo";
import { pendingOperationsInfo } from "./pendingOperationsInfo";
import { ddbPutItemConditionalCheckFailed } from "./ddbPutItemConditionalCheckFailed";
import { missingFilesInBuild } from "./missingFilesInBuild";

export type Context = IPendingOperationsInfoParamsContext;

export const gracefulPulumiErrorHandlers = [
    ddbPutItemConditionalCheckFailed,
    missingFilesInBuild,
    pendingOperationsInfo
];
