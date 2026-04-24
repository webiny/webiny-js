import type { INamespaceHandlerResult } from "@webiny/api-scheduler/features/NamespaceHandler/abstractions.js";

export interface IScheduledActionPayload extends INamespaceHandlerResult {
    modelId: string;
}
