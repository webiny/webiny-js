import type { INamespaceHandlerResult } from "@webiny/api-scheduler/features/NamespaceHandler/abstractions.js";



export type IScheduledActionPayloadType = "page" | "redirect";

export interface IScheduledActionPayload extends INamespaceHandlerResult {
    type: IScheduledActionPayloadType;
}
